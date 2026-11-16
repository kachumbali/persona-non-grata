import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Mail, Smartphone, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { blocks } from "../rules";
import { dueInvitations } from "../calendar";
import { availableFunds, money, playerTime, playerCapacity } from "../economy";
import { useGame } from "../store";
import { Mailbox } from "./Mailbox";
import { DiplomaticCalendar } from "./DiplomaticCalendar";
import { PostingBriefing } from "./PostingBriefing";
import { Agenda, CommitmentLine } from "./Agenda";
import { agendaItems } from "../agenda";
import { badgeLabel, ignoredAtBlockEnd, waitingItems, countNoun, type Device } from "../inbox";
import { useUi } from "../ui";
import { WaitingBadge } from "./WaitingBadge";
import { activeChapter } from "../chapters";

const DEVICE_NAMES: Record<Device, string> = {
  fax: "Secure fax",
  pc: "PC mail",
  blackberry: "BlockBerry mail",
};

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
export function BlackBerry({ onOpenPress }: { onOpenPress?: () => void }) {
  const g = useGame();
  const [up, setUp] = useState(false);
  const [tab, setTab] = useState<"status" | "mail" | "calendar">("status");
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const urgent = agendaItems(g, activeChapter()).filter(
    (i) => i.urgent && i.day === g.day && i.block === g.block,
  );
  const waiting = waitingItems(g, activeChapter());
  const ignored = ignoredAtBlockEnd(waiting);
  const away = g.location !== "embassy";
  // What the phone can show: its own mail, and (away from the office) a reminder about the fax.
  const phoneUrgent = waiting.blackberry.urgent.length + (away ? waiting.fax.urgent.length : 0);
  const phoneUnread = waiting.blackberry.unread.length + (away ? waiting.fax.unread.length : 0);
  const phoneLabel = badgeLabel("blackberry", phoneUrgent, phoneUnread);
  const faxAway = away && waiting.fax.urgent.length + waiting.fax.unread.length > 0;
  const request = useUi((u) => u.request);
  useEffect(() => {
    if (request?.target === "phone-mail" || request?.target === "phone-diary") {
      setUp(true);
      setTab(request.target === "phone-mail" ? "mail" : "calendar");
      setBriefingOpen(false);
      useUi.getState().clear();
    }
  }, [request]);
  const capacity = playerCapacity(g.character, g.energy, g.composure, g.alcohol, g.hangover);
  const used = g.pending.reduce((n, p) => n + playerTime(p), 0);
  const left = Math.max(0, capacity.total - used);
  const block = blocks()[g.block] ?? blocks()[0];
  const due = dueInvitations(g.day, g.block, g.storyOutcomes).some(
    (invitation) => !g.pending.some((p) => p.eventId === invitation.id),
  );
  return (
    <>
      {up && (
        <section className="bb-popup" data-mail={tab === "mail"} aria-label="BlockBerry">
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
              onClick={() => {
                setTab("mail");
                setBriefingOpen(false);
              }}
            >
              Mail
              <WaitingBadge
                className="ml-1"
                urgent={phoneUrgent}
                unread={phoneUnread}
                label={phoneLabel}
              />
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
                {g.block === 0 && g.pressDay === g.day && onOpenPress && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onOpenPress();
                      setUp(false);
                    }}
                  >
                    Press review {g.pressRead ? "· read" : "· unread"}
                  </Button>
                )}
                {faxAway && (
                  <p>A fax from Capital is waiting. It can only be read at the embassy.</p>
                )}
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
                          <CommitmentLine decision={p} />
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
              <div className="space-y-4">
                <Agenda />
                <DiplomaticCalendar />
              </div>
            ) : briefingOpen ? (
              <div className="space-y-3">
                <Button size="sm" variant="outline" onClick={() => setBriefingOpen(false)}>
                  <ArrowLeft className="size-4" /> Back to inbox
                </Button>
                <PostingBriefing />
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="h-auto w-full justify-start whitespace-normal text-left"
                  onClick={() => setBriefingOpen(true)}
                >
                  <Mail className="size-4 shrink-0" />
                  <span>Posting briefing · Welcome to your posting</span>
                </Button>
                {faxAway && (
                  <p className="text-sm">
                    A fax from Capital is waiting. It can only be read at the embassy.
                  </p>
                )}
                {away ? (
                  <Mailbox channel="mail" singlePane />
                ) : (
                  <p className="text-sm">You're in the office. Use your PC for other mail.</p>
                )}
              </div>
            )}
          </div>
        </section>
      )}
      <AlertDialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Still awaiting a response</AlertDialogTitle>
            <AlertDialogDescription>
              {urgent.length > 0 && "These appointments will go unanswered if you end the block. "}
              {ignored.length > 0 &&
                "Mail still unanswered will be marked ignored at the end of this block."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {urgent.length > 0 && (
            <ul aria-label="Unanswered appointments">
              {urgent.map((i) => (
                <li key={i.id}>
                  {i.what} · {i.where}
                </li>
              ))}
            </ul>
          )}
          {ignored.length > 0 && (
            <ul aria-label="Mail that will be marked ignored">
              {ignored.map(({ device, items }) => (
                <li key={device}>
                  <strong>
                    {DEVICE_NAMES[device]}: {countNoun(device, items.length)}
                  </strong>{" "}
                  · {items.map((m) => m.subject).join("; ")}
                </li>
              ))}
            </ul>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                g.advance();
                setUp(true);
                setTab("status");
              }}
            >
              End the block anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
            aria-label={[
              "BlockBerry phone",
              due ? "invitation awaiting a response" : "",
              phoneLabel,
            ]
              .filter(Boolean)
              .join(" · ")}
          >
            <Smartphone className="size-5" />
            <WaitingBadge urgent={phoneUrgent} unread={phoneUnread} label={phoneLabel} />
            <span className="bb-led" data-on={g.report.length > 0 || !!g.planError || due} />
          </button>
          <Button
            size="sm"
            className="retro-button"
            onClick={() => {
              if (urgent.length || ignored.length) setConfirmEnd(true);
              else {
                g.advance();
                setUp(true);
                setTab("status");
              }
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
