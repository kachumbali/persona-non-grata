import emailsData from "./data/emails.json";
import traitsData from "./data/traits.json";

export type MeterKey = "budget" | "confidence" | "goodwill" | "morale" | "sanity";
export type StatKey = "gravitas" | "charm" | "stamina" | "deniability" | "liver";
export type Action = "reply" | "delegate" | "forward" | "note" | "replyall";
export type Meters = Record<MeterKey, number>;

export interface Outcome { text: string; effects: Partial<Meters> }
export interface Email {
  id: string; day: number; time: number; from: string; subject: string; body: string;
  options: Partial<Record<Action, Outcome>>; ignore: Outcome;
}
export interface Trait { id: string; name: string; cost: number; desc: string; stats: Partial<Record<StatKey, number>> }

export const EMAILS = emailsData as Email[];
export const TRAITS = traitsData as Trait[];

export const DAY_START = 8 * 60;
export const DAY_END = 18 * 60;
export const LAST_DAY = 15;
export const TRAIT_POINTS = 3;
export const ESCALATE_AFTER = 150; // game minutes before an unanswered email escalates
export const MINUTES_PER_SECOND = 6.5; // at 1x
export const START_METERS: Meters = { budget: 60, confidence: 55, goodwill: 50, morale: 50, sanity: 70 };

export const ACTION_LABELS: Record<Action, string> = {
  reply: "Reply", delegate: "Delegate", forward: "Forward to Capital", note: "Take Note", replyall: "Reply All",
};

export const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function applyEffects(m: Meters, e: Partial<Meters>): Meters {
  const out = { ...m };
  for (const k of Object.keys(e) as MeterKey[]) out[k] = clamp(out[k] + (e[k] ?? 0));
  return out;
}

/** Points left: you get TRAIT_POINTS, positive traits cost points, negative ones refund them. */
export function pointsLeft(traitIds: string[]): number {
  return TRAIT_POINTS - traitIds.reduce((s, id) => s + (TRAITS.find((t) => t.id === id)?.cost ?? 0), 0);
}

export function computeStats(traitIds: string[]): Record<StatKey, number> {
  const s: Record<StatKey, number> = { gravitas: 3, charm: 3, stamina: 3, deniability: 3, liver: 3 };
  for (const id of traitIds) {
    const t = TRAITS.find((x) => x.id === id);
    if (t) for (const k of Object.keys(t.stats) as StatKey[]) s[k] = Math.max(0, s[k] + (t.stats[k] ?? 0));
  }
  return s;
}

export const absTime = (day: number, minute: number) => day * 10000 + minute;

export function formatClock(minute: number) {
  const h = Math.floor(minute / 60), m = Math.floor(minute % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export type Ending = "png" | "retired" | "ambassador" | "promoted";
export const ENDINGS: Record<Ending, { title: string; text: string }> = {
  png: { title: "Persona Non Grata", text: "Ombrazia declares you unwelcome, with compliments. Your farewell is a stamped form in an order nobody can document." },
  retired: { title: "Quietly Retired to Brussels", text: "The Capital has lost confidence. You are given a window office overlooking another window." },
  ambassador: { title: "The Ambassador Returns and Takes Credit", text: "Everything worked. The Ambassador reappears tanned, shakes the Minister's hand and thanks 'the team'." },
  promoted: { title: "Promoted Sideways", text: "The Minister notices nothing, which is the highest compliment. You are promoted to a post with a longer title and the same desk." },
};

/** Game over early if a meter hits zero; otherwise judged at the end of Day 15. */
export function pickEnding(m: Meters, finalDay: boolean): Ending | null {
  if (m.goodwill <= 0) return "png";
  if (m.confidence <= 0 || m.sanity <= 0) return "retired";
  if (!finalDay) return null;
  if (m.goodwill < 25) return "png";
  if (m.confidence < 35) return "retired";
  if (m.confidence >= 65 && m.goodwill >= 50) return "promoted";
  return "ambassador";
}
