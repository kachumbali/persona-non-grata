import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_CHAPTER_ID, setActiveChapter } from "./chapters";
import { initSaves, LEGACY_KEY, reloadSaves, SAVE_KEY, slotAt } from "./saves";
import { useGame, type SavedGame } from "./store";

/**
 * Saved postings written by each store version (5 to 17), in the single-save format the game
 * read before slots, and the current slot file. Each is a Day 4, Midday posting: two traits, handled
 * mail, story outcomes and, from version 10, completed mission steps.
 */
const legacy = import.meta.glob("./fixtures/saves/posting-v*.json", {
  eager: true,
  import: "default",
}) as Record<string, { state: SavedGame; version: number }>;
const slotFile = import.meta.glob("./fixtures/saves/slot-current.json", {
  eager: true,
  import: "default",
})["./fixtures/saves/slot-current.json"] as {
  version: number;
  activeSlot: number;
  slots: [{ career: { identity: { name: string } }; posting: SavedGame }, null, null];
};

const legacyFixtures = Object.entries(legacy).sort(([a], [b]) => a.localeCompare(b));

beforeEach(() => {
  initSaves();
  localStorage.clear();
  setActiveChapter(DEFAULT_CHAPTER_ID);
  reloadSaves();
  useGame.getState().reset();
});

/** What must survive loading, and one block of play afterwards. */
function expectSurvivedAndPlayable(source: SavedGame) {
  const slot = slotAt(0);
  expect(slot, "the save loads into slot 1").not.toBeNull();
  const posting = slot!.posting!;
  const game = useGame.getState();

  expect(posting.day).toBe(4);
  expect(posting.block).toBe(1);
  expect(game.day).toBe(4);
  expect(game.block).toBe(1);

  expect(slot!.career.identity.name).toBe(source.character!.name);
  expect(game.character?.name).toBe(source.character!.name);
  expect(game.character?.traits).toEqual(["replyall", "punctual"]);

  expect(posting.handled).toEqual(source.handled);
  expect(Object.keys(posting.handled).length).toBeGreaterThan(0);
  expect(game.handled).toEqual(source.handled);

  expect(posting.storyOutcomes).toEqual(source.storyOutcomes);
  expect(game.storyOutcomes["eu-budget-share-meeting"]).toEqual({
    status: "chosen",
    choice: "claim",
  });

  if (source.missionSteps) {
    expect(game.missionSteps).toEqual(source.missionSteps);
    expect(Object.values(game.missionSteps).flat().length).toBeGreaterThan(0);
  }

  // One block of play: the turn moves on, nothing throws, and the new state reaches the slot.
  const turn = game.turn;
  expect(() => useGame.getState().advance()).not.toThrow();
  const after = useGame.getState();
  expect(after.turn).toBe(turn + 1);
  expect(after.planError).toBe("");
  expect(after.block).toBe(2);
  const written = JSON.parse(localStorage.getItem(SAVE_KEY)!);
  expect(written.slots[0].posting.block).toBe(2);
  expect(written.slots[0].career.identity.name).toBe(source.character!.name);
}

describe("saved postings from each store version", () => {
  it("has a fixture for every version from 5 to the current one", () => {
    const versions = legacyFixtures.map(([, f]) => f.version);
    expect(versions).toEqual(Array.from({ length: 13 }, (_, i) => i + 5));
  });

  it.each(legacyFixtures)("%s loads, keeps its progress and plays one block", (_path, fixture) => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(fixture));
    reloadSaves();
    expectSurvivedAndPlayable(fixture.state);
    // The old single save is kept as it was.
    expect(JSON.parse(localStorage.getItem(LEGACY_KEY)!)).toEqual(fixture);
  });

  it("loads the current slot file and plays one block", () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(slotFile));
    reloadSaves();
    expectSurvivedAndPlayable(slotFile.slots[0].posting);
  });
});
