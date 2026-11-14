import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PlaceScene } from "./components/PlaceScene";
import { EMAILS } from "./rules";
import { useGame } from "./store";

beforeEach(() => {
  useGame.getState().start({ title: "Mx", name: "Test", face: 0, bio: "", traits: [] });
  useGame.setState({ location: "eu", events: [], handled: Object.fromEntries(EMAILS.map((email) => [email.id, "reply"])) });
});
afterEach(cleanup);

describe("EU coordination", () => {
  it("shows a readable local roster and explicit scope of Cyprus representation", () => {
    render(<PlaceScene onLeave={() => {}} />);
    expect(screen.getByRole("region", { name: "EU representatives present" })).toHaveTextContent("Head of the EU Delegation");
    expect(screen.getByRole("button", { name: /Tanya Farrugia/ })).toHaveTextContent("authorised by Cyprus");
    expect(screen.getByRole("button", { name: /Niko Arden/ })).toHaveTextContent("Denmark");
    fireEvent.click(screen.getByRole("button", { name: /Tanya Farrugia/ }));
    expect(screen.getByRole("heading", { name: /Tanya Farrugia/ })).toBeInTheDocument();
  });
  it.each([
    { label: /Claim Bellaluxe's 17.6%/, choice: "claim", contact: "eu-malta", trust: 47, followup: "eu-budget-share-claim-followup" },
    { label: /Give Tanya time/, choice: "share", contact: "eu-malta", trust: 54, followup: "eu-budget-share-share-followup" },
    { label: /Propose equal initial/, choice: "reform", contact: "eu-germany", trust: 52, followup: "eu-budget-share-reform-followup" },
  ])("resolves the $choice choice and schedules its next-day follow-up", ({ label, choice, contact, trust, followup }) => {
    render(<PlaceScene onLeave={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /follow up: the 17.6% meeting/i }));
    expect(screen.getByText(/Multiannual Financial Framework/)).toHaveTextContent("17.6%");
    fireEvent.click(screen.getByRole("button", { name: label }));
    expect(useGame.getState().storyOutcomes["eu-budget-share-meeting"]).toBeUndefined();
    expect(useGame.getState().pending.find((item) => item.eventId === "eu-budget-share-meeting")?.contact).toBe(contact);
    act(() => { useGame.getState().advance(); });
    expect(useGame.getState().storyOutcomes["eu-budget-share-meeting"]).toEqual({ status: "chosen", choice });
    expect(useGame.getState().colleagues[contact]?.trust).toBe(trust);
    act(() => { useGame.getState().advance(); useGame.getState().advance(); useGame.getState().advance(); });
    expect(useGame.getState().events.some((event) => event.id === followup)).toBe(true);
    expect(useGame.getState().events.filter((event) => event.id.startsWith("eu-budget-share-") && event.id.endsWith("followup"))).toHaveLength(1);
  });
  it("lets the player select another EU lead without losing the 17.6% meeting", () => {
    useGame.setState({ day: 9, completedEvents: ["asteria-coffee"], storyOutcomes: { "asteria-coffee": { status: "chosen", choice: "attend" } } });
    render(<PlaceScene onLeave={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /follow up: the 17.6% meeting/i }));
    fireEvent.click(screen.getByRole("button", { name: /The coffee clause · a Danish proposal/i }));
    expect(screen.getByText(/After your conversation over coffee/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /The 17.6% meeting/i })).toBeInTheDocument();
  });
  it("migrates a queued Danish invitation without losing its obligation or saved trust", async () => {
    const current = useGame.getState();
    const original = { ...current, colleagues: { ...current.colleagues, "amb-asteria": { trust: 73, fatigue: 4 } },
      pending: [{ id: "invitation-asteria-coffee", kind: "event" as const, source: "Asterian coordination coffee", text: "Asteria sends coffee.", effects: {}, timeCost: 0, cashCost: 0, eventId: "asteria-coffee", eventChoice: "decline" }] };
    const migrated = await useGame.persist.getOptions().migrate!(original, 4);
    expect(migrated.pending[0]).toMatchObject({ id: "invitation-asteria-coffee", eventId: "asteria-coffee", eventChoice: "decline", source: "Danish coordination coffee", text: "Denmark sends coffee." });
    expect(migrated.colleagues["amb-asteria"]?.trust).toBe(73);
    const merged = useGame.persist.getOptions().merge!(migrated, current);
    expect(merged.colleagues["eu-malta"]?.trust).toBe(50);
  });
});
