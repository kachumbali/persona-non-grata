import { beforeEach, describe, expect, it } from "vitest";
import { availableFunds, baselineTime, initialEconomy, participantTime, validatePlan } from "./economy";
import { EMAILS, type PendingDecision } from "./rules";
import { useGame } from "./store";

const action = (id: string, overrides: Partial<PendingDecision> = {}): PendingDecision => ({ id, kind: "work", source: id, text: id, effects: {}, timeCost: 1, ...overrides });
beforeEach(() => {
  useGame.getState().start({ title: "Dr", name: "Economist", face: 0, bio: "", traits: [] });
  useGame.setState({ events: [], handled: Object.fromEntries(EMAILS.map((e) => [e.id, "reply"])) });
});
describe("Chapter 1 time and money", () => {
  it("starts with ƒ10,000 and reserves ƒ5,500, leaving ƒ4,500", () => {
    expect(initialEconomy().funds).toBe(10000);
    expect(initialEconomy().ringFence).toBe(5500);
    expect(availableFunds(initialEconomy(), [])).toBe(4500);
  });
  it("allows two 1-TP actions but rejects a third", () => {
    const q = useGame.getState().queue;
    expect(q(action("a"))).toBe(true);
    expect(q(action("b", { kind: "email" }))).toBe(true);
    expect(q(action("c", { kind: "social" }))).toBe(false);
    expect(useGame.getState().block).toBe(0);
  });
  it("charges colleague coffee and lunch one TP, dinner zero official TP", () => {
    const social = action("meal", { kind: "social", worker: "pavel" });
    expect(participantTime(social, "pavel", 0)).toBe(1);
    expect(participantTime(social, "pavel", 1)).toBe(1);
    expect(participantTime(social, "pavel", 3)).toBe(0);
  });
  it("reserves four daily baseline TP for each colleague", () => {
    expect([0, 1, 2].reduce((n, b) => n + baselineTime("pavel", b), 0)).toBe(4);
    expect(baselineTime("pavel", 3)).toBe(0);
  });
  it("requires explicit displacement and penalises neglected baseline duties", () => {
    const work = action("task", { worker: "pavel", timeCost: 0 });
    expect(useGame.getState().queue(work)).toBe(false);
    expect(useGame.getState().queue({ ...work, overload: true })).toBe(true);
    useGame.getState().advance();
    expect(useGame.getState().colleagues["pavel"]?.fatigue).toBe(28);
    expect(useGame.getState().meters.confidence).toBe(54);
  });
  it("caps each colleague at 2 TP even with displacement", () => {
    expect(validatePlan([action("a", { worker: "pavel", timeCost: 0, overload: true }), action("b", { kind: "dialogue", worker: "pavel", overload: true })], 0, initialEconomy())).toContain("only 2 TP");
  });
  it("retains the old plan when an atomic replacement is unaffordable", () => {
    useGame.getState().queue(action("original"));
    expect(useGame.getState().queue(action("replacement", { cashCost: 4501, timeCost: 2 }), true)).toBe(false);
    expect(useGame.getState().pending.map((p) => p.id)).toEqual(["original"]);
  });
  it("charges reserved spending once on resolution and frees it on removal", () => {
    useGame.getState().queue(action("bill", { cashCost: 280 }));
    expect(availableFunds(useGame.getState().economy, useGame.getState().pending)).toBe(4220);
    useGame.getState().removeDecision("bill");
    expect(availableFunds(useGame.getState().economy, [])).toBe(4500);
    useGame.getState().queue(action("bill", { cashCost: 280 }));
    useGame.getState().advance();
    expect(useGame.getState().economy.funds).toBe(9720);
  });
  it("grants the one-off ƒ1,500 supplement two blocks after paperwork, at HQ cost 5", () => {
    useGame.getState().requestSupplement();
    useGame.getState().advance();
    expect(useGame.getState().meters.confidence).toBe(50);
    expect(useGame.getState().economy.funds).toBe(10000);
    useGame.getState().advance();
    expect(useGame.getState().economy.funds).toBe(10000);
    useGame.getState().advance();
    expect(useGame.getState().economy.funds).toBe(11500);
    useGame.getState().requestSupplement();
    expect(useGame.getState().pending).toEqual([]);
  });
  it("releases ƒ500 only from reserves, with actual HQ goodwill penalty", () => {
    useGame.getState().raidReserve();
    expect(useGame.getState().economy.ringFence).toBe(5000);
    expect(useGame.getState().economy.funds).toBe(10000);
    expect(useGame.getState().goodwillHistory.at(-1)?.after.confidence).toBe(50);
  });
  it("reserves both golf blocks and pays only once", () => {
    useGame.getState().queue(action("golf", { timeCost: 2, remainingBlocks: 2, cashCost: 400, score: 3 }));
    useGame.getState().advance();
    expect(useGame.getState().score).toBe(0);
    expect(useGame.getState().queue(action("extra"))).toBe(false);
    useGame.getState().removeDecision("golf");
    expect(useGame.getState().pending).toHaveLength(1);
    useGame.getState().advance();
    expect(useGame.getState().score).toBe(3);
    expect(useGame.getState().economy.funds).toBe(9600);
  });
  it("revalidates yesterday atomically against today's funds", () => {
    useGame.setState({ yesterday: { 0: [action("expensive", { cashCost: 4501 })] } });
    useGame.getState().queue(action("kept"));
    useGame.getState().repeatYesterday();
    expect(useGame.getState().pending[0]?.id).toBe("kept");
  });
  it("migrates legacy savings into currency while retaining a legal pending plan", async () => {
    const migrate = useGame.persist.getOptions().migrate;
    if (!migrate) throw new Error("Save migration missing");
    const migrated = await migrate({ day: 3, block: 1, meters: { budget: 60 }, pending: [action("rest")] }, 2);
    expect(migrated.economy.funds).toBe(10000);
    expect(migrated.block).toBe(1);
    expect(migrated.pending[0]?.id).toBe("rest");
  });
});