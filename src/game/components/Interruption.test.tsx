import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Interruption } from "./Interruption";
import { useGame } from "../store";
import type { StoryEvent } from "../rules";

const character = { title: "Mx", name: "Test", portrait: "diplomat-1", bio: "", traits: [] };

// A pop-up whose first option needs a colleague's time and whose second needs only the player's.
const event = {
  id: "test-colleague-pop-up",
  title: "A colleague needs you",
  channel: "visit",
  text: "Anselm wants a word about the files.",
  choices: [
    { id: "delegate", label: "Ask Anselm to handle it", worker: "anselm" },
    { id: "handle", label: "Handle it yourself" },
  ],
} as unknown as StoryEvent;

beforeEach(() => {
  useGame.getState().start(character);
  useGame.setState({ day: 1, block: 0, events: [event], pending: [], location: "embassy" });
});
afterEach(cleanup);

describe("story pop-up options", () => {
  it("disables an option the store would refuse, with the reason under it", () => {
    render(<Interruption />);
    const delegate = screen.getByRole("button", { name: /Ask Anselm to handle it/ });
    expect(delegate).toBeDisabled();
    expect(delegate).toHaveAccessibleDescription(/has routine duties this block/);
    expect(screen.getByRole("button", { name: /Handle it yourself/ })).toBeEnabled();
    expect(screen.getAllByText(/has routine duties this block/)).toHaveLength(1);
  });

  it("enables the option once the displacement is allowed, and taking it closes the pop-up", () => {
    render(<Interruption />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Allow displaced routine work/ }));
    const delegate = screen.getByRole("button", { name: /Ask Anselm to handle it/ });
    expect(delegate).toBeEnabled();
    expect(screen.queryByText(/has routine duties this block/)).toBeNull();
    fireEvent.click(delegate);
    expect(useGame.getState().pending.some((p) => p.eventId === event.id)).toBe(true);
    expect(useGame.getState().planError).toBe("");
  });
});
