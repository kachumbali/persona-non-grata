import traitsData from "./data/traits.json";
import type { Effects, StatKey } from "./rules";

export interface ChoiceGate {
  requiresTrait?: string;
  blockedByTrait?: string;
  requiresStat?: { stat: StatKey; min: number };
}
export type Stats = Record<StatKey, number>;
export const USED_STATS: readonly StatKey[] = [
  "gravitas",
  "charm",
  "stamina",
  "deniability",
  "liver",
];
export function eligible(gate: ChoiceGate, traits: string[], stats: Stats): boolean {
  return (
    (!gate.requiresTrait || traits.includes(gate.requiresTrait)) &&
    (!gate.blockedByTrait || !traits.includes(gate.blockedByTrait)) &&
    (!gate.requiresStat || stats[gate.requiresStat.stat] >= gate.requiresStat.min)
  );
}
export function gateLabel(gate: ChoiceGate): string {
  const names: Record<StatKey, string> = {
    gravitas: "Gravitas",
    charm: "Charm",
    stamina: "Stamina",
    deniability: "Plausible Deniability",
    liver: "Liver",
  };
  const labels = [
    gate.requiresTrait &&
      (traitsData.find((t) => t.id === gate.requiresTrait)?.name ?? gate.requiresTrait),
    gate.blockedByTrait &&
      `Without ${traitsData.find((t) => t.id === gate.blockedByTrait)?.name ?? gate.blockedByTrait}`,
    gate.requiresStat && `${names[gate.requiresStat.stat]} ${gate.requiresStat.min}+`,
  ].filter(Boolean);
  return labels.length ? `[${labels.join(", ")}] ` : "";
}
export function charmGain(value: number, charm: number): number {
  return value > 0 ? Math.max(1, value + charm - 3) : value;
}
export function formalBonus(gravitas: number): number {
  return Math.min(2, Math.max(0, gravitas - 3));
}
export function missedEffects(effects: Effects, deniability: number): Effects {
  const factor = Math.max(0, 1 - (deniability - 3) * 0.1);
  return Object.fromEntries(
    Object.entries(effects).map(([key, value]) => [
      key,
      value < 0 ? Math.trunc(value * factor) : value,
    ]),
  ) as Effects;
}
export function overnightRecovery(stamina: number): number {
  return Math.max(0, 25 + (stamina - 3) * 5);
}
export function accidentalReplyAll(seed: number, day: number, id: string): boolean {
  const hash = [...id].reduce(
    (n, char) => (Math.imul(n, 31) + char.charCodeAt(0)) >>> 0,
    (seed + day) >>> 0,
  );
  return hash % 4 === 0;
}
export function socialBonus(liver: number, drinks: boolean): number {
  return drinks && liver >= 4 ? 1 : 0;
}
