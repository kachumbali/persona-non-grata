/** What is waiting for the player, per device. Pure: components only render it. */
import type { ChapterPack } from "./chapters";
import { dueInvitations, type Invitation } from "./calendar";
import { inFirstDayGrace, isFax, neverIgnored } from "./rules";
import { inboxFor, type GameState } from "./store";

export type Device = "fax" | "pc" | "blackberry";
export const DEVICES: Device[] = ["fax", "pc", "blackberry"];

export interface WaitingMail {
  id: string;
  subject: string;
  from: string;
  device: Device;
}
export interface DeviceWaiting {
  /** Will be marked ignored, and cost something, if still unanswered when this block ends. */
  urgent: WaitingMail[];
  /** Arrived and unanswered, but costs nothing yet (the first-day grace period). */
  unread: WaitingMail[];
}
export interface Waiting extends Record<Device, DeviceWaiting> {
  /** Invitations that fall due in this very block and have not been answered. */
  invitations: Invitation[];
}

/** Which device a piece of mail is read on: Capital's by sender on the fax, the rest on the PC or the phone. */
export function deviceFor(from: string, location: string, office: string): Device {
  return isFax(from) ? "fax" : location === office ? "pc" : "blackberry";
}

type WaitingInput = Pick<
  GameState,
  | "day"
  | "block"
  | "minute"
  | "handled"
  | "demarches"
  | "personnel"
  | "tutorHomework"
  | "pending"
  | "location"
  | "storyOutcomes"
>;

export function waitingItems(g: WaitingInput, chapter: ChapterPack): Waiting {
  const result: Waiting = {
    fax: { urgent: [], unread: [] },
    pc: { urgent: [], unread: [] },
    blackberry: { urgent: [], unread: [] },
    invitations: dueInvitations(g.day, g.block, g.storyOutcomes, chapter.invitations).filter(
      (i) => !g.pending.some((p) => p.eventId === i.id),
    ),
  };
  const office = chapter.manifest.officeLocation;
  for (const mail of inboxFor(
    g.day,
    g.minute,
    g.handled,
    g.demarches,
    g.personnel.notices,
    g.tutorHomework,
  )) {
    // Answered, escalated and report entries carry a status; démarche notices live on their own board.
    if (mail.status || neverIgnored(mail)) continue;
    if (g.pending.some((p) => p.emailId === mail.id)) continue;
    const device = deviceFor(mail.from, g.location, office);
    const entry = { id: mail.id, subject: mail.subject, from: mail.from, device };
    if (inFirstDayGrace(mail, g.day, g.block)) result[device].unread.push(entry);
    else result[device].urgent.push(entry);
  }
  return result;
}

const NOUN: Record<Device, [string, string]> = {
  fax: ["fax", "faxes"],
  pc: ["mail", "mails"],
  blackberry: ["mail", "mails"],
};
export const countNoun = (device: Device, n: number) => `${n} ${NOUN[device][n === 1 ? 0 : 1]}`;

/** The accessible label of a badge, for example "2 faxes waiting, answer this block". */
export function badgeLabel(device: Device, urgent: number, unread: number): string {
  if (urgent > 0)
    return `${countNoun(device, urgent)} waiting, answer ${urgent === 1 ? "it" : "them"} this block`;
  if (unread > 0) return `${countNoun(device, unread)} waiting, no penalty yet`;
  return "";
}

/** One short line: what arrived and is waiting. Empty when nothing is. */
export interface ArrivalPart {
  key: "fax" | "pc" | "blackberry" | "invitation";
  text: string;
  /** Faxes can only be read at the embassy; when elsewhere the part says so and is not a link. */
  readable: boolean;
}
export function arrivalParts(w: Waiting, atEmbassy: boolean): ArrivalPart[] {
  const parts: ArrivalPart[] = [];
  const total = (d: Device) => w[d].urgent.length + w[d].unread.length;
  if (total("fax"))
    parts.push({
      key: "fax",
      text: atEmbassy
        ? `${countNoun("fax", total("fax"))} from Capital`
        : `${countNoun("fax", total("fax"))} from Capital (the fax can only be read at the embassy)`,
      readable: atEmbassy,
    });
  if (total("pc"))
    parts.push({ key: "pc", text: `${countNoun("pc", total("pc"))} on the PC`, readable: true });
  if (total("blackberry"))
    parts.push({
      key: "blackberry",
      text: `${countNoun("blackberry", total("blackberry"))} on the BlockBerry`,
      readable: true,
    });
  if (w.invitations.length)
    parts.push({
      key: "invitation",
      text: `${w.invitations.length} ${w.invitations.length === 1 ? "invitation" : "invitations"} today`,
      readable: true,
    });
  return parts;
}

/** Everything the end-of-block confirmation must list: urgent mail grouped by device. */
export function ignoredAtBlockEnd(w: Waiting): { device: Device; items: WaitingMail[] }[] {
  return DEVICES.filter((d) => w[d].urgent.length).map((device) => ({
    device,
    items: w[device].urgent,
  }));
}
