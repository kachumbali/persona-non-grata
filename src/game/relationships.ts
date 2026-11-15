/** Relationship values remain compatible with delegation and authored pair effects. */
import traits from "./data/npc-traits.json";
import type { CampaignCharacter } from "./chapters/types";
import type { StatKey } from "./rules";

export const RELATIONSHIP_THRESHOLDS = {
  feud: 15,
  rival: 29,
  wary: 44,
  neutral: 59,
  friendly: 79,
} as const;
export type RelationshipState = "ally" | "friendly" | "neutral" | "wary" | "rival" | "feud";
export function relationshipState(value: number): RelationshipState {
  for (const [state, max] of Object.entries(RELATIONSHIP_THRESHOLDS))
    if (value <= max) return state as RelationshipState;
  return "ally";
}
type NpcTrait = {
  id: string;
  name: string;
  description: string;
  likesPlayerTrait?: string;
  dislikesPlayerTrait?: string;
  likesStat?: { stat: string; min: number };
  dislikesStat?: { stat: string; min: number };
  clashesWith?: string;
  clicksWith?: string;
  gossips?: boolean;
  holdsGrudges?: boolean;
};
export const npcTraits: NpcTrait[] = traits;
export const traitsOf = (person: CampaignCharacter) =>
  person.traits.flatMap((id) => npcTraits.filter((t) => t.id === id));
export function firstImpression(
  person: CampaignCharacter,
  playerTraits: string[],
  stats: Record<StatKey, number>,
): number {
  return traitsOf(person).reduce(
    (sum, t) =>
      sum +
      (t.likesPlayerTrait && playerTraits.includes(t.likesPlayerTrait) ? 2 : 0) -
      (t.dislikesPlayerTrait && playerTraits.includes(t.dislikesPlayerTrait) ? 2 : 0) +
      (t.likesStat && stats[t.likesStat.stat as StatKey] >= t.likesStat.min ? 1 : 0) -
      (t.dislikesStat && stats[t.dislikesStat.stat as StatKey] >= t.dislikesStat.min ? 1 : 0),
    0,
  );
}
export function trustModifier(
  person: CampaignCharacter,
  amount: number,
  playerTraits: string[],
): number {
  if (amount <= 0) return amount;
  return (
    amount +
    traitsOf(person).reduce(
      (n, t) =>
        n +
        (t.likesPlayerTrait && playerTraits.includes(t.likesPlayerTrait) ? 1 : 0) -
        (t.dislikesPlayerTrait && playerTraits.includes(t.dislikesPlayerTrait) ? 1 : 0),
      0,
    )
  );
}
export function teamworkChange(a: CampaignCharacter, b: CampaignCharacter): number {
  const links = [
    ...traitsOf(a).map((t) => [t, b.traits] as const),
    ...traitsOf(b).map((t) => [t, a.traits] as const),
  ];
  return Math.max(
    -3,
    Math.min(
      3,
      links.reduce(
        (n, [t, other]) =>
          n +
          (t.clicksWith && other.includes(t.clicksWith) ? 1 : 0) -
          (t.clashesWith && other.includes(t.clashesWith) ? 1 : 0),
        0,
      ),
    ),
  );
}
