import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GameScreen } from "./components/GameScreen";
import { useGame } from "./store";
vi.mock("./components/CityMap", () => ({ CityMap: () => <div>City</div> }));
vi.mock("./components/PlaceScene", () => ({ PlaceScene: () => <div>Place</div> }));
vi.mock("./components/Interruption", () => ({ Interruption: () => <div>Interruption</div> }));
describe("morning review interface", () => {
  it("follows the welcome, can be skipped and reopened on the BlockBerry", () => {
    useGame
      .getState()
      .start({ title: "Mx", name: "Test", portrait: "diplomat-1", bio: "", traits: [] });
    render(<GameScreen />);
    expect(screen.queryByLabelText("Press review")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss briefing" }));
    expect(screen.getByLabelText("Press review")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(screen.queryByLabelText("Press review")).toBeNull();
    expect(useGame.getState().pressRead).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: /^BlockBerry phone/ }));
    fireEvent.click(screen.getByRole("button", { name: "Press review · unread" }));
    expect(screen.getByLabelText("Press review")).toBeTruthy();
  });
  it("keeps the posting briefing retrievable from phone mail after arrival, in and out of the office", () => {
    useGame
      .getState()
      .start({ title: "Mx", name: "Test", portrait: "diplomat-1", bio: "", traits: [] });
    useGame.setState({ day: 3, block: 1 });
    const before = useGame.getState().pending.length;
    render(<GameScreen />);
    fireEvent.click(screen.getByRole("button", { name: /^BlockBerry phone/ }));
    fireEvent.click(screen.getByRole("button", { name: "Mail" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Posting briefing · Welcome to your posting" }),
    );
    expect(screen.getByLabelText("Posting briefing email")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back to inbox" }));
    act(() => useGame.setState({ location: "eu" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Posting briefing · Welcome to your posting" }),
    );
    expect(screen.getByLabelText("Posting briefing email")).toBeTruthy();
    expect(useGame.getState().pending.length).toBe(before);
  });
});
