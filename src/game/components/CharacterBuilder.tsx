import { useState } from "react";
import { Button } from "@/components/ui/button";
import bg from "../data/backgrounds.json";
import { computeStats, pointsLeft, TRAITS, TRAIT_POINTS } from "../rules";
import { useGame } from "../store";
import { playerCapacity } from "../economy";
import { Portrait } from "./Portrait";

const TITLES = ["Mr", "Ms", "Mx", "Dr", "His Excellency (pending)", "Her Excellency (pending)"];
const STAT_LABELS = {
  gravitas: "Gravitas",
  charm: "Charm",
  stamina: "Bureaucratic Stamina",
  deniability: "Plausible Deniability",
  liver: "Liver",
} as const;
const rand = (n: number) => Math.floor(Math.random() * n);

export function CharacterBuilder() {
  const start = useGame((s) => s.start);
  const [title, setTitle] = useState<string>("Mr");
  const [name, setName] = useState("");
  const [face, setFace] = useState(0);
  const [slots, setSlots] = useState<[number, number, number]>([0, 0, 0]);
  const [traits, setTraits] = useState<string[]>([]);
  const left = pointsLeft(traits);
  const stats = computeStats(traits);
  const bio = `${bg.origin[slots[0]]}, ${bg.misstep[slots[1]]}. ${bg.reason[slots[2]]}`;
  const toggle = (id: string) =>
    setTraits((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  const hasFlaw = traits.some((id) => (TRAITS.find((t) => t.id === id)?.cost ?? 0) < 0);
  const canStart = name.trim().length > 0 && left >= 0 && hasFlaw && traits.length <= 4;

  return (
    <main className="mx-auto retro-desktop px-3 py-6 sm:px-6">
      <header className="mb-5 text-center">
        <p className="font-mono text-lg uppercase text-primary-foreground">
          Republic of Bellaluxe · Ministry of Foreign Affairs · Form PNG-1
        </p>
        <h1 className="game-logo mt-1">Persona Non Grata</h1>
        <p className="mt-1 font-mono text-2xl text-primary-foreground">
          Chapter 1 · The Minister’s Visit
        </p>
        <p className="mt-2 text-sm text-primary-foreground">
          Personnel file of the incoming Chargé d'Affaires <i>ad interim</i>, Embassy in Port
          Hesperia
        </p>
      </header>

      <div className="retro-builder">
        <div className="retro-titlebar">Personnel Department · New posting</div>
        <div className="retro-builder-body">
          <section className="paper p-5">
            <h2 className="retro-section-heading mb-4 font-bold">1. Identity</h2>
            <div className="identity-fields gap-2">
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded border border-input bg-background px-2 py-2 text-sm"
              >
                {TITLES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Surname"
                maxLength={30}
                className="flex-1 rounded border border-input bg-background px-3 py-2 font-mono text-sm"
              />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }, (_, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  aria-label={`Select portrait ${i + 1}`}
                  aria-pressed={face === i}
                  onClick={() => setFace(i)}
                  className="portrait-choice"
                >
                  <Portrait face={i} size={96} />
                </Button>
              ))}
            </div>

            <h2 className="retro-section-heading mb-3 mt-6 font-bold">2. Background</h2>
            {(["origin", "misstep", "reason"] as const).map((k, i) => (
              <select
                key={k}
                value={slots[i]}
                onChange={(e) =>
                  setSlots(
                    (s) =>
                      s.map((v, j) => (j === i ? +e.target.value : v)) as [number, number, number],
                  )
                }
                className="mb-2 w-full rounded border border-input bg-background px-2 py-2 text-sm"
              >
                {bg[k].map((o, j) => (
                  <option key={j} value={j}>
                    {o}
                  </option>
                ))}
              </select>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSlots([rand(8), rand(8), rand(8)])}
            >
              Randomise
            </Button>
            <p className="mt-3 border-l-2 border-accent pl-3 font-serif text-sm italic">{bio}</p>
          </section>

          <section className="paper p-5">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="retro-section-heading font-bold">3. Traits</h2>
              <span
                className={`font-mono text-sm ${left < 0 ? "text-destructive" : "text-muted-foreground"}`}
              >
                {left} / {TRAIT_POINTS} points left
              </span>
            </div>
            <div className="space-y-1.5">
              {TRAITS.map((t) => {
                const on = traits.includes(t.id);
                return (
                  <Button
                    key={t.id}
                    variant="ghost"
                    aria-pressed={on}
                    onClick={() => toggle(t.id)}
                    disabled={!on && traits.length >= 4}
                    className="retro-trait w-full gap-3 px-3 py-2 text-sm"
                  >
                    <span
                      className={`mt-0.5 w-7 shrink-0 font-mono text-xs ${t.cost > 0 ? "text-primary" : t.cost < 0 ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {t.cost > 0 ? `−${t.cost}` : t.cost < 0 ? `+${-t.cost}` : "0"}
                    </span>
                    <span>
                      <b>{t.name}</b> <span className="text-muted-foreground">— {t.desc}</span>
                      <span className="block text-xs text-muted-foreground">{t.plays}</span>
                    </span>
                  </Button>
                );
              })}
            </div>
            <h2 className="retro-section-heading mb-2 mt-5 font-bold">Stats</h2>
            <p className="mb-2 text-sm">
              Starting DP per block: {playerCapacity({ traits }, 80, 75, 0).total}. Stamina changes
              your base capacity; energy, composure and alcohol can reduce it during the posting.
            </p>
            <dl className="stats-grid grid gap-x-4 gap-y-1 font-mono">
              {(Object.keys(STAT_LABELS) as (keyof typeof STAT_LABELS)[]).map((k) => (
                <div key={k} className="flex justify-between">
                  <dt>{STAT_LABELS[k]}</dt>
                  <dd>
                    {"■".repeat(stats[k])}
                    <span className="text-muted-foreground">
                      {"□".repeat(Math.max(0, 6 - stats[k]))}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <div className="retro-status flex flex-wrap items-center justify-between gap-3">
          <Button
            size="lg"
            disabled={!canStart}
            onClick={() => start({ title, name: name.trim(), face, bio, traits })}
          >
            Accept posting · 15 working days
          </Button>
          {!canStart && (
            <p className="mt-2 text-xs text-muted-foreground">
              {!name.trim()
                ? "The form requires a surname."
                : !hasFlaw
                  ? "Choose at least one flaw; you may take up to four traits."
                  : left < 0
                    ? "Too many advantages for your points."
                    : "Choose no more than four traits."}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
