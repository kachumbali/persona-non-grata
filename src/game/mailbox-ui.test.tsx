import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Mailbox } from "./components/Mailbox";
import { useGame } from "./store";

beforeEach(() => {
  useGame.getState().start({ title: "Mx", name: "Test", face: 0, bio: "", traits: [] });
});
afterEach(cleanup);

describe("mail scheduling", () => {
  it("shows why a reply cannot fit without losing the existing plan", () => {
    expect(useGame.getState().queue({ id: "busy", source: "Busy", text: "Busy", effects: {}, kind: "work", timeCost: 4 })).toBe(true);
    render(<Mailbox channel="fax" />);
    fireEvent.click(screen.getByRole("button", { name: /URGENT: Political situation/i }));
    fireEvent.click(screen.getByRole("button", { name: /send the report yourself/i }));
    expect(screen.getByRole("alert")).toHaveTextContent("only 4 DP");
    expect(useGame.getState().pending.map((p) => p.id)).toEqual(["busy"]);
  });
});
