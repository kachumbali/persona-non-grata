import { beforeEach, describe, expect, it } from "vitest";
import { clippingTriggered, clippings, pressReview } from "./press";
import { EMAILS, BLOCKS } from "./rules";
import { accidentalReplyAll } from "./character";
import { useGame } from "./store";
const character = { title: "Mx", name: "Test", portrait: "diplomat-1", bio: "", traits: [] };
beforeEach(() => {
  useGame.getState().start(character);
  useGame.setState({ events: [], handled: Object.fromEntries(EMAILS.map((e) => [e.id, "reply"])) });
});
describe("morning press", () => {
  it("selects deterministically with a scenario on each story day", () => {
    const s = useGame.getState();
    for (let day = 1; day <= 15; day++) {
      const a = pressReview(s, day);
      expect(a).toEqual(pressReview(s, day));
      expect(a.clippings.length).toBeGreaterThanOrEqual(3);
      expect(a.clippings.length).toBeLessThanOrEqual(4);
      if ([2, 4, 5, 7, 8, 9, 11, 13].includes(day)) expect(a.clippings[0]?.signal).toBe(true);
    }
  });
  it("evaluates triggers and excludes seen once items", () => {
    const s = useGame.getState();
    const cases: [string, Partial<ReturnType<typeof useGame.getState>>][] = [
      ["consequence-double", { storyFlags: ["press-doubledown"] }],
      ["consequence-namedrop", { storyFlags: ["trait:namedrop:meeting"] }],
      ["consequence-accident", { storyFlags: ["trait-accident:replyall:e1"] }],
      [
        "consequence-seating",
        { storyOutcomes: { "seating-complaint": { status: "missed" as const } } },
      ],
      ["consequence-cold", { meters: { ...s.meters, goodwill: 24 } }],
      [
        "consequence-ruth",
        {
          colleagues: {
            ...s.colleagues,
            journalist: { ...s.colleagues["journalist"]!, trust: 29 },
          },
        },
      ],
    ];
    for (const [id, patch] of cases) {
      const c = clippings.find((c) => c.id === id)!;
      expect(clippingTriggered(c, { ...s, ...patch })).toBe(true);
      expect(
        pressReview({ ...s, ...patch, pressSeen: [id] }, 4).clippings.some((x) => x.id === id),
      ).toBe(false);
    }
  });
  it("uses Maxim for fatigue, previous evening work and seeded chance", () => {
    const s = useGame.getState();
    expect(
      pressReview(
        {
          ...s,
          colleagues: { ...s.colleagues, press: { ...s.colleagues["press"]!, fatigue: 70 } },
        },
        1,
      ).compiler,
    ).toBe("maxim");
    expect(
      pressReview(
        {
          ...s,
          yesterday: {
            3: [{ id: "x", kind: "work", worker: "press", source: "x", text: "x", effects: {} }],
          },
        },
        1,
      ).compiler,
    ).toBe("maxim");
    expect(pressReview({ ...s, seed: 1 }, 2).compiler).toBe("maxim");
  });
  it("records resolved trait choices and unrecalled accidents", () => {
    useGame.getState().queue({
      id: "x",
      kind: "event",
      source: "meeting",
      text: "x",
      effects: {},
      traitChoice: "namedrop",
    });
    useGame.getState().advance();
    expect(useGame.getState().storyFlags).toContain("trait:namedrop:meeting");
    const email = EMAILS.find(
      (e) => e.day === 1 && e.options.reply && accidentalReplyAll(23, 1, e.id),
    )!;
    for (const recalled of [true, false]) {
      useGame.getState().start({ ...character, traits: ["replyall"] });
      useGame.setState({ events: [], handled: {} });
      useGame.getState().answer(email.id, "reply");
      if (recalled) useGame.getState().recall(email.id);
      useGame.getState().advance();
      expect(useGame.getState().storyFlags.includes(`trait-accident:replyall:${email.id}`)).toBe(
        !recalled,
      );
    }
  });
  it("records one Capital clipping per day and its actual change", () => {
    useGame.setState({ day: 2 });
    useGame.getState().preparePress();
    const id = useGame.getState().pressIds[0]!;
    const before = useGame.getState().meters.confidence;
    useGame.getState().clipPress(id);
    useGame.getState().clipPress(id);
    expect(useGame.getState().meters.confidence).toBe(before + 2);
    expect(
      useGame.getState().goodwillHistory.filter((x) => x.source === "Press review"),
    ).toHaveLength(1);
  });
  it.each([
    ["buy", false],
    ["coordinate", false],
    ["ignore", true],
    ["none", true],
  ])("charges late fuel for %s: %s", (choice, surcharge) => {
    if (choice !== "none") {
      useGame.getState().queue({
        id: "fuel",
        kind: "event",
        source: "fuel",
        text: "fuel",
        effects: {},
        eventId: "fuel-quay",
        eventChoice: choice,
      });
      useGame.getState().advance();
    }
    useGame.setState({
      day: 14,
      block: 3,
      minute: BLOCKS[3].time,
      events: [],
      visit: { clearance: true, lounge: true, programme: true, security: true },
    });
    const before = useGame.getState().economy.funds;
    useGame.getState().advance();
    expect(useGame.getState().goodwillHistory.some((x) => x.source === "Fuel quay")).toBe(
      surcharge,
    );
    expect(useGame.getState().economy.funds).toBe(before - (surcharge ? 400 : 0));
  });
  it("migrates version 7 with empty press state", async () => {
    const s = useGame.getState();
    const old = {
      ...s,
      pressSeen: undefined,
      pressDay: undefined,
      pressIds: undefined,
      pressRead: undefined,
      pressClippedDay: undefined,
    };
    const migrated = await useGame.persist.getOptions().migrate!(old, 7);
    expect(migrated.pressSeen).toEqual([]);
    expect(migrated.pressDay).toBe(0);
  });
});
