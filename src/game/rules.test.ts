import { describe, expect, it } from "vitest";
import { applyEffects, BLOCKS, dailyEvents, goodwillRisk, hospitalityCost, pickEnding, pointsLeft, recordGoodwillChange, socialTrust, START_METERS, visitReady } from "./rules";

const ready = { clearance: true, lounge: true, programme: true, security: true };

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
    expect(pickEnding({ ...START_METERS, confidence: 70, goodwill: 60 }, true, ready)).toBe("promoted");
  });
  it("negative traits refund points", () => {
    expect(pointsLeft(["replyall"])).toBe(5);
    expect(pointsLeft(["liver", "eyesopen"])).toBe(-1);
  });
  it("zero HQ goodwill replaces the player", () => {
    expect(pickEnding({ ...START_METERS, confidence: 0 }, false)).toBe("replaced");
  });
  it("an unconfirmed programme cancels the visit on arrival", () => {
    expect(pickEnding(START_METERS, true, { ...ready, programme: false })).toBe("cancelled");
  });
  it("other missing essential arrangements also fail the visit", () => {
    expect(visitReady({ ...ready, clearance: false })).toBe(false);
    expect(pickEnding(START_METERS, true, { ...ready, clearance: false })).toBe("cancelled");
  });
  it("positive goodwill does not trigger replacement or PNG at arrival", () => {
    expect(pickEnding({ ...START_METERS, confidence: 1, goodwill: 1 }, true, ready)).toBe("ambassador");
  });
  it("warns below the risk thresholds", () => {
    expect(goodwillRisk(25)).toBe("warning");
    expect(goodwillRisk(10)).toBe("critical");
    expect(goodwillRisk(26)).toBe("stable");
  });
  it("records actual clamped goodwill changes rather than nominal penalties", () => {
    const before = { ...START_METERS, confidence: 4 };
    const after = applyEffects(before, { confidence: -12, goodwill: 3 });
    const entry = recordGoodwillChange(before, after, { day: 1, time: 500, source: "Instruction", kind: "Missed instruction", text: "Deadline missed" });
    expect(entry.after.confidence - entry.before.confidence).toBe(-4);
    expect(entry.after.goodwill - entry.before.goodwill).toBe(3);
  });
  it("has two coffee occasions, one lunch and one dinner daily", () => {
    expect(BLOCKS.filter((b) => b.social.startsWith("Coffee")).length).toBe(2);
    expect(BLOCKS.filter((b) => b.social === "Lunch").length).toBe(1);
    expect(BLOCKS.filter((b) => b.social === "Dinner").length).toBe(1);
  });
  it("invited hospitality costs embassy funds but solo meals do not", () => {
    expect(hospitalityCost("bling", 1, 1)).toBe(20);
    expect(hospitalityCost("local", 1, 1)).toBe(4);
    expect(hospitalityCost("bling", 0, 1)).toBe(0);
  });
  it("venue likes and dislikes affect relationships", () => {
    expect(socialTrust("development", "local", false)).toBe(6);
    expect(socialTrust("development", "bling", false)).toBe(-5);
  });
  it("work at dinner costs relationship goodwill", () => {
    expect(socialTrust("pavel", "classic", true)).toBe(-4);
    expect(socialTrust("pavel", "classic", false)).toBe(6);
  });
  it("selects one to three stable small episodes for each day", () => {
    for (let day = 1; day <= 15; day++) {
      const events = dailyEvents(day, 23, []);
      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events.length).toBeLessThanOrEqual(3);
      expect(dailyEvents(day, 23, [])).toEqual(events);
    }
  });
});
