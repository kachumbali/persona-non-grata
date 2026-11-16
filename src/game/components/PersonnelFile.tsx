import { computeStats, TRAITS } from "../rules";
import { EARNED_QUIRKS, REPUTATIONS } from "../personnel";
import { useGame } from "../store";

export function PersonnelFile() {
  const g = useGame();
  const c = g.character;
  if (!c) return null;
  const stats = computeStats(c.traits, c.statDrift);
  return (
    <section aria-label="Personnel file" className="space-y-3 text-sm">
      <div>
        <strong>
          {c.title} {c.name}
        </strong>
        <p>{c.bio}</p>
      </div>
      <div>
        <h3 className="font-bold">Languages</h3>
        <p>
          {Object.entries(c.languages ?? { bellaluxian: 3 })
            .map(([id, level]) => `${id}: ${level}`)
            .join(", ")}
        </p>
      </div>
      <div>
        <h3 className="font-bold">Starting traits</h3>
        <p>
          {(c.startingTraits ?? g.personnel.start.traits)
            .map(
              (id) =>
                `${TRAITS.find((t) => t.id === id)?.name ?? id}${g.personnel.curedTraits.includes(id) ? (EARNED_QUIRKS.some((q) => g.personnel.earnedQuirks.includes(q.id) && q.replaces === id) ? " (replaced)" : " (cured)") : ""}`,
            )
            .join(", ") || "None"}
        </p>
      </div>
      <div>
        <h3 className="font-bold">Earned quirks</h3>
        <ul>
          {g.personnel.earnedQuirks.length ? (
            g.personnel.earnedQuirks.map((id) => (
              <li key={id}>{EARNED_QUIRKS.find((q) => q.id === id)?.name ?? id}</li>
            ))
          ) : (
            <li>None yet.</li>
          )}
        </ul>
      </div>
      <div>
        <h3 className="font-bold">Stats</h3>
        <ul>
          {Object.entries(stats).map(([id, value]) => (
            <li key={id}>
              {id}: {value}
              {g.personnel.drift[id as keyof typeof stats]
                ? ` (drift ${g.personnel.drift[id as keyof typeof stats]! > 0 ? "+" : ""}${g.personnel.drift[id as keyof typeof stats]})`
                : ""}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-bold">Active reputations</h3>
        <ul>
          {g.personnel.reputations.length ? (
            g.personnel.reputations.map((id) => {
              const r = REPUTATIONS.find((rep) => rep.id === id);
              return (
                <li key={id}>
                  <strong>{r?.name ?? id}</strong>: {r?.description}
                </li>
              );
            })
          ) : (
            <li>None yet.</li>
          )}
        </ul>
      </div>
      <div>
        <h3 className="font-bold">Personnel notes</h3>
        {g.storyFlags.includes("language-exam:fail") && (
          <p>Language examination: unsuccessful attempt; retake eligible.</p>
        )}
        {g.storyFlags.includes("language-exam:pass") && <p>Language examination: certified.</p>}
        <ul>
          {REPUTATIONS.filter(
            (r) =>
              !g.personnel.earnedReputations.includes(r.id) &&
              (g.personnel.counters[r.counter] ?? 0) > 0 &&
              (g.personnel.counters[r.counter] ?? 0) >= r.threshold - 2,
          ).map((r) => (
            <li key={r.id}>
              {r.description} ({g.personnel.counters[r.counter]}/{r.threshold})
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
