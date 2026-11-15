import type { Invitation } from "../calendar";
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

export interface ChapterEconomy {
  startFunds: number;
  visitReserves: Record<string, number>;
  supplement: { amount: number; goodwillCost: number; delay: number };
  reserveRelease: { amount: number; goodwillCost: number };
  lateFuel: { protectedFlag: string; cost: number };
}

export interface ChapterManifest {
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
  endings: Record<string, EndingText>;
  endingRules: EndingRule[];
  startMeters: Meters;
  startEnergy: number;
  startComposure: number;
  startTrust: number;
  startLocation: string;
  /** Where the staff work; delegation and baseline duties only apply there. */
  officeLocation: string;
  startRoom: string;
  startRelationships: { a: string; b: string; value: number }[];
  openingLog: string;
  economy: ChapterEconomy;
}

export interface CampaignCharacter {
  id: string;
  name: string;
  role: string;
  location: string;
  likes: string[];
  dislikes: string[];
  skills: string[];
  line: string;
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
}
