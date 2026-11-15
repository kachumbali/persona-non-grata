import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MissionSteps } from "./MissionSteps";
import { emptyProgress } from "../mission";
import { useGame } from "../store";

beforeEach(() => {
  useGame
    .getState()
    .start({ title: "Mx", name: "Test", portrait: "diplomat-1", bio: "", traits: [] });
});
afterEach(cleanup);

const stepRow = (text: RegExp) => screen.getByText(text).closest("li")!;

describe("mission steps list", () => {
  it("shows every task with its steps done, available or blocked, and why", () => {
    useGame.setState({
      day: 6,
      missionSteps: { ...emptyProgress(), clearance: ["note-verbale"], lounge: ["reservation"] },
    });
    render(<MissionSteps />);
    expect(screen.getByText(/Plane landing clearance/)).toBeTruthy();
    expect(stepRow(/Note verbale to the Foreign Ministry/).dataset["state"]).toBe("done");
    expect(stepRow(/Overflight and landing form/).dataset["state"]).toBe("available");
    const stamp = stepRow(/Protocol's stamped confirmation/);
    expect(stamp.dataset["state"]).toBe("blocked");
    expect(within(stamp).getAllByText(/from Day 10/).length).toBeGreaterThan(0);
    const deposit = stepRow(/Lounge deposit paid/);
    expect(deposit.dataset["state"]).toBe("available");
    expect(within(deposit).getByText(/available now · ƒ500/)).toBeTruthy();
    const print = stepRow(/Final printed programme/);
    expect(within(print).getByText(/from Day 13/)).toBeTruthy();
    expect(
      within(stepRow(/Motorcade and escort/)).getAllByText(
        /needs the route reconnaissance|from Day 12/,
      ),
    ).not.toHaveLength(0);
  });
  it("names the day a step opens and the trust it needs", () => {
    useGame.setState({
      day: 10,
      missionSteps: { ...emptyProgress(), clearance: ["note-verbale", "landing-form"] },
      colleagues: { ...useGame.getState().colleagues, protocol: { trust: 40, fatigue: 0 } },
    });
    render(<MissionSteps />);
    expect(within(stepRow(/Final printed programme/)).getByText(/from Day 13|needs/)).toBeTruthy();
    expect(screen.getByText(/File the permit in order/)).toBeTruthy();
  });
  it("closes the steps on the arrival day", () => {
    useGame.setState({ day: 15 });
    render(<MissionSteps compact />);
    expect(screen.getAllByText(/closed: the arrival has begun/).length).toBeGreaterThan(0);
  });
});
