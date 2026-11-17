import { describe, expect, it } from "vitest";
import { interruptionView } from "./interruption";
import { campaign, type StoryEvent } from "./rules";

const pavel = { name: "Pavel Oskarsen", location: "embassy", role: "Head of Administration" };
const celeste = { name: "Celeste Norren", location: "eu", role: "Head of the EU Delegation" };
const capital = { name: "Desk Officer", location: "ministry", role: "Capital desk" };

const event = (over: Partial<StoryEvent>): StoryEvent => ({
  id: "test",
  title: "Test",
  npc: "pavel",
  text: "Main text.",
  minDay: 1,
  choices: [],
  ...over,
});

describe("interruptionView", () => {
  it("labels a call as a phone call with the caller's name", () => {
    const view = interruptionView(event({ channel: "call" }), celeste, "embassy");
    expect(view).toEqual({
      kind: "call",
      header: "Phone call · Celeste Norren",
      text: "Main text.",
    });
  });

  it("labels a message as a message, wherever the player is", () => {
    const view = interruptionView(event({ channel: "message" }), celeste, "bar");
    expect(view).toEqual({
      kind: "message",
      header: "Message · Celeste Norren",
      text: "Main text.",
    });
  });

  it("shows a visit at the door while the player is at the embassy", () => {
    const view = interruptionView(
      event({ channel: "visit", remoteText: "Remote." }),
      pavel,
      "embassy",
    );
    expect(view).toEqual({
      kind: "visit",
      header: "At your door · Pavel Oskarsen",
      text: "Main text.",
    });
  });

  it("shows a visit as a message with remoteText when the player is elsewhere", () => {
    const view = interruptionView(event({ channel: "visit", remoteText: "Remote." }), pavel, "eu");
    expect(view).toEqual({ kind: "message", header: "Message · Pavel Oskarsen", text: "Remote." });
  });

  it("keeps the legacy look for an event without a channel", () => {
    expect(interruptionView(event({}), pavel, "eu").header).toBe(
      "Pavel Oskarsen appears at your door",
    );
    expect(interruptionView(event({}), capital, "eu").header).toBe(
      "The secure fax starts printing",
    );
    expect(interruptionView(event({}), celeste, "eu").header).toBe("Phone call · Celeste Norren");
  });

  it("falls back to a neutral name when the caller is unknown", () => {
    expect(interruptionView(event({ channel: "call" }), undefined, "embassy").header).toBe(
      "Phone call · Unknown caller",
    );
  });

  it("gives every real pop-up a channel, and every visit a remoteText", () => {
    const popUps = campaign().events.filter((e) => !e.location);
    expect(popUps.length).toBeGreaterThan(0);
    for (const e of popUps) {
      expect(e.channel, e.id).toBeDefined();
      if (e.channel === "visit") expect(e.remoteText, e.id).toBeTruthy();
    }
  });
});
