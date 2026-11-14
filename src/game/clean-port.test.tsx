import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PlaceScene } from "./components/PlaceScene";
import { CAMPAIGN, EMAILS, locationStories } from "./rules";
import { topicsFor } from "./dialogues";
import { useGame } from "./store";

beforeEach(() => {
  useGame.getState().start({ title: "Mx", name: "Test", face: 0, bio: "", traits: [] });
  useGame.setState({ day: 2, location: "eu", events: [], handled: Object.fromEntries(EMAILS.map((email) => [email.id, "reply"])) });
});
afterEach(cleanup);

function openPort() {
  fireEvent.click(screen.getByRole("button", { name: /follow up: the 17.6% meeting/i }));
  fireEvent.click(screen.getByRole("button", { name: /Team Europe and the clean port/i }));
}

describe("clean-port coordination", () => {
  it.each([
    { choice: "accept", label: /Accept the Delegation-led/, cost: 200, trust: 51 },
    { choice: "national", label: /Insist on Bellaluxe branding/, cost: 100, trust: 49 },
    { choice: "shared", label: /Negotiate shared credit/, cost: 150, trust: 53 },
    { choice: "decline", label: /Decline the contribution/, cost: 0, trust: 50 },
  ])("commits real resources and unlocks only the matching host response for $choice", ({ choice, label, cost, trust }) => {
    render(<PlaceScene onLeave={() => {}} />);
    openPort();
    expect(screen.getByText(/Development programme and partner coordination/)).toBeInTheDocument();
    if (cost) fireEvent.click(screen.getByLabelText(/Allow displaced routine work/));
    fireEvent.click(screen.getByRole("button", { name: label }));
    const pending = useGame.getState().pending.find((item) => item.eventId === "eu-clean-port");
    expect(pending).toMatchObject({ eventChoice: choice, cashCost: cost || undefined, partner: cost ? "development" : undefined });
    const funds = useGame.getState().economy.funds;
    act(() => { useGame.getState().advance(); });
    const state = useGame.getState();
    expect(state.economy.funds).toBe(funds - cost);
    expect(state.colleagues["port-officer"]?.trust).toBe(trust);
    const followups = locationStories(3, state.completedEvents, state.storyOutcomes).filter((event) => event.id.startsWith("clean-port-") && event.location === "ministry");
    expect(followups.map((event) => event.id)).toEqual([`clean-port-${choice}-host`]);
    if (cost) expect(state.colleagues["development"]?.fatigue).toBeGreaterThan(0);
  });
  it("requires authorisation for displaced work and keeps an existing plan when funds are insufficient", () => {
    render(<PlaceScene onLeave={() => {}} />); openPort();
    fireEvent.click(screen.getByRole("button", { name: /Negotiate shared credit/ }));
    expect(screen.getByText(/Explicitly authorise displacement/)).toBeInTheDocument();
    expect(useGame.getState().pending).toHaveLength(0);
    fireEvent.click(screen.getByLabelText(/Allow displaced routine work/));
    act(() => {
      useGame.getState().queue({ id: "prior", kind: "work", source: "Existing commitment", text: "Already arranged.", effects: {}, timeCost: 1 });
      useGame.setState({ economy: { ...useGame.getState().economy, funds: useGame.getState().economy.ringFence } });
    });
    fireEvent.click(screen.getByRole("button", { name: /Negotiate shared credit/ }));
    expect(screen.getByText(/Insufficient discretionary funds/)).toBeInTheDocument();
    expect(useGame.getState().pending.map((item) => item.id)).toEqual(["prior"]);
  });
  it("places the new contacts in the city with two authored conversations each", () => {
    for (const [id, location] of [["port-officer", "ministry"], ["bar-insurer", "bar"], ["un-coordinator", "un"]] as const) {
      expect(CAMPAIGN.characters.find((person) => person.id === id)?.location).toBe(location);
      expect(topicsFor(id)).toHaveLength(2);
    }
  });
});
