import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BLOCKS, ENDINGS, LAST_DAY } from "../rules";
import { useGame } from "../store";
import { Portrait } from "./Portrait";
import { CityMap } from "./CityMap";
import { PlaceScene } from "./PlaceScene";
import { TurnBar } from "./TurnBar";

export function GameScreen() {
  const g = useGame();
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
          {g.goodwillHistory.at(-1) && <p className="mt-3 text-sm">Last outcome: {g.goodwillHistory.at(-1)?.text}</p>}
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
        <div className="clock text-right font-mono">
          <div className="text-2xl">{BLOCKS[g.block]?.name}</div>
          <div className="text-xs text-muted-foreground">Day {g.day} / {LAST_DAY} · Minister in {LAST_DAY - g.day} days</div>
        </div>
      </header>

      {view === "city" ? <CityMap onEnter={() => setView("place")} /> : <PlaceScene onLeave={() => setView("city")} />}
      <TurnBar />
    </main>
  );
}
