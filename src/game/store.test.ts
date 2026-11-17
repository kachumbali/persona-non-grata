import { beforeEach, describe, expect, it } from "vitest";
import { blocks, campaign, emails, locationStories, startMeters } from "./rules";
import { workOnMissionSteps } from "./test-support";
import { inboxFor, useGame } from "./store";
const character = { title: "Mr", name: "Test", portrait: "diplomat-1", bio: "", traits: [] };
beforeEach(() => useGame.getState().start(character));

describe("scheduled game rounds", () => {
  it("validates a replacement route against the plan it replaces", () => {
    useGame.setState({ day: 2 });
    const decision = {
      id: "route",
      kind: "work" as const,
      task: "lounge",
      step: "reservation",
      source: "Lounge",
      text: "",
      effects: {},
    };
    expect(useGame.getState().queue({ ...decision, route: "official" })).toBe(true);
    expect(useGame.getState().queue({ ...decision, route: "marcel" }, true)).toBe(true);
    expect(useGame.getState().pending).toHaveLength(1);
    expect(useGame.getState().pending[0]?.route).toBe("marcel");
  });
  it("charges arrival goodwill once per adequate completed task", () => {
    useGame.setState({
      day: 14,
      block: 3,
      events: [],
      handled: Object.fromEntries(emails().map((e) => [e.id, "reply"])),
      visit: { lounge: true, security: true },
      stepQualities: { lounge: { reservation: "adequate" }, security: { "route-recon": "good" } },
    });
    const before = useGame.getState().meters.confidence;
    useGame.getState().advance();
    const s = useGame.getState();
    const quality = s.goodwillHistory.filter((entry) => entry.text.includes("with qualifications"));
    expect(quality).toHaveLength(1);
    expect(quality[0]!.after.confidence - quality[0]!.before.confidence).toBe(-2);
    expect(s.meters.confidence).toBeLessThanOrEqual(before - 2);
  });
  it("expires Bako's shortcut when the reshuffle clipping is read", () => {
    useGame.setState({ day: 9, block: 0, pressDay: 9, pressIds: ["fuel-9"] });
    useGame.getState().readPress();
    const s = useGame.getState();
    expect(s.storyFlags).toContain("reshuffle-public");
    expect(s.knownFacts).toContain("reshuffle-rumour");
  });
  it("a setback spends an expedited route and leaves the official route open", () => {
    useGame.setState({
      day: 11,
      block: 2,
      events: [],
      handled: Object.fromEntries(emails().map((e) => [e.id, "reply"])),
      missionSteps: { clearance: [], lounge: [], programme: [], security: ["advance-team"] },
      setbacksApplied: ["arrival-moves", "form-superseded", "delegation-grows"],
    });
    expect(
      useGame.getState().queue({
        id: "recon",
        kind: "work",
        task: "security",
        step: "route-recon",
        route: "marcel",
        source: "Recon",
        text: "",
        effects: {},
      }),
    ).toBe(true);
    useGame.getState().advance();
    useGame.getState().advance();
    const s = useGame.getState();
    expect(s.missionSteps["security"]).not.toContain("route-recon");
    expect(s.spentRoutes["security.route-recon"]).toContain("marcel");
    expect(
      s.queue({
        id: "official",
        kind: "work",
        task: "security",
        step: "route-recon",
        route: "official",
        source: "Recon",
        text: "",
        effects: {},
      }),
    ).toBe(true);
  });
  it("charges an expedited route once and presents its call-in two days later", () => {
    useGame.setState({
      day: 2,
      events: [],
      handled: Object.fromEntries(emails().map((e) => [e.id, "reply"])),
    });
    const before = useGame.getState();
    expect(
      before.queue({
        id: "expedite",
        kind: "work",
        task: "lounge",
        step: "reservation",
        route: "marcel",
        source: "Marcel",
        text: "",
        effects: {},
      }),
    ).toBe(true);
    useGame.getState().advance();
    let s = useGame.getState();
    expect(s.economy.funds).toBe(before.economy.funds - 200);
    expect(s.stepQualities["lounge"]?.["reservation"]).toBe("adequate");
    expect(s.favours.youOwe["fixer"]).toBe(1);
    expect(s.meters.goodwill).toBe(before.meters.goodwill - 2);
    for (let i = 0; i < 7; i++) useGame.getState().advance();
    s = useGame.getState();
    expect(s.day).toBe(4);
    expect(s.events.some((event) => event.id === "call-in-fixer")).toBe(true);
    expect(
      s.queue({
        id: "call",
        kind: "event",
        eventId: "call-in-fixer",
        eventChoice: "refuse",
        worker: "fixer",
        trust: -8,
        flag: "refused-favour-fixer",
        source: "Marcel",
        text: "Declined.",
        effects: {},
      }),
    ).toBe(true);
    s.advance();
    expect(useGame.getState().favours.youOwe["fixer"]).toBe(0);
    expect(useGame.getState().storyFlags).toContain("refused-favour-fixer");
    expect(useGame.getState().colleagues["fixer"]?.trust).toBe(41); // first impression before the refusal
  });
  it("records a choice's favour and fact only when the round resolves", () => {
    useGame.setState({
      events: [],
      handled: Object.fromEntries(emails().map((e) => [e.id, "reply"])),
    });
    expect(
      useGame.getState().queue({
        id: "learning",
        source: "Conversation",
        text: "Agreed.",
        effects: {},
        kind: "dialogue",
        favour: { character: "protocol", delta: 1 },
        teaches: "protocol-objection",
      }),
    ).toBe(true);
    expect(useGame.getState().favours.owedToYou["protocol"]).toBeUndefined();
    expect(useGame.getState().knownFacts).toEqual([]);
    useGame.getState().advance();
    expect(useGame.getState().favours.owedToYou["protocol"]).toBe(1);
    expect(useGame.getState().knownFacts).toContain("protocol-objection");
  });
  it("keeps goodwill unchanged until the player ends the round", () => {
    useGame.getState().answer("e1", "reply");
    expect(useGame.getState().meters.confidence).toBe(55);
    useGame.getState().advance();
    // The unanswered Capital fax waits through the first-day grace period (see first-day.test.ts).
    expect(useGame.getState().meters.confidence).toBe(61);
    expect(useGame.getState().block).toBe(1);
    expect(useGame.getState().report.length).toBeGreaterThan(0);
  });
  it("records missed instructions at round end", () => {
    useGame.getState().advance();
    // Day 1 Capital mail is not ignored until the end of Midday.
    expect(useGame.getState().goodwillHistory.some((c) => c.kind === "Missed instruction")).toBe(
      false,
    );
    useGame.getState().advance();
    expect(useGame.getState().meters.confidence).toBe(44); // was 38: the first ignored fax costs half
    expect(useGame.getState().goodwillHistory.some((c) => c.kind === "Missed instruction")).toBe(
      true,
    );
  });
  it("allows personal activities within the expanded DP budget", () => {
    const queue = useGame.getState().queue;
    expect(
      queue({
        id: "a",
        source: "First",
        text: "First",
        effects: {},
        kind: "work",
        playerSlot: true,
      }),
    ).toBe(true);
    expect(
      queue({
        id: "b",
        source: "Second",
        text: "Second",
        effects: {},
        kind: "dialogue",
        playerSlot: true,
      }),
    ).toBe(true);
  });
  it("persists a story choice only on resolution and records missed stories once", () => {
    const supplier = campaign().events.find((event) => event.id === "supplier")!;
    useGame.setState({
      events: [supplier],
      handled: Object.fromEntries(emails().map((e) => [e.id, "reply"])),
    });
    useGame.getState().queue({
      id: "event-supplier",
      source: supplier.title,
      text: "Accepted",
      effects: {},
      kind: "event",
      eventId: "supplier",
      eventChoice: "accept",
    });
    expect(useGame.getState().storyOutcomes["supplier"]).toBeUndefined();
    useGame.getState().advance();
    expect(useGame.getState().storyOutcomes["supplier"]).toEqual({
      status: "chosen",
      choice: "accept",
    });
    expect(
      useGame.persist.getOptions().partialize?.(useGame.getState()).storyOutcomes["supplier"],
    ).toEqual({ status: "chosen", choice: "accept" });
    useGame.getState().start(character);
    useGame.setState({
      events: [supplier],
      handled: Object.fromEntries(emails().map((e) => [e.id, "reply"])),
    });
    useGame.getState().advance();
    expect(useGame.getState().storyOutcomes["supplier"]).toEqual({ status: "missed" });
    expect(useGame.getState().completedEvents).toContain("supplier");
  });
  it("migrates an existing supplier choice and preserves the scheduled day", async () => {
    const current = useGame.getState();
    const oldSave = {
      ...current,
      day: 3,
      completedEvents: ["supplier"],
      storyFlags: ["supplier-accepted"],
      storyOutcomes: undefined,
    };
    const migrated = await useGame.persist.getOptions().migrate!(oldSave, 3);
    expect(migrated.storyOutcomes["supplier"]).toEqual({ status: "chosen", choice: "accept" });
    expect(migrated.events).toEqual(current.events);
    expect(migrated.day).toBe(3);
  });
  it.each([
    {
      initial: "check",
      lead: "supplier-followup",
      choice: "transparent",
      flag: "supplier-transparent",
    },
    { initial: "accept", lead: "supplier-accepted-followup", choice: "pay", flag: "supplier-pay" },
  ])(
    "resolves the supplier $initial branch at the bar and pays it off at the visit",
    ({ initial, lead, choice, flag }) => {
      const allMail = Object.fromEntries(emails().map((email) => [email.id, "reply"]));
      useGame.setState({
        day: 2,
        block: 0,
        minute: blocks()[0]!.time,
        events: [],
        handled: allMail,
        completedEvents: ["supplier"],
        storyOutcomes: { supplier: { status: "chosen", choice: initial } },
      });
      expect(useGame.getState().move("bar")).toBe(true);
      const g = useGame.getState();
      const event = locationStories(g.day, g.completedEvents, g.storyOutcomes).find(
        (item) => item.id === lead,
      )!;
      const selected = event.choices.find((item) => item.id === choice)!;
      expect(
        g.queue({
          id: `event-${event.id}`,
          kind: "event",
          source: event.title,
          text: selected.result!,
          effects: selected.effects ?? {},
          eventId: event.id,
          eventChoice: selected.id,
          flag: selected.flag,
          timeCost: 1,
          location: event.location,
        }),
      ).toBe(true);
      g.advance();
      expect(useGame.getState().storyFlags).toContain(flag);
      expect(
        locationStories(
          2,
          useGame.getState().completedEvents,
          useGame.getState().storyOutcomes,
        ).some((event) => event.id === lead),
      ).toBe(false);
      useGame.setState({
        day: 14,
        block: 3,
        minute: blocks()[3]!.time,
        events: [],
        visit: { clearance: true, lounge: true, programme: true, security: true },
      });
      useGame.getState().advance();
      expect(
        useGame
          .getState()
          .goodwillHistory.some((entry) => entry.source === "Reception procurement"),
      ).toBe(true);
    },
  );
  it.each([
    {
      initial: "apologise",
      lead: "seating-apology-followup",
      choice: "compromise",
      flag: "protocol-compromise",
      delta: 2,
    },
    {
      initial: "capital",
      lead: "seating-capital-followup",
      choice: "unchanged",
      flag: "protocol-unchanged",
      delta: -3,
    },
  ])(
    "makes the $initial protocol choice matter at the ministry and visit",
    ({ initial, lead, choice, flag, delta }) => {
      useGame.setState({
        day: 4,
        block: 0,
        minute: blocks()[0]!.time,
        events: [],
        handled: Object.fromEntries(emails().map((e) => [e.id, "reply"])),
        completedEvents: ["seating-complaint"],
        storyOutcomes: { "seating-complaint": { status: "chosen", choice: initial } },
      });
      expect(useGame.getState().move("ministry")).toBe(true);
      const g = useGame.getState();
      const event = locationStories(g.day, g.completedEvents, g.storyOutcomes).find(
        (item) => item.id === lead,
      )!;
      const selected = event.choices.find((item) => item.id === choice)!;
      expect(
        g.queue({
          id: `event-${lead}`,
          kind: "event",
          source: event.title,
          text: selected.result!,
          effects: selected.effects ?? {},
          eventId: event.id,
          eventChoice: selected.id,
          flag: selected.flag,
          timeCost: 1,
          location: event.location,
        }),
      ).toBe(true);
      g.advance();
      expect(useGame.getState().storyFlags).toContain(flag);
      useGame.setState({
        day: 14,
        block: 3,
        minute: blocks()[3]!.time,
        events: [],
        visit: { clearance: true, lounge: true, programme: true, security: true },
      });
      useGame.getState().advance();
      const payoff = useGame
        .getState()
        .goodwillHistory.find((entry) => entry.source === "Protocol seating");
      expect(payoff!.after.goodwill - payoff!.before.goodwill).toBe(delta);
    },
  );
  it.each([
    {
      initial: "honest",
      lead: "press-honest-followup",
      choice: "background",
      flag: "press-background",
      confidence: 2,
    },
    {
      initial: "promise",
      lead: "press-promise-followup",
      choice: "double-down",
      flag: "press-doubledown",
      confidence: -4,
    },
  ])(
    "carries the $initial press briefing through to visit-day coverage",
    ({ initial, lead, choice, flag, confidence }) => {
      useGame.setState({
        day: 2,
        block: 0,
        minute: blocks()[0]!.time,
        events: [],
        handled: Object.fromEntries(emails().map((e) => [e.id, "reply"])),
        completedEvents: ["press"],
        storyOutcomes: { press: { status: "chosen", choice: initial } },
      });
      expect(useGame.getState().move("pressclub")).toBe(true);
      const g = useGame.getState();
      const event = locationStories(g.day, g.completedEvents, g.storyOutcomes).find(
        (item) => item.id === lead,
      )!;
      const selected = event.choices.find((item) => item.id === choice)!;
      expect(
        g.queue({
          id: `event-${lead}`,
          kind: "event",
          source: event.title,
          text: selected.result!,
          effects: selected.effects ?? {},
          eventId: event.id,
          eventChoice: selected.id,
          flag: selected.flag,
          timeCost: 1,
          location: event.location,
        }),
      ).toBe(true);
      g.advance();
      expect(useGame.getState().storyFlags).toContain(flag);
      useGame.setState({
        day: 14,
        block: 3,
        minute: blocks()[3]!.time,
        events: [],
        visit: { clearance: true, lounge: true, programme: true, security: true },
      });
      useGame.getState().advance();
      const payoff = useGame
        .getState()
        .goodwillHistory.find((entry) => entry.source === "Press coverage");
      expect(payoff!.after.confidence - payoff!.before.confidence).toBe(confidence);
    },
  );
  it.each([
    {
      initial: "useful",
      lead: "development-beneficiaries-followup",
      choice: "voices",
      flag: "development-voices",
      goodwill: 3,
    },
    {
      initial: "photo",
      lead: "development-photo-followup",
      choice: "speeches",
      flag: "development-speeches",
      goodwill: -3,
    },
  ])(
    "carries the $initial development choice through the UN visit",
    ({ initial, lead, choice, flag, goodwill }) => {
      useGame.setState({
        day: 3,
        block: 0,
        minute: blocks()[0]!.time,
        events: [],
        handled: Object.fromEntries(emails().map((e) => [e.id, "reply"])),
        completedEvents: ["elise"],
        storyOutcomes: { elise: { status: "chosen", choice: initial } },
      });
      expect(useGame.getState().move("un")).toBe(true);
      const g = useGame.getState();
      const event = locationStories(g.day, g.completedEvents, g.storyOutcomes).find(
        (item) => item.id === lead,
      )!;
      const selected = event.choices.find((item) => item.id === choice)!;
      expect(
        g.queue({
          id: `event-${lead}`,
          kind: "event",
          source: event.title,
          text: selected.result!,
          effects: selected.effects ?? {},
          eventId: event.id,
          eventChoice: selected.id,
          flag: selected.flag,
          timeCost: 1,
          location: event.location,
        }),
      ).toBe(true);
      g.advance();
      expect(useGame.getState().storyFlags).toContain(flag);
      useGame.setState({
        day: 14,
        block: 3,
        minute: blocks()[3]!.time,
        events: [],
        visit: { clearance: true, lounge: true, programme: true, security: true },
      });
      useGame.getState().advance();
      const payoff = useGame
        .getState()
        .goodwillHistory.find((entry) => entry.source === "Development project");
      expect(payoff!.after.goodwill - payoff!.before.goodwill).toBe(goodwill);
    },
  );
  it.each([
    { response: "attend", lead: "asteria-coffee-followup" },
    { response: "delegate", lead: "asteria-coffee-delegated-followup" },
  ])(
    "unlocks the Asterian follow-up after the $response invitation response",
    ({ response, lead }) => {
      useGame.setState({
        day: 9,
        block: 0,
        minute: blocks()[0]!.time,
        events: [],
        handled: Object.fromEntries(emails().map((e) => [e.id, "reply"])),
        completedEvents: ["asteria-coffee"],
        storyOutcomes: { "asteria-coffee": { status: "chosen", choice: response } },
      });
      expect(useGame.getState().move("eu")).toBe(true);
      const g = useGame.getState();
      const event = locationStories(g.day, g.completedEvents, g.storyOutcomes).find(
        (item) => item.id === lead,
      )!;
      const selected = event.choices.find((item) => item.id === "compromise")!;
      expect(
        g.queue({
          id: `event-${lead}`,
          kind: "event",
          source: event.title,
          text: selected.result!,
          effects: selected.effects ?? {},
          eventId: event.id,
          eventChoice: selected.id,
          flag: selected.flag,
          timeCost: 1,
          location: event.location,
        }),
      ).toBe(true);
      g.advance();
      expect(useGame.getState().storyFlags).toContain("asteria-compromise");
    },
  );
  it("does not auto-expire a location lead still present in a pre-update day's schedule", () => {
    const lead = campaign().events.find((event) => event.id === "supplier-followup")!;
    useGame.setState({
      events: [lead],
      handled: Object.fromEntries(emails().map((e) => [e.id, "reply"])),
      completedEvents: ["supplier"],
      storyOutcomes: { supplier: { status: "chosen", choice: "check" } },
    });
    useGame.getState().advance();
    expect(useGame.getState().storyOutcomes[lead.id]).toBeUndefined();
    expect(useGame.getState().completedEvents).not.toContain(lead.id);
  });
  it("records conversation completion only when resolved and pays off the menu at the visit", () => {
    useGame.setState({
      events: [],
      handled: Object.fromEntries(emails().map((e) => [e.id, "reply"])),
    });
    const choice = {
      id: "talk",
      source: "Ketu · menu",
      text: "Garlic approved",
      effects: {},
      kind: "dialogue" as const,
      worker: "ketu",
      overload: true,
      dialogueTopic: "ketu:menu",
      flag: "menu-garlic",
    };
    expect(useGame.getState().queue(choice)).toBe(true);
    expect(useGame.getState().storyFlags).not.toContain("dialogue:ketu:menu");
    useGame.getState().removeDecision("talk");
    expect(useGame.getState().storyFlags).not.toContain("menu-garlic");
    useGame.getState().queue(choice);
    useGame.getState().advance();
    expect(useGame.getState().storyFlags).toContain("dialogue:ketu:menu");
    useGame.setState({
      day: 14,
      block: 3,
      minute: blocks()[3]!.time,
      events: [],
      visit: { clearance: true, lounge: true, programme: true, security: true },
    });
    useGame.getState().advance();
    const payoff = useGame
      .getState()
      .goodwillHistory.find((entry) => entry.source === "The Minister’s menu");
    expect(payoff?.text).toContain("garlic");
    expect(payoff!.after.confidence - payoff!.before.confidence).toBe(-5);
    expect(payoff!.after.goodwill - payoff!.before.goodwill).toBe(3);
  });
  it("does not permit overspending reserved hospitality money", () => {
    const queue = useGame.getState().queue;
    expect(
      queue({
        id: "a",
        source: "Dinner",
        text: "Dinner",
        effects: {},
        cashCost: 2200,
        timeCost: 1,
        kind: "social",
      }),
    ).toBe(true);
    expect(
      queue({
        id: "b",
        source: "Convoy",
        text: "Convoy",
        effects: {},
        cashCost: 401,
        timeCost: 1,
        kind: "work",
      }),
    ).toBe(false);
  });
  it("colleagues do not take evening work assignments", () => {
    useGame.setState({ block: 3 });
    expect(
      useGame.getState().queue({
        id: "a",
        source: "Lounge",
        text: "Done",
        effects: {},
        kind: "work",
        worker: "pavel",
        task: "lounge",
      }),
    ).toBe(false);
  });
  it("hostile colleagues fail a joint assignment", () => {
    useGame.setState({ handled: { e1: "reply" } });
    useGame.getState().queue({
      id: "joint",
      source: "Programme",
      text: "Done",
      effects: {},
      kind: "work",
      worker: "anselm",
      partner: "pavel",
      task: "programme",
      overload: true,
    });
    useGame.getState().advance();
    expect(useGame.getState().visit["programme"]).toBeUndefined();
    expect(useGame.getState().report.some((r) => r.text.includes("work stalled"))).toBe(true);
  });
  it("competent independent delegation does the next step of a visit requirement", () => {
    useGame.setState({ day: 3 });
    useGame.getState().queue({
      id: "security",
      source: "Security",
      text: "Security requested",
      effects: {},
      kind: "work",
      worker: "pavel",
      task: "security",
      overload: true,
    });
    useGame.getState().advance();
    expect(useGame.getState().missionSteps["security"]).toEqual(["advance-team"]);
    // One step is not the task: the lounge is confirmed only when its last step is done.
    expect(useGame.getState().visit["security"]).toBeUndefined();
    expect(useGame.getState().score).toBe(0);
  });
  it("replaces the player at zero HQ goodwill and prevents further rounds", () => {
    useGame.setState({ meters: { ...startMeters(), confidence: 6 } });
    useGame.getState().answer("e1", "note");
    useGame.getState().advance();
    expect(useGame.getState().ending).toBe("replaced");
    const day = useGame.getState().day,
      block = useGame.getState().block;
    useGame.getState().advance();
    expect(useGame.getState().day).toBe(day);
    expect(useGame.getState().block).toBe(block);
  });
  it("zero host goodwill causes PNG on resolution", () => {
    useGame.setState({ meters: { ...startMeters(), goodwill: 4 }, handled: { e1: "reply" } });
    useGame.getState().queue({
      id: "loss",
      source: "Incident",
      text: "Expelled",
      effects: { goodwill: -4 },
      kind: "event",
    });
    useGame.getState().advance();
    expect(useGame.getState().ending).toBe("png");
  });
  it("missing programme cancels the visit once the arrival day has been played", () => {
    useGame.setState({
      day: 14,
      block: 3,
      minute: blocks()[3]!.time,
      events: [],
      handled: Object.fromEntries(emails().map((e) => [e.id, "reply"])),
      visit: { clearance: true, lounge: true, security: true },
    });
    useGame.getState().advance();
    // Day 15 starts and is played; the ending is decided when its last block resolves.
    expect(useGame.getState().day).toBe(15);
    expect(useGame.getState().block).toBe(0);
    expect(useGame.getState().ending).toBeNull();
    for (let i = 0; i < 3; i++) {
      useGame.getState().advance();
      expect(useGame.getState().ending).toBeNull();
    }
    expect(useGame.getState().block).toBe(3);
    useGame.getState().advance();
    expect(useGame.getState().day).toBe(15);
    expect(useGame.getState().ending).toBe("cancelled");
  });
  it("a meter at zero still ends the posting during the arrival day", () => {
    useGame.setState({
      day: 15,
      block: 1,
      minute: blocks()[1]!.time,
      events: [],
      handled: Object.fromEntries(emails().map((e) => [e.id, "reply"])),
      meters: { ...startMeters(), confidence: 1 },
      visit: { clearance: true, lounge: true, security: true, programme: true },
    });
    useGame.getState().queue({
      id: "blunder",
      source: "Apron",
      text: "The Minister is received by the wrong delegation.",
      effects: { confidence: -5 },
      kind: "event",
    });
    useGame.getState().advance();
    expect(useGame.getState().ending).toBe("replaced");
  });
  it("four blocks make one working day", () => {
    useGame.setState({
      events: [],
      handled: Object.fromEntries(emails().map((e) => [e.id, "reply"])),
    });
    for (let i = 0; i < 4; i++) useGame.getState().advance();
    expect(useGame.getState().day).toBe(2);
    expect(useGame.getState().block).toBe(0);
    expect(useGame.getState().minute).toBe(480);
  });
  it("a prepared campaign reaches a successful day-15 ending", () => {
    for (let turn = 0; turn < 60; turn++) {
      workOnMissionSteps();
      const s = useGame.getState();
      for (const email of inboxFor(s.day, s.minute, s.handled)) {
        if (!email.status) s.answer(email.id, "reply");
      }
      const event = s.events[s.block];
      const choice =
        event?.choices.find((c) => !c.replace && (c.effects?.goodwill ?? 0) >= 0) ??
        event?.choices[0];
      if (event && choice)
        s.queue({
          id: `event-${event.id}`,
          source: event.title,
          text: choice.result ?? "Resolved",
          kind: "event",
          effects: choice.effects ?? {},
          eventId: event.id,
        });
      s.advance();
      if (useGame.getState().ending) break;
    }
    expect(useGame.getState().day).toBe(15);
    expect(useGame.getState().visit["programme"]).toBe(true);
    expect(["promoted", "ambassador"]).toContain(useGame.getState().ending);
  });
  it("repeated diplomatic outcomes cannot farm Mission Standing", () => {
    useGame.setState({
      events: [],
      handled: Object.fromEntries(emails().map((e) => [e.id, "reply"])),
    });
    for (let i = 0; i < 2; i++) {
      useGame.getState().queue({
        id: "coalition",
        source: "EU coalition",
        text: "Agreed",
        effects: {},
        kind: "work",
        score: 3,
        playerSlot: true,
      });
      useGame.getState().advance();
    }
    expect(useGame.getState().score).toBe(3);
  });
});
