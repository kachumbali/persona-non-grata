import { beforeEach, describe, expect, it } from "vitest";
import { activeChapter } from "./chapters";
import { arrivalParts, badgeLabel, deviceFor, ignoredAtBlockEnd, waitingItems } from "./inbox";
import { useGame } from "./store";

const chapter = activeChapter();
const state = (patch: Partial<ReturnType<typeof useGame.getState>> = {}) => ({
  ...useGame.getState(),
  ...patch,
});
const ids = (list: { id: string }[]) => list.map((m) => m.id);
beforeEach(() =>
  useGame
    .getState()
    .start({ title: "Mx", name: "Test", portrait: "diplomat-1", bio: "", traits: [] }),
);
const at = (day: number, block: number, extra = {}) =>
  state({ day, block, minute: chapter.manifest.blocks[block]!.time, ...extra });

describe("waitingItems", () => {
  it("routes Capital mail to the fax by sender and other mail to the PC or the BlockBerry", () => {
    expect(deviceFor("Capital — Protocol", "embassy", "embassy")).toBe("fax");
    expect(deviceFor("Capital — Protocol", "ministry", "embassy")).toBe("fax");
    expect(deviceFor("Admin — Pavel", "embassy", "embassy")).toBe("pc");
    expect(deviceFor("Admin — Pavel", "ministry", "embassy")).toBe("blackberry");
    const w = waitingItems(at(1, 1), chapter);
    expect(ids(w.fax.urgent)).toEqual(["e1", "e2"]);
    expect(ids(w.pc.urgent)).toEqual(["e3"]);
    expect(w.blackberry.urgent).toEqual([]);
    const away = waitingItems(at(1, 1, { location: "ministry" }), chapter);
    expect(ids(away.blackberry.urgent)).toEqual(["e3"]);
    expect(away.pc.urgent).toEqual([]);
    expect(ids(away.fax.urgent)).toEqual(["e1", "e2"]);
  });

  it("holds Capital's Day 1 Morning mail as merely unread during the grace period", () => {
    const w = waitingItems(at(1, 0), chapter);
    expect(ids(w.fax.unread)).toEqual(["e1", "e2"]);
    expect(w.fax.urgent).toEqual([]);
    expect(ignoredAtBlockEnd(w)).toEqual([]);
  });

  it("makes the same mail urgent once the grace block is over", () => {
    const w = waitingItems(at(1, 1), chapter);
    expect(w.fax.unread).toEqual([]);
    expect(ignoredAtBlockEnd(w).map((g) => g.device)).toEqual(["fax", "pc"]);
  });

  it("agrees with what the store marks ignored at the end of the block", () => {
    useGame.setState({ day: 1, block: 1, minute: 720 });
    const before = waitingItems(state(), chapter);
    const expected = [...before.fax.urgent, ...before.pc.urgent, ...before.blackberry.urgent]
      .map((m) => m.id)
      .sort();
    useGame.getState().advance();
    const ignored = Object.entries(useGame.getState().handled)
      .filter(([, v]) => v === "ignored")
      .map(([id]) => id)
      .sort();
    expect(ignored).toEqual(expected);
  });

  it("drops mail once it is answered or scheduled for this block", () => {
    const before = waitingItems(at(1, 1), chapter);
    expect(ids(before.fax.urgent)).toContain("e1");
    const answered = waitingItems(at(1, 1, { handled: { e1: "reply" } }), chapter);
    expect(ids(answered.fax.urgent)).toEqual(["e2"]);
    const scheduled = waitingItems(
      at(1, 1, {
        pending: [{ id: "x", kind: "email", source: "s", text: "", effects: {}, emailId: "e2" }],
      }),
      chapter,
    );
    expect(ids(scheduled.fax.urgent)).toEqual(["e1"]);
    const none = waitingItems(
      at(1, 1, { handled: { e1: "reply", e2: "ignored", e3: "reply" } }),
      chapter,
    );
    expect(none.fax.urgent.concat(none.pc.urgent)).toEqual([]);
  });

  it("does not count démarche notices or mail that has not arrived", () => {
    const w = waitingItems(at(1, 0), chapter);
    expect(ids([...w.pc.urgent, ...w.pc.unread])).not.toContain("e3");
    for (const d of chapter.demarches.instructions)
      expect(ids([...w.fax.urgent, ...w.pc.urgent])).not.toContain(d.id);
  });

  it("lists invitations that are due this block and drops them once answered", () => {
    const i = chapter.invitations[0]!;
    expect(ids(waitingItems(at(i.day, i.block), chapter).invitations)).toContain(i.id);
    const answered = waitingItems(
      at(i.day, i.block, {
        pending: [{ id: "r", kind: "event", source: "s", text: "", effects: {}, eventId: i.id }],
      }),
      chapter,
    );
    expect(ids(answered.invitations)).not.toContain(i.id);
  });
});

describe("badges and the arrival line", () => {
  it("labels badges in words", () => {
    expect(badgeLabel("fax", 2, 0)).toBe("2 faxes waiting, answer them this block");
    expect(badgeLabel("pc", 1, 0)).toBe("1 mail waiting, answer it this block");
    expect(badgeLabel("fax", 0, 2)).toBe("2 faxes waiting, no penalty yet");
    expect(badgeLabel("fax", 0, 0)).toBe("");
  });
  it("lists what arrived and says a fax needs the embassy when you are away", () => {
    const w = waitingItems(at(1, 1), chapter);
    expect(arrivalParts(w, true).map((p) => p.text)).toEqual([
      "2 faxes from Capital",
      "1 mail on the PC",
    ]);
    const away = arrivalParts(waitingItems(at(1, 1, { location: "ministry" }), chapter), false);
    expect(away[0]).toMatchObject({ key: "fax", readable: false });
    expect(away[0]!.text).toContain("only be read at the embassy");
    expect(away[1]!.key).toBe("blackberry");
  });
  it("is empty when nothing waits", () => {
    const w = waitingItems(
      at(1, 1, { handled: { e1: "reply", e2: "reply", e3: "reply" } }),
      chapter,
    );
    expect(arrivalParts(w, true)).toEqual([]);
  });
});
