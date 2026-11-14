import invitationsData from "./data/invitations.json";
import type { Effects, StoryOutcome } from "./rules";

export type InvitationResponse = "attend" | "delegate" | "decline";
export interface InvitationChoice { label: string; text: string; effects: Effects; timeCost: number; cashCost: number; contactTrust?: number }
export interface Invitation {
  id: string; title: string; host: string; contact?: string; location: string; announceDay: number; day: number; block: number;
  description: string; choices: Record<InvitationResponse, InvitationChoice>; onMiss: { text: string; effects: Effects; contactTrust?: number };
}
export const INVITATIONS = invitationsData as Invitation[];
export function visibleInvitations(day: number, block: number, outcomes: Record<string, StoryOutcome>, invitations: Invitation[] = INVITATIONS): Invitation[] {
  return invitations.filter((invitation) => invitation.announceDay <= day && (invitation.day > day || (invitation.day === day && invitation.block >= block)) && !outcomes[invitation.id]);
}
export function dueInvitations(day: number, block: number, outcomes: Record<string, StoryOutcome>, invitations: Invitation[] = INVITATIONS): Invitation[] {
  return invitations.filter((invitation) => invitation.day === day && invitation.block === block && !outcomes[invitation.id]);
}
