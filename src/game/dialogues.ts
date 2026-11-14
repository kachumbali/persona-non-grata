import type { ChoiceGate } from "./character";
import DIALOGUES from "./data/dialogues.json";

export interface TalkChoice extends ChoiceGate {
  label: string;
  next?: string;
  result?: string;
  trust?: number;
  pair?: number;
  pairTarget?: string;
  score?: number;
  flag?: string;
  formal?: boolean;
  effects?: Record<string, number>;
}
export interface TalkNode {
  text: string;
  choices: TalkChoice[];
}
export interface Topic {
  id: string;
  start: string;
  nodes: Record<string, TalkNode>;
}

const ALL = DIALOGUES as Record<string, Topic[]>;

/** Topics a character can raise; empty when none are authored. */
export function topicsFor(npcId: string): Topic[] {
  return ALL[npcId] ?? [];
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
export function moodOpener(trust: number): string {
  if (trust < 35) return "(Sighs.) ";
  if (trust > 70) return "Ah, good — you. ";
  return "";
}

/** Split authored effects into meter changes, energy and spending. */
export function splitEffects(e: Record<string, number> = {}) {
  const { energy, money, ...meters } = e;
  return { meters, energy: energy ?? 0, cash: money ? -money : 0 };
}
