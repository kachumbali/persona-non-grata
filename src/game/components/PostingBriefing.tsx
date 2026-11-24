import { activeChapter } from "../chapters";
import { lastDay } from "../rules";
import { useGame } from "../store";
import { textVariant } from "../text-variants";

export function PostingBriefing() {
  const briefing = activeChapter().postingBriefing;
  const seed = useGame((state) => state.seed);
  return (
    <article className="space-y-4 text-sm" aria-label="Posting briefing email">
      <div className="border-b border-border pb-3 font-mono text-xs">
        <p>From: {briefing.from}</p>
        <p>Subject: {briefing.subject}</p>
        <p>Received: Day 1 · Morning</p>
      </div>
      <p>{textVariant(briefing.intro, briefing.introVariants, seed, "posting-briefing:intro")}</p>
      <p className="font-bold">
        The {activeChapter().manifest.missionActor} arrives on Day {lastDay()}.
      </p>
      {briefing.sections.map((section) => (
        <section key={section.title}>
          <h3 className="mb-1 font-bold">{section.title}</h3>
          <p>
            {textVariant(section.text, section.variants, seed, `posting-briefing:${section.title}`)}
          </p>
        </section>
      ))}
      <p className="border-t border-border pt-3 text-muted-foreground">
        Personnel Directorate — wishing you every success, from a safe distance.
      </p>
    </article>
  );
}
