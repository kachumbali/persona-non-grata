/** Career language progress and seeded language rules. No store or random global state. */
export const LANGUAGE_THRESHOLDS = [4, 8, 16] as const;
export const LANGUAGE_LEVELS = [
  "None",
  "Phrasebook",
  "Dangerous",
  "Working",
  "Exam-certified",
] as const;
/** The report line after a lesson: progress toward the next level, and a level only when it changes. */
export function lessonReport(
  name: string,
  before: number,
  after: { level: number; progress: number },
): string {
  if (after.level > before)
    return `${name}: now at level ${after.level}, ${LANGUAGE_LEVELS[after.level]}.`;
  const need = LANGUAGE_THRESHOLDS[after.level];
  return need === undefined
    ? `${name}: lesson taken.`
    : `${name}: ${after.progress} of ${need} points toward ${LANGUAGE_LEVELS[after.level + 1]}.`;
}
export type LanguageProgress = Record<string, number>;

/** Points carry over between levels. Level four is only awarded by an exam. */
export function learnLanguage(level: number, progress: number, points: number) {
  let nextLevel = Math.max(0, Math.min(4, Math.floor(level)));
  let nextProgress = Math.max(0, progress) + Math.max(0, points);
  while (nextLevel < 3 && nextProgress >= LANGUAGE_THRESHOLDS[nextLevel]!) {
    nextProgress -= LANGUAGE_THRESHOLDS[nextLevel]!;
    nextLevel++;
  }
  if (nextLevel >= 3) nextProgress = 0;
  return { level: nextLevel, progress: nextProgress };
}

/** Stable hash for decisions and exam draws, independent of iteration order. */
export function languageRoll(seed: number, key: string): number {
  return [...key].reduce(
    (n, c) => Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0,
    (seed ^ 2166136261) >>> 0,
  );
}
export function mistranslates(
  seed: number,
  key: string,
  level: number,
  falseFriend = false,
): boolean {
  if (level >= 3) return false;
  const chance = level <= 0 ? 60 : level === 1 ? 60 : 30;
  return languageRoll(seed, key) % 100 < Math.min(100, chance * (falseFriend ? 2 : 1));
}
export function drawExam<T extends { id: string }>(
  questions: T[],
  seed: number,
  attempt: number,
): T[] {
  const ordered = [...questions].sort(
    (a, b) => languageRoll(seed, a.id) - languageRoll(seed, b.id) || a.id.localeCompare(b.id),
  );
  if (!ordered.length) return [];
  const offset = (Math.max(0, attempt) * 5) % ordered.length;
  return Array.from(
    { length: Math.min(5, ordered.length) },
    (_, index) => ordered[(offset + index) % ordered.length]!,
  );
}
