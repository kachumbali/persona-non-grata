import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { activeChapter } from "./chapters";
import { availableFunds, initialEconomy } from "./economy";
import {
  applySetbacks,
  emptyProgress,
  missionReserve,
  nextStep,
  parseStepRef,
  progressFromVisit,
  setbacksBefore,
  stepCash,
  stepContext,
  stepLabel,
  stepStatus,
  taskComplete,
  findStep,
  routeStatus,
} from "./mission";
import type { MissionRoute, MissionStep } from "./chapters/types";
import { blocks, emails, startMeters, type PendingDecision } from "./rules";
import { useGame } from "./store";

const character = { title: "Mx", name: "Test", portrait: "diplomat-1", bio: "", traits: [] };
const manifest = () => activeChapter().manifest;
const quiet = () =>
  useGame.setState({
    events: [],
    handled: Object.fromEntries(emails().map((e) => [e.id, "reply"])),
  });
const work = (over: Partial<PendingDecision>): PendingDecision => ({
  id: "player-work",
  kind: "work",
  playerSlot: true,
  source: "You",
  text: "",
  effects: {},
  timeCost: 2,
  ...over,
});
const status = (task: string, step: string) =>
  stepStatus(stepContext(useGame.getState()), task, step);

describe("route requirements", () => {
  const route: MissionRoute = {
    id: "shortcut",
    label: "Shortcut",
    kind: "knowledge",
    dp: 1,
    cash: 0,
    days: 0,
    quality: "good",
    result: "Done.",
    requires: { fact: "objection", favour: "protocol", expiresDay: 6 },
  };
  const ctx = {
    day: 6,
    trust: {},
    owedToYou: {},
    knownFacts: [] as string[],
    flags: [] as string[],
    outcomes: {},
    spentRoutes: [] as string[],
  };
  it("hides knowledge routes until learned, then explains other requirements", () => {
    expect(routeStatus(route, ctx)).toEqual({ state: "undiscovered" });
    expect(routeStatus(route, { ...ctx, knownFacts: ["objection"] }).state).toBe("blocked");
    expect(
      routeStatus(route, { ...ctx, knownFacts: ["objection"], owedToYou: { protocol: 1 } }),
    ).toEqual({ state: "available" });
  });
  it("expires after the deadline or when already spent", () => {
    expect(routeStatus(route, { ...ctx, day: 7 })).toEqual({ state: "expired" });
    expect(routeStatus(route, { ...ctx, spentRoutes: ["shortcut"] })).toEqual({ state: "expired" });
  });
  it("accepts either trust or a favour for a contact route", () => {
    const either: MissionRoute = {
      ...route,
      kind: "favour",
      requires: { trustOrFavour: { character: "protocol", min: 55 } },
    };
    expect(routeStatus(either, ctx).state).toBe("blocked");
    expect(routeStatus(either, { ...ctx, trust: { protocol: { trust: 55 } } }).state).toBe(
      "available",
    );
    expect(routeStatus(either, { ...ctx, owedToYou: { protocol: 1 } }).state).toBe("available");
  });
});

describe("route delivery", () => {
  it("keeps a delayed route pending until its delivery day", () => {
    const step = manifest().missionSteps["clearance"]![0]!;
    const previous = step.routes;
    step.routes = [
      {
        id: "official",
        label: "File",
        kind: "official",
        dp: 1,
        cash: 0,
        days: 1,
        quality: "good",
        result: "Filed.",
      },
      {
        id: "quick",
        label: "Quick",
        kind: "money",
        dp: 1,
        cash: 0,
        days: 0,
        quality: "adequate",
        result: "Done.",
      },
    ];
    try {
      expect(useGame.getState().queue(work({ task: "clearance", route: "official" }))).toBe(true);
      useGame.getState().advance();
      expect(useGame.getState().missionSteps["clearance"]).not.toContain(step.id);
      expect(useGame.getState().routeDeliveries[`clearance.${step.id}`]?.dueDay).toBe(2);
      for (let i = 0; i < 3; i++) useGame.getState().advance();
      expect(useGame.getState().missionSteps["clearance"]).toContain(step.id);
      expect(useGame.getState().stepQualities["clearance"]?.[step.id]).toBe("good");
    } finally {
      if (previous) step.routes = previous;
      else delete step.routes;
    }
  });
});

beforeEach(() => {
  useGame.getState().start(character);
  quiet();
});

describe("the chapter's steps", () => {
  it("gives every task three or four ordered steps and keeps the task ids", () => {
    expect(Object.keys(manifest().missionTasks).sort()).toEqual([
      "clearance",
      "lounge",
      "programme",
      "security",
    ]);
    for (const task of Object.keys(manifest().missionTasks))
      expect(manifest().missionSteps[task]!.length).toBeGreaterThanOrEqual(3);
  });
  it("spreads the steps across the chapter", () => {
    const days = Object.values(manifest().missionSteps)
      .flat()
      .map((s) => s.earliestDay);
    expect(Math.min(...days)).toBe(1);
    expect(Math.max(...days)).toBeGreaterThanOrEqual(12);
    expect(days.filter((d) => d >= 8).length).toBeGreaterThanOrEqual(5);
  });
  it("parses task.step references", () => {
    expect(parseStepRef("clearance.landing-form")).toEqual({
      task: "clearance",
      step: "landing-form",
    });
    expect(parseStepRef("nothing")).toBeUndefined();
    expect(parseStepRef(undefined)).toBeUndefined();
  });
});

describe("step availability", () => {
  it("a step is blocked until its earliest day", () => {
    expect(status("clearance", "note-verbale")).toEqual({ state: "available" });
    expect(status("lounge", "reservation")).toEqual({ state: "blocked", reason: "from Day 2" });
    useGame.setState({ day: 2 });
    expect(status("lounge", "reservation")).toEqual({ state: "available" });
  });
  it("a step needs the step before it in its task", () => {
    useGame.setState({ day: 6 });
    expect(status("lounge", "deposit")).toEqual({
      state: "blocked",
      reason: "needs the provisional booking",
    });
  });
  it("a step can need a step in another task", () => {
    useGame.setState({ day: 10 });
    useGame.setState({
      missionSteps: {
        ...emptyProgress(),
        programme: ["first-draft", "amendments"],
        clearance: ["note-verbale"],
      },
    });
    expect(status("programme", "host-agreement")).toEqual({
      state: "blocked",
      reason: "needs the landing form",
    });
    useGame.setState({
      missionSteps: {
        ...useGame.getState().missionSteps,
        clearance: ["note-verbale", "landing-form"],
      },
    });
    expect(status("programme", "host-agreement")).toEqual({ state: "available" });
  });
  it("trust gates the step in person but not a colleague with the skill", () => {
    const step = findStep("clearance", "protocol-stamp")!;
    const routes = step.routes;
    delete step.routes;
    try {
      useGame.setState({
        day: 10,
        missionSteps: { ...emptyProgress(), clearance: ["note-verbale", "landing-form"] },
      });
      const low = { ...useGame.getState().colleagues };
      low["protocol"] = { trust: 40, fatigue: 0 };
      useGame.setState({ colleagues: low });
      const open = status("clearance", "protocol-stamp");
      expect(open.state).toBe("available");
      expect(open.state === "available" && open.hint).toContain("Director Ndao's trust");
      // In person: refused with the reason. The Consul can go instead.
      expect(useGame.getState().queue(work({ task: "clearance" }))).toBe(false);
      expect(useGame.getState().planError).toContain("Director Ndao's trust (55+)");
      expect(
        useGame.getState().queue(
          work({
            id: "work-ines",
            worker: "ines",
            task: "clearance",
            timeCost: 0,
            overload: true,
          }),
        ),
      ).toBe(true);
      useGame.getState().removeDecision("work-ines");
      low["protocol"] = { trust: 60, fatigue: 0 };
      useGame.setState({ colleagues: { ...low } });
      expect(status("clearance", "protocol-stamp")).toEqual({ state: "available" });
      expect(useGame.getState().queue(work({ task: "clearance" }))).toBe(true);
    } finally {
      if (routes) step.routes = routes;
    }
  });
  it("is closed on the arrival day", () => {
    useGame.setState({ day: 15, missionSteps: { ...emptyProgress(), programme: ["first-draft"] } });
    expect(status("programme", "amendments")).toMatchObject({ state: "blocked" });
    expect(useGame.getState().queue(work({ task: "programme" }))).toBe(false);
  });
  it("refuses a blocked or finished step and accepts the next one", () => {
    const q = useGame.getState().queue;
    expect(q(work({ task: "lounge", step: "deposit" }))).toBe(false);
    expect(useGame.getState().planError).toContain("Not yet");
    expect(q(work({ task: "clearance" }))).toBe(true);
    expect(useGame.getState().pending[0]?.step).toBe("note-verbale");
    useGame.getState().advance();
    expect(useGame.getState().missionSteps["clearance"]).toEqual(["note-verbale"]);
    expect(q(work({ task: "clearance", step: "note-verbale" }))).toBe(false);
    expect(useGame.getState().planError).toContain("already done");
  });
});

describe("confirming a task", () => {
  const routed: { step: MissionStep; routes: NonNullable<MissionStep["routes"]> }[] = [];
  beforeEach(() => {
    for (const step of Object.values(manifest().missionSteps).flat()) {
      if (step.routes) {
        routed.push({ step, routes: step.routes });
        delete step.routes;
      }
    }
  });
  afterEach(() => {
    for (const item of routed.splice(0)) item.step.routes = item.routes;
  });
  const doAll = (task: string) => {
    for (const step of manifest().missionSteps[task]!) {
      useGame.setState({ day: Math.max(useGame.getState().day, step.earliestDay), block: 0 });
      expect(useGame.getState().queue(work({ task, step: step.id })), step.id).toBe(true);
      useGame.getState().advance();
      useGame.setState({ block: 0 });
      quiet();
    }
  };
  it("is confirmed only when the last step is done", () => {
    useGame.setState({ day: 10 });
    for (const [i, step] of manifest().missionSteps["security"]!.entries()) {
      expect(useGame.getState().visit["security"]).toBeFalsy();
      expect(useGame.getState().queue(work({ task: "security", step: step.id }))).toBe(true);
      useGame.getState().advance();
      useGame.setState({ block: 0, day: 12 });
      quiet();
      expect(useGame.getState().missionSteps["security"]).toHaveLength(i + 1);
    }
    expect(useGame.getState().visit["security"]).toBe(true);
    expect(useGame.getState().score).toBeGreaterThanOrEqual(10);
    expect(taskComplete(useGame.getState().missionSteps, "security")).toBe(true);
  });
  it("a mail option confirms its step and nothing else", () => {
    useGame.setState({ day: 5, handled: {} });
    useGame.setState({
      missionSteps: { ...emptyProgress(), clearance: ["note-verbale"] },
    });
    useGame.getState().answer("visit-clearance", "reply");
    useGame.getState().advance();
    expect(useGame.getState().missionSteps["clearance"]).toEqual(["note-verbale", "landing-form"]);
    expect(useGame.getState().visit["clearance"]).toBeFalsy();
  });
  it("a mail for a step that is not open yet cannot confirm it", () => {
    useGame.setState({ day: 5, handled: {} });
    useGame.getState().answer("visit-clearance", "reply");
    expect(useGame.getState().pending).toHaveLength(0);
    expect(useGame.getState().planError).toContain("Not yet");
  });
  it("a mail for a step already done is answered and changes nothing", () => {
    useGame.setState({
      day: 5,
      handled: {},
      missionSteps: { ...emptyProgress(), clearance: ["note-verbale", "landing-form"] },
    });
    useGame.getState().answer("visit-clearance", "reply");
    expect(useGame.getState().pending).toHaveLength(1);
    useGame.getState().advance();
    expect(useGame.getState().missionSteps["clearance"]).toEqual(["note-verbale", "landing-form"]);
  });
  it("two tasks can be completed independently", () => {
    // The lounge's guest list needs Capital's amendments to the programme.
    useGame.setState({
      missionSteps: { ...emptyProgress(), programme: ["first-draft", "amendments"] },
    });
    doAll("lounge");
    expect(useGame.getState().visit["lounge"]).toBe(true);
    expect(useGame.getState().visit["clearance"]).toBeFalsy();
  });
});

describe("setbacks", () => {
  const dayBefore = (day: number) =>
    useGame.setState({ day: day - 1, block: 3, minute: blocks()[3]!.time });
  it("reopens a step that was done, and the task is no longer confirmed", () => {
    dayBefore(9);
    useGame.setState({
      missionSteps: {
        ...emptyProgress(),
        clearance: ["note-verbale", "landing-form", "protocol-stamp"],
      },
      visit: { clearance: true },
      setbacksApplied: setbacksBefore(8),
    });
    useGame.getState().advance();
    const s = useGame.getState();
    expect(s.day).toBe(9);
    expect(s.missionSteps["clearance"]).toEqual(["note-verbale", "protocol-stamp"]);
    expect(s.visit["clearance"]).toBe(false);
    expect(s.setbacksApplied).toContain("form-superseded");
    expect(
      s.report.some((r) => r.text.includes("version 7.3") && r.text.includes("Reopened")),
    ).toBe(true);
    // The reopened step comes back under its new name, and the next step is open to redo it.
    const step = findStep("clearance", "landing-form")!;
    expect(stepLabel(step, "clearance", s.setbacksApplied)).toBe("Landing form, version 7.3");
    expect(nextStep(s.missionSteps, "clearance")?.id).toBe("landing-form");
  });
  it("does not reopen a step that was not done; it changes its text and cost instead", () => {
    dayBefore(8);
    useGame.setState({ setbacksApplied: setbacksBefore(7) });
    useGame.getState().advance();
    const s = useGame.getState();
    expect(s.setbacksApplied).toContain("arrival-moves");
    expect(s.missionSteps["programme"] ?? []).toEqual([]);
    const host = findStep("programme", "host-agreement")!;
    expect(stepLabel(host, "programme", s.setbacksApplied)).toBe(
      "Host agreement on the new arrival time",
    );
    const motorcade = findStep("security", "motorcade")!;
    expect(stepCash(motorcade, "security", [])).toBe(400);
    expect(stepCash(motorcade, "security", s.setbacksApplied)).toBe(500);
  });
  it("lands each setback once, on its own day, with a mail on that day", () => {
    for (const setback of manifest().setbacks) {
      expect(emails().find((e) => e.id === setback.mail)?.day).toBe(setback.day);
    }
    const first = applySetbacks(8, emptyProgress(), []);
    expect(first.applied).toEqual(["arrival-moves"]);
    expect(applySetbacks(8, first.progress, first.applied).texts).toEqual([]);
    expect(applySetbacks(12, emptyProgress(), []).applied).toHaveLength(4);
  });
  it("leaves a steady player time to finish after every setback", () => {
    // Everything that could be done by Day 11 is done when the last setback lands on Day 12.
    const done = Object.fromEntries(
      Object.entries(manifest().missionSteps).map(([t, steps]) => [
        t,
        steps.filter((s) => s.earliestDay <= 11).map((s) => s.id),
      ]),
    );
    const landed = applySetbacks(12, done, []);
    expect(landed.reopened.length).toBeGreaterThanOrEqual(4);
    for (const { task, step } of landed.reopened)
      expect(findStep(task, step)!.earliestDay).toBeLessThanOrEqual(12);
    for (const task of Object.keys(manifest().missionTasks)) {
      const left = manifest().missionSteps[task]!.filter(
        (s) => !landed.progress[task]!.includes(s.id),
      );
      // One step a day from Day 12, the later ones not before their own earliest day.
      let day = 12;
      for (const step of left) {
        day = Math.max(day, step.earliestDay) + 1;
      }
      expect(day - 1, task).toBeLessThanOrEqual(14);
    }
  });
});

describe("the mission reserve", () => {
  it("holds the cash of every step still to do, plus what a setback could add", () => {
    expect(missionReserve(emptyProgress())).toBe(1900);
    expect(initialEconomy().missionReserve).toBe(1900);
    // The deposit is paid.
    expect(missionReserve({ ...emptyProgress(), lounge: ["reservation", "deposit"] })).toBe(1200);
  });
  it("is out of reach of hospitality and other optional spending", () => {
    const e = initialEconomy();
    expect(availableFunds(e, [])).toBe(2600);
    useGame.setState({ economy: { ...e, funds: e.ringFence + e.missionReserve! + 300 } });
    const q = useGame.getState().queue;
    expect(q(work({ id: "dinner", kind: "social", timeCost: 1, cashCost: 301 }))).toBe(false);
    expect(useGame.getState().planError).toContain("ring-fenced");
    expect(q(work({ id: "dinner", kind: "social", timeCost: 1, cashCost: 300 }))).toBe(true);
  });
  it("pays a step from the reserve even when nothing optional is left", () => {
    const progress = { ...emptyProgress(), lounge: ["reservation"] };
    const e = { ...initialEconomy(), missionReserve: missionReserve(progress) };
    useGame.setState({
      day: 6,
      economy: { ...e, funds: e.ringFence + e.missionReserve! },
      missionSteps: progress,
    });
    expect(useGame.getState().queue(work({ task: "lounge" }))).toBe(true);
    expect(useGame.getState().pending[0]).toMatchObject({ step: "deposit", stepCost: 500 });
    expect(availableFunds(useGame.getState().economy, useGame.getState().pending)).toBe(0);
    useGame.getState().advance();
    const after = useGame.getState().economy;
    expect(after.funds).toBe(e.ringFence + e.missionReserve! - 500);
    expect(after.missionReserve).toBe(1200);
    expect(availableFunds(after, [])).toBe(0);
  });
  it("does not charge a stalled assignment", () => {
    const e = initialEconomy();
    useGame.setState({
      day: 6,
      economy: e,
      missionSteps: { ...emptyProgress(), lounge: ["reservation"] },
      colleagues: { ...useGame.getState().colleagues, pavel: { trust: 10, fatigue: 0 } },
    });
    useGame
      .getState()
      .queue(
        work({ id: "work-pavel", worker: "pavel", task: "lounge", timeCost: 0, overload: true }),
      );
    useGame.getState().advance();
    expect(useGame.getState().economy.funds).toBe(e.funds);
    expect(useGame.getState().missionSteps["lounge"]).toEqual(["reservation"]);
  });
  it("keeps the reserve-raid as a deliberate, penalised choice", () => {
    const before = useGame.getState();
    useGame.getState().raidReserve();
    const s = useGame.getState();
    expect(s.economy.ringFence).toBe(before.economy.ringFence - 500);
    expect(s.meters.confidence).toBe(startMeters().confidence - 5);
    expect(s.economy.missionReserve).toBe(1900);
  });
  it("an old step cost never exceeds what was reserved for it", () => {
    for (const [task, steps] of Object.entries(manifest().missionSteps))
      for (const step of steps) {
        const applied = manifest().setbacks.map((s) => s.id);
        expect(stepCash(step, task, applied)).toBeLessThanOrEqual(
          missionReserve({
            ...Object.fromEntries(
              Object.keys(manifest().missionTasks).map((t) => [t, [] as string[]]),
            ),
            ...Object.fromEntries(
              Object.entries(manifest().missionSteps).map(([t, ss]) => [
                t,
                ss.filter((x) => !(t === task && x.id === step.id)).map((x) => x.id),
              ]),
            ),
          }),
        );
      }
  });
});

describe("saves from before the steps", () => {
  it("migrates: a confirmed task has all its steps done, past setbacks have landed", async () => {
    const migrate = useGame.persist.getOptions().migrate!;
    const migrated = (await migrate(
      { day: 9, block: 1, visit: { clearance: true, lounge: true }, meters: startMeters() },
      9,
    )) as ReturnType<typeof useGame.getState>;
    expect(migrated.missionSteps["clearance"]).toEqual(
      manifest().missionSteps["clearance"]!.map((s) => s.id),
    );
    expect(migrated.missionSteps["lounge"]).toHaveLength(3);
    expect(migrated.missionSteps["programme"]).toEqual([]);
    expect(migrated.setbacksApplied).toEqual(["arrival-moves", "form-superseded"]);
    expect(migrated.economy.missionReserve).toBe(700);
    expect(useGame.persist.getOptions().version).toBe(16);
    expect(migrated.favours).toEqual({ owedToYou: {}, youOwe: {} });
    expect(migrated.knownFacts).toEqual([]);
    expect(migrated.stepQualities["clearance"]?.["protocol-stamp"]).toBe("good");
  });
  it("merges a slot saved without steps the same way", () => {
    const merge = useGame.persist.getOptions().merge!;
    const old = {
      day: 5,
      visit: { security: true },
      economy: { funds: 9000, ringFence: 5500, supplementDue: null, supplementUsed: false },
    };
    const merged = merge(old, useGame.getState()) as ReturnType<typeof useGame.getState>;
    expect(merged.missionSteps["security"]).toHaveLength(3);
    expect(merged.visit["security"]).toBe(true);
    expect(merged.economy.missionReserve).toBe(missionReserve(merged.missionSteps));
    expect(merged.setbacksApplied).toEqual([]);
  });
  it("keeps the progress of a save that already has steps", () => {
    const merge = useGame.persist.getOptions().merge!;
    const old = {
      day: 5,
      missionSteps: { ...emptyProgress(), lounge: ["reservation"] },
      setbacksApplied: [],
    };
    const merged = merge(old, useGame.getState()) as ReturnType<typeof useGame.getState>;
    expect(merged.missionSteps["lounge"]).toEqual(["reservation"]);
  });
  it("progressFromVisit leaves unconfirmed tasks empty", () => {
    expect(progressFromVisit({ programme: true })["programme"]).toHaveLength(4);
    expect(progressFromVisit({})["programme"]).toEqual([]);
  });
});
