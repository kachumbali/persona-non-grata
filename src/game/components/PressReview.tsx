import { useState } from "react";
import { activeChapter } from "../chapters";
import { Button } from "@/components/ui/button";
import { clippings, outlets } from "../press";
import { useGame } from "../store";
import { campaign } from "../rules";

export function PressReview({ onClose }: { onClose: () => void }) {
  const g = useGame();
  const [hint, setHint] = useState("");
  const hostLevel = g.character?.languages?.[activeChapter().manifest.hostLanguage?.id ?? ""] ?? 0;
  const items = g.pressIds
    .map((id) => clippings().find((c) => c.id === id))
    .filter((c) => c !== undefined);
  const signal = items.find((c) => c.signal);
  const away =
    g.location !== "embassy" ||
    g.pending.some(
      (p) =>
        (p.worker === "press" || p.partner === "press") && p.location && p.location !== "embassy",
    );
  const ask = () => {
    if (
      g.queue({
        id: `press-background-${g.day}`,
        kind: "dialogue",
        source: "Lucien’s press background",
        text: signal?.background?.text ?? "Lucien explains the morning’s press coverage.",
        teaches: signal?.background?.teaches,
        effects: {},
        timeCost: 1,
      })
    ) {
      g.readPress();
      setHint(
        signal?.background?.text ??
          (signal
            ? `Lucien points to “${hostLevel < 2 && signal.maxim ? signal.maxim.headline : signal.headline}”.`
            : "Lucien says there is no developing fuel quay item today."),
      );
    } else setHint(useGame.getState().planError);
  };
  return (
    <section className="paper mb-4 p-4" aria-label="Press review">
      <h2 className="text-lg font-bold">
        Press review · Day {g.day} ·{" "}
        {g.pressCompiler === "press" ? "compiled by Lucien Falk" : "compiled by Maxim (intern)"}
      </h2>
      <div className="mt-3 grid gap-3">
        {items.map((c) => {
          const copy = hostLevel < 2 && c.maxim ? { ...c, ...c.maxim } : c;
          return (
            <article key={c.id} className="border-b border-border pb-2">
              <p className="font-mono text-xs uppercase text-muted-foreground">
                {outlets().find((o) => o.id === c.outlet)?.name}
              </p>
              <h3 className="font-bold">{copy.headline}</h3>
              <p className="text-sm">{copy.body}</p>
              {hostLevel >= 3 && c.original && (
                <p className="mt-1 text-sm italic">In the original: {c.original}</p>
              )}
              <Button
                size="sm"
                variant="outline"
                className="mt-1"
                disabled={g.pressClippedDay === g.day}
                onClick={() => {
                  g.readPress();
                  g.clipPress(c.id);
                }}
              >
                Clip for Capital · 0 DP
              </Button>
            </article>
          );
        })}
      </div>
      {(campaign().gossip ?? []).some((item) => item.source === "press" && item.day <= g.day) && (
        <div className="mt-3 border-t border-border pt-2">
          <h3 className="font-bold">Unconfirmed reports</h3>
          <ul className="list-disc pl-5 text-sm">
            {(campaign().gossip ?? [])
              .filter((item) => item.source === "press" && item.day <= g.day)
              .map((item) => (
                <li key={item.id}>{item.text}</li>
              ))}
          </ul>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={
            away ||
            (g.colleagues["press"]?.fatigue ?? 0) >= 80 ||
            g.pending.some((p) => p.id === `press-background-${g.day}`)
          }
          onClick={ask}
        >
          Ask Lucien for background · 1 DP
        </Button>
        <Button
          size="sm"
          onClick={() => {
            g.readPress();
            onClose();
          }}
        >
          Done reading
        </Button>
        <Button size="sm" variant="outline" onClick={onClose}>
          Skip
        </Button>
      </div>
      {hint && (
        <p role="status" className="mt-2 text-sm">
          {hint}
        </p>
      )}
    </section>
  );
}
