import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Mailbox, isFax } from "./components/Mailbox";
import { inboxFor, useGame } from "./store";

beforeEach(() => {
  useGame.getState().start({ title: "Mx", name: "Test", face: 0, bio: "", traits: [] });
  useGame.setState({ location: "bar", minute: 720, block: 1, events: [] });
});
afterEach(cleanup);

describe("phone mail navigation", () => {
  it("returns to the inbox and reopens a message without losing its queued reply", () => {
    const state = useGame.getState();
    const email = inboxFor(state.day, state.minute, state.handled).find((e) => !isFax(e.from) && !e.status);
    if (!email) throw new Error("Expected an available phone message");
    render(<Mailbox channel="mail" singlePane />);
    const openMessage = () => fireEvent.click(screen.getByRole("button", { name: `${email.subject} ${email.from}` }));
    openMessage();
    const article = screen.getByRole("heading", { name: email.subject }).closest("article");
    const reply = article?.querySelector("button");
    if (!reply) throw new Error("Expected a reply option");
    fireEvent.click(reply);
    expect(useGame.getState().pending.filter((p) => p.emailId === email.id)).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Back to inbox" }));
    openMessage();
    expect(useGame.getState().pending.filter((p) => p.emailId === email.id)).toHaveLength(1);
    expect(screen.getByRole("heading", { name: email.subject })).toBeTruthy();
  });
});