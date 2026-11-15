import { afterEach, describe, expect, it } from "vitest";
import {
  activeChapter,
  DEFAULT_CHAPTER_ID,
  getChapter,
  portHesperia2006,
  registerChapter,
  setActiveChapter,
  type ChapterPack,
} from "./index";
import { pickEnding } from "../rules";
import { initialEconomy, startRingFence } from "../economy";
import { useGame } from "../store";

const fixture: ChapterPack = {
  manifest: {
    id: "test-fixture",
    label: "Test chapter",
    title: "Two Days",
    year: 1999,
    era: "1999",
    city: "Testville",
    post: "Embassy of Nowhere, Testville",
    playerRank: "Clerk",
    missionActor: "Inspector",
    days: 2,
    blocks: [
      { name: "A", time: 480, social: "Coffee" },
      { name: "B", time: 720, social: "Lunch" },
      { name: "C", time: 900, social: "Tea" },
      { name: "D", time: 1140, social: "Dinner" },
    ],
    missionTasks: { t1: "The only task" },
    missionSteps: {
      t1: [
        { id: "only", label: "The only step", short: "the step", earliestDay: 1, result: "Done." },
      ],
    },
    setbacks: [],
    endings: {
      win: { title: "Done", text: "The inspector is satisfied." },
      fail: { title: "Not done", text: "The inspector is not." },
    },
    endingRules: [
      { ending: "fail", finalDay: true, missionIncomplete: true },
      { ending: "win", finalDay: true },
    ],
    startMeters: { confidence: 40, goodwill: 41, morale: 42, sanity: 43 },
    startEnergy: 60,
    startComposure: 61,
    startTrust: 30,
    startLocation: "office",
    officeLocation: "office",
    startRoom: "desk",
    startRelationships: [],
    openingLog: "Fixture opening.",
    economy: {
      startFunds: 777,
      visitReserves: { Only: 100 },
      supplement: { amount: 10, goodwillCost: 1, delay: 1 },
      reserveRelease: { amount: 10, goodwillCost: 1 },
      lateFuel: { protectedFlag: "none", cost: 0 },
    },
  },
  campaign: {
    characters: [
      {
        id: "c1",
        name: "Only Colleague",
        role: "Clerk",
        location: "office",
        likes: [],
        dislikes: [],
        skills: ["t1"],
        line: "Hello.",
        traits: ["process", "quiet"],
        wants: "A quiet office.",
        gender: "female",
        portrait: "npc-none",
      },
    ],
    venues: [],
    locations: [
      { id: "office", name: "Office", description: "A desk.", work: "Work", effects: {}, cost: 0 },
    ],
    dialogue: {},
    events: [],
  },
  dialogues: {},
  emails: [],
  invitations: [],
  press: { outlets: [], clippings: [], scenario: {} },
  postingBriefing: { from: "HQ", subject: "Hi", intro: "Welcome.", sections: [] },
  conversationPayoffs: [],
  staffDuties: {},
  embassy: { rooms: [], staff: [] },
  euRepresentation: {},
  mailChoices: {},
  demarches: { instructions: [], colleagueLines: {}, colleagueLevels: {}, unrequested: [] },
};

const character = { title: "Mx", name: "Tester", portrait: "diplomat-1", bio: "", traits: [] };

afterEach(() => {
  setActiveChapter(DEFAULT_CHAPTER_ID);
  useGame.getState().reset();
});

describe("chapter packs", () => {
  it("plays a two-day fixture chapter through to its ending", () => {
    registerChapter(fixture);
    setActiveChapter("test-fixture");
    useGame.getState().start(character);
    let g = useGame.getState();
    expect(g.chapterId).toBe("test-fixture");
    expect(g.meters).toEqual({ confidence: 40, goodwill: 41, morale: 42, sanity: 43 });
    expect(g.energy).toBe(60);
    expect(g.location).toBe("office");
    expect(g.economy.funds).toBe(777);
    expect(g.economy.ringFence).toBe(100);
    expect(g.log[0]?.text).toBe("Fixture opening.");
    for (let i = 0; i < 4; i++) {
      expect(useGame.getState().ending).toBeNull();
      useGame.getState().advance();
    }
    g = useGame.getState();
    // The last day is played: the ending comes when its final block has resolved.
    expect(g.day).toBe(2);
    expect(g.ending).toBeNull();
    for (let i = 0; i < 4; i++) {
      expect(useGame.getState().ending).toBeNull();
      useGame.getState().advance();
    }
    g = useGame.getState();
    expect(g.day).toBe(2);
    expect(g.ending).toBe("fail");
    expect(fixture.manifest.endings[g.ending!]?.title).toBe("Not done");
  });

  it("reaches the other ending when the mission task is confirmed", () => {
    registerChapter(fixture);
    setActiveChapter("test-fixture");
    useGame.getState().start(character);
    // Doing the task's only step confirms it; the step cash is drawn from the mission reserve.
    expect(
      useGame.getState().queue({
        id: "player-work",
        kind: "work",
        playerSlot: true,
        task: "t1",
        source: "You",
        text: "",
        effects: {},
        timeCost: 2,
      }),
    ).toBe(true);
    for (let i = 0; i < 8; i++) useGame.getState().advance();
    expect(useGame.getState().visit["t1"]).toBe(true);
    expect(useGame.getState().ending).toBe("win");
  });

  it("evaluates ending rules from the active chapter", () => {
    registerChapter(fixture);
    setActiveChapter("test-fixture");
    expect(pickEnding(fixture.manifest.startMeters, false)).toBeNull();
    expect(pickEnding(fixture.manifest.startMeters, true, {})).toBe("fail");
    setActiveChapter(DEFAULT_CHAPTER_ID);
    expect(initialEconomy().funds).toBe(10000);
    expect(startRingFence()).toBe(5500);
  });

  it("migrates old saves to the Port Hesperia chapter", async () => {
    const migrate = useGame.persist.getOptions().migrate!;
    const migrated = (await migrate({ day: 3 }, 8)) as { chapterId: string };
    expect(migrated.chapterId).toBe("port-hesperia-2006");
    expect(useGame.persist.getOptions().version).toBe(13);
  });

  it("rejects unknown chapters", () => {
    expect(() => getChapter("nope")).toThrow();
    expect(() => setActiveChapter("nope")).toThrow();
    expect(activeChapter().manifest.id).toBe(DEFAULT_CHAPTER_ID);
  });
});

describe("Port Hesperia pack", () => {
  const m = portHesperia2006.manifest;
  it("matches the values that used to be hard-coded", () => {
    expect(m.id).toBe("port-hesperia-2006");
    expect(m.label).toBe("Chapter 1");
    expect(m.days).toBe(15);
    expect(m.blocks.map((b) => b.time)).toEqual([480, 720, 900, 1140]);
    expect(Object.keys(m.missionTasks).sort()).toEqual([
      "clearance",
      "lounge",
      "programme",
      "security",
    ]);
    expect(Object.keys(m.endings).sort()).toEqual(
      ["ambassador", "cancelled", "png", "promoted", "replaced", "retired"].sort(),
    );
    expect(m.startMeters).toEqual({ confidence: 55, goodwill: 50, morale: 50, sanity: 70 });
    expect(m.economy.startFunds).toBe(10000);
    expect(m.economy.supplement).toEqual({ amount: 1500, goodwillCost: 5, delay: 2 });
  });

  it("orders its ending rules like the original pickEnding", () => {
    const ready = { clearance: true, lounge: true, programme: true, security: true };
    const start = m.startMeters;
    expect(pickEnding({ ...start, goodwill: 0, confidence: 0 }, false)).toBe("png");
    expect(pickEnding({ ...start, confidence: 0, sanity: 0 }, false)).toBe("replaced");
    expect(pickEnding({ ...start, sanity: 0 }, false)).toBe("retired");
    expect(pickEnding(start, false)).toBeNull();
    expect(pickEnding(start, true, { ...ready, lounge: false })).toBe("cancelled");
    expect(pickEnding({ ...start, confidence: 65, goodwill: 50 }, true, ready)).toBe("promoted");
    expect(pickEnding({ ...start, confidence: 64, goodwill: 50 }, true, ready)).toBe("ambassador");
  });
});
