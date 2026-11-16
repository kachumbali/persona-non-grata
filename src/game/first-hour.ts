/** The first-day checklist: five lines that tick themselves off from real game state. Pure. */
import type { ChapterPack } from "./chapters";
import { isFax, type PendingDecision } from "./rules";
import type { GameState } from "./store";

export const CHECKLIST_HEADING = "Your first day, in five lines";
export type ChecklistId = "fax" | "pc" | "mission" | "colleague" | "end-block";
export const CHECKLIST_LABELS: Record<ChecklistId, string> = {
  fax: "Read the secure fax. It is in your office, and Capital is waiting.",
  pc: "Check the PC. The host's mail arrives there.",
  mission: "Start one mission step. The minister arrives regardless.",
  colleague: "Talk to one colleague. They know things.",
  "end-block": "End the block from the bottom bar. Time passes either way.",
};

type Input = Pick<
  GameState,
  "day" | "block" | "handled" | "pending" | "todayPlans" | "missionSteps" | "firstHour"
>;

export interface ChecklistItem {
  id: ChecklistId;
  label: string;
  done: boolean;
}

export function firstDayChecklist(g: Input, chapter: ChapterPack): ChecklistItem[] {
  const plans: PendingDecision[] = [...g.pending, ...Object.values(g.todayPlans).flat()];
  const answered = (fax: boolean) =>
    chapter.emails.some(
      (e) =>
        isFax(e.from) === fax &&
        ((g.handled[e.id] !== undefined && g.handled[e.id] !== "ignored") ||
          plans.some((p) => p.emailId === e.id)),
    );
  const done: Record<ChecklistId, boolean> = {
    fax: g.firstHour.opened.includes("fax") || answered(true),
    pc: g.firstHour.opened.includes("pc") || answered(false),
    mission:
      plans.some((p) => !!p.task) ||
      Object.values(g.missionSteps).some((steps) => steps.length > 0),
    colleague: plans.some((p) => p.kind === "dialogue" && p.id !== "language-lesson"),
    "end-block": g.day > 1 || g.block > 0,
  };
  return (Object.keys(CHECKLIST_LABELS) as ChecklistId[]).map((id) => ({
    id,
    label: CHECKLIST_LABELS[id],
    done: done[id],
  }));
}

/** On Day 1 only, until dismissed; a dismissed checklist never returns in that career. */
export const showChecklist = (g: Pick<GameState, "day" | "firstHour">): boolean =>
  g.day === 1 && !g.firstHour.dismissed;
