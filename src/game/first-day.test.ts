import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { activeChapter } from "./chapters";
import { halveFirstPenalty, inFirstDayGrace, setFirstDayGraceOffForTests } from "./rules";
import { useGame } from "./store";

const character = { title: "Mr", name: "Test", portrait: "diplomat-1", bio: "", traits: [] };
beforeEach(() => useGame.getState().start(character));
afterEach(() => setFirstDayGraceOffForTests(false));

const faxLines = () => useGame.getState().log.filter((l) => l.text.includes("Capital assumes"));

describe("a gentler first day", () => {
  it("is data in the chapter pack", () => {
    expect(activeChapter().manifest.firstDayGrace).toEqual({
      from: "Capital",
      day: 1,
      untilBlock: 1,
    });
  });

  it("holds Capital's Day 1 mail through the Morning only", () => {
    const grace = { from: "Capital", day: 1, untilBlock: 1 };
    const fax = { day: 1, from: "Capital — Political Directorate" };
    expect(inFirstDayGrace(fax, 1, 0, grace)).toBe(true);
    expect(inFirstDayGrace(fax, 1, 1, grace)).toBe(false);
    expect(inFirstDayGrace({ day: 1, from: "Admin — Pavel" }, 1, 0, grace)).toBe(false);
    expect(inFirstDayGrace({ day: 3, from: "Capital — Protocol" }, 3, 0, grace)).toBe(false);
  });

  it("does not mark the faxes ignored at the end of the Morning, but does at the end of Midday", () => {
    useGame.getState().advance();
    const afterMorning = useGame.getState();
    expect(afterMorning.handled["e1"]).toBeUndefined();
    expect(afterMorning.handled["e2"]).toBeUndefined();
    expect(afterMorning.meters.goodwill).toBe(useGame.getState().meters.goodwill);
    useGame.getState().advance();
    const s = useGame.getState();
    expect(s.handled["e1"]).toBe("ignored");
    expect(s.handled["e2"]).toBe("ignored");
  });

  it("halves only the first ignored penalty, once, with the report line", () => {
    useGame.getState().advance();
    useGame.getState().advance();
    expect(faxLines()).toHaveLength(1);
    expect(useGame.getState().firstIgnoreUsed).toBe(true);
    const log = useGame.getState().log.filter((l) => l.text.includes("The Capital calls"));
    expect(log[0]?.text).toContain("Capital assumes the fax was jammed. Once.");
  });

  it("changes nothing when the setting is off", () => {
    setFirstDayGraceOffForTests(true);
    useGame.getState().advance();
    expect(useGame.getState().handled["e1"]).toBe("ignored");
    expect(faxLines()).toHaveLength(0);
  });

  it("rounds a halved penalty towards zero and leaves gains alone", () => {
    expect(halveFirstPenalty({ confidence: -12, morale: -1, sanity: 3 })).toEqual({
      confidence: -6,
      morale: 0,
      sanity: 3,
    });
  });
});

describe("saves from before the gentler first day", () => {
  it("count as having used it, so nothing changes for them", () => {
    const options = useGame.persist.getOptions();
    const old = { ...useGame.getState() } as Record<string, unknown>;
    delete old["firstIgnoreUsed"];
    const migrated = options.migrate!(old, 15) as { firstIgnoreUsed: boolean };
    expect(migrated.firstIgnoreUsed).toBe(true);
    const merged = options.merge!(old, useGame.getState()) as { firstIgnoreUsed: boolean };
    expect(merged.firstIgnoreUsed).toBe(true);
  });
  it("a new posting has not used it", () => {
    expect(useGame.getState().firstIgnoreUsed).toBe(false);
  });
});
