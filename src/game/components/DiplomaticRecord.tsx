import { INVITATIONS } from "../calendar";
import type { StoryOutcome } from "../rules";

/** Summarise only invitations for which the posting recorded an outcome. */
export function DiplomaticRecord({ outcomes }: { outcomes: Record<string, StoryOutcome> }) {
  const entries = INVITATIONS.flatMap((invitation) => {
    const outcome = outcomes[invitation.id];
    if (!outcome) return [];
    const response = outcome.status === "missed" ? "No response" : outcome.choice === "attend" ? "Attended" : outcome.choice === "delegate" ? "Sent a colleague" : outcome.choice === "decline" ? "Declined" : "Responded";
    return [{ invitation, response }];
  });
  if (!entries.length) return null;
  return <section className="mt-5 border-t border-border pt-4 text-left" aria-label="Diplomatic calendar record">
    <h2 className="text-lg font-bold">Diplomatic calendar</h2>
    <ul className="mt-2 space-y-1 text-sm">{entries.map(({ invitation, response }) => <li key={invitation.id}><strong>Day {invitation.day} · {invitation.title}</strong> — {response}</li>)}</ul>
  </section>;
}
