import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DemarcheBoard } from "./DemarcheBoard";
import { useGame } from "../store";

beforeEach(() => {
  useGame
    .getState()
    .start({ title: "Mx", name: "Test", portrait: "diplomat-1", bio: "", traits: ["punctual"] });
  useGame.setState({ day: 2, block: 0, minute: 480 });
});
afterEach(cleanup);

describe("démarche board", () => {
  it("shows the instruction, talking points and blocked travel, and queues the note", () => {
    render(<DemarcheBoard />);
    expect(screen.getByRole("region", { name: "Démarche board" })).toBeTruthy();
    expect(screen.getByText("Ask for the inspection timetable.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Deliver personally/ })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Démarche approach" })).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: /Allow displaced routine work/ }));
    fireEvent.click(screen.getByRole("button", { name: /Send a note verbale/ }));
    expect(useGame.getState().pending[0]).toMatchObject({
      demarcheId: "fuel-quay-note",
      demarcheRoute: "note",
    });
    expect(screen.getByRole("status")).toHaveTextContent("Added");
  });
  it("displays a superseded instruction without losing its history", () => {
    useGame.setState({ day: 7, block: 2, minute: 900 });
    render(<DemarcheBoard />);
    expect(screen.getByRole("button", { name: /Umbrella protocol/ })).toHaveTextContent(
      "superseded",
    );
    expect(screen.getByRole("button", { name: /Umbrella correction/ })).toBeTruthy();
  });
});
