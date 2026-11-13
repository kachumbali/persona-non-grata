import { describe, expect, it } from "vitest";
import { applyEffects, pickEnding, pointsLeft, START_METERS } from "./rules";

describe("game rules", () => {
  it("meters stay between 0 and 100", () => {
    expect(applyEffects(START_METERS, { budget: -500 }).budget).toBe(0);
    expect(applyEffects(START_METERS, { sanity: 500 }).sanity).toBe(100);
  });
  it("zero host goodwill ends the game as persona non grata", () => {
    expect(pickEnding({ ...START_METERS, goodwill: 0 }, false)).toBe("png");
  });
  it("no ending before day 15 while meters are above zero", () => {
    expect(pickEnding(START_METERS, false)).toBeNull();
  });
  it("high confidence and goodwill on day 15 is Promoted Sideways", () => {
    expect(pickEnding({ ...START_METERS, confidence: 70, goodwill: 60 }, true)).toBe("promoted");
  });
  it("negative traits refund points", () => {
    expect(pointsLeft(["replyall"])).toBe(5);
    expect(pointsLeft(["liver", "eyesopen"])).toBe(-1);
  });
});
