import data from "./data/press.json";
import type { ColleagueState, Meters, PendingDecision, StoryOutcome } from "./rules";

type Trigger = {
  flag?: string;
  notFlag?: string;
  outcome?: { eventId: string; choice?: string; status?: string };
  trait?: string;
  meterBelow?: { key: keyof Meters; value: number };
  trustBelow?: { id: string; value: number };
};
export type Clipping = {
  id: string;
  outlet: string;
  headline: string;
  body: string;
  day?: number;
  minDay?: number;
  maxDay?: number;
  priority: number;
  trigger?: Trigger;
  signal?: boolean;
  once?: boolean;
  capital?: { confidence: number };
  maxim?: { headline: string; body: string };
};
export type PressState = {
  seed: number;
  storyFlags: string[];
  storyOutcomes: Record<string, StoryOutcome>;
  meters: Meters;
  colleagues: Record<string, ColleagueState>;
  yesterday: Record<number, PendingDecision[]>;
  pressSeen: string[];
};
export const outlets = data.outlets;
export const clippings = data.clippings as Clipping[];
export function clippingTriggered(c: Clipping, s: PressState): boolean {
  const t = c.trigger;
  if (!t) return true;
  const o = t.outcome && s.storyOutcomes[t.outcome.eventId];
  return (
    (!t.flag || s.storyFlags.includes(t.flag)) &&
    (!t.notFlag || !s.storyFlags.includes(t.notFlag)) &&
    (!t.outcome ||
      (!!o &&
        (!t.outcome.choice || o.choice === t.outcome.choice) &&
        (!t.outcome.status || o.status === t.outcome.status))) &&
    (!t.trait ||
      s.storyFlags.some(
        (f) => f.startsWith(`trait:${t.trait}:`) || f.startsWith(`trait-${t.trait}:`),
      )) &&
    (!t.meterBelow || s.meters[t.meterBelow.key] < t.meterBelow.value) &&
    (!t.trustBelow || (s.colleagues[t.trustBelow.id]?.trust ?? 100) < t.trustBelow.value)
  );
}
export function pressReview(
  s: PressState,
  day: number,
  translationQuality?: "standard" | "maxim",
): { compiler: "press" | "maxim"; clippings: Clipping[] } {
  const compiler =
    (s.colleagues["press"]?.fatigue ?? 0) >= 70 ||
    (s.yesterday[3] ?? []).some(
      (p) => p.kind === "work" && (p.worker === "press" || p.partner === "press"),
    ) ||
    (s.seed * 31 + day * 17) % 5 === 0
      ? "maxim"
      : "press";
  const valid = clippings.filter(
    (c) =>
      (c.day === undefined || c.day === day) &&
      (c.minDay === undefined || day >= c.minDay) &&
      (c.maxDay === undefined || day <= c.maxDay) &&
      (!c.once || !s.pressSeen.includes(c.id)) &&
      clippingTriggered(c, s),
  );
  const scenarioIds = (data.scenario as Record<string, string[]>)[String(day)] ?? [];
  const scenario = valid.find((c) => scenarioIds.includes(c.id));
  const rank = (c: Clipping) => {
    let h = s.seed + day * 997;
    for (const x of c.id) h = ((h * 33) ^ x.charCodeAt(0)) >>> 0;
    return h;
  };
  const consequences = valid
    .filter((c) => c.trigger && !scenarioIds.includes(c.id))
    .sort((a, b) => b.priority - a.priority || rank(a) - rank(b));
  const filler = valid
    .filter((c) => !c.trigger && !scenarioIds.includes(c.id) && c.id !== "horoscope")
    .sort((a, b) => rank(a) - rank(b));
  const count = compiler === "maxim" ? 3 : 4;
  const selected = [...(scenario ? [scenario] : []), ...consequences, ...filler].slice(0, count);
  if (compiler === "maxim") selected.push(clippings.find((c) => c.id === "horoscope")!);
  return {
    compiler,
    clippings: selected.map((c) =>
      (translationQuality ?? (compiler === "maxim" ? "maxim" : "standard")) === "maxim" && c.maxim
        ? { ...c, ...c.maxim }
        : c,
    ),
  };
}
