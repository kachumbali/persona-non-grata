import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { CRASH_APOLOGY, errorReport } from "../error-report";
import { TitleScreen } from "./TitleScreen";
import { beginNewCareer, initSaves, reloadSaves, SAVE_KEY, startCareer } from "../saves";
import { useGame } from "../store";

const ann = { title: "Ms", name: "Ann", portrait: "diplomat-1", bio: "Ann bio", traits: [] };

function Broken(): ReactNode {
  throw new Error("Test explosion");
}

/** The screen that crashes, with the title screen behind the boundary's back button. */
function Harness() {
  const [screen, setScreen] = useState<"game" | "title">("game");
  return (
    <ErrorBoundary onBackToTitle={() => setScreen("title")}>
      {screen === "title" ? <TitleScreen onNew={() => {}} onLoad={() => {}} /> : <Broken />}
    </ErrorBoundary>
  );
}

const setClipboard = (value: unknown) =>
  Object.defineProperty(navigator, "clipboard", { value, configurable: true });

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  initSaves();
  localStorage.clear();
  reloadSaves();
  useGame.getState().reset();
  beginNewCareer(0);
  startCareer(ann, {});
  useGame.getState().advance();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  setClipboard(undefined);
});

describe("error boundary", () => {
  it("shows the apology and both buttons instead of the crashed screen", () => {
    render(<Harness />);
    expect(screen.getByText(CRASH_APOLOGY)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to the title screen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy error report" })).toBeInTheDocument();
    expect(screen.queryByText("Test explosion")).not.toBeInTheDocument();
  });

  it("returns to the title screen and leaves the save unchanged", () => {
    const before = localStorage.getItem(SAVE_KEY);
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Back to the title screen" }));
    expect(screen.getByRole("list", { name: "Save slots" })).toBeInTheDocument();
    expect(screen.getByText("Main Menu")).toBeInTheDocument();
    expect(screen.getByRole("listitem", { name: "Slot 1" })).toHaveTextContent("Ms Ann");
    expect(localStorage.getItem(SAVE_KEY)).toBe(before);
  });

  it("copies the error report with the day, block, chapter and posting version", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    render(<Harness />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy error report" }));
    });
    expect(writeText).toHaveBeenCalledTimes(1);
    const text = writeText.mock.calls[0]![0] as string;
    expect(text).toContain("Error: Test explosion");
    expect(text).toContain("Stack:");
    expect(text).toContain("Day: 1");
    expect(text).toContain("Block: ");
    expect(text).toContain("Chapter: ");
    expect(text).toContain(`Posting version: ${useGame.persist.getOptions().version}`);
    expect(screen.getByRole("status")).toHaveTextContent("Copied to the clipboard.");
    expect(localStorage.getItem(SAVE_KEY)).not.toBeNull();
  });

  it("shows the report selected in a text box when copying is blocked", async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error("denied")) });
    render(<Harness />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy error report" }));
    });
    const box = screen.getByRole("textbox", { name: "Error report" }) as HTMLTextAreaElement;
    expect(box.value).toContain("Error: Test explosion");
    expect(screen.getByRole("status")).toHaveTextContent(/Ctrl\+C/);
  });

  it("falls back to the text box when there is no clipboard at all", async () => {
    setClipboard(undefined);
    render(<Harness />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy error report" }));
    });
    expect(screen.getByRole("textbox", { name: "Error report" })).toBeInTheDocument();
  });
});

describe("errorReport", () => {
  it("keeps the first lines of the stack and the posting facts", () => {
    const error = new Error("Boom");
    error.stack = ["Error: Boom", "at a", "at b", "at c", "at d", "at e", "at f", "at g"].join(
      "\n",
    );
    const text = errorReport(error);
    expect(text).toContain("at e");
    expect(text).not.toContain("at f");
    expect(text).toContain("Day: 1");
  });
});
