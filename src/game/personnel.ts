/** Pure personnel-file progression. Posting counters reset; earned career traits persist. */
import reputationData from "./data/reputations.json";
import quirkData from "./data/earned-quirks.json";
import type { StatKey } from "./rules";

/** The stat names as the character builder and the personnel file show them. */
export const STAT_LABELS: Record<StatKey, string> = {
  gravitas: "Gravitas",
  charm: "Charm",
  stamina: "Bureaucratic Stamina",
  deniability: "Plausible Deniability",
  liver: "Liver",
};
export type Drift = Partial<Record<StatKey, number>>;
export interface Reputation {
  id: string;
  name: string;
  description: string;
  counter: string;
  threshold: number;
  unlocks?: string;
  greeting?: Record<string, string>;
}
export interface EarnedQuirk {
  id: string;
  name: string;
  description: string;
  stats: Drift;
  trigger: {
    counter?: string;
    threshold?: number;
    reputation?: string;
    days?: number;
    flag?: string;
  };
  mail: string;
  cures?: string;
  replaces?: string;
}
export const REPUTATIONS = reputationData as Reputation[];
export const EARNED_QUIRKS = quirkData as EarnedQuirk[];
export interface PersonnelSnapshot {
  traits: string[];
  stats: Record<StatKey, number>;
  reputations: string[];
}
export interface PersonnelState {
  counters: Record<string, number>;
  reputations: string[];
  earnedReputations: string[];
  reputationSince: Record<string, number>;
  earnedQuirks: string[];
  curedTraits: string[];
  drift: Drift;
  start: PersonnelSnapshot;
  notices: { day: number; block: number; quirk: string; text: string }[];
}
export function createPersonnel(
  traits: string[],
  stats: Record<StatKey, number>,
  earnedQuirks: string[] = [],
  curedTraits: string[] = [],
  drift: Drift = {},
  reputations: string[] = [],
): PersonnelState {
  const active = reputations.slice(-3);
  return {
    counters: {},
    reputations: [...active],
    earnedReputations: [...active],
    reputationSince: Object.fromEntries(active.map((id) => [id, 1])),
    earnedQuirks: [...earnedQuirks],
    curedTraits: [...curedTraits],
    drift: { ...drift },
    start: { traits: [...traits], stats: { ...stats }, reputations: [...active] },
    notices: [],
  };
}
export function effectiveTraits(starting: string[], quirks: string[], cured: string[]): string[] {
  return [...new Set([...starting.filter((id) => !cured.includes(id)), ...quirks])];
}
export function advancePersonnel(
  input: PersonnelState,
  increments: Record<string, number>,
  day: number,
  block: number,
  flags: string[] = [],
): { state: PersonnelState; lines: string[] } {
  const state = structuredClone(input),
    lines: string[] = [];
  for (const [id, n] of Object.entries(increments))
    state.counters[id] = (state.counters[id] ?? 0) + n;
  for (const rep of REPUTATIONS) {
    if (
      state.earnedReputations.includes(rep.id) ||
      (state.counters[rep.counter] ?? 0) < rep.threshold
    )
      continue;
    if (state.reputations.length === 3) {
      const removed = state.reputations.shift()!;
      lines.push(`Reputation lost: ${REPUTATIONS.find((r) => r.id === removed)?.name ?? removed}.`);
    }
    state.reputations.push(rep.id);
    state.earnedReputations.push(rep.id);
    state.reputationSince[rep.id] = day;
    lines.push(`Reputation gained: ${rep.name}. ${rep.description}`);
  }
  for (const q of EARNED_QUIRKS) {
    const t = q.trigger;
    const ready = t.counter
      ? (state.counters[t.counter] ?? 0) >= (t.threshold ?? 1)
      : t.reputation
        ? state.reputations.includes(t.reputation) &&
          day - (state.reputationSince[t.reputation] ?? day) >= (t.days ?? 0)
        : t.flag
          ? flags.includes(t.flag)
          : false;
    if (state.notices.length >= 3 || state.earnedQuirks.includes(q.id) || !ready) continue;
    if (q.cures && !state.start.traits.includes(q.cures)) continue;
    state.earnedQuirks.push(q.id);
    if (q.cures && !state.curedTraits.includes(q.cures)) state.curedTraits.push(q.cures);
    if (
      q.replaces &&
      state.start.traits.includes(q.replaces) &&
      !state.curedTraits.includes(q.replaces)
    )
      state.curedTraits.push(q.replaces);
    state.notices.push({ day, block, quirk: q.id, text: q.mail });
    lines.push(`Personnel file amended: ${q.name}. ${q.mail}`);
  }
  return { state, lines };
}
