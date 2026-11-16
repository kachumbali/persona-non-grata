import { activeChapter } from "../chapters";
import { agendaItems, describeCommitment } from "../agenda";
import { money } from "../economy";
import { blocks, type PendingDecision } from "../rules";
import { TRAVEL_DP, useGame } from "../store";
import { Button } from "@/components/ui/button";

export function CommitmentLine({ decision }: { decision: PendingDecision }) {
  const d = describeCommitment(decision, activeChapter());
  return (
    <span>
      <strong>{d.what}</strong>
      {d.choice && ` · ${d.choice}`}
      {` · ${d.where ?? "Location not recorded"}`} · {d.who} · {d.dp} DP · {money(d.cash)}
    </span>
  );
}

export function Agenda() {
  const g = useGame();
  const items = agendaItems(g, activeChapter());
  return (
    <section aria-label="Agenda" className="space-y-2 text-sm">
      <h2 className="font-bold">Today · Day {g.day}</h2>
      {blocks().map((block, index) => {
        const decisions =
          index < g.block ? (g.todayPlans[index] ?? []) : index === g.block ? g.pending : [];
        const fixed = items.filter((i) => i.day === g.day && i.block === index);
        return (
          <section
            key={block.name}
            className={`border border-border p-2 ${index < g.block ? "text-muted-foreground" : ""}`}
          >
            <h3 className="font-bold">
              {index < g.block ? "✓ " : ""}
              {block.name}
              {index === g.block ? " · now" : ""}
            </h3>
            {decisions.map((d) => (
              <div key={d.id} className="flex items-start justify-between gap-2">
                <CommitmentLine decision={d} />
                {index === g.block && (
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Remove ${d.source}`}
                    onClick={() => g.removeDecision(d.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {fixed.map((i) => (
              <p key={i.id}>
                {i.what} · {i.where}
                {i.location && i.location !== g.location ? ` · travel ${TRAVEL_DP} DP` : ""}
              </p>
            ))}
            {!decisions.length && index === g.block && (
              <p>Nothing planned. Idle time is noticed.</p>
            )}
          </section>
        );
      })}
      <h3 className="font-bold">Coming up</h3>
      {items
        .filter((i) => i.day > g.day && i.day <= g.day + 3)
        .map((i) => (
          <p key={i.id}>
            Day {i.day} {blocks()[i.block]?.name} · {i.what} · {i.where}
            {i.location && i.location !== g.location ? ` · travel ${TRAVEL_DP} DP` : ""}
          </p>
        ))}
      {!items.some((i) => i.day > g.day && i.day <= g.day + 3) && (
        <p>No fixed engagements in the next three days.</p>
      )}
    </section>
  );
}
