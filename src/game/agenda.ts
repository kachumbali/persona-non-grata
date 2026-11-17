import type { ChapterPack } from "./chapters";
import { ACTION_LABELS, type PendingDecision } from "./rules";
import { nextStep, stepLabel } from "./mission";
import type { GameState } from "./store";
import { decisionCash, playerTime } from "./economy";
import { statusOf, tick } from "./demarche";
import { LANGUAGE_LEVELS } from "./languages";

export function describeCommitment(decision: PendingDecision, chapter: ChapterPack) {
  const event = chapter.campaign.events.find((e) => e.id === decision.eventId);
  const invitation = chapter.invitations.find((i) => i.id === decision.eventId);
  const mail = chapter.emails.find((e) => e.id === decision.emailId);
  const step = decision.task
    ? chapter.manifest.missionSteps[decision.task]?.find((s) => s.id === decision.step)
    : undefined;
  const demarche = chapter.demarches.instructions.find((d) => d.id === decision.demarcheId);
  const recipient = chapter.campaign.characters.find((c) => c.id === demarche?.recipient);
  const demarcheLocation =
    decision.demarcheRoute === "self"
      ? recipient?.location
      : decision.demarcheRoute === "eu" || decision.demarcheRoute === "coordinate"
        ? "eu"
        : demarche
          ? chapter.manifest.officeLocation
          : undefined;
  const placeId =
    decision.location ??
    invitation?.location ??
    event?.location ??
    demarcheLocation ??
    (step ? chapter.manifest.officeLocation : undefined);
  const place = chapter.campaign.locations.find((l) => l.id === placeId)?.name;
  const venue = chapter.campaign.venues.find((v) => v.id === decision.venue)?.name;
  const names = [decision.worker, decision.partner]
    .filter(Boolean)
    .map((id) => chapter.campaign.characters.find((c) => c.id === id)?.name)
    .filter((name): name is string => !!name);
  const route = step?.routes?.find((r) => r.id === decision.route);
  const action = decision.emailAction && mail?.options[decision.emailAction];
  const choice =
    invitation && decision.eventChoice
      ? invitation.choices[decision.eventChoice as keyof typeof invitation.choices]?.label
      : (event?.choices.find((c) => c.id === decision.eventChoice)?.label ??
        route?.label ??
        demarche?.routes.find((r) => r.kind === decision.demarcheRoute)?.label ??
        (decision.demarcheRoute === "coordinate" ? "Coordinate with the EU" : undefined) ??
        (decision.emailAction
          ? (chapter.mailChoices[decision.emailId ?? ""]?.[decision.emailAction] ??
            action?.label ??
            ACTION_LABELS[decision.emailAction])
          : undefined));
  return {
    what:
      (decision.id.startsWith("travel-")
        ? `Travel to ${place ?? decision.source}`
        : (invitation?.title ??
          event?.title ??
          mail?.subject ??
          demarche?.subject ??
          (step ? decision.source.split(" · ").slice(1).join(" · ") || step.label : undefined) ??
          decision.source)) || "Commitment",
    choice,
    where: place ?? venue,
    who: names.length ? names.join(" and ") : "You",
    dp: playerTime(decision),
    cash: decisionCash(decision),
    kind: decision.kind,
  };
}

export type AgendaItem = {
  id: string;
  what: string;
  where: string;
  day: number;
  block: number;
  location?: string | undefined;
  urgent?: boolean;
};
export function agendaItems(g: GameState, chapter: ChapterPack): AgendaItem[] {
  const now = tick(g.day, g.block);
  const result: AgendaItem[] = [];
  const name = (id?: string) =>
    chapter.campaign.locations.find((l) => l.id === id)?.name ?? id ?? "BlockBerry";
  for (const i of chapter.invitations) {
    if (
      i.announceDay <= g.day &&
      tick(i.day, i.block) >= now &&
      !g.storyOutcomes[i.id] &&
      !g.pending.some((p) => p.eventId === i.id)
    )
      result.push({
        id: i.id,
        what: i.title,
        where: name(i.location),
        location: i.location,
        day: i.day,
        block: i.block,
        urgent: true,
      });
  }
  for (const d of chapter.demarches.instructions) {
    const status = statusOf(d, g.demarches, g.day, g.block);
    if (
      (status === "new" || status === "in-progress") &&
      !g.demarches[d.id]?.deliveryPending &&
      !g.pending.some((p) => p.demarcheId === d.id && p.demarcheRoute !== "coordinate") &&
      tick(d.deadlineDay, d.deadlineBlock) >= now
    ) {
      const location = chapter.manifest.officeLocation;
      result.push({
        id: d.id,
        what: d.subject,
        where: `${name(location)} · Démarches`,
        location,
        day: d.deadlineDay,
        block: d.deadlineBlock,
        urgent: true,
      });
    }
  }
  const event = g.events[g.block];
  if (
    event &&
    !chapter.campaign.events.find((entry) => entry.id === event.id)?.location &&
    !g.completedEvents.includes(event.id) &&
    !g.pending.some((p) => p.eventId === event.id)
  )
    result.push({
      id: event.id,
      what: event.title,
      where:
        event.channel === "message"
          ? "Message"
          : event.channel === "visit"
            ? "At your door"
            : "Phone call",
      day: g.day,
      block: g.block,
      urgent: true,
    });
  const cutoff = chapter.manifest.blocks[g.block + 1]?.time ?? 1440;
  for (const mail of chapter.emails) {
    if (
      !g.handled[mail.id] &&
      !g.pending.some((p) => p.emailId === mail.id) &&
      (mail.day < g.day || (mail.day === g.day && mail.time < cutoff))
    )
      result.push({
        id: mail.id,
        what: mail.subject,
        where: mail.from.startsWith("Capital") ? "Embassy · secure fax" : "PC or BlockBerry mail",
        location: mail.from.startsWith("Capital") ? chapter.manifest.officeLocation : undefined,
        day: g.day,
        block: g.block,
      });
  }
  for (const task of Object.keys(chapter.manifest.missionTasks)) {
    const step = nextStep(g.missionSteps, task, chapter.manifest);
    if (!step || g.pending.some((p) => p.task === task && p.step === step.id)) continue;
    const reopened = chapter.manifest.setbacks.some(
      (s) =>
        g.setbacksApplied.includes(s.id) &&
        s.targets.some((t) => t.task === task && t.step === step.id),
    );
    if (step.earliestDay > g.day || reopened) {
      const day = Math.max(g.day, step.earliestDay);
      const location = chapter.manifest.officeLocation;
      result.push({
        id: `step-${task}-${step.id}`,
        what: stepLabel(step, task, g.setbacksApplied, chapter.manifest),
        where: `${name(location)} · Staff & diary`,
        location,
        day,
        block: day === g.day ? g.block : 0,
      });
    }
  }
  const host = chapter.manifest.hostLanguage;
  const exam = host?.exam;
  if (
    host &&
    exam &&
    !g.storyFlags.some((flag) => flag.startsWith("language-exam:")) &&
    !g.pending.some((p) => p.id === "language-exam")
  ) {
    const level = g.character?.languages?.[host.id] ?? 0;
    const when = tick(exam.day, exam.block);
    // Eligible players see it until it is over; others only while a lesson could still get them there.
    if (level >= 2 ? when >= now : when > now) {
      const location = chapter.manifest.officeLocation;
      const need =
        level >= 2
          ? ""
          : ` · needs ${host.name} level 2 (${LANGUAGE_LEVELS[2]}), you are at level ${level}`;
      result.push({
        id: "language-exam",
        what: `${host.name} examination with ${exam.examiner} (2 DP)${need}`,
        where: `${name(location)} · Staff & diary`,
        location,
        day: exam.day,
        block: exam.block,
      });
    }
  }
  return result.sort((a, b) => tick(a.day, a.block) - tick(b.day, b.block));
}
