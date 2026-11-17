import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { buildDebrief } from "./debrief";
import { Debrief } from "./components/Debrief";
import { beginNewCareer, continueSlot, reloadSaves, slotAt, startCareer } from "./saves";
import { useGame } from "./store";
const person = {
  title: "Mx",
  name: "Tester",
  portrait: "diplomat-1",
  bio: "A long posting.",
  traits: ["replyall"],
};
beforeEach(() => {
  localStorage.clear();
  useGame.getState().start(person);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("debrief", () => {
  it("deterministically reports the outcome, quality, people and payslip", () => {
    useGame.setState({
      ending: "promoted",
      visit: { programme: true },
      demarches: { a: { status: "delivered", quality: "good", route: "note" } },
    });
    const g = useGame.getState(),
      d = buildDebrief(g);
    expect(buildDebrief(g)).toEqual(d);
    expect(d.title).toContain("Promoted");
    expect(d.variant).toBeTruthy();
    expect(d.board).toHaveLength(3);
    expect(d.text).toContain("Démarches: 1 delivered");
    expect(d.payslip.total).toBe(5850);
    const payslip = d.sections.find((s) => s.heading === "Payslip")!.lines;
    expect(payslip.some((line) => /: (−?ƒ)0$/.test(line))).toBe(false);
    expect(payslip.at(-1)).toBe("Total: ƒ5850");
  });
  it("offers a selected text fallback if clipboard access fails", async () => {
    useGame.setState({ ending: "promoted" });
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("blocked")) },
      configurable: true,
    });
    render(<Debrief />);
    fireEvent.click(screen.getByRole("button", { name: "Copy as text" }));
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Debrief text to copy" })).toBeInTheDocument(),
    );
    const area = screen.getByRole("textbox", {
      name: "Debrief text to copy",
    }) as HTMLTextAreaElement;
    expect(area.value).toContain("Promotion board");
    expect(area.selectionEnd).toBe(area.value.length);
  });
  it("copies the entire debrief when the clipboard is available", async () => {
    useGame.setState({ ending: "promoted" });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<Debrief />);
    fireEvent.click(screen.getByRole("button", { name: "Copy as text" }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(buildDebrief(useGame.getState()).text),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Debrief copied.");
  });
  it("credits the payslip once across a reload", () => {
    beginNewCareer(0);
    startCareer(person, {});
    useGame.setState({ ending: "promoted" });
    const salary = slotAt(0)!.career.savings;
    expect(salary).toBe(5850);
    reloadSaves();
    continueSlot(0);
    expect(slotAt(0)!.career.savings).toBe(salary);
    expect(slotAt(0)!.career.chapters).toHaveLength(1);
  });
});
