import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ACTION_LABELS, ENDINGS, formatClock, LAST_DAY, MINUTES_PER_SECOND, type Action, type MeterKey } from "../rules";
import { inboxFor, useGame } from "../store";
import { Portrait } from "./Portrait";
import { EmbassyScene } from "../scene/EmbassyScene";

const METERS: { key: MeterKey; label: string }[] = [
  { key: "budget", label: "Budget" }, { key: "confidence", label: "Capital's Confidence" }, { key: "goodwill", label: "Host Goodwill" },
  { key: "morale", label: "Team Morale" }, { key: "sanity", label: "Sanity" },
];

export function GameScreen() {
  const g = useGame();
  const [openId, setOpenId] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => useGame.getState().tick((MINUTES_PER_SECOND * useGame.getState().speed) / 4), 250);
    const key = (e: KeyboardEvent) => { if (e.code === "Space" && !(e.target instanceof HTMLInputElement)) { e.preventDefault(); useGame.getState().togglePause(); } };
    window.addEventListener("keydown", key);
    return () => { clearInterval(id); window.removeEventListener("keydown", key); };
  }, []);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }); }, [g.log.length]);

  const minuteBucket = Math.floor(g.minute / 5);
  const inbox = useMemo(() => inboxFor(g.day, g.minute, g.handled).reverse(), [g.day, minuteBucket, g.handled]); // eslint-disable-line react-hooks/exhaustive-deps
  const open = inbox.find((e) => e.id === openId) ?? inbox.find((e) => !e.status);
  const unread = inbox.filter((e) => !e.status).length;
  const c = g.character;
  if (!c) return null;

  if (g.ending) {
    const end = ENDINGS[g.ending];
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="paper p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Final cable · Day {g.day}</p>
          <span className="stamp animate-stamp mt-6 text-lg">{end.title}</span>
          <p className="mt-6 font-serif">{c.title} {c.name}: {end.text}</p>
          <Button className="mt-8" onClick={g.reset}>Request a new posting</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-4">
      <header className="paper mb-4 flex flex-wrap items-center gap-4 px-4 py-3">
        <Portrait face={c.face} size={48} />
        <div className="mr-auto">
          <h1 className="text-lg font-bold leading-tight">{c.title} {c.name}</h1>
          <p className="text-xs text-muted-foreground">Chargé d'Affaires a.i. · Embassy of Bellaluxe, Port Hesperia</p>
        </div>
        <div className="text-right font-mono">
          <div className="text-2xl">{formatClock(g.minute)}</div>
          <div className="text-xs text-muted-foreground">Day {g.day} / {LAST_DAY} · Minister in {LAST_DAY - g.day} days</div>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant={g.paused ? "default" : "outline"} onClick={g.togglePause}>{g.paused ? "▶" : "❚❚"}</Button>
          {([1, 2, 4] as const).map((s) => <Button key={s} size="sm" variant={g.speed === s ? "secondary" : "outline"} onClick={() => g.setSpeed(s)}>{s}×</Button>)}
        </div>
      </header>

      <EmbassyScene />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr_300px]">
        <section className="paper flex max-h-[70vh] flex-col">
          <h2 className="border-b border-border px-4 py-2 font-bold">Inbox {unread > 0 && <span className="ml-1 rounded bg-destructive px-1.5 font-mono text-xs text-destructive-foreground">{unread}</span>}</h2>
          <ul className="overflow-y-auto">
            {inbox.length === 0 && <li className="p-4 text-sm italic text-muted-foreground">Suspiciously quiet.</li>}
            {inbox.map((e) => (
              <li key={e.id}>
                <button onClick={() => setOpenId(e.id)} className={`w-full border-b border-border px-4 py-2 text-left text-sm hover:bg-muted ${open?.id === e.id ? "bg-muted" : ""}`}>
                  <div className={`truncate ${e.status ? "text-muted-foreground" : "font-semibold"}`}>{e.subject}</div>
                  <div className="truncate text-xs text-muted-foreground">{e.from}</div>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="paper min-h-[50vh] p-6">
          {open ? (
            <article>
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">From: {open.from} · Day {open.day}, {formatClock(open.time)}</p>
              <h2 className="mt-2 text-2xl font-bold">{open.subject}</h2>
              <pre className="mt-4 whitespace-pre-wrap font-mono text-sm leading-relaxed">{open.body}</pre>
              <div className="mt-6 border-t border-dashed border-border pt-4">
                {open.status ? (
                  <span className="stamp animate-stamp">{open.status === "ignored" ? "Escalated" : ACTION_LABELS[open.status as Action]}</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(open.options) as Action[]).map((a) => <Button key={a} variant="outline" onClick={() => { setOpenId(open.id); g.answer(open.id, a); }}>{ACTION_LABELS[a]}</Button>)}
                    <span className="self-center text-xs text-muted-foreground">or ignore it (until it escalates)</span>
                  </div>
                )}
              </div>
            </article>
          ) : <p className="font-serif italic text-muted-foreground">No cables. The quiet is being reported as a concern.</p>}
        </section>

        <aside className="space-y-4">
          <section className="paper p-4">
            <h2 className="mb-3 font-bold">Situation Overview</h2>
            {METERS.map(({ key, label }) => (
              <div key={key} className="mb-2">
                <div className="flex justify-between text-xs"><span>{label}</span><span className="font-mono">{Math.round(g.meters[key])}</span></div>
                <div className="h-2 rounded bg-muted"><div className={`h-2 rounded transition-all ${g.meters[key] < 25 ? "bg-destructive" : "bg-primary"}`} style={{ width: `${g.meters[key]}%` }} /></div>
              </div>
            ))}
          </section>
          <section className="paper p-4">
            <h2 className="mb-2 font-bold">Daily Log</h2>
            <div ref={logRef} className="max-h-64 space-y-2 overflow-y-auto font-mono text-xs">
              {g.log.map((l, i) => <p key={i}><span className="text-muted-foreground">D{l.day} {formatClock(l.time)}</span> {l.text}</p>)}
            </div>
          </section>
          <button onClick={() => confirm("Abandon post and start over?") && g.reset()} className="text-xs text-muted-foreground underline">Abandon post</button>
        </aside>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">Spacebar pauses · Progress saves automatically</p>
    </main>
  );
}
