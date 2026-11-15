/** Aggregate many RunResults into the numbers a designer reads. Pure: no store, no randomness. */
import { activeChapter, getChapter } from "../chapters";
import type { RunResult } from "./run";
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
  };
  const add = (id: string, gate: { requiresTrait?: string | undefined }) => {
    u.choices.push(id);
    if (gate.requiresTrait) u.traitChoices[id] = gate.requiresTrait;
  };
  for (const e of chapter.campaign.events) {
    u.events.push(`event:${e.id}`);
    for (const c of e.choices) add(`choice:event:${e.id}:${c.id}`, c);
  }
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

export interface Report {
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
  neverSeen: Omit<ContentUniverse, "traitChoices">;
  neverTaken: { choices: string[] };
  /** The same, counting only runs that used the shipped game seed (what players actually get). */
  neverSeenShipped: Omit<ContentUniverse, "traitChoices">;
  idleBlocks: { byBot: Record<string, Stat>; overall: Stat };
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
  h("Endings per bot");
  out.push(endingTable(r.endingsByBot, r.endings, "bot"));
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
  h("Blocks with nothing to decide per run (no mail, episode, invitation or lead waiting)");
  out.push(statTable("bot", r.idleBlocks.byBot, r.idleBlocks.overall));
  out.push("\nBlocks in which the bot itself queued nothing:");
  out.push(statTable("bot", r.emptyPlans.byBot, r.emptyPlans.overall));
  h("Days with a scheduling conflict per run (two or more time-bound things in one block)");
  out.push(statTable("bot", r.conflictDays.byBot, r.conflictDays.overall));
  out.push("\nSame, but ordinary mail arriving in the block also counts as time-bound:");
  out.push(statTable("bot", r.conflictDaysWithMail.byBot, r.conflictDaysWithMail.overall));
  h("Lowest funds seen per run (ƒ; ring-fenced visit reserves are part of funds)");
  out.push(statTable("bot", r.lowestFunds.byBot, r.lowestFunds.overall, 0));
  out.push("\nLowest funds above the ring-fenced reserves:");
  out.push(statTable("bot", r.lowestAvailable.byBot, r.lowestAvailable.overall, 0));
  h("Mission");
  out.push(
    `Careful bot confirmed all mission tasks in ${Math.round(r.carefulMissionRate * 100)}% of runs.`,
  );
  out.push(
    `Runs that ended with the mission unfinished: ${r.missionIncomplete.length} of ${r.runs}; of those, reached the final day unfinished: ${r.missionFailedAtFinal.length}.`,
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
