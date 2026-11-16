import { beforeEach, describe, expect, it } from "vitest";
import { advancePersonnel, createPersonnel, effectiveTraits, REPUTATIONS } from "./personnel";
import { computeStats } from "./rules";
import { useGame } from "./store";
import { eligible } from "./character";
import { clippingTriggered } from "./press";
const starting = ["replyall"];
const initial = () => createPersonnel(starting, computeStats(starting));
describe("personnel progression", () => {
  it("replaces the oldest reputation and records both changes", () => {
    const p = initial();
    p.reputations = ["biscuit-hawk", "team-europe", "known-to-fax"];
    p.earnedReputations = [...p.reputations];
    const { state, lines } = advancePersonnel(p, { credit: 3 }, 2, 0);
    expect(state.reputations).toEqual(["team-europe", "known-to-fax", "credit-taker"]);
    expect(lines).toHaveLength(2);
  });
  it("cures a flaw and includes the earned trait in stats and gates", () => {
    const { state } = advancePersonnel(initial(), { recalls: 5 }, 4, 0);
    expect(state.earnedQuirks).toContain("recovering-replyall");
    expect(state.curedTraits).toContain("replyall");
    const traits = effectiveTraits(starting, state.earnedQuirks, state.curedTraits);
    expect(traits).not.toContain("replyall");
    expect(computeStats(traits).deniability).toBe(4);
  });
  it("limits awards to three per posting", () => {
    const { state } = advancePersonnel(
      initial(),
      { formal: 100, capital: 100, team: 100, rules: 100, drinks: 100 },
      5,
      0,
    );
    expect(state.notices).toHaveLength(3);
  });
  it("migrates an old posting without backdated counters", async () => {
    const old = await useGame.persist.getOptions().migrate!(
      {
        character: { title: "Mx", name: "Old", bio: "", portrait: "diplomat-1", traits: starting },
        day: 8,
      },
      13,
    );
    expect(old.personnel.counters).toEqual({});
    expect(old.personnel.start.traits).toEqual(starting);
  });
  it("has fourteen unique reputations", () =>
    expect(new Set(REPUTATIONS.map((r) => r.id)).size).toBe(14));
});
describe("resolution", () => {
  beforeEach(() =>
    useGame
      .getState()
      .start({ title: "Mx", name: "Tester", portrait: "diplomat-1", bio: "", traits: [] }),
  );
  it("unlocks its gated choice and the matching press clipping", () => {
    const s = useGame.getState();
    expect(eligible({ requiresReputation: "credit-taker" }, [], computeStats([]), [])).toBe(false);
    expect(
      eligible({ requiresReputation: "credit-taker" }, [], computeStats([]), ["credit-taker"]),
    ).toBe(true);
    const clipping = {
      id: "test",
      outlet: "vale",
      headline: "Test",
      body: "Test",
      priority: 1,
      trigger: { reputation: "credit-taker" },
    };
    expect(clippingTriggered(clipping, { ...s, personnel: { reputations: [] } })).toBe(false);
    expect(
      clippingTriggered(clipping, { ...s, personnel: { reputations: ["credit-taker"] } }),
    ).toBe(true);
  });
  it("records authored counters and drift once on block resolution", () => {
    expect(
      useGame.getState().queue({
        id: "test",
        kind: "event",
        source: "Decision",
        text: "Done.",
        effects: {},
        counts: ["credit"],
        statDrift: { stat: "gravitas", delta: 1 },
      }),
    ).toBe(true);
    useGame.getState().advance();
    const s = useGame.getState();
    expect(s.personnel.counters["credit"]).toBe(1);
    expect(computeStats(s.character!.traits, s.character!.statDrift).gravitas).toBe(4);
    expect(s.report.some((x) => x.text.includes("gravitas +1"))).toBe(true);
  });
});
