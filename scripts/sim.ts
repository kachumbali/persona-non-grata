/**
 * Simulated playthroughs: `bun scripts/sim.ts` (npm run sim).
 * Every bot x trait build x seed plays the chapter through the real store; prints the balance report.
 *
 *   bun scripts/sim.ts [--seeds N] [--chapter <id>] [--json <file>] [--bots a,b] [--builds a,b]
 */
import { writeFileSync } from "node:fs";
import { listChapters } from "../src/game/chapters";
import { allBuilds } from "../src/game/sim/builds";
import { BOTS } from "../src/game/sim/bots";
import { aggregate, formatReport } from "../src/game/sim/report";
import { DEFAULT_CHAPTER, runMatrix } from "../src/game/sim/run";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const seeds = Number(arg("seeds") ?? 3);
const chapterId = arg("chapter") ?? DEFAULT_CHAPTER;
const jsonFile = arg("json");
const botFilter = arg("bots")?.split(",");
const buildFilter = arg("builds")?.split(",");
if (!Number.isInteger(seeds) || seeds < 1) throw new Error("--seeds needs a positive integer");
if (!listChapters().some((c) => c.manifest.id === chapterId))
  throw new Error(
    `Unknown chapter ${chapterId}; known: ${listChapters()
      .map((c) => c.manifest.id)
      .join(", ")}`,
  );

const bots = BOTS.filter((b) => !botFilter || botFilter.includes(b.id));
const builds = allBuilds().filter((b) => !buildFilter || buildFilter.includes(b.id));
const started = Date.now();
const results = runMatrix({ chapterId, bots, builds, seeds });

console.log(formatReport(aggregate(results)));
console.log(`(${results.length} runs in ${((Date.now() - started) / 1000).toFixed(1)}s)`);
if (jsonFile) {
  writeFileSync(jsonFile, JSON.stringify(results, null, 2));
  console.log(`Raw results written to ${jsonFile}`);
}
