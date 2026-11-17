import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { useGame } from "../store";
import { WhoIsWho } from "./WhoIsWho";
afterEach(cleanup);
describe("Who is who", () => {
  it("shows met people but leaves undiscovered details unknown", () => {
    useGame
      .getState()
      .start({ title: "Mx", name: "Tester", portrait: "diplomat-1", bio: "", traits: [] });
    useGame.getState().selectNpc("anselm");
    render(<WhoIsWho />);
    expect(screen.getByText("Anselm Voss-Rietveld")).toBeInTheDocument();
    expect(screen.getByText(/Traits: Credits self, \?/)).toBeInTheDocument();
    expect(screen.getByText(/Wants: \?/)).toBeInTheDocument();
    expect(screen.queryByText("Pavel Oskarsen", { selector: "strong" })).not.toBeInTheDocument();
  });
  it("shows the bio of a met person", () => {
    useGame
      .getState()
      .start({ title: "Mx", name: "Tester", portrait: "diplomat-1", bio: "", traits: [] });
    useGame.getState().selectNpc("anselm");
    render(<WhoIsWho />);
    expect(screen.getByText(/On his first posting, Anselm drafted/)).toBeInTheDocument();
  });
});
