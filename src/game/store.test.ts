import { beforeEach, describe, expect, it } from "vitest";
import { DAY_END, DAY_START, EMAILS, LAST_DAY, START_METERS } from "./rules";
import { useGame } from "./store";

const character = { title: "Mr", name: "Test", face: 0, bio: "", traits: [] };
beforeEach(() => useGame.getState().start(character));

describe("goodwill and visit state", () => {
  it("records a decision with the HQ change and its outcome", () => {
    useGame.setState({ minute: 500 });
    useGame.getState().answer("e1", "reply");
    const state = useGame.getState();
    expect(state.meters.confidence).toBe(61);
    const change = state.goodwillHistory[0];
    if (!change) throw new Error("Missing decision history");
    expect(change.after.confidence - change.before.confidence).toBe(6);
    expect(change.kind).toBe("Decision");
  });
  it("records a missed instruction penalty", () => {
    useGame.getState().tick(170);
    expect(useGame.getState().meters.confidence).toBe(43);
    expect(useGame.getState().goodwillHistory[0]?.kind).toBe("Missed instruction");
  });
  it("replaces the player when an instruction exhausts HQ goodwill and stops play", () => {
    useGame.setState({ minute: 500, meters: { ...START_METERS, confidence: 6 } });
    useGame.getState().answer("e1", "note");
    expect(useGame.getState().ending).toBe("replaced");
    useGame.getState().tick(100);
    expect(useGame.getState().minute).toBe(500);
    useGame.getState().answer("e1", "reply");
    expect(useGame.getState().meters.confidence).toBe(0);
  });
  it("ends in PNG when a decision exhausts host goodwill", () => {
    useGame.setState({ day: 2, minute: 520, meters: { ...START_METERS, goodwill: 6 } });
    useGame.getState().answer("e5", "forward");
    expect(useGame.getState().ending).toBe("png");
  });
  it("confirms a programme only through a confirming outcome", () => {
    useGame.setState({ day: 10, minute: 500 });
    useGame.getState().answer("visit-programme", "delegate");
    expect(useGame.getState().visit.programme).toBe(true);
  });
  it("cancels at the start of arrival day if the programme is missing", () => {
    useGame.setState({ day: LAST_DAY - 1, minute: DAY_END - 1, handled: Object.fromEntries(EMAILS.map((e) => [e.id, "reply"])), visit: { clearance: true, lounge: true, security: true } });
    useGame.getState().tick(2);
    expect(useGame.getState().day).toBe(15);
    expect(useGame.getState().minute).toBe(DAY_START);
    expect(useGame.getState().ending).toBe("cancelled");
  });
});