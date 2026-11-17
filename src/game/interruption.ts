import type { StoryEvent } from "./rules";

/** How a pop-up reaches the player. `door` and `fax` are the legacy look of events without a channel. */
export type InterruptionKind = "call" | "message" | "visit" | "door" | "fax";

export interface InterruptionCaller {
  name?: string;
  location?: string;
  role?: string;
}

export interface InterruptionView {
  kind: InterruptionKind;
  header: string;
  text: string;
}

/**
 * The header and body of a story pop-up, given where the player is. A visit from embassy
 * staff only comes to the door while the player is at the embassy; elsewhere it arrives as a
 * message with the event's `remoteText`.
 */
export function interruptionView(
  event: StoryEvent,
  caller: InterruptionCaller | undefined,
  playerLocation: string | undefined,
): InterruptionView {
  const name = caller?.name;
  switch (event.channel) {
    case "visit":
      if (playerLocation === "embassy")
        return {
          kind: "visit",
          header: `At your door · ${name ?? "A colleague"}`,
          text: event.text,
        };
      return {
        kind: "message",
        header: `Message · ${name ?? "Unknown sender"}`,
        text: event.remoteText ?? event.text,
      };
    case "message":
      return { kind: "message", header: `Message · ${name ?? "Unknown sender"}`, text: event.text };
    case "call":
      return { kind: "call", header: `Phone call · ${name ?? "Unknown caller"}`, text: event.text };
    default:
      // Events without a channel keep the look they always had.
      if (caller?.location === "embassy")
        return {
          kind: "door",
          header: `${name ?? "A colleague"} appears at your door`,
          text: event.text,
        };
      if (caller?.role?.toLowerCase().includes("capital"))
        return { kind: "fax", header: "The secure fax starts printing", text: event.text };
      return { kind: "call", header: `Phone call · ${name ?? "Unknown caller"}`, text: event.text };
  }
}
