import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BLOCKS } from "../rules";
import { availableFunds, money, playerTime } from "../economy";
import { useGame } from "../store";

/** Always-visible strip: DP, money, goodwill, last round's report and End block. */
export function TurnBar() {
  const g = useGame();
  const used = g.pending.reduce((n, p) => n + playerTime(p), 0);
  const block = BLOCKS[g.block] ?? BLOCKS[0];
  return (
    <section className="paper mt-3 p-3" aria-label="Turn status">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono">
        <span>DP {2 - used} / 2</span><span>Available {money(availableFunds(g.economy, g.pending))}</span>
        <span>HQ {g.meters.confidence}</span><span>Host {g.meters.goodwill}</span><span>Morale {g.meters.morale}</span>
        <span className="text-muted-foreground">{g.pending.length} commitments</span>
        <Button className="ml-auto" onClick={g.advance}>End {block.name.toLowerCase()} <ArrowRight className="size-4" /></Button>
      </div>
      {g.planError && <p role="alert" className="mt-1 text-sm text-destructive">{g.planError}</p>}
      {g.report.length > 0 && <details className="mt-2 text-sm"><summary className="cursor-pointer">Situation report · {g.report.length} items</summary><ul className="mt-1 space-y-1">{g.report.map((r, i) => <li key={i}>• {r.text}</li>)}</ul></details>}
    </section>
  );
}
