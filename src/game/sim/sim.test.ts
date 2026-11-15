import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { activeChapterId } from "../chapters";
import { TRAITS, pointsLeft } from "../rules";
import { BOTS } from "./bots";
import { allBuilds, cheapestFlaw, singleTraitBuilds, validBuild } from "./builds";
import { aggregate, COMPETENT, contentUniverse, formatReport, type Report } from "./report";
import { createRng } from "./rng";
import { runMatrix, simulate, type RunResult } from "./run";

/** A reduced matrix: every bot, three builds (two single-trait, one mixed), two seeds. */
const BUILD_IDS = ["namedrop", "liver", "mixed-social"];
const SEEDS = 2;

let results: RunResult[] = [];
let report: Report;
beforeAll(() => {
  results = runMatrix({
    bots: BOTS,
    builds: allBuilds().filter((b) => BUILD_IDS.includes(b.id)),
    seeds: SEEDS,
  });
  report = aggregate(results);
});

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const share = (rs: RunResult[], f: (r: RunResult) => boolean) => rs.filter(f).length / rs.length;
const competent = () => results.filter((r) => COMPETENT.includes(r.bot));
const positive = (r: RunResult) => r.ending === "promoted" || r.ending === "ambassador";

describe("sim building blocks", () => {
  it("builds respect the character builder rules and cover every trait", () => {
    const builds = allBuilds();
    expect(builds).toHaveLength(TRAITS.length + 3);
    for (const b of builds) {
      expect(validBuild(b.traits), b.id).toBe(true);
      expect(pointsLeft(b.traits)).toBeGreaterThanOrEqual(0);
    }
    expect(singleTraitBuilds().map((b) => b.focus)).toEqual(TRAITS.map((t) => t.id));
    expect(TRAITS.find((t) => t.id === cheapestFlaw())?.cost).toBeLessThan(0);
    expect(validBuild(["liver"])).toBe(false); // no flaw
    expect(validBuild(["liver", "namedrop", "eyesopen", "replyall"])).toBe(false); // over budget
    expect(validBuild(["replyall", "cuisine", "brussels", "demarche", "ngo"])).toBe(false); // five
  });

  it("the random generator is seeded and the sim never calls Math.random", () => {
    const a = createRng(7);
    const b = createRng(7);
    expect([a.next(), a.next(), a.int(100)]).toEqual([b.next(), b.next(), b.int(100)]);
    expect(createRng(8).next()).not.toBe(createRng(7).next());
    const dir = join(__dirname);
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts")))
      expect(readFileSync(join(dir, file), "utf8"), file).not.toMatch(/Math\.random\(/);
  });

  it("knows what the chapter authors", () => {
    const u = contentUniverse();
    expect(u.events.length).toBeGreaterThan(20);
    expect(u.topics.length).toBeGreaterThan(40);
    expect(u.choices.length).toBeGreaterThan(300);
    expect(new Set(Object.values(u.traitChoices))).toEqual(new Set(TRAITS.map((t) => t.id)));
  });
});

describe("simulated playthroughs", () => {
  it("is deterministic for a given seed", () => {
    const options = { bot: "socialiser" as const, traits: ["namedrop", "cuisine"], seed: 2 };
    expect(simulate(options)).toEqual(simulate(options));
    const other = simulate({ ...options, seed: 3 });
    expect(other.gameSeed).not.toBe(simulate(options).gameSeed);
    expect(simulate({ ...options, seed: 1 }).gameSeed).toBe(23); // the shipped game's seed
    expect(activeChapterId()).toBe("port-hesperia-2006");
  });

  it("every bot finishes every run, and every turn advances", () => {
    expect(results).toHaveLength(BOTS.length * BUILD_IDS.length * SEEDS);
    for (const r of results) {
      expect(r.stalls, `${r.bot} ${r.build} ${r.seed}`).toBe(0);
      expect(r.ending, `${r.bot} ${r.build} ${r.seed}`).not.toBeNull();
      expect(r.blocksPlayed).toBe(r.turns);
      expect(r.day).toBeGreaterThanOrEqual(2);
    }
  });

  it("records what the screens showed and what the bot took", () => {
    const careful = results.find((r) => r.bot === "careful")!;
    expect(careful.seen.some((id) => id.startsWith("email:"))).toBe(true);
    expect(careful.taken.some((id) => id.startsWith("choice:invitation:"))).toBe(true);
    const ignorer = results.find((r) => r.bot === "ignorer")!;
    expect(ignorer.taken.some((id) => id.startsWith("choice:email:"))).toBe(false);
    expect(report.runs).toBe(results.length);
    expect(Object.values(report.endingsOverall).reduce((a, b) => a + b, 0)).toBe(results.length);
    expect(formatReport(report)).toContain("Endings per bot");
  });

  // ---- thresholds: what the current game achieves, slightly loosened ----------------------
  // Each comment gives the master plan's target and whether today's game meets it.

  it("the careful bot completes the mission in most runs", () => {
    // target: a careful player confirms every mission task. Met today: 100% of runs.
    expect(report.carefulMissionRate).toBeGreaterThanOrEqual(0.8);
  });

  it("no build is dominated by one ending across the bots", () => {
    // target: no build ends in the same ending in more than 70% of runs.
    // Met today: at most 60% per build over all bots (about 40% in this reduced matrix), and at
    // most 89% "promoted" per build when only the three bots that play the whole chapter are
    // counted, which is NOT met for most builds: the ending is chosen by the bot, not the build.
    for (const [build, d] of Object.entries(report.dominantEnding))
      expect(d.share, build).toBeLessThanOrEqual(0.7);
    for (const build of BUILD_IDS) {
      const rs = competent().filter((r) => r.build === build);
      const top = Math.max(
        ...["promoted", "ambassador"].map((e) => share(rs, (r) => r.ending === e)),
      );
      expect(top, build).toBeLessThanOrEqual(0.9);
    }
  });

  it("competent bots win, reckless and ignoring bots lose", () => {
    // target: effort is rewarded and neglect has a price. Met today: every competent run ends
    // promoted or ambassador; reckless always ends "replaced"; the ignorer almost always does.
    expect(share(competent(), positive)).toBeGreaterThanOrEqual(0.8);
    expect(
      share(
        results.filter((r) => r.bot === "reckless"),
        positive,
      ),
    ).toBeLessThanOrEqual(0.2);
    expect(
      share(
        results.filter((r) => r.bot === "ignorer"),
        positive,
      ),
    ).toBeLessThanOrEqual(0.5);
  });

  it("trait builds see trait moments", () => {
    // target: every build sees at least 10 trait moments per run.
    // NOT met today for a bot that plays like a careful player (about 2-3 per run); only the
    // socialiser reaches 10 (11 to 25), because most trait options sit in staff conversations.
    for (const id of BUILD_IDS) {
      const rs = results.filter((r) => r.build === id);
      const moments = (r: RunResult) => Object.values(r.traitChoices).reduce((a, b) => a + b, 0);
      expect(
        mean(rs.filter((r) => r.bot === "socialiser").map(moments)),
        id,
      ).toBeGreaterThanOrEqual(8);
      expect(
        mean(rs.filter((r) => COMPETENT.includes(r.bot)).map(moments)),
        id,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("days carry scheduling conflicts", () => {
    // target: a scheduling conflict on at least 12 of 15 days.
    // NOT met today: about 2 to 3 days per run (timed items: 7 invitations, 4 mission mails and
    // the daily episode rarely land in the same block). Guards against losing the few we have.
    expect(mean(competent().map((r) => r.conflictDays))).toBeGreaterThanOrEqual(1.5);
  });

  it("blocks with nothing to decide stay at today's level or fewer", () => {
    // target: no block without a decision (0 idle blocks of 56).
    // NOT met today: a competent bot finds nothing waiting in about 37 of 56 blocks, because
    // the daily episodes and mail dry up after day 5.
    expect(mean(competent().map((r) => r.idleBlocks))).toBeLessThanOrEqual(42);
  });

  it("funds stay positive", () => {
    // target: the posting can be played without funds going below zero. Met today: lowest
    // funds in any run is about ƒ4,800 (ring-fenced reserves included).
    for (const r of results) expect(r.lowestFunds, `${r.bot} ${r.build}`).toBeGreaterThanOrEqual(0);
  });

  it("not much authored content is unreachable", () => {
    // target: no story event, dialogue topic or choice that no run reaches.
    // NOT met today in this reduced matrix: 1 story event, 1 topic, about 50 choices and 11
    // press clippings are never offered (the full `npm run sim` matrix reaches more).
    expect(report.neverSeen.events.length).toBeLessThanOrEqual(4);
    expect(report.neverSeen.topics.length).toBeLessThanOrEqual(8);
    expect(report.neverSeen.choices.length).toBeLessThanOrEqual(75);
    expect(report.neverSeen.clippings.length).toBeLessThanOrEqual(16);
  });
});
