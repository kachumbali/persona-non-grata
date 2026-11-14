import type { ChoiceGate } from "./character";
import emailsData from "./data/emails.json";
import traitsData from "./data/traits.json";
import campaignData from "./data/campaign.json";

export type MeterKey = "confidence" | "goodwill" | "morale" | "sanity";
export type StatKey = "gravitas" | "charm" | "stamina" | "deniability" | "liver";
export type Action = "reply" | "delegate" | "forward" | "note" | "replyall" | "trait";
export type Meters = Record<MeterKey, number>;

export type VisitTask = "clearance" | "lounge" | "programme" | "security";
export type VisitStatus = Partial<Record<VisitTask, boolean>>;
export const VISIT_TASKS: Record<VisitTask, string> = {
  clearance: "Plane landing clearance",
  lounge: "VIP lounge reservation",
  programme: "Confirmed visit programme",
  security: "Security and transport",
};
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
export function visitReady(visit: VisitStatus): boolean {
  return (Object.keys(VISIT_TASKS) as VisitTask[]).every((key) => visit[key] === true);
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

export const EMAILS = emailsData as Email[];
export const TRAITS = traitsData as Trait[];

export const DAY_START = 8 * 60;
export const DAY_END = 18 * 60;
export const LAST_DAY = 15;
export const TRAIT_POINTS = 3;
export const ESCALATE_AFTER = 150; // game minutes before an unanswered email escalates
export const MINUTES_PER_SECOND = 6.5; // at 1x
export const START_METERS: Meters = { confidence: 55, goodwill: 50, morale: 50, sanity: 70 };

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

export type Ending = "png" | "replaced" | "cancelled" | "retired" | "ambassador" | "promoted";
export const ENDINGS: Record<Ending, { title: string; text: string }> = {
  png: {
    title: "Persona Non Grata",
    text: "Ombrazia declares you unwelcome, with compliments. Your farewell is a stamped form in an order nobody can document.",
  },
  replaced: {
    title: "Replaced by Capital",
    text: "HQ goodwill has reached zero. Capital recalls you and appoints a replacement. Please leave the office keys; your successor will need the same drawer of unsolved problems.",
  },
  cancelled: {
    title: "Ministerial Visit Cancelled",
    text: "Arrival day has come, but essential arrangements are still unconfirmed. The Minister cancels the visit. Capital describes this as a scheduling adjustment. Your career receives one too.",
  },
  retired: {
    title: "Quietly Retired to Brussels",
    text: "The Capital has lost confidence. You are given a window office overlooking another window.",
  },
  ambassador: {
    title: "The Ambassador Returns and Takes Credit",
    text: "Everything worked. The Ambassador reappears tanned, shakes the Minister's hand and thanks 'the team'.",
  },
  promoted: {
    title: "Promoted Sideways",
    text: "The Minister notices nothing, which is the highest compliment. You are promoted to a post with a longer title and the same desk.",
  },
};

/** Game over early if a meter hits zero; otherwise judged at the end of Day 15. */
export function pickEnding(m: Meters, finalDay: boolean, visit: VisitStatus = {}): Ending | null {
  if (m.goodwill <= 0) return "png";
  if (m.confidence <= 0) return "replaced";
  if (m.sanity <= 0) return "retired";
  if (!finalDay) return null;
  if (!visitReady(visit)) return "cancelled";
  if (m.confidence >= 65 && m.goodwill >= 50) return "promoted";
  return "ambassador";
}

export const CAMPAIGN = campaignData;
export const BLOCKS = [
  { name: "Morning", time: 8 * 60, social: "Coffee break I" },
  { name: "Midday", time: 12 * 60, social: "Lunch" },
  { name: "Afternoon", time: 15 * 60, social: "Coffee break II" },
  { name: "Evening", time: 19 * 60, social: "Dinner" },
] as const;
export interface ColleagueState {
  trust: number;
  fatigue: number;
}
export type Relationships = Record<string, number>;
export const pairKey = (a: string, b: string) => [a, b].sort().join(":");
export function initialColleagues(): Record<string, ColleagueState> {
  return Object.fromEntries(CAMPAIGN.characters.map((c) => [c.id, { trust: 50, fatigue: 0 }]));
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
): StoryEvent[] {
  return events.filter(
    (event) =>
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
  events: StoryEvent[] = CAMPAIGN.events as StoryEvent[],
): StoryEvent[] {
  return events.filter(
    (event) =>
      !!event.location &&
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
  const available = (CAMPAIGN.events as StoryEvent[]).filter(
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
  const venue = CAMPAIGN.venues.find((v) => v.id === venueId);
  if (!venue) return 0;
  const coffee = block === 0 || block === 2;
  const price = coffee ? (venueId === "embassy" ? 5 : 15) : venue.cost;
  return price * (guestCount + 1);
}
export function socialTrust(npc: string, venueId: string, workAtDinner: boolean): number {
  const c = CAMPAIGN.characters.find((x) => x.id === npc);
  const venue = CAMPAIGN.venues.find((x) => x.id === venueId);
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
  const c = CAMPAIGN.characters.find((x) => x.id === worker);
  const state = colleagues[worker];
  if (
    !c ||
    !state ||
    block === 3 ||
    c.location !== "embassy" ||
    state.trust < 25 ||
    state.fatigue >= 80
  )
    return false;
  if (!partner) return c.skills.includes(task);
  const teammate = CAMPAIGN.characters.find(
    (person) => person.id === partner && person.location === "embassy",
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
