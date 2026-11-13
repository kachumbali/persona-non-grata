import { Button } from "@/components/ui/button";
import { Clock3, Repeat2, Banknote } from "lucide-react";
import { availableFunds, capacityLedger, decisionCash, money, SUPPLEMENT, VISIT_RESERVES } from "../economy";
import { CAMPAIGN } from "../rules";
import { useGame } from "../store";

export function ResourceDesk() {
  const g = useGame();
  const ledger = capacityLedger(g.pending, g.block);
  const reserved = g.pending.reduce((n, p) => n + decisionCash(p), 0);
  return <div className="border-b-2 border-border bg-muted p-3" aria-label="Time and money">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-xl"><Clock3 className="size-5" />Your diary · {ledger[0]?.used ?? 0} / 2 TP committed</h3>
      <Button size="sm" variant="outline" onClick={g.repeatYesterday} disabled={!g.yesterday[g.block]}><Repeat2 className="size-4" />Repeat yesterday</Button>
    </div>
    <div className="mt-2 grid gap-1 text-xs sm:grid-cols-3">{ledger.filter((r) => r.id !== "self" && CAMPAIGN.characters.find((c) => c.id === r.id)?.location === "embassy").map((r) => <div key={r.id} className={r.displaced ? "text-destructive" : "text-muted-foreground"}>{CAMPAIGN.characters.find((c) => c.id === r.id)?.name}: {g.block === 3 ? "off duty" : `${r.baseline} baseline · ${r.used} planned · ${r.free} free TP`}{r.displaced > 0 ? ` · ${r.displaced} TP duties displaced` : ""}</div>)}</div>
    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-border pt-2 font-mono" aria-label="Campaign budget">
      <span>Funds {money(g.economy.funds)}</span><span>Visit reserve {money(g.economy.ringFence)}</span><span>Pending {money(reserved)}</span><strong>Available {money(availableFunds(g.economy, g.pending))}</strong>
    </div>
    <details className="mt-2 text-xs"><summary className="cursor-pointer">Visit costs & Capital funding</summary><div className="mt-2 flex flex-wrap gap-3">{Object.entries(VISIT_RESERVES).map(([name, amount]) => <span key={name}>{name} {money(amount)}</span>)}</div>
      {g.economy.ringFence < 5500 && <p className="my-2 text-destructive">Visit underfunded by {money(5500 - g.economy.ringFence)}. Arrival-day procurement will charge the shortfall and damage HQ goodwill.</p>}
      <div className="mt-2 flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={g.economy.supplementUsed || g.pending.some((p) => p.special === "supplement")} onClick={g.requestSupplement}><Banknote className="size-4" />Request {money(SUPPLEMENT.amount)} · 1 TP · HQ −{SUPPLEMENT.goodwillCost}</Button>
      <Button size="sm" variant="outline" disabled={g.economy.ringFence < 500} onClick={() => { if (confirm("Release ƒ500 from visit costs? HQ goodwill −5 immediately. The underfunded visit will incur emergency procurement on arrival.")) g.raidReserve(); }}>Release ƒ500 visit reserve · HQ −5</Button></div>
      <p className="mt-2">{g.economy.supplementDue !== null ? `Supplement arrives after ${Math.max(0, g.economy.supplementDue - g.turn)} further block(s).` : g.economy.supplementUsed ? "Capital supplement already granted." : "One supplement per campaign; payment arrives two blocks after paperwork resolves."}</p>
    </details>
    {g.planError && <p role="alert" className="mt-2 text-sm text-destructive">{g.planError}</p>}
  </div>;
}