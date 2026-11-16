import { z } from "zod";
import type { SavedGame } from "./store";
import { activeChapter } from "./chapters";
import { relationshipState } from "./relationships";
import { effectiveTraits, type Drift } from "./personnel";
import { buildDebrief, type Payslip } from "./debrief";

/**
 * The career: everything about the diplomat that outlives one posting.
 * Pure types and functions; no store, DOM or clock access (callers pass `now`).
 */

export const CAREER_VERSION = 1;
export const CODE_PREFIX = "PNG1.";

/** Indexes into data/backgrounds.json; null when unknown (migrated saves). */
export interface BackgroundChoice {
  origin: number | null;
  misstep: number | null;
  reason: number | null;
}
export interface CareerIdentity {
  title: string;
  name: string;
  portrait: string;
  bio: string;
}
export interface PersonRecord {
  trust: number;
  note?: string;
  state?: string;
  tags?: string[];
}
export interface ChapterResult {
  chapterId: string;
  ending: string;
  day: number;
  meters: Record<string, number>;
  score: number;
  /** storyFlags kept as legacy, without internal bookkeeping flags. */
  flags: string[];
  storyOutcomes: Record<string, { status: "chosen" | "missed"; choice?: string }>;
  /** Final trust per character id. */
  trust: Record<string, number>;
  favours?: { owedToYou: Record<string, number>; youOwe: Record<string, number> };
  demarcheCounts?: { delivered: number; failed: number; missed: number };
  relationshipStates?: Record<string, { value: number; state: string; tags: string[] }>;
  personnel?: {
    reputations: string[];
    earnedQuirks: string[];
    curedTraits: string[];
    drift: Drift;
  };
  epithet?: string;
  payslip?: Payslip;
  finishedAt: string;
}
export interface Career {
  version: number;
  identity: CareerIdentity;
  background: BackgroundChoice;
  traits: string[];
  earnedQuirks: string[];
  curedTraits?: string[];
  statDrift?: Drift;
  languages: Record<string, number>;
  languageProgress?: Record<string, number>;
  examAttempts?: number;
  /** True once the player dismissed the first-day checklist: it never returns in this career. */
  firstHourDone?: boolean;
  rank: string;
  savings: number;
  property: string[];
  reputations: string[];
  people: Record<string, PersonRecord>;
  legacyFlags: string[];
  chapters: ChapterResult[];
  createdAt: string;
}
/** One save slot: the career plus the posting in progress, if any. */
export interface SaveSlot {
  career: Career;
  posting: SavedGame | null;
}

export interface CharacterLike extends CareerIdentity {
  traits: string[];
  startingTraits?: string[] | undefined;
  earnedQuirks?: string[] | undefined;
  curedTraits?: string[] | undefined;
  statDrift?: Drift | undefined;
  reputations?: string[] | undefined;
  languages?: Record<string, number> | undefined;
  languageProgress?: Record<string, number> | undefined;
  examAttempts?: number | undefined;
  firstHourDone?: boolean | undefined;
}

/** Flag prefixes that are bookkeeping for the posting and never become legacy. */
export const INTERNAL_FLAG_PREFIXES = [
  "social:",
  "dialogue:",
  "reward:",
  "last-language-speaker:",
] as const;
export const isLegacyFlag = (flag: string) =>
  !INTERNAL_FLAG_PREFIXES.some((prefix) => flag.startsWith(prefix));

export const DEFAULT_RANK = "Chargé d'Affaires a.i.";

export function newCareer(
  character: CharacterLike,
  background: Partial<BackgroundChoice> | null | undefined,
  now: string,
  rank: string = DEFAULT_RANK,
): Career {
  return {
    version: CAREER_VERSION,
    identity: {
      title: character.title,
      name: character.name,
      portrait: character.portrait,
      bio: character.bio,
    },
    background: {
      origin: background?.origin ?? null,
      misstep: background?.misstep ?? null,
      reason: background?.reason ?? null,
    },
    traits: [...character.traits],
    earnedQuirks: [],
    languages: {
      bellaluxian: 3,
      ...character.languages,
      [activeChapter().manifest.hostLanguage?.id ?? "ombrazian"]:
        character.languages?.[activeChapter().manifest.hostLanguage?.id ?? "ombrazian"] ?? 0,
    },
    languageProgress: { ...character.languageProgress },
    examAttempts: character.examAttempts ?? 0,
    firstHourDone: character.firstHourDone ?? false,
    rank,
    savings: 0,
    property: [],
    reputations: [],
    people: {},
    legacyFlags: [],
    chapters: [],
    createdAt: now,
  };
}

/** The character shown in play, derived from the career. */
export function characterOf(career: Career): CharacterLike {
  return {
    ...career.identity,
    traits: effectiveTraits(career.traits, career.earnedQuirks, career.curedTraits ?? []),
    startingTraits: [...career.traits],
    earnedQuirks: [...career.earnedQuirks],
    curedTraits: [...(career.curedTraits ?? [])],
    statDrift: { ...(career.statDrift ?? {}) },
    reputations: [...career.reputations],
    languages: {
      bellaluxian: 3,
      ...(activeChapter().manifest.hostLanguage
        ? { [activeChapter().manifest.hostLanguage!.id]: 0 }
        : {}),
      ...career.languages,
    },
    languageProgress: { ...career.languageProgress },
    examAttempts: career.examAttempts ?? 0,
    firstHourDone: career.firstHourDone ?? false,
  };
}

type ResultSource = Pick<
  SavedGame,
  | "chapterId"
  | "ending"
  | "day"
  | "meters"
  | "score"
  | "storyFlags"
  | "storyOutcomes"
  | "colleagues"
> &
  Partial<SavedGame>;

export function chapterResultFrom(game: ResultSource, now: string): ChapterResult {
  const debrief =
    game.personnel && game.character && game.ending ? buildDebrief(game as SavedGame) : undefined;
  return {
    chapterId: game.chapterId,
    ending: game.ending ?? "unfinished",
    day: game.day,
    meters: { ...game.meters },
    score: game.score,
    ...(game.personnel
      ? {
          personnel: {
            reputations: [...game.personnel.reputations],
            earnedQuirks: [...game.personnel.earnedQuirks],
            curedTraits: [...game.personnel.curedTraits],
            drift: { ...game.personnel.drift },
          },
        }
      : {}),
    ...(debrief ? { epithet: debrief.epithet, payslip: debrief.payslip } : {}),
    flags: [...new Set(game.storyFlags.filter(isLegacyFlag))],
    storyOutcomes: structuredClone(game.storyOutcomes),
    trust: Object.fromEntries(Object.entries(game.colleagues).map(([id, c]) => [id, c.trust])),
    relationshipStates: Object.fromEntries(
      Object.entries(game.colleagues).map(([id, c]) => [
        id,
        {
          value: c.trust,
          state: relationshipState(c.trust),
          tags: [
            ...activeChapter()
              .manifest.startRelationships.filter(
                (r) => (r.a === "player" && r.b === id) || (r.b === "player" && r.a === id),
              )
              .flatMap((r) => r.tags ?? []),
            ...((game.favours?.owedToYou[id] ?? 0) > 0 || (game.favours?.youOwe[id] ?? 0) > 0
              ? ["owes-a-favour"]
              : []),
          ],
        },
      ]),
    ),
    favours: structuredClone(game.favours ?? { owedToYou: {}, youOwe: {} }),
    demarcheCounts: Object.values(game.demarches ?? {}).reduce(
      (counts, entry) => {
        if (entry.status === "missed") counts.missed++;
        else if (entry.status === "delivered" && entry.quality === "failed") counts.failed++;
        else if (entry.status === "delivered") counts.delivered++;
        return counts;
      },
      { delivered: 0, failed: 0, missed: 0 },
    ),
    finishedAt: now,
  };
}

/** Append a chapter result, merge its legacy flags without duplicates, record people's trust. */
export function applyChapterResult(career: Career, result: ChapterResult): Career {
  const people = { ...career.people };
  for (const [id, trust] of Object.entries(result.trust)) {
    const before = people[id];
    const relationship = result.relationshipStates?.[id];
    people[id] = {
      ...before,
      trust,
      ...(relationship ? { state: relationship.state, tags: [...relationship.tags] } : {}),
    };
  }
  return {
    ...career,
    chapters: [...career.chapters, structuredClone(result)],
    legacyFlags: [...new Set([...career.legacyFlags, ...result.flags])],
    people,
    savings: career.savings + (result.payslip?.total ?? 0),
  };
}

/** True when this posting's ending is already the last recorded result of the career. */
export function resultRecorded(career: Career, game: ResultSource): boolean {
  const last = career.chapters.at(-1);
  if (!last || !game.ending) return false;
  const mine = chapterResultFrom(game, last.finishedAt);
  const {
    finishedAt: _mineAt,
    favours: mineFavours,
    demarcheCounts: mineCounts,
    relationshipStates: mineRelationships,
    personnel: minePersonnel,
    epithet: mineEpithet,
    payslip: minePayslip,
    ...mineResult
  } = mine;
  const {
    finishedAt: _lastAt,
    favours: lastFavours,
    demarcheCounts: lastCounts,
    relationshipStates: lastRelationships,
    personnel: lastPersonnel,
    epithet: lastEpithet,
    payslip: lastPayslip,
    ...lastResult
  } = last;
  return (
    JSON.stringify(mineResult) === JSON.stringify(lastResult) &&
    JSON.stringify(mineFavours) === JSON.stringify(lastFavours ?? { owedToYou: {}, youOwe: {} }) &&
    JSON.stringify(mineCounts) ===
      JSON.stringify(lastCounts ?? { delivered: 0, failed: 0, missed: 0 }) &&
    (!lastRelationships ||
      JSON.stringify(mineRelationships) === JSON.stringify(lastRelationships)) &&
    (!lastPersonnel || JSON.stringify(minePersonnel) === JSON.stringify(lastPersonnel)) &&
    (!lastEpithet || mineEpithet === lastEpithet) &&
    (!lastPayslip || JSON.stringify(minePayslip) === JSON.stringify(lastPayslip))
  );
}

// --- Export and import ---

const num = z.number().finite();
const outcome = z.object({
  status: z.enum(["chosen", "missed"]),
  choice: z.string().max(200).optional(),
});
const str = z.string().max(2000);
const id = z.string().min(1).max(200);
const personnelSchema = z.object({
  counters: z.record(id, num),
  reputations: z.array(id),
  earnedReputations: z.array(id),
  reputationSince: z.record(id, num),
  earnedQuirks: z.array(id),
  curedTraits: z.array(id),
  drift: z.record(id, num),
  start: z.object({ traits: z.array(id), stats: z.record(id, num), reputations: z.array(id) }),
  notices: z.array(z.object({ day: num, block: num, quirk: id, text: str })).max(3),
});
const chapterResultSchema = z.object({
  chapterId: id,
  ending: id,
  day: num,
  meters: z.record(id, num),
  score: num,
  flags: z.array(id).max(2000),
  storyOutcomes: z.record(id, outcome),
  trust: z.record(id, num),
  favours: z.object({ owedToYou: z.record(id, num), youOwe: z.record(id, num) }).optional(),
  demarcheCounts: z.object({ delivered: num, failed: num, missed: num }).optional(),
  relationshipStates: z
    .record(id, z.object({ value: num, state: str, tags: z.array(str) }))
    .optional(),
  personnel: z
    .object({
      reputations: z.array(id),
      earnedQuirks: z.array(id),
      curedTraits: z.array(id),
      drift: z.record(id, num),
    })
    .optional(),
  epithet: str.optional(),
  payslip: z
    .object({
      base: num,
      acting: num,
      hardship: num,
      drinks: num,
      moneyRoutes: num,
      total: num,
      advance: num.optional(),
      tutorFees: num.optional(),
      languageAllowance: num.optional(),
    })
    .optional(),
  finishedAt: z.string().max(64),
});
const backgroundIndex = z.number().int().min(0).max(1000).nullable();
const careerSchema = z.object({
  version: z.literal(CAREER_VERSION),
  identity: z.object({
    title: z.string().max(100),
    name: z.string().min(1).max(100),
    portrait: id,
    bio: str,
  }),
  background: z.object({
    origin: backgroundIndex,
    misstep: backgroundIndex,
    reason: backgroundIndex,
  }),
  traits: z.array(id).max(20),
  earnedQuirks: z.array(id).max(200),
  curedTraits: z.array(id).max(20).optional(),
  statDrift: z.record(id, num).optional(),
  languages: z.record(id, z.number().int().min(0).max(4)),
  languageProgress: z.record(id, z.number().int().min(0).max(100000)).optional(),
  examAttempts: z.number().int().min(0).max(1000).optional(),
  firstHourDone: z.boolean().optional(),
  rank: str,
  savings: num,
  property: z.array(id).max(500),
  reputations: z.array(id).max(500),
  people: z.record(
    id,
    z.object({
      trust: num,
      note: str.optional(),
      state: str.optional(),
      tags: z.array(str).optional(),
    }),
  ),
  legacyFlags: z.array(id).max(5000),
  chapters: z.array(chapterResultSchema).max(200),
  createdAt: z.string().max(64),
});
/** The posting is validated on its load-bearing fields; the rest is kept as saved. */
const postingSchema = z
  .object({
    chapterId: id,
    personalFunds: num.nonnegative().optional(),
    tutorFees: num.nonnegative().optional(),
    tutorIgnored: z.number().int().min(0).optional(),
    day: num,
    block: num,
    meters: z.record(id, num),
    ending: z.string().nullable(),
    score: num,
    storyFlags: z.array(z.string().max(500)).max(5000),
    storyOutcomes: z.record(id, outcome),
    favours: z.object({ owedToYou: z.record(id, num), youOwe: z.record(id, num) }).optional(),
    knownFacts: z.array(id).max(5000).optional(),
    personnel: personnelSchema.optional(),
    metPeople: z.array(id).optional(),
    discoveredTraits: z.record(id, z.array(id)).optional(),
    knownRelationships: z.array(id).optional(),
    playerPairChanges: z.array(id).optional(),
    relationshipHistory: z.array(z.object({ day: num, pair: str, from: str, to: str })).optional(),
    stepQualities: z.record(id, z.record(id, z.enum(["good", "adequate"]))).optional(),
    demarches: z
      .record(
        id,
        z.object({
          status: z.enum(["new", "in-progress", "delivered", "missed", "superseded", "skipped"]),
          coordinated: z.boolean().optional(),
          deliveryPending: z.boolean().optional(),
          quality: z.enum(["good", "adequate", "failed"]).optional(),
          route: z.enum(["self", "colleague", "eu", "note"]).optional(),
          worker: id.optional(),
          incident: z.boolean().optional(),
          resolvedDay: num.optional(),
          resolvedBlock: num.optional(),
        }),
      )
      .optional(),
    unrequestedDemarches: num.optional(),
    taskQualities: z.record(id, z.enum(["good", "adequate"])).optional(),
    usedRoutes: z.record(id, id).optional(),
    spentRoutes: z.record(id, z.array(id)).optional(),
    routeDeliveries: z.record(id, z.object({ route: id, dueDay: num })).optional(),
    favourCalls: z.array(z.object({ character: id, dueDay: num })).optional(),
    routeHistory: z.array(z.object({ task: id, step: id, route: id, kind: id })).optional(),
    routeChanges: num.optional(),
    delayedRouteEffects: z
      .array(z.object({ dueDay: num, flag: id.optional(), trust: z.record(id, num).optional() }))
      .optional(),
    colleagues: z.record(id, z.object({ trust: num, fatigue: num })),
    pending: z.array(z.record(z.unknown())),
    character: z
      .object({ title: z.string(), name: z.string(), portrait: z.string() })
      .passthrough()
      .nullable(),
  })
  .passthrough();
export const saveSlotSchema = z.object({
  career: careerSchema,
  posting: postingSchema.nullable(),
});

/** A small checksum (FNV-1a, 32 bit) so truncated or altered pastes are caught. */
export function checksum(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
function fromBase64Url(payload: string): string {
  const padded = payload.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

/** `PNG1.<base64url(JSON)>.<checksum>`: the whole slot, career and posting in progress. */
export function exportCareer(slot: SaveSlot): string {
  const payload = toBase64Url(JSON.stringify(slot));
  return `${CODE_PREFIX}${payload}.${checksum(payload)}`;
}

export type ImportResult = { ok: true; slot: SaveSlot } | { ok: false; error: string };

export function importCareer(code: string): ImportResult {
  const text = (code ?? "").replace(/\s+/g, "");
  if (!text) return { ok: false, error: "Paste a career code first." };
  if (!text.startsWith("PNG"))
    return { ok: false, error: "This is not a Persona Non Grata career code." };
  if (!text.startsWith(CODE_PREFIX))
    return {
      ok: false,
      error: `Unsupported code version "${text.slice(0, text.indexOf(".") > 0 ? text.indexOf(".") : 6)}". This game reads ${CODE_PREFIX.slice(0, -1)} codes.`,
    };
  const body = text.slice(CODE_PREFIX.length);
  const dot = body.lastIndexOf(".");
  if (dot < 1 || body.length - dot - 1 !== 8)
    return { ok: false, error: "The code looks incomplete. Copy the whole code and try again." };
  const payload = body.slice(0, dot);
  if (!/^[A-Za-z0-9_-]+$/.test(payload))
    return { ok: false, error: "The code contains characters that do not belong to it." };
  if (checksum(payload) !== body.slice(dot + 1).toLowerCase())
    return {
      ok: false,
      error:
        "The code is damaged or incomplete (checksum mismatch). Copy the whole code and try again.",
    };
  let data: unknown;
  try {
    data = JSON.parse(fromBase64Url(payload));
  } catch {
    return { ok: false, error: "The code could not be read." };
  }
  const parsed = saveSlotSchema.safeParse(data);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: `The code does not describe a valid career (${issue?.path.join(".") || "root"}: ${issue?.message ?? "invalid"}).`,
    };
  }
  return { ok: true, slot: parsed.data as unknown as SaveSlot };
}
