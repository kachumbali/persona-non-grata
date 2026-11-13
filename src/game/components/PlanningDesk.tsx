import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BLOCKS, CAMPAIGN, hospitalityCost, pairKey, socialTrust, VISIT_TASKS, type VisitTask } from "../rules";
import { useGame } from "../store";
import { ResourceDesk } from "./ResourceDesk";
import { availableFunds, decisionCash, money, playerTime } from "../economy";

export function PlanningDesk() {
  const g = useGame();
  const [task, setTask] = useState<VisitTask>("clearance");
  const [worker, setWorker] = useState("self");
  const [partner, setPartner] = useState("");
  const [venue, setVenue] = useState("embassy");
  const [guest, setGuest] = useState("");
  const [workDinner, setWorkDinner] = useState(false);
  const [overload, setOverload] = useState(false);
  const [service, setService] = useState<"none" | "express" | "driver">("none");
  const [notice, setNotice] = useState("");
  useEffect(() => { setNotice(""); }, [g.block, g.day]);
  const block = BLOCKS[g.block] ?? BLOCKS[0];
  const location = CAMPAIGN.locations.find((l) => l.id === g.location) ?? CAMPAIGN.locations[0];
  const usedTime = g.pending.reduce((n, p) => n + playerTime(p), 0);
  const scheduledWork = usedTime >= 2;

  const cost = hospitalityCost(venue, guest ? 1 : 0, g.block);
  const socialTime = g.block === 0 || g.block === 2 ? venue === "embassy" ? 1 : 2 : g.block === 1 && !guest && venue === "embassy" ? 1 : 2;
  const workTime = service === "express" ? 1 : 2;
  const serviceCost = service === "express" ? 250 : service === "driver" ? 150 : 0;
  const addWork = () => {
    if (!location) return;
    const self = worker === "self";
    if (self && g.location !== "embassy") {
      const ok = g.queue({ id: "player-work", kind: "work", playerSlot: true, source: location.name, text: `${location.work}: useful contacts and commitments secured.`, effects: location.effects, cashCost: location.cost + serviceCost, timeCost: location.id === "golf" ? 2 : service === "driver" ? 1 : 2, remainingBlocks: location.id === "golf" ? 2 : undefined, location: location.id, service: service === "none" ? undefined : service, score: 3 });
      setNotice(ok ? "Appointment scheduled." : useGame.getState().planError); return;
    }
    if (self && g.block === 3) { setNotice("Official offices are closed. Rest or entertain a contact instead."); return; }
    const name = self ? "You" : CAMPAIGN.characters.find((c) => c.id === worker)?.name ?? worker;
    const ok = g.queue({ id: self ? "player-work" : `work-${worker}`, kind: "work", playerSlot: self, worker: self ? undefined : worker, partner: self ? undefined : partner || undefined, task,
      source: `${name} · ${VISIT_TASKS[task]}`, text: `${name} secured written confirmation: ${VISIT_TASKS[task]}.`,
      effects: { confidence: 3 }, cashCost: (task === "lounge" ? 500 : task === "security" ? 400 : 0) + (self ? serviceCost : 0), timeCost: self ? workTime : 0, overload, score: 2, trust: 1 });
    setNotice(ok ? "Assignment scheduled. Results arrive next round." : useGame.getState().planError);
  };
  return <section aria-label="Daily planning" className="mb-4 border-y-2 border-border bg-card">
    <div className="retro-titlebar flex-wrap justify-between"><h2>Daily Diary · {block.name}</h2><span className="font-mono">Mission Standing {g.score} · Available {money(availableFunds(g.economy, g.pending))}</span></div>
    <ResourceDesk />
    <div className="grid border-b border-border sm:grid-cols-4">{BLOCKS.map((b, i) => <div key={b.name} className={`border-r border-border px-3 py-2 ${g.block === i ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}><strong>{i + 1}. {b.name}</strong><div className="text-xs">{b.social} {i < g.block ? "· completed" : i === g.block ? "· planning" : "· upcoming"}</div></div>)}</div>
    {g.report.length > 0 && <div className="border-b border-border bg-muted p-3" aria-label="Round results"><h3 className="text-xl">Situation report · previous round</h3><ul className="mt-1 space-y-1 text-sm">{g.report.map((r, i) => <li key={i}>• {r.text}</li>)}</ul></div>}
    <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
        <div className="p-3"><h3 className="flex items-center gap-2 text-xl"><MapPin className="size-4" />{location?.name}</h3>
          <p className="my-3 text-sm">{location?.description}</p>
        </div>
      </div>
      <div className="min-w-0 p-3">
        <h3 className="mb-2 text-xl">Activity & delegation</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-sm">Owner<select aria-label="Assignment owner" value={worker} onChange={(e) => setWorker(e.target.value)} className="mt-1 w-full border border-input bg-muted p-2"><option value="self">Do it myself</option>{CAMPAIGN.characters.filter((c) => c.location === "embassy").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="text-sm">Visit arrangement<select aria-label="Visit arrangement" value={task} onChange={(e) => setTask(e.target.value as VisitTask)} className="mt-1 w-full border border-input bg-muted p-2">{(Object.entries(VISIT_TASKS) as [VisitTask, string][]).map(([id, label]) => <option key={id} value={id}>{label}{g.visit[id] ? " ✓" : ""}</option>)}</select></label>
          {worker !== "self" && <label className="text-sm sm:col-span-2">Cooperate with<select aria-label="Assignment partner" value={partner} onChange={(e) => setPartner(e.target.value)} className="mt-1 w-full border border-input bg-muted p-2"><option value="">Work independently</option>{CAMPAIGN.characters.filter((c) => c.location === "embassy" && c.id !== worker).map((c) => <option key={c.id} value={c.id}>{c.name} · cooperation {g.relationships[pairKey(worker, c.id)] ?? 50}</option>)}</select></label>}
        </div>
        {worker !== "self" && <p className="my-2 text-xs">Expertise: {CAMPAIGN.characters.find((c) => c.id === worker)?.skills.map((sk) => VISIT_TASKS[sk as VisitTask]).join(", ") || "No visit specialism"}. {g.block === 3 ? "Off duty — no evening assignments." : "Assignments compete with baseline duties."}</p>}
        <div className="my-3 flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={overload} onChange={(e) => setOverload(e.target.checked)} />Displace baseline duties (fatigue & backlog)</label>
          {worker === "self" && <label>Service<select aria-label="Time-saving service" className="ml-2 border border-input bg-muted p-1" value={service} onChange={(e) => setService(e.target.value as "none" | "express" | "driver")}><option value="none">Standard · 2 DP</option><option value="express" disabled={g.location !== "embassy"}>Express paperwork · 1 DP + ƒ250</option><option value="driver" disabled={g.location === "embassy" || g.location === "golf"}>Driver & light work · 1 DP + ƒ150</option></select></label>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2"><Button onClick={addWork} disabled={worker === "self" ? scheduledWork || g.block === 3 : g.block === 3}><Plus className="size-4" />{worker === "self" && g.location !== "embassy" ? `${location?.work} · ${location?.id === "golf" ? "4 DP / two blocks" : service === "driver" ? "1 DP" : "2 DP"} · ${money((location?.cost ?? 0) + serviceCost)}` : `Schedule assignment · ${worker === "self" ? workTime : 2} DP`}</Button><Button variant="outline" disabled={scheduledWork} onClick={() => { const ok = g.queue({ id: "rest", kind: "work", timeCost: 1, source: "Personal time", text: "A quiet break restores your energy and composure.", effects: { sanity: 2 }, energy: 20, composure: 15 }); setNotice(ok ? "Rest scheduled." : useGame.getState().planError); }}>Take personal time · 1 DP</Button></div>
        <div className="mt-4 border-t border-border pt-3"><h3 className="text-xl">{block.social} · whom will you invite?</h3><div className="mt-2 grid gap-2 sm:grid-cols-2"><select aria-label="Social guest" className="w-full border border-input bg-muted p-2 text-sm" value={guest} onChange={(e) => setGuest(e.target.value)}><option value="">Alone</option>{CAMPAIGN.characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><select aria-label="Social venue" className="w-full border border-input bg-muted p-2 text-sm" value={venue} onChange={(e) => setVenue(e.target.value)}>{CAMPAIGN.venues.map((v) => <option key={v.id} value={v.id}>{v.name} · {v.cost ? `${money(v.cost)} / person` : "staff provisions"}</option>)}</select></div>
          <p className="mt-2 text-xs">{CAMPAIGN.venues.find((v) => v.id === venue)?.description}</p>
          {guest && <p className="mt-1 text-xs">Likes: {CAMPAIGN.characters.find((c) => c.id === guest)?.likes.join(", ")} · Dislikes: {CAMPAIGN.characters.find((c) => c.id === guest)?.dislikes.join(", ")}</p>}
          {g.block === 3 && <label className="my-2 flex gap-2 text-sm"><input type="checkbox" checked={workDinner} onChange={(e) => setWorkDinner(e.target.checked)} />Discuss work at dinner (colleagues resent overtime)</label>}
          <Button className="mt-2 h-auto whitespace-normal py-2" variant="outline" onClick={() => { const trust = socialTrust(guest, venue, workDinner && g.block === 3); const name = CAMPAIGN.characters.find((c) => c.id === guest)?.name; const ok = g.queue({ id: "social", kind: "social", source: block.social, text: guest ? `${block.social} with ${name} at ${CAMPAIGN.venues.find((v) => v.id === venue)?.name}: ${trust > 0 ? "a warmer relationship" : "an uncomfortable outing"}. Hospitality cost ${money(cost)}.` : `${block.social} alone. Some welcome quiet.`, effects: {}, cashCost: cost, timeCost: socialTime, venue, overload, worker: guest || undefined, trust, energy: g.block === 1 || g.block === 3 ? 12 : 5, composure: guest ? 2 : 8 }); setNotice(ok ? "Social occasion scheduled." : useGame.getState().planError); }}><Users className="size-4" />{guest ? `Invite · ${socialTime} DP · ${money(cost)}` : `Eat / drink alone · ${socialTime} DP · ${money(cost)}`}</Button>
        </div>
      </div>
    </div>
    <div className="border-t-2 border-border p-3"><h3 className="text-xl">Committed this round</h3>{g.pending.length === 0 && <p className="my-2 text-sm text-muted-foreground">No commitments. An empty block becomes unallocated time.</p>}<ul className="my-2 space-y-2">{g.pending.map((p) => <li key={p.id} className="flex items-center justify-between gap-2 border-b border-border pb-1 text-sm"><span>{p.source} · {playerTime(p)} your DP · {money(decisionCash(p))}{p.worker ? ` · ${p.worker}` : ""}</span><Button variant="ghost" size="icon" aria-label={`Remove ${p.source}`} title="Remove commitment" onClick={() => g.removeDecision(p.id)}><Trash2 className="size-4" /></Button></li>)}</ul>
      {notice && <p role="status" className="mb-2 text-sm text-primary">{notice}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3"><span className="font-mono">Energy {g.energy} · Composure {g.composure} · {g.events.length} story episodes today</span><span className="text-xs">End the block from your BlockBerry.</span></div>
    </div>
  </section>;
}