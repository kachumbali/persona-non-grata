import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Interruption } from "./Interruption";
import { useGame } from "../store";
import type { StoryEvent } from "../rules";

const character = { title: "Mx", name: "Test", portrait: "diplomat-1", bio: "", traits: [] };
const event = {
  id: "test-colleague-pop-up",
  title: "A colleague needs you",
  channel: "visit",
  text: "Anselm wants a word about the files.",
  choices: [
    { id: "delegate", label: "Ask Anselm to handle it", worker: "anselm" },
    { id: "expensive", label: "Buy assistance", worker: "anselm", effects: { budget: -999999 } },
  ],
} as unknown as StoryEvent;

beforeEach(() => {
  useGame.getState().start(character);
  useGame.setState({ day: 1, block: 0, events: [event], pending: [], location: "embassy" });
});
afterEach(cleanup);

describe("story pop-up options", () => {
  it("offers confirmation for a routine conflict and queues displacement only when confirmed", () => {
    render(<Interruption />);
    const option = screen.getByRole("button", { name: /Ask Anselm to handle it/ });
    expect(option).toBeEnabled();
    fireEvent.click(option);
    expect(
      screen.getByText(/Anselm has routine duties this block.*fatigue and backlog/),
    ).toBeInTheDocument();
    expect(useGame.getState().pending).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Yes, assign" }));
    expect(useGame.getState().pending).toEqual(
      expect.arrayContaining([expect.objectContaining({ eventId: event.id, overload: true })]),
    );
  });

  it("cancels without changing the plan", () => {
    render(<Interruption />);
    fireEvent.click(screen.getByRole("button", { name: /Ask Anselm to handle it/ }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("button", { name: "Yes, assign" })).toBeNull();
    expect(useGame.getState().pending).toHaveLength(0);
  });

  it("keeps unaffordable options disabled with a reason", () => {
    render(<Interruption />);
    const option = screen.getByRole("button", { name: /Buy assistance/ });
    expect(option).toBeDisabled();
    expect(option).toHaveAccessibleDescription(/Insufficient/);
  });
});
