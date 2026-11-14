import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StoryRecord } from "./components/StoryRecord";

afterEach(cleanup);
describe("side-story record", () => {
  it("shows recorded choices, missed stories and unknown legacy choices accurately", () => {
    render(<StoryRecord day={15} completed={["supplier", "press", "elise"]} outcomes={{ supplier: { status: "chosen", choice: "check" }, press: { status: "missed" }, elise: { status: "chosen" } }} />);
    const details = screen.getByLabelText("Side-story record");
    expect(details).toHaveTextContent("Ask Sola to check the ownership");
    expect(details).toHaveTextContent("A casual quote — No response");
    expect(details).toHaveTextContent("A project, not a photo opportunity — Responded");
    expect(details).toHaveTextContent("The generous supplier · part II — Left open at the end of the posting");
    expect(details).not.toHaveTextContent("A chair of national importance");
  });
});
