import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PlaceScene } from "./components/PlaceScene";
import { useGame } from "./store";

beforeEach(() => {
  useGame.getState().start({ title: "Mx", name: "Test", face: 0, bio: "", traits: [] });
  useGame.setState({ location: "golf", events: [] });
});
afterEach(cleanup);

describe("outside appointments", () => {
  it("lets the player book golf at the venue and reserves two blocks", () => {
    render(<PlaceScene onLeave={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /plan an appointment/i }));
    fireEvent.click(screen.getByRole("button", { name: /seek an informal appointment/i }));
    const appointment = useGame.getState().pending.find((p) => p.id === "player-work");
    expect(appointment?.location).toBe("golf");
    expect(appointment?.timeCost).toBe(2);
    expect(appointment?.remainingBlocks).toBe(2);
    expect(appointment?.cashCost).toBe(400);
  });
});
