import { fireEvent, render, screen } from "@testing-library/react";
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
    fireEvent.click(screen.getByRole("button", { name: "BlockBerry phone" }));
    fireEvent.click(screen.getByRole("button", { name: "Press review · unread" }));
    expect(screen.getByLabelText("Press review")).toBeTruthy();
  });
});
