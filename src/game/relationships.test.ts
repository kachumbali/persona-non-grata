import { describe, expect, it } from "vitest";
import { activeChapter } from "./chapters";
import { firstImpression, relationshipState, teamworkChange } from "./relationships";
import { computeStats, pairKey, relationshipGateMet } from "./rules";
import { useGame } from "./store";

describe("relationship web", () => {
  it("names each threshold consistently", () => {
    expect([10, 20, 40, 50, 70, 90].map(relationshipState)).toEqual([
      "feud",
      "rival",
      "wary",
      "neutral",
      "friendly",
      "ally",
    ]);
  });
  it("offers authored scenes only when the pair and tag match", () => {
    const scene = activeChapter().campaign.events.find((event) => event.id === "web-partners")!;
    expect(relationshipGateMet(scene, { [pairKey("eu-france", "eu-germany")]: 25 })).toBe(true);
    expect(relationshipGateMet(scene, { [pairKey("eu-france", "eu-germany")]: 90 })).toBe(false);
    expect(activeChapter().campaign.events.filter((event) => event.relationshipGate)).toHaveLength(
      10,
    );
  });
  it("applies an affinity and a clash from authored traits", () => {
    const people = activeChapter().campaign.characters;
    const klaus = people.find((p) => p.id === "eu-germany")!;
    const maxim = people.find((p) => p.id === "maxim")!;
    expect(firstImpression(klaus, ["brussels"], computeStats(["brussels"]))).toBeGreaterThan(0);
    expect(teamworkChange(klaus, maxim)).toBeLessThan(0);
  });
  it("retains old numbers while introducing authored pairs on migration", async () => {
    const migrated = await useGame.persist.getOptions().migrate!(
      { relationships: { [pairKey("anselm", "pavel")]: 42 } },
      12,
    );
    expect(migrated.relationships[pairKey("anselm", "pavel")]).toBe(42);
    expect(migrated.relationships[pairKey("eu-france", "eu-germany")]).toBe(25);
    expect(migrated.metPeople).toEqual([]);
  });
  it("discovers a person only once", () => {
    useGame.getState().start({
      title: "Mx",
      name: "Tester",
      portrait: "diplomat-1",
      bio: "",
      traits: ["brussels"],
    });
    useGame.getState().selectNpc("eu-germany");
    const trust = useGame.getState().colleagues["eu-germany"]!.trust;
    useGame.getState().selectNpc("eu-germany");
    expect(useGame.getState().colleagues["eu-germany"]!.trust).toBe(trust);
    expect(useGame.getState().discoveredTraits["eu-germany"]).toHaveLength(1);
  });
});

describe("relationship scenes", () => {
  it("records a choice changing a pair and the resulting state in the report", () => {
    useGame
      .getState()
      .start({ title: "Mx", name: "Tester", portrait: "diplomat-1", bio: "", traits: [] });
    const scene = activeChapter().campaign.events.find((e) => e.id === "web-joint")!;
    useGame.setState({
      events: [scene],
      handled: Object.fromEntries(activeChapter().emails.map((e) => [e.id, "reply"])),
    });
    expect(
      useGame.getState().queue({
        id: "test-web",
        kind: "event",
        source: scene.title,
        text: "The names fit.",
        effects: {},
        eventId: scene.id,
        eventChoice: "repair",
        worker: "anselm",
        pair: 18,
        pairTarget: "pavel",
        timeCost: 1,
        overload: true,
      }),
    ).toBe(true);
    useGame.getState().advance();
    const s = useGame.getState();
    expect(s.relationships[pairKey("anselm", "pavel")]).toBe(38);
    expect(s.playerPairChanges).toContain(pairKey("anselm", "pavel"));
    expect(s.relationshipHistory).toContainEqual(
      expect.objectContaining({ pair: pairKey("anselm", "pavel"), from: "rival", to: "wary" }),
    );
    expect(s.report.some((entry) => entry.text.includes("rival has become wary"))).toBe(true);
  });
  it("worsens a dispute when its scene is ignored", () => {
    useGame
      .getState()
      .start({ title: "Mx", name: "Tester", portrait: "diplomat-1", bio: "", traits: [] });
    const scene = activeChapter().campaign.events.find((e) => e.id === "web-joint")!;
    useGame.setState({
      events: [scene],
      handled: Object.fromEntries(activeChapter().emails.map((e) => [e.id, "reply"])),
    });
    useGame.getState().advance();
    expect(useGame.getState().relationships[pairKey("anselm", "pavel")]).toBe(12);
    expect(useGame.getState().playerPairChanges).toEqual([]);
  });
});
