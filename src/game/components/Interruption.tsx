import { eligible, gateLabel, withInterpreter } from "../character";
import { InterpreterSelect } from "./InterpreterSelect";
import { computeStats } from "../rules";
import { useEffect, useState } from "react";
import { BellRing, DoorOpen, Mail, Phone, Printer, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { campaign, type PendingDecision, type StoryChoice, type StoryEvent } from "../rules";
import { checkQueue, useGame } from "../store";
import { capacityLedger, staffDuty } from "../economy";
import { interruptionView, type InterruptionKind } from "../interruption";
import { Portrait } from "./Portrait";

const ICONS: Record<InterruptionKind, typeof Phone> = {
  call: Phone,
  message: Mail,
  visit: DoorOpen,
  door: UserRound,
  fax: Printer,
};

const dpFor = (eventId: string, c: StoryChoice) =>
  c.replace || eventId === "rivalry"
    ? 2
    : c.worker
      ? 0
      : eventId === "invitation" && c.id === "decline"
        ? 0
        : 1;

/**
 * The store's refusal, with a colleague named by first name instead of by id:
 * "anselm's baseline duties conflict" reads "Anselm's baseline duties conflict".
 */
const displayReason = (reason: string | undefined): string | undefined => {
  if (!reason) return reason;
  const person = campaign().characters.find(
    (c) => reason.startsWith(`${c.id}'s `) || reason.startsWith(`${c.id} has `),
  );
  if (!person) return reason;
  const first = person.name.split(" ")[0] ?? person.name;
  return first + reason.slice(person.id.length);
};

/** Story episodes arrive in the main game as a call, a fax or someone at your door. */
export function Interruption() {
  const g = useGame();
  const event = g.events[g.block];
  const answered = !!event && g.pending.some((p) => p.eventId === event.id);
  const [open, setOpen] = useState(true);
  const [notice, setNotice] = useState("");
  const [overload, setOverload] = useState(false);
  const [interpreter, setInterpreter] = useState("");
  useEffect(() => {
    setOpen(true);
    setNotice("");
    setOverload(false);
  }, [event?.id, g.block, g.day]);
  if (
    !event ||
    (campaign().events as StoryEvent[]).find((entry) => entry.id === event.id)?.location ||
    g.completedEvents.includes(event.id)
  )
    return null;
  const npc = campaign().characters.find((c) => c.id === event.npc);
  const view = interruptionView(event, npc, g.location);
  const Icon = ICONS[view.kind];
  const participants = [
    ...new Set(
      event.choices
        .map((c) => c.worker ?? (event.id === "invitation" ? undefined : event.npc))
        .filter(
          (id): id is string =>
            !!id &&
            campaign().characters.some(
              (person) => person.id === id && person.location === "embassy",
            ),
        ),
    ),
  ];
  const ledger = capacityLedger(g.pending, g.block);

  const decisionFor = (c: StoryChoice): PendingDecision => ({
    id: `event-${event.id}`,
    kind: "event",
    source: event.title,
    text: c.result ?? "Event resolved.",
    effects: c.effects ?? {},
    eventId: event.id,
    eventChoice: c.id,
    worker: c.worker ?? (event.id === "invitation" ? undefined : event.npc),
    partner: event.id === "rivalry" ? "anselm" : undefined,
    pairTarget: c.pairTarget,
    trust: c.trust,
    pair: c.pair,
    flag: c.flag,
    favour: c.favour,
    teaches: c.teaches,
    score: c.score,
    contact: c.contact,
    contactTrust: c.contactTrust,
    formal: c.formal,
    traitChoice: c.requiresTrait,
    languageGate: c.requiresLanguage,
    interpreter:
      c.requiresLanguage && (g.character?.languages?.[c.requiresLanguage.language] ?? 0) === 0
        ? interpreter || undefined
        : undefined,
    counts: c.counts,
    statDrift: c.statDrift,
    overload,
    playerSlot: c.replace,
    timeCost: dpFor(event.id, c),
  });
  // The same checks the store runs on a click, so an option is disabled exactly when it would be refused.
  const options = event.choices
    .filter((c) =>
      eligible(
        c,
        g.character?.traits ?? [],
        computeStats(g.character?.traits ?? [], g.character?.statDrift),
        g.personnel.reputations,
        withInterpreter(c, g.character?.languages, interpreter),
      ),
    )
    .map((c) => ({
      choice: c,
      reason: displayReason(checkQueue(g, decisionFor(c), c.replace).error),
    }));

  const choose = (c: StoryChoice) => {
    const ok = useGame.getState().queue(decisionFor(c), c.replace);
    if (ok) setOpen(false);
    else setNotice(useGame.getState().planError);
  };
  return (
    <>
      {!open && !answered && (
        <Button variant="destructive" className="interrupt-badge" onClick={() => setOpen(true)}>
          <BellRing className="size-4" />
          {event.title}
        </Button>
      )}
      <Dialog open={open && !answered} onOpenChange={setOpen}>
        <DialogContent className="retro-builder max-w-lg bg-card p-0 text-card-foreground">
          <DialogTitle className="retro-titlebar">
            <Icon className="size-5" />
            {view.header}
          </DialogTitle>
          <div className="flex gap-4 p-4">
            {npc && (
              <div className="shrink-0 self-start">
                <Portrait portrait={npc.portrait} size={88} />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-xl text-destructive">{event.title}</h3>
              <DialogDescription className="my-2 text-sm text-foreground">
                {view.text}
              </DialogDescription>
              {participants.length > 0 && (
                <div className="mb-2 text-xs">
                  {participants.map((id) => {
                    const row = ledger.find((entry) => entry.id === id);
                    const name =
                      campaign().characters.find((person) => person.id === id)?.name ?? id;
                    return (
                      <p key={id}>
                        {name}: {staffDuty(id)} · {row?.baseline ?? 0} routine, {row?.used ?? 0}{" "}
                        assigned, {row?.free ?? 0} free staff DP.
                      </p>
                    );
                  })}
                  <label className="mt-1 flex gap-2">
                    <input
                      type="checkbox"
                      checked={overload}
                      onChange={(e) => setOverload(e.target.checked)}
                    />
                    Allow displaced routine work (fatigue and backlog)
                  </label>
                </div>
              )}
              <div className="flex flex-col gap-2">
                {event.choices.some((option) => option.requiresLanguage) && (
                  <InterpreterSelect value={interpreter} onChange={setInterpreter} />
                )}
                {options.map(({ choice: c, reason }) => (
                  <div key={c.id} className="flex flex-col gap-1">
                    <Button
                      variant="outline"
                      disabled={!!reason}
                      aria-describedby={reason ? `option-reason-${c.id}` : undefined}
                      className="h-auto justify-start whitespace-normal py-2 text-left"
                      onClick={() => choose(c)}
                    >
                      ▸ {gateLabel(c)}
                      {c.label} · {dpFor(event.id, c)} DP
                      {participants.includes(
                        c.worker ?? (event.id === "invitation" ? "" : event.npc),
                      )
                        ? " · 2 colleague DP"
                        : ""}
                    </Button>
                    {reason && (
                      <p id={`option-reason-${c.id}`} className="px-1 text-xs text-destructive">
                        {reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {notice && (
                <p role="alert" className="mt-2 text-sm text-destructive">
                  {notice}
                </p>
              )}
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setOpen(false)}>
                Deal with it later (ignored at block end)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
