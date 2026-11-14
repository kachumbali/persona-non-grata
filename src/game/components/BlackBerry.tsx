import { useState } from "react";
import { ArrowRight, Smartphone, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BLOCKS } from "../rules";
import { dueInvitations } from "../calendar";
import { availableFunds, decisionCash, money, playerTime, playerCapacity } from "../economy";
import { useGame } from "../store";
import { Mailbox } from "./Mailbox";
import { DiplomaticCalendar } from "./DiplomaticCalendar";

function Orb({ label, value, kind }: { label: string; value: number; kind: "hq" | "host" }) {
  return (
    <div className="hud-orb-wrap" title={`${label} goodwill ${value}/100`}>
      <div className="hud-orb" data-kind={kind} data-low={value <= 25}>
        <div className="hud-orb-fill" style={{ height: `${Math.max(0, Math.min(100, value))}%` }} />
        <span className="hud-orb-value">{value}</span>
      </div>
      <span className="hud-label">{label}</span>
    </div>
  );
}

/** Diablo-style bottom resource bar with the BlockBerry built in: DP, money, goodwill, phone and End block. */
export function BlackBerry() {
  const g = useGame();
  const [up, setUp] = useState(false);
  const [tab, setTab] = useState<"status" | "mail" | "calendar">("status");
  const capacity = playerCapacity(g.character, g.energy, g.composure, g.alcohol, g.hangover);
  const used = g.pending.reduce((n, p) => n + playerTime(p), 0);
  const left = Math.max(0, capacity.total - used);
  const block = BLOCKS[g.block] ?? BLOCKS[0];
  const due = dueInvitations(g.day, g.block, g.storyOutcomes).some(
    (invitation) => !g.pending.some((p) => p.eventId === invitation.id),
  );
  const away = g.location !== "embassy";
  return (
    <>
      {up && (
        <section className="bb-popup" data-mail={tab === "mail" && away} aria-label="BlockBerry">
          <div className="mb-2 flex flex-wrap items-center gap-1 text-primary-foreground">
            <strong className="mr-auto font-mono text-accent">BlockBerry</strong>
            <Button
              size="sm"
              variant={tab === "status" ? "secondary" : "ghost"}
              onClick={() => setTab("status")}
            >
              Status
            </Button>
            <Button
              size="sm"
              variant={tab === "calendar" ? "secondary" : "ghost"}
              onClick={() => setTab("calendar")}
            >
              Diary
            </Button>
            <Button
              size="sm"
              variant={tab === "mail" ? "secondary" : "ghost"}
              onClick={() => setTab("mail")}
            >
              Mail
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              aria-label="Put phone away"
              onClick={() => setUp(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
          <div className="bb-screen">
            {tab === "status" ? (
              <div className="space-y-2 text-sm">
                <p className="font-mono">
                  HQ {g.meters.confidence} · Host {g.meters.goodwill} · Morale {g.meters.morale} ·
                  Sanity {g.meters.sanity}
                </p>
                <p className="font-mono">
                  Energy {g.energy} · Composure {g.composure} · Alcohol {g.alcohol} · Standing{" "}
                  {g.score}
                </p>
                <p className="text-xs">
                  DP this block: base 4
                  {capacity.factors.length
                    ? ` · ${capacity.factors.join(" · ")}`
                    : " · no modifiers"}{" "}
                  (min 2, max 5)
                </p>
                <div>
                  <strong>Committed this {block.name.toLowerCase()}</strong>
                  {g.pending.length === 0 && (
                    <p className="text-muted-foreground">Nothing planned. Idle time is noticed.</p>
                  )}
                  <ul>
                    {g.pending.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-1 border-b border-border py-0.5"
                      >
                        <span>
                          {p.source} · {playerTime(p)} DP · {money(decisionCash(p))}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          aria-label={`Remove ${p.source}`}
                          onClick={() => g.removeDecision(p.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
                {g.planError && (
                  <p role="alert" className="text-destructive">
                    {g.planError}
                  </p>
                )}
                {g.report.length > 0 && (
                  <details open>
                    <summary className="cursor-pointer font-bold">
                      Last round · {g.report.length} items
                    </summary>
                    <ul className="max-h-40 overflow-y-auto">
                      {g.report.map((r, i) => (
                        <li key={i}>• {r.text}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ) : tab === "calendar" ? (
              <DiplomaticCalendar />
            ) : away ? (
              <Mailbox channel="mail" singlePane />
            ) : (
              <p className="text-sm">You're in the office. Use your PC for mail.</p>
            )}
          </div>
        </section>
      )}
      <footer className="hud-bar" aria-label="Resources">
        <Orb label="HQ" value={g.meters.confidence} kind="hq" />
        <div className="hud-center">
          <div className="hud-slot" aria-label={`${left} of ${capacity.total} Diplo-Points left`}>
            <span className="hud-label">DP</span>
            {Array.from({ length: capacity.total }, (_, i) => (
              <span key={i} className="hud-gem" data-on={i < left} />
            ))}
            <span className="font-mono text-lg">
              {left}/{capacity.total}
            </span>
          </div>
          <div className="hud-slot">
            <span className="hud-label">Funds</span>
            <span className="font-mono text-lg">{money(availableFunds(g.economy, g.pending))}</span>
          </div>
          <div className="hud-slot">
            <span className="hud-label">Day {g.day}</span>
            <span className="font-mono text-lg">{block.name}</span>
          </div>
          <button
            type="button"
            className="hud-phone"
            onClick={() => setUp(!up)}
            aria-expanded={up}
            aria-label={
              due ? "BlockBerry phone · invitation awaiting a response" : "BlockBerry phone"
            }
          >
            <Smartphone className="size-5" />
            <span className="bb-led" data-on={g.report.length > 0 || !!g.planError || due} />
          </button>
          <Button
            size="sm"
            className="retro-button"
            onClick={() => {
              g.advance();
              setUp(true);
              setTab("status");
            }}
          >
            End {block.name.toLowerCase()} <ArrowRight className="size-4" />
          </Button>
        </div>
        <Orb label="Host" value={g.meters.goodwill} kind="host" />
      </footer>
    </>
  );
}
