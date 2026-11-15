import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  activeChapterId,
  DEFAULT_CHAPTER_ID,
  portHesperia2006,
  registerChapter,
  setActiveChapter,
} from "./chapters";
import {
  beginNewCareer,
  continueSlot,
  deleteSlot,
  describeSlot,
  exportSlot,
  importIntoSlot,
  initSaves,
  LEGACY_KEY,
  newPosting,
  reloadSaves,
  SAVE_KEY,
  slotAt,
  startCareer,
  useSaves,
} from "./saves";
import { startMeters } from "./rules";
import { useGame } from "./store";

const ann = {
  title: "Ms",
  name: "Ann",
  portrait: "diplomat-1",
  bio: "Ann bio",
  traits: ["replyall"],
};
const bob = { title: "Mr", name: "Bob", portrait: "diplomat-2", bio: "Bob bio", traits: [] };

beforeEach(() => {
  initSaves();
  localStorage.clear();
  setActiveChapter(DEFAULT_CHAPTER_ID);
  reloadSaves();
  useGame.getState().reset();
});
afterEach(() => setActiveChapter(DEFAULT_CHAPTER_ID));

const stored = () => JSON.parse(localStorage.getItem(SAVE_KEY)!);
function replaceViaZeroGoodwill() {
  useGame.setState({ meters: { ...startMeters(), confidence: 6 } });
  useGame.getState().queue({
    id: "loss",
    source: "Incident",
    text: "Fired",
    effects: { confidence: -6 },
    kind: "event",
  });
  useGame.getState().advance();
}

describe("save slots", () => {
  it("round-trips route deliveries, facts and favours through an export", () => {
    beginNewCareer(0);
    startCareer(ann, {});
    useGame.setState({
      favours: { owedToYou: { protocol: 1 }, youOwe: { fixer: 2 } },
      knownFacts: ["port-control"],
      routeDeliveries: { "clearance.protocol-stamp": { route: "official", dueDay: 13 } },
      usedRoutes: { "clearance.protocol-stamp": "official" },
      spentRoutes: { "security.route-recon": ["marcel"] },
      stepQualities: { lounge: { reservation: "adequate" } },
      taskQualities: { lounge: "adequate" },
    });
    const code = exportSlot(0)!;
    expect(importIntoSlot(1, code).ok).toBe(true);
    continueSlot(1);
    const posting = useGame.getState();
    expect(posting.favours).toEqual({ owedToYou: { protocol: 1 }, youOwe: { fixer: 2 } });
    expect(posting.knownFacts).toEqual(["port-control"]);
    expect(posting.routeDeliveries["clearance.protocol-stamp"]?.dueDay).toBe(13);
    expect(posting.spentRoutes["security.route-recon"]).toEqual(["marcel"]);
    expect(posting.taskQualities["lounge"]).toBe("adequate");
  });
  it("starts empty and persists a structure under its own key", () => {
    expect(useSaves.getState().slots).toEqual([null, null, null]);
    beginNewCareer(0);
    startCareer(ann, { origin: 1, misstep: 2, reason: 3 });
    const file = stored();
    expect(file.version).toBe(1);
    expect(file.activeSlot).toBe(0);
    expect(file.slots[1]).toBeNull();
    expect(file.slots[0].career.identity.name).toBe("Ann");
    expect(file.slots[0].career.background).toEqual({ origin: 1, misstep: 2, reason: 3 });
    expect(file.slots[0].posting.character.name).toBe("Ann");
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
  });

  it("keeps slot 0 untouched while playing in slot 1", () => {
    beginNewCareer(0);
    startCareer(ann, {});
    useGame.getState().advance();
    const before = JSON.stringify(slotAt(0));
    expect(slotAt(0)?.posting?.block).toBe(1);

    beginNewCareer(1);
    expect(useGame.getState().character).toBeNull();
    startCareer(bob, {});
    useGame.getState().advance();
    useGame.getState().advance();
    expect(useGame.getState().character?.name).toBe("Bob");
    expect(JSON.stringify(slotAt(0))).toBe(before);
    expect(slotAt(1)?.posting?.block).toBe(2);
    expect(useSaves.getState().activeSlot).toBe(1);

    continueSlot(0);
    expect(useGame.getState().character?.name).toBe("Ann");
    expect(useGame.getState().block).toBe(1);
    expect(JSON.stringify(slotAt(1))).toContain('"block":2');
  });

  it("restores everything from storage after a reload", () => {
    beginNewCareer(2);
    startCareer(ann, {});
    useGame.getState().advance();
    const snapshot = JSON.stringify(slotAt(2));
    beginNewCareer(1);
    expect(useGame.getState().character).toBeNull();
    reloadSaves();
    expect(useSaves.getState().activeSlot).toBe(1);
    continueSlot(2);
    expect(slotAt(2)).toEqual(JSON.parse(snapshot));
    expect(useGame.getState().block).toBe(1);
    expect(useGame.getState().character?.name).toBe("Ann");
  });

  it("activates the posting's chapter when a slot is loaded", () => {
    registerChapter({
      ...portHesperia2006,
      manifest: { ...portHesperia2006.manifest, id: "test-clone", label: "Clone chapter" },
    });
    setActiveChapter("test-clone");
    beginNewCareer(0);
    // beginNewCareer starts at the default chapter; play the clone in slot 1 instead.
    setActiveChapter("test-clone");
    useGame.getState().start(ann);
    expect(slotAt(0)?.posting?.chapterId).toBe("test-clone");
    expect(describeSlot(slotAt(0))).toBe("Ms Ann · Clone chapter · Day 1");
    setActiveChapter(DEFAULT_CHAPTER_ID);
    continueSlot(0);
    expect(activeChapterId()).toBe("test-clone");
    setActiveChapter(DEFAULT_CHAPTER_ID);
    reloadSaves();
    expect(activeChapterId()).toBe("test-clone");
  });

  it("deletes a slot and clears the game when it was active", () => {
    beginNewCareer(0);
    startCareer(ann, {});
    deleteSlot(0);
    expect(slotAt(0)).toBeNull();
    expect(useGame.getState().character).toBeNull();
    expect(stored().slots[0]).toBeNull();
  });

  it("keeps an existing career until the new one is accepted", () => {
    beginNewCareer(0);
    startCareer(ann, {});
    beginNewCareer(0);
    expect(slotAt(0)?.career.identity.name).toBe("Ann");
    expect(useGame.getState().character).toBeNull();
    startCareer(bob, {});
    expect(slotAt(0)?.career.identity.name).toBe("Bob");
    expect(slotAt(0)?.career.chapters).toEqual([]);
  });
});

describe("migration of the single save", () => {
  const legacyState = () => ({
    ...useGame.persist.getOptions().partialize!(useGame.getState()),
  });
  it("moves a version 9 save into slot 1 and leaves the old key alone", () => {
    useGame.getState().start(ann);
    useGame.setState({ day: 6, score: 12, storyFlags: ["fuel-bought"] });
    const legacy = JSON.stringify({ state: legacyState(), version: 9 });
    useGame.getState().reset();
    localStorage.clear();
    localStorage.setItem(LEGACY_KEY, legacy);
    reloadSaves();
    const slot = slotAt(0)!;
    expect(slot.career.identity.name).toBe("Ann");
    expect(slot.career.traits).toEqual(["replyall"]);
    expect(slot.career.background).toEqual({ origin: null, misstep: null, reason: null });
    expect(slot.posting?.day).toBe(6);
    expect(slotAt(1)).toBeNull();
    expect(localStorage.getItem(LEGACY_KEY)).toBe(legacy);
    expect(useGame.getState().day).toBe(6);
    expect(useGame.getState().character?.name).toBe("Ann");
    // Playing on writes to the new key and still leaves the backup untouched.
    useGame.getState().advance();
    expect(stored().slots[0].posting.block).toBe(1);
    expect(localStorage.getItem(LEGACY_KEY)).toBe(legacy);
  });

  it("runs older versions through the existing migrations", () => {
    const old = { day: 3, character: { title: "Mr", name: "Old", face: 2, bio: "", traits: [] } };
    localStorage.clear();
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ state: old, version: 6 }));
    reloadSaves();
    expect(slotAt(0)?.career.identity.portrait).toBe("diplomat-3");
    expect(slotAt(0)?.posting?.chapterId).toBe(DEFAULT_CHAPTER_ID);
    expect(useGame.getState().day).toBe(3);
  });

  it("does not migrate again once the new structure exists, and skips empty old saves", () => {
    beginNewCareer(1);
    startCareer(bob, {});
    localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify({ state: { day: 2, character: ann }, version: 9 }),
    );
    reloadSaves();
    expect(slotAt(0)).toBeNull();
    expect(slotAt(1)?.career.identity.name).toBe("Bob");
    localStorage.clear();
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ state: { character: null }, version: 9 }));
    reloadSaves();
    expect(useSaves.getState().slots).toEqual([null, null, null]);
  });

  it("records an ending already reached in the old save", () => {
    useGame.getState().start(ann);
    replaceViaZeroGoodwill();
    expect(useGame.getState().ending).toBe("replaced");
    localStorage.clear();
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ state: legacyState(), version: 9 }));
    reloadSaves();
    expect(slotAt(0)?.career.chapters.map((r) => r.ending)).toEqual(["replaced"]);
    reloadSaves();
    expect(slotAt(0)?.career.chapters).toHaveLength(1);
  });
});

describe("chapter results", () => {
  it("records a result once at an ending and keeps the career for a new posting", () => {
    beginNewCareer(0);
    startCareer(ann, {});
    useGame.setState({ storyFlags: ["fuel-bought", "social:pavel", "dialogue:x:y"] });
    replaceViaZeroGoodwill();
    expect(useGame.getState().ending).toBe("replaced");
    const career = slotAt(0)!.career;
    expect(career.chapters).toHaveLength(1);
    const result = career.chapters[0]!;
    expect(result.chapterId).toBe(DEFAULT_CHAPTER_ID);
    expect(result.ending).toBe("replaced");
    expect(result.flags).toEqual(["fuel-bought"]);
    expect(career.legacyFlags).toEqual(["fuel-bought"]);
    expect(Object.keys(result.trust).length).toBeGreaterThan(3);
    expect(new Date(result.finishedAt).toString()).not.toBe("Invalid Date");

    // Further writes, reloads and menu round trips never record it again.
    useGame.getState().advance();
    useGame.setState({ log: [...useGame.getState().log] });
    reloadSaves();
    reloadSaves();
    continueSlot(0);
    expect(slotAt(0)!.career.chapters).toHaveLength(1);

    newPosting();
    expect(useGame.getState().ending).toBeNull();
    expect(useGame.getState().character?.name).toBe("Ann");
    expect(useGame.getState().day).toBe(1);
    expect(slotAt(0)!.career.chapters).toHaveLength(1);
    replaceViaZeroGoodwill();
    expect(slotAt(0)!.career.chapters).toHaveLength(2);
  });

  it("can play between postings", () => {
    beginNewCareer(0);
    startCareer(ann, {});
    replaceViaZeroGoodwill();
    useGame.getState().reset();
    expect(slotAt(0)?.posting).toBeNull();
    expect(describeSlot(slotAt(0))).toBe("Ms Ann · between postings · 1 posting completed");
    continueSlot(0);
    expect(useGame.getState().character?.name).toBe("Ann");
    expect(useGame.getState().ending).toBeNull();
  });
});

describe("export and import of slots", () => {
  it("restores the same career and posting in another slot", () => {
    beginNewCareer(0);
    startCareer(ann, { origin: 4, misstep: 5, reason: 6 });
    useGame.getState().advance();
    const code = exportSlot(0)!;
    expect(importIntoSlot(1, code)).toEqual({ ok: true });
    expect(slotAt(1)).toEqual(slotAt(0));
    expect(importIntoSlot(1, code).ok).toBe(false);
    expect(importIntoSlot(2, code.slice(0, -9)).ok).toBe(false);
    expect(slotAt(2)).toBeNull();
  });
  it("rejects a posting from a chapter this version lacks", () => {
    beginNewCareer(0);
    startCareer(ann, {});
    const slot = slotAt(0)!;
    const alien = { ...slot, posting: { ...slot.posting!, chapterId: "no-such-chapter" } };
    const code = exportSlot(0)!;
    expect(importIntoSlot(1, code).ok).toBe(true);
    // Build the alien code with the pure helper.
    return import("./career").then(({ exportCareer }) => {
      const result = importIntoSlot(2, exportCareer(alien));
      expect(result.ok).toBe(false);
    });
  });
});
