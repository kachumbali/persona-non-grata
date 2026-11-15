import { topicsFor } from "./dialogues";
import { describe, expect, it } from "vitest";
import { dueInvitations } from "./calendar";
import { campaign, locationStories, type StoryChoice, type StoryEvent } from "./rules";
import { inboxFor, useGame } from "./store";
import { workOnMissionSteps } from "./test-support";

const character = { title: "Mx", name: "Player", portrait: "diplomat-1", bio: "", traits: [] };
const preferred: Record<string, string> = {
  invitation: "delegate",
  rivalry: "mediate",
  supplier: "check",
  "seating-complaint": "apologise",
  elise: "useful",
  cookies: "joke",
  press: "honest",
};
const leadChoices: Record<string, string> = {
  "supplier-followup": "transparent",
  "seating-apology-followup": "compromise",
  "development-beneficiaries-followup": "voices",
  "press-honest-followup": "background",
  "asteria-coffee-delegated-followup": "compromise",
};

/** Queue the same choice and staff/time cost as the interruption screen. */
function respondToStory(event: StoryEvent, choice: StoryChoice) {
  const worker = choice.worker ?? (event.id === "invitation" ? undefined : event.npc);
  const timeCost =
    choice.replace || event.id === "rivalry"
      ? 2
      : choice.worker
        ? 0
        : event.id === "invitation" && choice.id === "decline"
          ? 0
          : 1;
  return useGame.getState().queue(
    {
      id: `event-${event.id}`,
      kind: "event",
      source: event.title,
      text: choice.result ?? "Resolved",
      effects: choice.effects ?? {},
      eventId: event.id,
      eventChoice: choice.id,
      worker,
      partner: event.id === "rivalry" ? "anselm" : undefined,
      trust: choice.trust,
      pair: choice.pair,
      flag: choice.flag,
      score: choice.score,
      overload: true,
      playerSlot: choice.replace,
      timeCost,
    },
    choice.replace,
  );
}

describe("full-posting paths", () => {
  it.each([
    { approach: "attend", traits: [] },
    { approach: "decline", traits: [] },
    { approach: "delegate", traits: [] },
    { approach: "decline", traits: ["namedrop", "cuisine"] },
    { approach: "decline", traits: ["replyall"] },
    { approach: "decline", traits: ["liver", "cuisine"] },
  ] as const)(
    "can prepare the visit with $approach invitations and $traits",
    ({ approach, traits }) => {
      useGame.getState().start({ ...character, traits: [...traits] });
      const traitId = (traits as readonly string[]).includes("namedrop")
        ? "namedrop"
        : (traits as readonly string[]).includes("replyall")
          ? "replyall"
          : (traits as readonly string[]).includes("liver")
            ? "liver"
            : undefined;
      const moments = campaign()
        .characters.filter((person) => person.location === "embassy")
        .flatMap((person) =>
          topicsFor(person.id).flatMap((topic) =>
            Object.values(topic.nodes).flatMap((node) =>
              node.choices
                .filter((choice) => choice.requiresTrait === traitId && traitId)
                .map((choice) => ({ person, topic, choice })),
            ),
          ),
        );
      let momentsHit = 0;
      const errors: string[] = [];
      for (let turn = 0; turn < 60; turn++) {
        let s = useGame.getState();
        if (s.ending) break;
        const beforeTurn = s.turn;
        const meeting = dueInvitations(s.day, s.block, s.storyOutcomes)[0];
        const destination = approach === "attend" && meeting ? meeting.location : "embassy";
        if (s.location !== destination && !s.move(destination))
          errors.push(`travel D${s.day}: ${useGame.getState().planError}`);
        s = useGame.getState();
        const event = s.events[s.block];
        if (event && !event.relationshipGate && !s.completedEvents.includes(event.id)) {
          const choice =
            event.choices.find((item) => item.id === preferred[event.id]) ?? event.choices[0];
          if (choice && !respondToStory(event, choice))
            errors.push(`story ${event.id}: ${useGame.getState().planError}`);
        }
        s = useGame.getState();
        for (const email of inboxFor(s.day, s.minute, s.handled)) {
          // Capital instructions are available only at the embassy's secure fax.
          if (!email.status && (s.location === "embassy" || !email.from.startsWith("Capital")))
            useGame.getState().answer(email.id, "reply");
        }
        if (traitId && momentsHit < 5) {
          const moment = moments[momentsHit];
          if (
            moment &&
            useGame.getState().queue({
              id: `trait-test-${momentsHit}`,
              kind: "dialogue",
              source: moment.topic.id,
              text: moment.choice.result ?? "",
              effects: moment.choice.effects ?? {},
              timeCost: 1,
              worker: moment.person.id,
              trust: moment.choice.trust,
              traitChoice: traitId,
              overload: true,
            })
          )
            momentsHit++;
        }
        s = useGame.getState();
        // The mission is worked step by step as each one opens, by colleagues with the skill.
        workOnMissionSteps();
        s = useGame.getState();
        for (const invitation of dueInvitations(s.day, s.block, s.storyOutcomes)) {
          const choice = invitation.choices[approach];
          const workers =
            approach === "delegate" ? ["pavel", "sola", "maxim", "ines"] : [undefined];
          const queued = workers.some((worker) =>
            useGame.getState().queue({
              id: `invitation-${invitation.id}`,
              kind: "event",
              source: invitation.title,
              text: choice.text,
              effects: choice.effects,
              timeCost: choice.timeCost,
              cashCost: choice.cashCost,
              eventId: invitation.id,
              eventChoice: approach,
              worker,
              overload: approach === "delegate",
              location: approach === "attend" ? invitation.location : undefined,
              contact: invitation.contact,
              contactTrust: choice.contactTrust,
            }),
          );
          if (!queued) errors.push(`invitation ${invitation.id}: ${useGame.getState().planError}`);
        }
        if (approach === "delegate") {
          s = useGame.getState();
          const lead = locationStories(s.day, s.completedEvents, s.storyOutcomes).find(
            (item) => leadChoices[item.id],
          );
          if (lead?.location && s.move(lead.location)) {
            const choice = lead.choices.find((item) => item.id === leadChoices[lead.id]);
            if (choice)
              useGame.getState().queue({
                id: `event-${lead.id}`,
                kind: "event",
                source: lead.title,
                text: choice.result ?? "Resolved",
                effects: choice.effects ?? {},
                eventId: lead.id,
                eventChoice: choice.id,
                worker: lead.npc,
                trust: choice.trust,
                flag: choice.flag,
                score: choice.score,
                timeCost: 1,
                location: lead.location,
              });
          }
        }
        useGame.getState().advance();
        if (useGame.getState().turn === beforeTurn)
          throw new Error(
            `Turn did not advance: ${useGame.getState().planError}; ${errors.join("; ")}`,
          );
      }
      const final = useGame.getState();
      expect({ day: final.day, ending: final.ending }).toMatchObject({
        day: 15,
        ending: expect.stringMatching(/promoted|ambassador/),
      });
      // This simulation never opens the press review, so it exercises the optional path.
      expect(final.pressSeen).toEqual([]);
      expect(final.goodwillHistory.some((entry) => entry.source === "Fuel quay")).toBe(true);
      expect(errors).toEqual([]);
      if (traitId) expect(momentsHit).toBeGreaterThanOrEqual(5);
      expect(Object.values(final.visit).filter(Boolean)).toHaveLength(4);
      expect(
        Object.values(final.storyOutcomes).filter((result) => result.choice === approach).length,
      ).toBeGreaterThanOrEqual(5);
      if (approach === "delegate")
        expect(
          final.goodwillHistory.some((entry) =>
            [
              "Reception procurement",
              "Protocol seating",
              "Press coverage",
              "Development project",
            ].includes(entry.source),
          ),
        ).toBe(true);
      expect(final.economy.funds).toBeGreaterThanOrEqual(0);
      expect(
        campaign().events.filter(
          (event) => !event.relationshipGate && final.storyOutcomes[event.id]?.status === "missed",
        ),
      ).toEqual([]);
    },
  );
});
