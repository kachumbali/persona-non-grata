import { campaign } from "./rules";
import { useGame } from "./store";
import { textVariant } from "./text-variants";

/** Match the rendered seeded choice, regardless of which authored wording is selected. */
export function eventChoiceName(eventId: string, choiceId: string): RegExp {
  const event = campaign().events.find((item) => item.id === eventId)!;
  const choice = event.choices.find((item) => item.id === choiceId)!;
  const label = textVariant(
    choice.label,
    choice.labelVariants,
    useGame.getState().seed,
    `event:${eventId}:choice:${choiceId}:label`,
  );
  return new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
}
