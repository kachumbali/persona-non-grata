import { activeChapter } from "../chapters";
import { pairKey, campaign } from "../rules";
import { npcTraits, relationshipState } from "../relationships";
import { useGame } from "../store";
import { Portrait } from "./Portrait";

/** The player's notebook contains only what they have discovered. */
export function WhoIsWho() {
  const g = useGame();
  const people = campaign().characters.filter((c) => g.metPeople.includes(c.id));
  return (
    <section aria-label="Who is who" className="space-y-4 text-sm">
      {!people.length && <p>You have not met anyone yet.</p>}
      {campaign()
        .locations.filter((l) => people.some((p) => p.location === l.id))
        .map((place) => (
          <section key={place.id}>
            <h3 className="font-bold text-lg">{place.name}</h3>
            <ul className="space-y-2">
              {people
                .filter((p) => p.location === place.id)
                .map((person) => {
                  const known = g.discoveredTraits[person.id] ?? [];
                  const ties = activeChapter().manifest.startRelationships.filter(
                    (r) => r.a === person.id || r.b === person.id,
                  );
                  return (
                    <li key={person.id} className="flex gap-3 border border-border bg-muted p-2">
                      <Portrait portrait={person.portrait} size={40} />
                      <div className="min-w-0">
                        <strong>{person.name}</strong>
                        {person.bio && <p className="italic">{person.bio}</p>}
                        <p>
                          {person.role} · {relationshipState(g.colleagues[person.id]?.trust ?? 50)}
                        </p>
                        <p>
                          Traits:{" "}
                          {person.traits
                            .map((id) =>
                              known.includes(id)
                                ? (npcTraits.find((t) => t.id === id)?.name ?? id)
                                : "?",
                            )
                            .join(", ")}
                        </p>
                        <p>Wants: {known.length === person.traits.length ? person.wants : "?"}</p>
                        <p>
                          Favours: owes you {g.favours.owedToYou[person.id] ?? 0} · you owe{" "}
                          {g.favours.youOwe[person.id] ?? 0}
                        </p>
                        <ul>
                          {ties.map((t) => {
                            const other = t.a === person.id ? t.b : t.a;
                            const key = pairKey(person.id, other);
                            const name =
                              campaign().characters.find((c) => c.id === other)?.name ?? other;
                            return (
                              <li key={key}>
                                {name}:{" "}
                                {g.knownRelationships.includes(key)
                                  ? `${relationshipState(g.relationships[key] ?? 50)}${t.tags?.length ? ` · ${t.tags.join(", ")}` : ""}`
                                  : "?"}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
    </section>
  );
}
