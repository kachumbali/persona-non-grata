import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { decisionCash, money } from "../economy";
import { locationStories, type StoryChoice } from "../rules";
import { useGame } from "../store";

/** An active lead is encountered at its location and resolves with the block. */
export function LocationLead() {
  const g = useGame();
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const event = locationStories(g.day, g.completedEvents, g.storyOutcomes).find((lead) => lead.location === g.location);
  if (!event) return null;
  const queued = g.pending.some((p) => p.eventId === event.id);
  const choose = (choice: StoryChoice) => {
    const ok = g.queue({ id: `event-${event.id}`, kind: "event", source: event.title, text: choice.result ?? "The matter is settled.",
      effects: choice.effects ?? {}, eventId: event.id, eventChoice: choice.id, flag: choice.flag, score: choice.score,
      worker: event.npc, trust: choice.trust, pair: choice.pair, timeCost: 1, location: event.location });
    setNotice(ok ? "Decision scheduled. It takes effect at the end of this block." : useGame.getState().planError);
  };
  const hotspot = g.location === "ministry" ? { left: "18%", top: "42%", width: "18%", height: "25%" } : { left: "73%", top: "39%", width: "14%", height: "25%" };
  return <>
    <button type="button" className="scene-hotspot" style={hotspot} onClick={() => { setNotice(""); setOpen(true); }} aria-label={`Follow up: ${event.title}`}><span className="map-label">{g.location === "ministry" ? "Protocol desk" : "Follow lead"}</span></button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="retro-builder max-w-lg bg-card p-0 text-card-foreground">
        <DialogTitle className="retro-titlebar">{event.title}</DialogTitle>
        <div className="p-4">
          <DialogDescription className="mb-3 text-foreground">{event.text}</DialogDescription>
          {queued ? <p role="status">Decision scheduled. It takes effect at the end of this block.</p> : <div className="flex flex-col gap-2">{event.choices.map((choice) => {
            const cost = decisionCash({ id: event.id, kind: "event", source: event.title, text: choice.result ?? "", effects: choice.effects ?? {} });
            return <Button key={choice.id} variant="outline" className="h-auto justify-start whitespace-normal py-2 text-left" onClick={() => choose(choice)}>▸ {choice.label} · 1 DP{cost > 0 ? ` · ${money(cost)}` : ""}</Button>;
          })}</div>}
          {notice && !queued && <p role="status" className="mt-2 text-sm">{notice}</p>}
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
