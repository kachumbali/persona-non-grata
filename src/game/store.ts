import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  absTime, applyEffects, BLOCKS, CAMPAIGN, clamp, dailyEvents, delegationSucceeds, EMAILS, initialColleagues,
  LAST_DAY, pairKey, pickEnding, recordGoodwillChange, START_METERS,
  type Effects, type Action, type ColleagueState, type Ending, type GoodwillChange, type Meters,
  type PendingDecision, type Relationships, type StoryEvent, type VisitStatus,
} from "./rules";

import { capacityLedger, decisionCash, initialEconomy, playerTime, START_RING_FENCE, SUPPLEMENT, validatePlan, type Economy } from "./economy";

export interface Character { title: string; name: string; face: number; bio: string; traits: string[] }
export interface LogEntry { day: number; time: number; text: string }
interface GameState {
  character: Character | null; day: number; minute: number; block: number;
  meters: Meters; handled: Record<string, string>; log: LogEntry[];
  goodwillHistory: GoodwillChange[]; visit: VisitStatus; ending: Ending | null;
  location: string; room: string; selectedNpc: string | null;
  colleagues: Record<string, ColleagueState>; relationships: Relationships;
  pending: PendingDecision[]; report: LogEntry[]; score: number; energy: number; composure: number;
  economy: Economy; turn: number; planError: string; yesterday: Record<number, PendingDecision[]>; todayPlans: Record<number, PendingDecision[]>;
  repeatYesterday: () => void; requestSupplement: () => void; raidReserve: () => void;
  seed: number; events: StoryEvent[]; completedEvents: string[]; storyFlags: string[];
  start: (c: Character) => void; reset: () => void;
  move: (location: string) => void; moveRoom: (room: string) => void;
  selectNpc: (id: string | null) => void;
  queue: (decision: PendingDecision, replacePlayer?: boolean) => boolean; removeDecision: (id: string) => void;
  answer: (id: string, action: Action) => void; advance: () => void;
}
const seed = 23;
type SavedGame = Omit<GameState, "start" | "reset" | "move" | "moveRoom" | "selectNpc" | "queue" | "removeDecision" | "answer" | "advance" | "repeatYesterday" | "requestSupplement" | "raidReserve">;
const initial = {
  economy: initialEconomy(), turn: 0, planError: "", yesterday: {}, todayPlans: {},
  character: null, day: 1, minute: 480, block: 0, meters: START_METERS, handled: {}, log: [],
  goodwillHistory: [], visit: {}, ending: null, location: "embassy", room: "office", selectedNpc: null,
  colleagues: initialColleagues(), relationships: { [pairKey("anselm", "pavel")]: 20, [pairKey("sola", "development")]: 35 },
  pending: [], report: [], score: 0, energy: 80, composure: 75, seed, events: dailyEvents(1, seed, []), completedEvents: [], storyFlags: [],
};
export const useGame = create<GameState>()(persist<GameState, [], [], SavedGame>((set, get) => ({
  ...initial,
  start: (character) => set({ ...initial, character, log: [{ day: 1, time: 480, text: "The Ambassador is absent. You are the Deputy, now acting head of mission. Plan your first morning." }] }),
  reset: () => set({ ...initial }),
  move: (location) => {
    const s = get();
    if (s.ending || s.pending.some((p) => p.location && playerTime(p) > 0) || !CAMPAIGN.locations.some((l) => l.id === location)) return;
    set({ location, selectedNpc: null });
  },
  moveRoom: (room) => set({ room }),
  selectNpc: (selectedNpc) => set({ selectedNpc }),
  queue: (decision, replacePlayer = false) => {
    const s = get();
    if (!s.character || s.ending) return false;
    if (replacePlayer && s.pending.some((p) => p.remainingBlocks === 1)) { set({ planError: "The second half of your golf round is already committed." }); return false; }
    const old = s.pending.filter((p) => !(decision.kind === "social" && p.kind === "social") && !(replacePlayer && playerTime(p) > 0));
    const plan = [...old, decision];
    const error = decision.special === "supplement" && s.economy.supplementUsed ? "Capital has already granted your supplement." : validatePlan(plan, s.block, s.economy);
    if (error) { set({ planError: error }); return false; }
    set({ pending: plan, planError: "" });
    return true;
  },
  repeatYesterday: () => {
    const s = get();
    if (!s.character || s.ending) return;
    const plan = s.yesterday[s.block];
    if (!plan) return;
    const error = s.pending.some((p) => p.remainingBlocks === 1) ? "Finish your committed golf round before replacing the plan." : plan.some((p) => p.emailId || p.eventId || p.special || (p.task && s.visit[p.task]) || p.remainingBlocks) ? "Yesterday's plan contains completed or one-off commitments. Plan those again individually." : validatePlan(plan, s.block, s.economy);
    if (error) { set({ planError: error }); return; }
    set({ pending: structuredClone(plan), planError: "" });
  },
  requestSupplement: () => { get().queue({ id: "supplement", source: "Capital supplement paperwork", text: "Capital approves ƒ1,500; funds arrive after two further blocks. HQ goodwill −5.", kind: "work", timeCost: 1, special: "supplement", effects: { confidence: -SUPPLEMENT.goodwillCost } }); },
  raidReserve: () => {
    const s = get(); if (!s.character || s.ending || s.economy.ringFence < 500) return;
    const meters = applyEffects(s.meters, { confidence: -5 });
    const text = "Released ƒ500 from visit reserves. Arrival procurement is underfunded; HQ goodwill −5.";
    set({ economy: { ...s.economy, ringFence: s.economy.ringFence - 500 }, meters, ending: pickEnding(meters, false, s.visit), goodwillHistory: [...s.goodwillHistory, recordGoodwillChange(s.meters, meters, { day: s.day, time: s.minute, source: "Visit reserve release", text, kind: "Decision" })], log: [...s.log, { day: s.day, time: s.minute, text }] });
  },
  removeDecision: (id) => set((s) => s.pending.some((p) => p.id === id && p.remainingBlocks === 1) ? { planError: "Finish the second half of your golf round first." } : { pending: s.pending.filter((p) => p.id !== id), planError: "" }),
  answer: (id, action) => {
    const s = get(); const e = EMAILS.find((x) => x.id === id); const o = e?.options[action];
    const cutoff = BLOCKS[s.block + 1]?.time ?? 24 * 60;
    if (!e || !o || s.handled[id] || absTime(s.day, cutoff - 1) < absTime(e.day, e.time)) return;
    get().queue({ id: `email-${id}`, kind: "email", source: e.subject, text: o.text, effects: o.effects, task: o.confirms, emailId: id, emailAction: action });
  },
  advance: () => {
    const s = get(); if (!s.character || s.ending) return;
    const invalid = validatePlan(s.pending, s.block, s.economy);
    if (invalid) { set({ planError: invalid }); return; }
    const economy = { ...s.economy };
    let meters = { ...s.meters }, visit = { ...s.visit }, score = s.score, energy = s.energy, composure = s.composure;
    const colleagues = structuredClone(s.colleagues), relationships = { ...s.relationships }, handled = { ...s.handled };
    const history = [...s.goodwillHistory], results: LogEntry[] = [], completedEvents = [...s.completedEvents], storyFlags = [...s.storyFlags];
    const record = (source: string, text: string, effects: Effects, kind: GoodwillChange["kind"] = "Outcome") => {
      const before = meters; meters = applyEffects(before, effects);
      history.push(recordGoodwillChange(before, meters, { day: s.day, time: s.minute, source, text, kind }));
      results.push({ day: s.day, time: s.minute, text });
    };
    let ending: Ending | null = null;
    for (const row of capacityLedger(s.pending, s.block)) {
      if (row.displaced > 0 && row.id !== "self") {
        const c = colleagues[row.id];
        if (c) c.fatigue = clamp(c.fatigue + row.displaced * 10);
        record("Baseline duties", `${row.id}: ${row.displaced} TP of routine duties displaced. Backlog grows; fatigue rises.`, { morale: -row.displaced, confidence: -row.displaced });
      }
    }
    for (const p of s.pending) {
      economy.funds -= decisionCash(p);
      if ((p.effects.budget ?? 0) > 0) economy.funds += (p.effects.budget ?? 0) * 100;
      if (p.special === "supplement") { economy.supplementUsed = true; economy.supplementDue = s.turn + 1 + SUPPLEMENT.delay; }
      if (p.remainingBlocks && p.remainingBlocks > 1) {
        results.push({ day: s.day, time: s.minute, text: `${p.source}: first block spent on the course; the next block is reserved.` });
        energy = clamp(energy - 10); continue;
      }
      let success = true;
      if (p.kind === "work" && p.worker && p.task) success = delegationSucceeds(p.worker, p.task, colleagues, relationships, p.partner, s.block);
      const text = success ? p.text : `${p.source}: work stalled. Check skills, fatigue, trust and cooperation before reassigning.`;
      record(p.source, text, success ? p.effects : { confidence: -2, morale: -1 });
      if (success && p.task) { if (!visit[p.task]) score += 10; visit[p.task] = true; }
      const rewardKey = `reward:${p.source}`;
      if (success && !storyFlags.includes(rewardKey)) { score += p.score ?? 0; storyFlags.push(rewardKey); }
      energy = clamp(energy + (p.energy ?? -5 * playerTime(p)));
      composure = clamp(composure + (p.composure ?? 0));
      if (p.worker && colleagues[p.worker]) {
        const c = colleagues[p.worker];
        const socialRepeat = p.kind === "social" && storyFlags.includes(`social:${p.worker}`);
        if (c) { c.trust = clamp(c.trust + (socialRepeat && (p.trust ?? 0) > 0 ? 1 : p.trust ?? 0)); c.fatigue = clamp(c.fatigue + (p.kind === "work" ? 18 : p.kind === "social" ? -12 : 0)); }
        if (p.kind === "social") storyFlags.push(`social:${p.worker}`);
      }
      if (p.pair && p.worker) {
        const other = p.partner ?? (p.worker === "pavel" ? "anselm" : "sola");
        relationships[pairKey(p.worker, other)] = clamp((relationships[pairKey(p.worker, other)] ?? 50) + p.pair);
      }
      if (p.emailId) handled[p.emailId] = p.emailAction ?? "reply";
      if (p.eventId && !completedEvents.includes(p.eventId)) completedEvents.push(p.eventId);
      if (p.flag) storyFlags.push(p.flag);
      ending = pickEnding(meters, false, visit); if (ending) break;
    }
    // Unaddressed episodes expire at the end of their scheduled block.
    if (!ending) {
      const event = s.events[s.block];
      if (event && !s.pending.some((p) => p.eventId === event.id)) {
        record(event.title, `Unresolved: ${event.title}. ${event.id === "invitation" ? "Protocol records that nobody attended." : "The problem carries a cost even when ignored."}`, event.id === "invitation" ? { goodwill: -4 } : { morale: -1 });
      }
      for (const e of EMAILS) {
        const cutoff = BLOCKS[s.block + 1]?.time ?? 24 * 60;
        if (handled[e.id] || absTime(e.day, e.time) >= absTime(s.day, cutoff)) continue;
        handled[e.id] = "ignored";
        economy.funds += (e.ignore.effects.budget ?? 0) * 100;
        record(e.subject, e.ignore.text, e.ignore.effects, "Missed instruction");
        ending = pickEnding(meters, false, visit); if (ending) break;
      }
    }
    const block = s.block === 3 ? 0 : s.block + 1;
    const day = s.block === 3 ? s.day + 1 : s.day;
    const minute = BLOCKS[block]?.time ?? 480;
    if (s.block === 3) {
      energy = clamp(energy + 25); composure = clamp(composure + 15);
      for (const c of Object.values(colleagues)) c.fatigue = clamp(c.fatigue - 30);
    }
    const turn = s.turn + 1;
    if (economy.supplementDue !== null && turn >= economy.supplementDue) {
      economy.funds += SUPPLEMENT.amount; economy.supplementDue = null;
      record("Capital supplement", "ƒ1,500 arrived in the representation account.", {});
    }
    if (day >= LAST_DAY && s.day < LAST_DAY) {
      const shortfall = START_RING_FENCE - economy.ringFence;
      if (shortfall > 0) {
        economy.funds -= shortfall;
        record("Visit emergency procurement", `Reserve shortfall ƒ${shortfall} charged to the account. Capital objects to emergency procurement.`, { confidence: -Math.ceil(shortfall / 500) * 5 });
      }
    }
    ending = ending ?? pickEnding(meters, day >= LAST_DAY, visit);
    const todayPlans = { ...s.todayPlans, [s.block]: s.pending };
    const carry = s.pending.filter((p) => (p.remainingBlocks ?? 0) > 1).map((p) => ({ ...p, cashCost: 0, remainingBlocks: (p.remainingBlocks ?? 2) - 1 }));
    set({ economy, turn, planError: "", yesterday: s.block === 3 ? todayPlans : s.yesterday, todayPlans: s.block === 3 ? {} : todayPlans, day, block, minute, meters, visit, score, energy, composure, colleagues, relationships, handled, goodwillHistory: history,
      pending: ending ? [] : carry, report: results, log: [...s.log, ...results], completedEvents, storyFlags, ending,
      events: s.block === 3 ? dailyEvents(day, s.seed, completedEvents) : s.events, selectedNpc: null });
  },
}), {
  name: "persona-non-grata-save", version: 3,
  migrate: (saved) => {
    const old = saved as Partial<SavedGame>;
    const economy = old.economy ?? { ...initialEconomy(), funds: Math.max(START_RING_FENCE, Math.round(((old.meters as (Meters & { budget?: number }) | undefined)?.budget ?? 60) / 60 * 10000)) };
    const block = old.block ?? 0;
    const pending = old.pending ?? [];
    const error = validatePlan(pending, block, economy);
    return { ...initial, ...old, economy, turn: old.turn ?? ((old.day ?? 1) - 1) * 4 + block, planError: error ? "Your old plan exceeded Chapter 1 limits and was cleared without spending funds. Please replan this block." : "", block, minute: BLOCKS[block]?.time ?? 480, pending: error ? [] : pending, colleagues: old.colleagues ?? initialColleagues(), events: dailyEvents(old.day ?? 1, seed, old.completedEvents ?? []) };
  },
  partialize: (s) => Object.fromEntries(Object.entries(s).filter(([, value]) => typeof value !== "function")) as SavedGame,
}));
export function inboxFor(day: number, minute: number, handled: Record<string, string>) {
  const cutoff = BLOCKS.find((b) => b.time > minute)?.time ?? 24 * 60;
  return EMAILS.filter((e) => absTime(e.day, e.time) < absTime(day, cutoff)).map((e) => ({ ...e, status: handled[e.id] }));
}
