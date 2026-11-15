import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { allInvitations } from "./calendar";
import { DiplomaticCalendar } from "./components/DiplomaticCalendar";
import { blocks, emails } from "./rules";
import { useGame } from "./store";

const meeting = allInvitations().find((item) => item.id === "asteria-coffee")!;
beforeEach(() => {
  useGame
    .getState()
    .start({ title: "Mx", name: "Test", portrait: "diplomat-1", bio: "", traits: [] });
  useGame.setState({
    day: meeting.day,
    block: meeting.block,
    minute: blocks()[meeting.block]!.time,
    events: [],
    handled: Object.fromEntries(emails().map((email) => [email.id, "reply"])),
  });
});
afterEach(cleanup);

describe("diplomatic diary", () => {
  it("requires travel before attending, then records the response at block end", () => {
    render(<DiplomaticCalendar />);
    fireEvent.click(screen.getByRole("button", { name: /attend the coffee/i }));
    expect(screen.getByRole("status")).toHaveTextContent("Travel to the venue");
    expect(useGame.getState().pending).toEqual([]);
    act(() => {
      expect(useGame.getState().move(meeting.location)).toBe(true);
    });
    fireEvent.click(screen.getByRole("button", { name: /attend the coffee/i }));
    expect(useGame.getState().storyOutcomes[meeting.id]).toBeUndefined();
    expect(useGame.getState().pending.find((p) => p.eventId === meeting.id)?.location).toBe(
      meeting.location,
    );
    act(() => {
      useGame.getState().advance();
    });
    expect(useGame.getState().storyOutcomes[meeting.id]).toEqual({
      status: "chosen",
      choice: "attend",
    });
    expect(useGame.getState().colleagues["amb-asteria"]?.trust).toBe(54);
  });
});
