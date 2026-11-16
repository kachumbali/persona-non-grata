/** The U-02 first-day measurement: newcomer and first-timer, with and without the gentler first day. */
import type { Bot } from "./bots";
import { firstTimer, newcomer } from "./bots";
import type { RunResult } from "./run";
import { simulate } from "./run";
import type { allBuilds } from "./builds";

export interface FirstDayRow {
  bot: string;
  graceOff: boolean;
  runs: number;
  meanHqEndDay1: number;
  meanIgnored: number;
  meanIgnoredDay1: number;
  replacedBeforeDay10: number;
  removedBeforeDay10: number;
  endings: Record<string, number>;
}

export const replacedBeforeDay10 = (r: RunResult) => r.ending === "replaced" && r.day < 10;
export const removedBeforeDay10 = (r: RunResult) => r.endedEarly && r.day < 10;

export function summarise(bot: string, graceOff: boolean, rs: RunResult[]): FirstDayRow {
  const endings: Record<string, number> = {};
  for (const r of rs) endings[r.ending ?? "none"] = (endings[r.ending ?? "none"] ?? 0) + 1;
  return {
    bot,
    graceOff,
    runs: rs.length,
    meanHqEndDay1: rs.reduce((n, r) => n + r.hqEndDay1, 0) / (rs.length || 1),
    meanIgnored: rs.reduce((n, r) => n + r.ignoredMail, 0) / (rs.length || 1),
    meanIgnoredDay1: rs.reduce((n, r) => n + r.ignoredMailDay1, 0) / (rs.length || 1),
    replacedBeforeDay10: rs.filter(replacedBeforeDay10).length / (rs.length || 1),
    removedBeforeDay10: rs.filter(removedBeforeDay10).length / (rs.length || 1),
    endings,
  };
}

/** Run each bot with the gentler first day off ("before") and on ("after"). */
export function measureFirstDay(
  builds: ReturnType<typeof allBuilds>,
  seeds: number,
  bots: Bot[] = [newcomer, firstTimer],
): FirstDayRow[] {
  const rows: FirstDayRow[] = [];
  for (const bot of bots)
    for (const graceOff of [true, false]) {
      const rs: RunResult[] = [];
      for (const build of builds)
        for (let seed = 1; seed <= seeds; seed++)
          rs.push(
            simulate({
              bot,
              traits: build.traits,
              build: build.id,
              seed,
              firstDayGraceOff: graceOff,
            }),
          );
      rows.push(summarise(bot.id, graceOff, rs));
    }
  return rows;
}

export function formatFirstDay(rows: FirstDayRow[]): string {
  const pct = (x: number) => `${(x * 100).toFixed(0)}%`;
  const out = [
    "== First-day measurement (U-02): gentler first day off (before) vs on (after) ==",
    "bot          first day   runs  HQ at end of Day 1  ignored/run  ignored D1  replaced<D10  removed<D10  endings",
  ];
  for (const r of rows)
    out.push(
      `${r.bot.padEnd(12)} ${(r.graceOff ? "before" : "after").padEnd(10)} ${String(r.runs).padStart(5)}  ${r.meanHqEndDay1.toFixed(1).padStart(18)}  ${r.meanIgnored.toFixed(2).padStart(11)}  ${r.meanIgnoredDay1.toFixed(2).padStart(10)}  ${pct(r.replacedBeforeDay10).padStart(12)}  ${pct(r.removedBeforeDay10).padStart(11)}  ${Object.entries(
        r.endings,
      )
        .map(([k, v]) => `${k} ${v}`)
        .join(", ")}`,
    );
  return out.join("\n");
}
