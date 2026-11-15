import { describe, expect, it } from "vitest";
import { activeChapter } from "./chapters";
import { firstImpression, relationshipState, teamworkChange } from "./relationships";
import { computeStats, pairKey } from "./rules";
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
