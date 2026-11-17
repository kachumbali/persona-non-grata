import { blocks } from "./rules";
import { useGame } from "./store";

export const CRASH_APOLOGY = "Something has gone wrong in a way Capital will want explained.";
export const CRASH_REASSURANCE = "Your saved game has not been changed.";

/** Plain text for the player to paste into a report. Reads the posting as it was when things broke. */
export function errorReport(error: Error): string {
  const read = (value: () => unknown): string => {
    try {
      return String(value());
    } catch {
      return "unknown";
    }
  };
  const stack = (error.stack ?? "").split("\n").slice(0, 6).join("\n");
  return [
    "Persona Non Grata error report",
    `Error: ${error.message || error.name}`,
    ...(stack ? ["Stack:", stack] : []),
    `Day: ${read(() => useGame.getState().day)}`,
    `Block: ${read(() => blocks()[useGame.getState().block]?.name ?? useGame.getState().block)}`,
    `Chapter: ${read(() => useGame.getState().chapterId)}`,
    `Posting version: ${read(() => useGame.persist.getOptions().version)}`,
  ].join("\n");
}
