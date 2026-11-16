/**
 * Bot habits. Each bot is a function of the live game: `plan` looks at the current block through a
 * Player (which mirrors what the screens offer) and queues decisions. The runner then advances.
 */
import { campaign } from "../rules";
import { activeChapter } from "../chapters";
import { drawExam } from "../languages";
import { traitsOf } from "../relationships";
import { Player, type OverloadMode } from "./player";

export type BotId = "careful" | "socialiser" | "reckless" | "ignorer" | "press-reader";

export interface Bot {
  id: BotId;
  description: string;
  /** Default probability of taking a trait-gated option when one is offered. */
  traitBias: number;
  overload: OverloadMode;
  plan: (p: Player) => void;
}

// ---- shared habits ------------------------------------------------------------------------

/**
 * Work on the mission: for each task whose next step can be done now, delegate it (by skill, or to
 * whoever is free) or, if `self`, do it in person. `skipMail` leaves steps that a mail offers to
 * confirm for the mail (the bot that never reads its mail never does them).
 */
function missionWork(
  p: Player,
  o: { suitable: boolean; max: number; self?: boolean; skipMail?: boolean },
): number {
  if (p.s.block === 3) return 0;
  let done = 0;
  for (const task of p.openTasks()) {
    if (done >= o.max) break;
    const step = p.openStep(task);
    if (!step) continue;
    if (step.routes) {
      if (p.routedTask(task)) done++;
      continue;
    }
    if (o.skipMail && p.stepHasMail(task, step.id)) continue;
    const workers = o.suitable ? p.suitableStaff(task) : p.rng.shuffle(p.staff().map((c) => c.id));
    let ok = false;
    for (const worker of workers) {
      ok = p.delegateTask(task, worker);
      if (ok) break;
    }
    if (!ok && o.self && p.freeDP() >= (step.dp ?? 2)) ok = p.selfTask(task);
    if (ok) done++;
  }
  return done;
}

/** The staff member with most rested hands, for delegating an invitation or errand. */
function restedStaff(p: Player): string[] {
  const s = p.s;
  return p
    .staff()
    .filter(
      (c) => (s.colleagues[c.id]?.fatigue ?? 0) < 80 && (s.colleagues[c.id]?.trust ?? 0) >= 25,
    )
    .sort((a, b) => (s.colleagues[a.id]?.fatigue ?? 0) - (s.colleagues[b.id]?.fatigue ?? 0))
    .map((c) => c.id);
}

/**
 * Attend if there is time and money, else send someone, else decline politely. `variety` is the
 * chance of sending a colleague or declining outright instead of going.
 */
function attendInvitations(p: Player, variety = 0) {
  for (const inv of p.invitationsDue()) {
    const roll = p.rng.next();
    if (roll < variety / 2 && p.s.block !== 3) {
      if (restedStaff(p).some((id) => p.respondInvitation(inv, "delegate", id))) continue;
    } else if (roll < variety && p.respondInvitation(inv, "decline")) continue;
    if (p.respondInvitation(inv, "attend")) continue;
    if (p.s.block !== 3 && restedStaff(p).some((id) => p.respondInvitation(inv, "delegate", id)))
      continue;
    p.respondInvitation(inv, "decline");
  }
}

const hasCapitalMail = (p: Player) => p.openMail().some((e) => e.from.startsWith("Capital"));

/** Walk back to the embassy when Capital's fax is waiting there and nothing keeps the bot away. */
function goHomeForFax(p: Player) {
  const s = p.s;
  if (s.location === p.office) return;
  const reasonToStay =
    p.invitationsDue().some((i) => i.location === s.location) || p.leadsHere().length;
  if (!reasonToStay && hasCapitalMail(p) && p.freeDP() >= 2) p.travel(p.office);
}

function restIfLow(p: Player, threshold: number) {
  const s = p.s;
  if ((s.energy < threshold || s.composure < 30) && p.freeDP() >= 1) p.rest();
}

function languageStudy(p: Player, prioritise = false) {
  const host = activeChapter().manifest.hostLanguage;
  const exam = host?.exam;
  if (!host || !exam) return;
  const level = p.s.character?.languages?.[host.id] ?? 0;
  if (p.s.day === exam.day && p.s.block === exam.block && level >= 2 && p.freeDP() >= 2) {
    const questions = drawExam(exam.questions, p.s.seed, 0);
    const answers = questions.map((q) => ({
      question: q.id,
      answer: p.rng.chance(level >= 3 ? 0.85 : 0.75)
        ? q.answers.findIndex((a) => a.correct)
        : q.answers.findIndex((a) => !a.correct),
    }));
    p.queue({
      id: "language-exam",
      kind: "work",
      source: "Language examination",
      text: "The Ministry conducts your examination.",
      effects: {},
      timeCost: 2,
      examAnswers: answers,
    });
  } else if (
    level < (prioritise ? 3 : 2) &&
    p.freeDP() >= 1 &&
    p.s.personalFunds >= 100 &&
    !p.s.pending.some((item) => item.languageLesson)
  ) {
    p.queue({
      id: "language-lesson",
      kind: "dialogue",
      source: "Language lesson with private tutor",
      text: "A language lesson.",
      effects: {},
      timeCost: 1,
      languageLesson: "tutor",
    });
  }
}

// ---- the bots ------------------------------------------------------------------------------

function carefulPlan(p: Player, extras: { press: boolean; leads: boolean }) {
  const exam = activeChapter().manifest.hostLanguage?.exam;
  if ((p.s.day === exam?.day && p.s.block === exam.block) || (extras.press && p.s.day <= 5))
    languageStudy(p, extras.press);
  if (extras.press) p.readPress(true);
  else p.skipPress();
  goHomeForFax(p);
  restIfLow(p, 30);
  // Mission first. Delegating costs staff time, not the player's.
  missionWork(p, { suitable: true, max: 2, self: p.s.day >= 9 });
  p.handleDemarche("careful");
  if (extras.press && p.freeDP() >= 1) p.passGossip();
  const event = p.currentEvent();
  if (event) p.respondEvent(event, "best");
  attendInvitations(p);
  p.answerMail("best");
  p.recallAccidents();
  if (extras.leads) {
    for (const lead of p.leads()) {
      if (p.freeDP() < 1) break;
      p.followLead(lead, "best");
    }
  } else {
    for (const lead of p.leadsHere()) if (p.freeDP() >= 1) p.respondLead(lead, "best");
  }
  // Mission by hand if delegating is not working and time is running out.
  if (p.openTasks().length && p.s.day >= 11) missionWork(p, { suitable: true, max: 2, self: true });
  // Spare time: a talk with the staff, or rest.
  if (p.freeDP() >= 1 && p.s.location === p.office && p.s.block !== 3) {
    const staff = restedStaff(p);
    const who = staff[p.rng.int(Math.max(1, staff.length))];
    if (who && p.rng.chance(0.5)) p.converse(who, "best");
  }
  languageStudy(p, extras.press);
  if (p.freeDP() >= 1 && (p.s.energy < 60 || p.s.composure < 50)) p.rest();
}

export const careful: Bot = {
  id: "careful",
  description:
    "Mission steps as soon as each opens (delegated by skill), answers every email with the best-looking option, attends invitations, rests when tired, stays within budget.",
  traitBias: 0.5,
  overload: "ifNeeded",
  plan: (p) => carefulPlan(p, { press: false, leads: false }),
};

export const pressReader: Bot = {
  id: "press-reader",
  description:
    "Careful, but always reads the press review, clips the signal item for Capital and follows location leads.",
  traitBias: 0.5,
  overload: "ifNeeded",
  plan: (p) => carefulPlan(p, { press: true, leads: true }),
};

export const socialiser: Bot = {
  id: "socialiser",
  description:
    "Coffees, lunches, dinners and conversations; attends everything; takes trait-tagged choices when offered; tends the mission only when mail or the deadline forces it (from Day 10).",
  traitBias: 0.9,
  overload: "ifNeeded",
  plan: (p) => {
    const s = p.s;
    p.skipPress();
    if (p.s.day >= 5) missionWork(p, { suitable: true, max: 2, self: true });
    p.handleDemarche("eu");
    // A change of scenery is half the fun; the other half is being found at the embassy.
    if (s.location !== p.office && !p.leadsHere().length && p.rng.chance(0.5) && p.freeDP() >= 2)
      p.travel(p.office);
    const event = p.currentEvent();
    if (event) p.respondEvent(event, event.relationshipGate ? "best" : "random");
    attendInvitations(p, 0.4);
    p.answerMail("random");
    if (p.freeDP() >= 1) p.passGossip();
    for (const lead of p.leadsHere()) if (p.freeDP() >= 1) p.respondLead(lead, "random");
    // Wanders into town now and then: to a lead, or just to see who is at the bar.
    if (p.s.location === p.office && p.freeDP() >= 3 && p.rng.chance(0.35)) {
      const lead = p.rng.pick(p.leads().filter((l) => l.location && l.location !== p.office));
      if (lead) p.followLead(lead, "random");
      else {
        const places = campaign()
          .locations.filter((l) => l.id !== p.office && l.id !== "golf")
          .filter((l) => campaign().characters.some((c) => c.location === l.id));
        const place = p.rng.pick(places);
        if (place) p.travel(place.id);
      }
    }
    if (p.s.day >= 9) missionWork(p, { suitable: true, max: 2, self: true });
    // The social calendar: one outing a block, then talk to whoever is in the room.
    const company = p.rng.shuffle(p.peopleHere());
    const guest = company[0] ?? p.rng.pick(p.staff().map((c) => c.id));
    if (guest && p.freeDP() >= 1) {
      const venue = p.venueFor(guest, Math.max(60, p.available() / 10));
      p.outing(guest, venue, venue !== "embassy");
    }
    for (const id of company) {
      if (p.freeDP() < 1) break;
      p.converse(id, "random");
    }
    if (p.freeDP() >= 1 && p.s.energy < 40) p.rest();
  },
};

export const reckless: Bot = {
  id: "reckless",
  description:
    "Delegates everything, including to unsuitable staff, raids the reserves, drinks, and picks the riskiest option every time.",
  traitBias: 0.3,
  overload: "always",
  plan: (p) => {
    const s = p.s;
    p.skipPress();
    p.handleDemarche("reckless");
    if (p.freeDP() >= 2 && p.s.location !== "ministry" && p.s.day <= 10) p.travel("ministry");
    if (p.freeDP() >= 1 && p.s.location === "ministry") p.converse("protocol", "risky");
    const source = (campaign().gossip ?? [])
      .filter((item) => item.day <= p.s.day && !p.s.knownFacts.includes(`gossip:${item.id}`))
      .sort((a, b) => b.sensitivity - a.sensitivity)
      .flatMap((item) => item.knowers)
      .find((id) => {
        const person = campaign().characters.find((candidate) => candidate.id === id);
        return (
          !!person && p.peopleHere().includes(id) && traitsOf(person).some((trait) => trait.gossips)
        );
      });
    if (source) p.s.selectNpc(source);
    if (p.freeDP() >= 1) p.passGossip(true);
    if (s.day >= 3 && p.available() < 1000 && s.economy.ringFence > 3000 && p.rng.chance(0.5))
      p.raidReserve();
    if (p.available() < 300 && !s.economy.supplementUsed) p.supplement();
    const event = p.currentEvent();
    if (event) p.respondEvent(event, "risky");
    for (const inv of p.invitationsDue()) {
      if (p.rng.chance(0.5) && p.s.block !== 3) {
        const worker = p.rng.pick(p.staff().map((c) => c.id));
        if (worker && p.respondInvitation(inv, "delegate", worker)) continue;
      }
      p.respondInvitation(inv, "decline");
    }
    p.answerMail("risky");
    missionWork(p, { suitable: false, max: 3 });
    for (const lead of p.leadsHere()) if (p.freeDP() >= 1) p.respondLead(lead, "risky");
    // Dinner, drinks and a guest who dislikes the venue.
    const guest = p.rng.pick(p.rng.shuffle(p.staff().map((c) => c.id)));
    if (guest && p.freeDP() >= 1) {
      const pricey = p.rng.pick(["bling", "shady", "sushi"]) ?? "shady";
      p.outing(guest, pricey, true);
    }
  },
};

export const ignorer: Bot = {
  id: "ignorer",
  description:
    "Never opens mail, skips the press review, ignores invitations and episodes, and only does the mission steps that no mail offers to confirm.",
  traitBias: 0,
  overload: "ifNeeded",
  plan: (p) => {
    p.skipPress();
    if (p.s.location !== p.office && p.freeDP() >= 3) p.travel(p.office);
    missionWork(p, { suitable: true, max: 1, self: true, skipMail: true });
  },
};

export const BOTS: Bot[] = [careful, socialiser, reckless, ignorer, pressReader];
export const botById = (id: string): Bot => {
  const bot = BOTS.find((b) => b.id === id);
  if (!bot) throw new Error(`Unknown bot: ${id}`);
  return bot;
};
