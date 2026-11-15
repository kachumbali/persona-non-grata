import { describe, expect, it } from "vitest";
import { charmGain, formalBonus, missedEffects, overnightRecovery, socialBonus } from "./character";
import { playerCapacity } from "./economy";
import { TRAITS, type StatKey } from "./rules";
import {
  applyEffects,
  blocks,
  campaign,
  dailyEvents,
  expiredStories,
  goodwillRisk,
  locationStories,
  hospitalityCost,
  pickEnding,
  pointsLeft,
  recordGoodwillChange,
  socialTrust,
  startMeters,
  visitReady,
} from "./rules";

const ready = { clearance: true, lounge: true, programme: true, security: true };

describe("game rules", () => {
  describe("every statistic changes a rule result", () => {
    const proven = new Set<StatKey>();
    it("gravitas raises the formal bonus", () => {
      expect(formalBonus(5)).not.toBe(formalBonus(1));
      proven.add("gravitas");
    });
    it("charm raises gains from positive effects", () => {
      expect(charmGain(2, 5)).not.toBe(charmGain(2, 1));
      proven.add("charm");
    });
    it("stamina changes overnight recovery and player capacity", () => {
      expect(overnightRecovery(5)).not.toBe(overnightRecovery(1));
      // "eyesopen" gives stamina 5, "sideevents" gives stamina 1
      expect(playerCapacity({ traits: ["eyesopen"] }, 80, 80, 0).total).not.toBe(
        playerCapacity({ traits: ["sideevents"] }, 80, 80, 0).total,
      );
      proven.add("stamina");
    });
    it("deniability softens the cost of missed instructions", () => {
      const effects = { goodwill: -10 };
      expect(missedEffects(effects, 5)).not.toEqual(missedEffects(effects, 1));
      proven.add("deniability");
    });
    it("liver changes social bonuses and alcohol tolerance", () => {
      expect(socialBonus(5, true)).not.toBe(socialBonus(1, true));
      // "eyesopen" gives stamina 5; adding "liver" gives liver 6 and stamina 4, so both keep the
      // stamina bonus but only the liver trait tolerates two drinks.
      expect(playerCapacity({ traits: ["eyesopen", "liver"] }, 80, 80, 2).total).not.toBe(
        playerCapacity({ traits: ["eyesopen"] }, 80, 80, 2).total,
      );
      proven.add("liver");
    });
    it("proves all five statistics, and every trait modifies a proven one", () => {
      expect([...proven].sort()).toEqual(["charm", "deniability", "gravitas", "liver", "stamina"]);
      for (const trait of TRAITS)
        expect(Object.keys(trait.stats).some((stat) => proven.has(stat as StatKey))).toBe(true);
    });
  });
  it("meters stay between 0 and 100", () => {
    expect(applyEffects(startMeters(), { confidence: -500 }).confidence).toBe(0);
    expect(applyEffects(startMeters(), { sanity: 500 }).sanity).toBe(100);
  });
  it("zero host goodwill ends the game as persona non grata", () => {
    expect(pickEnding({ ...startMeters(), goodwill: 0 }, false)).toBe("png");
  });
  it("no ending before day 15 while meters are above zero", () => {
    expect(pickEnding(startMeters(), false)).toBeNull();
  });
  it("high confidence and goodwill on day 15 is Promoted Sideways", () => {
    expect(pickEnding({ ...startMeters(), confidence: 70, goodwill: 60 }, true, ready)).toBe(
      "promoted",
    );
  });
  it("negative traits refund points", () => {
    expect(pointsLeft(["replyall"])).toBe(4);
    expect(pointsLeft(["liver", "eyesopen"])).toBe(-1);
  });
  it("zero HQ goodwill replaces the player", () => {
    expect(pickEnding({ ...startMeters(), confidence: 0 }, false)).toBe("replaced");
  });
  it("an unconfirmed programme cancels the visit on arrival", () => {
    expect(pickEnding(startMeters(), true, { ...ready, programme: false })).toBe("cancelled");
  });
  it("other missing essential arrangements also fail the visit", () => {
    expect(visitReady({ ...ready, clearance: false })).toBe(false);
    expect(pickEnding(startMeters(), true, { ...ready, clearance: false })).toBe("cancelled");
  });
  it("positive goodwill does not trigger replacement or PNG at arrival", () => {
    expect(pickEnding({ ...startMeters(), confidence: 1, goodwill: 1 }, true, ready)).toBe(
      "ambassador",
    );
  });
  it("warns below the risk thresholds", () => {
    expect(goodwillRisk(25)).toBe("warning");
    expect(goodwillRisk(10)).toBe("critical");
    expect(goodwillRisk(26)).toBe("stable");
  });
  it("records actual clamped goodwill changes rather than nominal penalties", () => {
    const before = { ...startMeters(), confidence: 4 };
    const after = applyEffects(before, { confidence: -12, goodwill: 3 });
    const entry = recordGoodwillChange(before, after, {
      day: 1,
      time: 500,
      source: "Instruction",
      kind: "Missed instruction",
      text: "Deadline missed",
    });
    expect(entry.after.confidence - entry.before.confidence).toBe(-4);
    expect(entry.after.goodwill - entry.before.goodwill).toBe(3);
  });
  it("has two coffee occasions, one lunch and one dinner daily", () => {
    expect(blocks().filter((b) => b.social.startsWith("Coffee")).length).toBe(2);
    expect(blocks().filter((b) => b.social === "Lunch").length).toBe(1);
    expect(blocks().filter((b) => b.social === "Dinner").length).toBe(1);
  });
  it("charges actual restaurant prices for host and guest, including solo meals", () => {
    expect(hospitalityCost("bling", 1, 1)).toBe(900);
    expect(hospitalityCost("local", 1, 1)).toBe(80);
    expect(hospitalityCost("classic", 1, 3)).toBe(280);
    expect(hospitalityCost("bling", 0, 1)).toBe(450);
    expect(hospitalityCost("embassy", 0, 0)).toBe(5);
    expect(hospitalityCost("local", 1, 2)).toBe(30);
  });
  it("venue likes and dislikes affect relationships", () => {
    expect(socialTrust("development", "local", false)).toBe(6);
    expect(socialTrust("development", "bling", false)).toBe(-5);
  });
  it("work at dinner costs relationship goodwill", () => {
    expect(socialTrust("pavel", "classic", true)).toBe(-4);
    expect(socialTrust("pavel", "classic", false)).toBe(6);
  });
  it("does not repeat completed events when no story is eligible", () => {
    const all = campaign().events.map((event) => event.id);
    expect(dailyEvents(15, 23, all)).toEqual([]);
  });
  it("expires an eligible timed story only once and never expires a locked branch", () => {
    const story = {
      id: "timed",
      title: "Timed",
      npc: "sola",
      text: "A lead",
      minDay: 1,
      expiresDay: 2,
      requiresChoice: { eventId: "supplier", choiceId: "check" },
      choices: [],
    };
    const checked = { supplier: { status: "chosen" as const, choice: "check" } };
    expect(expiredStories([story], 2, ["supplier"], checked)).toEqual([]);
    expect(expiredStories([story], 3, ["supplier"], checked)).toEqual([story]);
    expect(expiredStories([story], 3, ["supplier", "timed"], checked)).toEqual([]);
    expect(expiredStories([story], 3, ["supplier"], { supplier: { status: "missed" } })).toEqual(
      [],
    );
  });
  it("selects the supplier follow-up for the actual choice, not a missed event", () => {
    const completed = ["supplier"];
    const checked = locationStories(2, completed, {
      supplier: { status: "chosen", choice: "check" },
    });
    const accepted = locationStories(2, completed, {
      supplier: { status: "chosen", choice: "accept" },
    });
    const missed = locationStories(2, completed, { supplier: { status: "missed" } });
    expect(checked.some((e) => e.id === "supplier-followup" && e.location === "bar")).toBe(true);
    expect(
      dailyEvents(2, 23, completed, { supplier: { status: "chosen", choice: "check" } }).some(
        (e) => e.id === "supplier-followup",
      ),
    ).toBe(false);
    expect(accepted.some((e) => e.id === "supplier-accepted-followup")).toBe(true);
    expect(missed.some((e) => e.id.startsWith("supplier-"))).toBe(false);
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
