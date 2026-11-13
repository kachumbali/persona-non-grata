import { useEffect, useState } from "react";
import { ArrowRight, MapPin, MessageSquare, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import city from "@/assets/port-hesperia.jpg";
import { BLOCKS, CAMPAIGN, hospitalityCost, pairKey, socialTrust, VISIT_TASKS, type StoryChoice, type VisitTask } from "../rules";
import { useGame } from "../store";
import { Portrait } from "./Portrait";

export function PlanningDesk() {
  const g = useGame();
  const [task, setTask] = useState<VisitTask>("clearance");
  const [worker, setWorker] = useState("self");
  const [partner, setPartner] = useState("");
  const [venue, setVenue] = useState("embassy");
  const [guest, setGuest] = useState("");
  const [workDinner, setWorkDinner] = useState(false);
  const [node, setNode] = useState("opening");
  const [notice, setNotice] = useState("");
  useEffect(() => { setNode("opening"); setNotice(""); }, [g.selectedNpc, g.block, g.day]);
  const block = BLOCKS[g.block] ?? BLOCKS[0];
  const location = CAMPAIGN.locations.find((l) => l.id === g.location) ?? CAMPAIGN.locations[0];
  const people = CAMPAIGN.characters.filter((c) => c.location === g.location);
  const npc = CAMPAIGN.characters.find((c) => c.id === g.selectedNpc);
  const dialogue = (CAMPAIGN.dialogue as Record<string, { text: string; choices: StoryChoice[] }>)[node];
  const event = g.events[g.block];
  const scheduledWork = g.pending.some((p) => p.playerSlot);
  const reserved = g.pending.reduce((n, p) => n + Math.max(0, -(p.effects.budget ?? 0)), 0);
  const cost = hospitalityCost(venue, guest ? 1 : 0, g.block);
  const addWork = () => {
    if (!location) return;
    const self = worker === "self";
    if (self && g.location !== "embassy") {
      const ok = g.queue({ id: "player-work", kind: "work", playerSlot: true, source: location.name, text: `${location.work}: useful contacts and commitments secured.`, effects: { ...location.effects, budget: -location.cost }, score: 3 });
      setNotice(ok ? "Appointment scheduled." : "Your activity or budget is already committed."); return;
    }
    if (self && g.block === 3) { setNotice("Official offices are closed. Rest or entertain a contact instead."); return; }
    const expectedLocation = task === "clearance" ? "ministry" : task === "programme" ? "un" : "embassy";
    const name = self ? "You" : CAMPAIGN.characters.find((c) => c.id === worker)?.name ?? worker;
    const ok = g.queue({ id: self ? "player-work" : `work-${worker}`, kind: "work", playerSlot: self, worker: self ? undefined : worker, partner: partner || undefined, task,
      source: `${name} · ${VISIT_TASKS[task]}`, text: `${name} secured written confirmation: ${VISIT_TASKS[task]}.`,
      effects: { confidence: 3, budget: task === "lounge" ? -5 : task === "security" ? -4 : 0 }, score: 2, trust: 1 });
    if (ok && self) { useGame.setState({ location: expectedLocation }); }
    setNotice(ok ? "Assignment scheduled. Results arrive next round." : "Assignment unavailable: check time, colleague availability or budget.");
  };
  const chooseDialogue = (choice: StoryChoice) => {
    if (choice.next) { setNode(choice.next); return; }
    if (!npc) return;
    const ok = g.queue({ id: "conversation", kind: "dialogue", playerSlot: true, source: `Conversation with ${npc.name}`, text: choice.result ?? "Conversation completed.", effects: choice.effects ?? {}, worker: npc.id, trust: choice.trust, pair: choice.pair, score: choice.score, composure: 3 });
    setNotice(ok ? "Conversation recorded for the next round." : "Your activity is already committed. Remove it to make time for this conversation.");
  };
  const chooseEvent = (choice: StoryChoice) => {
    if (!event) return;
    if (choice.replace) {
      for (const p of g.pending.filter((p) => p.playerSlot)) g.removeDecision(p.id);
    }
    const ok = useGame.getState().queue({ id: `event-${event.id}`, kind: "event", source: event.title, text: choice.result ?? "Event resolved.", effects: choice.effects ?? {},
      eventId: event.id, worker: choice.worker ?? event.npc, partner: event.id === "rivalry" ? "anselm" : undefined, trust: choice.trust, pair: choice.pair,
      flag: choice.flag, score: choice.score, playerSlot: choice.replace });
    setNotice(ok ? "Response scheduled." : "That colleague or your budget is already committed.");
  };
  return <section aria-label="Daily planning" className="mb-4 border-y-2 border-border bg-card">
    <div className="retro-titlebar flex-wrap justify-between"><h2>Daily Diary · {block.name}</h2><span className="font-mono">Mission Standing {g.score} · Budget {g.meters.budget} ({reserved} reserved)</span></div>
    <div className="grid border-b border-border sm:grid-cols-4">{BLOCKS.map((b, i) => <div key={b.name} className={`border-r border-border px-3 py-2 ${g.block === i ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}><strong>{i + 1}. {b.name}</strong><div className="text-xs">{b.social} {i < g.block ? "· completed" : i === g.block ? "· planning" : "· upcoming"}</div></div>)}</div>
    {g.report.length > 0 && <div className="border-b border-border bg-muted p-3" aria-label="Round results"><h3 className="text-xl">Situation report · previous round</h3><ul className="mt-1 space-y-1 text-sm">{g.report.map((r, i) => <li key={i}>• {r.text}</li>)}</ul></div>}
    <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
        <div className="relative"><img src={city} width={1536} height={768} alt="Pixel-art Port Hesperia: ministry, embassy, diplomatic venues and restaurants" className="aspect-[2/1] w-full object-cover" /><div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-card px-3 py-2"><MapPin className="size-4" /><h3 className="text-xl">{location?.name}</h3></div></div>
        <div className="p-3"><div className="flex flex-wrap gap-2" aria-label="City destinations">{CAMPAIGN.locations.map((l) => <Button key={l.id} size="sm" variant={g.location === l.id ? "secondary" : "outline"} disabled={scheduledWork && g.location !== l.id} onClick={() => g.move(l.id)}>{l.name}</Button>)}</div>
          <p className="my-3 text-sm">{location?.description}</p>
          <div className="flex flex-wrap gap-2">{people.map((c) => <Button key={c.id} variant={g.selectedNpc === c.id ? "secondary" : "outline"} className="h-auto justify-start gap-2 whitespace-normal p-2 text-left" onClick={() => g.selectNpc(c.id)}><Portrait face={c.face} size={32} /><span>{c.name}<span className="block text-xs">Trust {g.colleagues[c.id]?.trust ?? 50} · Fatigue {g.colleagues[c.id]?.fatigue ?? 0}</span></span></Button>)}</div>
          {npc && dialogue && <div className="mt-3 border-t border-border pt-3" aria-label="NPC conversation"><h3 className="flex items-center gap-2 text-xl"><MessageSquare className="size-4" />{npc.name}</h3><p className="text-xs text-muted-foreground">{npc.role}</p><p className="my-3">“{dialogue.text.replace("{line}", npc.line)}”</p><div className="flex flex-col gap-2">{dialogue.choices.map((choice) => <Button key={choice.id} variant="outline" className="h-auto justify-start whitespace-normal py-2 text-left" disabled={g.pending.some((p) => p.id === "conversation")} onClick={() => chooseDialogue(choice)}>{choice.label}</Button>)}</div></div>}
        </div>
      </div>
      <div className="min-w-0 p-3">
        <h3 className="mb-2 text-xl">Activity & delegation</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-sm">Owner<select aria-label="Assignment owner" value={worker} onChange={(e) => setWorker(e.target.value)} className="mt-1 w-full border border-input bg-muted p-2"><option value="self">Do it myself</option>{CAMPAIGN.characters.filter((c) => c.location === "embassy").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="text-sm">Visit arrangement<select aria-label="Visit arrangement" value={task} onChange={(e) => setTask(e.target.value as VisitTask)} className="mt-1 w-full border border-input bg-muted p-2">{(Object.entries(VISIT_TASKS) as [VisitTask, string][]).map(([id, label]) => <option key={id} value={id}>{label}{g.visit[id] ? " ✓" : ""}</option>)}</select></label>
          {worker !== "self" && <label className="text-sm sm:col-span-2">Cooperate with<select aria-label="Assignment partner" value={partner} onChange={(e) => setPartner(e.target.value)} className="mt-1 w-full border border-input bg-muted p-2"><option value="">Work independently</option>{CAMPAIGN.characters.filter((c) => c.location === "embassy" && c.id !== worker).map((c) => <option key={c.id} value={c.id}>{c.name} · cooperation {g.relationships[pairKey(worker, c.id)] ?? 50}</option>)}</select></label>}
        </div>
        {worker !== "self" && <p className="my-2 text-xs">Expertise: {CAMPAIGN.characters.find((c) => c.id === worker)?.skills.map((sk) => VISIT_TASKS[sk as VisitTask]).join(", ") || "No visit specialism"}. {g.block === 3 ? "Off duty — no evening assignments." : "One assignment per colleague this round."}</p>}
        <div className="mt-3 flex flex-wrap gap-2"><Button onClick={addWork} disabled={worker === "self" ? scheduledWork || g.block === 3 : g.block === 3}><Plus className="size-4" />{worker === "self" && g.location !== "embassy" ? location?.work : "Schedule assignment"}</Button><Button variant="outline" disabled={scheduledWork} onClick={() => { const ok = g.queue({ id: "rest", kind: "work", playerSlot: true, source: "Personal time", text: "A quiet break restores your energy and composure.", effects: { sanity: 2 }, energy: 20, composure: 15 }); setNotice(ok ? "Rest scheduled." : "Your activity is already committed."); }}>Take personal time</Button></div>
        <div className="mt-4 border-t border-border pt-3"><h3 className="text-xl">{block.social} · whom will you invite?</h3><div className="mt-2 grid gap-2 sm:grid-cols-2"><select aria-label="Social guest" className="w-full border border-input bg-muted p-2 text-sm" value={guest} onChange={(e) => setGuest(e.target.value)}><option value="">Alone</option>{CAMPAIGN.characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><select aria-label="Social venue" className="w-full border border-input bg-muted p-2 text-sm" value={venue} onChange={(e) => setVenue(e.target.value)}>{CAMPAIGN.venues.map((v) => <option key={v.id} value={v.id}>{v.name} · {v.cost ? `${v.cost} / person` : "staff provisions"}</option>)}</select></div>
          <p className="mt-2 text-xs">{CAMPAIGN.venues.find((v) => v.id === venue)?.description}</p>
          {guest && <p className="mt-1 text-xs">Likes: {CAMPAIGN.characters.find((c) => c.id === guest)?.likes.join(", ")} · Dislikes: {CAMPAIGN.characters.find((c) => c.id === guest)?.dislikes.join(", ")}</p>}
          {g.block === 3 && <label className="my-2 flex gap-2 text-sm"><input type="checkbox" checked={workDinner} onChange={(e) => setWorkDinner(e.target.checked)} />Discuss work at dinner (colleagues resent overtime)</label>}
          <Button className="mt-2" variant="outline" onClick={() => { const trust = socialTrust(guest, venue, workDinner && g.block === 3); const name = CAMPAIGN.characters.find((c) => c.id === guest)?.name; const ok = g.queue({ id: "social", kind: "social", source: block.social, text: guest ? `${block.social} with ${name} at ${CAMPAIGN.venues.find((v) => v.id === venue)?.name}: ${trust > 0 ? "a warmer relationship" : "an uncomfortable outing"}. Hospitality cost ${cost}.` : `${block.social} alone. Some welcome quiet.`, effects: { budget: -cost }, worker: guest || undefined, trust, energy: g.block === 1 || g.block === 3 ? 12 : 5, composure: guest ? 2 : 8 }); setNotice(ok ? "Social occasion scheduled." : "The embassy cannot afford that invitation."); }}><Users className="size-4" />{guest ? `Invite · embassy cost ${cost}` : "Reserve a quiet break"}</Button>
        </div>
        {event && <div className="mt-4 border-t-2 border-destructive pt-3" aria-label="Daily story"><h3 className="text-xl text-destructive">Interruption · {event.title}</h3><p className="my-2 text-sm">{event.text}</p><div className="flex flex-col gap-2">{event.choices.map((choice) => <Button key={choice.id} variant="outline" className="h-auto justify-start whitespace-normal py-2 text-left" disabled={g.pending.some((p) => p.eventId === event.id)} onClick={() => chooseEvent(choice)}>{choice.label}</Button>)}</div></div>}
      </div>
    </div>
    <div className="border-t-2 border-border p-3"><h3 className="text-xl">Committed this round</h3>{g.pending.length === 0 && <p className="my-2 text-sm text-muted-foreground">No commitments. An empty block becomes unallocated time.</p>}<ul className="my-2 space-y-2">{g.pending.map((p) => <li key={p.id} className="flex items-center justify-between gap-2 border-b border-border pb-1 text-sm"><span>{p.source}{p.effects.budget ? ` · cost ${Math.max(0, -p.effects.budget)}` : ""}</span><Button variant="ghost" size="icon" aria-label={`Remove ${p.source}`} title="Remove commitment" onClick={() => g.removeDecision(p.id)}><Trash2 className="size-4" /></Button></li>)}</ul>
      {notice && <p role="status" className="mb-2 text-sm text-primary">{notice}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3"><span className="font-mono">Energy {g.energy} · Composure {g.composure} · {g.events.length} story episodes today</span><Button size="lg" onClick={g.advance}>End {block.name.toLowerCase()} · resolve decisions <ArrowRight className="size-4" /></Button></div>
    </div>
  </section>;
}