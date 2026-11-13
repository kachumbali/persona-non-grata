import { formatClock, goodwillRisk, LAST_DAY, VISIT_TASKS, type VisitTask } from "../rules";
import { useGame } from "../store";

export function GoodwillDashboard() {
  const { meters, goodwillHistory, visit, day } = useGame();
  const confirmed = Object.keys(VISIT_TASKS).filter((key) => visit[key as VisitTask]).length;
  return (
    <section aria-label="Goodwill dashboard" className="mb-4 border-y-2 border-border bg-card py-3">
      <h2 className="retro-titlebar">Mission Watch · Capital & Host Country</h2>
      <div className="grid gap-4 p-3 md:grid-cols-3">
        {([{ key: "confidence", label: "HQ goodwill", failure: "Replacement", warning: "Capital may replace you." }, { key: "goodwill", label: "Host-country goodwill", failure: "PNG", warning: "Expulsion is at risk." }] as const).map(({ key, label, failure, warning }) => {
          const risk = goodwillRisk(meters[key]);
          return <div key={key}>
            <div className="flex items-baseline justify-between gap-2"><h3 className="text-xl">{label}</h3><strong className="font-mono text-2xl">{meters[key]} / 100</strong></div>
            <div className="meter-track mt-1 bg-muted" role="meter" aria-label={label} aria-valuenow={meters[key]} aria-valuemin={0} aria-valuemax={100}><div className={`meter-fill ${risk === "stable" ? "bg-primary" : "bg-destructive"}`} style={{ width: `${meters[key]}%` }} /></div>
            <p role={risk !== "stable" ? "alert" : undefined} className={`mt-2 text-sm ${risk !== "stable" ? "font-bold text-destructive" : "text-muted-foreground"}`}>{risk === "critical" ? `CRITICAL — ${warning}` : risk === "warning" ? `AT RISK — ${warning}` : "Stable"} {failure} at 0.</p>
          </div>;
        })}
        <div>
          <h3 className="text-xl">Ministerial visit · {confirmed}/4 confirmed</h3>
          <p className="mb-2 text-sm text-muted-foreground">Arrival: Day {LAST_DAY} · {Math.max(0, LAST_DAY - day)} days remaining</p>
          <ul className="space-y-1 text-sm">{(Object.entries(VISIT_TASKS) as [VisitTask, string][]).map(([key, label]) => <li key={key} className={visit[key] ? "text-primary" : "text-destructive"}>{visit[key] ? "✓" : "!"} {label} — {visit[key] ? "confirmed" : "unconfirmed"}</li>)}</ul>
          {confirmed < 4 && <p className="mt-2 text-sm font-bold text-destructive">Cancellation risk: essential arrangements incomplete.</p>}
        </div>
      </div>
      <details className="border-t border-border px-3 py-2" open>
        <summary className="cursor-pointer font-bold">Decision & outcome ledger ({goodwillHistory.length})</summary>
        <div className="mt-2 max-h-64 overflow-y-auto">
          {goodwillHistory.length === 0 ? <p className="text-sm text-muted-foreground">No decisions recorded yet. Opening HQ: 55 · Host: 50.</p> : <ol className="divide-y divide-border">{[...goodwillHistory].reverse().map((change, index) => <li key={index} className="py-2 text-sm">
            <div className="flex flex-wrap justify-between gap-2"><strong>D{change.day} {formatClock(change.time)} · {change.kind} · {change.source}</strong><span className="flex gap-3 font-mono">{([{ key: "confidence", label: "HQ" }, { key: "goodwill", label: "Host" }] as const).map(({ key, label }) => {
              const delta = change.after[key] - change.before[key];
              return <span key={key} className={delta < 0 ? "text-destructive" : delta > 0 ? "text-primary" : "text-muted-foreground"}>{label} {delta > 0 ? "+" : ""}{delta} ({change.before[key]} → {change.after[key]})</span>;
            })}</span></div>
            <p className="mt-1">{change.text}</p>
          </li>)}</ol>}
        </div>
      </details>
    </section>
  );
}