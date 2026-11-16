import { describe, expect, it } from "vitest";
import { drawExam, learnLanguage, mistranslates } from "./languages";

describe("language rules", () => {
  it("carries lesson points across levels but reserves certification for the exam", () => {
    expect(learnLanguage(0, 3, 2)).toEqual({ level: 1, progress: 1 });
    expect(learnLanguage(1, 7, 100)).toEqual({ level: 3, progress: 0 });
    expect(learnLanguage(4, 0, 3)).toEqual({ level: 4, progress: 0 });
  });
  it("uses a repeatable seed and never mistranslates at working level", () => {
    expect(mistranslates(7, "meeting", 1)).toBe(mistranslates(7, "meeting", 1));
    expect(
      Array.from({ length: 100 }, (_, i) => mistranslates(i, "meeting", 3)).some(Boolean),
    ).toBe(false);
  });
  it("draws five distinct reproducible questions and changes the draw on a retake", () => {
    const pool = Array.from({ length: 20 }, (_, i) => ({ id: String(i) }));
    expect(new Set(drawExam(pool, 17, 0)).size).toBe(5);
    expect(drawExam(pool, 17, 0)).toEqual(drawExam(pool, 17, 0));
    expect(drawExam(pool, 17, 0)).not.toEqual(drawExam(pool, 17, 1));
  });
});
