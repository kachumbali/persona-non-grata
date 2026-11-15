/**
 * Mission steps and setbacks. Pure helpers over the active chapter's `missionSteps` and `setbacks`:
 * what is done, what can be done now and why not, what the reserve must hold, and what a setback
 * reopens. The store keeps the progress (`missionSteps`) and which setbacks have landed.
 */
import { activeChapter } from "./chapters";
import type {
  ChapterManifest,
  MissionStep,
  Setback,
  SetbackTarget,
  StepRef,
} from "./chapters/types";

/** Ids of the steps done, by task. */
export type MissionProgress = Record<string, string[]>;

type Manifest = Pick<ChapterManifest, "missionTasks" | "missionSteps" | "setbacks" | "days">;
const manifestOf = (): Manifest => activeChapter().manifest;

/** The steps of a task. A task without authored steps is a single step that is always open. */
export function stepsOf(task: string, manifest: Manifest = manifestOf()): MissionStep[] {
  const authored = manifest.missionSteps?.[task];
  if (authored?.length) return authored;
  const label = manifest.missionTasks[task] ?? task;
  return [{ id: "done", label, short: label.toLowerCase(), earliestDay: 1, result: `${label}.` }];
}
export const findStep = (
  task: string,
  step: string,
  manifest: Manifest = manifestOf(),
): MissionStep | undefined => stepsOf(task, manifest).find((s) => s.id === step);

/** "clearance.landing-form" -> { task, step }. Undefined when the text is not of that shape. */
export function parseStepRef(text: string | undefined): StepRef | undefined {
  if (!text) return undefined;
  const dot = text.indexOf(".");
  if (dot <= 0 || dot === text.length - 1) return undefined;
  return { task: text.slice(0, dot), step: text.slice(dot + 1) };
}

export const stepDone = (progress: MissionProgress, task: string, step: string): boolean =>
  progress[task]?.includes(step) ?? false;
export function taskComplete(
  progress: MissionProgress,
  task: string,
  manifest: Manifest = manifestOf(),
): boolean {
  return stepsOf(task, manifest).every((s) => stepDone(progress, task, s.id));
}
/** The first step of a task that is not done, or undefined when the task is complete. */
export function nextStep(
  progress: MissionProgress,
  task: string,
  manifest: Manifest = manifestOf(),
): MissionStep | undefined {
  return stepsOf(task, manifest).find((s) => !stepDone(progress, task, s.id));
}
export const stepsDone = (progress: MissionProgress, task: string): number =>
  stepsOf(task).filter((s) => stepDone(progress, task, s.id)).length;

/** Setbacks that have landed and name this step, in the order they landed. */
function landed(task: string, step: string, applied: string[], manifest: Manifest) {
  return (manifest.setbacks ?? [])
    .filter((s) => applied.includes(s.id))
    .flatMap((s) => s.targets.filter((t) => t.task === task && t.step === step));
}
/** The step's label now: a landed setback may have renamed it. */
export function stepLabel(
  step: MissionStep,
  task: string,
  applied: string[],
  manifest: Manifest = manifestOf(),
): string {
  let label = step.label;
  for (const t of landed(task, step.id, applied, manifest)) if (t.label) label = t.label;
  return label;
}
/** What the step costs now: its own cash plus any landed setback's extra. */
export function stepCash(
  step: MissionStep,
  task: string,
  applied: string[],
  manifest: Manifest = manifestOf(),
): number {
  return (
    (step.cash ?? 0) +
    landed(task, step.id, applied, manifest).reduce((n, t) => n + (t.cashDelta ?? 0), 0)
  );
}
/**
 * What the mission reserve holds for a step that is not done: its cash plus every extra a setback
 * could still add, so a setback can never leave the visit short of money.
 */
export function stepReserve(
  step: MissionStep,
  task: string,
  manifest: Manifest = manifestOf(),
): number {
  const extras = (manifest.setbacks ?? [])
    .flatMap((s) => s.targets)
    .filter((t) => t.task === task && t.step === step.id)
    .reduce((n, t) => n + Math.max(0, t.cashDelta ?? 0), 0);
  return (step.cash ?? 0) + extras;
}
/** Cash ring-fenced for the mission steps still to do. */
export function missionReserve(
  progress: MissionProgress,
  manifest: Manifest = manifestOf(),
): number {
  let total = 0;
  for (const task of Object.keys(manifest.missionTasks))
    for (const step of stepsOf(task, manifest))
      if (!stepDone(progress, task, step.id)) total += stepReserve(step, task, manifest);
  return total;
}

export type StepStatus =
  { state: "done" } | { state: "available"; hint?: string } | { state: "blocked"; reason: string };

export interface StepContext {
  day: number;
  progress: MissionProgress;
  /** Trust the player's colleagues and contacts have, by character id. */
  trust: Record<string, { trust: number }>;
  setbacksApplied: string[];
  /** The chapter's last day: the arrival, when the arrangements are closed. */
  lastDay?: number;
}

/** The context for stepStatus from the parts of the game state it reads. */
export function stepContext(
  s: {
    day: number;
    missionSteps: MissionProgress;
    colleagues: Record<string, { trust: number }>;
    setbacksApplied: string[];
  },
  manifest: Manifest = manifestOf(),
): StepContext {
  return {
    day: s.day,
    progress: s.missionSteps,
    trust: s.colleagues,
    setbacksApplied: s.setbacksApplied,
    lastDay: manifest.days,
  };
}

export const characterName = (id: string): string =>
  activeChapter().campaign.characters.find((c) => c.id === id)?.name ?? id;
const possessive = (name: string) => (name.endsWith("s") ? `${name}'` : `${name}'s`);

/** Why the player cannot do the step in person (not enough trust), or null. */
export function inPersonBlock(step: MissionStep, trust: StepContext["trust"]): string | null {
  const need = step.requiresTrust;
  if (!need) return null;
  if ((trust[need.character]?.trust ?? 0) >= need.min) return null;
  return `needs ${possessive(characterName(need.character))} trust (${need.min}+)`;
}

/** Done, available now, or blocked with the reason. */
export function stepStatus(
  ctx: StepContext,
  task: string,
  stepId: string,
  manifest: Manifest = manifestOf(),
): StepStatus {
  const steps = stepsOf(task, manifest);
  const index = steps.findIndex((s) => s.id === stepId);
  const step = steps[index];
  if (!step) return { state: "blocked", reason: "no such step" };
  if (stepDone(ctx.progress, task, stepId)) return { state: "done" };
  if (ctx.lastDay !== undefined && ctx.day >= ctx.lastDay)
    return { state: "blocked", reason: "closed: the arrival has begun" };
  if (ctx.day < step.earliestDay)
    return { state: "blocked", reason: `from Day ${step.earliestDay}` };
  const before = steps[index - 1];
  if (before && !stepDone(ctx.progress, task, before.id))
    return { state: "blocked", reason: `needs ${before.short}` };
  const other = step.requiresStep;
  if (other && !stepDone(ctx.progress, other.task, other.step)) {
    const needed = findStep(other.task, other.step, manifest);
    return { state: "blocked", reason: `needs ${needed?.short ?? other.step}` };
  }
  const trustProblem = inPersonBlock(step, ctx.trust);
  return trustProblem
    ? { state: "available", hint: `in person ${trustProblem}; a colleague can go instead` }
    : { state: "available" };
}

export interface SetbackResult {
  progress: MissionProgress;
  applied: string[];
  /** Steps that were done and are open again. */
  reopened: StepRef[];
  /** One line for each setback that landed. */
  texts: { id: string; text: string }[];
}

/** Land every setback that is due on `day` and has not landed yet. */
export function applySetbacks(
  day: number,
  progress: MissionProgress,
  applied: string[],
  manifest: Manifest = manifestOf(),
): SetbackResult {
  const result: SetbackResult = {
    progress: Object.fromEntries(Object.entries(progress).map(([k, v]) => [k, [...v]])),
    applied: [...applied],
    reopened: [],
    texts: [],
  };
  const due = (manifest.setbacks ?? [])
    .filter((s) => s.day <= day && !applied.includes(s.id))
    .sort((a, b) => a.day - b.day);
  for (const setback of due) {
    result.applied.push(setback.id);
    for (const target of setback.targets) {
      const list = result.progress[target.task];
      if (list?.includes(target.step)) {
        result.progress[target.task] = list.filter((id) => id !== target.step);
        result.reopened.push({ task: target.task, step: target.step });
      }
    }
    result.texts.push({ id: setback.id, text: setback.text });
  }
  return result;
}

/** A saved posting from before the steps: a confirmed task has all its steps done. */
export function progressFromVisit(
  visit: Partial<Record<string, boolean>>,
  manifest: Manifest = manifestOf(),
): MissionProgress {
  const progress: MissionProgress = {};
  for (const task of Object.keys(manifest.missionTasks))
    progress[task] = visit[task] ? stepsOf(task, manifest).map((s) => s.id) : [];
  return progress;
}
export const emptyProgress = (manifest: Manifest = manifestOf()): MissionProgress =>
  progressFromVisit({}, manifest);

/** Setbacks that already belong to the past of a posting that is on `day`. */
export const setbacksBefore = (day: number, manifest: Manifest = manifestOf()): string[] =>
  (manifest.setbacks ?? []).filter((s) => s.day <= day).map((s) => s.id);

export type { MissionStep, Setback, SetbackTarget, StepRef };
