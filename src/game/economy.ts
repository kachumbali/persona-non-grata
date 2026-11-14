import { CAMPAIGN, computeStats, type PendingDecision } from "./rules";
import duties from "./data/staff-duties.json";

export const PLAYER_DP = 4;
export const STAFF_DP = 2;
export function playerCapacity(
  character: { traits: string[] } | null,
  energy: number,
  composure: number,
  alcohol: number,
  hangover = false,
) {
  const stats = computeStats(character?.traits ?? []);
  const factors: string[] = [];
  let capacity = PLAYER_DP;
  if (stats.stamina >= 4) {
    capacity++;
    factors.push("Stamina +1");
  }
  if (stats.stamina <= 2) {
    capacity--;
    factors.push("Low stamina −1");
  }
  if (energy < 35) {
    capacity--;
    factors.push("Low energy −1");
  }
  if (composure < 30) {
    capacity--;
    factors.push("Low composure −1");
  }
  if (alcohol >= (stats.liver >= 5 ? 3 : 2)) {
    capacity--;
    factors.push("Alcohol −1");
  }
  if (hangover) {
    capacity--;
    factors.push("Hangover −1");
  }
  return { total: Math.max(2, Math.min(5, capacity)), factors };
}
export const staffDuty = (id: string) =>
  (duties as Record<string, string>)[id] ?? "Routine embassy duties";

export const START_FUNDS = 10_000;
export const VISIT_RESERVES = {
  Reception: 1800,
  Hotel: 1600,
  Transport: 1200,
  Gifts: 400,
  "Generator fuel": 500,
};
export const START_RING_FENCE = Object.values(VISIT_RESERVES).reduce((a, b) => a + b, 0);
export const SUPPLEMENT = { amount: 1500, goodwillCost: 5, delay: 2 };
export const money = (n: number) => `ƒ${n.toLocaleString("en-US")}`;
export interface Economy {
  funds: number;
  ringFence: number;
  supplementDue: number | null;
  supplementUsed: boolean;
}
export const initialEconomy = (): Economy => ({
  funds: START_FUNDS,
  ringFence: START_RING_FENCE,
  supplementDue: null,
  supplementUsed: false,
});
export function decisionCash(p: PendingDecision): number {
  return p.cashCost ?? Math.max(0, -(p.effects.budget ?? 0) * 100);
}
export function availableFunds(e: Economy, plan: PendingDecision[]): number {
  return e.funds - e.ringFence - plan.reduce((n, p) => n + decisionCash(p), 0);
}
export function playerTime(p: PendingDecision): number {
  if (p.timeCost !== undefined) return p.timeCost;
  if (p.kind === "dialogue" || p.kind === "email") return 1;
  if (p.kind === "social") return 2;
  if (p.kind === "event") return p.playerSlot ? 2 : p.worker ? 0 : 1;
  return p.worker ? 0 : p.id === "rest" ? 1 : 2;
}
export function participantTime(p: PendingDecision, id: string, block: number): number {
  if (id === "self") return playerTime(p);
  if (p.worker !== id && p.partner !== id) return 0;
  if (p.kind === "social") return block === 3 ? 0 : (p.guestTime ?? 1);
  if (p.kind === "dialogue") return block === 3 ? 0 : 1;
  return 2;
}
// Four baseline DP daily, with two free DP distributed across office blocks.
export function baselineTime(id: string, block: number): number {
  const index = CAMPAIGN.characters
    .filter((c) => c.location === "embassy")
    .findIndex((c) => c.id === id);
  if (index < 0 || block === 3) return 0;
  return block === index % 3 ? 2 : 1;
}
export function capacityLedger(plan: PendingDecision[], block: number, playerDP = PLAYER_DP) {
  return ["self", ...CAMPAIGN.characters.map((c) => c.id)].map((id) => {
    const used = plan.reduce((n, p) => n + participantTime(p, id, block), 0);
    const baseline = baselineTime(id, block);
    const capacity = id === "self" ? playerDP : STAFF_DP;
    const displaced = Math.max(0, baseline + used - capacity);
    return { id, used, baseline, free: Math.max(0, capacity - baseline - used), displaced };
  });
}
export function validatePlan(
  plan: PendingDecision[],
  block: number,
  economy: Economy,
  playerDP = PLAYER_DP,
): string | null {
  if (new Set(plan.map((p) => p.id)).size !== plan.length)
    return "That commitment is already in your diary.";
  if (block === 3 && plan.some((p) => p.remainingBlocks && p.remainingBlocks > 1))
    return "Golf requires two consecutive office blocks.";
  if (
    plan.some(
      (p) =>
        !Number.isInteger(playerTime(p)) ||
        playerTime(p) < 0 ||
        decisionCash(p) < 0 ||
        !Number.isFinite(decisionCash(p)),
    )
  )
    return "Invalid activity cost.";
  if (availableFunds(economy, plan) < 0)
    return "Insufficient discretionary funds; visit costs remain ring-fenced.";
  for (const row of capacityLedger(plan, block, playerDP)) {
    const capacity = row.id === "self" ? playerDP : STAFF_DP;
    if (row.used > capacity)
      return `${row.id === "self" ? "You have" : row.id + " has"} only ${capacity} DP this block.`;
    if (row.id === "self") continue;
    const colleague = CAMPAIGN.characters.find((c) => c.id === row.id)?.location === "embassy";
    if (colleague && block === 3 && row.used > 0)
      return "Colleagues are off duty; dinner is social, not an extra work shift.";
    let scheduled = 0;
    for (const p of plan) {
      const time = participantTime(p, row.id, block);
      if (time && row.baseline + scheduled + time > capacity && !p.overload)
        return `${row.id}'s baseline duties conflict. Explicitly authorise displacement of their routine duties.`;
      scheduled += time;
    }
  }
  return null;
}
