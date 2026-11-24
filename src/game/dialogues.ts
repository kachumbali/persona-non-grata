import type { ChoiceGate } from "./character";
import { activeChapter } from "./chapters";
import { relationshipState } from "./relationships";

export interface TalkChoice extends ChoiceGate {
  label: string;
  labelVariants?: string[];
  next?: string;
  result?: string;
  resultVariants?: string[];
  trust?: number;
  pair?: number;
  pairTarget?: string;
  score?: number;
  flag?: string;
  formal?: boolean;
  favour?: { character: string; delta: number };
  teaches?: string;
  counts?: string[];
  statDrift?: { stat: import("./rules").StatKey; delta: number };
  effects?: Record<string, number>;
}
export interface TalkNode {
  text: string;
  variants?: string[];
  choices: TalkChoice[];
}
export interface Topic {
  id: string;
  start: string;
  nodes: Record<string, TalkNode>;
}

/** Topics a character can raise; empty when none are authored. */
export function topicsFor(npcId: string): Topic[] {
  return activeChapter().dialogues[npcId] ?? [];
}

/** Each character raises a different topic as blocks pass, skipping ones already finished when possible. */
export function pickTopic(
  npcId: string,
  day: number,
  block: number,
  done: string[] = [],
): Topic | undefined {
  const all = topicsFor(npcId);
  const fresh = all.filter((t) => !done.includes(`${npcId}:${t.id}`));
  const pool = fresh.length ? fresh : all;
  if (!pool.length) return undefined;
  const seed = [...npcId].reduce((n, c) => n + c.charCodeAt(0), 0) + day * 4 + block;
  return pool[seed % pool.length];
}

/** Trust colours how they greet you. */
export function moodOpener(trust: number, traits: string[] = []): string {
  const state = relationshipState(trust);
  if (state === "feud" || state === "rival") return "(Sighs.) ";
  if (state === "wary") return "(Checks the minutes.) ";
  if (state === "ally" || state === "friendly") return "Ah, good — you. ";
  if (traits.includes("template")) return "There is a form for this. ";
  if (traits.includes("gossip")) return "Between ourselves, of course. ";
  return "";
}

/** Split authored effects into meter changes, energy and spending. */
export function splitEffects(e: Record<string, number> = {}) {
  const { energy, money, ...meters } = e;
  return { meters, energy: energy ?? 0, cash: money ? -money : 0 };
}
