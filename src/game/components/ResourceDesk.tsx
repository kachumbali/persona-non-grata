import { Button } from "@/components/ui/button";
import { Clock3, Repeat2, Banknote } from "lucide-react";
import {
  availableFunds,
  capacityLedger,
  decisionCash,
  money,
  playerCapacity,
  reserveRelease,
  staffDuty,
  startRingFence,
  supplement,
  visitReserves,
} from "../economy";
import { campaign } from "../rules";
import { useGame } from "../store";

export function ResourceDesk() {
  const g = useGame();
  const capacity = playerCapacity(g.character, g.energy, g.composure, g.alcohol, g.hangover);
  const ledger = capacityLedger(g.pending, g.block, capacity.total);
  const reserved = g.pending.reduce((n, p) => n + decisionCash(p), 0);
  const colleagues = ledger.filter(
    (r) =>
      r.id !== "self" && campaign().characters.find((c) => c.id === r.id)?.location === "embassy",
  );
  return (
    <div className="border-b-2 border-border bg-muted p-3" aria-label="Time and money">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-xl">
          <Clock3 className="size-5" />
          Your diary · {ledger[0]?.used ?? 0} / {capacity.total} DP committed
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={g.repeatYesterday}
          disabled={!g.yesterday[g.block]}
        >
          <Repeat2 className="size-4" />
          Repeat yesterday
        </Button>
      </div>
      <p className="mt-1 text-xs">
        DP: base 4
        {capacity.factors.length ? ` · ${capacity.factors.join(" · ")}` : " · no modifiers"}.
        Changes from choices apply next block.
      </p>
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer">
          {g.block === 3
            ? "Staff capacity: colleagues are off duty this block"
            : `Staff capacity: ${colleagues.filter((r) => r.free > 0).length} of ${colleagues.length} colleagues have free time`}
        </summary>
        <div className="mt-2 grid gap-1 sm:grid-cols-3">
          {colleagues.map((r) => (
            <div key={r.id} className={r.displaced ? "text-destructive" : "text-muted-foreground"}>
              {campaign().characters.find((c) => c.id === r.id)?.name}:{" "}
              {g.block === 3
                ? "off duty"
                : `${r.baseline} baseline · ${r.used} planned · ${r.free} free DP`}
              {r.displaced > 0 ? ` · ${r.displaced} DP duties displaced` : ""}
            </div>
          ))}
        </div>
      </details>
      <p className="mt-3 border-t border-border pt-2 font-mono" aria-label="Campaign budget">
        <strong>Free to spend {money(availableFunds(g.economy, g.pending))}</strong>
      </p>
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer">Visit costs & Capital funding</summary>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono">
          <span>Funds {money(g.economy.funds)}</span>
          <span>Visit reserve {money(g.economy.ringFence)}</span>
          <span>Mission steps {money(g.economy.missionReserve ?? 0)}</span>
          <span>Pending {money(reserved)}</span>
        </div>
        <p className="mt-2">
          Mission steps reserve: cash for the steps still to do (
          {money(g.economy.missionReserve ?? 0)}), including what a setback could add. Steps are
          paid from it; hospitality and other optional spending cannot touch it.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          {Object.entries(visitReserves()).map(([name, amount]) => (
            <span key={name}>
              {name} {money(amount)}
            </span>
          ))}
        </div>
        {g.economy.ringFence < startRingFence() && (
          <p className="my-2 text-destructive">
            Visit underfunded by {money(startRingFence() - g.economy.ringFence)}. Arrival-day
            procurement will charge the shortfall and damage HQ goodwill.
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={g.economy.supplementUsed || g.pending.some((p) => p.special === "supplement")}
            onClick={g.requestSupplement}
          >
            <Banknote className="size-4" />
            Request {money(supplement().amount)} · 1 DP · HQ −{supplement().goodwillCost}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={g.economy.ringFence < reserveRelease().amount}
            onClick={() => {
              if (
                confirm(
                  `Release ${money(reserveRelease().amount)} from visit costs? HQ goodwill −${reserveRelease().goodwillCost} immediately. The underfunded visit will incur emergency procurement on arrival.`,
                )
              )
                g.raidReserve();
            }}
          >
            Release {money(reserveRelease().amount)} visit reserve · HQ −
            {reserveRelease().goodwillCost}
          </Button>
        </div>
        <p className="mt-2">
          {g.economy.supplementDue !== null
            ? `Supplement arrives after ${Math.max(0, g.economy.supplementDue - g.turn)} further block(s).`
            : g.economy.supplementUsed
              ? "Capital supplement already granted."
              : "One supplement per campaign; payment arrives two blocks after paperwork resolves."}
        </p>
      </details>
      {g.planError && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {g.planError}
        </p>
      )}
    </div>
  );
}
