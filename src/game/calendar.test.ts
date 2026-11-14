import { beforeEach, describe, expect, it } from "vitest";
import { dueInvitations, INVITATIONS, visibleInvitations } from "./calendar";
import { BLOCKS, EMAILS } from "./rules";
import { useGame } from "./store";

const invitation = INVITATIONS[0]!;
beforeEach(() => {
  useGame.getState().start({ title: "Ms", name: "Tester", face: 0, bio: "", traits: [] });
  useGame.setState({ day: invitation.day, block: invitation.block, minute: BLOCKS[invitation.block]!.time,
    events: [], handled: Object.fromEntries(EMAILS.map((e) => [e.id, "reply"])) });
});
describe("diplomatic invitations", () => {
  it("shows announced future invitations but hides past and resolved ones", () => {
    expect(visibleInvitations(1, 0, {}).map((i) => i.id)).toContain(invitation.id);
    expect(visibleInvitations(invitation.day, invitation.block + 1, {}).map((i) => i.id)).not.toContain(invitation.id);
    expect(visibleInvitations(1, 0, { [invitation.id]: { status: "chosen", choice: "decline" } }).map((i) => i.id)).not.toContain(invitation.id);
    expect(dueInvitations(invitation.day, invitation.block, {})).toContainEqual(invitation);
  });
  it.each(["attend", "delegate", "decline"] as const)("records the %s response once at block end", (response) => {
    const s = useGame.getState();
    const option = invitation.choices[response];
    const ok = s.queue({ id: `invitation-${invitation.id}`, kind: "event", source: invitation.title,
      text: option.text, effects: option.effects, timeCost: option.timeCost, cashCost: option.cashCost,
      eventId: invitation.id, eventChoice: response, worker: response === "delegate" ? "pavel" : undefined, overload: response === "delegate" });
    expect(ok).toBe(true);
    expect(useGame.getState().storyOutcomes[invitation.id]).toBeUndefined();
    useGame.getState().advance();
    const result = useGame.getState();
    expect(result.storyOutcomes[invitation.id]).toEqual({ status: "chosen", choice: response });
    expect(result.report.some((entry) => entry.text === option.text)).toBe(true);
    expect(result.report.some((entry) => entry.text === invitation.onMiss.text)).toBe(false);
  });
  it("records a missed invitation once and does not repeat the penalty", () => {
    useGame.getState().advance();
    const result = useGame.getState();
    expect(result.storyOutcomes[invitation.id]).toEqual({ status: "missed" });
    expect(result.report.some((entry) => entry.text === invitation.onMiss.text)).toBe(true);
    const confidence = result.meters.confidence;
    result.advance();
    expect(useGame.getState().meters.confidence).toBe(confidence);
  });
  it("rejects a conflicting colleague assignment without replacing the existing plan", () => {
    const s = useGame.getState();
    const task = { id: "work", kind: "work" as const, source: "Existing assignment", text: "Done", effects: {}, worker: "pavel", timeCost: 0, overload: true };
    expect(s.queue(task)).toBe(true);
    const option = invitation.choices.delegate;
    expect(s.queue({ id: "invitation-test", kind: "event", source: invitation.title, text: option.text,
      effects: option.effects, timeCost: 0, worker: "pavel", overload: true, eventId: invitation.id, eventChoice: "delegate" })).toBe(false);
    expect(useGame.getState().pending.map((p) => p.id)).toEqual(["work"]);
  });
});
