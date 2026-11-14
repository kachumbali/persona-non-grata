import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LocationLead } from "./components/LocationLead";
import { useGame } from "./store";

beforeEach(() => {
  useGame.getState().start({ title: "Mr", name: "Test", face: 0, bio: "", traits: [] });
  useGame.setState({ day: 2, location: "bar", events: [], completedEvents: ["supplier"],
    storyOutcomes: { supplier: { status: "chosen", choice: "check" } } });
});
afterEach(cleanup);

describe("supplier location lead", () => {
  it("offers the correct lead at the bar and queues its decision until block end", () => {
    render(<LocationLead />);
    fireEvent.click(screen.getByRole("button", { name: /follow up: the generous supplier/i }));
    fireEvent.click(screen.getByRole("button", { name: /disclose the connection and change supplier/i }));
    const pending = useGame.getState().pending[0];
    expect(pending?.eventChoice).toBe("transparent");
    expect(pending?.location).toBe("bar");
    expect(pending?.timeCost).toBe(1);
    expect(useGame.getState().storyOutcomes["supplier-followup"]).toBeUndefined();
    expect(screen.getByRole("status")).toHaveTextContent("end of this block");
  });
});
