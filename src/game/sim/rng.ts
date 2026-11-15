/** Seeded random numbers for the simulation. Nothing in src/game/sim may use the global random function. */
export type Rng = {
  /** A float in [0, 1). */
  next: () => number;
  /** An integer in [0, n). */
  int: (n: number) => number;
  /** True with probability p. */
  chance: (p: number) => boolean;
  pick: <T>(items: readonly T[]) => T | undefined;
  shuffle: <T>(items: readonly T[]) => T[];
};

/** FNV-1a over a string, as an unsigned 32-bit integer. */
export function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32: small, fast and good enough for choosing between menu options. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (n: number) => Math.floor(next() * n);
  return {
    next,
    int,
    chance: (p) => next() < p,
    pick: (items) => items[int(items.length)],
    shuffle: (items) => {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(i + 1);
        [out[i], out[j]] = [out[j]!, out[i]!];
      }
      return out;
    },
  };
}
