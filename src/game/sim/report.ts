/** Aggregate many RunResults into the numbers a designer reads. Pure: no store, no randomness. */
import { activeChapter, getChapter } from "../chapters";
import type { IgnoredMail, RunResult } from "./run";
import { SHIPPED_GAME_SEED } from "./run";

export interface ContentUniverse {
  events: string[];
  topics: string[];
  emails: string[];
  invitations: string[];
  clippings: string[];
  /** Every authored option: event, dialogue, email and invitation choices. */
  choices: string[];
  /** Subset of choices gated by a trait, with the trait. */
  traitChoices: Record<string, string>;
  languageChoices: Record<string, string>;
}

/** Everything the chapter authors, under the same ids the bots record. */
export function contentUniverse(chapterId?: string): ContentUniverse {
  const chapter = chapterId ? getChapter(chapterId) : activeChapter();
  const u: ContentUniverse = {
    events: [],
    topics: [],
    emails: [],
    invitations: [],
    clippings: [],
    choices: [],
    traitChoices: {},
    languageChoices: {},
  };
  const add = (
    id: string,
    gate: {
      requiresTrait?: string | undefined;
      requiresLanguage?: { language: string } | undefined;
    },
  ) => {
    u.choices.push(id);
    if (gate.requiresTrait) u.traitChoices[id] = gate.requiresTrait;
    if (gate.requiresLanguage) u.languageChoices[id] = gate.requiresLanguage.language;
  };
  for (const e of chapter.campaign.events) {
    u.events.push(`event:${e.id}`);
    for (const c of e.choices) add(`choice:event:${e.id}:${c.id}`, c);
  }
  for (const d of chapter.demarches.instructions)
    for (const option of d.traitOptions ?? []) add(`choice:demarche:${d.id}:${option.id}`, option);
  for (const [npc, topics] of Object.entries(chapter.dialogues))
    for (const t of topics) {
      u.topics.push(`topic:${npc}:${t.id}`);
      for (const [nodeKey, node] of Object.entries(t.nodes))
        node.choices.forEach((c, i) => add(`choice:dialogue:${npc}:${t.id}:${nodeKey}:${i}`, c));
    }
  for (const e of chapter.emails) {
    u.emails.push(`email:${e.id}`);
    for (const [action, o] of Object.entries(e.options))
      if (o) add(`choice:email:${e.id}:${action}`, o);
  }
  for (const i of chapter.invitations) {
    u.invitations.push(`invitation:${i.id}`);
    for (const r of Object.keys(i.choices)) add(`choice:invitation:${i.id}:${r}`, {});
  }
  for (const c of chapter.press.clippings) u.clippings.push(`press:${c.id}`);
  return u;
}

/** Bots that play the chapter through (the others lose or idle by design). */
export const COMPETENT = ["careful", "socialiser", "press-reader"];

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const count = <T extends string>(xs: T[]): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const x of xs) out[x] = (out[x] ?? 0) + 1;
  return out;
};
const group = <T>(xs: T[], key: (x: T) => string): Record<string, T[]> => {
  const out: Record<string, T[]> = {};
  for (const x of xs) (out[key(x)] ??= []).push(x);
  return out;
};
const traitMoments = (r: RunResult) => sum(Object.values(r.traitChoices));

export interface Stat {
  mean: number;
  min: number;
  max: number;
}
const stat = (xs: number[]): Stat => ({
  mean: mean(xs),
  min: xs.length ? Math.min(...xs) : 0,
  max: xs.length ? Math.max(...xs) : 0,
});

function idleByDay(rs: RunResult[], pick: (r: RunResult) => number[]): number[] {
  // A run played day d if it reached it.
  const played = (r: RunResult, day: number) => r.day >= day;
  const days = Math.max(0, ...rs.map((r) => r.day)) + 1;
  return Array.from({ length: days }, (_, day) =>
    day === 0 ? 0 : mean(rs.filter((r) => played(r, day)).map((r) => pick(r)[day] ?? 0)),
  );
}

export interface Report {
  languagesByBot: Record<
    string,
    {
      level: number;
      level2ByDay10: number;
      lessons: Record<string, number>;
      attempts: number;
      errors: number;
      sat: number;
      passed: number;
      failed: number;
    }
  >;
  personnelByBot: Record<
    string,
    {
      reputations: Record<string, number>;
      quirks: Record<string, number>;
      drift: Record<string, number>;
    }
  >;
  reputationsByBuild: Record<string, Record<string, number>>;
  epithets: Record<string, number>;
  boardMembers: Record<string, number>;
  relationshipStats: Record<
    string,
    {
      changes: number;
      pairs: number;
      learned: number;
      passed: number;
      held: number;
      falseActed: number;
      scenes: number;
    }
  >;
  demarcheStats: Record<
    string,
    {
      routes: Record<string, number>;
      quality: Record<string, number>;
      missed: number;
      incidents: number;
    }
  >;
  qualityByTask: Record<string, Record<string, number>>;
  routeLockouts: number;
  routeStats: Record<
    string,
    {
      routes: Record<string, number>;
      favoursOwed: number;
      good: number;
      adequate: number;
      changes: number;
    }
  >;
  chapterId: string;
  runs: number;
  bots: string[];
  builds: string[];
  seeds: number[];
  endings: string[];
  endingsByBot: Record<string, Record<string, number>>;
  endingsByBuild: Record<string, Record<string, number>>;
  endingsOverall: Record<string, number>;
  /** For each build, its most common ending and that ending's share of its runs. */
  dominantEnding: Record<string, { ending: string; share: number }>;
  /** Average trait-tagged choices taken per run, by build and bot. */
  traitMomentsByBuild: Record<string, { all: number; byBot: Record<string, number> }>;
  /** Per trait: runs of builds that include it, mean moments of that trait taken, mean offered. */
  traitCoverage: Record<
    string,
    {
      gatedChoices: number;
      offeredAny: number;
      takenAny: number;
      takenPerRun: number;
      offeredPerRun: number;
    }
  >;
  universe: {
    events: number;
    topics: number;
    emails: number;
    invitations: number;
    clippings: number;
    choices: number;
  };
  neverSeen: Omit<ContentUniverse, "traitChoices" | "languageChoices">;
  neverTaken: { choices: string[] };
  /** The same, counting only runs that used the shipped game seed (what players actually get). */
  neverSeenShipped: Omit<ContentUniverse, "traitChoices" | "languageChoices">;
  idleBlocks: { byBot: Record<string, Stat>; overall: Stat };
  /** Mean idle blocks (of 4) on each day, over the runs of the bots that play the chapter through. */
  idleByDay: number[];
  /** The same two, counting only authored prompts (the definition before the mission steps). */
  idleBlocksPromptsOnly: { byBot: Record<string, Stat>; overall: Stat };
  idleByDayPromptsOnly: number[];
  /** The day the mission was completed (runs that completed it), and how many bots' runs did. */
  missionCompleteDay: { byBot: Record<string, Stat>; overall: Stat };
  missionCompletedShare: Record<string, number>;
  /** Mission steps done per run, and runs that ended with the mission unfinished after a refusal for lack of mission money. */
  stepsDone: { byBot: Record<string, Stat>; overall: Stat };
  stepsTotal: number;
  missionMoneyFailures: string[];
  /** Mails marked ignored per run, in all and on Day 1. */
  ignoredMail: { byBot: Record<string, Stat>; overall: Stat };
  ignoredMailDay1: { byBot: Record<string, Stat>; overall: Stat };
  /** Why mail was marked ignored: bot -> reason -> mean per run on each day (index = day). */
  ignoredReasons: Record<string, Record<string, number[]>>;
  /** Meters at the cap, per bot: positive gains asked for, the part lost to the cap, and first-95 days. */
  ceiling: Record<
    string,
    {
      askedHq: number;
      lostHq: number;
      askedHost: number;
      lostHost: number;
      reach95Hq: number;
      reach95Host: number;
      before12Hq: number;
      before12Host: number;
      before12Either: number;
      meanDayHq: number | null;
    }
  >;
  /** Days on which no block had anything waiting, per run. */
  emptyDays: { byBot: Record<string, Stat>; overall: Stat };
  emptyPlans: { byBot: Record<string, Stat>; overall: Stat };
  conflictDays: { byBot: Record<string, Stat>; overall: Stat };
  conflictDaysWithMail: { byBot: Record<string, Stat>; overall: Stat };
  /** Day reached when the run ended (15 = played to the end). */
  dayReached: { byBot: Record<string, Stat>; overall: Stat };
  /** Endings per build counting only the bots that play the whole chapter. */
  endingsByBuildCompetent: Record<string, Record<string, number>>;
  lowestFunds: { byBot: Record<string, Stat>; overall: Stat };
  lowestAvailable: { byBot: Record<string, Stat>; overall: Stat };
  missionIncomplete: { run: string; ending: string | null; day: number }[];
  /** Runs that reached the last day with the mission unfinished. */
  missionFailedAtFinal: { run: string; confirmed: number; total: number }[];
  carefulMissionRate: number;
  planErrors: [string, number][];
  stalls: number;
  workStalled: Record<string, number>;
}

export const runLabel = (r: RunResult) => `${r.bot}/${r.build}/seed${r.seed}`;

/** Why a mail was ignored, from what the bot had in the block that ended without an answer. */
export const IGNORED_REASONS = [
  "fax, away from the embassy",
  "no DP left",
  "issued this block",
  "bot skipped it, DP left",
] as const;
export type IgnoredReason = (typeof IGNORED_REASONS)[number];
export function ignoredReason(m: IgnoredMail): IgnoredReason {
  if (m.fax && !m.atOffice) return "fax, away from the embassy";
  if (m.dpShort) return "no DP left";
  if (m.issuedHere) return "issued this block";
  return "bot skipped it, DP left";
}

function ceilingByBot(results: RunResult[]): Report["ceiling"] {
  const out: Report["ceiling"] = {};
  for (const [bot, rs] of Object.entries(group(results, (r) => r.bot))) {
    const n = rs.length || 1;
    const share = (f: (r: RunResult) => boolean) => rs.filter(f).length / n;
    const hq = (r: RunResult) => r.ceiling.firstAt95.confidence;
    const host = (r: RunResult) => r.ceiling.firstAt95.goodwill;
    const days = rs.flatMap((r) => (hq(r) === null ? [] : [hq(r)!]));
    out[bot] = {
      askedHq: sum(rs.map((r) => r.ceiling.asked.confidence)) / n,
      lostHq: sum(rs.map((r) => r.ceiling.lost.confidence)) / n,
      askedHost: sum(rs.map((r) => r.ceiling.asked.goodwill)) / n,
      lostHost: sum(rs.map((r) => r.ceiling.lost.goodwill)) / n,
      reach95Hq: share((r) => hq(r) !== null),
      reach95Host: share((r) => host(r) !== null),
      before12Hq: share((r) => hq(r) !== null && hq(r)! < 12),
      before12Host: share((r) => host(r) !== null && host(r)! < 12),
      before12Either: share(
        (r) => (hq(r) !== null && hq(r)! < 12) || (host(r) !== null && host(r)! < 12),
      ),
      meanDayHq: days.length ? mean(days) : null,
    };
  }
  return out;
}

function ignoredReasons(results: RunResult[]): Record<string, Record<string, number[]>> {
  const days = Math.max(0, ...results.flatMap((r) => r.ignoredDetail.map((m) => m.day))) + 1;
  const out: Record<string, Record<string, number[]>> = {};
  for (const [bot, rs] of Object.entries(group(results, (r) => r.bot))) {
    const byReason: Record<string, number[]> = Object.fromEntries(
      IGNORED_REASONS.map((reason) => [reason, Array.from({ length: days }, () => 0)]),
    );
    for (const r of rs)
      for (const m of r.ignoredDetail) byReason[ignoredReason(m)]![m.day]! += 1 / rs.length;
    out[bot] = byReason;
  }
  return out;
}

export function aggregate(results: RunResult[]): Report {
  const first = results[0];
  const chapterId = first?.chapterId ?? "";
  const universe = contentUniverse(chapterId);
  const bots = [...new Set(results.map((r) => r.bot))];
  const builds = [...new Set(results.map((r) => r.build))];
  const endings = Object.keys(getChapter(chapterId).manifest.endings);
  const byBot = group(results, (r) => r.bot);
  const byBuild = group(results, (r) => r.build);
  const tally = (rs: RunResult[]) => count(rs.map((r) => r.ending ?? "none"));

  const dominantEnding: Report["dominantEnding"] = {};
  for (const [build, rs] of Object.entries(byBuild)) {
    const top = Object.entries(tally(rs)).sort((a, b) => b[1] - a[1])[0];
    dominantEnding[build] = { ending: top?.[0] ?? "none", share: top ? top[1] / rs.length : 0 };
  }

  const traitMomentsByBuild: Report["traitMomentsByBuild"] = {};
  for (const [build, rs] of Object.entries(byBuild))
    traitMomentsByBuild[build] = {
      all: mean(rs.map(traitMoments)),
      byBot: Object.fromEntries(
        Object.entries(group(rs, (r) => r.bot)).map(([bot, xs]) => [
          bot,
          mean(xs.map(traitMoments)),
        ]),
      ),
    };

  const traitIds = [...new Set(Object.values(universe.traitChoices))].sort();
  const seenAll = new Set(results.flatMap((r) => r.seen));
  const takenAll = new Set(results.flatMap((r) => r.taken));
  const traitCoverage: Report["traitCoverage"] = {};
  for (const trait of traitIds) {
    const own = results.filter((r) => r.traits.includes(trait));
    const gated = Object.entries(universe.traitChoices).filter(([, t]) => t === trait);
    traitCoverage[trait] = {
      gatedChoices: gated.length,
      offeredAny: gated.filter(([id]) => seenAll.has(id)).length,
      takenAny: gated.filter(([id]) => takenAll.has(id)).length,
      takenPerRun: mean(own.map((r) => r.traitChoices[trait] ?? 0)),
      offeredPerRun: mean(own.map((r) => r.traitOffers[trait] ?? 0)),
    };
  }

  const missing = (ids: string[], seen: Set<string>) => ids.filter((id) => !seen.has(id));
  const unseen = (seen: Set<string>) => ({
    events: missing(universe.events, seen),
    topics: missing(universe.topics, seen),
    emails: missing(universe.emails, seen),
    invitations: missing(universe.invitations, seen),
    clippings: missing(universe.clippings, seen),
    choices: missing(universe.choices, seen),
  });
  const shipped = new Set(
    results.filter((r) => r.gameSeed === SHIPPED_GAME_SEED).flatMap((r) => r.seen),
  );

  const statsBy = (pick: (r: RunResult) => number) => ({
    byBot: Object.fromEntries(Object.entries(byBot).map(([b, rs]) => [b, stat(rs.map(pick))])),
    overall: stat(results.map(pick)),
  });
  const careful = byBot["careful"] ?? [];
  const errors: Record<string, number> = {};
  for (const r of results)
    for (const [msg, n] of Object.entries(r.planErrors)) errors[msg] = (errors[msg] ?? 0) + n;

  return {
    languagesByBot: Object.fromEntries(
      Object.entries(byBot).map(([bot, rs]) => [
        bot,
        {
          level: mean(rs.map((r) => r.languageLevel)),
          level2ByDay10: mean(rs.map((r) => Number(r.languageDay10 >= 2))),
          lessons: Object.fromEntries(
            ["sola", "tutor", "fixer"].map((id) => [
              id,
              mean(rs.map((r) => r.languageLessons[`language_lesson_${id}`] ?? 0)),
            ]),
          ),
          attempts: mean(rs.map((r) => r.languageAttempts)),
          errors: mean(rs.map((r) => r.mistranslations)),
          sat: rs.filter((r) => r.exam !== "not-sat").length,
          passed: rs.filter((r) => r.exam === "passed").length,
          failed: rs.filter((r) => r.exam === "failed").length,
        },
      ]),
    ),
    personnelByBot: Object.fromEntries(
      Object.entries(byBot).map(([bot, runs]) => [
        bot,
        {
          reputations: count(runs.flatMap((r) => r.personnel.earnedReputations)),
          quirks: count(runs.flatMap((r) => r.personnel.earnedQuirks)),
          drift: runs.reduce<Record<string, number>>((totals, run) => {
            for (const [key, value] of Object.entries(run.personnel.drift))
              totals[key] = (totals[key] ?? 0) + (value ?? 0);
            return totals;
          }, {}),
        },
      ]),
    ),
    reputationsByBuild: Object.fromEntries(
      Object.entries(byBuild).map(([build, runs]) => [
        build,
        count(runs.flatMap((r) => r.personnel.earnedReputations)),
      ]),
    ),
    epithets: count(results.map((r) => r.epithet)),
    boardMembers: count(results.flatMap((r) => r.board)),
    relationshipStats: Object.fromEntries(
      Object.entries(byBot).map(([bot, runs]) => [
        bot,
        {
          changes: mean(runs.map((r) => r.relationshipChanges)),
          pairs: mean(runs.map((r) => r.pairsChanged)),
          learned: mean(runs.map((r) => r.gossipLearned)),
          passed: mean(runs.map((r) => r.gossipPassed)),
          held: mean(runs.map((r) => r.gossipHeld)),
          falseActed: mean(runs.map((r) => r.falseGossipActed)),
          scenes: mean(runs.map((r) => r.relationshipScenesSeen)),
        },
      ]),
    ),
    demarcheStats: Object.fromEntries(
      Object.entries(byBot).map(([bot, runs]) => [
        bot,
        {
          routes: runs.reduce<Record<string, number>>((acc, run) => {
            for (const [key, count] of Object.entries(run.demarcheRoutes))
              acc[key] = (acc[key] ?? 0) + count;
            return acc;
          }, {}),
          quality: runs.reduce<Record<string, number>>((acc, run) => {
            for (const [key, count] of Object.entries(run.demarcheQuality))
              acc[key] = (acc[key] ?? 0) + count;
            return acc;
          }, {}),
          missed: sum(runs.map((run) => run.demarcheMissed)),
          incidents: sum(runs.map((run) => run.protocolIncidents)),
        },
      ]),
    ),
    routeLockouts: sum(results.map((run) => run.routeLockouts)),
    qualityByTask: results.reduce<Record<string, Record<string, number>>>((all, run) => {
      for (const [task, quality] of Object.entries(run.quality)) {
        const counts = (all[task] ??= {});
        counts[quality] = (counts[quality] ?? 0) + 1;
      }
      return all;
    }, {}),
    routeStats: Object.fromEntries(
      Object.entries(byBot).map(([bot, runs]) => [
        bot,
        {
          routes: runs.reduce<Record<string, number>>((acc, run) => {
            for (const [kind, total] of Object.entries(run.routes))
              acc[kind] = (acc[kind] ?? 0) + total;
            return acc;
          }, {}),
          favoursOwed: sum(runs.map((run) => run.favoursOwed)),
          good: sum(
            runs.map((run) => Object.values(run.quality).filter((q) => q === "good").length),
          ),
          adequate: sum(
            runs.map((run) => Object.values(run.quality).filter((q) => q === "adequate").length),
          ),
          changes: sum(runs.map((run) => run.routeChanges)),
        },
      ]),
    ),
    chapterId,
    runs: results.length,
    bots,
    builds,
    seeds: [...new Set(results.map((r) => r.seed))].sort((a, b) => a - b),
    endings,
    endingsByBot: Object.fromEntries(Object.entries(byBot).map(([b, rs]) => [b, tally(rs)])),
    endingsByBuild: Object.fromEntries(Object.entries(byBuild).map(([b, rs]) => [b, tally(rs)])),
    endingsOverall: tally(results),
    dominantEnding,
    traitMomentsByBuild,
    traitCoverage,
    universe: {
      events: universe.events.length,
      topics: universe.topics.length,
      emails: universe.emails.length,
      invitations: universe.invitations.length,
      clippings: universe.clippings.length,
      choices: universe.choices.length,
    },
    neverSeen: unseen(seenAll),
    neverTaken: { choices: missing(universe.choices, takenAll) },
    neverSeenShipped: unseen(shipped),
    idleBlocks: statsBy((r) => r.idleBlocks),
    idleByDay: idleByDay(
      results.filter((r) => COMPETENT.includes(r.bot)),
      (r) => r.idleByDay,
    ),
    idleBlocksPromptsOnly: statsBy((r) => r.idleBlocksPromptsOnly),
    idleByDayPromptsOnly: idleByDay(
      results.filter((r) => COMPETENT.includes(r.bot)),
      (r) => r.idleByDayPromptsOnly,
    ),
    missionCompleteDay: {
      byBot: Object.fromEntries(
        Object.entries(byBot).map(([b, rs]) => [
          b,
          stat(rs.flatMap((r) => (r.missionCompleteDay === null ? [] : [r.missionCompleteDay]))),
        ]),
      ),
      overall: stat(
        results.flatMap((r) => (r.missionCompleteDay === null ? [] : [r.missionCompleteDay])),
      ),
    },
    missionCompletedShare: Object.fromEntries(
      Object.entries(byBot).map(([b, rs]) => [
        b,
        rs.filter((r) => r.missionCompleteDay !== null).length / (rs.length || 1),
      ]),
    ),
    stepsDone: statsBy((r) => r.stepsDone),
    stepsTotal: results[0]?.stepsTotal ?? 0,
    missionMoneyFailures: results
      .filter((r) => r.missionConfirmed.length < r.missionTotal && r.missionMoneyRefusals > 0)
      .map((r) => runLabel(r)),
    ignoredMail: statsBy((r) => r.ignoredMail),
    ignoredMailDay1: statsBy((r) => r.ignoredMailDay1),
    ignoredReasons: ignoredReasons(results),
    ceiling: ceilingByBot(results),
    emptyDays: statsBy((r) => r.idleByDay.filter((n) => n >= 4).length),
    emptyPlans: statsBy((r) => r.emptyPlans),
    conflictDays: statsBy((r) => r.conflictDays),
    conflictDaysWithMail: statsBy((r) => r.conflictDaysWithMail),
    dayReached: statsBy((r) => r.day),
    endingsByBuildCompetent: Object.fromEntries(
      Object.entries(
        group(
          results.filter((r) => COMPETENT.includes(r.bot)),
          (r) => r.build,
        ),
      ).map(([b, rs]) => [b, tally(rs)]),
    ),
    lowestFunds: statsBy((r) => r.lowestFunds),
    lowestAvailable: statsBy((r) => r.lowestAvailable),
    missionIncomplete: results
      .filter((r) => r.missionConfirmed.length < r.missionTotal)
      .map((r) => ({ run: runLabel(r), ending: r.ending, day: r.day })),
    missionFailedAtFinal: results
      .filter((r) => !r.endedEarly && r.missionConfirmed.length < r.missionTotal)
      .map((r) => ({
        run: runLabel(r),
        confirmed: r.missionConfirmed.length,
        total: r.missionTotal,
      })),
    carefulMissionRate: careful.length
      ? careful.filter((r) => r.missionConfirmed.length >= r.missionTotal).length / careful.length
      : 0,
    planErrors: Object.entries(errors).sort((a, b) => b[1] - a[1]),
    stalls: sum(results.map((r) => r.stalls)),
    workStalled: Object.fromEntries(
      Object.entries(byBot).map(([b, rs]) => [b, mean(rs.map((r) => r.workStalled))]),
    ),
  };
}

// ---- text ---------------------------------------------------------------------------------

const pct = (n: number, of: number) => (of ? `${Math.round((100 * n) / of)}%` : "-");
const percentOf = (share: number) => `${Math.round(100 * share)}%`;
const num = (n: number, digits = 1) => (Number.isInteger(n) ? String(n) : n.toFixed(digits));

/** A plain-text table with padded columns. The first column is left-aligned. */
export function table(head: string[], rows: string[][]): string {
  const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length)));
  const line = (cells: string[]) =>
    cells.map((c, i) => (i === 0 ? c.padEnd(widths[i]!) : c.padStart(widths[i]!))).join("  ");
  return [line(head), widths.map((w) => "-".repeat(w)).join("  "), ...rows.map(line)].join("\n");
}

function endingTable(
  rowsByName: Record<string, Record<string, number>>,
  endings: string[],
  label: string,
): string {
  return table(
    [label, "runs", ...endings],
    Object.entries(rowsByName).map(([name, t]) => {
      const total = sum(Object.values(t));
      return [
        name,
        String(total),
        ...endings.map((e) => (t[e] ? `${t[e]} (${pct(t[e]!, total)})` : ".")),
      ];
    }),
  );
}

const statRow = (name: string, s: Stat, digits = 1) => [
  name,
  num(s.mean, digits),
  num(s.min, digits),
  num(s.max, digits),
];
const statTable = (label: string, byBot: Record<string, Stat>, overall: Stat, digits = 1) =>
  table(
    [label, "mean", "min", "max"],
    [
      ...Object.entries(byBot).map(([b, s]) => statRow(b, s, digits)),
      statRow("all", overall, digits),
    ],
  );

function list(title: string, ids: string[], limit = 40): string {
  if (!ids.length) return `${title}: none`;
  const shown = ids.slice(0, limit).map((id) => `  ${id}`);
  return [
    `${title} (${ids.length}):`,
    ...shown,
    ...(ids.length > limit ? [`  ... and ${ids.length - limit} more`] : []),
  ].join("\n");
}

export function formatReport(r: Report): string {
  const out: string[] = [];
  const h = (t: string) => out.push(`\n== ${t} ==\n`);
  out.push(
    `Simulated playthroughs: chapter ${r.chapterId}, ${r.runs} runs (${r.bots.length} bots x ${r.builds.length} builds x ${r.seeds.length} seeds)`,
  );
  h("Languages per bot");
  for (const [bot, stats] of Object.entries(r.languagesByBot))
    out.push(`${bot}: ${JSON.stringify(stats)}`);
  h("Endings per bot");
  out.push(endingTable(r.endingsByBot, r.endings, "bot"));
  h("Personnel records and debriefs");
  for (const [bot, data] of Object.entries(r.personnelByBot))
    out.push(
      `${bot}: reputations ${JSON.stringify(data.reputations)}; quirks ${JSON.stringify(data.quirks)}; stat drift ${JSON.stringify(data.drift)}`,
    );
  out.push(`Reputations by build: ${JSON.stringify(r.reputationsByBuild)}`);
  out.push(`Epithets: ${JSON.stringify(r.epithets)}`);
  out.push(`Promotion-board appearances: ${JSON.stringify(r.boardMembers)}`);
  h("Relationships and gossip per run");
  out.push(
    table(
      [
        "bot",
        "state changes",
        "pairs changed",
        "learned",
        "passed",
        "held",
        "false acted",
        "scenes",
      ],
      Object.entries(r.relationshipStats).map(([bot, s]) => [
        bot,
        ...[s.changes, s.pairs, s.learned, s.passed, s.held, s.falseActed, s.scenes].map((n) =>
          n.toFixed(1),
        ),
      ]),
    ),
  );
  h("Démarche deliveries and outcomes");
  out.push(
    table(
      [
        "bot",
        "self",
        "colleague",
        "eu",
        "note",
        "good",
        "adequate",
        "failed",
        "missed",
        "incidents",
      ],
      Object.entries(r.demarcheStats).map(([bot, stats]) => [
        bot,
        ...["self", "colleague", "eu", "note"].map((key) => String(stats.routes[key] ?? 0)),
        ...["good", "adequate", "failed"].map((key) => String(stats.quality[key] ?? 0)),
        String(stats.missed),
        String(stats.incidents),
      ]),
    ),
  );
  h("Mission routes and quality");
  out.push(
    table(
      [
        "bot",
        "official",
        "favour",
        "money",
        "eu",
        "knowledge",
        "favours owed",
        "good tasks",
        "adequate tasks",
        "route changes",
      ],
      Object.entries(r.routeStats).map(([bot, stats]) => [
        bot,
        ...["official", "favour", "money", "eu", "knowledge"].map((kind) =>
          String(stats.routes[kind] ?? 0),
        ),
        String(stats.favoursOwed),
        String(stats.good),
        String(stats.adequate),
        String(stats.changes),
      ]),
    ),
  );
  out.push(`\nRoute lock-outs: ${r.routeLockouts}`);
  out.push(
    table(
      ["task", "good", "adequate"],
      Object.entries(r.qualityByTask).map(([task, counts]) => [
        task,
        String(counts["good"] ?? 0),
        String(counts["adequate"] ?? 0),
      ]),
    ),
  );
  h("Endings per trait build (all bots)");
  out.push(endingTable(r.endingsByBuild, r.endings, "build"));
  out.push(
    `\nMost lopsided builds: ${Object.entries(r.dominantEnding)
      .sort((a, b) => b[1].share - a[1].share)
      .slice(0, 5)
      .map(([b, d]) => `${b} ${d.ending} ${Math.round(d.share * 100)}%`)
      .join(", ")}`,
  );
  h("Endings per trait build (careful, socialiser and press-reader only)");
  out.push(endingTable(r.endingsByBuildCompetent, r.endings, "build"));
  h("Day reached (15 = played to the end)");
  out.push(statTable("bot", r.dayReached.byBot, r.dayReached.overall));
  h("Trait moments per run (trait-tagged choices taken), by build and bot");
  out.push(
    table(
      ["build", "all", ...r.bots],
      Object.entries(r.traitMomentsByBuild).map(([b, t]) => [
        b,
        num(t.all),
        ...r.bots.map((bot) => num(t.byBot[bot] ?? 0)),
      ]),
    ),
  );
  h("Trait coverage (runs of builds that include the trait)");
  out.push(
    table(
      ["trait", "gated choices", "ever offered", "ever taken", "offered/run", "taken/run"],
      Object.entries(r.traitCoverage).map(([t, c]) => [
        t,
        String(c.gatedChoices),
        String(c.offeredAny),
        String(c.takenAny),
        num(c.offeredPerRun),
        num(c.takenPerRun),
      ]),
    ),
  );
  h("Content never reached");
  out.push(
    `Authored: ${r.universe.events} story events, ${r.universe.topics} dialogue topics, ${r.universe.emails} emails, ${r.universe.invitations} invitations, ${r.universe.clippings} clippings, ${r.universe.choices} choices.`,
  );
  out.push(list("Story events never seen", r.neverSeen.events));
  out.push(list("Dialogue topics never seen", r.neverSeen.topics));
  out.push(list("Emails never seen", r.neverSeen.emails));
  out.push(list("Invitations never seen", r.neverSeen.invitations));
  out.push(list("Press clippings never seen", r.neverSeen.clippings));
  out.push(list("Choices never offered", r.neverSeen.choices, 25));
  out.push(list("Choices never taken (offered or not)", r.neverTaken.choices, 25));
  out.push(
    `Only counting the shipped game seed: ${r.neverSeenShipped.events.length} events, ${r.neverSeenShipped.topics.length} topics, ${r.neverSeenShipped.choices.length} choices never seen.`,
  );
  h(
    "Blocks with nothing to decide per run (no mail, episode, invitation, lead or mission step waiting)",
  );
  out.push(statTable("bot", r.idleBlocks.byBot, r.idleBlocks.overall));
  h("Mails marked ignored per run");
  out.push(statTable("bot", r.ignoredMail.byBot, r.ignoredMail.overall));
  out.push("\nOf those, marked ignored on Day 1:");
  out.push(statTable("bot", r.ignoredMailDay1.byBot, r.ignoredMailDay1.overall));
  h("Meters at the cap of 100: positive gains asked for, lost to the cap, and first day at 95");
  out.push(
    table(
      [
        "bot",
        "HQ asked",
        "HQ lost",
        "host asked",
        "host lost",
        "HQ at 95",
        "host at 95",
        "HQ mean day",
        "HQ before D12",
        "host before D12",
        "either before D12",
      ],
      Object.entries(r.ceiling).map(([bot, c]) => [
        bot,
        num(c.askedHq),
        num(c.lostHq),
        num(c.askedHost),
        num(c.lostHost),
        percentOf(c.reach95Hq),
        percentOf(c.reach95Host),
        c.meanDayHq === null ? "-" : num(c.meanDayHq),
        percentOf(c.before12Hq),
        percentOf(c.before12Host),
        percentOf(c.before12Either),
      ]),
    ),
  );
  h("Mails marked ignored, by reason and day (mean per run)");
  for (const bot of Object.keys(r.ignoredReasons)) {
    const byReason = r.ignoredReasons[bot]!;
    const days = byReason[IGNORED_REASONS[0]]!.length;
    out.push(`${bot}:`);
    out.push(
      table(
        ["reason", ...Array.from({ length: days - 1 }, (_, i) => String(i + 1)), "total"],
        IGNORED_REASONS.map((reason) => {
          const counts = byReason[reason]!;
          return [
            reason,
            ...counts.slice(1).map((n) => (n ? num(n, 2) : ".")),
            num(sum(counts), 2),
          ];
        }),
      ),
    );
  }
  out.push("\nDays on which nothing at all was waiting (all four blocks idle), per run:");
  out.push(statTable("bot", r.emptyDays.byBot, r.emptyDays.overall));
  out.push("\nIdle blocks (of 4) by day, careful / socialiser / press-reader runs:");
  out.push(
    table(
      ["day", ...r.idleByDay.slice(1).map((_, i) => String(i + 1))],
      [["idle", ...r.idleByDay.slice(1).map((n) => num(n))]],
    ),
  );
  out.push(
    "\nBlocks with no mail, episode, invitation or lead waiting (mission steps not counted):",
  );
  out.push(statTable("bot", r.idleBlocksPromptsOnly.byBot, r.idleBlocksPromptsOnly.overall));
  out.push("\nSame, by day, careful / socialiser / press-reader runs:");
  out.push(
    table(
      ["day", ...r.idleByDayPromptsOnly.slice(1).map((_, i) => String(i + 1))],
      [["idle", ...r.idleByDayPromptsOnly.slice(1).map((n) => num(n))]],
    ),
  );
  out.push("\nBlocks in which the bot itself queued nothing:");
  out.push(statTable("bot", r.emptyPlans.byBot, r.emptyPlans.overall));
  h("Days with a scheduling conflict per run (two or more time-bound things in one block)");
  out.push(statTable("bot", r.conflictDays.byBot, r.conflictDays.overall));
  out.push("\nSame, but ordinary mail arriving in the block also counts as time-bound:");
  out.push(statTable("bot", r.conflictDaysWithMail.byBot, r.conflictDaysWithMail.overall));
  h("Lowest funds seen per run (ƒ; the reserves are part of funds)");
  out.push(statTable("bot", r.lowestFunds.byBot, r.lowestFunds.overall, 0));
  out.push("\nLowest funds above the reserves (visit reserves and mission steps):");
  out.push(statTable("bot", r.lowestAvailable.byBot, r.lowestAvailable.overall, 0));
  h("Mission");
  out.push(
    `Careful bot confirmed all mission tasks in ${Math.round(r.carefulMissionRate * 100)}% of runs.`,
  );
  out.push(
    `Runs that ended with the mission unfinished: ${r.missionIncomplete.length} of ${r.runs}; of those, reached the final day unfinished: ${r.missionFailedAtFinal.length}.`,
  );
  out.push(
    `Runs that left the mission unfinished after a step was refused for lack of money: ${r.missionMoneyFailures.length}.`,
  );
  out.push(
    `\nDay the mission was completed (runs that completed it; the chapter has ${r.stepsTotal} steps):`,
  );
  out.push(
    table(
      ["bot", "completed", "mean day", "earliest", "latest", "steps done"],
      [...Object.keys(r.missionCompleteDay.byBot), "all"].map((b) => {
        const d = b === "all" ? r.missionCompleteDay.overall : r.missionCompleteDay.byBot[b]!;
        const share =
          b === "all"
            ? r.runs
              ? Object.entries(r.missionCompletedShare).reduce(
                  (n, [bot, v]) =>
                    n + v * (r.endingsByBot[bot] ? sum(Object.values(r.endingsByBot[bot]!)) : 0),
                  0,
                ) / r.runs
              : 0
            : r.missionCompletedShare[b]!;
        const steps = b === "all" ? r.stepsDone.overall : r.stepsDone.byBot[b]!;
        return [
          b,
          `${Math.round(share * 100)}%`,
          share ? num(d.mean) : "-",
          share ? String(d.min) : "-",
          share ? String(d.max) : "-",
          num(steps.mean),
        ];
      }),
    ),
  );
  for (const m of r.missionFailedAtFinal.slice(0, 15))
    out.push(`  ${m.run}: ${m.confirmed}/${m.total} tasks`);
  h("Refusals and stalls");
  out.push(`advance() refused a plan ${r.stalls} times.`);
  out.push(
    `Work that stalled per run: ${Object.entries(r.workStalled)
      .map(([b, n]) => `${b} ${num(n)}`)
      .join(", ")}`,
  );
  out.push("Most common refusals the bots hit:");
  for (const [msg, n] of r.planErrors.slice(0, 8)) out.push(`  ${n} x ${msg}`);
  return out.join("\n") + "\n";
}
