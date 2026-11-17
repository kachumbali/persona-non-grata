import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_CHAPTER_ID, setActiveChapter } from "./chapters";
import {
  beginNewCareer,
  exportSlot,
  importIntoSlot,
  initSaves,
  reloadSaves,
  SAVE_KEY,
  slotAt,
  startCareer,
  useSaveNotice,
  useSaves,
} from "./saves";
import { useGame } from "./store";

const ann = {
  title: "Ms",
  name: "Ann",
  portrait: "diplomat-1",
  bio: "Ann bio",
  traits: ["replyall"],
};
const bob = { title: "Mr", name: "Bob", portrait: "diplomat-2", bio: "Bob bio", traits: [] };
const BACKUP_KEY = `${SAVE_KEY}.unreadable`;

/** A file with Ann in slot 1 (playing, one block in) and Bob in slot 2 (between postings). */
function twoGoodSlots(): string {
  beginNewCareer(0);
  startCareer(ann, {});
  useGame.getState().advance();
  beginNewCareer(1);
  startCareer(bob, {});
  return localStorage.getItem(SAVE_KEY)!;
}

beforeEach(() => {
  initSaves();
  localStorage.clear();
  setActiveChapter(DEFAULT_CHAPTER_ID);
  reloadSaves();
  useGame.getState().reset();
});

describe("damaged saves", () => {
  it("loads a truncated slot file as empty slots, keeps the data and shows a notice", () => {
    const good = twoGoodSlots();
    const truncated = good.slice(0, Math.floor(good.length / 2));
    useGame.getState().reset();
    localStorage.clear();
    localStorage.setItem(SAVE_KEY, truncated);
    expect(() => reloadSaves()).not.toThrow();
    expect(useSaves.getState().slots).toEqual([null, null, null]);
    expect(localStorage.getItem(BACKUP_KEY)).toBe(truncated);
    expect(useSaveNotice.getState().message).toMatch(/could not be read/);
    expect(useGame.getState().character).toBeNull();
  });

  it("treats a slot file of the wrong shape as unreadable without throwing", () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, activeSlot: 0, slots: {} }));
    expect(() => reloadSaves()).not.toThrow();
    expect(useSaves.getState().slots).toEqual([null, null, null]);
    expect(JSON.parse(localStorage.getItem(BACKUP_KEY)!)).toEqual({
      version: 1,
      activeSlot: 0,
      slots: {},
    });
    expect(useSaveNotice.getState().message).not.toBeNull();
  });

  it.each([
    ["a text day", (p: Record<string, unknown>) => (p["day"] = "four")],
    ["null meters", (p: Record<string, unknown>) => (p["meters"] = null)],
    ["a missing posting day", (p: Record<string, unknown>) => delete p["day"]],
    ["a missing chapter", (p: Record<string, unknown>) => delete p["chapterId"]],
  ])("keeps the other slots when slot 1 has %s", (_label, damage) => {
    const good = twoGoodSlots();
    const raw = JSON.parse(good) as {
      slots: [{ posting: Record<string, unknown> }, unknown, unknown];
    };
    damage(raw.slots[0].posting);
    const damaged = JSON.stringify(raw);
    localStorage.clear();
    localStorage.setItem(SAVE_KEY, damaged);
    expect(() => reloadSaves()).not.toThrow();
    expect(slotAt(0)).toBeNull();
    expect(slotAt(1)?.career.identity.name).toBe("Bob");
    expect(localStorage.getItem(BACKUP_KEY)).toBe(damaged);
    expect(useSaveNotice.getState().message).not.toBeNull();
  });

  it("does not overwrite the backup when the damaged file is played on", () => {
    const good = twoGoodSlots();
    const raw = JSON.parse(good) as {
      slots: [{ posting: Record<string, unknown> }, unknown, unknown];
    };
    raw.slots[0].posting["day"] = "four";
    const damaged = JSON.stringify(raw);
    localStorage.clear();
    localStorage.setItem(SAVE_KEY, damaged);
    reloadSaves();
    beginNewCareer(0);
    startCareer(ann, {});
    expect(slotAt(1)?.career.identity.name).toBe("Bob");
    expect(localStorage.getItem(BACKUP_KEY)).toBe(damaged);
  });

  it("clears the notice on a normal load", () => {
    localStorage.setItem(SAVE_KEY, "{");
    reloadSaves();
    expect(useSaveNotice.getState().message).not.toBeNull();
    localStorage.clear();
    reloadSaves();
    expect(useSaveNotice.getState().message).toBeNull();
  });
});

describe("damaged career codes", () => {
  function codeFor(name: string): string {
    beginNewCareer(0);
    startCareer({ ...ann, name }, {});
    return exportSlot(0)!;
  }

  it("refuses a truncated code without changing the slot", () => {
    const code = codeFor("Cara");
    localStorage.clear();
    reloadSaves();
    const result = importIntoSlot(2, code.slice(0, code.length - 12));
    expect(result.ok).toBe(false);
    expect(slotAt(2)).toBeNull();
  });

  it("refuses a code with a wrong checksum", () => {
    const code = codeFor("Cara");
    const last = code.at(-1) === "0" ? "1" : "0";
    const altered = code.slice(0, -1) + last;
    localStorage.clear();
    reloadSaves();
    const result = importIntoSlot(2, altered);
    expect(result).toEqual({
      ok: false,
      error:
        "The code is damaged or incomplete (checksum mismatch). Copy the whole code and try again.",
    });
    expect(slotAt(2)).toBeNull();
  });

  it("refuses a code whose payload was cut but whose checksum was kept", () => {
    const code = codeFor("Cara");
    const dot = code.lastIndexOf(".");
    const cut = code.slice(0, dot - 40) + code.slice(dot);
    localStorage.clear();
    reloadSaves();
    expect(importIntoSlot(2, cut).ok).toBe(false);
    expect(slotAt(2)).toBeNull();
  });
});
