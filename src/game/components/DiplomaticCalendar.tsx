import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  INVITATIONS,
  visibleInvitations,
  type Invitation,
  type InvitationResponse,
} from "../calendar";
import { capacityLedger, money, playerCapacity, staffDuty } from "../economy";
import { BLOCKS, CAMPAIGN, locationStories, type StoryEvent } from "../rules";
import { useGame } from "../store";

export function DiplomaticCalendar() {
  const g = useGame();
  const [worker, setWorker] = useState("");
  const [overload, setOverload] = useState(false);
  const [notice, setNotice] = useState("");
  const scheduled = g.events[g.block];
  const currentStory =
    scheduled &&
    !(CAMPAIGN.events as StoryEvent[]).find((event) => event.id === scheduled.id)?.location
      ? scheduled
      : undefined;
  const leads = locationStories(g.day, g.completedEvents, g.storyOutcomes);
  const invitations = visibleInvitations(g.day, g.block, g.storyOutcomes);
  const colleague = capacityLedger(
    g.pending,
    g.block,
    playerCapacity(g.character, g.energy, g.composure, g.alcohol, g.hangover).total,
  ).find((row) => row.id === worker);
  const choose = (invitation: Invitation, response: InvitationResponse) => {
    const choice = invitation.choices[response];
    if (invitation.day !== g.day || invitation.block !== g.block) {
      setNotice("Respond during the scheduled block.");
      return;
    }
    if (response === "attend" && g.location !== invitation.location) {
      setNotice("Travel to the venue before scheduling your attendance. Travel costs DP.");
      return;
    }
    if (response === "delegate" && !worker) {
      setNotice("Choose a colleague to represent the mission.");
      return;
    }
    const ok = g.queue({
      id: `invitation-${invitation.id}`,
      kind: "event",
      eventId: invitation.id,
      eventChoice: response,
      source: invitation.title,
      text: choice.text,
      effects: choice.effects,
      contact: invitation.contact,
      contactTrust: choice.contactTrust,
      timeCost: choice.timeCost,
      cashCost: choice.cashCost,
      worker: response === "delegate" ? worker : undefined,
      overload: response === "delegate" && overload,
      location: response === "attend" ? invitation.location : undefined,
    });
    setNotice(
      ok
        ? "Response scheduled. It resolves at the end of this block."
        : useGame.getState().planError,
    );
  };
  return (
    <div className="space-y-3 text-sm" aria-label="Diplomatic calendar">
      {currentStory && !g.completedEvents.includes(currentStory.id) && (
        <section className="border border-border p-2" aria-label="Current side story">
          <h3 className="font-bold">Current side story</h3>
          <p>
            {currentStory.title}
            {g.pending.some((p) => p.eventId === currentStory.id)
              ? " · response scheduled"
              : " · respond before block end"}
          </p>
          <p className="text-xs">Use the on-screen call or its reminder to respond.</p>
        </section>
      )}
      {leads.length > 0 && (
        <section className="border border-border p-2" aria-label="Active story leads">
          <h3 className="font-bold">Story leads</h3>
          {leads.map((lead) => (
            <p key={lead.id}>
              {lead.title} ·{" "}
              {CAMPAIGN.locations.find((place) => place.id === lead.location)?.name ??
                lead.location}
              {g.pending.some((p) => p.eventId === lead.id)
                ? " · response scheduled"
                : " · visit to follow up"}
            </p>
          ))}
        </section>
      )}
      <p>
        Invitations arrive ahead of time. Respond during the scheduled block; unattended invitations
        receive no reply. Travel to the venue before attending.
      </p>
      {invitations.length === 0 && (
        <p className="text-muted-foreground">
          No upcoming invitations. A suspiciously empty diary.
        </p>
      )}
      {invitations.map((invitation) => {
        const now = invitation.day === g.day && invitation.block === g.block;
        const queued = g.pending.some((p) => p.eventId === invitation.id);
        const location =
          CAMPAIGN.locations.find((place) => place.id === invitation.location)?.name ??
          invitation.location;
        return (
          <article key={invitation.id} className="border border-border p-2">
            <h3 className="font-bold">{invitation.title}</h3>
            <p>
              {invitation.host} · {location}
            </p>
            <p className="font-mono text-xs">
              Day {invitation.day} · {BLOCKS[invitation.block]?.name}
              {now ? " · happening now" : ""}
            </p>
            <p className="my-1">{invitation.description}</p>
            {queued ? (
              <p role="status">Response scheduled for this block; change it in your commitments.</p>
            ) : now ? (
              <>
                <label className="block text-xs">
                  Representative{" "}
                  <select
                    className="mt-1 w-full border border-input bg-background p-1"
                    value={worker}
                    onChange={(e) => {
                      setWorker(e.target.value);
                      setOverload(false);
                    }}
                  >
                    <option value="">Choose a colleague to delegate</option>
                    {CAMPAIGN.characters
                      .filter((c) => c.location === "embassy")
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </label>
                {worker && (
                  <p className="mt-1 text-xs">
                    {staffDuty(worker)}: {colleague?.baseline ?? 0} routine · {colleague?.used ?? 0}{" "}
                    assigned · {colleague?.free ?? 0} free staff DP. Representation requires 2 staff
                    DP.
                  </p>
                )}
                {worker && (
                  <label className="my-1 flex gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={overload}
                      onChange={(e) => setOverload(e.target.checked)}
                    />
                    Allow routine duties to be displaced (fatigue and backlog)
                  </label>
                )}
                <div className="mt-2 flex flex-col gap-1">
                  {(["attend", "delegate", "decline"] as InvitationResponse[]).map((response) => {
                    const choice = invitation.choices[response];
                    return (
                      <Button
                        key={response}
                        size="sm"
                        variant="outline"
                        className="h-auto justify-start whitespace-normal py-1 text-left"
                        onClick={() => choose(invitation, response)}
                      >
                        {choice.label} · {choice.timeCost} your DP
                        {response === "delegate" ? " · 2 staff DP" : ""}
                        {choice.cashCost ? ` · ${money(choice.cashCost)}` : ""}
                      </Button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground">
                <p>
                  Respond during this event's block. Travel and other commitments may take time.
                </p>
                <p>
                  Attend: {invitation.choices.attend.timeCost} DP
                  {invitation.choices.attend.cashCost
                    ? ` · ${money(invitation.choices.attend.cashCost)}`
                    : ""}
                  ; delegate: 2 staff DP
                  {invitation.choices.delegate.cashCost
                    ? ` · ${money(invitation.choices.delegate.cashCost)}`
                    : ""}
                  ; decline: {invitation.choices.decline.timeCost} DP.
                </p>
              </div>
            )}
          </article>
        );
      })}
      {notice && (
        <p role="status" className="text-primary">
          {notice}
        </p>
      )}
      {INVITATIONS.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Resolved invitations are recorded in the round report.
        </p>
      )}
    </div>
  );
}
