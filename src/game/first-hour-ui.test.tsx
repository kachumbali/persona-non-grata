import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { BlackBerry } from "./components/BlackBerry";
import { GameScreen } from "./components/GameScreen";
import { PlaceScene } from "./components/PlaceScene";
import { activeChapter } from "./chapters";
import { firstDayChecklist } from "./first-hour";
import { useGame } from "./store";
import { useUi } from "./ui";

vi.mock("./components/CityMap", () => ({ CityMap: () => <div>City</div>, SPOTS: {} }));
vi.mock("./components/Interruption", () => ({ Interruption: () => <div>Interruption</div> }));

const chapter = activeChapter();
const character = { title: "Mx", name: "Test", portrait: "diplomat-1", bio: "", traits: [] };
const at = (day: number, block: number, extra = {}) =>
  useGame.setState({
    day,
    block,
    minute: chapter.manifest.blocks[block]!.time,
    events: [],
    ...extra,
  });
beforeEach(() => {
  useGame.getState().start(character);
  useUi.getState().clear();
  at(1, 0);
});
afterEach(cleanup);

describe("badges", () => {
  it("shows a quiet badge for Capital's Day 1 Morning faxes, which cost nothing yet", () => {
    render(<PlaceScene onLeave={() => {}} />);
    const badge = screen.getByRole("img", { name: "2 faxes waiting, no penalty yet" });
    expect(badge).toHaveAttribute("data-kind", "unread");
    expect(screen.queryByRole("img", { name: /answer/ })).toBeNull();
  });

  it("shows strong badges on the fax, the PC and the PC's Mail tab once mail costs something", () => {
    at(1, 1);
    render(<PlaceScene onLeave={() => {}} />);
    const fax = screen.getByRole("img", { name: "2 faxes waiting, answer them this block" });
    expect(fax).toHaveAttribute("data-kind", "urgent");
    const mailPc = screen.getAllByRole("img", { name: "1 mail waiting, answer it this block" });
    expect(mailPc).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Use your PC" }));
    expect(
      screen.getAllByRole("img", { name: "1 mail waiting, answer it this block", hidden: true }),
    ).toHaveLength(2);
    const tab = screen.getByRole("button", { name: /^Courrielleur 98/ });
    expect(within(tab).getByRole("img")).toHaveAttribute("data-kind", "urgent");
  });

  it("drops a badge when the mail is answered", () => {
    at(1, 1, { handled: { e1: "reply", e2: "reply" } });
    render(<PlaceScene onLeave={() => {}} />);
    expect(screen.queryByRole("img", { name: /faxes? waiting/ })).toBeNull();
  });

  it("badges the BlockBerry button and Mail tab away from the office, and says the fax needs the embassy", () => {
    at(1, 1, { location: "ministry" });
    render(<BlackBerry />);
    const phone = screen.getByRole("button", { name: /^BlockBerry phone/ });
    expect(within(phone).getByRole("img")).toHaveAttribute("data-kind", "urgent");
    expect(phone).toHaveAccessibleName(/3 mails waiting, answer them this block/);
    fireEvent.click(phone);
    expect(screen.getByText(/only be read at the embassy/)).toBeInTheDocument();
  });
});

describe("the arrival notice", () => {
  it("lists what is waiting on every block and opens the fax or the PC", () => {
    at(1, 1);
    render(<GameScreen />);
    expect(screen.getByLabelText("Waiting")).toHaveTextContent(
      "Waiting: 2 faxes from Capital · 1 mail on the PC.",
    );
    expect(useUi.getState().request).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "2 faxes from Capital" }));
    expect(screen.getByText(/SECURE FAX/)).toBeInTheDocument();
    expect(useGame.getState().firstHour.opened).toContain("fax");
  });

  it("opens the fax window in the office scene from a request, and marks it read", () => {
    render(<PlaceScene onLeave={() => {}} />);
    act(() => useUi.getState().open("fax"));
    expect(screen.getByText(/SECURE FAX/)).toBeInTheDocument();
    expect(useGame.getState().firstHour.opened).toContain("fax");
    expect(useUi.getState().request).toBeNull();
  });

  it("says a fax can only be read at the embassy when the player is elsewhere", () => {
    at(1, 1, { location: "ministry" });
    render(<GameScreen />);
    const line = screen.getByLabelText("Waiting");
    expect(line).toHaveTextContent("the fax can only be read at the embassy");
    expect(screen.queryByRole("button", { name: /faxes from Capital/ })).toBeNull();
    expect(within(line).getByRole("button", { name: "1 mail on the BlockBerry" })).toBeTruthy();
  });

  it("is absent when nothing waits, and never blocks an interruption", () => {
    at(1, 1, { handled: Object.fromEntries(chapter.emails.map((e) => [e.id, "reply"])) });
    render(<GameScreen />);
    expect(screen.queryByLabelText("Waiting")).toBeNull();
    expect(screen.getByText("Interruption")).toBeInTheDocument();
  });
});

describe("the end-of-block confirmation", () => {
  it("lists unanswered faxes and PC mail grouped by device when two faxes are unanswered", () => {
    at(1, 1);
    render(<BlackBerry />);
    fireEvent.click(screen.getByRole("button", { name: /End /i }));
    const dialog = screen.getByRole("alertdialog");
    const list = within(dialog).getByLabelText("Mail that will be marked ignored");
    expect(list).toHaveTextContent("Secure fax: 2 faxes");
    expect(list).toHaveTextContent("PC mail: 1 mail");
    expect(useGame.getState().block).toBe(1);
    fireEvent.click(within(dialog).getByRole("button", { name: "End the block anyway" }));
    expect(useGame.getState().block).toBe(2);
  });

  it("does not trigger for mail in its grace period", () => {
    render(<BlackBerry />);
    fireEvent.click(screen.getByRole("button", { name: /End /i }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(useGame.getState().block).toBe(1);
  });
});

describe("the first-day checklist", () => {
  it("ticks itself off from real state", () => {
    const state = () => useGame.getState();
    const done = () =>
      firstDayChecklist(state(), chapter)
        .filter((i) => i.done)
        .map((i) => i.id);
    render(<GameScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss briefing" }));
    const list = screen.getByLabelText("First-day checklist");
    expect(within(list).getAllByRole("listitem")).toHaveLength(5);
    expect(done()).toEqual([]);
    act(() => state().markFirstHour("fax"));
    expect(done()).toEqual(["fax"]);
    expect(within(list).getAllByRole("listitem")[0]).toHaveAttribute("data-done", "true");
    act(() => state().markFirstHour("pc"));
    act(() =>
      state().queue({
        id: "conversation-sola",
        kind: "dialogue",
        source: "Conversation with Sola",
        text: "",
        effects: {},
        timeCost: 1,
        worker: "sola",
      }),
    );
    expect(done()).toEqual(["fax", "pc", "colleague"]);
    act(() => state().advance());
    expect(done()).toContain("end-block");
  });

  it("is dismissed for good, and never returns in that career", () => {
    render(<GameScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss briefing" }));
    fireEvent.click(
      within(screen.getByLabelText("First-day checklist")).getByRole("button", { name: "Dismiss" }),
    );
    expect(screen.queryByLabelText("First-day checklist")).toBeNull();
    expect(useGame.getState().character?.firstHourDone).toBe(true);
    const career = useGame.getState().character!;
    useGame.getState().start(career);
    expect(useGame.getState().firstHour.dismissed).toBe(true);
  });

  it("appears only on Day 1", () => {
    at(2, 0);
    render(<GameScreen />);
    expect(screen.queryByLabelText("First-day checklist")).toBeNull();
  });
});

describe("dismissed things stay dismissed", () => {
  it("does not show the posting briefing or the press review again after a remount", () => {
    const first = render(<GameScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss briefing" }));
    expect(screen.getByLabelText("Press review")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(useGame.getState().briefingDismissed).toBe(true);
    first.unmount();
    render(<GameScreen />);
    expect(screen.queryByRole("button", { name: "Dismiss briefing" })).toBeNull();
    expect(screen.queryByLabelText("Press review")).toBeNull();
  });

  it("migrates old saves with the briefing and checklist already dismissed", async () => {
    const options = useGame.persist.getOptions();
    const migrated = (await options.migrate!({ day: 2 }, 16)) as {
      briefingDismissed: boolean;
      firstHour: { dismissed: boolean };
    };
    expect(migrated.briefingDismissed).toBe(true);
    expect(migrated.firstHour.dismissed).toBe(true);
  });
});
