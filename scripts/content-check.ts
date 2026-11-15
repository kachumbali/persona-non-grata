/**
 * Content checker CLI: `bun scripts/content-check.ts` (npm run content:check).
 * Loads every registered chapter, prints findings grouped by file and a per-chapter report,
 * and exits 1 when there is any error.
 */
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { listChapters } from "../src/game/chapters";
import { chapterReport, checkChapter, formatReport, type Finding } from "../src/game/content-check";
import portraits from "../src/game/data/portraits.json";
import traits from "../src/game/data/traits.json";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const portraitDir = join(root, "src/assets/portraits");
const portraitFiles = existsSync(portraitDir) ? readdirSync(portraitDir) : undefined;

let errors = 0;
let warnings = 0;
for (const pack of listChapters()) {
  const findings = checkChapter(pack, {
    traits,
    portraits,
    ...(portraitFiles ? { portraitFiles } : {}),
  });
  console.log(`\n=== Chapter ${pack.manifest.id} ===`);
  const byFile = new Map<string, Finding[]>();
  for (const f of findings) byFile.set(f.file, [...(byFile.get(f.file) ?? []), f]);
  for (const [file, list] of [...byFile].sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`\n${file}`);
    for (const f of list)
      console.log(`  ${f.level.toUpperCase().padEnd(7)} ${f.path}  ${f.message}`);
  }
  const e = findings.filter((f) => f.level === "error").length;
  errors += e;
  warnings += findings.length - e;
  console.log(`\nReport\n${formatReport(chapterReport(pack))}`);
  console.log(`\n${e} error(s), ${findings.length - e} warning(s)`);
}
process.exit(errors ? 1 : 0);
