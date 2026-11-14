import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PlaceScene } from "./components/PlaceScene";
import { delegationSucceeds, EMAILS, initialColleagues, locationStories, pairKey } from "./rules";
import { useGame } from "./store";

beforeEach(() => {
  useGame.getState().start({ title: "Mx", name: "Test", face: 0, bio: "", traits: [] });
  useGame.setState({ day: 2, location: "embassy", events: [], handled: Object.fromEntries(EMAILS.map((email) => [email.id, "reply"])) });
});
afterEach(cleanup);

describe("embassy relationships", () => {
  it("applies Bianca's conversation to Lucien, not Sola", () => {
    useGame.setState({ storyFlags: ["dialogue:bianca:convoy"] });
    render(<PlaceScene onLeave={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Talk to Bianca/ }));
    fireEvent.click(screen.getByRole("button", { name: /Work together. Bring the gradient/ }));
    act(() => { useGame.getState().advance(); });
    expect(useGame.getState().relationships[pairKey("bianca", "press")]).toBe(55);
    expect(useGame.getState().relationships[pairKey("bianca", "sola")]).toBeUndefined();
  });
  it("resolves a legacy queued dialogue for its intended pair without inventing generic pairs", () => {
    const queue = useGame.getState().queue;
    expect(queue({ id: "legacy", kind: "dialogue", source: "Legacy", text: "Legacy", effects: {}, worker: "sola", dialogueTopic: "sola:translator", pair: -2, timeCost: 1, overload: true })).toBe(true);
    useGame.getState().advance();
    expect(useGame.getState().relationships[pairKey("sola", "bianca")]).toBe(48);
    expect(useGame.getState().relationships[pairKey("sola", "sola")]).toBeUndefined();
  });
  it("lets a skilled partner contribute expertise while enforcing trust, fatigue and cooperation", () => {
    const staff = initialColleagues();
    expect(delegationSucceeds("maxim", "security", staff, {}, undefined)).toBe(false);
    expect(delegationSucceeds("maxim", "security", staff, {}, "bianca")).toBe(true);
    expect(delegationSucceeds("maxim", "security", staff, { [pairKey("maxim", "bianca")]: 24 }, "bianca")).toBe(false);
    expect(delegationSucceeds("maxim", "security", { ...staff, bianca: { trust: 24, fatigue: 0 } }, {}, "bianca")).toBe(false);
    expect(delegationSucceeds("maxim", "security", { ...staff, bianca: { trust: 50, fatigue: 80 } }, {}, "bianca")).toBe(false);
    expect(delegationSucceeds("maxim", "security", staff, {}, "maxim")).toBe(false);
  });
  it("resolves a joint assignment using the partner's skill and applies both workloads", () => {
    expect(useGame.getState().queue({ id: "joint", kind: "work", source: "Security", text: "Security confirmed", effects: {}, worker: "maxim", partner: "bianca", task: "security", timeCost: 0, overload: true })).toBe(true);
    useGame.getState().advance();
    const state = useGame.getState();
    expect(state.visit.security).toBe(true);
    expect(state.colleagues["maxim"]?.fatigue).toBeGreaterThanOrEqual(18);
    expect(state.colleagues["bianca"]?.fatigue).toBeGreaterThanOrEqual(18);
  });
  it.each([
    { label: /Ask Sola and the partners/, id: "consult", follow: "staff-sola-consult-followup", pair: 43 },
    { label: /Tell Sola to translate/, id: "instruct", follow: "staff-sola-instruct-followup", pair: 30 },
    { label: /Pause the proposal/, id: "pause", follow: "staff-sola-pause-followup", pair: 37 },
  ])("records the $id approach and offers only its corresponding later scene", ({ label, id, follow, pair }) => {
    render(<PlaceScene onLeave={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Follow up: Whose project is it/ }));
    expect(screen.getByText(/Registry, local coordination/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Allow displaced routine work/));
    fireEvent.click(screen.getByRole("button", { name: label }));
    expect(useGame.getState().storyOutcomes["staff-sola-elise"]).toBeUndefined();
    act(() => { useGame.getState().advance(); });
    const state = useGame.getState();
    expect(state.storyOutcomes["staff-sola-elise"]).toEqual({ status: "chosen", choice: id });
    expect(state.relationships[pairKey("sola", "development")]).toBe(pair);
    expect(locationStories(3, state.completedEvents, state.storyOutcomes).filter((event) => event.id.startsWith("staff-sola-") && event.id.endsWith("followup")).map((event) => event.id)).toEqual([follow]);
  });
  it.each([["mediate", "staff-rivalry-mediate-followup"], ["order", "staff-rivalry-order-followup"]] as const)("recalls the %s response to the Anselm–Pavel rivalry", (choice, expected) => {
    const outcomes = { rivalry: { status: "chosen" as const, choice } };
    expect(locationStories(2, ["rivalry"], outcomes).filter((event) => event.id.startsWith("staff-rivalry-")).map((event) => event.id)).toEqual([expected]);
    expect(locationStories(2, ["rivalry"], { rivalry: { status: "missed" } }).some((event) => event.id.startsWith("staff-rivalry-"))).toBe(false);
  });
  it("keeps the chosen Sola story through save reload and resolves its follow-up once", async () => {
    useGame.setState({ day: 3, completedEvents: ["staff-sola-elise"], storyOutcomes: { "staff-sola-elise": { status: "chosen", choice: "instruct" } } });
    const saved = localStorage.getItem("persona-non-grata-save");
    expect(saved).toBeTruthy();
    useGame.getState().start({ title: "Mx", name: "Other", face: 0, bio: "", traits: [] });
    localStorage.setItem("persona-non-grata-save", saved!);
    await act(async () => { await useGame.persist.rehydrate(); });
    render(<PlaceScene onLeave={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Follow up: The translation comes back/ }));
    fireEvent.click(screen.getByLabelText(/Allow displaced routine work/));
    fireEvent.click(screen.getByRole("button", { name: /Acknowledge the mistake/ }));
    act(() => { useGame.getState().advance(); });
    const state = useGame.getState();
    expect(state.storyOutcomes["staff-sola-instruct-followup"]).toEqual({ status: "chosen", choice: "repair" });
    expect(state.relationships[pairKey("sola", "development")]).toBe(40);
    expect(locationStories(3, state.completedEvents, state.storyOutcomes).some((event) => event.id === "staff-sola-instruct-followup")).toBe(false);
  });
});
