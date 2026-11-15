import { describe, expect, it } from "vitest";
import {
  applyChapterResult,
  chapterResultFrom,
  checksum,
  exportCareer,
  importCareer,
  newCareer,
  resultRecorded,
  type SaveSlot,
} from "./career";
import type { SavedGame } from "./store";

const NOW = "2006-05-01T10:00:00.000Z";
const LATER = "2006-05-02T10:00:00.000Z";
const character = {
  title: "Dr",
  name: "Ünïcode Tester",
  portrait: "diplomat-3",
  bio: "Born in a consulate, passed.",
  traits: ["namedrop", "replyall"],
};
const game = (over: Partial<SavedGame> = {}) =>
  ({
    chapterId: "port-hesperia-2006",
    ending: "success",
    day: 15,
    block: 3,
    pending: [],
    character,
    meters: { confidence: 60, goodwill: 55, morale: 40, sanity: 30 },
    score: 120,
    storyFlags: [
      "fuel-bought",
      "social:pavel",
      "dialogue:pavel:x",
      "reward:Mail",
      "trait:namedrop:a",
    ],
    storyOutcomes: { supplier: { status: "chosen", choice: "check" } },
    colleagues: { pavel: { trust: 70, fatigue: 5 }, ruth: { trust: 40, fatigue: 0 } },
    ...over,
  }) as SavedGame;

describe("newCareer", () => {
  it("copies identity and traits and stores background indexes", () => {
    const c = newCareer(character, { origin: 1, misstep: 2, reason: 3 }, NOW);
    expect(c.identity).toEqual({
      title: "Dr",
      name: "Ünïcode Tester",
      portrait: "diplomat-3",
      bio: "Born in a consulate, passed.",
    });
    expect(c.background).toEqual({ origin: 1, misstep: 2, reason: 3 });
    expect(c.traits).toEqual(["namedrop", "replyall"]);
    expect(c.createdAt).toBe(NOW);
    expect(c.chapters).toEqual([]);
  });
  it("uses null for unknown backgrounds and does not alias the trait array", () => {
    const c = newCareer(character, null, NOW);
    expect(c.background).toEqual({ origin: null, misstep: null, reason: null });
    c.traits.push("x");
    expect(character.traits).toHaveLength(2);
  });
});

describe("chapter results", () => {
  it("records each final relationship state and favour tag", () => {
    const result = chapterResultFrom(
      game({ favours: { owedToYou: { pavel: 1 }, youOwe: {} } }),
      LATER,
    );
    expect(result.relationshipStates?.["pavel"]).toEqual({
      value: 70,
      state: "friendly",
      tags: ["owes-a-favour"],
    });
    const updated = applyChapterResult(newCareer(character, null, NOW), result);
    expect(updated.people["pavel"]).toMatchObject({
      trust: 70,
      state: "friendly",
      tags: ["owes-a-favour"],
    });
  });
  it("records delivered, failed and missed démarche counts", () => {
    const r = chapterResultFrom(
      game({
        demarches: {
          a: { status: "delivered", quality: "good", route: "self" },
          b: { status: "delivered", quality: "failed", route: "colleague" },
          c: { status: "missed" },
          d: { status: "skipped" },
        },
      }),
      LATER,
    );
    expect(r.demarcheCounts).toEqual({ delivered: 1, failed: 1, missed: 1 });
  });
  it("carries both sides of the favour ledger into the career result", () => {
    const favours = { owedToYou: { protocol: 1 }, youOwe: { fixer: 2 } };
    const result = chapterResultFrom(game({ favours }), LATER);
    expect(result.favours).toEqual(favours);
    favours.youOwe.fixer = 9;
    expect(result.favours?.youOwe["fixer"]).toBe(2);
  });
  it("filters internal flags and records final trust", () => {
    const r = chapterResultFrom(game(), LATER);
    expect(r.flags).toEqual(["fuel-bought", "trait:namedrop:a"]);
    expect(r.trust).toEqual({ pavel: 70, ruth: 40 });
    expect(r.ending).toBe("success");
    expect(r.finishedAt).toBe(LATER);
  });
  it("appends, merges legacy flags without duplicates and records people", () => {
    const base = newCareer(character, null, NOW);
    const one = applyChapterResult(base, chapterResultFrom(game(), LATER));
    const two = applyChapterResult(
      one,
      chapterResultFrom(
        game({
          storyFlags: ["fuel-bought", "new-flag"],
          colleagues: { pavel: { trust: 20, fatigue: 0 } },
        }),
        LATER,
      ),
    );
    expect(two.chapters).toHaveLength(2);
    expect(two.legacyFlags).toEqual(["fuel-bought", "trait:namedrop:a", "new-flag"]);
    expect(two.people["pavel"]?.trust).toBe(20);
    expect(two.people["ruth"]?.trust).toBe(40);
    expect(base.chapters).toHaveLength(0);
  });
  it("keeps notes on people", () => {
    const base = {
      ...newCareer(character, null, NOW),
      people: { pavel: { trust: 1, note: "owes me" } },
    };
    const next = applyChapterResult(base, chapterResultFrom(game(), LATER));
    expect(next.people["pavel"]).toEqual({
      trust: 70,
      note: "owes me",
      state: "friendly",
      tags: [],
    });
  });
  it("detects an already recorded ending", () => {
    const c = applyChapterResult(newCareer(character, null, NOW), chapterResultFrom(game(), LATER));
    expect(resultRecorded(c, game())).toBe(true);
    expect(resultRecorded(c, game({ score: 5 }))).toBe(false);
    expect(resultRecorded(c, game({ ending: null }))).toBe(false);
  });
});

describe("export and import", () => {
  const slot = (): SaveSlot => ({
    career: applyChapterResult(
      newCareer(character, { origin: 0, misstep: 1, reason: 2 }, NOW),
      chapterResultFrom(game(), LATER),
    ),
    posting: game({ ending: null }),
  });
  it("round-trips the career and the posting in progress", () => {
    const code = exportCareer(slot());
    expect(code.startsWith("PNG1.")).toBe(true);
    expect(code).toMatch(/^[A-Za-z0-9._-]+$/);
    const back = importCareer(code);
    expect(back).toEqual({ ok: true, slot: slot() });
  });
  it("round-trips a slot without a posting and tolerates pasted whitespace", () => {
    const s = { career: slot().career, posting: null };
    const code = exportCareer(s);
    const spaced = ` ${code.slice(0, 20)}\n${code.slice(20)} \n`;
    expect(importCareer(spaced)).toEqual({ ok: true, slot: s });
  });
  it("rejects truncated, empty, garbage and tampered codes", () => {
    const code = exportCareer(slot());
    for (const bad of [
      code.slice(0, code.length - 12),
      code.slice(0, code.lastIndexOf(".")),
      "",
      "hello world",
      "PNG1.",
      "PNG1.!!!.00000000",
    ]) {
      const r = importCareer(bad);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.length).toBeGreaterThan(5);
    }
    const flipped = code.slice(0, 30) + (code[30] === "A" ? "B" : "A") + code.slice(31);
    const r = importCareer(flipped);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/checksum/);
  });
  it("rejects another code version", () => {
    const code = exportCareer(slot()).replace("PNG1.", "PNG2.");
    const r = importCareer(code);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/version/);
  });
  it("rejects a code with a valid checksum but the wrong shape", () => {
    const encode = (value: unknown) => {
      const payload = btoa(JSON.stringify(value)).replaceAll("=", "");
      return `PNG1.${payload}.${checksum(payload)}`;
    };
    for (const data of [
      { hello: 1 },
      [],
      { career: { ...slot().career, version: 99 }, posting: null },
      { career: { ...slot().career, savings: "lots" }, posting: null },
      { career: slot().career, posting: { chapterId: 5 } },
      {
        career: { ...slot().career, identity: { ...slot().career.identity, name: "" } },
        posting: null,
      },
    ]) {
      const r = importCareer(encode(data));
      expect(r.ok).toBe(false);
    }
    expect(importCareer(`PNG1.${btoa("not json").replaceAll("=", "")}.00000000`).ok).toBe(false);
  });
});
