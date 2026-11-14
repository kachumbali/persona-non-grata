import { beforeEach, describe, expect, it } from "vitest";
import { accidentalReplyAll } from "./character";
import { EMAILS } from "./rules";
import { playerCapacity } from "./economy";
import { useGame } from "./store";

const character = (traits: string[]) => ({ title: "Mx", name: "Test", face: 0, bio: "", traits });
beforeEach(() => {
  useGame.getState().start(character([]));
  useGame.setState({
    events: [],
    handled: Object.fromEntries(EMAILS.map((email) => [email.id, "reply"])),
  });
});
describe("character effects during a posting", () => {
  it("applies the formal bonus and records the actual goodwill change", () => {
    useGame.setState({ character: character(["namedrop"]), handled: {} });
    useGame.getState().answer("e1", "reply");
    useGame.getState().advance();
    const entry = useGame
      .getState()
      .goodwillHistory.find((e) => e.source === "URGENT: Political situation");
    expect(entry?.after.confidence).toBe(62);
    expect(entry?.text).toContain("Gravitas +1");
  });
  it("allows an accidental reply-all to be recalled atomically for one additional DP", () => {
    useGame.setState({ character: character(["replyall"]), handled: {}, day: 1 });
    const email = EMAILS.find(
      (e) => e.day === 1 && e.options.reply && accidentalReplyAll(23, 1, e.id),
    );
    expect(email).toBeDefined();
    useGame.getState().answer(email!.id, "reply");
    expect(useGame.getState().pending[0]?.recall).toBeDefined();
    useGame.getState().recall(email!.id);
    expect(useGame.getState().pending[0]).toMatchObject({
      emailAction: "reply",
      timeCost: 2,
      text: expect.stringContaining("recalled"),
    });
    useGame.getState().advance();
    expect(useGame.getState().handled[email!.id]).toBe("reply");
  });
  it("applies and clears an evening-drinking hangover", () => {
    useGame.setState({ character: character(["liver"]), block: 3, minute: 1140 });
    useGame.getState().queue({
      id: "drink",
      kind: "social",
      source: "Dinner",
      text: "Dinner",
      effects: {},
      drinks: true,
      timeCost: 1,
    });
    useGame.getState().advance();
    const morning = useGame.getState();
    expect(morning.hangover).toBe(true);
    expect(
      playerCapacity(
        morning.character,
        morning.energy,
        morning.composure,
        morning.alcohol,
        morning.hangover,
      ).factors,
    ).toContain("Hangover −1");
    morning.advance();
    expect(useGame.getState().hangover).toBe(false);
  });
  it("applies Charm to positive contact gains and the Name-dropper backfire", () => {
    useGame.setState({ character: character(["namedrop"]) });
    useGame.getState().queue({
      id: "name",
      kind: "event",
      source: "Introduction",
      text: "Introduced",
      effects: {},
      contact: "port-officer",
      contactTrust: 2,
      traitChoice: "namedrop",
      timeCost: 1,
    });
    useGame.getState().advance();
    expect(useGame.getState().colleagues["port-officer"]?.trust).toBe(53);
    expect(useGame.getState().colleagues["journalist"]?.trust).toBe(48);
    expect(
      useGame
        .getState()
        .report.map((e) => e.text)
        .join(" "),
    ).toContain("Charm +1");
  });
});
