import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Agenda } from "./components/Agenda";
import { BlackBerry } from "./components/BlackBerry";
import { PlanningDesk } from "./components/PlanningDesk";
import { activeChapter } from "./chapters";
import { useGame } from "./store";

const invitation = activeChapter().invitations[0]!;
beforeEach(() => {
  useGame
    .getState()
    .start({ title: "Mx", name: "Test", portrait: "diplomat-1", bio: "", traits: [] });
  useGame.setState({
    day: invitation.day,
    block: invitation.block,
    minute: activeChapter().manifest.blocks[invitation.block]!.time,
    events: [],
    pending: [],
    storyOutcomes: {},
    todayPlans: {
      0: [
        { id: "rest", kind: "work", source: "Personal time", text: "", effects: {}, timeCost: 1 },
      ],
    },
  });
});
afterEach(cleanup);

describe("agenda", () => {
  it("shows past, current and later blocks and removes an answered invitation", () => {
    render(<Agenda />);
    expect(screen.getByText(/✓ Morning/)).toBeInTheDocument();
    expect(screen.getByText(/Personal time/)).toBeInTheDocument();
    expect(screen.getByText(/now/)).toBeInTheDocument();
    expect(screen.getByText(invitation.title, { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Evening")).toBeInTheDocument();
    act(() =>
      useGame.setState({
        pending: [
          {
            id: "reply",
            kind: "event",
            source: invitation.title,
            text: "",
            effects: {},
            eventId: invitation.id,
            eventChoice: "decline",
          },
        ],
      }),
    );
    expect(screen.getAllByText(invitation.title, { exact: false })).toHaveLength(1);
    expect(screen.getByRole("button", { name: `Remove ${invitation.title}` })).toBeInTheDocument();
  });
  it("shows the chosen commitment in phone status", () => {
    useGame.setState({
      pending: [
        {
          id: "reply",
          kind: "event",
          source: invitation.title,
          text: "",
          effects: {},
          eventId: invitation.id,
          eventChoice: "decline",
        },
      ],
    });
    render(<BlackBerry />);
    fireEvent.click(screen.getByRole("button", { name: /BlockBerry phone/ }));
    expect(screen.getByText(invitation.choices.decline.label, { exact: false })).toHaveTextContent(
      invitation.title,
    );
    expect(screen.getByText(invitation.choices.decline.label, { exact: false })).toHaveTextContent(
      "You",
    );
  });
  it("shows the chosen commitment in the planning desk", () => {
    useGame.setState({
      pending: [
        {
          id: "reply",
          kind: "event",
          source: invitation.title,
          text: "",
          effects: {},
          eventId: invitation.id,
          eventChoice: "decline",
        },
      ],
    });
    render(<PlanningDesk />);
    const line = screen.getByText(invitation.choices.decline.label, { exact: false });
    expect(line).toHaveTextContent(invitation.title);
    expect(line).toHaveTextContent("You");
    expect(line).toHaveTextContent(
      activeChapter().campaign.locations.find((l) => l.id === invitation.location)!.name,
    );
  });
  it("ends without confirmation when no timed item is unanswered", () => {
    useGame.setState({
      storyOutcomes: Object.fromEntries(
        activeChapter().invitations.map((i) => [i.id, { status: "chosen" as const }]),
      ),
      demarches: Object.fromEntries(
        activeChapter().demarches.instructions.map((d) => [d.id, { status: "delivered" as const }]),
      ),
      // Mail still waiting would also trigger the confirmation (see first-hour-ui.test.tsx).
      handled: Object.fromEntries(activeChapter().emails.map((e) => [e.id, "reply"])),
      events: [],
    });
    render(<BlackBerry />);
    fireEvent.click(screen.getByRole("button", { name: /End /i }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(useGame.getState().block).not.toBe(invitation.block);
  });
  it("confirms unanswered invitations before ending the block", () => {
    render(<BlackBerry />);
    fireEvent.click(screen.getByRole("button", { name: /End /i }));
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText(invitation.title, { exact: false })).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Go back" }));
    expect(useGame.getState().block).toBe(invitation.block);
  });
});
