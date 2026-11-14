import { beforeEach, describe, expect, it } from "vitest";
import { dueInvitations, INVITATIONS, visibleInvitations } from "./calendar";
import { BLOCKS, CAMPAIGN, EMAILS } from "./rules";
import { useGame } from "./store";

const invitation = INVITATIONS[0]!;
beforeEach(() => {
  useGame.getState().start({ title: "Ms", name: "Tester", face: 0, bio: "", traits: [] });
  useGame.setState({ day: invitation.day, block: invitation.block, minute: BLOCKS[invitation.block]!.time,
    events: [], handled: Object.fromEntries(EMAILS.map((e) => [e.id, "reply"])) });
});
describe("diplomatic invitations", () => {
  it("uses unique ids, valid locations, contacts and scheduled blocks", () => {
    const ids = [...CAMPAIGN.events.map((event) => event.id), ...INVITATIONS.map((event) => event.id)];
    expect(new Set(ids).size).toBe(ids.length);
    for (const event of INVITATIONS) {
      expect(CAMPAIGN.locations.some((place) => place.id === event.location)).toBe(true);
      expect(event.contact ? CAMPAIGN.characters.some((person) => person.id === event.contact) : true).toBe(true);
      expect(event.announceDay).toBeLessThanOrEqual(event.day);
      expect(BLOCKS[event.block]).toBeDefined();
    }
  });
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
  it("changes the host relationship when attending or missing an invitation", () => {
    const dinner = INVITATIONS.find((item) => item.id === "valdoria-national-day")!;
    useGame.setState({ day: dinner.day, block: dinner.block, minute: BLOCKS[dinner.block]!.time });
    const choice = dinner.choices.attend;
    expect(useGame.getState().queue({ id: `invitation-${dinner.id}`, kind: "event", source: dinner.title, text: choice.text,
      effects: choice.effects, timeCost: choice.timeCost, cashCost: choice.cashCost, eventId: dinner.id, eventChoice: "attend",
      contact: dinner.contact, contactTrust: choice.contactTrust })).toBe(true);
    useGame.getState().advance();
    expect(useGame.getState().colleagues["amb-valdoria"]?.trust).toBe(54);
    useGame.getState().start({ title: "Ms", name: "Tester", face: 0, bio: "", traits: [] });
    useGame.setState({ day: dinner.day, block: dinner.block, minute: BLOCKS[dinner.block]!.time,
      events: [], handled: Object.fromEntries(EMAILS.map((e) => [e.id, "reply"])) });
    useGame.getState().advance();
    expect(useGame.getState().colleagues["amb-valdoria"]?.trust).toBe(47);
  });
  it("adds new contacts to existing saves while preserving established trust", () => {
    const current = useGame.getState();
    const saved = { ...current, colleagues: { pavel: { trust: 12, fatigue: 3 } } };
    const merged = useGame.persist.getOptions().merge!(saved, current);
    expect(merged.colleagues["pavel"]?.trust).toBe(12);
    expect(merged.colleagues["amb-valdoria"]?.trust).toBe(50);
    expect(merged.colleagues["amb-asteria"]?.trust).toBe(50);
    const fresh = useGame.persist.getOptions().merge!(undefined, current);
    expect(fresh.colleagues["amb-valdoria"]?.trust).toBe(50);
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
