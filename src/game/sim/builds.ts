import { activeChapter } from "../chapters";
import { pointsLeft, TRAITS } from "../rules";

export interface Build {
  /** Short label used in reports. */
  id: string;
  /** The trait this build is meant to exercise, if it is a single-trait build. */
  focus?: string;
  traits: string[];
}

/** The same rules the character builder enforces: a flaw, at most four traits, points not below zero. */
export function validBuild(traits: string[]): boolean {
  const flaw = traits.some((id) => (TRAITS.find((t) => t.id === id)?.cost ?? 0) < 0);
  return (
    traits.length > 0 &&
    traits.length <= 4 &&
    new Set(traits).size === traits.length &&
    traits.every((id) => TRAITS.some((t) => t.id === id)) &&
    flaw &&
    pointsLeft(traits) >= 0
  );
}

/** How many authored choices a trait gates; a flaw that gates little disturbs a build least. */
function gatedChoices(traitId: string): number {
  const chapter = activeChapter();
  const gated = (c: { requiresTrait?: string }) => (c.requiresTrait === traitId ? 1 : 0);
  let n = 0;
  for (const e of chapter.campaign.events) for (const c of e.choices) n += gated(c);
  for (const topics of Object.values(chapter.dialogues))
    for (const t of topics)
      for (const node of Object.values(t.nodes)) for (const c of node.choices) n += gated(c);
  for (const mail of chapter.emails) for (const o of Object.values(mail.options)) n += gated(o);
  return n;
}

/** The cheapest flaw: the one that refunds most points, then gates the fewest choices. */
export function cheapestFlaw(exclude: string[] = []): string {
  const flaws = TRAITS.filter((t) => t.cost < 0 && !exclude.includes(t.id));
  flaws.sort(
    (a, b) =>
      a.cost - b.cost || gatedChoices(a.id) - gatedChoices(b.id) || a.id.localeCompare(b.id),
  );
  const flaw = flaws[0];
  if (!flaw) throw new Error("No flaw trait exists");
  return flaw.id;
}

/** One build per trait (plus the cheapest valid flaw when the trait is not one itself). */
export function singleTraitBuilds(): Build[] {
  return TRAITS.map((trait) => ({
    id: trait.id,
    focus: trait.id,
    traits: trait.cost < 0 ? [trait.id] : [trait.id, cheapestFlaw([trait.id])],
  }));
}

export const MIXED_BUILDS: Build[] = [
  { id: "mixed-social", traits: ["namedrop", "liver", "sideevents", "cuisine"] },
  { id: "mixed-staff", traits: ["eyesopen", "novelist", "replyall", "brussels"] },
  { id: "mixed-formal", traits: ["punctual", "demarche", "brussels", "ngo"] },
];

export function allBuilds(): Build[] {
  const builds = [...singleTraitBuilds(), ...MIXED_BUILDS];
  for (const b of builds)
    if (!validBuild(b.traits)) throw new Error(`Invalid sim build ${b.id}: ${b.traits.join(", ")}`);
  return builds;
}
