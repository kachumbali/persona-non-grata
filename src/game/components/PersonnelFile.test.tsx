import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useGame } from "../store";
import { Conversation } from "./Conversation";
import { PersonnelFile } from "./PersonnelFile";
afterEach(cleanup);
describe("personnel interface", () => {
  it("names the languages and their levels, and shows stats like the builder", () => {
    useGame.getState().start({
      title: "Mx",
      name: "Test",
      portrait: "diplomat-1",
      bio: "",
      traits: [],
      languages: { bellaluxian: 3, ombrazian: 0, english: 2, french: 2, german: 0 },
    });
    render(<PersonnelFile />);
    expect(
      screen.getByText(
        "Bellaluxian: native. Ombrazian: none. English: dangerous. French: dangerous. German: none.",
      ),
    ).toBeInTheDocument();
    const gravitas = screen.getByText("Gravitas").closest("div")!;
    expect(gravitas).toHaveTextContent(/■+□*/);
    expect(screen.queryByText(/gravitas:/)).toBeNull();
  });

  it("displays a reputation and offers its conversation choice", () => {
    useGame
      .getState()
      .start({ title: "Mx", name: "Test", portrait: "diplomat-1", bio: "", traits: [] });
    const s = useGame.getState();
    useGame.setState({
      selectedNpc: "ines",
      personnel: {
        ...s.personnel,
        reputations: ["biscuit-hawk"],
        earnedReputations: ["biscuit-hawk"],
      },
    });
    render(
      <>
        <PersonnelFile />
        <Conversation />
      </>,
    );
    expect(screen.getAllByText(/The Biscuit Hawk/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /Refer to your reputation/ }));
    expect(useGame.getState().pending.some((p) => p.id === "reputation-biscuit-hawk-ines")).toBe(
      true,
    );
  });
});
