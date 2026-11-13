import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ACTION_LABELS, formatClock, type Action } from "../rules";
import { inboxFor, useGame } from "../store";

/** Capital's instructions only arrive on the secure fax in the embassy office. */
export const isFax = (from: string) => from.startsWith("Capital");

export function Mailbox({ channel }: { channel: "mail" | "fax" }) {
  const g = useGame();
  const [openId, setOpenId] = useState<string | null>(null);
  const bucket = Math.floor(g.minute / 5);
  const inbox = useMemo(() => inboxFor(g.day, g.minute, g.handled).filter((e) => (channel === "fax") === isFax(e.from)).reverse(), [g.day, bucket, g.handled, channel]); // eslint-disable-line react-hooks/exhaustive-deps
  const open = inbox.find((e) => e.id === openId) ?? inbox.find((e) => !e.status);
  const scheduled = (id: string) => g.pending.some((p) => p.emailId === id);
  return (
    <div className="grid min-h-[50vh] gap-0 md:grid-cols-[240px_1fr]">
      <ul className="inbox-list max-h-[60vh] overflow-y-auto border-r border-border bg-card">
        {inbox.length === 0 && <li className="p-4 text-sm italic text-muted-foreground">{channel === "fax" ? "The fax machine hums. Nothing." : "Suspiciously quiet."}</li>}
        {inbox.map((e) => (
          <li key={e.id}>
            <Button variant="ghost" onClick={() => setOpenId(e.id)} className={`w-full border-b border-border px-3 py-2 text-left text-sm ${open?.id === e.id ? "bg-muted" : ""}`}>
              <div className={`truncate ${e.status ? "text-muted-foreground" : "font-semibold"}`}>{e.subject}</div>
              <div className="truncate text-xs text-muted-foreground">{e.from}</div>
            </Button>
          </li>
        ))}
      </ul>
      <div className="cable-reader overflow-y-auto p-4">
        {open ? (
          <article>
            <p className="font-mono text-xs uppercase text-muted-foreground">From: {open.from} · Day {open.day}, {formatClock(open.time)}</p>
            <h3 className="mt-2 text-2xl font-bold">{open.subject}</h3>
            <pre className="mt-3 whitespace-pre-wrap font-mono text-sm">{open.body}</pre>
            <div className="mt-4 border-t border-dashed border-border pt-3">
              {open.status ? <span className="stamp animate-stamp">{open.status === "ignored" ? "Escalated" : ACTION_LABELS[open.status as Action]}</span> : (
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(open.options) as Action[]).map((a) => <Button key={a} disabled={scheduled(open.id)} variant="outline" onClick={() => { setOpenId(open.id); g.answer(open.id, a); }}>{ACTION_LABELS[a]} · 1 DP</Button>)}
                  <span className="self-center text-xs text-muted-foreground">{scheduled(open.id) ? "Reply scheduled for this round" : "Unanswered instructions resolve at round end"}</span>
                </div>
              )}
            </div>
          </article>
        ) : <p className="italic text-muted-foreground">Nothing to read.</p>}
      </div>
    </div>
  );
}
