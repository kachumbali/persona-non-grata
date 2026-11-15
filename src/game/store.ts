import { pressReview, clippings } from "./press";
import {
  demarcheAt,
  demarches as chapterDemarches,
  migrateDemarches,
  planDemarche,
  resolveDemarche,
  statusOf as demarcheStatus,
  tick as demarcheTick,
  type DemarcheProgress,
} from "./demarche";
import {
  accidentalReplyAll,
  charmGain,
  eligible,
  formalBonus,
  missedEffects,
  overnightRecovery,
  socialBonus,
} from "./character";
import { create } from "zustand";
import { activeChapter, activeChapterId, DEFAULT_CHAPTER_ID } from "./chapters";
import { dueInvitations } from "./calendar";
import {
  applySetbacks,
  emptyProgress,
  findStep,
  inPersonBlock,
  missionReserve,
  nextStep,
  parseStepRef,
  progressFromVisit,
  routeContext,
  routeFavourToSpend,
  routeStatus,
  setbacksBefore,
  stepCash,
  stepContext,
  stepDone,
  stepLabel,
  stepStatus,
  stepsOf,
  taskComplete,
  taskQuality,
  type MissionProgress,
} from "./mission";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  absTime,
  applyEffects,
  blocks,
  campaign,
  clamp,
  computeStats,
  dailyEvents,
  delegationSucceeds,
  emails,
  expiredStories,
  initialColleagues,
  lastDay,
  pairKey,
  pickEnding,
  recordGoodwillChange,
  startMeters,
  visitReady,
  type Effects,
  type Action,
  type ColleagueState,
  type Ending,
  type GoodwillChange,
  type Meters,
  type PendingDecision,
  type Relationships,
  type StoryEvent,
  type StoryOutcome,
  type VisitStatus,
} from "./rules";

import {
  capacityLedger,
  decisionCash,
  initialEconomy,
  lateFuel,
  money,
  playerCapacity,
  playerTime,
  reserveRelease,
  startRingFence,
  supplement,
  validatePlan,
  type Economy,
} from "./economy";

export interface Character {
  title: string;
  name: string;
  portrait: string;
  bio: string;
  traits: string[];
}
export interface LogEntry {
  day: number;
  time: number;
  text: string;
}
export interface GameState {
  /** Which chapter pack this save belongs to. */
  chapterId: string;
  character: Character | null;
  day: number;
  minute: number;
  block: number;
  meters: Meters;
  handled: Record<string, string>;
  log: LogEntry[];
  goodwillHistory: GoodwillChange[];
  visit: VisitStatus;
  /** Ids of the mission steps done, by task. `visit[task]` is true when all of a task's are. */
  missionSteps: MissionProgress;
  demarches: DemarcheProgress;
  unrequestedDemarches: number;
  favours: { owedToYou: Record<string, number>; youOwe: Record<string, number> };
  knownFacts: string[];
  stepQualities: Record<string, Record<string, "good" | "adequate">>;
  taskQualities: Record<string, "good" | "adequate">;
  usedRoutes: Record<string, string>;
  spentRoutes: Record<string, string[]>;
  routeDeliveries: Record<string, { route: string; dueDay: number }>;
  favourCalls: { character: string; dueDay: number }[];
  routeHistory: { task: string; step: string; route: string; kind: string }[];
  routeChanges: number;
  delayedRouteEffects: { dueDay: number; flag?: string; trust?: Record<string, number> }[];
  /** Ids of the setbacks that have already landed. */
  setbacksApplied: string[];
  ending: Ending | null;
  location: string;
  room: string;
  selectedNpc: string | null;
  colleagues: Record<string, ColleagueState>;
  relationships: Relationships;
  pending: PendingDecision[];
  report: LogEntry[];
  score: number;
  energy: number;
  composure: number;
  alcohol: number;
  hangover: boolean;
  economy: Economy;
  turn: number;
  planError: string;
  yesterday: Record<number, PendingDecision[]>;
  todayPlans: Record<number, PendingDecision[]>;
  repeatYesterday: () => void;
  requestSupplement: () => void;
  raidReserve: () => void;
  seed: number;
  events: StoryEvent[];
  completedEvents: string[];
  storyFlags: string[];
  pressSeen: string[];
  pressDay: number;
  pressIds: string[];
  pressCompiler: "press" | "maxim";
  pressRead: boolean;
  pressDismissedDay: number;
  dismissPress: () => void;
  pressClippedDay: number;
  preparePress: () => void;
  readPress: () => void;
  clipPress: (id: string) => void;
  storyOutcomes: Record<string, StoryOutcome>;
  start: (c: Character) => void;
  reset: () => void;
  move: (location: string) => boolean;
  moveRoom: (room: string) => void;
  selectNpc: (id: string | null) => void;
  queue: (decision: PendingDecision, replacePlayer?: boolean) => boolean;
  removeDecision: (id: string) => void;
  answer: (id: string, action: Action) => void;
  recall: (id: string) => void;
  advance: () => void;
}
const seed = 23;
export type SavedGame = Omit<
  GameState,
  | "dismissPress"
  | "preparePress"
  | "readPress"
  | "clipPress"
  | "start"
  | "reset"
  | "move"
  | "moveRoom"
  | "selectNpc"
  | "queue"
  | "removeDecision"
  | "answer"
  | "recall"
  | "advance"
  | "repeatYesterday"
  | "requestSupplement"
  | "raidReserve"
>;
const initialState = () => {
  const m = activeChapter().manifest;
  return {
    chapterId: activeChapterId(),
    hangover: false,
    economy: initialEconomy(),
    turn: 0,
    planError: "",
    yesterday: {},
    todayPlans: {},
    character: null,
    day: 1,
    minute: m.blocks[0].time,
    block: 0,
    meters: startMeters(),
    handled: {},
    log: [],
    goodwillHistory: [],
    visit: {},
    missionSteps: emptyProgress(),
    demarches: {} as DemarcheProgress,
    unrequestedDemarches: 0,
    favours: { owedToYou: {}, youOwe: {} },
    knownFacts: [] as string[],
    stepQualities: {} as Record<string, Record<string, "good" | "adequate">>,
    taskQualities: {} as Record<string, "good" | "adequate">,
    usedRoutes: {} as Record<string, string>,
    spentRoutes: {} as Record<string, string[]>,
    routeDeliveries: {} as Record<string, { route: string; dueDay: number }>,
    favourCalls: [] as { character: string; dueDay: number }[],
    routeHistory: [] as { task: string; step: string; route: string; kind: string }[],
    routeChanges: 0,
    delayedRouteEffects: [] as { dueDay: number; flag?: string; trust?: Record<string, number> }[],
    setbacksApplied: [] as string[],
    ending: null,
    location: m.startLocation,
    room: m.startRoom,
    selectedNpc: null,
    colleagues: initialColleagues(),
    relationships: Object.fromEntries(
      m.startRelationships.map((r) => [pairKey(r.a, r.b), r.value]),
    ) as Relationships,
    pending: [],
    report: [],
    score: 0,
    energy: m.startEnergy,
    composure: m.startComposure,
    alcohol: 0,
    seed,
    events: dailyEvents(1, seed, []),
    completedEvents: [],
    storyFlags: [],
    pressSeen: [],
    pressDay: 0,
    pressIds: [],
    pressCompiler: "press" as const,
    pressRead: false,
    pressDismissedDay: 0,
    pressClippedDay: 0,
    storyOutcomes: {},
  };
};
/** Diplo-Points spent on every trip across town. */
export const TRAVEL_DP = 1;

/**
 * A decision that works on a mission task must name a step that can be done now. A decision that
 * names only the task works on its next step. Returns the decision with the step and its cash
 * filled in, or the reason it cannot be queued.
 */
export function resolveStep(s: GameState, decision: PendingDecision): PendingDecision | string {
  if (!decision.task) return decision;
  const step = decision.step
    ? findStep(decision.task, decision.step)
    : nextStep(s.missionSteps, decision.task);
  if (!step) return decision.step ? `${decision.task}: no such mission step.` : decision;
  const label = stepLabel(step, decision.task, s.setbacksApplied);
  const status = stepStatus(stepContext(s), decision.task, step.id);
  if (status.state === "done") {
    // A mail can still be answered once its step is done by other means; it just confirms nothing.
    if (decision.kind !== "email") return `${label} is already done.`;
    const { task: _task, step: _step, ...rest } = decision;
    return rest;
  }
  if (status.state === "blocked") return `Not yet: ${label} (${status.reason}).`;
  if (step.routes) {
    if (decision.kind === "email" && !decision.route) {
      const { task: _task, step: _step, ...rest } = decision;
      return rest;
    }
    const key = `${decision.task}.${step.id}`;
    if (s.routeDeliveries[key]) return `${label}: confirmation is already on its way.`;
    const route = step.routes.find((r) => r.id === decision.route);
    if (!route) return `${label}: choose a route.`;
    const available = routeStatus(route, routeContext(s, decision.task, step.id));
    if (available.state !== "available")
      return `${label}: ${available.state === "blocked" ? available.reason : available.state}.`;
    if (decision.worker) return `${label}: choose a route in person.`;
    const cash = route.cash + (decision.cashCost ?? 0);
    return {
      ...decision,
      step: step.id,
      route: route.id,
      timeCost: route.dp,
      cashCost: cash,
      stepCost: route.fromGeneralFunds ? 0 : route.cash,
    };
  }
  const inPerson =
    decision.kind === "work" ? !decision.worker : decision.emailAction !== "delegate";
  const trustBlock = inPerson ? inPersonBlock(step, s.colleagues) : null;
  if (trustBlock) return `${label}: in person it ${trustBlock}. Send a colleague with the skill.`;
  const stepCost = stepCash(step, decision.task, s.setbacksApplied);
  const base = decision.cashCost ?? Math.max(0, -(decision.effects.budget ?? 0) * 100);
  return { ...decision, step: step.id, stepCost, cashCost: base + stepCost };
}

export const useGame = create<GameState>()(
  persist<GameState, [], [], SavedGame>(
    (set, get) => ({
      ...initialState(),
      dismissPress: () => set((s) => ({ pressDismissedDay: s.day })),
      preparePress: () => {
        const s = get();
        if (s.block !== 0 || s.pressDay === s.day) return;
        const review = pressReview(s, s.day);
        set({
          pressDay: s.day,
          pressIds: review.clippings.map((c) => c.id),
          pressCompiler: review.compiler,
          pressRead: false,
        });
      },
      readPress: () => {
        const s = get();
        if (s.block !== 0 || s.pressDay !== s.day) return;
        const flags = [...s.storyFlags];
        for (const id of s.pressIds) {
          const flag = clippings().find((c) => c.id === id)?.flagOnRead;
          if (flag && !flags.includes(flag)) flags.push(flag);
        }
        if (
          s.day >= 4 &&
          s.pressIds.some((id) => clippings().find((c) => c.id === id)?.signal) &&
          !flags.includes("fuel-lead")
        )
          flags.push("fuel-lead");
        set({
          pressRead: true,
          knownFacts: [
            ...new Set([
              ...s.knownFacts,
              ...s.pressIds.flatMap((id) => {
                const fact = clippings().find((c) => c.id === id)?.teaches;
                return fact ? [fact] : [];
              }),
            ]),
          ],
          pressSeen: [...new Set([...s.pressSeen, ...s.pressIds])],
          storyFlags: flags,
        });
      },
      clipPress: (id) => {
        const s = get();
        if (
          s.block !== 0 ||
          s.pressDay !== s.day ||
          s.pressClippedDay === s.day ||
          !s.pressIds.includes(id)
        )
          return;
        const clipping = clippings().find((c) => c.id === id);
        if (!clipping) return;
        const useful = clipping.signal || clipping.capital;
        const text = useful
          ? `Capital receives: ${clipping.headline}.`
          : "Capital asks you to stop forwarding the horoscope.";
        const meters = applyEffects(s.meters, { confidence: useful ? 2 : -1 });
        const entry = { day: s.day, time: s.minute, text };
        set({
          meters,
          pressClippedDay: s.day,
          goodwillHistory: [
            ...s.goodwillHistory,
            recordGoodwillChange(s.meters, meters, {
              ...entry,
              source: "Press review",
              kind: "Outcome",
            }),
          ],
          log: [...s.log, entry],
          report: [...s.report, entry],
        });
      },
      start: (character) =>
        set({
          ...initialState(),
          character,
          log: [
            {
              day: 1,
              time: activeChapter().manifest.blocks[0].time,
              text: activeChapter().manifest.openingLog,
            },
          ],
        }),
      reset: () => set({ ...initialState() }),
      move: (location) => {
        const s = get();
        const place = campaign().locations.find((l) => l.id === location);
        if (s.ending || !place || location === s.location) return false;
        if (s.pending.some((p) => p.location && !p.id.startsWith("travel-") && playerTime(p) > 0)) {
          set({
            planError: "You have an appointment here this block. Cancel it before travelling.",
          });
          return false;
        }
        const ok = get().queue({
          id: `travel-${s.pending.length}-${location}`,
          kind: "work",
          timeCost: TRAVEL_DP,
          source: `Travel to ${place.name}`,
          text: `You travelled to ${place.name}.`,
          effects: {},
          energy: -3,
          location,
        });
        if (ok) set({ location, selectedNpc: null });
        return ok;
      },
      moveRoom: (room) => set({ room }),
      selectNpc: (selectedNpc) => set({ selectedNpc }),
      queue: (requested, replacePlayer = false) => {
        const s = get();
        if (!s.character || s.ending) return false;
        const stepped = resolveStep(s, requested);
        if (typeof stepped === "string") {
          set({ planError: stepped });
          return false;
        }
        let decision = stepped;
        if (replacePlayer && s.pending.some((p) => p.remainingBlocks === 1)) {
          set({
            planError: "A commitment is already in progress; finish it before replacing the plan.",
          });
          return false;
        }
        const old = s.pending.filter(
          (p) =>
            !(decision.kind === "social" && p.kind === "social") &&
            !(replacePlayer && playerTime(p) > 0 && !p.id.startsWith("travel-")),
        );
        const prepared = planDemarche({ ...s, pending: old }, decision);
        if (typeof prepared === "string") {
          set({ planError: prepared });
          return false;
        }
        decision = prepared;
        if (
          decision.route &&
          old.some((p) => p.task === decision.task && p.step === decision.step && p.route)
        ) {
          set({ planError: "A route for this step is already in the plan." });
          return false;
        }
        if (decision.route && decision.task && decision.step) {
          const route = findStep(decision.task, decision.step)?.routes?.find(
            (r) => r.id === decision.route,
          );
          const who =
            route && routeFavourToSpend(route, routeContext(s, decision.task, decision.step));
          const reserved = who
            ? old.filter(
                (p) =>
                  p.task &&
                  p.step &&
                  p.route &&
                  (() => {
                    const other = findStep(p.task!, p.step!)?.routes?.find((r) => r.id === p.route);
                    return (
                      other && routeFavourToSpend(other, routeContext(s, p.task!, p.step!)) === who
                    );
                  })(),
              ).length
            : 0;
          if (who && reserved >= (s.favours.owedToYou[who] ?? 0)) {
            set({ planError: "That favour is already promised to another route." });
            return false;
          }
          const newFlag = route?.consequences?.flag;
          const conflicts = old.some((p) => {
            const other =
              p.task && p.step && p.route
                ? findStep(p.task, p.step)?.routes?.find((r) => r.id === p.route)
                : undefined;
            return (
              (route?.requires?.expiresOnFlag &&
                [p.flag, other?.consequences?.flag].includes(route.requires.expiresOnFlag)) ||
              route?.requires?.expiresOnFlags?.some((flag) =>
                [p.flag, other?.consequences?.flag].includes(flag),
              ) ||
              (newFlag &&
                (other?.requires?.expiresOnFlag === newFlag ||
                  other?.requires?.expiresOnFlags?.includes(newFlag)))
            );
          });
          if (conflicts) {
            set({ planError: "Those routes make conflicting commitments. Choose one." });
            return false;
          }
        }
        const plan = [...old, decision];
        const error =
          decision.special === "supplement" && s.economy.supplementUsed
            ? "Capital has already granted your supplement."
            : validatePlan(
                plan,
                s.block,
                s.economy,
                playerCapacity(s.character, s.energy, s.composure, s.alcohol, s.hangover).total,
              );
        if (error) {
          set({ planError: error });
          return false;
        }
        set({ pending: plan, planError: "" });
        return true;
      },
      repeatYesterday: () => {
        const s = get();
        if (!s.character || s.ending) return;
        const plan = s.yesterday[s.block];
        if (!plan) return;
        const error = s.pending.some((p) => p.remainingBlocks === 1)
          ? "Finish your commitment before replacing the plan."
          : plan.some(
                (p) =>
                  p.emailId ||
                  p.demarcheId ||
                  p.eventId ||
                  p.special ||
                  (p.task &&
                    (p.step ? stepDone(s.missionSteps, p.task, p.step) : s.visit[p.task])) ||
                  p.remainingBlocks,
              )
            ? "Yesterday's plan contains completed or one-off commitments. Plan those again individually."
            : validatePlan(
                plan,
                s.block,
                s.economy,
                playerCapacity(s.character, s.energy, s.composure, s.alcohol, s.hangover).total,
              );
        if (error) {
          set({ planError: error });
          return;
        }
        set({ pending: structuredClone(plan), planError: "" });
      },
      requestSupplement: () => {
        const grant = supplement();
        get().queue({
          id: "supplement",
          source: "Capital supplement paperwork",
          text: `Capital approves ${money(grant.amount)}; funds arrive after ${grant.delay === 2 ? "two" : grant.delay} further blocks. HQ goodwill −${grant.goodwillCost}.`,
          kind: "work",
          timeCost: 1,
          special: "supplement",
          effects: { confidence: -grant.goodwillCost },
        });
      },
      raidReserve: () => {
        const s = get();
        const release = reserveRelease();
        if (!s.character || s.ending || s.economy.ringFence < release.amount) return;
        const meters = applyEffects(s.meters, { confidence: -release.goodwillCost });
        const text = `Released ${money(release.amount)} from visit reserves. Arrival procurement is underfunded; HQ goodwill −${release.goodwillCost}.`;
        set({
          economy: { ...s.economy, ringFence: s.economy.ringFence - release.amount },
          meters,
          ending: pickEnding(meters, false, s.visit),
          goodwillHistory: [
            ...s.goodwillHistory,
            recordGoodwillChange(s.meters, meters, {
              day: s.day,
              time: s.minute,
              source: "Visit reserve release",
              text,
              kind: "Decision",
            }),
          ],
          log: [...s.log, { day: s.day, time: s.minute, text }],
        });
      },
      removeDecision: (id) =>
        set((s) =>
          id.startsWith("travel-")
            ? { planError: "The journey has already been made." }
            : s.pending.some((p) => p.id === id && p.remainingBlocks === 1)
              ? { planError: "This commitment is already in progress." }
              : { pending: s.pending.filter((p) => p.id !== id), planError: "" },
        ),
      answer: (id, action) => {
        const s = get();
        const e = emails().find((x) => x.id === id);
        const o = e?.options[action];
        const cutoff = blocks()[s.block + 1]?.time ?? 24 * 60;
        if (
          !e ||
          !o ||
          (e.issuedBlock !== undefined && e.day === s.day && s.block < e.issuedBlock) ||
          !s.character ||
          !eligible(o, s.character.traits, computeStats(s.character.traits)) ||
          s.handled[id] ||
          absTime(s.day, cutoff - 1) < absTime(e.day, e.time)
        )
          return;
        const accident =
          action === "reply" &&
          s.character.traits.includes("replyall") &&
          accidentalReplyAll(s.seed, s.day, id);
        const actual = accident
          ? (e.options.replyall ?? {
              text: "Your reply reaches the entire distribution list. Capital requests an explanation of the subject line.",
              effects: { confidence: -2, sanity: -1 },
            })
          : o;
        const confirmed = parseStepRef(actual.confirmsStep);
        get().queue({
          id: `email-${id}`,
          kind: "email",
          source: e.subject,
          text: accident ? `${actual.text} (Reply-All Reflex: accidental reply all.)` : actual.text,
          effects: actual.effects,
          task: confirmed?.task,
          step: confirmed?.step,
          formal: actual.formal,
          favour: actual.favour,
          teaches: actual.teaches,
          traitChoice: actual.requiresTrait,
          emailId: id,
          emailAction: accident ? "replyall" : action,
          recall: accident ? o : undefined,
        });
      },
      recall: (id) => {
        const s = get();
        const item = s.pending.find((p) => p.emailId === id && p.recall);
        if (!item?.recall) return;
        const original = item.recall;
        const confirmed = parseStepRef(original.confirmsStep);
        const restored = resolveStep(s, {
          ...item,
          text: `${original.text} (Accidental reply recalled.)`,
          effects: original.effects,
          task: confirmed?.task,
          step: confirmed?.step,
          stepCost: undefined,
          cashCost: undefined,
          formal: original.formal,
          favour: original.favour,
          teaches: original.teaches,
          traitChoice: original.requiresTrait,
          emailAction: "reply" as const,
          recall: undefined,
          timeCost: 2,
        });
        if (typeof restored === "string") {
          set({ planError: restored });
          return;
        }
        const plan = s.pending.map((p) => (p === item ? restored : p));
        const error = validatePlan(
          plan,
          s.block,
          s.economy,
          playerCapacity(s.character, s.energy, s.composure, s.alcohol, s.hangover).total,
        );
        if (error) {
          set({ planError: error });
          return;
        }
        set({ pending: plan, planError: "" });
      },
      advance: () => {
        const s = get();
        if (!s.character || s.ending) return;
        const invalid = validatePlan(
          s.pending,
          s.block,
          s.economy,
          playerCapacity(s.character, s.energy, s.composure, s.alcohol, s.hangover).total,
        );
        if (invalid) {
          set({ planError: invalid });
          return;
        }
        const economy = { ...s.economy };
        const missionSteps: MissionProgress = Object.fromEntries(
          Object.entries(s.missionSteps).map(([task, ids]) => [task, [...ids]]),
        );
        let setbacksApplied = [...s.setbacksApplied];
        const stats = computeStats(s.character.traits);
        let hangover = s.block === 0 ? false : s.hangover;
        const visit = { ...s.visit };
        let meters = { ...s.meters },
          score = s.score,
          energy = s.energy,
          composure = s.composure,
          alcohol = Math.max(0, s.alcohol - 1);
        const colleagues = structuredClone(s.colleagues),
          relationships = { ...s.relationships },
          handled = { ...s.handled };
        const history = [...s.goodwillHistory],
          results: LogEntry[] = [],
          completedEvents = [...s.completedEvents],
          storyFlags = [...s.storyFlags],
          storyOutcomes = { ...s.storyOutcomes };
        const favours = structuredClone(s.favours);
        const knownFacts = [...s.knownFacts];
        const demarcheProgress = structuredClone(s.demarches);
        let unrequestedDemarches = s.unrequestedDemarches;
        const stepQualities = structuredClone(s.stepQualities);
        const usedRoutes = { ...s.usedRoutes };
        const spentRoutes = structuredClone(s.spentRoutes);
        const routeDeliveries = structuredClone(s.routeDeliveries);
        const favourCalls = structuredClone(s.favourCalls);
        const routeHistory = [...s.routeHistory];
        let routeChanges = s.routeChanges;
        let delayedRouteEffects = structuredClone(s.delayedRouteEffects);
        const record = (
          source: string,
          text: string,
          effects: Effects,
          kind: GoodwillChange["kind"] = "Outcome",
        ) => {
          const before = meters;
          meters = applyEffects(before, effects);
          history.push(
            recordGoodwillChange(before, meters, {
              day: s.day,
              time: s.minute,
              source,
              text,
              kind,
            }),
          );
          results.push({ day: s.day, time: s.minute, text });
        };
        const completeStep = (
          task: string,
          step: string,
          quality: "good" | "adequate",
          completedDay = s.day,
        ) => {
          if (stepDone(missionSteps, task, step)) return;
          missionSteps[task] = [...(missionSteps[task] ?? []), step];
          stepQualities[task] = { ...stepQualities[task], [step]: quality };
          economy.missionReserve = missionReserve(missionSteps);
          if (taskComplete(missionSteps, task)) {
            if (!visit[task]) score += 10;
            visit[task] = true;
            results.push({
              day: completedDay,
              time: s.minute,
              text: `${activeChapter().manifest.missionTasks[task] ?? task}: confirmed in full.`,
            });
          }
        };
        let ending: Ending | null = null;
        for (const row of capacityLedger(
          s.pending,
          s.block,
          playerCapacity(s.character, s.energy, s.composure, s.alcohol, s.hangover).total,
        )) {
          if (row.displaced > 0 && row.id !== "self") {
            const c = colleagues[row.id];
            if (c) c.fatigue = clamp(c.fatigue + row.displaced * 10);
            record(
              "Baseline duties",
              `${row.id}: ${row.displaced} DP of routine duties displaced. Backlog grows; fatigue rises.`,
              { morale: -row.displaced, confidence: -row.displaced },
            );
          }
        }
        for (const p of s.pending) {
          economy.funds -= decisionCash(p) - (p.stepCost ?? 0);
          if ((p.effects.budget ?? 0) > 0) economy.funds += (p.effects.budget ?? 0) * 100;
          if (p.remainingBlocks && p.remainingBlocks > 1) {
            if (p.demarcheId) {
              demarcheProgress[p.demarcheId] = {
                status: "in-progress",
                coordinated: true,
                deliveryPending: true,
              };
              results.push({
                day: s.day,
                time: s.minute,
                text: `${p.source}: a letterhead dispute delays delivery until the next block.`,
              });
              energy = clamp(energy - 5 * playerTime(p));
            } else {
              results.push({
                day: s.day,
                time: s.minute,
                text: `${p.source}: first block spent on the course; the next block is reserved.`,
              });
              energy = clamp(energy - 10);
            }
            continue;
          }
          if (p.demarcheId && p.demarcheRoute) {
            const instruction = demarcheAt(p.demarcheId);
            if (!instruction) continue;
            if (p.demarcheRoute === "coordinate") {
              demarcheProgress[instruction.id] = { status: "in-progress", coordinated: true };
              record(
                instruction.subject,
                "The EU coordination note is agreed; the letterhead remains under discussion.",
                {},
              );
              energy = clamp(energy - 5);
              continue;
            }
            const route = instruction.routes.find((item) => item.kind === p.demarcheRoute);
            if (!route) continue;
            const worker = p.worker;
            const succeeded =
              route.kind !== "colleague" ||
              (!!worker &&
                delegationSucceeds(
                  worker,
                  "programme",
                  colleagues,
                  relationships,
                  undefined,
                  s.block,
                  "programme",
                ));
            const partnerTrust =
              ((colleagues["eu-france"]?.trust ?? 50) + (colleagues["eu-germany"]?.trust ?? 50)) /
              2;
            const outcome = resolveDemarche(instruction, route, {
              day: s.day,
              block: s.block,
              traits: s.character.traits,
              recipientTrust: colleagues[instruction.recipient]?.trust ?? 0,
              euTrust: colleagues["eu"]?.trust ?? 0,
              partnerTrust,
              facts: knownFacts,
              ...(worker ? { worker } : {}),
              delegationSucceeded: succeeded,
              delayApplied: p.remainingBlocks === 1,
            });
            const traitOption = instruction.traitOptions?.find(
              (option) => option.id === p.demarcheTrait,
            );
            const incident = outcome.incident
              ? ` Protocol incident${worker === "maxim" ? ": Maxim reports from the wrong ministry" : ": the messenger was below the required level"}.`
              : "";
            record(
              instruction.subject,
              `${outcome.text}${incident} ${instruction.report[outcome.quality]}${traitOption ? ` ${traitOption.result}` : ""}`,
              { confidence: outcome.confidence, goodwill: outcome.goodwill },
            );
            const recipient = colleagues[instruction.recipient];
            if (recipient) recipient.trust = clamp(recipient.trust + outcome.trust);
            if (worker && colleagues[worker])
              colleagues[worker].fatigue = clamp(colleagues[worker].fatigue + 10);
            if (outcome.quality === "good")
              favours.owedToYou[instruction.recipient] =
                (favours.owedToYou[instruction.recipient] ?? 0) + 1;
            const leak = `demarche-${instruction.id}-leak`;
            if (!storyFlags.includes(leak)) storyFlags.push(leak);
            if (outcome.incident) storyFlags.push(`demarche-${instruction.id}-incident`);
            if (traitOption)
              storyFlags.push(`trait:${traitOption.requiresTrait}:${instruction.id}`);
            demarcheProgress[instruction.id] = {
              status: "delivered",
              quality: outcome.quality,
              route: route.kind,
              incident: outcome.incident,
              resolvedDay: s.day,
              resolvedBlock: s.block,
              ...(worker ? { worker } : {}),
            };
            energy = clamp(energy - 5 * playerTime(p));
            ending = pickEnding(meters, false, visit);
            if (ending) break;
            continue;
          }
          if (p.special === "supplement") {
            economy.supplementUsed = true;
            economy.supplementDue = s.turn + 1 + supplement().delay;
          }
          let success = true;
          const stepDef = p.task && p.step ? findStep(p.task, p.step) : undefined;
          const route = p.route ? stepDef?.routes?.find((r) => r.id === p.route) : undefined;
          if (p.kind === "work" && p.worker && p.task)
            success = delegationSucceeds(
              p.worker,
              p.task,
              colleagues,
              relationships,
              p.partner,
              s.block,
              stepDef?.skill ?? p.task,
            );
          let text = success
            ? p.kind === "work" && stepDef
              ? `${p.source}: ${route?.result ?? stepDef.result}`
              : p.text
            : `${p.source}: work stalled. Check skills, fatigue, trust and cooperation before reassigning.`;
          const formal = success && p.formal ? formalBonus(stats.gravitas) : 0;
          const routeEffects: Effects = {};
          for (const key of ["confidence", "goodwill", "morale", "sanity"] as const) {
            const amount = route?.effects?.[key];
            if (amount !== undefined) routeEffects[key] = (p.effects[key] ?? 0) + amount;
          }
          const effects = success
            ? {
                ...p.effects,
                ...routeEffects,
                ...(formal
                  ? { confidence: (routeEffects.confidence ?? p.effects.confidence ?? 0) + formal }
                  : {}),
              }
            : { confidence: -2, morale: -1 };
          if (formal) text += ` (Gravitas +${formal} HQ goodwill)`;
          record(p.source, text, effects);
          if (success && p.task && stepDef && p.step) {
            // A step is done once; a second decision on it (a mail after the work) changes nothing.
            if (!stepDone(missionSteps, p.task, p.step)) {
              const paid = route
                ? route.fromGeneralFunds
                  ? 0
                  : route.cash
                : stepCash(stepDef, p.task, setbacksApplied);
              economy.funds -= paid;
              if (route) {
                const key = `${p.task}.${p.step}`;
                usedRoutes[key] = route.id;
                routeHistory.push({
                  task: p.task,
                  step: p.step,
                  route: route.id,
                  kind: route.kind,
                });
                const whoToSpend = routeFavourToSpend(route, routeContext(s, p.task, p.step));
                if (whoToSpend) {
                  const who = whoToSpend;
                  favours.owedToYou[who] = Math.max(0, (favours.owedToYou[who] ?? 0) - 1);
                }
                if (route.consequences?.oweFavour) {
                  const who = route.consequences.oweFavour;
                  favours.youOwe[who] = (favours.youOwe[who] ?? 0) + 1;
                  favourCalls.push({ character: who, dueDay: Math.min(lastDay(), s.day + 2) });
                }
                if (route.consequences?.flag && !storyFlags.includes(route.consequences.flag))
                  storyFlags.push(route.consequences.flag);
                if (route.consequences?.delayed) {
                  const delayed = route.consequences.delayed;
                  delayedRouteEffects.push({
                    dueDay: delayed.day,
                    ...(delayed.flag ? { flag: delayed.flag } : {}),
                    ...(delayed.trust ? { trust: delayed.trust } : {}),
                  });
                }
                for (const [who, delta] of Object.entries(route.consequences?.trust ?? {}))
                  if (colleagues[who]) colleagues[who].trust = clamp(colleagues[who].trust + delta);
                if (route.days > 0)
                  routeDeliveries[key] = { route: route.id, dueDay: s.day + route.days };
                else completeStep(p.task, p.step, route.quality);
              } else completeStep(p.task, p.step, "good");
            }
          } else if (success && p.task && !p.step) {
            // A decision queued before the steps existed: it confirmed the whole task.
            if (!visit[p.task]) score += 10;
            visit[p.task] = true;
            missionSteps[p.task] = stepsOf(p.task).map((x) => x.id);
            economy.missionReserve = missionReserve(missionSteps);
          }
          const rewardKey = `reward:${p.source}`;
          if (success && !storyFlags.includes(rewardKey)) {
            score += p.score ?? 0;
            storyFlags.push(rewardKey);
          }
          energy = clamp(energy + (p.energy ?? -5 * playerTime(p)));
          composure = clamp(composure + (p.composure ?? 0));
          if (p.drinks) {
            alcohol = Math.min(5, alcohol + 2);
            if (s.block === 3 && s.character.traits.includes("liver")) hangover = true;
            results.push({
              day: s.day,
              time: s.minute,
              text: "You drank alcohol. Its effect on your DP begins next block and fades over time.",
            });
          }
          if (p.worker && colleagues[p.worker]) {
            const c = colleagues[p.worker];
            const socialRepeat = p.kind === "social" && storyFlags.includes(`social:${p.worker}`);
            if (c) {
              const base = socialRepeat && (p.trust ?? 0) > 0 ? 1 : (p.trust ?? 0);
              const scaled = p.kind === "social" ? charmGain(base, stats.charm) : base;
              const host = ["protocol", "golf", "port-officer"].includes(p.worker);
              const namedrop =
                host &&
                s.character.traits.includes("namedrop") &&
                (p.kind === "social" || p.kind === "dialogue") &&
                scaled > 0
                  ? 1
                  : 0;
              const liver = p.kind === "social" ? socialBonus(stats.liver, !!p.drinks) : 0;
              c.trust = clamp(c.trust + scaled + namedrop + liver);
              c.fatigue = clamp(
                c.fatigue + (p.kind === "work" ? 18 : p.kind === "social" ? -12 : 0),
              );
              const factors = [
                scaled !== base ? `Charm ${scaled - base > 0 ? "+" : ""}${scaled - base}` : "",
                namedrop ? "Name-dropper +1" : "",
                liver ? "Liver +1" : "",
              ].filter(Boolean);
              if (factors.length)
                results.push({
                  day: s.day,
                  time: s.minute,
                  text: `${p.source}: trust ${scaled + namedrop + liver >= 0 ? "+" : ""}${scaled + namedrop + liver} (${factors.join(", ")}).`,
                });
            }
            if (p.kind === "social") storyFlags.push(`social:${p.worker}`);
          }
          if (p.kind === "work" && p.task && p.partner && p.partner !== p.worker) {
            const teammate = colleagues[p.partner];
            if (teammate) teammate.fatigue = clamp(teammate.fatigue + 18);
          }
          if (p.contact && colleagues[p.contact]) {
            const contact = colleagues[p.contact];
            if (contact) {
              const before = contact.trust;
              const base = p.contactTrust ?? 0;
              const scaled = charmGain(base, stats.charm);
              contact.trust = clamp(contact.trust + scaled);
              const change = contact.trust - before;
              if (change) {
                const name =
                  campaign().characters.find((person) => person.id === p.contact)?.name ??
                  p.contact;
                results.push({
                  day: s.day,
                  time: s.minute,
                  text: `${name}: trust ${change > 0 ? "+" : ""}${change} (${before} → ${contact.trust})${scaled !== base ? ` (Charm ${scaled - base > 0 ? "+" : ""}${scaled - base})` : ""}.`,
                });
              }
            }
          }
          if (p.traitChoice === "namedrop" && colleagues["journalist"]) {
            const ruth = colleagues["journalist"];
            const before = ruth.trust;
            ruth.trust = clamp(before - 2);
            results.push({
              day: s.day,
              time: s.minute,
              text: `Ruth Vale: trust ${ruth.trust - before} (Name-dropper; ${before} → ${ruth.trust}).`,
            });
          }
          if (p.pair && p.worker) {
            const legacyTargets: Record<string, string> = {
              "sola:translator": "bianca",
              "development:sola": "sola",
              "bianca:spreadsheets": "press",
            };
            const other =
              p.pairTarget ?? (p.dialogueTopic ? legacyTargets[p.dialogueTopic] : p.partner);
            if (other && other !== p.worker && colleagues[other])
              relationships[pairKey(p.worker, other)] = clamp(
                (relationships[pairKey(p.worker, other)] ?? 50) + p.pair,
              );
          }
          if (p.traitChoice && success)
            storyFlags.push(
              `trait:${p.traitChoice}:${p.eventId ?? p.emailId ?? p.dialogueTopic ?? p.source}`,
            );
          if (
            success &&
            p.favour &&
            !(p.dialogueTopic && storyFlags.includes(`dialogue:${p.dialogueTopic}`))
          ) {
            const { character, delta } = p.favour;
            favours.owedToYou[character] = Math.max(0, (favours.owedToYou[character] ?? 0) + delta);
          }
          if (success && p.teaches && !knownFacts.includes(p.teaches)) knownFacts.push(p.teaches);
          if (p.emailId && p.recall && p.emailAction === "replyall")
            storyFlags.push(`trait-accident:replyall:${p.emailId}`);
          if (
            p.eventId === "fuel-quay" &&
            (p.eventChoice === "buy" || p.eventChoice === "coordinate")
          )
            storyFlags.push("fuel-protected");
          if (p.emailId) handled[p.emailId] = p.emailAction ?? "reply";
          if (p.eventId && !completedEvents.includes(p.eventId)) {
            completedEvents.push(p.eventId);
            storyOutcomes[p.eventId] = {
              status: "chosen",
              ...(p.eventChoice ? { choice: p.eventChoice } : {}),
            };
          }
          if (p.eventId?.startsWith("call-in-") && success) {
            const who = p.eventId.slice("call-in-".length);
            favours.youOwe[who] = Math.max(0, (favours.youOwe[who] ?? 0) - 1);
            const index = favourCalls.findIndex(
              (call) => call.character === who && call.dueDay <= s.day,
            );
            if (index >= 0) favourCalls.splice(index, 1);
          }
          if (p.flag?.startsWith("menu-")) {
            for (let i = storyFlags.length - 1; i >= 0; i--)
              if (storyFlags[i]?.startsWith("menu-")) storyFlags.splice(i, 1);
          }
          if (p.flag && !storyFlags.includes(p.flag)) storyFlags.push(p.flag);
          if (p.dialogueTopic && !storyFlags.includes(`dialogue:${p.dialogueTopic}`))
            storyFlags.push(`dialogue:${p.dialogueTopic}`);
          if (
            p.id.startsWith("travel-") &&
            p.location === "ministry" &&
            s.character.traits.includes("demarche")
          ) {
            const pool = activeChapter().demarches.unrequested;
            const extra = pool[(s.seed + unrequestedDemarches) % pool.length];
            if (extra) {
              unrequestedDemarches++;
              storyFlags.push(`trait:demarche:${extra.id}`);
              record("Unrequested démarche", extra.text, extra.effects);
            }
          }
          ending = pickEnding(meters, false, visit);
          if (ending) break;
        }
        if (!ending)
          for (const instruction of chapterDemarches()) {
            const status = demarcheStatus(instruction, demarcheProgress, s.day, s.block);
            if (
              (status === "new" || status === "in-progress") &&
              !demarcheProgress[instruction.id]?.deliveryPending &&
              demarcheTick(s.day, s.block) >=
                demarcheTick(instruction.deadlineDay, instruction.deadlineBlock)
            ) {
              demarcheProgress[instruction.id] = {
                status: "missed",
                resolvedDay: s.day,
                resolvedBlock: s.block,
              };
              record(
                instruction.subject,
                instruction.report.failed,
                missedEffects({ confidence: -4, goodwill: -2 }, stats.deniability),
                "Missed instruction",
              );
              ending = pickEnding(meters, false, visit);
              if (ending) break;
            }
          }
        // Unaddressed episodes expire at the end of their scheduled block.
        if (!ending) {
          const scheduled = s.events[s.block];
          // Older saves may still contain a follow-up that is now a location lead.
          const event =
            scheduled &&
            !(campaign().events as StoryEvent[]).find((entry) => entry.id === scheduled.id)
              ?.location
              ? scheduled
              : undefined;
          if (event && !s.pending.some((p) => p.eventId === event.id)) {
            completedEvents.push(event.id);
            storyOutcomes[event.id] = { status: "missed" };
            record(
              event.title,
              `${event.onMiss?.text ?? `Unresolved: ${event.title}. ${event.id === "invitation" ? "Protocol records that nobody attended." : "The problem carries a cost even when ignored."}`}${stats.deniability !== 3 ? ` (Plausible Deniability: missed penalties ${(3 - stats.deniability) * 10 > 0 ? "+" : ""}${(3 - stats.deniability) * 10}%)` : ""}`,
              missedEffects(
                event.onMiss?.effects ??
                  (event.id === "invitation" ? { goodwill: -4 } : { morale: -1 }),
                stats.deniability,
              ),
            );
          }
          for (const invitation of dueInvitations(s.day, s.block, storyOutcomes)) {
            completedEvents.push(invitation.id);
            storyOutcomes[invitation.id] = { status: "missed" };
            if (invitation.contact && colleagues[invitation.contact]) {
              const contact = colleagues[invitation.contact];
              if (contact) {
                const before = contact.trust;
                const originalTrust = invitation.onMiss.contactTrust ?? 0;
                const adjustedTrust =
                  missedEffects({ goodwill: originalTrust }, stats.deniability).goodwill ?? 0;
                contact.trust = clamp(contact.trust + adjustedTrust);
                const change = contact.trust - before;
                if (change) {
                  const name =
                    campaign().characters.find((person) => person.id === invitation.contact)
                      ?.name ?? invitation.contact;
                  results.push({
                    day: s.day,
                    time: s.minute,
                    text: `${name}: trust ${change > 0 ? "+" : ""}${change} (${before} → ${contact.trust})${adjustedTrust !== originalTrust ? ` (Plausible Deniability: ${originalTrust} → ${adjustedTrust})` : ""}.`,
                  });
                }
              }
            }
            record(
              invitation.title,
              `${invitation.onMiss.text}${stats.deniability !== 3 ? ` (Plausible Deniability: missed penalties ${(3 - stats.deniability) * 10 > 0 ? "+" : ""}${(3 - stats.deniability) * 10}%)` : ""}`,
              missedEffects(invitation.onMiss.effects, stats.deniability),
              "Missed instruction",
            );
            ending = pickEnding(meters, false, visit);
            if (ending) break;
          }
          for (const e of emails()) {
            if (ending) break;
            if (e.demarcheId) continue;
            const cutoff = blocks()[s.block + 1]?.time ?? 24 * 60;
            if (handled[e.id] || absTime(e.day, e.time) >= absTime(s.day, cutoff)) continue;
            handled[e.id] = "ignored";
            const missed = missedEffects(e.ignore.effects, stats.deniability);
            economy.funds += (missed.budget ?? 0) * 100;
            record(
              e.subject,
              `${e.ignore.text}${stats.deniability !== 3 ? ` (Plausible Deniability: missed penalties ${(3 - stats.deniability) * 10 > 0 ? "+" : ""}${(3 - stats.deniability) * 10}%)` : ""}`,
              missed,
              "Missed instruction",
            );
            ending = pickEnding(meters, false, visit);
            if (ending) break;
          }
        }
        // The last day is played: the posting ends when its final block has resolved.
        const finishing = s.day >= lastDay() && s.block === 3;
        const block = s.block === 3 ? (finishing ? 3 : 0) : s.block + 1;
        const day = s.block === 3 && !finishing ? s.day + 1 : s.day;
        if (day !== s.day) {
          for (const effect of delayedRouteEffects.filter((item) => item.dueDay <= day)) {
            if (effect.flag && !storyFlags.includes(effect.flag)) storyFlags.push(effect.flag);
            for (const [who, delta] of Object.entries(effect.trust ?? {}))
              if (colleagues[who]) colleagues[who].trust = clamp(colleagues[who].trust + delta);
          }
          delayedRouteEffects = delayedRouteEffects.filter((item) => item.dueDay > day);
          // Capital and the host change the arrangements overnight.
          const landed = applySetbacks(day, missionSteps, setbacksApplied);
          setbacksApplied = landed.applied;
          for (const task of Object.keys(landed.progress)) {
            missionSteps[task] = landed.progress[task] ?? [];
          }
          for (const target of landed.reopened) {
            const key = `${target.task}.${target.step}`;
            const used = usedRoutes[key];
            const route = findStep(target.task, target.step)?.routes?.find((r) => r.id === used);
            if (route && route.kind !== "official") {
              spentRoutes[key] = [...new Set([...(spentRoutes[key] ?? []), route.id])];
              routeChanges++;
            }
            delete usedRoutes[key];
            const qualities = stepQualities[target.task];
            if (qualities) delete qualities[target.step];
          }
          for (const { id } of landed.texts) {
            const setback = activeChapter().manifest.setbacks.find((item) => item.id === id);
            for (const target of setback?.targets ?? []) {
              const key = `${target.task}.${target.step}`;
              const delivery = routeDeliveries[key];
              if (!delivery) continue;
              const route = findStep(target.task, target.step)?.routes?.find(
                (item) => item.id === delivery.route,
              );
              if (route && route.kind !== "official") {
                spentRoutes[key] = [...new Set([...(spentRoutes[key] ?? []), route.id])];
                routeChanges++;
              }
              delete usedRoutes[key];
              delete routeDeliveries[key];
            }
          }
          for (const { id, text } of landed.texts) {
            const setback = activeChapter().manifest.setbacks.find((x) => x.id === id);
            const reopened = landed.reopened
              .filter((r) => setback?.targets.some((t) => t.task === r.task && t.step === r.step))
              .map((r) => {
                visit[r.task] = false;
                const step = findStep(r.task, r.step);
                return step ? stepLabel(step, r.task, setbacksApplied) : r.step;
              });
            results.push({
              day,
              time: blocks()[0]?.time ?? 480,
              text: `${text}${reopened.length ? ` Reopened: ${reopened.join("; ")}.` : ""}`,
            });
          }
          economy.missionReserve = missionReserve(missionSteps);
          for (const [key, delivery] of Object.entries(routeDeliveries)) {
            if (delivery.dueDay > day) continue;
            const ref = parseStepRef(key);
            const route =
              ref && findStep(ref.task, ref.step)?.routes?.find((r) => r.id === delivery.route);
            if (ref && route) {
              completeStep(ref.task, ref.step, route.quality, day);
              results.push({
                day,
                time: blocks()[0]?.time ?? 480,
                text: `${route.label}: confirmation has arrived.`,
              });
            }
            delete routeDeliveries[key];
          }
        }
        if (!ending && day !== s.day) {
          for (const event of expiredStories(
            campaign().events as StoryEvent[],
            day,
            completedEvents,
            storyOutcomes,
            storyFlags,
          )) {
            completedEvents.push(event.id);
            storyOutcomes[event.id] = { status: "missed" };
            record(
              event.title,
              `${event.onMiss?.text ?? `The opportunity passed: ${event.title}.`}${stats.deniability !== 3 ? ` (Plausible Deniability: missed penalties ${(3 - stats.deniability) * 10 > 0 ? "+" : ""}${(3 - stats.deniability) * 10}%)` : ""}`,
              missedEffects(event.onMiss?.effects ?? {}, stats.deniability),
            );
          }
        }
        const minute = blocks()[block]?.time ?? 480;
        if (s.block === 3) {
          const recovery = overnightRecovery(stats.stamina);
          energy = clamp(energy + recovery);
          composure = clamp(composure + 15);
          if (recovery !== 25)
            results.push({
              day: s.day,
              time: s.minute,
              text: `Overnight energy recovery +${recovery} (Stamina ${recovery - 25 > 0 ? "+" : ""}${recovery - 25}).`,
            });
          for (const c of Object.values(colleagues)) c.fatigue = clamp(c.fatigue - 30);
        }
        const turn = s.turn + 1;
        if (economy.supplementDue !== null && turn >= economy.supplementDue) {
          economy.funds += supplement().amount;
          economy.supplementDue = null;
          record(
            "Capital supplement",
            `${money(supplement().amount)} arrived in the representation account.`,
            {},
          );
        }
        if (day >= lastDay() && s.day < lastDay()) {
          for (const task of Object.keys(activeChapter().manifest.missionTasks)) {
            if (visit[task] && taskQuality(stepQualities, task) === "adequate")
              record(
                activeChapter().manifest.missionTasks[task] ?? task,
                "The arrangement works, with qualifications that reach Capital before the Minister.",
                { confidence: activeChapter().manifest.adequateArrivalConfidence ?? -2 },
              );
          }
          for (const payoff of activeChapter().conversationPayoffs) {
            if (!ending && visitReady(visit) && storyFlags.includes(payoff.flag))
              record(payoff.source, payoff.text, payoff.effects);
          }
          const fuel = lateFuel();
          if (!storyFlags.includes(fuel.protectedFlag)) {
            economy.funds -= fuel.cost;
            record(
              "Fuel quay",
              `Late generator fuel costs an extra ${money(fuel.cost)} at procurement.`,
              {},
            );
          }
          const shortfall = startRingFence() - economy.ringFence;
          if (shortfall > 0) {
            economy.funds -= shortfall;
            record(
              "Visit emergency procurement",
              `Reserve shortfall ƒ${shortfall} charged to the account. Capital objects to emergency procurement.`,
              { confidence: -Math.ceil(shortfall / 500) * 5 },
            );
          }
        }
        ending = ending ?? pickEnding(meters, finishing, visit);
        const todayPlans = { ...s.todayPlans, [s.block]: s.pending };
        if (day !== s.day) {
          for (const call of favourCalls.filter((item) => item.dueDay <= day)) {
            const id = `call-in-${call.character}`;
            const index = completedEvents.indexOf(id);
            if (index >= 0) completedEvents.splice(index, 1);
          }
        }
        const carry = s.pending
          .filter((p) => (p.remainingBlocks ?? 0) > 1)
          .map((p) => ({
            ...p,
            cashCost: 0,
            timeCost: p.demarcheId ? 0 : p.timeCost,
            remainingBlocks: (p.remainingBlocks ?? 2) - 1,
          }));
        set({
          hangover,
          economy,
          turn,
          planError: "",
          yesterday: s.block === 3 ? todayPlans : s.yesterday,
          todayPlans: s.block === 3 ? {} : todayPlans,
          day,
          block,
          minute,
          meters,
          visit,
          missionSteps,
          demarches: demarcheProgress,
          unrequestedDemarches,
          favours,
          knownFacts,
          stepQualities,
          taskQualities: Object.fromEntries(
            Object.keys(missionSteps).map((task) => [task, taskQuality(stepQualities, task)]),
          ),
          usedRoutes,
          spentRoutes,
          routeDeliveries,
          favourCalls,
          routeHistory,
          routeChanges,
          delayedRouteEffects,
          setbacksApplied,
          score,
          energy,
          composure,
          alcohol,
          colleagues,
          relationships,
          handled,
          goodwillHistory: history,
          pending: ending ? [] : carry,
          report: results,
          log: [...s.log, ...results],
          completedEvents,
          storyFlags,
          storyOutcomes,
          ending,
          events:
            s.block === 3
              ? [
                  ...campaign().events.filter(
                    (event) =>
                      event.callInFor &&
                      favourCalls.some(
                        (call) => call.character === event.callInFor && call.dueDay <= day,
                      ),
                  ),
                  ...dailyEvents(day, s.seed, completedEvents, storyOutcomes),
                ].slice(0, blocks().length)
              : s.events,
          selectedNpc: null,
        });
      },
    }),
    {
      // The posting is no longer persisted here: src/game/saves.ts writes it, with the career, into
      // the save slots. This middleware stays for its versioned migrate/merge/partialize hooks, which
      // the slot manager runs for old saves and which define what a saved posting contains.
      name: "persona-non-grata-posting",
      storage: createJSONStorage(() => ({
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      version: 12,
      migrate: (saved) => {
        const old = saved as Partial<SavedGame>;
        const economy = {
          ...(old.economy ?? {
            ...initialEconomy(),
            funds: Math.max(
              startRingFence(),
              Math.round(
                (((old.meters as (Meters & { budget?: number }) | undefined)?.budget ?? 60) / 60) *
                  10000,
              ),
            ),
          }),
        };
        const block = old.block ?? 0;
        // A task that was confirmed has all its steps done; setbacks of past days have landed.
        const missionSteps = old.missionSteps ?? progressFromVisit(old.visit ?? {});
        economy.missionReserve = missionReserve(missionSteps);
        // Keep stable IDs and the exact obligations; only refresh the former fictional EU name in pending text.
        const pending = (old.pending ?? []).map((item) =>
          item.eventId?.startsWith("asteria-")
            ? {
                ...item,
                source: item.source
                  .replaceAll("Asterian", "Danish")
                  .replaceAll("Asteria", "Denmark"),
                text: item.text.replaceAll("Asterian", "Danish").replaceAll("Asteria", "Denmark"),
              }
            : item,
        );
        const storyOutcomes = { ...old.storyOutcomes };
        if (!storyOutcomes["supplier"] && old.completedEvents?.includes("supplier")) {
          if (old.storyFlags?.includes("supplier-check"))
            storyOutcomes["supplier"] = { status: "chosen", choice: "check" };
          else if (old.storyFlags?.includes("supplier-accepted"))
            storyOutcomes["supplier"] = { status: "chosen", choice: "accept" };
        }
        const error = validatePlan(
          pending,
          block,
          economy,
          playerCapacity(
            old.character ?? null,
            old.energy ?? 80,
            old.composure ?? 75,
            old.alcohol ?? 0,
          ).total,
        );
        return {
          ...initialState(),
          ...old,
          missionSteps,
          demarches: old.demarches ?? migrateDemarches(old.day ?? 1, old.block ?? 0),
          unrequestedDemarches: old.unrequestedDemarches ?? 0,
          favours: old.favours ?? { owedToYou: {}, youOwe: {} },
          knownFacts: old.knownFacts ?? [],
          usedRoutes: old.usedRoutes ?? {},
          spentRoutes: old.spentRoutes ?? {},
          routeDeliveries: old.routeDeliveries ?? {},
          favourCalls: old.favourCalls ?? [],
          routeHistory: old.routeHistory ?? [],
          routeChanges: old.routeChanges ?? 0,
          delayedRouteEffects: old.delayedRouteEffects ?? [],
          stepQualities:
            old.stepQualities ??
            Object.fromEntries(
              Object.entries(missionSteps).map(([task, ids]) => [
                task,
                Object.fromEntries(ids.map((id) => [id, "good"])),
              ]),
            ),
          taskQualities:
            old.taskQualities ??
            Object.fromEntries(Object.keys(missionSteps).map((task) => [task, "good"])),
          setbacksApplied: old.setbacksApplied ?? setbacksBefore(old.day ?? 1),
          chapterId: old.chapterId ?? DEFAULT_CHAPTER_ID,
          character: old.character
            ? (() => {
                const legacy = old.character as Character & { face?: number };
                const { face, ...rest } = legacy;
                return { ...rest, portrait: legacy.portrait ?? `diplomat-${(face ?? 0) + 1}` };
              })()
            : null,
          pressSeen: old.pressSeen ?? [],
          pressDay: old.pressDay ?? 0,
          pressIds: old.pressIds ?? [],
          pressCompiler: old.pressCompiler ?? "press",
          pressRead: old.pressRead ?? false,
          pressDismissedDay: old.pressDismissedDay ?? 0,
          pressClippedDay: old.pressClippedDay ?? 0,
          hangover: old.hangover ?? false,
          economy,
          turn: old.turn ?? ((old.day ?? 1) - 1) * 4 + block,
          planError: error
            ? `Your old plan exceeded ${activeChapter().manifest.label} limits and was cleared without spending funds. Please replan this block.`
            : "",
          block,
          minute: blocks()[block]?.time ?? 480,
          pending: error ? [] : pending,
          colleagues: old.colleagues ?? initialColleagues(),
          storyOutcomes,
          events:
            old.events ??
            dailyEvents(old.day ?? 1, old.seed ?? seed, old.completedEvents ?? [], storyOutcomes),
        };
      },
      // New characters join existing saves without resetting established relationships.
      merge: (saved, current) => {
        const old = (saved ?? {}) as Partial<SavedGame>;
        // Postings saved before the mission steps: a confirmed task has all its steps done.
        const missionSteps = old.missionSteps ?? progressFromVisit(old.visit ?? {});
        const economy = old.economy
          ? {
              ...old.economy,
              missionReserve: old.economy.missionReserve ?? missionReserve(missionSteps),
            }
          : current.economy;
        return {
          ...current,
          ...old,
          economy,
          missionSteps,
          demarches: old.demarches ?? migrateDemarches(old.day ?? 1, old.block ?? 0),
          unrequestedDemarches: old.unrequestedDemarches ?? 0,
          favours: old.favours ?? { owedToYou: {}, youOwe: {} },
          knownFacts: old.knownFacts ?? [],
          usedRoutes: old.usedRoutes ?? {},
          spentRoutes: old.spentRoutes ?? {},
          routeDeliveries: old.routeDeliveries ?? {},
          favourCalls: old.favourCalls ?? [],
          routeHistory: old.routeHistory ?? [],
          routeChanges: old.routeChanges ?? 0,
          delayedRouteEffects: old.delayedRouteEffects ?? [],
          stepQualities:
            old.stepQualities ??
            Object.fromEntries(
              Object.entries(missionSteps).map(([task, ids]) => [
                task,
                Object.fromEntries(ids.map((id) => [id, "good"])),
              ]),
            ),
          taskQualities:
            old.taskQualities ??
            Object.fromEntries(Object.keys(missionSteps).map((task) => [task, "good"])),
          setbacksApplied: old.setbacksApplied ?? setbacksBefore(old.day ?? 1),
          colleagues: { ...initialColleagues(), ...(old.colleagues ?? {}) },
        };
      },
      partialize: (s) =>
        Object.fromEntries(
          Object.entries(s).filter(([, value]) => typeof value !== "function"),
        ) as SavedGame,
    },
  ),
);
export function inboxFor(
  day: number,
  minute: number,
  handled: Record<string, string>,
  progress: DemarcheProgress = {},
) {
  const cutoff = blocks().find((b) => b.time > minute)?.time ?? 24 * 60;
  const block = Math.max(
    0,
    blocks().findIndex((item) => item.time === minute),
  );
  const mail = emails()
    .filter(
      (e) =>
        absTime(e.day, e.time) < absTime(day, cutoff) &&
        !(e.issuedBlock !== undefined && e.day === day && block < e.issuedBlock),
    )
    .map((e) => ({
      ...e,
      status: handled[e.id],
    }));
  const reports = Object.entries(progress).flatMap(([id, result]) => {
    const instruction = demarcheAt(id);
    if (
      !instruction ||
      result.resolvedDay === undefined ||
      (result.status !== "delivered" && result.status !== "missed")
    )
      return [];
    const quality = result.quality ?? "failed";
    return [
      {
        id: `demarche-report-${id}`,
        day: result.resolvedDay,
        time: blocks()[result.resolvedBlock ?? 0]?.time ?? 480,
        from: "Capital · Directorate of Instructions",
        subject: `Report · ${instruction.subject}`,
        body: instruction.report[quality],
        options: {} as Partial<Record<Action, import("./rules").Outcome>>,
        ignore: { text: "", effects: {} },
        status: "report",
      },
    ];
  });
  return [...mail, ...reports].sort((a, b) => a.day - b.day || a.time - b.time);
}
