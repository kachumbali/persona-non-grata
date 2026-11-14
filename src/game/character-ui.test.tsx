import { afterEach, beforeEach, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CharacterBuilder } from "./components/CharacterBuilder";
import { Conversation } from "./components/Conversation";
import { useGame } from "./store";

beforeEach(() =>
  useGame.getState().start({ title: "Mx", name: "Test", face: 0, bio: "", traits: [] }),
);
afterEach(cleanup);

it("requires a flaw and limits the personnel file to four traits", () => {
  render(<CharacterBuilder />);
  fireEvent.change(screen.getByPlaceholderText("Surname"), { target: { value: "Tester" } });
  expect(screen.getByRole("button", { name: /Accept posting/ })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: /Reply-All Reflex/ }));
  expect(screen.getByRole("button", { name: /Accept posting/ })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: /Brussels Brain/ }));
  fireEvent.click(screen.getByRole("button", { name: /Compulsive Démarche/ }));
  fireEvent.click(screen.getByRole("button", { name: /Name-dropper/ }));
  expect(screen.getByRole("button", { name: /Secret Novelist/ })).toBeDisabled();
});
it("only shows a tagged conversation choice to an eligible character", () => {
  useGame.setState({ selectedNpc: "pavel", storyFlags: ["dialogue:pavel:ambassadors"] });
  const { rerender } = render(<Conversation />);
  expect(screen.queryByRole("button", { name: /\[Name-dropper\]/ })).not.toBeInTheDocument();
  act(() => {
    useGame.setState({ character: { ...useGame.getState().character!, traits: ["namedrop"] } });
  });
  rerender(<Conversation />);
  expect(
    screen.getAllByRole("button").some((button) => button.textContent?.includes("[Name-dropper]")),
  ).toBe(true);
});
