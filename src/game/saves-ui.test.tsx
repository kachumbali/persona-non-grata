import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { TitleScreen } from "./components/TitleScreen";
import { beginNewCareer, initSaves, reloadSaves, slotAt, startCareer, useSaves } from "./saves";
import { useGame } from "./store";

const ann = {
  title: "Ms",
  name: "Ann",
  portrait: "diplomat-1",
  bio: "Ann bio",
  traits: ["replyall"],
};
const slotItem = (n: number) => screen.getByRole("listitem", { name: `Slot ${n}` });

beforeEach(() => {
  initSaves();
  localStorage.clear();
  reloadSaves();
  useGame.getState().reset();
  act(() => {
    beginNewCareer(0);
    startCareer(ann, { origin: 1, misstep: 2, reason: 3 });
    useGame.getState().advance();
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("title screen save slots", () => {
  it("lists three slots as empty or occupied", () => {
    render(<TitleScreen onNew={() => {}} onLoad={() => {}} />);
    expect(within(slotItem(1)).getByText("Ms Ann · Chapter 1 · Day 1")).toBeInTheDocument();
    expect(within(slotItem(2)).getByText("Empty")).toBeInTheDocument();
    expect(within(slotItem(3)).getByText("Empty")).toBeInTheDocument();
  });

  it("continues a slot", () => {
    const onLoad = vi.fn();
    act(() => beginNewCareer(1));
    render(<TitleScreen onNew={() => {}} onLoad={onLoad} />);
    expect(useGame.getState().character).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue slot 1" }));
    expect(onLoad).toHaveBeenCalled();
    expect(useGame.getState().character?.name).toBe("Ann");
    expect(useGame.getState().block).toBe(1);
  });

  it("starts a new career on an empty slot without touching the others", () => {
    const onNew = vi.fn();
    render(<TitleScreen onNew={onNew} onLoad={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "New career in slot 3" }));
    expect(onNew).toHaveBeenCalled();
    expect(useSaves.getState().activeSlot).toBe(2);
    expect(useGame.getState().character).toBeNull();
    expect(slotAt(0)?.career.identity.name).toBe("Ann");
  });

  it("asks before replacing an occupied slot", () => {
    const onNew = vi.fn();
    render(<TitleScreen onNew={onNew} onLoad={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "New career in slot 1" }));
    expect(onNew).not.toHaveBeenCalled();
    expect(within(slotItem(1)).getByText(/Start a new career in slot 1/)).toBeInTheDocument();
    fireEvent.click(within(slotItem(1)).getByRole("button", { name: "Cancel" }));
    expect(onNew).not.toHaveBeenCalled();
    expect(slotAt(0)?.career.identity.name).toBe("Ann");
    fireEvent.click(screen.getByRole("button", { name: "New career in slot 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Replace career" }));
    expect(onNew).toHaveBeenCalled();
    // The old career survives until the new one is accepted.
    expect(slotAt(0)?.career.identity.name).toBe("Ann");
  });

  it("deletes only after confirmation", () => {
    render(<TitleScreen onNew={() => {}} onLoad={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete slot 1" }));
    expect(slotAt(0)).not.toBeNull();
    fireEvent.click(within(slotItem(1)).getByRole("button", { name: "Cancel" }));
    expect(slotAt(0)).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Delete slot 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));
    expect(slotAt(0)).toBeNull();
    expect(within(slotItem(1)).getByText("Empty")).toBeInTheDocument();
  });

  it("exports a code and imports it into another slot", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    render(<TitleScreen onNew={() => {}} onLoad={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Export slot 1" }));
    const box = screen.getByLabelText(/Career code for slot 1/) as HTMLTextAreaElement;
    expect(box).toHaveAttribute("readonly");
    expect(box.value.startsWith("PNG1.")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenCalledWith(box.value);

    const target = within(slotItem(2));
    fireEvent.change(target.getByRole("textbox"), { target: { value: box.value } });
    fireEvent.click(target.getByRole("button", { name: "Import into slot 2" }));
    expect(target.getByText("Ms Ann · Chapter 1 · Day 1")).toBeInTheDocument();
    expect(slotAt(1)).toEqual(slotAt(0));
    expect(slotAt(1)?.career.background).toEqual({ origin: 1, misstep: 2, reason: 3 });
  });

  it("falls back to selecting the code when the clipboard is blocked", async () => {
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    render(<TitleScreen onNew={() => {}} onLoad={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Export slot 1" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    });
    expect(screen.getByRole("status")).toHaveTextContent(/Ctrl\+C/);
  });

  it("shows a clear error for a bad code and leaves the slot empty", () => {
    render(<TitleScreen onNew={() => {}} onLoad={() => {}} />);
    const target = within(slotItem(3));
    fireEvent.change(target.getByRole("textbox"), { target: { value: "PNG1.abc" } });
    fireEvent.click(target.getByRole("button", { name: "Import into slot 3" }));
    expect(target.getByRole("alert")).toHaveTextContent(/incomplete/i);
    expect(slotAt(2)).toBeNull();
  });
});
