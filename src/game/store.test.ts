import { beforeEach, describe, expect, it } from "vitest";
import { BLOCKS, EMAILS, START_METERS } from "./rules";
import { inboxFor, useGame } from "./store";
const character = { title: "Mr", name: "Test", face: 0, bio: "", traits: [] };
beforeEach(() => useGame.getState().start(character));

describe("scheduled game rounds", () => {
  it("keeps goodwill unchanged until the player ends the round", () => {
    useGame.getState().answer("e1", "reply");
    expect(useGame.getState().meters.confidence).toBe(55);
    useGame.getState().advance();
    expect(useGame.getState().meters.confidence).toBe(56);
    expect(useGame.getState().block).toBe(1);
    expect(useGame.getState().report.length).toBeGreaterThan(0);
  });
  it("records missed instructions at round end", () => {
    useGame.getState().advance();
    expect(useGame.getState().meters.confidence).toBe(38);
    expect(useGame.getState().goodwillHistory.some((c) => c.kind === "Missed instruction")).toBe(true);
  });
  it("allows only one personal activity per block", () => {
    const queue = useGame.getState().queue;
    expect(queue({ id: "a", source: "First", text: "First", effects: {}, kind: "work", playerSlot: true })).toBe(true);
    expect(queue({ id: "b", source: "Second", text: "Second", effects: {}, kind: "dialogue", playerSlot: true })).toBe(false);
  });
  it("does not permit overspending reserved hospitality money", () => {
    const queue = useGame.getState().queue;
    expect(queue({ id: "a", source: "Dinner", text: "Dinner", effects: { budget: -50 }, kind: "social" })).toBe(true);
    expect(queue({ id: "b", source: "Convoy", text: "Convoy", effects: { budget: -11 }, kind: "work" })).toBe(false);
  });
  it("colleagues do not take evening work assignments", () => {
    useGame.setState({ block: 3 });
    expect(useGame.getState().queue({ id: "a", source: "Lounge", text: "Done", effects: {}, kind: "work", worker: "pavel", task: "lounge" })).toBe(false);
  });
  it("hostile colleagues fail a joint assignment", () => {
    useGame.setState({ handled: { e1: "reply" } });
    useGame.getState().queue({ id: "joint", source: "Programme", text: "Done", effects: {}, kind: "work", worker: "anselm", partner: "pavel", task: "programme" });
    useGame.getState().advance();
    expect(useGame.getState().visit.programme).toBeUndefined();
    expect(useGame.getState().report.some((r) => r.text.includes("work stalled"))).toBe(true);
  });
  it("competent independent delegation confirms a visit requirement", () => {
    useGame.getState().queue({ id: "lounge", source: "Lounge", text: "Lounge booked", effects: { budget: -5 }, kind: "work", worker: "pavel", task: "lounge" });
    useGame.getState().advance();
    expect(useGame.getState().visit.lounge).toBe(true);
    expect(useGame.getState().score).toBe(10);
  });
  it("replaces the player at zero HQ goodwill and prevents further rounds", () => {
    useGame.setState({ meters: { ...START_METERS, confidence: 6 } });
    useGame.getState().answer("e1", "note");
    useGame.getState().advance();
    expect(useGame.getState().ending).toBe("replaced");
    const day = useGame.getState().day, block = useGame.getState().block;
    useGame.getState().advance();
    expect(useGame.getState().day).toBe(day);
    expect(useGame.getState().block).toBe(block);
  });
  it("zero host goodwill causes PNG on resolution", () => {
    useGame.setState({ meters: { ...START_METERS, goodwill: 4 }, handled: { e1: "reply" } });
    useGame.getState().queue({ id: "loss", source: "Incident", text: "Expelled", effects: { goodwill: -4 }, kind: "event" });
    useGame.getState().advance();
    expect(useGame.getState().ending).toBe("png");
  });
  it("missing programme cancels the visit when day 15 starts", () => {
    useGame.setState({ day: 14, block: 3, minute: BLOCKS[3].time, events: [], handled: Object.fromEntries(EMAILS.map((e) => [e.id, "reply"])), visit: { clearance: true, lounge: true, security: true } });
    useGame.getState().advance();
    expect(useGame.getState().day).toBe(15);
    expect(useGame.getState().ending).toBe("cancelled");
  });
  it("four blocks make one working day", () => {
    useGame.setState({ events: [], handled: Object.fromEntries(EMAILS.map((e) => [e.id, "reply"])) });
    for (let i = 0; i < 4; i++) useGame.getState().advance();
    expect(useGame.getState().day).toBe(2);
    expect(useGame.getState().block).toBe(0);
    expect(useGame.getState().minute).toBe(480);
  });
  it("a prepared campaign reaches a successful day-15 ending", () => {
    for (let turn = 0; turn < 56; turn++) {
      const s = useGame.getState();
      for (const email of inboxFor(s.day, s.minute, s.handled)) {
        if (!email.status) s.answer(email.id, "reply");
      }
      const event = s.events[s.block];
      const choice = event?.choices.find((c) => !c.replace && (c.effects?.goodwill ?? 0) >= 0) ?? event?.choices[0];
      if (event && choice) s.queue({ id: `event-${event.id}`, source: event.title, text: choice.result ?? "Resolved", kind: "event", effects: choice.effects ?? {}, eventId: event.id });
      s.advance();
      if (useGame.getState().ending) break;
    }
    expect(useGame.getState().day).toBe(15);
    expect(useGame.getState().visit.programme).toBe(true);
    expect(["promoted", "ambassador"]).toContain(useGame.getState().ending);
  });
  it("repeated diplomatic outcomes cannot farm Mission Standing", () => {
    useGame.setState({ events: [], handled: Object.fromEntries(EMAILS.map((e) => [e.id, "reply"])) });
    for (let i = 0; i < 2; i++) {
      useGame.getState().queue({ id: "coalition", source: "EU coalition", text: "Agreed", effects: {}, kind: "work", score: 3, playerSlot: true });
      useGame.getState().advance();
    }
    expect(useGame.getState().score).toBe(3);
  });
});
