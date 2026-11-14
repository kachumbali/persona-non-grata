import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BLOCKS, ENDINGS, LAST_DAY, VISIT_TASKS, type VisitTask } from "../rules";

import { useGame } from "../store";
import { Portrait } from "./Portrait";
import { CityMap } from "./CityMap";
import { PlaceScene } from "./PlaceScene";
import { BlackBerry } from "./BlackBerry";
import { Interruption } from "./Interruption";

export function GameScreen({ onMenu }: { onMenu?: () => void }) {
  const g = useGame();
  const [briefingOpen, setBriefingOpen] = useState(g.day === 1 && g.block === 0);
  const [view, setView] = useState<"city" | "place">("city");
  const c = g.character;
  if (!c) return null;

  if (g.ending) {
    const end = ENDINGS[g.ending];
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="paper p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Persona Non Grata — Chapter 1 · Final cable · Day {g.day}</p>
          <Portrait face={c.face} size={96} />
          <h1 className="mt-6 text-3xl text-destructive">{end.title}</h1>
          <p className="mt-6 font-serif">{c.title} {c.name}: {end.text}</p>
          <p className="mt-4 font-mono">HQ goodwill: {g.meters.confidence} · Host goodwill: {g.meters.goodwill}</p>
          {g.goodwillHistory.filter((entry) => entry.source === "The Minister’s menu").map((entry, i) => <p key={i} className="mt-4 font-serif">{entry.text}</p>)}
          {g.goodwillHistory.at(-1) && g.goodwillHistory.at(-1)?.source !== "The Minister’s menu" && <p className="mt-3 text-sm">Last outcome: {g.goodwillHistory.at(-1)?.text}</p>}
          <Button className="mt-8" onClick={g.reset}>Request a new posting</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl retro-game px-3 py-4 sm:px-5">
      <header className="paper mb-4 flex flex-wrap items-center gap-4 px-4 py-3">
        <Portrait face={c.face} size={48} />
        <div className="mr-auto min-w-0 flex-1 basis-[240px]">
          <h1 className="text-xl font-bold leading-tight">Persona Non Grata — Chapter 1</h1>
          <p className="text-sm">{c.title} {c.name} · Acting Head of Mission</p>
          <p className="text-xs text-muted-foreground">Chargé d'Affaires a.i. · Embassy of Bellaluxe, Port Hesperia</p>
        </div>
        {onMenu && <Button variant="outline" className="retro-button" onClick={onMenu}>Menu</Button>}
        <div className="clock text-right font-mono">
          <div className="text-2xl">{BLOCKS[g.block]?.name}</div>
          <div className="text-xs text-muted-foreground">Day {g.day} / {LAST_DAY} · Minister in {LAST_DAY - g.day} days</div>
        </div>
      </header>

      {briefingOpen && <section className="paper mb-4 p-4" aria-label="Welcome briefing">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div><h2 className="text-lg font-bold">Welcome to your posting</h2><p className="text-sm">The Ambassador is away. The Minister arrives on Day {LAST_DAY}. Capital assures you this is an opportunity.</p></div>
          <Button variant="outline" size="sm" onClick={() => setBriefingOpen(false)}>Dismiss briefing</Button>
        </div>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm">
          <li>Enter the embassy on the map. Check the secure fax for Capital and the PC for other mail.</li>
          <li>Plan your work: the base is 4 Diplo-Points (DP) per block. Stamina, low energy, composure and drinking can change this; travel and mail decisions cost 1 DP each.</li>
          <li>End the block to resolve your plans. Unanswered instructions may be missed. Confirm all four visit arrangements before arrival.</li>
        </ol>
      </section>}
      <details className="paper mb-4 p-3">
        <summary className="cursor-pointer font-bold">Ministerial visit · {Object.keys(VISIT_TASKS).filter((key) => g.visit[key as VisitTask]).length}/{Object.keys(VISIT_TASKS).length} confirmed · Day {LAST_DAY} arrival</summary>
        <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">{(Object.entries(VISIT_TASKS) as [VisitTask, string][]).map(([key, label]) => <li key={key}>{g.visit[key] ? "✓" : "○"} {label} — {g.visit[key] ? "confirmed" : "unconfirmed"}</li>)}</ul>
        <p className="mt-2 text-xs text-muted-foreground">Watch your mail and secure fax for arrangements. Mission Watch on the embassy PC has the full record.</p>
      </details>
      {view === "city" ? <CityMap onEnter={() => setView("place")} /> : <PlaceScene onLeave={() => setView("city")} />}
      <BlackBerry />
      {!briefingOpen && <Interruption />}
    </main>
  );
}
