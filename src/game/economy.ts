import { activeChapter } from "./chapters";
import { emptyProgress, missionReserve as reserveFor } from "./mission";
import { campaign, computeStats, type PendingDecision } from "./rules";

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
  activeChapter().staffDuties[id] ?? "Routine embassy duties";

export const startFunds = () => activeChapter().manifest.economy.startFunds;
export const visitReserves = () => activeChapter().manifest.economy.visitReserves;
export const startRingFence = () => Object.values(visitReserves()).reduce((a, b) => a + b, 0);
export const supplement = () => activeChapter().manifest.economy.supplement;
export const reserveRelease = () => activeChapter().manifest.economy.reserveRelease;
export const lateFuel = () => activeChapter().manifest.economy.lateFuel;
export const money = (n: number) => `ƒ${n.toLocaleString("en-US")}`;
export interface Economy {
  funds: number;
  ringFence: number;
  /**
   * Cash set aside for the mission steps still to do (step costs plus what a setback could add).
   * It is part of `funds` but not available for anything else; completing a step pays from it.
   * Missing in saves from before the steps; the store restores it.
   */
  missionReserve?: number;
  supplementDue: number | null;
  supplementUsed: boolean;
}
export const initialEconomy = (): Economy => ({
  funds: startFunds(),
  ringFence: startRingFence(),
  missionReserve: reserveFor(emptyProgress()),
  supplementDue: null,
  supplementUsed: false,
});
export function decisionCash(p: PendingDecision): number {
  return p.cashCost ?? Math.max(0, -(p.effects.budget ?? 0) * 100);
}
/** The part of a decision's cash that is optional spending (not a mission step's own cost). */
export const optionalCash = (p: PendingDecision): number =>
  Math.max(0, decisionCash(p) - (p.stepCost ?? 0));
/** Optional spending: funds above the visit reserves, the mission reserve and what is planned. */
export function availableFunds(e: Economy, plan: PendingDecision[]): number {
  return (
    e.funds - e.ringFence - (e.missionReserve ?? 0) - plan.reduce((n, p) => n + optionalCash(p), 0)
  );
}
/** What the plan's mission steps will draw from the reserve (a step counted once). */
export function stepCashInPlan(plan: PendingDecision[]): number {
  const byStep = new Map<string, number>();
  for (const p of plan) {
    if (!p.step) continue;
    const key = `${p.task}.${p.step}`;
    byStep.set(key, Math.max(byStep.get(key) ?? 0, p.stepCost ?? 0));
  }
  return [...byStep.values()].reduce((a, b) => a + b, 0);
}
/** The mission reserve once the steps in `progress` are done. */
export const missionReserveFor = reserveFor;
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
  const index = campaign()
    .characters.filter((c) => c.location === activeChapter().manifest.officeLocation)
    .findIndex((c) => c.id === id);
  if (index < 0 || block === 3) return 0;
  return block === index % 3 ? 2 : 1;
}
export function capacityLedger(plan: PendingDecision[], block: number, playerDP = PLAYER_DP) {
  return ["self", ...campaign().characters.map((c) => c.id)].map((id) => {
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
  if (block === 3 && plan.some((p) => !p.demarcheId && p.remainingBlocks && p.remainingBlocks > 1))
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
  const optional = plan.reduce((n, p) => n + optionalCash(p), 0);
  if (optional > 0 && availableFunds(economy, plan) < 0)
    return "Insufficient discretionary funds; visit costs remain ring-fenced.";
  if (economy.funds < stepCashInPlan(plan)) return "Insufficient funds for this mission step.";
  for (const row of capacityLedger(plan, block, playerDP)) {
    const capacity = row.id === "self" ? playerDP : STAFF_DP;
    if (row.used > capacity)
      return `${row.id === "self" ? "You have" : row.id + " has"} only ${capacity} DP this block.`;
    if (row.id === "self") continue;
    const colleague =
      campaign().characters.find((c) => c.id === row.id)?.location ===
      activeChapter().manifest.officeLocation;
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
