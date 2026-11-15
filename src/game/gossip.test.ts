import { beforeEach, describe, expect, it } from "vitest";
import { useGame } from "./store";
import { campaign, emails, pairKey } from "./rules";

beforeEach(() => {
  useGame
    .getState()
    .start({ title: "Mx", name: "Tester", portrait: "diplomat-1", bio: "", traits: [] });
  useGame.setState({
    day: 4,
    block: 0,
    minute: 480,
    events: [],
    handled: Object.fromEntries(emails().map((e) => [e.id, "reply"])),
  });
});
describe("gossip", () => {
  it("learns a story from a gossiping knower, once", () => {
    useGame.getState().selectNpc("press");
    expect(useGame.getState().knownFacts).toContain("gossip:supplier");
    useGame.getState().selectNpc("press");
    expect(useGame.getState().knownFacts.filter((f) => f === "gossip:supplier")).toHaveLength(1);
  });
  it("records the cost and relationship change from passing a false story", () => {
    useGame.setState({ knownFacts: ["gossip:fuel-quay"] });
    const s = useGame.getState(),
      before = s.meters.confidence;
    expect(
      s.queue({
        id: "gossip-fuel-quay",
        kind: "dialogue",
        source: "Gossip",
        text: "A rumour.",
        effects: {},
        worker: "anselm",
        timeCost: 1,
        overload: true,
        gossipId: "fuel-quay",
        gossipAction: "pass",
      }),
    ).toBe(true);
    s.advance();
    const result = useGame.getState();
    expect(result.storyFlags).toContain("gossip:false:fuel-quay");
    expect(result.meters.confidence).toBeLessThan(before);
    expect(result.relationships[pairKey("anselm", "port-officer")]).toBe(44);
    expect(result.delayedRouteEffects.some((e) => e.flag === "gossip-reached-fuel-quay")).toBe(
      true,
    );
  });
  it("includes four unreliable stories and four learning channels", () => {
    const gossip = campaign().gossip!;
    expect(gossip).toHaveLength(12);
    expect(gossip.filter((g) => g.truth !== "true").length).toBeGreaterThanOrEqual(4);
    expect(new Set(gossip.map((g) => g.source)).size).toBe(4);
  });
});
