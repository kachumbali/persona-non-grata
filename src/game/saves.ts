import { create } from "zustand";
import { z } from "zod";
import {
  applyChapterResult,
  characterOf,
  chapterResultFrom,
  exportCareer,
  importCareer,
  newCareer,
  resultRecorded,
  saveSlotSchema,
  type BackgroundChoice,
  type SaveSlot,
} from "./career";
import { activeChapter, DEFAULT_CHAPTER_ID, getChapter, setActiveChapter } from "./chapters";
import { useGame, type Character, type SavedGame } from "./store";
import { createPersonnel } from "./personnel";
import { computeStats } from "./rules";

/**
 * Save slots. `useGame` stays the store for the posting being played; this module loads a slot into
 * it, writes the posting and the career back on every change, and switches slots.
 */
export const SAVE_KEY = "persona-non-grata-slots";
export const LEGACY_KEY = "persona-non-grata-save";
export const SAVE_VERSION = 1;
export const SLOT_COUNT = 3;
export type SlotIndex = 0 | 1 | 2;
export type Slots = [SaveSlot | null, SaveSlot | null, SaveSlot | null];
export interface SaveFile {
  version: number;
  activeSlot: SlotIndex;
  slots: Slots;
}

const fileSchema = z.object({
  version: z.literal(SAVE_VERSION),
  activeSlot: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  slots: z.tuple([saveSlotSchema.nullable(), saveSlotSchema.nullable(), saveSlotSchema.nullable()]),
});

const emptyFile = (): SaveFile => ({
  version: SAVE_VERSION,
  activeSlot: 0,
  slots: [null, null, null],
});
export const useSaves = create<SaveFile>()(() => emptyFile());

const now = () => new Date().toISOString();
const storage = () => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};
let loading = false;
let initialised = false;

function persist(file: SaveFile) {
  useSaves.setState(file, true);
  try {
    storage()?.setItem(SAVE_KEY, JSON.stringify(file));
  } catch {
    // Storage full or blocked: the export code is the safety net.
  }
}
const currentFile = (): SaveFile => {
  const { version, activeSlot, slots } = useSaves.getState();
  return { version, activeSlot, slots: [...slots] as Slots };
};
function writeSlot(index: SlotIndex, slot: SaveSlot | null) {
  const file = currentFile();
  file.slots[index] = slot;
  persist(file);
}

// --- Loading from storage, with migration of the old single save ---

const postingOptions = () => useGame.persist.getOptions();
const savedPosting = (state: ReturnType<typeof useGame.getState>): SavedGame =>
  postingOptions().partialize!(state) as SavedGame;

/** Turn a saved posting from an older store version into the current shape. */
function upgradePosting(state: unknown, version: number): SavedGame {
  const options = postingOptions();
  const migrated =
    version === options.version ? state : (options.migrate!(state, version) as SavedGame);
  return options.merge!(migrated, useGame.getState()) as unknown as SavedGame;
}

function migrateLegacy(raw: string): SaveFile | null {
  try {
    const parsed = JSON.parse(raw) as { state?: unknown; version?: number };
    if (!parsed || typeof parsed !== "object" || !parsed.state) return null;
    const previous = activeChapter().manifest.id;
    const posting = upgradePosting(parsed.state, parsed.version ?? 0);
    setActiveChapter(previous);
    if (!posting.character) return null;
    const career = newCareer(posting.character, null, now(), activeChapter().manifest.playerRank);
    const file = emptyFile();
    file.slots[0] = reconcile({ career, posting });
    return file;
  } catch {
    return null;
  }
}

function readFile(): SaveFile {
  const store = storage();
  if (!store) return emptyFile();
  let raw: string | null = null;
  try {
    raw = store.getItem(SAVE_KEY);
  } catch {
    return emptyFile();
  }
  if (raw === null) {
    let legacy: string | null = null;
    try {
      legacy = store.getItem(LEGACY_KEY);
    } catch {
      /* ignore */
    }
    const migrated = legacy ? migrateLegacy(legacy) : null;
    if (migrated) {
      try {
        store.setItem(SAVE_KEY, JSON.stringify(migrated));
      } catch {
        /* ignore */
      }
    }
    return migrated ?? emptyFile();
  }
  try {
    return fileSchema.parse(JSON.parse(raw)) as unknown as SaveFile;
  } catch {
    // Keep the unreadable data for recovery instead of overwriting it.
    try {
      store.setItem(`${SAVE_KEY}.unreadable`, raw);
    } catch {
      /* ignore */
    }
    return emptyFile();
  }
}

/** Record the ending of a finished posting unless the career already holds it. */
function reconcile(slot: SaveSlot): SaveSlot {
  const { career, posting } = slot;
  if (!posting?.ending || resultRecorded(career, posting)) return slot;
  return { career: applyChapterResult(career, chapterResultFrom(posting, now())), posting };
}

/** Put a slot into `useGame`. An empty slot clears the game; the chapter follows the posting. */
function loadIntoGame(slot: SaveSlot | null) {
  loading = true;
  try {
    const game = useGame.getState();
    if (!slot) {
      game.reset();
    } else if (!slot.posting) {
      game.reset();
    } else {
      setActiveChapter(slot.posting.chapterId);
      const merged = postingOptions().merge!(slot.posting, game) as unknown as SavedGame;
      const character = characterOf(slot.career) as Character;
      const personnel =
        slot.posting.personnel ??
        createPersonnel(
          character.traits,
          computeStats(character.traits, character.statDrift),
          character.earnedQuirks,
          character.curedTraits,
          character.statDrift,
          character.reputations,
        );
      useGame.setState({ ...merged, character, personnel });
    }
  } finally {
    loading = false;
  }
}

// --- Keeping the active slot in step with the game ---

function onGameChange(state: ReturnType<typeof useGame.getState>, prev: typeof state) {
  if (loading) return;
  const file = currentFile();
  const index = file.activeSlot;
  const slot = file.slots[index];
  if (!state.character) {
    // Between postings: keep the career, drop the posting.
    if (slot?.posting) writeSlot(index, { career: slot.career, posting: null });
    return;
  }
  let career =
    slot?.career ?? newCareer(state.character, null, now(), activeChapter().manifest.playerRank);
  career = {
    ...career,
    earnedQuirks: [...state.personnel.earnedQuirks],
    curedTraits: [...state.personnel.curedTraits],
    statDrift: { ...state.personnel.drift },
    reputations: [...state.personnel.reputations],
    languages: { bellaluxian: 3, ...career.languages, ...state.character.languages },
    languageProgress: { ...state.character.languageProgress },
    examAttempts: state.character.examAttempts ?? 0,
  };
  if (state.ending && !prev.ending)
    career = applyChapterResult(career, chapterResultFrom(state, now()));
  writeSlot(index, { career, posting: savedPosting(state) });
}

/** Load saves from storage (migrating the old single save) and start writing changes back. */
export function initSaves(): void {
  if (initialised) return;
  initialised = true;
  reloadSaves();
  useGame.subscribe(onGameChange);
}

/** Read storage again and load the active slot into the game. Used at start-up and by tests. */
export function reloadSaves(): void {
  const file = readFile();
  useSaves.setState(file, true);
  const slot = file.slots[file.activeSlot];
  if (slot) loadIntoGame(slot);
}

// --- Actions used by the screens ---

export function slotAt(index: SlotIndex): SaveSlot | null {
  return useSaves.getState().slots[index];
}

/** Make a slot the active one and load its posting; a career between postings starts a new one. */
export function continueSlot(index: SlotIndex): void {
  initSaves();
  const slot = slotAt(index);
  if (!slot) return;
  persist({ ...currentFile(), activeSlot: index });
  if (slot.posting) loadIntoGame(slot);
  else newPosting();
}

/** Prepare a new career in a slot. The old career is only replaced when the builder finishes. */
export function beginNewCareer(index: SlotIndex): void {
  initSaves();
  persist({ ...currentFile(), activeSlot: index });
  setActiveChapter(DEFAULT_CHAPTER_ID);
  loadIntoGame(null);
}

/** Called by the builder: create the career in the active slot and start its first posting. */
export function startCareer(character: Character, background: Partial<BackgroundChoice>): void {
  initSaves();
  setActiveChapter(DEFAULT_CHAPTER_ID);
  const career = newCareer(character, background, now(), activeChapter().manifest.playerRank);
  writeSlot(useSaves.getState().activeSlot, { career, posting: null });
  useGame.getState().start(characterOf(career) as Character);
}

/** After an ending: the career keeps its results and the same chapter starts again. */
export function newPosting(): void {
  const slot = slotAt(useSaves.getState().activeSlot);
  const character = slot ? (characterOf(slot.career) as Character) : useGame.getState().character;
  if (character) useGame.getState().start(character);
  else useGame.getState().reset();
}

export function deleteSlot(index: SlotIndex): void {
  initSaves();
  writeSlot(index, null);
  if (useSaves.getState().activeSlot === index) loadIntoGame(null);
}

export function exportSlot(index: SlotIndex): string | null {
  const slot = slotAt(index);
  return slot ? exportCareer(slot) : null;
}

export type ImportOutcome = { ok: true } | { ok: false; error: string };
export function importIntoSlot(index: SlotIndex, code: string): ImportOutcome {
  initSaves();
  if (slotAt(index)) return { ok: false, error: `Slot ${index + 1} is not empty.` };
  const result = importCareer(code);
  if (!result.ok) return result;
  if (result.slot.posting) {
    try {
      getChapter(result.slot.posting.chapterId);
    } catch {
      return { ok: false, error: "This career belongs to a chapter this version does not have." };
    }
  }
  writeSlot(index, reconcile(result.slot));
  return { ok: true };
}

/** One line for the title screen. */
export function describeSlot(slot: SaveSlot | null): string {
  if (!slot) return "Empty";
  const who = `${slot.career.identity.title} ${slot.career.identity.name}`;
  if (!slot.posting) {
    const n = slot.career.chapters.length;
    return `${who} · between postings · ${n} ${n === 1 ? "posting" : "postings"} completed`;
  }
  let label = slot.posting.chapterId;
  try {
    label = getChapter(slot.posting.chapterId).manifest.label;
  } catch {
    /* unknown chapter: show its id */
  }
  return `${who} · ${label} · Day ${slot.posting.day}`;
}
