import { useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BLOCKS } from "../rules";
import { availableFunds, decisionCash, money, playerTime } from "../economy";
import { useGame } from "../store";
import { Mailbox } from "./Mailbox";

/** Pull-up phone, always on screen: round status, commitments, mail away from the office, and End block. */
export function BlackBerry() {
  const g = useGame();
  const [up, setUp] = useState(false);
  const [tab, setTab] = useState<"status" | "mail">("status");
  const used = g.pending.reduce((n, p) => n + playerTime(p), 0);
  const block = BLOCKS[g.block] ?? BLOCKS[0];
  const away = g.location !== "embassy";
  return (
    <aside className="blackberry-dock" data-up={up} aria-label="BlockBerry">
      <button type="button" className="bb-top" onClick={() => setUp(!up)} aria-expanded={up}>
        <span className="bb-led" data-on={g.report.length > 0 || !!g.planError} />
        <span className="font-mono">{block.name} · DP {2 - used}/2 · {money(availableFunds(g.economy, g.pending))}</span>
        {up ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
      </button>
      {up && <div className="bb-screen">
        <div className="mb-2 flex gap-1">
          <Button size="sm" variant={tab === "status" ? "secondary" : "ghost"} onClick={() => setTab("status")}>Status</Button>
          <Button size="sm" variant={tab === "mail" ? "secondary" : "ghost"} onClick={() => setTab("mail")}>Mail</Button>
        </div>
        {tab === "status" ? <div className="space-y-2 text-sm">
          <p className="font-mono">HQ {g.meters.confidence} · Host {g.meters.goodwill} · Morale {g.meters.morale} · Sanity {g.meters.sanity}</p>
          <p className="font-mono">Energy {g.energy} · Composure {g.composure} · Standing {g.score}</p>
          <div><strong>Committed this {block.name.toLowerCase()}</strong>
            {g.pending.length === 0 && <p className="text-muted-foreground">Nothing planned. Idle time is noticed.</p>}
            <ul>{g.pending.map((p) => <li key={p.id} className="flex items-center justify-between gap-1 border-b border-border py-0.5"><span>{p.source} · {playerTime(p)} DP · {money(decisionCash(p))}</span><Button variant="ghost" size="icon" className="size-6" aria-label={`Remove ${p.source}`} onClick={() => g.removeDecision(p.id)}><Trash2 className="size-3" /></Button></li>)}</ul>
          </div>
          {g.planError && <p role="alert" className="text-destructive">{g.planError}</p>}
          {g.report.length > 0 && <details open><summary className="cursor-pointer font-bold">Last round · {g.report.length} items</summary><ul className="max-h-40 overflow-y-auto">{g.report.map((r, i) => <li key={i}>• {r.text}</li>)}</ul></details>}
        </div> : away ? <Mailbox channel="mail" /> : <p className="text-sm">You're in the office. Use your PC for mail.</p>}
      </div>}
      <div className="bb-keys">
        <Button size="sm" className="w-full" onClick={() => { g.advance(); setUp(true); setTab("status"); }}>End {block.name.toLowerCase()} <ArrowRight className="size-4" /></Button>
      </div>
    </aside>
  );
}
