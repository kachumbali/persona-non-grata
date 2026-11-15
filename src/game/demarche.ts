/** Pure scheduling and outcomes for Capital's démarche instructions. */
import { activeChapter } from "./chapters";
import { charmGain, formalBonus, missedEffects } from "./character";
import { computeStats } from "./rules";
import type { Demarche, DemarcheRoute } from "./chapters/types";

export type DemarcheQuality = "good" | "adequate" | "failed";
export type DemarcheStatus =
  "new" | "in-progress" | "delivered" | "missed" | "superseded" | "skipped";
export interface DemarcheRecord {
  status: DemarcheStatus;
  coordinated?: boolean;
  deliveryPending?: boolean;
  quality?: DemarcheQuality;
  route?: DemarcheRoute["kind"];
  worker?: string;
  incident?: boolean;
  resolvedDay?: number;
  resolvedBlock?: number;
}
export type DemarcheProgress = Record<string, DemarcheRecord>;
export const demarches = () => activeChapter().demarches.instructions;
export const demarcheAt = (id: string) => demarches().find((item) => item.id === id);
export const tick = (day: number, block: number) => (day - 1) * 4 + block;
export function issued(d: Demarche, day: number, block: number) {
  return tick(day, block) >= tick(d.issuedDay, d.issuedBlock);
}
export function isSuperseded(d: Demarche, day: number, block: number) {
  return !!d.supersededBy && tick(day, block) >= tick(d.supersededBy.day, d.supersededBy.block);
}
export function statusOf(
  d: Demarche,
  progress: DemarcheProgress,
  day: number,
  block: number,
): DemarcheStatus | "future" {
  if (!issued(d, day, block)) return "future";
  const saved = progress[d.id];
  if (saved && ["delivered", "missed", "skipped"].includes(saved.status)) return saved.status;
  if (isSuperseded(d, day, block)) return "superseded";
  return saved?.status ?? "new";
}
/** Expired instructions from an old save are skipped, not charged retroactively. */
export function migrateDemarches(day: number, block: number): DemarcheProgress {
  return Object.fromEntries(
    demarches()
      .filter((d) => tick(d.deadlineDay, d.deadlineBlock) < tick(day, block))
      .map((d) => [d.id, { status: "skipped" as const }]),
  );
}
export interface DeliveryContext {
  day: number;
  block: number;
  traits: string[];
  recipientTrust: number;
  euTrust: number;
  partnerTrust: number;
  facts: string[];
  worker?: string;
  delegationSucceeded?: boolean;
  delayApplied?: boolean;
}
export interface DeliveryOutcome {
  quality: DemarcheQuality;
  incident: boolean;
  text: string;
  confidence: number;
  goodwill: number;
  trust: number;
}
const rank = { desk: 0, director: 1, "deputy-minister": 2 } as const;
export function resolveDemarche(
  d: Demarche,
  route: DemarcheRoute,
  ctx: DeliveryContext,
): DeliveryOutcome {
  const stats = computeStats(ctx.traits);
  const letterheadDelay = route.kind === "eu" && ctx.euTrust + ctx.partnerTrust < 100;
  const late =
    tick(ctx.day, ctx.block) + (letterheadDelay && !ctx.delayApplied ? 1 : 0) >
    tick(d.deadlineDay, d.deadlineBlock);
  const superseded = isSuperseded(d, ctx.day, ctx.block);
  const staffLevel = ctx.worker
    ? (activeChapter().demarches.colleagueLevels[ctx.worker] ?? "desk")
    : "desk";
  const incident = route.kind === "colleague" && rank[staffLevel] < rank[d.level];
  let quality: DemarcheQuality = "adequate";
  if (late || superseded || (route.kind === "colleague" && !ctx.delegationSucceeded))
    quality = "failed";
  else if (route.kind === "self")
    quality =
      ctx.recipientTrust +
        formalBonus(stats.gravitas) * 10 +
        (d.fact && ctx.facts.includes(d.fact) ? 10 : 0) >=
      55
        ? "good"
        : "adequate";
  else if (route.kind === "eu")
    quality =
      d.level !== "deputy-minister" && ctx.euTrust + ctx.partnerTrust >= 100 ? "good" : "adequate";
  else if (route.kind === "colleague") quality = incident ? "adequate" : "good";
  const base =
    quality === "good"
      ? { confidence: 3, goodwill: 2 }
      : quality === "adequate"
        ? { confidence: d.level === "desk" ? 1 : -1, goodwill: 0 }
        : { confidence: -4, goodwill: -2 };
  const adjusted = quality === "failed" ? missedEffects(base, stats.deniability) : base;
  const incidentCost = incident ? (ctx.worker === "maxim" && d.level !== "desk" ? -4 : -2) : 0;
  const personality = ctx.worker ? activeChapter().demarches.colleagueLines[ctx.worker] : undefined;
  const text = superseded
    ? "The superseded protest is delivered. Capital asks which instruction you read."
    : late
      ? letterheadDelay
        ? "The letterhead dispute outlasted the deadline."
        : "The deadline passed before the note arrived."
      : personality && route.kind === "colleague"
        ? personality
        : route.kind === "eu"
          ? "Celeste delivers the note under a Team Europe cover."
          : "The instruction is delivered and recorded.";
  return {
    quality,
    incident,
    text,
    confidence: adjusted.confidence ?? 0,
    goodwill:
      (adjusted.goodwill ?? 0) + incidentCost + (route.kind === "eu" && quality === "good" ? 1 : 0),
    trust: quality === "good" ? charmGain(2, stats.charm) : quality === "failed" ? -2 : 0,
  };
}

/** Normalise a board assignment before the existing atomic capacity validation. */
export function planDemarche(
  s: {
    day: number;
    block: number;
    location: string;
    character: { traits: string[] } | null;
    colleagues: Record<string, { trust: number }>;
    demarches: DemarcheProgress;
    pending: import("./rules").PendingDecision[];
  },
  decision: import("./rules").PendingDecision,
): import("./rules").PendingDecision | string {
  if (!decision.demarcheId) return decision;
  const d = demarcheAt(decision.demarcheId);
  if (!d || !s.character) return "No such démarche.";
  const status = statusOf(d, s.demarches, s.day, s.block);
  if (status === "future") return "This instruction has not arrived.";
  if (status === "delivered" || status === "missed" || status === "skipped")
    return "This instruction is already closed.";
  if (tick(s.day, s.block) > tick(d.deadlineDay, d.deadlineBlock))
    return "The deadline has passed.";
  if (s.pending.some((item) => item.demarcheId === d.id))
    return "This démarche is already in your diary.";
  if (s.demarches[d.id]?.deliveryPending) return "The joint note is already in transit.";
  const kind = decision.demarcheRoute;
  if (kind === "coordinate") {
    if (s.location !== "eu") return "Travel to the EU Delegation to coordinate.";
    if (s.demarches[d.id]?.coordinated) return "EU coordination is already complete.";
    return { ...decision, kind: "work", worker: undefined, timeCost: 1, cashCost: 0 };
  }
  const route = d.routes.find((item) => item.kind === kind);
  if (!route) return "Choose a delivery route.";
  const recipient = activeChapter().campaign.characters.find((person) => person.id === d.recipient);
  if (kind === "self" && s.location !== recipient?.location)
    return `Travel to ${recipient?.name ?? "the recipient"} first.`;
  if (kind === "eu" && (s.location !== "eu" || !s.demarches[d.id]?.coordinated))
    return "Coordinate at the EU Delegation first.";
  if (kind === "colleague" || kind === "note") {
    if (
      !decision.worker ||
      !activeChapter().campaign.characters.some(
        (person) =>
          person.id === decision.worker &&
          person.location === activeChapter().manifest.officeLocation,
      )
    )
      return "Choose an embassy colleague.";
  }
  if (
    decision.demarcheTrait &&
    !d.traitOptions?.some(
      (option) =>
        option.id === decision.demarcheTrait && s.character!.traits.includes(option.requiresTrait),
    )
  )
    return "That trait option is unavailable.";
  const partnerTrust =
    ((s.colleagues["eu-france"]?.trust ?? 50) + (s.colleagues["eu-germany"]?.trust ?? 50)) / 2;
  const delayed = kind === "eu" && (s.colleagues["eu"]?.trust ?? 0) + partnerTrust < 100;
  return {
    ...decision,
    kind: "work",
    worker: kind === "self" || kind === "eu" ? undefined : decision.worker,
    timeCost: route.dp,
    cashCost: 0,
    remainingBlocks: delayed ? 2 : undefined,
  };
}
