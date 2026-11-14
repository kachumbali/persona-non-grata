import { describe, expect, it } from "vitest";
import {
  accidentalReplyAll,
  charmGain,
  eligible,
  formalBonus,
  gateLabel,
  missedEffects,
  overnightRecovery,
  socialBonus,
} from "./character";
import { computeStats, TRAITS } from "./rules";
import { topicsFor } from "./dialogues";
import { CAMPAIGN } from "./rules";

describe("character modifiers", () => {
  it("scales only positive relationship gains without reversing them", () => {
    expect(charmGain(3, 5)).toBe(5);
    expect(charmGain(1, 0)).toBe(1);
    expect(charmGain(-3, 5)).toBe(-3);
  });
  it("caps formal gravitas, scales missed penalties toward zero and changes overnight recovery", () => {
    expect(formalBonus(7)).toBe(2);
    expect(formalBonus(2)).toBe(0);
    expect(missedEffects({ confidence: -11, goodwill: 2 }, 5)).toEqual({
      confidence: -8,
      goodwill: 2,
    });
    expect(missedEffects({ morale: -10 }, 1)).toEqual({ morale: -12 });
    expect(overnightRecovery(5)).toBe(35);
    expect(overnightRecovery(1)).toBe(15);
    expect(socialBonus(4, true)).toBe(1);
    expect(socialBonus(3, true)).toBe(0);
    expect(socialBonus(5, false)).toBe(0);
  });
  it("checks and labels trait, blocked trait and stat gates", () => {
    const stats = computeStats(["namedrop"]);
    expect(
      eligible(
        {
          requiresTrait: "namedrop",
          blockedByTrait: "replyall",
          requiresStat: { stat: "gravitas", min: 4 },
        },
        ["namedrop"],
        stats,
      ),
    ).toBe(true);
    expect(eligible({ requiresTrait: "namedrop" }, [], stats)).toBe(false);
    expect(eligible({ blockedByTrait: "namedrop" }, ["namedrop"], stats)).toBe(false);
    expect(eligible({ requiresStat: { stat: "gravitas", min: 9 } }, [], stats)).toBe(false);
    expect(gateLabel({ requiresTrait: "namedrop" })).toBe("[Name-dropper] ");
  });
  it("uses a reproducible one-in-four hash for reply-all", () => {
    const hits = Array.from({ length: 400 }, (_, day) => accidentalReplyAll(23, day, "e1"));
    expect(hits.filter(Boolean)).toHaveLength(100);
    expect(accidentalReplyAll(23, 1, "e1")).toBe(accidentalReplyAll(23, 1, "e1"));
  });
  it("every trait contributes to a stat read by a rule and has an explanation", () => {
    for (const trait of TRAITS) {
      expect(trait.plays).toBeTruthy();
      expect(
        Object.keys(trait.stats).some((stat) =>
          ["gravitas", "charm", "stamina", "deniability", "liver"].includes(stat),
        ),
      ).toBe(true);
    }
  });
  it("provides at least five authored dialogue moments for each trait", () => {
    for (const trait of TRAITS) {
      const choices = CAMPAIGN.characters.flatMap((person) =>
        topicsFor(person.id).flatMap((topic) =>
          Object.values(topic.nodes).flatMap((node) => node.choices),
        ),
      );
      expect(
        choices.filter((choice) => choice.requiresTrait === trait.id).length,
      ).toBeGreaterThanOrEqual(5);
    }
  });
});
