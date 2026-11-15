import type { ChoiceGate } from "./character";
import { activeChapter } from "./chapters";
import type { ChapterManifest, EndingText } from "./chapters/types";
import traitsData from "./data/traits.json";

export type MeterKey = "confidence" | "goodwill" | "morale" | "sanity";
export type StatKey = "gravitas" | "charm" | "stamina" | "deniability" | "liver";
export type Action = "reply" | "delegate" | "forward" | "note" | "replyall" | "trait";
export type Meters = Record<MeterKey, number>;

/** A mission task id; the active chapter defines which exist (today's visit tasks). */
export type MissionTask = string;
export type VisitTask = MissionTask;
export type VisitStatus = Partial<Record<MissionTask, boolean>>;
export const missionTasks = (): Record<MissionTask, string> =>
  activeChapter().manifest.missionTasks;
export type Effects = Partial<Meters> & { budget?: number };
export interface Outcome extends ChoiceGate {
  text: string;
  label?: string;
  effects: Effects;
  confirms?: VisitTask;
  formal?: boolean;
}
export interface GoodwillChange {
  day: number;
  time: number;
  source: string;
  kind: "Decision" | "Missed instruction" | "Outcome";
  text: string;
  before: Pick<Meters, "confidence" | "goodwill">;
  after: Pick<Meters, "confidence" | "goodwill">;
}
export function recordGoodwillChange(
  before: Meters,
  after: Meters,
  details: Omit<GoodwillChange, "before" | "after">,
): GoodwillChange {
  return {
    ...details,
    before: { confidence: before.confidence, goodwill: before.goodwill },
    after: { confidence: after.confidence, goodwill: after.goodwill },
  };
}
export function visitReady(
  visit: VisitStatus,
  tasks: Record<string, string> = missionTasks(),
): boolean {
  return Object.keys(tasks).every((key) => visit[key] === true);
}
export function goodwillRisk(value: number): "critical" | "warning" | "stable" {
  return value <= 10 ? "critical" : value <= 25 ? "warning" : "stable";
}
export interface Email {
  id: string;
  day: number;
  time: number;
  from: string;
  subject: string;
  body: string;
  options: Partial<Record<Action, Outcome>>;
  ignore: Outcome;
}
export interface Trait {
  id: string;
  name: string;
  cost: number;
  desc: string;
  plays: string;
  stats: Partial<Record<StatKey, number>>;
}

export const emails = (): Email[] => activeChapter().emails;
export const TRAITS = traitsData as Trait[];

export const DAY_START = 8 * 60;
export const DAY_END = 18 * 60;
export const lastDay = (): number => activeChapter().manifest.days;
export const TRAIT_POINTS = 3;
export const ESCALATE_AFTER = 150; // game minutes before an unanswered email escalates
export const MINUTES_PER_SECOND = 6.5; // at 1x
export const startMeters = (): Meters => ({ ...activeChapter().manifest.startMeters });

export const ACTION_LABELS: Record<Action, string> = {
  reply: "Reply",
  delegate: "Delegate",
  forward: "Forward to Capital",
  note: "Take Note",
  replyall: "Reply All",
  trait: "Special response",
};

export const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function applyEffects(m: Meters, e: Partial<Meters>): Meters {
  const out = { ...m };
  for (const k of Object.keys(m) as MeterKey[]) out[k] = clamp(out[k] + (e[k] ?? 0));
  return out;
}

/** Points left: you get TRAIT_POINTS, positive traits cost points, negative ones refund them. */
export function pointsLeft(traitIds: string[]): number {
  return (
    TRAIT_POINTS - traitIds.reduce((s, id) => s + (TRAITS.find((t) => t.id === id)?.cost ?? 0), 0)
  );
}

export function computeStats(traitIds: string[]): Record<StatKey, number> {
  const s: Record<StatKey, number> = {
    gravitas: 3,
    charm: 3,
    stamina: 3,
    deniability: 3,
    liver: 3,
  };
  for (const id of traitIds) {
    const t = TRAITS.find((x) => x.id === id);
    if (t)
      for (const k of Object.keys(t.stats) as StatKey[])
        s[k] = Math.max(0, s[k] + (t.stats[k] ?? 0));
  }
  return s;
}

export const absTime = (day: number, minute: number) => day * 10000 + minute;

export function formatClock(minute: number) {
  const h = Math.floor(minute / 60),
    m = Math.floor(minute % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export type Ending = string;
export const endings = (): Record<Ending, EndingText> => activeChapter().manifest.endings;

/**
 * Game over early if an early rule matches (a meter at zero); otherwise judged on the final day.
 * The chapter's ordered endingRules decide; the first matching rule wins.
 */
export function pickEnding(
  m: Meters,
  finalDay: boolean,
  visit: VisitStatus = {},
  manifest: ChapterManifest = activeChapter().manifest,
): Ending | null {
  for (const rule of manifest.endingRules) {
    if (rule.finalDay && !finalDay) continue;
    if (
      rule.meterAtMost &&
      !(Object.entries(rule.meterAtMost) as [MeterKey, number][]).every(([k, v]) => m[k] <= v)
    )
      continue;
    if (
      rule.meterAtLeast &&
      !(Object.entries(rule.meterAtLeast) as [MeterKey, number][]).every(([k, v]) => m[k] >= v)
    )
      continue;
    if (rule.missionIncomplete && visitReady(visit, manifest.missionTasks)) continue;
    return rule.ending;
  }
  return null;
}

export const campaign = () => activeChapter().campaign;
export const blocks = () => activeChapter().manifest.blocks;
export interface ColleagueState {
  trust: number;
  fatigue: number;
}
export type Relationships = Record<string, number>;
export const pairKey = (a: string, b: string) => [a, b].sort().join(":");
export function initialColleagues(): Record<string, ColleagueState> {
  return Object.fromEntries(
    campaign().characters.map((c) => [
      c.id,
      { trust: activeChapter().manifest.startTrust, fatigue: 0 },
    ]),
  );
}
export interface PendingDecision {
  id: string;
  source: string;
  text: string;
  effects: Effects;
  kind: "work" | "email" | "social" | "dialogue" | "event";
  worker?: string | undefined;
  partner?: string | undefined;
  pairTarget?: string | undefined;
  task?: VisitTask | undefined;
  trust?: number | undefined;
  pair?: number | undefined;
  dialogueTopic?: string | undefined;
  drinks?: boolean | undefined;
  contact?: string | undefined;
  contactTrust?: number | undefined;
  score?: number | undefined;
  energy?: number | undefined;
  composure?: number | undefined;
  flag?: string | undefined;
  timeCost?: number | undefined;
  cashCost?: number | undefined;
  guestTime?: number | undefined;
  overload?: boolean | undefined;
  service?: "express" | "driver" | undefined;
  location?: string | undefined;
  venue?: string | undefined;
  remainingBlocks?: number | undefined;
  special?: "supplement" | undefined;
  formal?: boolean | undefined;
  traitChoice?: string | undefined;
  recall?: Outcome | undefined;
  emailId?: string | undefined;
  emailAction?: Action | undefined;
  eventId?: string | undefined;
  eventChoice?: string | undefined;
  playerSlot?: boolean | undefined;
}
export interface StoryChoice extends ChoiceGate {
  id: string;
  label: string;
  next?: string;
  effects?: Effects;
  result?: string;
  trust?: number;
  pair?: number;
  pairTarget?: string;
  score?: number;
  flag?: string;
  replace?: boolean;
  worker?: string;
  contact?: string;
  contactTrust?: number;
  staff?: string;
  cashCost?: number;
  formal?: boolean;
}
export type StoryOutcome = { status: "chosen" | "missed"; choice?: string };
export type StoryEvent = {
  id: string;
  title: string;
  npc: string;
  text: string;
  minDay: number;
  expiresDay?: number;
  location?: string;
  requires?: string;
  requiresFlag?: string;
  requiresChoice?: { eventId: string; choiceId: string };
  onMiss?: { text: string; effects: Effects };
  choices: StoryChoice[];
};
/** A prerequisite must have succeeded; missed episodes cannot unlock continuations. */
export function storyPrerequisitesMet(
  event: StoryEvent,
  completed: string[],
  outcomes: Record<string, StoryOutcome>,
): boolean {
  return (
    (!event.requires ||
      (completed.includes(event.requires) && outcomes[event.requires]?.status !== "missed")) &&
    (!event.requiresChoice ||
      (outcomes[event.requiresChoice.eventId]?.status === "chosen" &&
        outcomes[event.requiresChoice.eventId]?.choice === event.requiresChoice.choiceId))
  );
}
/** Stories that reached their deadline before they could be offered are recorded once. */
export function expiredStories(
  events: StoryEvent[],
  day: number,
  completed: string[],
  outcomes: Record<string, StoryOutcome>,
  flags: string[] = [],
): StoryEvent[] {
  return events.filter(
    (event) =>
      (!event.requiresFlag || flags.includes(event.requiresFlag)) &&
      event.expiresDay !== undefined &&
      event.expiresDay < day &&
      !completed.includes(event.id) &&
      storyPrerequisitesMet(event, completed, outcomes),
  );
}
/** Location leads remain available until resolved or expired. */
export function locationStories(
  day: number,
  completed: string[],
  outcomes: Record<string, StoryOutcome>,
  events: StoryEvent[] = campaign().events,
  flags: string[] = [],
): StoryEvent[] {
  return events.filter(
    (event) =>
      !!event.location &&
      (!event.requiresFlag || flags.includes(event.requiresFlag)) &&
      event.minDay <= day &&
      (event.expiresDay === undefined || day <= event.expiresDay) &&
      !completed.includes(event.id) &&
      storyPrerequisitesMet(event, completed, outcomes),
  );
}
/** Select one to three available events; a day can be quiet when all stories are complete. */
export function dailyEvents(
  day: number,
  seed: number,
  completed: string[],
  outcomes: Record<string, StoryOutcome> = {},
): StoryEvent[] {
  const available = campaign().events.filter(
    (event) =>
      !event.location &&
      event.minDay <= day &&
      (event.expiresDay === undefined || day <= event.expiresDay) &&
      storyPrerequisitesMet(event, completed, outcomes) &&
      !completed.includes(event.id),
  );
  const hash = (id: string) =>
    [...id].reduce((n, char) => ((n * 31) ^ char.charCodeAt(0)) >>> 0, (seed + day * 7919) >>> 0);
  available.sort(
    (a, b) =>
      Number(Boolean(b.requires || b.requiresChoice)) -
        Number(Boolean(a.requires || a.requiresChoice)) || hash(a.id) - hash(b.id),
  );
  return available.slice(0, 1 + Math.abs((seed + day) % 3));
}
export function hospitalityCost(venueId: string, guestCount: number, block: number): number {
  const venue = campaign().venues.find((v) => v.id === venueId);
  if (!venue) return 0;
  const coffee = block === 0 || block === 2;
  const price = coffee ? (venueId === "embassy" ? 5 : 15) : venue.cost;
  return price * (guestCount + 1);
}
export function socialTrust(npc: string, venueId: string, workAtDinner: boolean): number {
  const c = campaign().characters.find((x) => x.id === npc);
  const venue = campaign().venues.find((x) => x.id === venueId);
  if (!c || !venue) return 0;
  return (
    (c.likes.includes(venue.setting) ? 6 : c.dislikes.includes(venue.setting) ? -5 : 2) -
    (workAtDinner ? 10 : 0)
  );
}
export function delegationSucceeds(
  worker: string,
  task: VisitTask,
  colleagues: Record<string, ColleagueState>,
  pairs: Relationships,
  partner?: string,
  block = 0,
): boolean {
  const c = campaign().characters.find((x) => x.id === worker);
  const state = colleagues[worker];
  if (
    !c ||
    !state ||
    block === 3 ||
    c.location !== activeChapter().manifest.officeLocation ||
    state.trust < 25 ||
    state.fatigue >= 80
  )
    return false;
  if (!partner) return c.skills.includes(task);
  const teammate = campaign().characters.find(
    (person) =>
      person.id === partner && person.location === activeChapter().manifest.officeLocation,
  );
  const teammateState = colleagues[partner];
  if (
    partner === worker ||
    !teammate ||
    !teammateState ||
    teammateState.trust < 25 ||
    teammateState.fatigue >= 80 ||
    (pairs[pairKey(worker, partner)] ?? 50) < 25
  )
    return false;
  return c.skills.includes(task) || teammate.skills.includes(task);
}
