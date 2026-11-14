import { useEffect, useState } from "react";
import { BellRing, Phone, Printer, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CAMPAIGN, type StoryChoice, type StoryEvent } from "../rules";
import { useGame } from "../store";
import { capacityLedger, staffDuty } from "../economy";
import { Portrait } from "./Portrait";

const dpFor = (eventId: string, c: StoryChoice) => (c.replace || eventId === "rivalry" ? 2 : c.worker ? 0 : eventId === "invitation" && c.id === "decline" ? 0 : 1);

/** Story episodes arrive in the main game as a call, a fax or someone at your door. */
export function Interruption() {
  const g = useGame();
  const event = g.events[g.block];
  const answered = !!event && g.pending.some((p) => p.eventId === event.id);
  const [open, setOpen] = useState(true);
  const [notice, setNotice] = useState("");
  const [overload, setOverload] = useState(false);
  useEffect(() => { setOpen(true); setNotice(""); setOverload(false); }, [event?.id, g.block, g.day]);
  if (!event || (CAMPAIGN.events as StoryEvent[]).find((entry) => entry.id === event.id)?.location || g.completedEvents.includes(event.id)) return null;
  const npc = CAMPAIGN.characters.find((c) => c.id === event.npc);
  const colleague = npc?.location === "embassy";
  const fromCapital = npc?.role?.toLowerCase().includes("capital");
  const how = colleague ? { icon: UserRound, label: `${npc?.name ?? "A colleague"} appears at your door` } : fromCapital ? { icon: Printer, label: "The secure fax starts printing" } : { icon: Phone, label: `Phone call · ${npc?.name ?? "Unknown caller"}` };
  const Icon = how.icon;
  const participants = [...new Set(event.choices.map((c) => c.worker ?? (event.id === "invitation" ? undefined : event.npc)).filter((id): id is string => !!id && CAMPAIGN.characters.some((person) => person.id === id && person.location === "embassy")))];
  const ledger = capacityLedger(g.pending, g.block);

  const choose = (c: StoryChoice) => {
    const ok = useGame.getState().queue({ id: `event-${event.id}`, kind: "event", source: event.title, text: c.result ?? "Event resolved.", effects: c.effects ?? {},
      eventId: event.id, eventChoice: c.id, worker: c.worker ?? (event.id === "invitation" ? undefined : event.npc), partner: event.id === "rivalry" ? "anselm" : undefined, pairTarget: c.pairTarget, trust: c.trust, pair: c.pair,
      flag: c.flag, score: c.score, contact: c.contact, contactTrust: c.contactTrust, overload, playerSlot: c.replace, timeCost: dpFor(event.id, c) }, c.replace);
    if (ok) setOpen(false); else setNotice(useGame.getState().planError);
  };
  return <>
    {!open && !answered && <Button variant="destructive" className="interrupt-badge" onClick={() => setOpen(true)}><BellRing className="size-4" />{event.title}</Button>}
    <Dialog open={open && !answered} onOpenChange={setOpen}>
      <DialogContent className="retro-builder max-w-lg bg-card p-0 text-card-foreground">
        <DialogTitle className="retro-titlebar"><Icon className="size-5" />{how.label}</DialogTitle>
        <div className="flex gap-4 p-4">
          {npc && <div className="shrink-0 self-start"><Portrait face={npc.face} size={88} /></div>}
          <div className="min-w-0">
            <h3 className="text-xl text-destructive">{event.title}</h3>
            <DialogDescription className="my-2 text-sm text-foreground">{event.text}</DialogDescription>
            {participants.length > 0 && <div className="mb-2 text-xs">{participants.map((id) => {
              const row = ledger.find((entry) => entry.id === id);
              const name = CAMPAIGN.characters.find((person) => person.id === id)?.name ?? id;
              return <p key={id}>{name}: {staffDuty(id)} · {row?.baseline ?? 0} routine, {row?.used ?? 0} assigned, {row?.free ?? 0} free staff DP.</p>;
            })}<label className="mt-1 flex gap-2"><input type="checkbox" checked={overload} onChange={(e) => setOverload(e.target.checked)} />Allow displaced routine work (fatigue and backlog)</label></div>}
            <div className="flex flex-col gap-2">{event.choices.map((c) => <Button key={c.id} variant="outline" className="h-auto justify-start whitespace-normal py-2 text-left" onClick={() => choose(c)}>▸ {c.label} · {dpFor(event.id, c)} DP{participants.includes(c.worker ?? (event.id === "invitation" ? "" : event.npc)) ? " · 2 colleague DP" : ""}</Button>)}</div>
            {notice && <p role="alert" className="mt-2 text-sm text-destructive">{notice}</p>}
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setOpen(false)}>Deal with it later (ignored at block end)</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
