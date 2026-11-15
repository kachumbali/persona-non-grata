import { beforeEach, describe, expect, it } from "vitest";
import { activeChapter } from "./chapters";
import { demarcheAt, migrateDemarches, resolveDemarche, statusOf } from "./demarche";
import { emails } from "./rules";
import { inboxFor, useGame } from "./store";
import { routeContext, routeStatus } from "./mission";

const character = { title: "Mx", name: "Tester", portrait: "diplomat-1", bio: "", traits: [] };
const quiet = () =>
  useGame.setState({
    events: [],
    handled: Object.fromEntries(emails().map((e) => [e.id, "reply"])),
  });
beforeEach(() => {
  useGame.getState().start(character);
  quiet();
});

describe("démarche rules", () => {
  it("closes a contact's routes after refusing their call-in", () => {
    for (const step of Object.values(activeChapter().manifest.missionSteps).flat()) {
      for (const route of step.routes ?? []) {
        const person = route.consequences?.oweFavour;
        if (!person) continue;
        const s = useGame.getState();
        const ctx = { ...routeContext(s, "unused", "unused"), flags: [`refused-favour-${person}`] };
        expect(routeStatus(route, ctx), `${person} ${route.id}`).toEqual({ state: "expired" });
      }
    }
  });
  it("hides future instructions, supersedes the old umbrella note and skips expired old-save work", () => {
    const first = demarcheAt("umbrella-first")!;
    expect(statusOf(first, {}, 7, 0)).toBe("future");
    expect(statusOf(first, {}, 7, 1)).toBe("new");
    expect(statusOf(first, {}, 7, 2)).toBe("superseded");
    const migrated = migrateDemarches(8, 0);
    expect(migrated["fuel-quay-note"]?.status).toBe("skipped");
    expect(migrated["umbrella-second"]).toBeUndefined();
  });
  it("makes the note adequate and a low-ranking intern a protocol incident", () => {
    const d = demarcheAt("fuel-quay-note")!;
    const ctx = {
      day: 2,
      block: 0,
      traits: [],
      recipientTrust: 50,
      euTrust: 50,
      partnerTrust: 50,
      facts: [],
      worker: "maxim",
      delegationSucceeded: false,
    };
    expect(
      resolveDemarche(
        d,
        d.routes.find((r) => r.kind === "note")!,
        ctx,
      ).quality,
    ).toBe("adequate");
    const result = resolveDemarche(
      d,
      d.routes.find((r) => r.kind === "colleague")!,
      ctx,
    );
    expect(result).toMatchObject({ quality: "failed", incident: true });
    expect(result.goodwill).toBe(-6);
  });
  it("uses distinct authored messenger lines for embassy colleagues", () => {
    const d = demarcheAt("fuel-quay-note")!;
    const route = d.routes.find((item) => item.kind === "colleague")!;
    const lines = ["anselm", "ines", "bianca", "maxim", "sola"].map(
      (worker) =>
        resolveDemarche(d, route, {
          day: 2,
          block: 0,
          traits: [],
          recipientTrust: 50,
          euTrust: 50,
          partnerTrust: 50,
          facts: [],
          worker,
          delegationSucceeded: true,
        }).text,
    );
    expect(new Set(lines).size).toBe(5);
    expect(lines.find((line) => line.includes("wrong ministry"))).toBeTruthy();
  });
  it("fails an old instruction delivered after its correction", () => {
    const d = demarcheAt("umbrella-first")!;
    const outcome = resolveDemarche(
      d,
      d.routes.find((r) => r.kind === "self")!,
      {
        day: 7,
        block: 2,
        traits: [],
        recipientTrust: 80,
        euTrust: 50,
        partnerTrust: 50,
        facts: [],
      },
    );
    expect(outcome.quality).toBe("failed");
    expect(outcome.text).toContain("superseded");
  });
  it("treats a last-block EU letterhead delay as a failure", () => {
    const d = demarcheAt("letterhead-note")!;
    const outcome = resolveDemarche(
      d,
      d.routes.find((r) => r.kind === "eu")!,
      {
        day: 6,
        block: 1,
        traits: [],
        recipientTrust: 50,
        euTrust: 30,
        partnerTrust: 30,
        facts: [],
      },
    );
    expect(outcome.quality).toBe("failed");
    expect(outcome.text).toContain("letterhead");
  });
});

describe("démarches in the posting", () => {
  it("puts the two faxes on the board in their respective blocks", () => {
    const first = inboxFor(7, 720, {});
    const second = inboxFor(7, 900, {});
    expect(first.some((e) => e.id === "demarche-fax-umbrella-first")).toBe(true);
    expect(first.some((e) => e.id === "demarche-fax-umbrella-second")).toBe(false);
    expect(second.some((e) => e.id === "demarche-fax-umbrella-second")).toBe(true);
  });
  it("resolves a queued note once and makes the report available by fax", () => {
    useGame.setState({ day: 2, block: 0, minute: 480 });
    const g = useGame.getState();
    expect(
      g.queue({
        id: "demarche-fuel-quay-note",
        kind: "work",
        source: "Fuel",
        text: "",
        effects: {},
        demarcheId: "fuel-quay-note",
        demarcheRoute: "note",
        worker: "anselm",
        overload: true,
      }),
    ).toBe(true);
    g.advance();
    const s = useGame.getState();
    expect(s.demarches["fuel-quay-note"]).toMatchObject({
      status: "delivered",
      quality: "adequate",
      route: "note",
    });
    expect(s.storyFlags).toContain("demarche-fuel-quay-note-leak");
    expect(
      inboxFor(s.day, s.minute, s.handled, s.demarches).some(
        (e) => e.id === "demarche-report-fuel-quay-note",
      ),
    ).toBe(true);
    s.advance();
    expect(
      useGame.getState().goodwillHistory.filter((r) => r.source === "Fuel inspection"),
    ).toHaveLength(1);
  });
  it("records an unanswered deadline as a missed instruction", () => {
    useGame.setState({ day: 6, block: 1, minute: 720, demarches: migrateDemarches(6, 1) });
    useGame.getState().advance();
    const s = useGame.getState();
    expect(s.demarches["letterhead-note"]?.status).toBe("missed");
    expect(
      s.goodwillHistory.some(
        (entry) =>
          entry.source === "Joint European letterhead" && entry.kind === "Missed instruction",
      ),
    ).toBe(true);
  });
  it("carries a delayed joint delivery into the next block without recording a separate miss", () => {
    const colleagues = structuredClone(useGame.getState().colleagues);
    for (const id of ["eu", "eu-france", "eu-germany"]) colleagues[id]!.trust = 30;
    useGame.setState({
      day: 6,
      block: 1,
      minute: 720,
      location: "eu",
      colleagues,
      demarches: {
        ...migrateDemarches(6, 1),
        "letterhead-note": { status: "in-progress", coordinated: true },
      },
    });
    expect(
      useGame.getState().queue({
        id: "joint-letterhead",
        kind: "work",
        source: "Joint letterhead",
        text: "",
        effects: {},
        demarcheId: "letterhead-note",
        demarcheRoute: "eu",
      }),
    ).toBe(true);
    useGame.getState().advance();
    expect(useGame.getState().demarches["letterhead-note"]).toMatchObject({
      status: "in-progress",
      deliveryPending: true,
    });
    expect(useGame.getState().pending.find((p) => p.id === "joint-letterhead")?.timeCost).toBe(0);
    useGame.getState().advance();
    const state = useGame.getState();
    expect(state.demarches["letterhead-note"]).toMatchObject({
      status: "delivered",
      quality: "failed",
    });
    expect(
      state.goodwillHistory.filter((entry) => entry.source === "Joint European letterhead"),
    ).toHaveLength(1);
    expect(state.log.some((entry) => entry.text.includes("letterhead dispute"))).toBe(true);
  });
  it("delivers a deterministic unrequested note on a ministry trip only for the trait", () => {
    useGame.getState().start({ ...character, traits: ["demarche"] });
    quiet();
    expect(useGame.getState().move("ministry")).toBe(true);
    useGame.getState().advance();
    const s = useGame.getState();
    expect(s.unrequestedDemarches).toBe(1);
    expect(s.storyFlags.some((flag) => flag.startsWith("trait:demarche:"))).toBe(true);
    expect(activeChapter().demarches.unrequested).toHaveLength(4);
  });
  it("migrates an old posting without penalising already missed deadlines", async () => {
    const old = await useGame.persist.getOptions().migrate!({ day: 8, block: 0 }, 11);
    expect(old.demarches["fuel-quay-note"]?.status).toBe("skipped");
    expect(old.demarches["umbrella-second"]).toBeUndefined();
  });
});
