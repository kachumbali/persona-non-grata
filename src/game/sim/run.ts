/**
 * Play one whole chapter with a bot through the real store and rules.
 * No React, no DOM, no Math.random: the same options always give the same RunResult.
 */
import { eligible } from "../character";
import { activeChapterId, setActiveChapter } from "../chapters";
import {
  blocks,
  computeStats,
  dailyEvents,
  emails,
  lastDay,
  missionTasks,
  startMeters,
  visitReady,
} from "../rules";
import { nextStep, stepContext, stepStatus, stepsOf } from "../mission";
import type { Meters } from "../rules";
import { useGame } from "../store";
import { botById, type Bot, type BotId } from "./bots";
import { Player, createTracker } from "./player";
import { createRng, hashString } from "./rng";

export const DEFAULT_CHAPTER = "port-hesperia-2006";
/** The store ships with a fixed game seed; sim seed 1 plays exactly that game. */
export const SHIPPED_GAME_SEED = 23;
export const gameSeedFor = (seed: number): number =>
  seed <= 1 ? SHIPPED_GAME_SEED : SHIPPED_GAME_SEED + (seed - 1) * 7;

export interface SimOptions {
  chapterId?: string;
  bot: BotId | Bot;
  /** The character's trait ids (validate with validBuild). */
  traits: string[];
  /** A label for the trait build, for reports. */
  build?: string;
  /** Varies the bot's decisions, and the game seed (seed 1 is the shipped game's seed). */
  seed: number;
  /** Overrides the bot's default chance of choosing a trait-gated option. */
  traitBias?: number;
}

export interface RunResult {
  chapterId: string;
  bot: string;
  build: string;
  traits: string[];
  seed: number;
  gameSeed: number;
  ending: string | null;
  /** True when the run ended before the final day (a meter hit zero). */
  endedEarly: boolean;
  day: number;
  turns: number;
  meters: Meters;
  lowestMeters: Meters;
  funds: number;
  lowestFunds: number;
  /** Lowest funds above the ring-fenced visit reserves. */
  lowestAvailable: number;
  missionConfirmed: string[];
  missionTotal: number;
  /** The day the mission was last completed (every task confirmed); null if it was not. */
  missionCompleteDay: number | null;
  /** Mission steps done and the total number of steps. */
  stepsDone: number;
  stepsTotal: number;
  /** Times the store refused a mission step for lack of funds. */
  missionMoneyRefusals: number;
  /** Blocks with nothing waiting and no mission step that could be done either. */
  idleBlocksNoStep: number;
  score: number;
  /** Trait-tagged choices taken, by trait (a choice that failed or was recalled is not counted). */
  traitChoices: Record<string, number>;
  /** Trait-gated options that were on screen, by trait. */
  traitOffers: Record<string, number>;
  /** Ids of content the bot was shown: event:, topic:, email:, invitation:, press:, choice:. */
  seen: string[];
  /** Ids of choices and topics the bot actually took. */
  taken: string[];
  /** Blocks in which no authored prompt (mail, episode, invitation, lead here) was waiting. */
  idleBlocks: number;
  /** Idle blocks by day: index 1 is Day 1 (index 0 is unused). */
  idleByDay: number[];
  /** Blocks in which the bot queued nothing at all. */
  emptyPlans: number;
  /** Days with at least one block where two or more time-bound things competed. */
  conflictDays: number;
  conflictBlocks: number;
  /** Like conflictDays, but ordinary mail arriving in the block also counts as time-bound. */
  conflictDaysWithMail: number;
  blocksPlayed: number;
  /** Refusals from the store, by message. */
  planErrors: Record<string, number>;
  /** Times advance() refused a plan (should be zero). */
  stalls: number;
  workStalled: number;
  dutiesDisplaced: number;
}

const zeroMeters = (): Meters => ({ confidence: 100, goodwill: 100, morale: 100, sanity: 100 });

export function simulate(options: SimOptions): RunResult {
  const previousChapter = activeChapterId();
  const chapterId = options.chapterId ?? DEFAULT_CHAPTER;
  setActiveChapter(chapterId);
  try {
    return play(options, chapterId);
  } finally {
    setActiveChapter(previousChapter);
  }
}

function play(options: SimOptions, chapterId: string): RunResult {
  const bot = typeof options.bot === "string" ? botById(options.bot) : options.bot;
  const rng = createRng(hashString(`${options.seed}|${bot.id}|${options.traits.join(",")}`));
  const tracker = createTracker();
  const player = new Player(
    rng,
    { traitBias: options.traitBias ?? bot.traitBias, overload: bot.overload },
    tracker,
  );
  const gameSeed = gameSeedFor(options.seed);
  const game = useGame.getState();
  game.reset();
  game.start({
    title: "Mx",
    name: `Bot ${bot.id}`,
    portrait: "diplomat-1",
    bio: "",
    traits: [...options.traits],
  });
  // The seed is plain store state; changing it varies the daily episode order and the press.
  useGame.setState({ seed: gameSeed, events: dailyEvents(1, gameSeed, [], {}) });

  const days = lastDay();
  const maxTurns = days * blocks().length + 8;
  const conflictDays = new Set<number>();
  const conflictDaysWithMail = new Set<number>();
  const idleByDay: number[] = Array.from({ length: days + 1 }, () => 0);
  let conflictBlocks = 0,
    idleBlocks = 0,
    idleBlocksNoStep = 0,
    missionCompleteDay: number | null = null,
    emptyPlans = 0,
    blocksPlayed = 0,
    stalls = 0;
  let lowestFunds = useGame.getState().economy.funds;
  let lowestAvailable = lowestFunds - useGame.getState().economy.ringFence;
  const lowestMeters = zeroMeters();
  const startedWith = startMeters();
  for (const key of Object.keys(lowestMeters) as (keyof Meters)[])
    lowestMeters[key] = startedWith[key];

  for (let turn = 0; turn < maxTurns; turn++) {
    let s = useGame.getState();
    if (s.ending) break;
    // The press review is prepared when the morning screen opens.
    if (s.block === 0) s.preparePress();
    observe();
    bot.plan(player);
    s = useGame.getState();
    // Raiding the reserves can end the posting before the block does.
    if (s.ending) break;
    if (s.pending.length === 0) emptyPlans++;
    const before = s.turn;
    const dayBefore = s.day;
    useGame.getState().advance();
    s = useGame.getState();
    if (visitReady(s.visit)) missionCompleteDay = missionCompleteDay ?? dayBefore;
    else missionCompleteDay = null;
    if (s.turn === before && !s.ending) {
      stalls++;
      tracker.planErrors[`advance refused: ${s.planError}`] =
        (tracker.planErrors[`advance refused: ${s.planError}`] ?? 0) + 1;
      for (const p of [...s.pending]) useGame.getState().removeDecision(p.id);
      useGame.getState().advance();
      if (useGame.getState().turn === before && !useGame.getState().ending)
        throw new Error(
          `Turn did not advance (${bot.id}, ${options.traits.join("+")}, seed ${options.seed}, day ${s.day} block ${s.block}): ${useGame.getState().planError}`,
        );
    }
    blocksPlayed++;
    s = useGame.getState();
    lowestFunds = Math.min(lowestFunds, s.economy.funds);
    lowestAvailable = Math.min(lowestAvailable, s.economy.funds - s.economy.ringFence);
    for (const key of Object.keys(lowestMeters) as (keyof Meters)[])
      lowestMeters[key] = Math.min(lowestMeters[key], s.meters[key]);
  }

  /** What the screens would put in front of a person at the start of the block. */
  function observe() {
    const s = useGame.getState();
    const start = blocks()[s.block]?.time ?? 0;
    const end = blocks()[s.block + 1]?.time ?? 24 * 60;
    const arrives = (e: { day: number; time: number }) =>
      e.day === s.day && e.time >= start && e.time < end;
    const due = player.invitationsDue();
    const event = player.currentEvent();
    if (event) {
      // The call or fax pops up by itself, so every bot sees it and its eligible choices.
      player.see(`event:${event.id}`);
      for (const c of event.choices)
        if (eligible(c, player.traits, computeStats(player.traits)))
          player.see(`choice:event:${event.id}:${c.id}`);
    }
    const mail = emails().filter((e) => arrives(e) && !s.handled[e.id]);
    const missionMail = mail.filter((e) => Object.values(e.options).some((o) => o?.confirmsStep));
    const expiring = player.leads().filter((lead) => lead.expiresDay === s.day);
    const competing = due.length + (event ? 1 : 0) + missionMail.length + expiring.length;
    if (competing - missionMail.length + mail.length >= 2) conflictDaysWithMail.add(s.day);
    if (competing >= 2) {
      conflictDays.add(s.day);
      conflictBlocks++;
    }
    const answerable = player.openMail().filter(arrives);
    if (!due.length && !event && !answerable.length && !player.leadsHere().length) {
      idleBlocks++;
      idleByDay[s.day] = (idleByDay[s.day] ?? 0) + 1;
      const stepWaiting = Object.keys(missionTasks()).some((task) => {
        const step = nextStep(s.missionSteps, task);
        return !!step && stepStatus(stepContext(s), task, step.id).state === "available";
      });
      if (!stepWaiting) idleBlocksNoStep++;
    }
  }

  const s = useGame.getState();
  const traitChoices: Record<string, number> = {};
  for (const flag of s.storyFlags) {
    const m = /^trait:([^:]+):/.exec(flag);
    if (m) traitChoices[m[1]!] = (traitChoices[m[1]!] ?? 0) + 1;
  }
  return {
    chapterId,
    bot: bot.id,
    build: options.build ?? options.traits.join("+"),
    traits: [...options.traits],
    seed: options.seed,
    gameSeed,
    ending: s.ending,
    endedEarly: s.day < days,
    day: s.day,
    turns: s.turn,
    meters: { ...s.meters },
    lowestMeters,
    funds: s.economy.funds,
    lowestFunds,
    lowestAvailable,
    missionConfirmed: Object.entries(s.visit)
      .filter(([, done]) => done)
      .map(([task]) => task),
    missionTotal: Object.keys(missionTasks()).length,
    missionCompleteDay,
    stepsDone: Object.values(s.missionSteps).reduce((n, ids) => n + ids.length, 0),
    stepsTotal: Object.keys(missionTasks()).reduce((n, t) => n + stepsOf(t).length, 0),
    missionMoneyRefusals: Object.entries(tracker.planErrors)
      .filter(([text]) => text.includes("mission step"))
      .reduce((n, [, count]) => n + count, 0),
    idleBlocksNoStep,
    score: s.score,
    traitChoices,
    traitOffers: { ...tracker.traitOffers },
    seen: [...tracker.seen].sort(),
    taken: [...tracker.taken].sort(),
    idleBlocks,
    idleByDay,
    emptyPlans,
    conflictDays: conflictDays.size,
    conflictBlocks,
    conflictDaysWithMail: conflictDaysWithMail.size,
    blocksPlayed,
    planErrors: { ...tracker.planErrors },
    stalls,
    workStalled: s.log.filter((l) => l.text.includes("work stalled")).length,
    dutiesDisplaced: s.log.filter((l) => l.text.includes("routine duties displaced")).length,
  };
}

export interface MatrixOptions {
  chapterId?: string;
  bots: (BotId | Bot)[];
  builds: { id: string; traits: string[] }[];
  /** Seeds 1..seeds. */
  seeds: number;
  traitBias?: number;
  onRun?: (result: RunResult) => void;
}

/** Every bot x build x seed, in a fixed order. */
export function runMatrix(options: MatrixOptions): RunResult[] {
  const results: RunResult[] = [];
  for (const bot of options.bots)
    for (const build of options.builds)
      for (let seed = 1; seed <= options.seeds; seed++) {
        const result = simulate({
          ...(options.chapterId ? { chapterId: options.chapterId } : {}),
          bot,
          traits: build.traits,
          build: build.id,
          seed,
          ...(options.traitBias !== undefined ? { traitBias: options.traitBias } : {}),
        });
        results.push(result);
        options.onRun?.(result);
      }
  return results;
}
