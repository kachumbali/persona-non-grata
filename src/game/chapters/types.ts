import type { Invitation } from "../calendar";
import type { ChoiceGate } from "../character";
import type { Topic } from "../dialogues";
import type { Clipping } from "../press";
import type { Action, Effects, Email, MeterKey, Meters, StoryChoice, StoryEvent } from "../rules";

export interface BlockDef {
  name: string;
  /** Start of the block, in minutes after midnight. */
  time: number;
  /** What a social outing in this block is called (Lunch, Dinner, …). */
  social: string;
}

export interface EndingText {
  title: string;
  text: string;
}

/**
 * One ending rule. Rules are checked in order and the first match wins.
 * Every condition present must hold. A rule with `finalDay` is only checked on the last day.
 * A rule with no conditions always matches (use it as the final fallback).
 */
export interface EndingRule {
  ending: string;
  finalDay?: boolean;
  /** Matches when every listed meter is at or below its value. */
  meterAtMost?: Partial<Record<MeterKey, number>>;
  /** Matches when every listed meter is at or above its value. */
  meterAtLeast?: Partial<Record<MeterKey, number>>;
  /** Matches when any mission task is unconfirmed. */
  missionIncomplete?: boolean;
}

/** A reference to one step of one mission task. */
export interface StepRef {
  task: string;
  step: string;
}

export interface RouteBase extends ChoiceGate {
  id: string;
  label: string;
  dp: number;
  days: number;
  counts?: string[];
  statDrift?: { stat: import("../rules").StatKey; delta: number };
}

export interface MissionRoute extends RouteBase {
  kind: "official" | "favour" | "money" | "eu" | "knowledge";
  cash: number;
  fromGeneralFunds?: boolean;
  effects?: Partial<Record<"confidence" | "goodwill" | "morale" | "sanity", number>>;
  requires?: {
    trust?: { character: string; min: number };
    trustOrFavour?: { character: string; min: number };
    favour?: string;
    fact?: string;
    flag?: string;
    outcome?: { story: string; outcome: string };
    expiresDay?: number;
    expiresOnFlag?: string;
    expiresOnFlags?: string[];
  };
  quality: "good" | "adequate";
  consequences?: {
    oweFavour?: string;
    flag?: string;
    trust?: Record<string, number>;
    delayed?: { day: number; flag?: string; trust?: Record<string, number> };
  };
  result: string;
}

export interface DemarcheRoute extends RouteBase {
  kind: "self" | "colleague" | "eu" | "note";
}

export interface Demarche {
  id: string;
  subject: string;
  instruction: string;
  issuedDay: number;
  issuedBlock: number;
  issuedMinute?: number;
  deadlineDay: number;
  deadlineBlock: number;
  level: "desk" | "director" | "deputy-minister";
  recipient: string;
  talkingPoints: string[];
  routes: DemarcheRoute[];
  report: { good: string; adequate: string; failed: string };
  fact?: string;
  absurd?: boolean;
  conflictsWith?: string;
  supersededBy?: { day: number; block: number; demarcheId: string };
  traitOptions?: { id: string; label: string; requiresTrait: string; result: string }[];
  gossipOptions?: { id: string; label: string; requiresFact: string; result: string }[];
}

export interface DemarchePack {
  instructions: Demarche[];
  colleagueLines: Record<string, string>;
  colleagueLevels: Record<string, "desk" | "director" | "deputy-minister">;
  unrequested: { id: string; text: string; effects: Effects }[];
}

/**
 * One step of a mission task. The steps of a task are done in order (a step needs the one before
 * it); the task is confirmed when its last step is done. Every step can be done by the player in
 * person (`dp`), by a colleague who has the skill (`skill`, default the task id) or, where a mail
 * carries `confirmsStep`, by answering that mail.
 */
export interface MissionStep {
  id: string;
  /** What the step is, as shown on the dashboard and in the diary. */
  label: string;
  /** A short noun for "needs the ..." messages on other steps. */
  short: string;
  earliestDay: number;
  /** Diplomatic Points the player spends doing it in person (default 2). */
  dp?: number;
  /** Skill a colleague needs to do it for the player (default: the task id). */
  skill?: string;
  /** Cash drawn from the ring-fenced mission reserve when the step is done. */
  cash?: number;
  requiresStep?: StepRef;
  /** In person only: the player needs this much trust with the character. */
  requiresTrust?: { character: string; min: number };
  gatekeeper?: string;
  routes?: MissionRoute[];
  /** Result text, recorded when the step is done. */
  result: string;
}

/** What a setback does to one step. A done step is reopened; a pending one only changes. */
export interface SetbackTarget extends StepRef {
  /** New label from the day the setback lands (also for a reopened step). */
  label?: string;
  /** Extra cash for a step that cannot have been done yet (earliestDay after the setback). */
  cashDelta?: number;
}

/** A scripted setback: on `day` Capital or the host changes the arrangements. */
export interface Setback {
  id: string;
  day: number;
  /** Id of the mail that explains it (arrives on `day`). */
  mail: string;
  /** Line for the situation report and log when it lands. */
  text: string;
  targets: SetbackTarget[];
}

export interface ChapterEconomy {
  startFunds: number;
  visitReserves: Record<string, number>;
  supplement: { amount: number; goodwillCost: number; delay: number };
  reserveRelease: { amount: number; goodwillCost: number };
  lateFuel: { protectedFlag: string; cost: number };
}

/**
 * A chapter-wide first-day rule: mail whose sender starts with `from` that arrived on `day` is not
 * marked ignored until the block `untilBlock` (0-based) has ended. Also the first ignored mail of a
 * posting costs half.
 */
export interface FirstDayGrace {
  from: string;
  day: number;
  untilBlock: number;
}

export interface ChapterManifest {
  firstDayGrace?: FirstDayGrace;
  hostLanguage?: {
    id: string;
    name: string;
    description: string;
    mistranslations?: string[];
    formalSlang?: string[];
    homework?: {
      from: string;
      subject: string;
      body: string;
      reply: string;
      ignore: string;
      quit: string;
    };
    exam?: {
      day: number;
      block: number;
      examiner: string;
      examinerId?: string;
      portrait?: string;
      traits?: string[];
      lines?: { pass: string; narrow: string; fail: string; spectacular: string };
      questions: { id: string; prompt: string; answers: { text: string; correct: boolean }[] }[];
    };
    teachers?: { id: string; name: string; character?: string; points: number; fee: number }[];
  };
  id: string;
  /** Player-facing short name, e.g. "Chapter 1". */
  label: string;
  title: string;
  year: number;
  era: string;
  city: string;
  post: string;
  playerRank: string;
  /** Who arrives on the last day (shown as "Minister in N days"). */
  missionActor: string;
  days: number;
  blocks: [BlockDef, ...BlockDef[]];
  missionTasks: Record<string, string>;
  missionQualityTexts?: Record<string, { good: string; adequate: string }>;
  adequateArrivalConfidence?: number;
  /** Ordered steps for each mission task. */
  missionSteps: Record<string, MissionStep[]>;
  setbacks: Setback[];
  endings: Record<string, EndingText>;
  debrief?: {
    epithets: {
      id: string;
      text: string;
      trait?: string;
      counter?: string;
      threshold?: number;
      flag?: string;
      outcome?: { event: string; choice: string };
    }[];
    variants: Record<string, { trait?: string; reputation?: string; text: string }[]>;
    board: Record<string, { good: string; mixed: string; bad: string }>;
    payslip: {
      base: number;
      acting: number;
      hardship: number;
      drinkDeduction: number;
      moneyRouteDeduction: number;
      advance?: number;
      languageAllowance?: number;
    };
  };
  endingRules: EndingRule[];
  startMeters: Meters;
  startEnergy: number;
  startComposure: number;
  startTrust: number;
  startLocation: string;
  /** Where the staff work; delegation and baseline duties only apply there. */
  officeLocation: string;
  startRoom: string;
  startRelationships: { a: string; b: string; value: number; tags?: string[] }[];
  openingLog: string;
  economy: ChapterEconomy;
}

export interface CampaignCharacter {
  id: string;
  name: string;
  role: string;
  age?: number;
  location: string;
  likes: string[];
  dislikes: string[];
  skills: string[];
  line: string;
  refusalGreeting?: string;
  traits: string[];
  wants: string;
  gender: string;
  portrait: string;
}
export interface CampaignVenue {
  id: string;
  name: string;
  setting: string;
  cost: number;
  description: string;
}
export interface CampaignLocation {
  id: string;
  name: string;
  description: string;
  work: string;
  effects: Effects;
  cost: number;
}
export interface Campaign {
  characters: CampaignCharacter[];
  venues: CampaignVenue[];
  locations: CampaignLocation[];
  dialogue: Record<string, { text: string; choices: StoryChoice[] }>;
  events: StoryEvent[];
  gossip?: GossipItem[];
}
export interface GossipItem {
  id: string;
  text: string;
  subject: string;
  knowers: string[];
  sensitivity: number;
  truth: "true" | "false" | "half-true";
  day: number;
  source: "conversation" | "press" | "reception" | "overheard";
  requiresLanguage?: { language: string; min: number };
  garbled?: string;
}
export interface PressData {
  outlets: { id: string; name: string; voice: string }[];
  clippings: Clipping[];
  scenario: Record<string, string[]>;
}
export interface PostingBriefingData {
  from: string;
  subject: string;
  intro: string;
  sections: { title: string; text: string }[];
}
export interface ConversationPayoff {
  source: string;
  flag: string;
  text: string;
  effects: Effects;
}
export interface EmbassyRoom {
  id: string;
  name: string;
  x: number;
  z: number;
  floor: string;
  kind: string;
  note: string;
}
export interface EmbassyStaff {
  id: string;
  name: string;
  role: string;
  room: string;
  face: number;
  x: number;
  z: number;
  animal?: string;
}
export interface EmbassyData {
  rooms: EmbassyRoom[];
  staff: EmbassyStaff[];
}

export interface ChapterPack {
  manifest: ChapterManifest;
  campaign: Campaign;
  dialogues: Record<string, Topic[]>;
  emails: Email[];
  invitations: Invitation[];
  press: PressData;
  postingBriefing: PostingBriefingData;
  conversationPayoffs: ConversationPayoff[];
  staffDuties: Record<string, string>;
  embassy: EmbassyData;
  euRepresentation: Record<string, string>;
  mailChoices: Record<string, Partial<Record<Action, string>>>;
  demarches: DemarchePack;
}
