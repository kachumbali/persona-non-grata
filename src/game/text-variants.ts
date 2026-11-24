import { languageRoll } from "./languages";

/** A text keeps the same wording for a given posting seed and stable content ID. */
export function textVariant(
  text: string,
  variants: readonly string[] | undefined,
  seed: number,
  id: string,
): string {
  const choices = [text, ...(variants ?? [])];
  return choices[languageRoll(seed, id) % choices.length]!;
}
