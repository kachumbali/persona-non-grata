import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { DiplomaticRecord } from "./components/DiplomaticRecord";

afterEach(cleanup);
describe("diplomatic record", () => {
  it("reports the recorded response and omission without inventing other attendance", () => {
    render(<DiplomaticRecord outcomes={{ "eu27-coordination": { status: "chosen", choice: "delegate" }, "valdoria-national-day": { status: "missed" } }} />);
    expect(screen.getByText(/EU27 coordination meeting/).closest("li")).toHaveTextContent("Sent a colleague");
    expect(screen.getByText(/Valdorian national-day reception/).closest("li")).toHaveTextContent("No response");
    expect(screen.queryByText(/UN development roundtable/)).not.toBeInTheDocument();
  });
});
