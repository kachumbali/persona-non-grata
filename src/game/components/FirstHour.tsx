import { activeChapter } from "../chapters";
import { arrivalParts, waitingItems, type ArrivalPart } from "../inbox";
import { CHECKLIST_HEADING, firstDayChecklist, showChecklist } from "../first-hour";
import { useGame } from "../store";
import { Button } from "@/components/ui/button";

/** One short line, every block: what arrived and is waiting, each item a way to the right place. */
export function ArrivalNotice({ onOpen }: { onOpen: (part: ArrivalPart) => void }) {
  const g = useGame();
  const parts = arrivalParts(waitingItems(g, activeChapter()), g.location === "embassy");
  if (!parts.length) return null;
  return (
    <p
      className="paper mb-2 flex flex-wrap items-center gap-x-1 px-3 py-1 text-sm"
      aria-label="Waiting"
    >
      <strong>Waiting:</strong>{" "}
      {parts.map((part, i) => (
        <span key={part.key} className="inline-flex items-center">
          {part.readable ? (
            <Button
              variant="link"
              className="h-auto min-h-6 whitespace-normal p-0 text-left text-sm underline"
              onClick={() => onOpen(part)}
            >
              {part.text}
            </Button>
          ) : (
            <span>{part.text}</span>
          )}
          {i < parts.length - 1 ? " · " : "."}
        </span>
      ))}
    </p>
  );
}

/** Day 1 only: five lines that tick themselves off. Dismissed once, never shown again in the career. */
export function FirstDayChecklist() {
  const g = useGame();
  if (!showChecklist(g)) return null;
  const items = firstDayChecklist(g, activeChapter());
  return (
    <section className="paper mb-2 px-3 py-2 text-sm" aria-label="First-day checklist">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold">{CHECKLIST_HEADING}</h2>
        <Button size="sm" variant="ghost" onClick={() => g.dismissChecklist()}>
          Dismiss
        </Button>
      </div>
      <ul className="mt-1 space-y-0.5">
        {items.map((item) => (
          <li
            key={item.id}
            data-done={item.done}
            className={item.done ? "text-muted-foreground" : ""}
          >
            <span aria-hidden>{item.done ? "[x]" : "[ ]"}</span>{" "}
            <span className="sr-only">{item.done ? "Done: " : "To do: "}</span>
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
