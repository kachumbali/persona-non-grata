import { pressReview, clippings } from "./press";
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
import { persist } from "zustand/middleware";
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
        if (
          s.day >= 4 &&
          s.pressIds.some((id) => clippings().find((c) => c.id === id)?.signal) &&
          !flags.includes("fuel-lead")
        )
          flags.push("fuel-lead");
        set({
          pressRead: true,
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
        if (s.pending.some((p) => p.location && playerTime(p) > 0)) {
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
        });
        if (ok) set({ location, selectedNpc: null });
        return ok;
      },
      moveRoom: (room) => set({ room }),
      selectNpc: (selectedNpc) => set({ selectedNpc }),
      queue: (decision, replacePlayer = false) => {
        const s = get();
        if (!s.character || s.ending) return false;
        if (replacePlayer && s.pending.some((p) => p.remainingBlocks === 1)) {
          set({ planError: "The second half of your golf round is already committed." });
          return false;
        }
        const old = s.pending.filter(
          (p) =>
            !(decision.kind === "social" && p.kind === "social") &&
            !(replacePlayer && playerTime(p) > 0 && !p.id.startsWith("travel-")),
        );
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
          ? "Finish your committed golf round before replacing the plan."
          : plan.some(
                (p) =>
                  p.emailId ||
                  p.eventId ||
                  p.special ||
                  (p.task && s.visit[p.task]) ||
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
              ? { planError: "Finish the second half of your golf round first." }
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
        get().queue({
          id: `email-${id}`,
          kind: "email",
          source: e.subject,
          text: accident ? `${actual.text} (Reply-All Reflex: accidental reply all.)` : actual.text,
          effects: actual.effects,
          task: actual.confirms,
          formal: actual.formal,
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
        const plan = s.pending.map((p) =>
          p === item
            ? {
                ...p,
                text: `${original.text} (Accidental reply recalled.)`,
                effects: original.effects,
                task: original.confirms,
                formal: original.formal,
                traitChoice: original.requiresTrait,
                emailAction: "reply" as const,
                recall: undefined,
                timeCost: 2,
              }
            : p,
        );
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
          economy.funds -= decisionCash(p);
          if ((p.effects.budget ?? 0) > 0) economy.funds += (p.effects.budget ?? 0) * 100;
          if (p.special === "supplement") {
            economy.supplementUsed = true;
            economy.supplementDue = s.turn + 1 + supplement().delay;
          }
          if (p.remainingBlocks && p.remainingBlocks > 1) {
            results.push({
              day: s.day,
              time: s.minute,
              text: `${p.source}: first block spent on the course; the next block is reserved.`,
            });
            energy = clamp(energy - 10);
            continue;
          }
          let success = true;
          if (p.kind === "work" && p.worker && p.task)
            success = delegationSucceeds(
              p.worker,
              p.task,
              colleagues,
              relationships,
              p.partner,
              s.block,
            );
          let text = success
            ? p.text
            : `${p.source}: work stalled. Check skills, fatigue, trust and cooperation before reassigning.`;
          const formal = success && p.formal ? formalBonus(stats.gravitas) : 0;
          const effects = success
            ? {
                ...p.effects,
                ...(formal ? { confidence: (p.effects.confidence ?? 0) + formal } : {}),
              }
            : { confidence: -2, morale: -1 };
          if (formal) text += ` (Gravitas +${formal} HQ goodwill)`;
          record(p.source, text, effects);
          if (success && p.task) {
            if (!visit[p.task]) score += 10;
            visit[p.task] = true;
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
          if (p.flag?.startsWith("menu-")) {
            for (let i = storyFlags.length - 1; i >= 0; i--)
              if (storyFlags[i]?.startsWith("menu-")) storyFlags.splice(i, 1);
          }
          if (p.flag && !storyFlags.includes(p.flag)) storyFlags.push(p.flag);
          if (p.dialogueTopic && !storyFlags.includes(`dialogue:${p.dialogueTopic}`))
            storyFlags.push(`dialogue:${p.dialogueTopic}`);
          ending = pickEnding(meters, false, visit);
          if (ending) break;
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
        const block = s.block === 3 ? 0 : s.block + 1;
        const day = s.block === 3 ? s.day + 1 : s.day;
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
        ending = ending ?? pickEnding(meters, day >= lastDay(), visit);
        const todayPlans = { ...s.todayPlans, [s.block]: s.pending };
        const carry = s.pending
          .filter((p) => (p.remainingBlocks ?? 0) > 1)
          .map((p) => ({ ...p, cashCost: 0, remainingBlocks: (p.remainingBlocks ?? 2) - 1 }));
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
            s.block === 3 ? dailyEvents(day, s.seed, completedEvents, storyOutcomes) : s.events,
          selectedNpc: null,
        });
      },
    }),
    {
      name: "persona-non-grata-save",
      version: 9,
      migrate: (saved) => {
        const old = saved as Partial<SavedGame>;
        const economy = old.economy ?? {
          ...initialEconomy(),
          funds: Math.max(
            startRingFence(),
            Math.round(
              (((old.meters as (Meters & { budget?: number }) | undefined)?.budget ?? 60) / 60) *
                10000,
            ),
          ),
        };
        const block = old.block ?? 0;
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
        return {
          ...current,
          ...old,
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
export function inboxFor(day: number, minute: number, handled: Record<string, string>) {
  const cutoff = blocks().find((b) => b.time > minute)?.time ?? 24 * 60;
  return emails()
    .filter((e) => absTime(e.day, e.time) < absTime(day, cutoff))
    .map((e) => ({
      ...e,
      status: handled[e.id],
    }));
}
