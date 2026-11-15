/**
 * The bots' hands. Every method here queues the same PendingDecision shape the matching React screen
 * builds (PlanningDesk, Conversation, Interruption, LocationLead, Mailbox, DiplomaticCalendar,
 * PressReview) and goes through the real store, so the rules validate it exactly as they would for
 * a person. No React, no DOM.
 */
import { eligible, type ChoiceGate } from "../character";
import { dueInvitations, type Invitation, type InvitationResponse } from "../calendar";
import { activeChapter } from "../chapters";
import { pickTopic, splitEffects, topicsFor, type TalkChoice, type Topic } from "../dialogues";
import { availableFunds, capacityLedger, playerCapacity, playerTime, STAFF_DP } from "../economy";
import { clippings, type Clipping } from "../press";
import {
  blocks,
  campaign,
  computeStats,
  hospitalityCost,
  locationStories,
  emails,
  missionTasks,
  socialTrust,
  type Action,
  type Effects,
  type Outcome,
  type PendingDecision,
  type StoryChoice,
  type StoryEvent,
} from "../rules";
import { nextStep, stepContext, stepStatus, type MissionStep } from "../mission";
import { inboxFor, useGame, type GameState } from "../store";
import type { Rng } from "./rng";

/** How a bot ranks the options it is shown. */
export type Style = "best" | "risky" | "random";
/** Whether the bot ticks "allow displaced routine work" on its own. */
export type OverloadMode = "never" | "ifNeeded" | "always";

export interface PlayerOptions {
  /** Probability of taking a trait-gated option when one is offered. */
  traitBias: number;
  overload: OverloadMode;
}

/** What the bot has seen and done; the runner turns it into a RunResult. */
export interface Tracker {
  seen: Set<string>;
  taken: Set<string>;
  /** Trait-gated options that were on screen, counted once per decision, by trait. */
  traitOffers: Record<string, number>;
  /** Refusals from the store (the red notices a person would read), counted by text. */
  planErrors: Record<string, number>;
}
export const createTracker = (): Tracker => ({
  seen: new Set(),
  taken: new Set(),
  traitOffers: {},
  planErrors: {},
});

type Valued = {
  effects?: Effects | Record<string, number> | undefined;
  trust?: number | undefined;
  score?: number | undefined;
  cashCost?: number | undefined;
  pair?: number | undefined;
};

/**
 * How good an option looks. A person sees only labels; the bots peek at the authored numbers as a
 * stand-in for "reads the label and judges it", with noise added where they rank.
 */
export function optionValue(c: Valued): number {
  const e = (c.effects ?? {}) as Record<string, number | undefined>;
  return (
    (e["confidence"] ?? 0) +
    (e["goodwill"] ?? 0) +
    (e["morale"] ?? 0) * 0.5 +
    (e["sanity"] ?? 0) * 0.5 +
    (e["budget"] ?? 0) * 0.3 +
    (e["money"] ?? 0) * 0.02 +
    (c.trust ?? 0) * 0.4 +
    (c.score ?? 0) * 0.5 +
    (c.pair ?? 0) * 0.1 -
    (c.cashCost ?? 0) / 150
  );
}

/** Same time costs as the interruption screen. */
export const eventDP = (eventId: string, c: StoryChoice): number =>
  c.replace || eventId === "rivalry"
    ? 2
    : c.worker
      ? 0
      : eventId === "invitation" && c.id === "decline"
        ? 0
        : 1;

export class Player {
  constructor(
    readonly rng: Rng,
    readonly options: PlayerOptions,
    readonly tracker: Tracker,
  ) {}

  // ---- reading the game -------------------------------------------------------------------
  get s(): GameState {
    return useGame.getState();
  }
  get traits(): string[] {
    return this.s.character?.traits ?? [];
  }
  get stats() {
    return computeStats(this.traits);
  }
  get office(): string {
    return activeChapter().manifest.officeLocation;
  }
  staff() {
    return campaign().characters.filter((c) => c.location === this.office);
  }
  /** Who stands in the current location's scene (the people a person can click on). */
  peopleHere(): string[] {
    return campaign()
      .characters.filter((c) => c.location === this.s.location)
      .map((c) => c.id);
  }
  capacity(): number {
    const s = this.s;
    return playerCapacity(s.character, s.energy, s.composure, s.alcohol, s.hangover).total;
  }
  freeDP(): number {
    return this.capacity() - this.s.pending.reduce((n, p) => n + playerTime(p), 0);
  }
  available(): number {
    const s = this.s;
    return availableFunds(s.economy, s.pending);
  }
  staffFree(id: string): number {
    const s = this.s;
    return capacityLedger(s.pending, s.block).find((row) => row.id === id)?.free ?? 0;
  }
  /** Mission tasks not yet confirmed, in the chapter's order. */
  openTasks(): string[] {
    return Object.keys(missionTasks()).filter((t) => !this.s.visit[t]);
  }

  // ---- bookkeeping ------------------------------------------------------------------------
  see(id: string) {
    this.tracker.seen.add(id);
  }
  take(id: string) {
    this.tracker.taken.add(id);
  }
  private note(error: string) {
    if (error) this.tracker.planErrors[error] = (this.tracker.planErrors[error] ?? 0) + 1;
  }
  /** Queue through the store, recording any refusal. */
  queue(decision: PendingDecision, replace = false): boolean {
    const ok = this.s.queue(decision, replace);
    if (!ok) this.note(this.s.planError);
    return ok;
  }
  private overloads(): boolean[] {
    return this.options.overload === "never"
      ? [false]
      : this.options.overload === "always"
        ? [true]
        : [false, true];
  }
  /** The latest refusal the store gave; callers note it once if nothing worked. */
  private refusal = "";
  /** Try the decision without, then (if the bot allows) with the displacement box ticked. */
  private queueWithOverload(
    build: (overload: boolean) => PendingDecision,
    replace = false,
  ): boolean {
    for (const overload of this.overloads()) {
      if (this.s.queue(build(overload), replace)) return true;
      this.refusal = this.s.planError;
    }
    return false;
  }

  /** Rank options: eligible only, trait-gated first with probability traitBias. */
  order<T>(
    items: readonly T[],
    gate: (item: T) => ChoiceGate,
    value: (item: T) => number,
    style: Style,
  ): T[] {
    const stats = this.stats;
    const traits = this.traits;
    const options = items.filter((item) => eligible(gate(item), traits, stats));
    const gated = options.filter((item) => gate(item).requiresTrait);
    for (const trait of new Set(gated.map((item) => gate(item).requiresTrait!)))
      this.tracker.traitOffers[trait] = (this.tracker.traitOffers[trait] ?? 0) + 1;
    const rank = (list: T[]): T[] => {
      if (style === "random") return this.rng.shuffle(list);
      const sign = style === "best" ? -1 : 1;
      return list
        .map((item) => ({ item, key: sign * (value(item) + this.rng.next() * 1.5) }))
        .sort((a, b) => a.key - b.key)
        .map((x) => x.item);
    };
    if (gated.length && this.rng.chance(this.options.traitBias))
      return [...rank(gated), ...rank(options.filter((item) => !gate(item).requiresTrait))];
    return rank(options);
  }

  // ---- travel and rest --------------------------------------------------------------------
  travel(location: string): boolean {
    if (this.s.location === location) return true;
    const ok = this.s.move(location);
    if (!ok) this.note(this.s.planError);
    return ok;
  }
  rest(): boolean {
    const ok = this.queue({
      id: "rest",
      kind: "work",
      timeCost: 1,
      source: "Personal time",
      text: "A quiet break restores your energy and composure.",
      effects: { sanity: 2 },
      energy: 20,
      composure: 15,
    });
    if (ok) this.take("action:rest");
    return ok;
  }
  /** The money screen's two emergency buttons. */
  supplement(): boolean {
    const before = this.s.pending.length;
    this.s.requestSupplement();
    const ok = this.s.pending.length > before;
    if (!ok) this.note(this.s.planError);
    return ok;
  }
  raidReserve(): boolean {
    const before = this.s.economy.ringFence;
    this.s.raidReserve();
    return this.s.economy.ringFence < before;
  }

  // ---- mission work (PlanningDesk) --------------------------------------------------------
  /**
   * The step of the task that can be done now: its next step, if the day, the order and the other
   * tasks allow it and nothing in the diary already does it. Undefined when it is blocked or taken.
   */
  openStep(task: string): MissionStep | undefined {
    const s = this.s;
    const step = nextStep(s.missionSteps, task);
    if (!step) return undefined;
    if (stepStatus(stepContext(s), task, step.id).state !== "available") return undefined;
    if (s.pending.some((p) => p.task === task && p.step === step.id && p.kind === "work"))
      return undefined;
    return step;
  }
  /** True when the step named "task.step" is neither done nor blocked. */
  stepOpen(ref: string): boolean {
    const s = this.s;
    const [task, step] = ref.split(".");
    return (
      !!task &&
      !!step &&
      stepStatus(stepContext(s), task, step).state === "available" &&
      !this.s.pending.some((p) => p.task === task && p.step === step)
    );
  }
  /** True when a mail offers to confirm this step (the quick way, if it has arrived). */
  stepHasMail(task: string, step: string): boolean {
    return emails().some((e) =>
      Object.values(e.options).some((o) => o?.confirmsStep === `${task}.${step}`),
    );
  }
  /** Staff who can do the task's next step right now, most rested first. */
  suitableStaff(task: string): string[] {
    const s = this.s;
    const skill = nextStep(s.missionSteps, task)?.skill ?? task;
    return this.staff()
      .filter((c) => c.skills.includes(skill))
      .filter((c) => {
        const state = s.colleagues[c.id];
        return !!state && state.trust >= 25 && state.fatigue < 80 && this.staffFree(c.id) > 0;
      })
      .sort(
        (a, b) =>
          (s.colleagues[a.id]?.fatigue ?? 0) - (s.colleagues[b.id]?.fatigue ?? 0) ||
          (s.colleagues[b.id]?.trust ?? 0) - (s.colleagues[a.id]?.trust ?? 0),
      )
      .map((c) => c.id);
  }
  delegateTask(task: string, workerId: string, partnerId?: string): boolean {
    const name = campaign().characters.find((c) => c.id === workerId)?.name ?? workerId;
    const ok = this.queueWithOverload((overload) => ({
      id: `work-${workerId}`,
      kind: "work",
      playerSlot: false,
      worker: workerId,
      partner: partnerId,
      task,
      source: `${name} · ${missionTasks()[task]}`,
      text: `${name} secured written confirmation: ${missionTasks()[task]}.`,
      effects: { confidence: 3 },
      timeCost: 0,
      overload,
      score: 2,
      trust: 1,
    }));
    if (ok) this.take(`action:delegate:${task}`);
    else this.note(this.refusal);
    return ok;
  }
  selfTask(task: string): boolean {
    const s = this.s;
    if (s.block === 3 && ["embassy", "ministry", "eu", "un"].includes(s.location)) return false;
    if (s.location !== this.office) return false;
    const ok = this.queue({
      id: "player-work",
      kind: "work",
      playerSlot: true,
      source: `You · ${missionTasks()[task]}`,
      text: `You secured written confirmation: ${missionTasks()[task]}.`,
      effects: { confidence: 3 },
      timeCost: nextStep(s.missionSteps, task)?.dp ?? 2,
      overload: false,
      score: 2,
      trust: 1,
    });
    if (ok) this.take(`action:self:${task}`);
    return ok;
  }
  /** The "local appointment" button for the town location the player is standing in. */
  localAppointment(): boolean {
    const s = this.s;
    const place = campaign().locations.find((l) => l.id === s.location);
    if (!place || place.id === this.office || place.id === "golf") return false;
    if (s.block === 3 && ["ministry", "eu", "un"].includes(place.id)) return false;
    const ok = this.queue({
      id: "player-work",
      kind: "work",
      playerSlot: true,
      source: place.name,
      text: `${place.work}: useful contacts and commitments secured.`,
      effects: place.effects,
      cashCost: place.cost,
      timeCost: 2,
      location: place.id,
      score: 3,
    });
    if (ok) this.take(`action:appointment:${place.id}`);
    return ok;
  }

  // ---- social (PlanningDesk) --------------------------------------------------------------
  /** The venue a guest would like best that the bot can pay for, falling back to the embassy. */
  venueFor(guestId: string, maxCost = Infinity): string {
    const guest = campaign().characters.find((c) => c.id === guestId);
    const block = this.s.block;
    const options = campaign()
      .venues.filter((v) => hospitalityCost(v.id, 1, block) <= maxCost)
      .map((v) => ({
        id: v.id,
        trust: guest ? socialTrust(guest.id, v.id, false) : 0,
        cost: hospitalityCost(v.id, 1, block),
      }))
      .sort((a, b) => b.trust - a.trust || a.cost - b.cost);
    return options[0]?.id ?? "embassy";
  }
  outing(guestId: string, venueId: string, drinks: boolean): boolean {
    const s = this.s;
    const block = blocks()[s.block];
    if (!block) return false;
    const guest = campaign().characters.find((c) => c.id === guestId);
    const venue = campaign().venues.find((v) => v.id === venueId);
    const cost = hospitalityCost(venueId, guestId ? 1 : 0, s.block);
    const time =
      s.block === 0 || s.block === 2
        ? venueId === "embassy"
          ? 1
          : 2
        : s.block === 1 && !guestId && venueId === "embassy"
          ? 1
          : 2;
    const trust = socialTrust(guestId, venueId, false);
    const ok = this.queueWithOverload((overload) => ({
      id: "social",
      kind: "social",
      source: block.social,
      text: guestId
        ? `${block.social} with ${guest?.name} at ${venue?.name}: ${trust > 0 ? "a warmer relationship" : "an uncomfortable outing"}. Hospitality cost ${cost}.`
        : `${block.social} alone. Some welcome quiet.`,
      effects: {},
      cashCost: cost,
      timeCost: time,
      venue: venueId,
      drinks: venueId !== "embassy" && drinks,
      overload,
      worker: guestId || undefined,
      trust,
      energy: s.block === 1 || s.block === 3 ? 12 : 5,
      composure: guestId ? 2 : 8,
    }));
    if (ok) this.take(`action:social:${venueId}`);
    else this.note(this.refusal);
    return ok;
  }

  // ---- conversations (Conversation) -------------------------------------------------------
  /** Talk to someone at the current location. Walks the dialogue nodes like a person would. */
  converse(npcId: string, style: Style): boolean {
    const s = this.s;
    const npc = campaign().characters.find((c) => c.id === npcId);
    if (!npc || npc.location !== s.location) return false;
    const done = [
      ...s.storyFlags
        .filter((flag) => flag.startsWith("dialogue:"))
        .map((flag) => flag.slice("dialogue:".length)),
      ...s.pending.flatMap((p) => (p.dialogueTopic ? [p.dialogueTopic] : [])),
    ];
    const topic: Topic | undefined = pickTopic(npc.id, s.day, s.block, done);
    const generic = campaign().dialogue as Record<string, { text: string; choices: TalkChoice[] }>;
    const topicKey = topic ? `${npc.id}:${topic.id}` : "generic";
    if (topic) this.see(`topic:${topicKey}`);
    const pendingId = `conversation-${npc.id}-${topic?.id ?? "general"}`;
    if (this.s.pending.some((p) => p.id === pendingId)) return false;
    let nodeKey = topic ? topic.start : "opening";
    for (let step = 0; step < 8; step++) {
      const node = topic ? topic.nodes[nodeKey] : generic[nodeKey];
      if (!node) return false;
      const indexed = (node.choices as TalkChoice[]).map((choice, index) => ({ choice, index }));
      const ranked = this.order(
        indexed,
        (x) => x.choice,
        (x) => (x.choice.next ? 0 : optionValue(x.choice)),
        style,
      );
      const idOf = (index: number) => `choice:dialogue:${topicKey}:${nodeKey}:${index}`;
      for (const x of ranked) this.see(idOf(x.index));
      let moved = false;
      for (const { choice, index } of ranked) {
        if (choice.next) {
          this.take(idOf(index));
          nodeKey = choice.next;
          moved = true;
          break;
        }
        const { meters, energy, cash } = splitEffects(choice.effects);
        const queued = this.queueWithOverload((overload) => ({
          id: pendingId,
          kind: "dialogue",
          timeCost: 1,
          cashCost: cash || undefined,
          source: `Conversation with ${npc.name}${topic ? ` · ${topic.id}` : ""}`,
          text: choice.result ?? "Conversation completed.",
          effects: meters,
          worker: npc.id,
          overload,
          dialogueTopic: topic ? topicKey : undefined,
          flag: choice.flag,
          trust: choice.trust,
          pair: choice.pair,
          pairTarget: choice.pairTarget,
          formal: choice.formal,
          traitChoice: choice.requiresTrait,
          score: choice.score,
          composure: 3,
          energy: energy || undefined,
        }));
        if (queued) {
          this.take(idOf(index));
          if (topic) this.take(`topic:${topicKey}`);
          return true;
        }
      }
      // Either we walked to the next node, or every leaf was refused.
      if (!moved) {
        this.note(this.refusal);
        return false;
      }
    }
    return false;
  }

  // ---- story episodes (Interruption, LocationLead) ----------------------------------------
  /** The call, fax or visitor that interrupts the current block, if any is still open. */
  currentEvent(): StoryEvent | undefined {
    const s = this.s;
    const event = s.events[s.block];
    if (!event || s.completedEvents.includes(event.id)) return undefined;
    if ((campaign().events as StoryEvent[]).find((e) => e.id === event.id)?.location)
      return undefined;
    return event;
  }
  respondEvent(event: StoryEvent, style: Style): boolean {
    if (this.s.pending.some((p) => p.eventId === event.id)) return true;
    this.see(`event:${event.id}`);
    const ranked = this.order(
      event.choices,
      (c) => c,
      (c) => optionValue(c),
      style,
    );
    for (const c of ranked) this.see(`choice:event:${event.id}:${c.id}`);
    for (const c of ranked) {
      const ok = this.queueWithOverload(
        (overload) => ({
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
          score: c.score,
          contact: c.contact,
          contactTrust: c.contactTrust,
          formal: c.formal,
          traitChoice: c.requiresTrait,
          overload,
          playerSlot: c.replace,
          timeCost: eventDP(event.id, c),
        }),
        c.replace,
      );
      if (ok) {
        this.take(`choice:event:${event.id}:${c.id}`);
        return true;
      }
    }
    this.note(this.refusal);
    return false;
  }
  /** Leads the person could follow now, wherever they are standing. */
  leads(): StoryEvent[] {
    const s = this.s;
    return locationStories(
      s.day,
      s.completedEvents,
      s.storyOutcomes,
      campaign().events as StoryEvent[],
      s.storyFlags,
    ).filter((lead) => lead.id !== "fuel-quay" || s.storyFlags.includes("fuel-lead"));
  }
  leadsHere(): StoryEvent[] {
    return this.leads().filter((lead) => lead.location === this.s.location);
  }
  respondLead(event: StoryEvent, style: Style): boolean {
    if (this.s.pending.some((p) => p.eventId === event.id)) return true;
    this.see(`event:${event.id}`);
    const ranked = this.order(
      event.choices,
      (c) => c,
      (c) => optionValue(c),
      style,
    );
    for (const c of ranked) this.see(`choice:event:${event.id}:${c.id}`);
    for (const choice of ranked) {
      const ok = this.queueWithOverload((overload) => ({
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
      }));
      if (ok) {
        this.take(`choice:event:${event.id}:${choice.id}`);
        return true;
      }
    }
    this.note(this.refusal);
    return false;
  }
  /** Travel to a lead and answer it in the same block (travel 1 DP + the decision 1 DP). */
  followLead(event: StoryEvent, style: Style): boolean {
    const s = this.s;
    if (!event.location) return false;
    // Once an appointment is queued here, the journey elsewhere is refused.
    if (s.location !== event.location && s.pending.some((p) => p.location && playerTime(p) > 0))
      return false;
    const needed = (s.location === event.location ? 0 : 1) + 1;
    if (this.freeDP() < needed) return false;
    if (!this.travel(event.location)) return false;
    return this.respondLead(event, style);
  }

  // ---- invitations (DiplomaticCalendar) ---------------------------------------------------
  invitationsDue(): Invitation[] {
    const s = this.s;
    return dueInvitations(s.day, s.block, s.storyOutcomes);
  }
  respondInvitation(
    invitation: Invitation,
    response: InvitationResponse,
    workerId?: string,
  ): boolean {
    const s = this.s;
    const choice = invitation.choices[response];
    this.see(`invitation:${invitation.id}`);
    this.see(`choice:invitation:${invitation.id}:${response}`);
    if (response === "attend") {
      const travel = s.location === invitation.location ? 0 : 1;
      // Check before travelling: once the journey is queued it cannot be undone.
      if (this.freeDP() < travel + choice.timeCost || this.available() < choice.cashCost) {
        this.note("You cannot afford the time or money to attend.");
        return false;
      }
      if (travel && !this.travel(invitation.location)) return false;
    }
    if (response === "delegate" && !workerId) return false;
    const ok = this.queueWithOverload((overload) => ({
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
      worker: response === "delegate" ? workerId : undefined,
      overload: response === "delegate" && overload,
      location: response === "attend" ? invitation.location : undefined,
    }));
    if (ok) this.take(`choice:invitation:${invitation.id}:${response}`);
    else this.note(this.refusal);
    return ok;
  }

  // ---- mail (Mailbox) ---------------------------------------------------------------------
  /** Unanswered mail the person can answer this block; Capital's only comes through the embassy fax. */
  openMail() {
    const s = this.s;
    return inboxFor(s.day, s.minute, s.handled).filter(
      (e) => !e.status && (s.location === this.office || !e.from.startsWith("Capital")),
    );
  }
  answerMail(style: Style, limit = Infinity): number {
    let answered = 0;
    for (const email of this.openMail()) {
      if (answered >= limit) break;
      this.see(`email:${email.id}`);
      const options = (Object.entries(email.options) as [Action, Outcome][]).filter(([, o]) => o);
      const ranked = this.order(
        options,
        ([, o]) => o,
        ([, o]) => optionValue(o) + (o.confirmsStep && this.stepOpen(o.confirmsStep) ? 6 : 0),
        style,
      );
      for (const [action] of ranked) this.see(`choice:email:${email.id}:${action}`);
      for (const [action] of ranked) {
        if (this.freeDP() < 1) {
          this.note("You have only 0 DP this block.");
          return answered;
        }
        this.s.answer(email.id, action);
        if (this.s.pending.some((p) => p.emailId === email.id)) {
          this.take(`email:${email.id}`);
          this.take(`choice:email:${email.id}:${action}`);
          answered++;
          break;
        }
        this.note(this.s.planError);
      }
    }
    return answered;
  }
  /** Recall any Reply-All accident (1 extra DP each). */
  recallAccidents(): number {
    let recalled = 0;
    for (const p of [...this.s.pending]) {
      if (!p.recall || !p.emailId) continue;
      if (this.freeDP() < 1) break;
      this.s.recall(p.emailId);
      if (!this.s.pending.some((q) => q.emailId === p.emailId && q.recall)) recalled++;
      else this.note(this.s.planError);
    }
    return recalled;
  }

  // ---- press (PressReview) ----------------------------------------------------------------
  /** Skip the review: it opens by itself each morning, so a person closes it. */
  skipPress() {
    if (this.s.block === 0) this.s.dismissPress();
  }
  pressClippings(): Clipping[] {
    return this.s.pressIds
      .map((id) => clippings().find((c) => c.id === id))
      .filter((c): c is Clipping => !!c);
  }
  /** Read it, and clip the signal item (or anything Capital would want) for Capital. */
  readPress(clip: boolean): void {
    const s = this.s;
    if (s.block !== 0) return;
    s.preparePress();
    this.s.readPress();
    const items = this.pressClippings();
    for (const c of items) this.see(`press:${c.id}`);
    if (clip) {
      const pick = items.find((c) => c.signal) ?? items.find((c) => c.capital);
      if (pick) this.s.clipPress(pick.id);
    }
    this.s.dismissPress();
  }
}
