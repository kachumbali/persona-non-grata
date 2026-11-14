import { eligible, gateLabel } from "../character";
import { computeStats } from "../rules";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { capacityLedger, decisionCash, money, staffDuty } from "../economy";
import { CAMPAIGN, locationStories, type StoryChoice } from "../rules";
import { useGame } from "../store";

/** An active lead is encountered at its location and resolves with the block. */
export function LocationLead() {
  const g = useGame();
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [overload, setOverload] = useState(false);
  const leads = locationStories(g.day, g.completedEvents, g.storyOutcomes).filter(
    (lead) => lead.location === g.location,
  );
  const event = leads.find((lead) => lead.id === selectedId) ?? leads[0];
  if (!event) return null;
  const staffIds = [
    ...new Set([
      ...event.choices.flatMap((choice) => (choice.staff ? [choice.staff] : [])),
      ...(CAMPAIGN.characters.some(
        (person) => person.id === event.npc && person.location === "embassy",
      )
        ? [event.npc]
        : []),
    ]),
  ];
  const queued = g.pending.some((p) => p.eventId === event.id);
  const choose = (choice: StoryChoice) => {
    const ok = g.queue({
      id: `event-${event.id}`,
      kind: "event",
      source: event.title,
      text: choice.result ?? "The matter is settled.",
      effects: choice.effects ?? {},
      eventId: event.id,
      eventChoice: choice.id,
      flag: choice.flag,
      score: choice.score,
      contact: choice.contact,
      contactTrust: choice.contactTrust,
      worker: event.npc,
      partner: choice.staff,
      pairTarget: choice.pairTarget,
      formal: choice.formal,
      traitChoice: choice.requiresTrait,
      cashCost: choice.cashCost,
      overload,
      trust: choice.trust,
      pair: choice.pair,
      timeCost: 1,
      location: event.location,
    });
    setNotice(
      ok
        ? "Decision scheduled. It takes effect at the end of this block."
        : useGame.getState().planError,
    );
  };
  const hotspot =
    g.location === "embassy"
      ? { left: "38%", top: "5%", width: "20%", height: "16%" }
      : g.location === "eu"
        ? { left: "68%", top: "17%", width: "17%", height: "25%" }
        : g.location === "un"
          ? { left: "69%", top: "19%", width: "17%", height: "27%" }
          : g.location === "pressclub"
            ? { left: "70%", top: "18%", width: "17%", height: "26%" }
            : g.location === "ministry"
              ? { left: "18%", top: "42%", width: "18%", height: "25%" }
              : { left: "73%", top: "39%", width: "14%", height: "25%" };
  return (
    <>
      <button
        type="button"
        className="scene-hotspot"
        style={hotspot}
        onClick={() => {
          setNotice("");
          setOpen(true);
        }}
        aria-label={`Follow up: ${event.title}`}
      >
        <span className="map-label">
          {g.location === "ministry"
            ? "Protocol desk"
            : g.location === "pressclub"
              ? "Press board"
              : g.location === "un"
                ? "Programme board"
                : g.location === "eu"
                  ? "Coordination board"
                  : "Follow lead"}
        </span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="retro-builder max-h-[90vh] max-w-lg overflow-y-auto bg-card p-0 text-card-foreground">
          <DialogTitle className="retro-titlebar">{event.title}</DialogTitle>
          <div className="p-4">
            {leads.length > 1 && (
              <div className="mb-3 flex flex-wrap gap-1" aria-label="Available leads">
                {leads.map((lead) => (
                  <Button
                    key={lead.id}
                    size="sm"
                    variant={lead.id === event.id ? "secondary" : "outline"}
                    aria-pressed={lead.id === event.id}
                    onClick={() => {
                      setSelectedId(lead.id);
                      setNotice("");
                      setOverload(false);
                    }}
                  >
                    {lead.title}
                  </Button>
                ))}
              </div>
            )}
            <DialogDescription className="mb-3 text-foreground">{event.text}</DialogDescription>
            {staffIds.length > 0 && (
              <div className="mb-3 text-xs">
                {staffIds.map((id) => {
                  const row = capacityLedger(g.pending, g.block).find((entry) => entry.id === id);
                  const person = CAMPAIGN.characters.find((entry) => entry.id === id);
                  return (
                    <p key={id}>
                      {person?.name ?? id}: {staffDuty(id)} · {row?.baseline ?? 0} routine,{" "}
                      {row?.used ?? 0} assigned, {row?.free ?? 0} free staff DP.
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
            {queued ? (
              <p role="status">Decision scheduled. It takes effect at the end of this block.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {event.choices
                  .filter((choice) =>
                    eligible(
                      choice,
                      g.character?.traits ?? [],
                      computeStats(g.character?.traits ?? []),
                    ),
                  )
                  .map((choice) => {
                    const cost = decisionCash({
                      id: event.id,
                      kind: "event",
                      source: event.title,
                      text: choice.result ?? "",
                      effects: choice.effects ?? {},
                      cashCost: choice.cashCost,
                    });
                    return (
                      <Button
                        key={choice.id}
                        variant="outline"
                        className="h-auto justify-start whitespace-normal py-2 text-left"
                        onClick={() => choose(choice)}
                      >
                        ▸ {gateLabel(choice)}
                        {choice.label} · 1 DP
                        {[
                          ...new Set([
                            ...(staffIds.includes(event.npc) ? [event.npc] : []),
                            ...(choice.staff ? [choice.staff] : []),
                          ]),
                        ]
                          .map(
                            (id) =>
                              ` · ${CAMPAIGN.characters.find((person) => person.id === id)?.name ?? id}: 2 staff DP`,
                          )
                          .join("")}
                        {cost > 0 ? ` · ${money(cost)}` : ""}
                      </Button>
                    );
                  })}
              </div>
            )}
            {notice && !queued && (
              <p role="status" className="mt-2 text-sm">
                {notice}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
