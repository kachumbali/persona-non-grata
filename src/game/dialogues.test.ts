import { describe, expect, it } from "vitest";
import { pickTopic, splitEffects, topicsFor } from "./dialogues";
import { CAMPAIGN } from "./rules";

describe("character dialogues", () => {
  it("every character has their own topics", () => {
    for (const c of CAMPAIGN.characters) expect(topicsFor(c.id).length).toBeGreaterThanOrEqual(2);
  });
  it("no two characters open with the same line", () => {
    const lines = CAMPAIGN.characters.flatMap((c) => topicsFor(c.id).map((t) => t.nodes[t.start]?.text));
    expect(new Set(lines).size).toBe(lines.length);
  });
  it("finished topics are skipped while others remain", () => {
    const [a, b] = topicsFor("pavel") as [import("./dialogues").Topic, import("./dialogues").Topic];
    for (let block = 0; block < 4; block++) expect(pickTopic("pavel", 1, block, [`pavel:${a.id}`])?.id).toBe(b.id);
  });
  it("money in a dialogue becomes a cash cost", () => {
    expect(splitEffects({ money: -400, goodwill: 2 })).toEqual({ meters: { goodwill: 2 }, energy: 0, cash: 400 });
  });
});
