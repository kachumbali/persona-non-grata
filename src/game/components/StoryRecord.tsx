import { CAMPAIGN, locationStories, type StoryEvent, type StoryOutcome } from "../rules";

/** Report only recorded decisions, without inventing outcomes for older saves. */
export function StoryRecord({ outcomes, completed, day }: { outcomes: Record<string, StoryOutcome>; completed: string[]; day: number }) {
  const entries = (CAMPAIGN.events as StoryEvent[]).flatMap((event) => {
    const outcome = outcomes[event.id];
    if (!outcome) return [];
    const choice = event.choices.find((item) => item.id === outcome.choice);
    const response = outcome.status === "missed" ? "No response" : choice?.label ?? "Responded";
    return [{ event, response }];
  });
  const openLeads = locationStories(day, completed, outcomes);
  if (!entries.length && !openLeads.length) return null;
  return <details className="mt-5 border-t border-border pt-4 text-left" aria-label="Side-story record">
    <summary className="cursor-pointer text-lg font-bold">Side stories · {entries.length} recorded</summary>
    <ul className="mt-2 space-y-2 text-sm">{entries.map(({ event, response }) => <li key={event.id}><strong>{event.title}</strong> — {response}</li>)}{openLeads.map((event) => <li key={`open-${event.id}`}><strong>{event.title}</strong> — Left open at the end of the posting</li>)}</ul>
  </details>;
}
