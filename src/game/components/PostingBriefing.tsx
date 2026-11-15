import { activeChapter } from "../chapters";
import { lastDay } from "../rules";

export function PostingBriefing() {
  const briefing = activeChapter().postingBriefing;
  return (
    <article className="space-y-4 text-sm" aria-label="Posting briefing email">
      <div className="border-b border-border pb-3 font-mono text-xs">
        <p>From: {briefing.from}</p>
        <p>Subject: {briefing.subject}</p>
        <p>Received: Day 1 · Morning</p>
      </div>
      <p>{briefing.intro}</p>
      <p className="font-bold">
        The {activeChapter().manifest.missionActor} arrives on Day {lastDay()}.
      </p>
      {briefing.sections.map((section) => (
        <section key={section.title}>
          <h3 className="mb-1 font-bold">{section.title}</h3>
          <p>{section.text}</p>
        </section>
      ))}
      <p className="border-t border-border pt-3 text-muted-foreground">
        Personnel Directorate — wishing you every success, from a safe distance.
      </p>
    </article>
  );
}
