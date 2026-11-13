import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  absTime, applyEffects, BLOCKS, CAMPAIGN, clamp, dailyEvents, delegationSucceeds, EMAILS, initialColleagues,
  LAST_DAY, pairKey, pickEnding, recordGoodwillChange, START_METERS,
  type Action, type ColleagueState, type Ending, type GoodwillChange, type Meters,
  type PendingDecision, type Relationships, type StoryEvent, type VisitStatus,
} from "./rules";

export interface Character { title: string; name: string; face: number; bio: string; traits: string[] }
export interface LogEntry { day: number; time: number; text: string }
interface GameState {
  character: Character | null; day: number; minute: number; block: number;
  meters: Meters; handled: Record<string, string>; log: LogEntry[];
  goodwillHistory: GoodwillChange[]; visit: VisitStatus; ending: Ending | null;
  location: string; room: string; selectedNpc: string | null;
  colleagues: Record<string, ColleagueState>; relationships: Relationships;
  pending: PendingDecision[]; report: LogEntry[]; score: number; energy: number; composure: number;
  seed: number; events: StoryEvent[]; completedEvents: string[]; storyFlags: string[];
  start: (c: Character) => void; reset: () => void;
  move: (location: string) => void; moveRoom: (room: string) => void;
  selectNpc: (id: string | null) => void;
  queue: (decision: PendingDecision) => boolean; removeDecision: (id: string) => void;
  answer: (id: string, action: Action) => void; advance: () => void;
}
const seed = 23;
type SavedGame = Omit<GameState, "start" | "reset" | "move" | "moveRoom" | "selectNpc" | "queue" | "removeDecision" | "answer" | "advance">;
const initial = {
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
    if (s.ending || s.pending.some((p) => p.playerSlot) || !CAMPAIGN.locations.some((l) => l.id === location)) return;
    set({ location, selectedNpc: null });
  },
  moveRoom: (room) => set({ room }),
  selectNpc: (selectedNpc) => set({ selectedNpc }),
  queue: (decision) => {
    const s = get();
    if (!s.character || s.ending || s.pending.some((p) => p.id === decision.id)) return false;
    const old = s.pending.filter((p) => !(decision.kind === "social" && p.kind === "social"));
    if (decision.playerSlot && old.some((p) => p.playerSlot)) return false;
    if (decision.kind === "work" && s.block === 3 && decision.worker) return false;
    if (decision.worker && decision.kind !== "social" && old.some((p) => (p.worker === decision.worker || p.partner === decision.worker) && p.kind !== "social")) return false;
    if (decision.partner && old.some((p) => p.worker === decision.partner || p.partner === decision.partner)) return false;
    const cost = old.reduce((n, p) => n + Math.max(0, -(p.effects.budget ?? 0)), 0) + Math.max(0, -(decision.effects.budget ?? 0));
    if (cost > s.meters.budget) return false;
    set({ pending: [...old, decision] });
    return true;
  },
  removeDecision: (id) => set((s) => ({ pending: s.pending.filter((p) => p.id !== id) })),
  answer: (id, action) => {
    const s = get(); const e = EMAILS.find((x) => x.id === id); const o = e?.options[action];
    const cutoff = BLOCKS[s.block + 1]?.time ?? 24 * 60;
    if (!e || !o || s.handled[id] || absTime(s.day, cutoff - 1) < absTime(e.day, e.time)) return;
    get().queue({ id: `email-${id}`, kind: "email", source: e.subject, text: o.text, effects: o.effects, task: o.confirms, emailId: id, emailAction: action });
  },
  advance: () => {
    const s = get(); if (!s.character || s.ending) return;
    let meters = { ...s.meters }, visit = { ...s.visit }, score = s.score, energy = s.energy, composure = s.composure;
    const colleagues = structuredClone(s.colleagues), relationships = { ...s.relationships }, handled = { ...s.handled };
    const history = [...s.goodwillHistory], results: LogEntry[] = [], completedEvents = [...s.completedEvents], storyFlags = [...s.storyFlags];
    const record = (source: string, text: string, effects: Partial<Meters>, kind: GoodwillChange["kind"] = "Outcome") => {
      const before = meters; meters = applyEffects(before, effects);
      history.push(recordGoodwillChange(before, meters, { day: s.day, time: s.minute, source, text, kind }));
      results.push({ day: s.day, time: s.minute, text });
    };
    let ending: Ending | null = null;
    for (const p of s.pending) {
      let success = true;
      if (p.kind === "work" && p.worker && p.task) success = delegationSucceeds(p.worker, p.task, colleagues, relationships, p.partner, s.block);
      const text = success ? p.text : `${p.source}: work stalled. Check skills, fatigue, trust and cooperation before reassigning.`;
      record(p.source, text, success ? p.effects : { confidence: -2, morale: -1 });
      if (success && p.task) { if (!visit[p.task]) score += 10; visit[p.task] = true; }
      const rewardKey = `reward:${p.source}`;
      if (success && !storyFlags.includes(rewardKey)) { score += p.score ?? 0; storyFlags.push(rewardKey); }
      energy = clamp(energy + (p.energy ?? (p.playerSlot ? -10 : 0)));
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
    ending = ending ?? pickEnding(meters, day >= LAST_DAY, visit);
    set({ day, block, minute, meters, visit, score, energy, composure, colleagues, relationships, handled, goodwillHistory: history,
      pending: [], report: results, log: [...s.log, ...results], completedEvents, storyFlags, ending,
      events: s.block === 3 ? dailyEvents(day, s.seed, completedEvents) : s.events, selectedNpc: null });
  },
}), {
  name: "persona-non-grata-save", version: 2,
  migrate: (saved) => {
    const old = saved as Partial<SavedGame>;
    return { ...initial, ...old, block: 0, minute: 480, pending: [], colleagues: old.colleagues ?? initialColleagues(), events: dailyEvents(old.day ?? 1, seed, old.completedEvents ?? []) };
  },
  partialize: (s) => Object.fromEntries(Object.entries(s).filter(([, value]) => typeof value !== "function")) as SavedGame,
}));
export function inboxFor(day: number, minute: number, handled: Record<string, string>) {
  const cutoff = BLOCKS.find((b) => b.time > minute)?.time ?? 24 * 60;
  return EMAILS.filter((e) => absTime(e.day, e.time) < absTime(day, cutoff)).map((e) => ({ ...e, status: handled[e.id] }));
}
