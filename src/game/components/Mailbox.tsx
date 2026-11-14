import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACTION_LABELS, formatClock, type Action } from "../rules";
import { inboxFor, useGame } from "../store";
import { decisionCash, money } from "../economy";
import choiceLabels from "../data/mail-choices.json";

/** Capital's instructions only arrive on the secure fax in the embassy office. */
export const isFax = (from: string) => from.startsWith("Capital");

export function Mailbox({ channel, singlePane = false }: { channel: "mail" | "fax"; singlePane?: boolean }) {
  const g = useGame();
  const [openId, setOpenId] = useState<string | null>(null);
  const bucket = Math.floor(g.minute / 5);
  const inbox = useMemo(() => inboxFor(g.day, g.minute, g.handled).filter((e) => (channel === "fax") === isFax(e.from)).reverse(), [g.day, bucket, g.handled, channel]); // eslint-disable-line react-hooks/exhaustive-deps
  const open = inbox.find((e) => e.id === openId) ?? (singlePane ? undefined : inbox.find((e) => !e.status));
  const scheduled = (id: string) => g.pending.some((p) => p.emailId === id);
  return (
    <div className={singlePane ? "phone-mailbox" : "grid min-h-[50vh] gap-0 md:grid-cols-[240px_1fr]"}>
      {singlePane && <div className="flex items-center gap-3 border-b border-border pb-3">
        {open ? <Button variant="outline" size="sm" onClick={() => setOpenId(null)}><ArrowLeft className="size-4" />Back to inbox</Button> : <h3 className="text-xl">Inbox</h3>}
        <span className="ml-auto text-sm text-muted-foreground">{inbox.length} messages</span>
      </div>}
      {(!singlePane || !open) && <ul aria-label="Inbox messages" className={singlePane ? "inbox-list bg-card" : "inbox-list max-h-[60vh] overflow-y-auto border-r border-border bg-card"}>
        {inbox.length === 0 && <li className="p-4 text-sm italic text-muted-foreground">{channel === "fax" ? "The fax machine hums. Nothing." : "Suspiciously quiet."}</li>}
        {inbox.map((e) => (
          <li key={e.id}>
            <Button variant="ghost" onClick={() => setOpenId(e.id)} className={`block h-auto w-full min-w-0 whitespace-normal border-b border-border px-3 py-3 text-left text-sm ${open?.id === e.id ? "bg-muted" : ""}`}>
              <div className={`truncate ${e.status ? "text-muted-foreground" : "font-semibold"}`}>{e.subject}</div>
              <div className="truncate text-xs text-muted-foreground">{e.from}</div>
            </Button>
          </li>
        ))}
      </ul>}
      {(!singlePane || open) && <div className={`cable-reader min-w-0 p-4 ${singlePane ? "phone-mail-reader" : "overflow-y-auto"}`}>
        {open ? (
          <article>
            <p className="font-mono text-xs uppercase text-muted-foreground">From: {open.from} · Day {open.day}, {formatClock(open.time)}</p>
            <h3 className="mt-2 text-2xl font-bold">{open.subject}</h3>
            <pre className="mt-3 whitespace-pre-wrap font-mono text-sm">{open.body}</pre>
            <div className="mt-4 border-t border-dashed border-border pt-3">
              {open.status ? <span className="stamp animate-stamp">{open.status === "ignored" ? "Escalated" : ACTION_LABELS[open.status as Action]}</span> : (
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(open.options) as Action[]).map((a) => {
                    const outcome = open.options[a];
                    if (!outcome) return null;
                    const cost = decisionCash({ id: open.id, kind: "email", source: open.subject, text: outcome.text, effects: outcome.effects });
                    const label = (choiceLabels as Record<string, Partial<Record<Action, string>>>)[open.id]?.[a] ?? ACTION_LABELS[a];
                    return <Button key={a} disabled={scheduled(open.id)} variant="outline" className="h-auto whitespace-normal py-2 text-left" onClick={() => { setOpenId(open.id); g.answer(open.id, a); }}>{label} · 1 DP{cost > 0 ? ` · ${money(cost)}` : ""}</Button>;
                  })}
                  <span className="self-center text-xs text-muted-foreground">{scheduled(open.id) ? "Reply scheduled for this round" : "Unanswered instructions resolve at round end"}</span>
                </div>
              )}
              {g.planError && <p role="alert" className="mt-2 text-sm text-destructive">{g.planError}</p>}
            </div>
          </article>
        ) : <p className="italic text-muted-foreground">Nothing to read.</p>}
      </div>}
    </div>
  );
}
