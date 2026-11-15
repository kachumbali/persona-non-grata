import type { Invitation } from "../calendar";
import type { Topic } from "../dialogues";
import type { Action, Email } from "../rules";
import type {
  Campaign,
  ChapterManifest,
  ChapterPack,
  ConversationPayoff,
  EmbassyData,
  PostingBriefingData,
  PressData,
} from "./types";
import campaign from "./port-hesperia-2006/campaign.json";
import chapter from "./port-hesperia-2006/chapter.json";
import conversationPayoffs from "./port-hesperia-2006/conversation-payoffs.json";
import dialogues from "./port-hesperia-2006/dialogues.json";
import embassy from "./port-hesperia-2006/embassy.json";
import emails from "./port-hesperia-2006/emails.json";
import euRepresentation from "./port-hesperia-2006/eu-representation.json";
import invitations from "./port-hesperia-2006/invitations.json";
import mailChoices from "./port-hesperia-2006/mail-choices.json";
import postingBriefing from "./port-hesperia-2006/posting-briefing.json";
import press from "./port-hesperia-2006/press.json";
import staffDuties from "./port-hesperia-2006/staff-duties.json";

export type * from "./types";

export const DEFAULT_CHAPTER_ID = "port-hesperia-2006";

export const portHesperia2006: ChapterPack = {
  manifest: chapter as unknown as ChapterManifest,
  campaign: campaign as unknown as Campaign,
  dialogues: dialogues as unknown as Record<string, Topic[]>,
  emails: emails as unknown as Email[],
  invitations: invitations as unknown as Invitation[],
  press: press as unknown as PressData,
  postingBriefing: postingBriefing as PostingBriefingData,
  conversationPayoffs: conversationPayoffs as unknown as ConversationPayoff[],
  staffDuties: staffDuties as Record<string, string>,
  embassy: embassy as EmbassyData,
  euRepresentation: euRepresentation as Record<string, string>,
  mailChoices: mailChoices as Record<string, Partial<Record<Action, string>>>,
};

const registry = new Map<string, ChapterPack>([[portHesperia2006.manifest.id, portHesperia2006]]);
let activeId = DEFAULT_CHAPTER_ID;

/** Make a chapter available by id (tests register fixtures; later chapters register here). */
export function registerChapter(pack: ChapterPack): void {
  registry.set(pack.manifest.id, pack);
}
export function listChapters(): ChapterPack[] {
  return [...registry.values()];
}
export function getChapter(id: string): ChapterPack {
  const pack = registry.get(id);
  if (!pack) throw new Error(`Unknown chapter: ${id}`);
  return pack;
}
export function activeChapter(): ChapterPack {
  return getChapter(activeId);
}
export function activeChapterId(): string {
  return activeId;
}
export function setActiveChapter(id: string): void {
  getChapter(id);
  activeId = id;
}
