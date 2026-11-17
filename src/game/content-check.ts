/**
 * Content checker (F-04). A pure function that validates one chapter pack against
 * the shape of every content file and against the other files it refers to.
 * No file-system access here: scripts/content-check.ts loads the packs, tests pass fixtures.
 */
import { z } from "zod";
import type { Invitation } from "./calendar";
import type { Topic } from "./dialogues";
import type { Email, StoryChoice, StoryEvent } from "./rules";
import type {
  Campaign,
  ChapterManifest,
  ChapterPack,
  DemarchePack,
  PressData,
} from "./chapters/types";
import { parseStepRef } from "./mission";
import npcTraits from "./data/npc-traits.json";
import languages from "./data/languages.json";
import reputationData from "./data/reputations.json";
import { EARNED_QUIRKS as quirkData } from "./personnel";

export type Finding = {
  level: "error" | "warning";
  file: string;
  path: string;
  message: string;
};

/** The chapter pack as read from disk: nothing is trusted until the schemas have run. */
export type RawChapterPack = { [K in keyof ChapterPack]: unknown };
export type ContentGlobals = {
  traits: unknown;
  portraits: unknown;
  npcTraits?: unknown;
  /** Portrait file names that exist on disk. When omitted, file existence is not checked. */
  portraitFiles?: string[];
};

/** Physical stage directions that cannot happen on a phone call or in a message. */
export const STAGE_DIRECTIONS = [
  "slides",
  "hands you",
  "across the table",
  "the room",
  "leans",
  "sits down",
  "walks in",
];

/** The stage directions in a text, matched case-insensitively. */
export function stageDirections(text: string): string[] {
  const lower = text.toLowerCase();
  return STAGE_DIRECTIONS.filter((phrase) => lower.includes(phrase));
}

/** Length limits from docs/WRITING_GUIDE.md, in words. Going over is a warning. */
export const TEXT_LIMITS = {
  eventTitle: 6,
  eventText: 60,
  choiceLabel: 12,
  choiceResult: 30,
  dialogueText: 30,
  emailSubject: 10,
  emailBody: 40,
  emailOptionText: 30,
  pressHeadline: 6,
  pressBody: 40,
} as const;

/**
 * Flags that store.ts sets by itself, so content may read them without setting them.
 * - exact names: `fuel-lead` (readPress, when a signal clipping is read on day 4 or later)
 *   and `fuel-protected` (the fuel-quay buy / coordinate choices).
 * - prefixes: `trait:` (a trait choice succeeded), `trait-accident:` (a recalled reply-all),
 *   `social:` (a social outing with someone), `dialogue:` (a finished dialogue topic),
 *   `reward:` (a one-off score reward for a source).
 */
export const CODE_SET_FLAGS = {
  exact: [
    "fuel-lead",
    "fuel-protected",
    "language-slang",
    "language-exam:pass",
    "language-exam:fail",
  ],
  prefixes: [
    "trait:",
    "trait-accident:",
    "social:",
    "dialogue:",
    "reward:",
    "last-language-speaker:",
  ],
} as const;

/** Flags that code (not content) reads, so a content choice may set them without a reader in JSON. */
export const CODE_READ_FLAGS = [
  "fuel-lead",
  "fuel-bought",
  "fuel-mira",
  "supplier-check",
  "supplier-accepted",
] as const;

const METERS = ["confidence", "goodwill", "morale", "sanity"] as const;
const STATS = ["gravitas", "charm", "stamina", "deniability", "liver"] as const;
const ACTIONS = ["reply", "delegate", "forward", "note", "replyall", "trait"] as const;
const RESPONSES = ["attend", "delegate", "decline"] as const;
const GENDERS = ["female", "male"] as const;
const TRAIT_FLAG_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// --- schemas -----------------------------------------------------------------------------

function buildSchemas(strict: boolean) {
  const obj = (shape: z.ZodRawShape): z.ZodTypeAny => {
    const o = z.object(shape);
    return strict ? o.strict() : o;
  };
  const str = z.string();
  const num = z.number();
  const int = z.number().int();
  const day = z.number().int();
  const opt = <T extends z.ZodTypeAny>(t: T) => t.optional();
  const effects = obj({
    confidence: opt(num),
    goodwill: opt(num),
    morale: opt(num),
    sanity: opt(num),
    budget: opt(num),
  });
  const talkEffects = z.record(
    z.enum(["confidence", "goodwill", "morale", "sanity", "energy", "money"]),
    num,
  );
  const gate = {
    requiresTrait: opt(str),
    blockedByTrait: opt(str),
    requiresStat: opt(obj({ stat: z.enum(STATS), min: num })),
    requiresReputation: opt(str),
    requiresLanguage: opt(obj({ language: str, min: int.min(1).max(4) })),
  };
  const personnelChoice = {
    counts: opt(z.array(str)),
    statDrift: opt(obj({ stat: z.enum(STATS), delta: z.union([z.literal(-1), z.literal(1)]) })),
  };
  const learning = { favour: opt(obj({ character: str, delta: int })), teaches: opt(str) };
  const storyChoice = obj({
    id: str,
    label: str,
    next: opt(str),
    effects: opt(effects),
    result: opt(str),
    trust: opt(num),
    pair: opt(num),
    pairTarget: opt(str),
    score: opt(num),
    flag: opt(str),
    replace: opt(z.boolean()),
    worker: opt(str),
    contact: opt(str),
    contactTrust: opt(num),
    staff: opt(str),
    cashCost: opt(num),
    formal: opt(z.boolean()),
    ...gate,
    ...learning,
    ...personnelChoice,
  });
  const event = obj({
    callInFor: opt(str),
    id: str,
    title: str,
    npc: str,
    text: str,
    minDay: day,
    expiresDay: opt(day),
    location: opt(str),
    channel: opt(z.enum(["call", "message", "visit"])),
    remoteText: opt(str),
    requires: opt(str),
    requiresFlag: opt(str),
    requiresChoice: opt(obj({ eventId: str, choiceId: str })),
    relationshipGate: opt(
      obj({
        a: str,
        b: str,
        states: opt(z.array(z.enum(["ally", "friendly", "neutral", "wary", "rival", "feud"]))),
        tag: opt(str),
      }),
    ),
    onMiss: opt(obj({ text: str, effects, pair: opt(num), pairTarget: opt(str) })),
    choices: z.array(storyChoice),
  });
  const campaign = obj({
    characters: z.array(
      obj({
        id: str,
        name: str,
        role: str,
        age: opt(int.min(18).max(120)),
        location: str,
        likes: z.array(str),
        dislikes: z.array(str),
        skills: z.array(str),
        line: str,
        refusalGreeting: opt(str),
        traits: z.array(str).min(2).max(3),
        wants: str,
        gender: z.enum(GENDERS),
        portrait: str,
      }),
    ),
    venues: z.array(obj({ id: str, name: str, setting: str, cost: num, description: str })),
    locations: z.array(
      obj({ id: str, name: str, description: str, work: str, effects, cost: num }),
    ),
    dialogue: z.record(str, obj({ text: str, choices: z.array(storyChoice) })),
    events: z.array(event),
    gossip: opt(
      z.array(
        obj({
          id: str,
          text: str,
          subject: str,
          knowers: z.array(str).min(1),
          sensitivity: int.min(1).max(3),
          truth: z.enum(["true", "false", "half-true"]),
          day,
          source: z.enum(["conversation", "press", "reception", "overheard"]),
          requiresLanguage: opt(obj({ language: str, min: int.min(1).max(4) })),
          garbled: opt(str),
        }),
      ),
    ),
  });
  const talkChoice = obj({
    label: str,
    next: opt(str),
    result: opt(str),
    trust: opt(num),
    pair: opt(num),
    pairTarget: opt(str),
    score: opt(num),
    flag: opt(str),
    formal: opt(z.boolean()),
    effects: opt(talkEffects),
    ...gate,
    ...learning,
    ...personnelChoice,
  });
  const dialogues = z.record(
    str,
    z.array(
      obj({
        id: str,
        start: str,
        nodes: z.record(str, obj({ text: str, choices: z.array(talkChoice) })),
      }),
    ),
  );
  const outcome = obj({
    ...learning,
    text: str,
    label: opt(str),
    effects,
    confirmsStep: opt(str),
    formal: opt(z.boolean()),
    ...gate,
    ...personnelChoice,
  });
  const emails = z.array(
    obj({
      id: str,
      day,
      time: int,
      from: str,
      subject: str,
      body: str,
      options: z.record(z.enum(ACTIONS), outcome),
      ignore: outcome,
    }),
  );
  const invChoice = obj({
    label: str,
    text: str,
    effects,
    timeCost: num,
    cashCost: num,
    contactTrust: opt(num),
  });
  const invitations = z.array(
    obj({
      id: str,
      title: str,
      host: str,
      contact: opt(str),
      location: str,
      announceDay: day,
      day,
      block: int,
      description: str,
      choices: obj({ attend: invChoice, delegate: invChoice, decline: invChoice }),
      onMiss: obj({ text: str, effects, contactTrust: opt(num) }),
    }),
  );
  const trigger = obj({
    flag: opt(str),
    notFlag: opt(str),
    outcome: opt(
      obj({ eventId: str, choice: opt(str), status: opt(z.enum(["chosen", "missed"])) }),
    ),
    trait: opt(str),
    meterBelow: opt(obj({ key: z.enum(METERS), value: num })),
    trustBelow: opt(obj({ id: str, value: num })),
    reputation: opt(str),
  });
  const press = obj({
    outlets: z.array(obj({ id: str, name: str, voice: str })),
    clippings: z.array(
      obj({
        id: str,
        outlet: str,
        headline: str,
        body: str,
        original: opt(str),
        day: opt(day),
        minDay: opt(day),
        maxDay: opt(day),
        priority: num,
        trigger: opt(trigger),
        signal: opt(z.boolean()),
        once: opt(z.boolean()),
        teaches: opt(str),
        flagOnRead: opt(str),
        background: opt(obj({ text: str, teaches: str })),
        capital: opt(obj({ confidence: num })),
        maxim: opt(obj({ headline: str, body: str })),
      }),
    ),
    scenario: z.record(str, z.array(str)),
  });
  const manifest = obj({
    firstDayGrace: opt(obj({ from: str, day, untilBlock: z.number().int().min(0) })),
    hostLanguage: opt(
      obj({
        id: str,
        name: str,
        description: str,
        mistranslations: opt(z.array(str).min(20)),
        formalSlang: opt(z.array(str).min(3)),
        homework: opt(
          obj({ from: str, subject: str, body: str, reply: str, ignore: str, quit: str }),
        ),
        exam: opt(
          obj({
            day: int.min(1),
            block: int.min(0),
            examiner: str,
            examinerId: opt(str),
            portrait: opt(str),
            traits: opt(z.array(str).length(2)),
            lines: opt(obj({ pass: str, narrow: str, fail: str, spectacular: str })),
            questions: z
              .array(
                obj({
                  id: str,
                  prompt: str,
                  answers: z
                    .array(obj({ text: str, correct: z.boolean() }))
                    .length(4)
                    .refine(
                      (answers) => answers.filter((answer) => answer.correct).length === 1,
                      "Exactly one answer must be correct",
                    ),
                }),
              )
              .min(15),
          }),
        ),
        teachers: opt(
          z.array(
            obj({ id: str, name: str, character: opt(str), points: int.min(1), fee: num.min(0) }),
          ),
        ),
      }),
    ),
    id: str,
    label: str,
    title: str,
    year: int,
    era: str,
    city: str,
    post: str,
    playerRank: str,
    missionActor: str,
    days: int.min(1),
    blocks: z.array(obj({ name: str, time: num, social: str })).min(1),
    missionTasks: z.record(str, str),
    missionQualityTexts: opt(z.record(str, obj({ good: str, adequate: str }))),
    adequateArrivalConfidence: opt(num),
    missionSteps: z.record(
      str,
      z.array(
        obj({
          id: str,
          label: str,
          short: str,
          earliestDay: int,
          dp: opt(z.number().int().min(1).max(4)),
          skill: opt(str),
          cash: opt(num),
          requiresStep: opt(obj({ task: str, step: str })),
          requiresTrust: opt(obj({ character: str, min: num })),
          gatekeeper: opt(str),
          routes: opt(
            z
              .array(
                obj({
                  id: str,
                  label: str,
                  kind: z.enum(["official", "favour", "money", "eu", "knowledge"]),
                  dp: int.min(1).max(4),
                  cash: num.min(0),
                  fromGeneralFunds: opt(z.boolean()),
                  ...gate,
                  effects: opt(effects),
                  requires: opt(
                    obj({
                      trust: opt(obj({ character: str, min: num })),
                      trustOrFavour: opt(obj({ character: str, min: num })),
                      favour: opt(str),
                      fact: opt(str),
                      flag: opt(str),
                      outcome: opt(obj({ story: str, outcome: str })),
                      expiresDay: opt(int),
                      expiresOnFlag: opt(str),
                      expiresOnFlags: opt(z.array(str)),
                    }),
                  ),
                  days: int.min(0),
                  quality: z.enum(["good", "adequate"]),
                  consequences: opt(
                    obj({
                      oweFavour: opt(str),
                      flag: opt(str),
                      trust: opt(z.record(str, num)),
                      delayed: opt(
                        obj({ day: int, flag: opt(str), trust: opt(z.record(str, num)) }),
                      ),
                    }),
                  ),
                  result: str,
                  ...personnelChoice,
                }),
              )
              .min(2)
              .max(4),
          ),
          result: str,
        }),
      ),
    ),
    setbacks: z.array(
      obj({
        id: str,
        day: int,
        mail: str,
        text: str,
        targets: z.array(obj({ task: str, step: str, label: opt(str), cashDelta: opt(num) })),
      }),
    ),
    endings: z.record(str, obj({ title: str, text: str })),
    debrief: opt(
      obj({
        epithets: z.array(
          obj({
            id: str,
            text: str,
            trait: opt(str),
            counter: opt(str),
            threshold: opt(int),
            flag: opt(str),
            outcome: opt(obj({ event: str, choice: str })),
          }),
        ),
        variants: z.record(str, z.array(obj({ trait: opt(str), reputation: opt(str), text: str }))),
        board: z.record(str, obj({ good: str, mixed: str, bad: str })),
        payslip: obj({
          base: num.min(0),
          acting: num.min(0),
          hardship: num.min(0),
          drinkDeduction: num.min(0),
          moneyRouteDeduction: num.min(0),
          advance: opt(num.min(0)),
          languageAllowance: opt(num.min(0)),
        }),
      }),
    ),
    endingRules: z.array(
      obj({
        ending: str,
        finalDay: opt(z.boolean()),
        meterAtMost: opt(z.record(z.enum(METERS), num)),
        meterAtLeast: opt(z.record(z.enum(METERS), num)),
        missionIncomplete: opt(z.boolean()),
      }),
    ),
    startMeters: obj({ confidence: num, goodwill: num, morale: num, sanity: num }),
    startEnergy: num,
    startComposure: num,
    startTrust: num,
    startLocation: str,
    officeLocation: str,
    startRoom: str,
    startRelationships: z.array(
      obj({
        a: str,
        b: str,
        value: num,
        tags: opt(
          z.array(z.enum(["mentor", "owes-a-favour", "former-couple", "shares-an-office"])),
        ),
      }),
    ),
    openingLog: str,
    economy: obj({
      startFunds: num,
      visitReserves: z.record(str, num),
      supplement: obj({ amount: num, goodwillCost: num, delay: num }),
      reserveRelease: obj({ amount: num, goodwillCost: num }),
      lateFuel: obj({ protectedFlag: str, cost: num }),
    }),
  });
  return {
    manifest,
    campaign,
    dialogues,
    emails,
    invitations,
    press,
    postingBriefing: obj({
      from: str,
      subject: str,
      intro: str,
      sections: z.array(obj({ title: str, text: str })),
    }),
    conversationPayoffs: z.array(obj({ source: str, flag: str, text: str, effects })),
    staffDuties: z.record(str, str),
    embassy: obj({
      rooms: z.array(obj({ id: str, name: str, x: num, z: num, floor: str, kind: str, note: str })),
      staff: z.array(
        obj({
          id: str,
          name: str,
          role: str,
          room: str,
          face: num,
          x: num,
          z: num,
          animal: opt(str),
        }),
      ),
    }),
    euRepresentation: z.record(str, str),
    mailChoices: z.record(str, z.record(z.enum(ACTIONS), str)),
    demarches: obj({
      instructions: z.array(
        obj({
          id: str,
          subject: str,
          instruction: str,
          issuedDay: day,
          issuedBlock: int.min(0).max(3),
          issuedMinute: opt(int.min(0).max(1439)),
          deadlineDay: day,
          deadlineBlock: int.min(0).max(3),
          level: z.enum(["desk", "director", "deputy-minister"]),
          recipient: str,
          talkingPoints: z.array(str).min(2).max(3),
          routes: z.array(
            obj({
              id: str,
              label: str,
              kind: z.enum(["self", "colleague", "eu", "note"]),
              ...gate,
              dp: int.min(0),
              days: int.min(0),
              ...personnelChoice,
            }),
          ),
          report: obj({ good: str, adequate: str, failed: str }),
          fact: opt(str),
          absurd: opt(z.boolean()),
          conflictsWith: opt(str),
          supersededBy: opt(obj({ day, block: int.min(0).max(3), demarcheId: str })),
          traitOptions: opt(z.array(obj({ id: str, label: str, requiresTrait: str, result: str }))),
          gossipOptions: opt(z.array(obj({ id: str, label: str, requiresFact: str, result: str }))),
        }),
      ),
      colleagueLines: z.record(str, str),
      colleagueLevels: z.record(str, z.enum(["desk", "director", "deputy-minister"])),
      unrequested: z.array(obj({ id: str, text: str, effects })),
    }),
  } satisfies Record<keyof ChapterPack, z.ZodTypeAny>;
}

const strictSchemas = buildSchemas(true);
const lenientSchemas = buildSchemas(false);

const globalSchemas = {
  traits: z.array(
    z
      .object({
        id: z.string(),
        name: z.string(),
        cost: z.number(),
        desc: z.string(),
        plays: z.string(),
        stats: z.record(z.enum(STATS), z.number()),
      })
      .strict(),
  ),
  portraits: z.array(
    z
      .object({
        id: z.string(),
        file: z.string(),
        gender: z.enum(GENDERS),
        age: z.string().optional(),
        look: z.string().optional(),
        reservedFor: z.string().optional(),
      })
      .strict(),
  ),
};

// --- helpers -----------------------------------------------------------------------------

const FILE_NAMES: Record<keyof ChapterPack, string> = {
  manifest: "chapter.json",
  campaign: "campaign.json",
  dialogues: "dialogues.json",
  emails: "emails.json",
  invitations: "invitations.json",
  press: "press.json",
  postingBriefing: "posting-briefing.json",
  conversationPayoffs: "conversation-payoffs.json",
  staffDuties: "staff-duties.json",
  embassy: "embassy.json",
  euRepresentation: "eu-representation.json",
  mailChoices: "mail-choices.json",
  demarches: "demarches.json",
};

type Part = string | number;
const pathOf = (parts: Part[]): string =>
  parts.reduce<string>(
    (acc, part) => (typeof part === "number" ? `${acc}[${part}]` : acc ? `${acc}.${part}` : part),
    "",
  );
const words = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;
const gated = (c: {
  requiresTrait?: string | undefined;
  blockedByTrait?: string | undefined;
  requiresStat?: unknown;
  requiresReputation?: string | undefined;
  requiresLanguage?: { language: string; min: number } | undefined;
}): boolean =>
  !!(
    c.requiresTrait ||
    c.blockedByTrait ||
    c.requiresStat ||
    c.requiresReputation ||
    c.requiresLanguage
  );

type Gate = Parameters<typeof gated>[0];

/** Check one file's raw data against its schema; returns the lenient parse for cross-checks. */
function parseFile(
  key: keyof ChapterPack,
  raw: unknown,
  add: (level: Finding["level"], file: string, path: string, message: string) => void,
): unknown {
  const file = FILE_NAMES[key];
  return parseWith(strictSchemas[key], lenientSchemas[key], raw, file, add);
}

function parseWith(
  strictSchema: z.ZodTypeAny,
  lenientSchema: z.ZodTypeAny,
  raw: unknown,
  file: string,
  add: (level: Finding["level"], file: string, path: string, message: string) => void,
): unknown {
  const result = strictSchema.safeParse(raw);
  if (result.success) return result.data;
  const walk = (issues: z.ZodIssue[]) => {
    for (const issue of issues) {
      if (issue.code === "unrecognized_keys") {
        for (const k of issue.keys)
          add(
            "error",
            file,
            pathOf([...issue.path, k]),
            `Unknown field "${k}" (typo? this object has a closed set of fields)`,
          );
      } else if (issue.code === "invalid_union") {
        walk(issue.unionErrors.flatMap((e) => e.issues));
      } else {
        add("error", file, pathOf(issue.path), issue.message);
      }
    }
  };
  walk(result.error.issues);
  const lenient = lenientSchema.safeParse(raw);
  return lenient.success ? lenient.data : undefined;
}

// --- the checker -------------------------------------------------------------------------

export function checkChapter(pack: RawChapterPack, globals: ContentGlobals): Finding[] {
  const findings: Finding[] = [];
  const add = (level: Finding["level"], file: string, path: string, message: string) =>
    findings.push({ level, file, path, message });
  const error = (file: string, path: string, message: string) => add("error", file, path, message);
  const warn = (file: string, path: string, message: string) => add("warning", file, path, message);

  // Global files.
  const traitsFile = "traits.json";
  const portraitsFile = "portraits.json";
  const reputationSchema = z.array(
    z
      .object({
        id: z.string().min(1),
        name: z.string().min(1),
        description: z.string().min(1),
        counter: z.string().min(1),
        threshold: z.number().int().positive(),
        unlocks: z.string().optional(),
        greeting: z.record(z.string(), z.string()).optional(),
      })
      .strict(),
  );
  const quirkSchema = z.array(
    z
      .object({
        id: z.string().min(1),
        name: z.string().min(1),
        description: z.string().min(1),
        stats: z.record(z.enum(STATS), z.number()),
        trigger: z
          .object({
            counter: z.string().optional(),
            threshold: z.number().int().positive().optional(),
            reputation: z.string().optional(),
            days: z.number().int().nonnegative().optional(),
            flag: z.string().optional(),
          })
          .strict(),
        mail: z.string().min(1),
        cures: z.string().optional(),
        replaces: z.string().optional(),
      })
      .strict(),
  );
  parseWith(reputationSchema, reputationSchema, reputationData, "reputations.json", add);
  parseWith(quirkSchema, quirkSchema, quirkData, "earned-quirks.json", add);
  duplicates(
    reputationData,
    (r) => r.id,
    (i, id) => error("reputations.json", pathOf([i, "id"]), `Duplicate reputation "${id}"`),
  );
  duplicates(
    quirkData,
    (q) => q.id,
    (i, id) => error("earned-quirks.json", pathOf([i, "id"]), `Duplicate quirk "${id}"`),
  );
  const npcFile = "npc-traits.json";
  const statHook = z.object({ stat: z.enum(STATS), min: z.number() }).strict();
  const npcSchema = z.array(
    z
      .object({
        id: z.string().min(1),
        name: z.string().min(1),
        description: z.string().min(1),
        likesPlayerTrait: z.string().optional(),
        dislikesPlayerTrait: z.string().optional(),
        likesStat: statHook.optional(),
        dislikesStat: statHook.optional(),
        clashesWith: z.string().optional(),
        clicksWith: z.string().optional(),
        gossips: z.boolean().optional(),
        holdsGrudges: z.boolean().optional(),
      })
      .strict(),
  );
  const npcData =
    (parseWith(npcSchema, npcSchema, globals.npcTraits ?? npcTraits, npcFile, add) as
      z.infer<typeof npcSchema> | undefined) ?? [];
  const traits =
    (parseWith(globalSchemas.traits, globalSchemas.traits, globals.traits, traitsFile, add) as
      { id: string }[] | undefined) ?? [];
  const portraits =
    (parseWith(
      globalSchemas.portraits,
      globalSchemas.portraits,
      globals.portraits,
      portraitsFile,
      add,
    ) as { id: string; file: string; gender: string; reservedFor?: string }[] | undefined) ?? [];
  duplicates(
    traits,
    (t) => t.id,
    (i, id) => error(traitsFile, pathOf([i, "id"]), `Duplicate trait id "${id}"`),
  );
  duplicates(
    npcData,
    (t) => t.id,
    (i, id) => error(npcFile, pathOf([i, "id"]), `Duplicate NPC trait id "${id}"`),
  );
  npcData.forEach((trait, i) => {
    for (const key of ["likesPlayerTrait", "dislikesPlayerTrait"] as const) {
      const value = trait[key];
      if (value && !traits.some((t) => t.id === value))
        error(npcFile, pathOf([i, key]), `Unknown player trait "${value}"`);
    }
    for (const key of ["clashesWith", "clicksWith"] as const) {
      const value = trait[key];
      if (value && !npcData.some((t) => t.id === value))
        error(npcFile, pathOf([i, key]), `Unknown NPC trait "${value}"`);
    }
  });
  duplicates(
    portraits,
    (p) => p.id,
    (i, id) => error(portraitsFile, pathOf([i, "id"]), `Duplicate portrait id "${id}"`),
  );
  if (globals.portraitFiles) {
    const have = new Set(globals.portraitFiles);
    portraits.forEach((p, i) => {
      if (!have.has(p.file))
        error(portraitsFile, pathOf([i, "file"]), `Portrait file "${p.file}" does not exist`);
    });
  }
  const traitIds = new Set([...traits.map((t) => t.id), ...quirkData.map((q) => q.id)]);
  const portraitById = new Map(portraits.map((p) => [p.id, p]));

  // Chapter files.
  const manifest = parseFile("manifest", pack.manifest, add) as ChapterManifest | undefined;
  const campaign = parseFile("campaign", pack.campaign, add) as Campaign | undefined;
  const dialogues = parseFile("dialogues", pack.dialogues, add) as
    Record<string, Topic[]> | undefined;
  const emails = parseFile("emails", pack.emails, add) as Email[] | undefined;
  const invitations = parseFile("invitations", pack.invitations, add) as Invitation[] | undefined;
  const press = parseFile("press", pack.press, add) as PressData | undefined;
  const demarches = parseFile("demarches", pack.demarches, add) as DemarchePack | undefined;
  const briefing = parseFile("postingBriefing", pack.postingBriefing, add) as
    { subject: string; intro: string } | undefined;
  const payoffs = parseFile("conversationPayoffs", pack.conversationPayoffs, add) as
    { source: string; flag: string; text: string }[] | undefined;
  const staffDuties = parseFile("staffDuties", pack.staffDuties, add) as
    Record<string, string> | undefined;
  const embassy = parseFile("embassy", pack.embassy, add) as
    { rooms: { id: string }[]; staff: { id: string; room: string; animal?: string }[] } | undefined;
  const euRep = parseFile("euRepresentation", pack.euRepresentation, add) as
    Record<string, string> | undefined;
  const mailChoices = parseFile("mailChoices", pack.mailChoices, add) as
    Record<string, Record<string, string>> | undefined;

  const days = manifest?.days ?? 0;
  const F = FILE_NAMES;
  const characters = campaign?.characters ?? [];
  const characterIds = new Set(characters.map((c) => c.id));
  const locationIds = new Set((campaign?.locations ?? []).map((l) => l.id));
  const grace = manifest?.firstDayGrace;
  if (grace && (grace.day > days || grace.untilBlock >= (manifest?.blocks.length ?? 0)))
    error(F.manifest, "firstDayGrace", "The first-day grace period must end within the chapter.");
  const host = manifest?.hostLanguage;
  if (host && !host.exam)
    error(F.manifest, "hostLanguage.exam", "A host-language exam is required.");
  if (host && !host.mistranslations)
    error(F.manifest, "hostLanguage.mistranslations", "A mistranslation table is required.");
  if (host?.exam)
    duplicates(
      host.exam.questions,
      (question) => question.id,
      (index, id) =>
        error(
          F.manifest,
          `hostLanguage.exam.questions[${index}].id`,
          `Duplicate exam question id "${id}"`,
        ),
    );
  for (const [index, item] of (campaign?.gossip ?? []).entries()) {
    if (
      item.requiresLanguage &&
      !new Set([...languages.map((language) => language.id), ...(host ? [host.id] : [])]).has(
        item.requiresLanguage.language,
      )
    )
      error(
        F.campaign,
        `gossip[${index}].requiresLanguage.language`,
        `Unknown language id "${item.requiresLanguage.language}"`,
      );
  }
  if (host?.exam?.portrait && !portraitById.has(host.exam.portrait))
    error(F.manifest, "hostLanguage.exam.portrait", `Unknown portrait id "${host.exam.portrait}"`);
  host?.exam?.traits?.forEach((id, index) => {
    if (!npcData.some((trait) => trait.id === id))
      error(F.manifest, `hostLanguage.exam.traits[${index}]`, `Unknown NPC trait id "${id}"`);
  });
  if (host?.exam && (host.exam.day > days || host.exam.block >= (manifest?.blocks.length ?? 0)))
    error(F.manifest, "hostLanguage.exam", "The exam must take place during a chapter block.");
  host?.teachers?.forEach((teacher, index) => {
    if (teacher.character && !characterIds.has(teacher.character))
      error(
        F.manifest,
        `hostLanguage.teachers[${index}].character`,
        `Unknown character id "${teacher.character}"`,
      );
  });
  const venueIds = new Set((campaign?.venues ?? []).map((v) => v.id));
  const taskIds = new Set(Object.keys(manifest?.missionTasks ?? {}));
  const events = campaign?.events ?? [];
  const eventById = new Map(events.map((e) => [e.id, e]));
  const invitationById = new Map((invitations ?? []).map((i) => [i.id, i]));
  const taughtFacts = new Set<string>();
  for (const gossip of campaign?.gossip ?? []) taughtFacts.add(`gossip:${gossip.id}`);
  for (const event of events)
    for (const choice of event.choices) if (choice.teaches) taughtFacts.add(choice.teaches);
  for (const topics of Object.values(dialogues ?? {}))
    for (const topic of topics)
      for (const node of Object.values(topic.nodes))
        for (const choice of node.choices) if (choice.teaches) taughtFacts.add(choice.teaches);
  for (const email of emails ?? [])
    for (const choice of Object.values(email.options))
      if (choice?.teaches) taughtFacts.add(choice.teaches);
  for (const clipping of press?.clippings ?? []) {
    if (clipping.teaches) taughtFacts.add(clipping.teaches);
    if (clipping.background?.teaches) taughtFacts.add(clipping.background.teaches);
  }

  const flagsSet = new Map<string, { file: string; path: string }>();
  const flagsRead: { flag: string; file: string; path: string }[] = [];
  const setFlag = (flag: string | undefined, file: string, path: string) => {
    if (!flag) return;
    if (!flagsSet.has(flag)) flagsSet.set(flag, { file, path });
    if (!TRAIT_FLAG_ID.test(flag))
      warn(file, path, `Flag "${flag}" is not kebab-case (lowercase words joined by hyphens)`);
  };
  const readFlag = (flag: string | undefined, file: string, path: string) => {
    if (flag) flagsRead.push({ flag, file, path });
  };

  const refCheck = (
    ids: Set<string>,
    what: string,
    id: string | undefined,
    file: string,
    path: string,
  ) => {
    if (id !== undefined && !ids.has(id)) error(file, path, `Unknown ${what} "${id}"`);
  };
  const checkGate = (c: Gate, file: string, path: Part[]) => {
    refCheck(traitIds, "trait id", c.requiresTrait, file, pathOf([...path, "requiresTrait"]));
    refCheck(traitIds, "trait id", c.blockedByTrait, file, pathOf([...path, "blockedByTrait"]));
    refCheck(
      new Set([
        ...languages.map((item) => item.id),
        ...(manifest?.hostLanguage ? [manifest.hostLanguage.id] : []),
      ]),
      "language id",
      c.requiresLanguage?.language,
      file,
      pathOf([...path, "requiresLanguage", "language"]),
    );
  };
  const checkDay = (value: number | undefined, file: string, path: Part[], what: string) => {
    if (value === undefined || !days) return;
    if (value < 1 || value > days)
      error(file, pathOf(path), `${what} ${value} is outside the chapter's days 1..${days}`);
  };
  const needText = (text: string | undefined, file: string, path: Part[], what: string) => {
    if (!text || !text.trim()) error(file, pathOf(path), `Missing ${what}`);
  };
  const limit = (
    text: string | undefined,
    max: number,
    file: string,
    path: Part[],
    what: string,
  ) => {
    if (text && words(text) > max)
      warn(file, pathOf(path), `${what} has ${words(text)} words (limit ${max})`);
  };

  if (demarches) {
    const f = F.demarches;
    const all = new Set(demarches.instructions.map((d) => d.id));
    duplicates(
      demarches.instructions,
      (d) => d.id,
      (i, id) => error(f, pathOf(["instructions", i, "id"]), `Duplicate démarche id "${id}"`),
    );
    for (const [i, d] of demarches.instructions.entries()) {
      const at = (...parts: Part[]) => pathOf(["instructions", i, ...parts]);
      refCheck(characterIds, "character id", d.recipient, f, at("recipient"));
      checkDay(d.issuedDay, f, ["instructions", i, "issuedDay"], "issuedDay");
      checkDay(d.deadlineDay, f, ["instructions", i, "deadlineDay"], "deadlineDay");
      if (d.issuedDay * 4 + d.issuedBlock > d.deadlineDay * 4 + d.deadlineBlock)
        error(f, at("deadlineDay"), "Deadline precedes issue");
      if (!d.routes.some((route) => route.kind === "note" && !gated(route)))
        error(f, at("routes"), "An ungated note verbale route is required");
      for (const kind of ["self", "colleague", "eu", "note"])
        if (d.routes.filter((r) => r.kind === kind).length !== 1)
          error(f, at("routes"), `Exactly one ${kind} route is required`);
      duplicates(
        d.routes,
        (r) => r.id,
        (j, id) => error(f, at("routes", j, "id"), `Duplicate route id "${id}"`),
      );
      d.routes.forEach((route, j) => checkGate(route, f, ["instructions", i, "routes", j]));
      refCheck(all, "démarche id", d.conflictsWith, f, at("conflictsWith"));
      refCheck(all, "démarche id", d.supersededBy?.demarcheId, f, at("supersededBy"));
      if (d.conflictsWith === d.id)
        error(f, at("conflictsWith"), "An instruction cannot conflict with itself");
      if (d.supersededBy) {
        checkDay(
          d.supersededBy.day,
          f,
          ["instructions", i, "supersededBy", "day"],
          "superseded day",
        );
        const replacement = demarches.instructions.find(
          (item) => item.id === d.supersededBy!.demarcheId,
        );
        if (
          d.supersededBy.demarcheId === d.id ||
          d.supersededBy.day * 4 + d.supersededBy.block <= d.issuedDay * 4 + d.issuedBlock
        )
          error(f, at("supersededBy"), "Supersession must happen after this instruction");
        if (
          replacement &&
          (replacement.issuedDay !== d.supersededBy.day ||
            replacement.issuedBlock !== d.supersededBy.block)
        )
          error(
            f,
            at("supersededBy"),
            "Replacement must be issued when it supersedes this instruction",
          );
      }
      if (d.fact && !taughtFacts.has(d.fact))
        error(f, at("fact"), `Fact "${d.fact}" is never taught`);
      for (const [j, option] of (d.gossipOptions ?? []).entries())
        if (!taughtFacts.has(option.requiresFact))
          error(f, at("gossipOptions", j, "requiresFact"), "Gossip fact is never taught");
      for (const [j, option] of (d.traitOptions ?? []).entries())
        refCheck(
          traitIds,
          "trait id",
          option.requiresTrait,
          f,
          at("traitOptions", j, "requiresTrait"),
        );
      limit(
        d.instruction,
        TEXT_LIMITS.emailBody,
        f,
        ["instructions", i, "instruction"],
        "Démarche instruction",
      );
      for (const quality of ["good", "adequate", "failed"] as const)
        needText(d.report[quality], f, ["instructions", i, "report", quality], "report text");
    }
    for (const id of Object.keys(demarches.colleagueLines))
      refCheck(characterIds, "character id", id, f, "colleagueLines");
    for (const id of Object.keys(demarches.colleagueLevels))
      refCheck(characterIds, "character id", id, f, "colleagueLevels");
    duplicates(
      demarches.unrequested,
      (d) => d.id,
      (i, id) => error(f, pathOf(["unrequested", i, "id"]), `Duplicate unrequested id "${id}"`),
    );
  }

  // Manifest.
  if (manifest) {
    const f = F.manifest;
    if (!manifest.debrief) error(f, "debrief", "A chapter needs debrief content for every ending");
    if (manifest.debrief) {
      const db = manifest.debrief;
      if (db.epithets.length < 20)
        error(f, "debrief.epithets", "At least 20 epithets are required");
      if (Object.keys(db.board).length < 12)
        error(f, "debrief.board", "At least 12 promotion-board voices are required");
      for (const [id, lines] of Object.entries(db.board)) {
        refCheck(characterIds, "character id", id, f, "debrief.board");
        for (const tone of ["good", "mixed", "bad"] as const)
          needText(lines[tone], f, ["debrief", "board", id, tone], "board line");
      }
      for (const id of Object.keys(manifest.endings))
        if ((db.variants[id]?.length ?? 0) < 8)
          error(f, `debrief.variants.${id}`, "Each ending needs at least eight variants");
      for (const [id, rows] of Object.entries(db.variants)) {
        if (!manifest.endings[id]) error(f, `debrief.variants.${id}`, "Unknown ending");
        rows.forEach((row, i) => {
          refCheck(
            traitIds,
            "trait id",
            row.trait,
            f,
            pathOf(["debrief", "variants", id, i, "trait"]),
          );
          if (row.reputation && !reputationData.some((r) => r.id === row.reputation))
            error(f, pathOf(["debrief", "variants", id, i, "reputation"]), "Unknown reputation");
          if (!row.trait && !row.reputation)
            error(f, pathOf(["debrief", "variants", id, i]), "Variant needs a trait or reputation");
        });
      }
      duplicates(
        db.epithets,
        (item) => item.id,
        (i, id) => error(f, pathOf(["debrief", "epithets", i, "id"]), `Duplicate epithet "${id}"`),
      );
      db.epithets.forEach((item, i) => {
        if (item.trait)
          refCheck(
            traitIds,
            "trait id",
            item.trait,
            f,
            pathOf(["debrief", "epithets", i, "trait"]),
          );
        if (
          item.outcome &&
          !eventById.get(item.outcome.event)?.choices.some((c) => c.id === item.outcome?.choice)
        )
          error(f, pathOf(["debrief", "epithets", i, "outcome"]), "Epithet outcome does not exist");
        if (!item.trait && !item.counter && !item.flag && !item.outcome)
          error(f, pathOf(["debrief", "epithets", i]), "Epithet needs a condition");
      });
    }
    refCheck(locationIds, "location id", manifest.startLocation, f, "startLocation");
    refCheck(locationIds, "location id", manifest.officeLocation, f, "officeLocation");
    const rooms = new Set((embassy?.rooms ?? []).map((r) => r.id));
    refCheck(rooms, "embassy room id", manifest.startRoom, f, "startRoom");
    manifest.startRelationships.forEach((r, i) => {
      refCheck(characterIds, "character id", r.a, f, pathOf(["startRelationships", i, "a"]));
      refCheck(characterIds, "character id", r.b, f, pathOf(["startRelationships", i, "b"]));
      if (
        r.a === r.b ||
        manifest.startRelationships
          .slice(0, i)
          .some((item) => [item.a, item.b].sort().join(":") === [r.a, r.b].sort().join(":"))
      )
        error(f, pathOf(["startRelationships", i]), "Duplicate or self relationship");
    });
    manifest.endingRules.forEach((r, i) =>
      refCheck(
        new Set(Object.keys(manifest.endings)),
        "ending id",
        r.ending,
        f,
        pathOf(["endingRules", i, "ending"]),
      ),
    );
    readFlag(manifest.economy.lateFuel.protectedFlag, f, "economy.lateFuel.protectedFlag");
    manifest.blocks.forEach((b, i) => {
      if (b.time < 0 || b.time >= 1440)
        error(f, pathOf(["blocks", i, "time"]), `Block time ${b.time} is not a minute of the day`);
    });
  }

  // Characters, venues, locations.
  if (campaign) {
    const f = F.campaign;
    duplicates(
      campaign.characters,
      (c) => c.id,
      (i, id) => error(f, pathOf(["characters", i, "id"]), `Duplicate character id "${id}"`),
    );
    duplicates(
      campaign.venues,
      (c) => c.id,
      (i, id) => error(f, pathOf(["venues", i, "id"]), `Duplicate venue id "${id}"`),
    );
    duplicates(
      campaign.locations,
      (c) => c.id,
      (i, id) => error(f, pathOf(["locations", i, "id"]), `Duplicate location id "${id}"`),
    );
    campaign.characters.forEach((c, i) => {
      const at = (k: string) => pathOf(["characters", i, k]);
      c.traits.forEach((trait, j) =>
        refCheck(
          new Set(npcData.map((t) => t.id)),
          "NPC trait id",
          trait,
          f,
          pathOf(["characters", i, "traits", j]),
        ),
      );
      if (c.refusalGreeting) readFlag(`refused-favour-${c.id}`, f, at("refusalGreeting"));
      refCheck(locationIds, "location id", c.location, f, at("location"));
      c.likes.forEach((v, j) =>
        refCheck(venueIds, "venue id", v, f, pathOf(["characters", i, "likes", j])),
      );
      c.dislikes.forEach((v, j) =>
        refCheck(venueIds, "venue id", v, f, pathOf(["characters", i, "dislikes", j])),
      );
      c.skills.forEach((v, j) =>
        refCheck(taskIds, "mission task id", v, f, pathOf(["characters", i, "skills", j])),
      );
      const portrait = portraitById.get(c.portrait);
      if (!portrait) error(f, at("portrait"), `Unknown portrait id "${c.portrait}"`);
      else {
        if (portrait.gender !== c.gender)
          error(
            f,
            at("portrait"),
            `Portrait "${c.portrait}" is ${portrait.gender} but ${c.id} is ${c.gender}`,
          );
        if (portrait.reservedFor && portrait.reservedFor !== c.id)
          error(
            f,
            at("portrait"),
            `Portrait "${c.portrait}" is reserved for "${portrait.reservedFor}"`,
          );
      }
    });
    duplicates(
      campaign.gossip ?? [],
      (g) => g.id,
      (i, id) => error(f, pathOf(["gossip", i, "id"]), `Duplicate gossip id "${id}"`),
    );
    (campaign.gossip ?? []).forEach((g, i) => {
      refCheck(characterIds, "character id", g.subject, f, pathOf(["gossip", i, "subject"]));
      g.knowers.forEach((id, j) =>
        refCheck(characterIds, "character id", id, f, pathOf(["gossip", i, "knowers", j])),
      );
      checkDay(g.day, f, ["gossip", i, "day"], "gossip day");
      if (
        g.source === "conversation" &&
        !g.knowers.some((id) =>
          campaign.characters
            .find((c) => c.id === id)
            ?.traits.some((t) => npcData.find((trait) => trait.id === t && trait.gossips)),
        )
      )
        error(f, pathOf(["gossip", i, "knowers"]), "Conversation gossip needs a gossiping knower");
      if (g.source === "overheard") {
        const subject = campaign.characters.find((c) => c.id === g.subject);
        if (
          !g.knowers.some(
            (id) =>
              campaign.characters.find((c) => c.id === id)?.location === subject?.location &&
              manifest?.startRelationships.some(
                (r) => [r.a, r.b].sort().join(":") === [id, g.subject].sort().join(":"),
              ),
          )
        )
          error(
            f,
            pathOf(["gossip", i, "knowers"]),
            "Overheard gossip needs a present knower with an authored relationship to its subject",
          );
      }
      if (g.source === "reception" && !(invitations ?? []).some((inv) => inv.day >= g.day))
        error(
          f,
          pathOf(["gossip", i, "day"]),
          "No reception remains after this gossip becomes available",
        );
      limit(g.text, TEXT_LIMITS.dialogueText, f, ["gossip", i, "text"], "Gossip text");
    });
    for (const gender of GENDERS) {
      const npcs = campaign.characters.filter((c) => c.gender === gender);
      const eligible = portraits.filter(
        (p) => p.gender === gender && (!p.reservedFor || npcs.some((n) => n.id === p.reservedFor)),
      );
      if (eligible.length >= npcs.length) {
        const seen = new Map<string, string>();
        campaign.characters.forEach((c, i) => {
          if (c.gender !== gender) return;
          const other = seen.get(c.portrait);
          if (other)
            warn(
              f,
              pathOf(["characters", i, "portrait"]),
              `Portrait "${c.portrait}" is also used by ${other}`,
            );
          else seen.set(c.portrait, c.id);
        });
      }
    }

    // Story events.
    duplicates(
      events,
      (e) => e.id,
      (i, id) => error(f, pathOf(["events", i, "id"]), `Duplicate event id "${id}"`),
    );
    for (const [i, inv] of (invitations ?? []).entries())
      if (eventById.has(inv.id))
        error(
          F.invitations,
          pathOf([i, "id"]),
          `Invitation id "${inv.id}" is also a story event id (outcomes share one namespace)`,
        );
    events.forEach((e, i) => {
      const at = (...k: Part[]) => pathOf(["events", i, ...k]);
      refCheck(characterIds, "character id", e.npc, f, at("npc"));
      if (e.relationshipGate) {
        const gate = e.relationshipGate;
        refCheck(characterIds, "character id", gate.a, f, at("relationshipGate"));
        refCheck(characterIds, "character id", gate.b, f, at("relationshipGate"));
        if (
          !manifest?.startRelationships.some(
            (r) => [r.a, r.b].sort().join(":") === [gate.a, gate.b].sort().join(":"),
          )
        )
          error(f, at("relationshipGate"), "Relationship gate must reference an authored pair");
        if (
          gate.tag &&
          !manifest?.startRelationships.some(
            (r) =>
              [r.a, r.b].sort().join(":") === [gate.a, gate.b].sort().join(":") &&
              r.tags?.includes(gate.tag!),
          )
        )
          error(
            f,
            at("relationshipGate"),
            "Relationship gate requires a tag that is never authored",
          );
      }
      refCheck(characterIds, "character id", e.onMiss?.pairTarget, f, at("onMiss"));
      refCheck(characterIds, "character id", e.callInFor, f, at("callInFor"));
      if (e.location) refCheck(locationIds, "location id", e.location, f, at("location"));
      checkDay(e.minDay, f, ["events", i, "minDay"], "minDay");
      checkDay(e.expiresDay, f, ["events", i, "expiresDay"], "expiresDay");
      if (e.expiresDay !== undefined && e.expiresDay < e.minDay)
        error(f, at("expiresDay"), `expiresDay ${e.expiresDay} is before minDay ${e.minDay}`);
      if (e.requires !== undefined) {
        if (!eventById.has(e.requires))
          error(f, at("requires"), `Unknown event id "${e.requires}"`);
        else if (e.requires === e.id) error(f, at("requires"), "Event requires itself");
      }
      readFlag(e.requiresFlag, f, at("requiresFlag"));
      if (e.requiresChoice) {
        // Invitations record outcomes in the same namespace as story events.
        const { eventId, choiceId } = e.requiresChoice;
        const target = eventById.get(eventId);
        if (!target && !invitationById.has(eventId))
          error(f, at("requiresChoice", "eventId"), `Unknown event id "${eventId}"`);
        else {
          const known = target ? target.choices.map((c) => c.id) : RESPONSES.map(String);
          if (!known.includes(choiceId))
            error(f, at("requiresChoice", "choiceId"), `"${eventId}" has no choice "${choiceId}"`);
        }
      }
      if (e.onMiss) needText(e.onMiss.text, f, ["events", i, "onMiss", "text"], "onMiss text");
      limit(e.title, TEXT_LIMITS.eventTitle, f, ["events", i, "title"], "Event title");
      limit(e.text, TEXT_LIMITS.eventText, f, ["events", i, "text"], "Event text");
      if (!e.location && !e.channel)
        error(f, at("channel"), `Pop-up event "${e.id}" needs a channel (call, message or visit)`);
      if (e.channel === "visit") {
        const speaker = characters.find((c) => c.id === e.npc);
        if (speaker && speaker.location !== "embassy")
          error(
            f,
            at("channel"),
            `Visit event "${e.id}" is from "${e.npc}", who does not work at the embassy`,
          );
        if (!e.remoteText?.trim())
          error(f, at("remoteText"), `Visit event "${e.id}" needs a remoteText`);
      }
      if (e.remoteText !== undefined) {
        needText(e.remoteText, f, ["events", i, "remoteText"], "Event remoteText");
        limit(
          e.remoteText,
          TEXT_LIMITS.eventText,
          f,
          ["events", i, "remoteText"],
          "Event remoteText",
        );
      }
      // Calls and messages cannot contain physical stage directions. A visit's remoteText is a message.
      const spoken: [string, string | undefined][] =
        e.channel === "visit"
          ? [["remoteText", e.remoteText]]
          : e.channel === "call" || e.channel === "message"
            ? [["text", e.text]]
            : [];
      for (const [label, body] of spoken) {
        const found = body ? stageDirections(body) : [];
        if (found.length)
          warn(
            f,
            at(label),
            `Event ${label} reads as a stage direction in a call or message: ${found.map((w) => `"${w}"`).join(", ")}`,
          );
      }
      if (!e.choices.length) error(f, at("choices"), `Event "${e.id}" has no choices`);
      duplicates(
        e.choices,
        (c) => c.id,
        (j, id) =>
          error(f, at("choices", j, "id"), `Duplicate choice id "${id}" in event "${e.id}"`),
      );
      if (allGated(e.choices))
        error(
          f,
          at("choices"),
          `Every choice in event "${e.id}" is gated by a trait or stat, so some builds would see no options`,
        );
      e.choices.forEach((c, j) => checkStoryChoice(c, ["events", i, "choices", j]));
    });

    // Generic conversation nodes.
    const gd = campaign.dialogue;
    const gnodes = Object.keys(gd);
    if (!gd["opening"])
      error(f, "dialogue", 'Missing the "opening" node that every conversation starts from');
    for (const [name, node] of Object.entries(gd)) {
      const base: Part[] = ["dialogue", name];
      limit(node.text, TEXT_LIMITS.dialogueText, f, [...base, "text"], "Dialogue text");
      if (!node.choices.length) error(f, pathOf(base), `Dialogue node "${name}" has no choices`);
      if (allGated(node.choices))
        error(f, pathOf([...base, "choices"]), `Every choice in node "${name}" is gated`);
      duplicates(
        node.choices,
        (c) => c.id,
        (j, id) =>
          error(
            f,
            pathOf([...base, "choices", j, "id"]),
            `Duplicate choice id "${id}" in node "${name}"`,
          ),
      );
      node.choices.forEach((c, j) => {
        const cp = [...base, "choices", j];
        if (c.next !== undefined && !gd[c.next])
          error(f, pathOf([...cp, "next"]), `Dialogue next "${c.next}" does not exist`);
        checkStoryChoice(c, cp);
      });
    }
    reachability(
      gnodes,
      "opening",
      (n) => (gd[n]?.choices ?? []).map((c) => c.next),
      (n) => warn(f, pathOf(["dialogue", n]), `Dialogue node "${n}" is unreachable from "opening"`),
    );
  }

  function checkStoryChoice(c: StoryChoice, path: Part[]) {
    const f = F.campaign;
    const at = (k: string) => pathOf([...path, k]);
    checkGate(c, f, path);
    setFlag(c.flag, f, at("flag"));
    refCheck(characterIds, "character id", c.contact, f, at("contact"));
    refCheck(characterIds, "character id", c.staff, f, at("staff"));
    refCheck(characterIds, "character id", c.worker, f, at("worker"));
    refCheck(characterIds, "character id", c.pairTarget, f, at("pairTarget"));
    refCheck(characterIds, "character id", c.favour?.character, f, at("favour.character"));
    if (c.next === undefined)
      needText(c.result, f, [...path, "result"], `result text for choice "${c.id}"`);
    limit(c.label, TEXT_LIMITS.choiceLabel, f, [...path, "label"], "Choice label");
    limit(c.result, TEXT_LIMITS.choiceResult, f, [...path, "result"], "Choice result");
  }

  // Dialogues.
  if (dialogues) {
    const f = F.dialogues;
    for (const [npc, topics] of Object.entries(dialogues)) {
      refCheck(characterIds, "character id", npc, f, npc);
      duplicates(
        topics,
        (t) => t.id,
        (i, id) => error(f, pathOf([npc, i, "id"]), `Duplicate topic id "${id}" for ${npc}`),
      );
      topics.forEach((topic, i) => {
        const tp: Part[] = [npc, i];
        const nodeNames = Object.keys(topic.nodes);
        if (!topic.nodes[topic.start])
          error(
            f,
            pathOf([...tp, "start"]),
            `Start node "${topic.start}" does not exist in topic "${topic.id}"`,
          );
        for (const [name, node] of Object.entries(topic.nodes)) {
          const np = [...tp, "nodes", name];
          limit(node.text, TEXT_LIMITS.dialogueText, f, [...np, "text"], "Dialogue text");
          if (!node.choices.length) error(f, pathOf(np), `Node "${name}" has no choices`);
          if (allGated(node.choices))
            error(
              f,
              pathOf([...np, "choices"]),
              `Every choice in node "${name}" of topic "${topic.id}" is gated by a trait or stat, so some builds would see no options`,
            );
          node.choices.forEach((c, j) => {
            const cp = [...np, "choices", j];
            checkGate(c, f, cp);
            setFlag(c.flag, f, pathOf([...cp, "flag"]));
            refCheck(characterIds, "character id", c.pairTarget, f, pathOf([...cp, "pairTarget"]));
            refCheck(
              characterIds,
              "character id",
              c.favour?.character,
              f,
              pathOf([...cp, "favour", "character"]),
            );
            if (c.next !== undefined && !topic.nodes[c.next])
              error(
                f,
                pathOf([...cp, "next"]),
                `Dialogue next "${c.next}" does not exist in topic "${topic.id}"`,
              );
            if (c.next === undefined) needText(c.result, f, [...cp, "result"], "result text");
            limit(c.label, TEXT_LIMITS.choiceLabel, f, [...cp, "label"], "Choice label");
            limit(c.result, TEXT_LIMITS.choiceResult, f, [...cp, "result"], "Choice result");
          });
        }
        reachability(
          nodeNames,
          topic.start,
          (n) => (topic.nodes[n]?.choices ?? []).map((c) => c.next),
          (n) =>
            warn(
              f,
              pathOf([...tp, "nodes", n]),
              `Node "${n}" of topic "${topic.id}" is unreachable from "${topic.start}"`,
            ),
        );
      });
    }
  }

  // Emails.
  if (emails) {
    const f = F.emails;
    duplicates(
      emails,
      (e) => e.id,
      (i, id) => error(f, pathOf([i, "id"]), `Duplicate email id "${id}"`),
    );
    emails.forEach((e, i) => {
      checkDay(e.day, f, [i, "day"], "day");
      if (e.time < 0 || e.time >= 1440)
        error(f, pathOf([i, "time"]), `time ${e.time} is not a minute of the day`);
      limit(e.subject, TEXT_LIMITS.emailSubject, f, [i, "subject"], "Email subject");
      limit(e.body, TEXT_LIMITS.emailBody, f, [i, "body"], "Email body");
      const options = Object.entries(e.options) as [
        string,
        NonNullable<Email["options"][keyof Email["options"]]>,
      ][];
      if (!options.length) error(f, pathOf([i, "options"]), `Email "${e.id}" has no options`);
      if (options.length && options.every(([, o]) => gated(o)))
        error(
          f,
          pathOf([i, "options"]),
          `Every option in email "${e.id}" is gated by a trait or stat, so some builds would see no options`,
        );
      for (const [action, o] of options) {
        const op: Part[] = [i, "options", action];
        checkGate(o, f, op);
        refCheck(
          characterIds,
          "character id",
          o.favour?.character,
          f,
          pathOf([...op, "favour", "character"]),
        );
        needText(o.text, f, [...op, "text"], "result text");
        limit(o.text, TEXT_LIMITS.emailOptionText, f, [...op, "text"], "Email option text");
        if (o.confirmsStep) {
          const ref = parseStepRef(o.confirmsStep);
          const step = ref
            ? manifest?.missionSteps?.[ref.task]?.find((x) => x.id === ref.step)
            : undefined;
          if (!ref || !step)
            error(
              f,
              pathOf([...op, "confirmsStep"]),
              `Unknown mission step "${o.confirmsStep}" (write it as task.step)`,
            );
          else if (e.day < step.earliestDay)
            error(
              f,
              pathOf([...op, "confirmsStep"]),
              `Email "${e.id}" arrives on day ${e.day}, before "${o.confirmsStep}" can be done (day ${step.earliestDay})`,
            );
        }
      }
      needText(e.ignore.text, f, [i, "ignore", "text"], "result text for ignoring the email");
      limit(
        e.ignore.text,
        TEXT_LIMITS.emailOptionText,
        f,
        [i, "ignore", "text"],
        "Email ignore text",
      );
    });
  }
  if (mailChoices) {
    const f = F.mailChoices;
    const emailById = new Map((emails ?? []).map((e) => [e.id, e]));
    for (const [id, labels] of Object.entries(mailChoices)) {
      const email = emailById.get(id);
      if (!email) {
        error(f, id, `Unknown email id "${id}"`);
        continue;
      }
      for (const action of Object.keys(labels))
        if (!(action in email.options))
          error(f, pathOf([id, action]), `Email "${id}" has no "${action}" option`);
    }
  }

  // Mission steps and setbacks.
  if (manifest) {
    const f = F.manifest;
    const steps = manifest.missionSteps ?? {};
    const emailById = new Map((emails ?? []).map((e) => [e.id, e]));
    const skills = new Set(characters.flatMap((c) => c.skills));
    for (const task of Object.keys(manifest.missionTasks))
      if (!steps[task]?.length)
        error(f, pathOf(["missionSteps", task]), `Mission task "${task}" has no steps`);
    const stepAt = (task: string, id: string) => steps[task]?.find((x) => x.id === id);
    for (const [task, list] of Object.entries(steps)) {
      refCheck(taskIds, "mission task id", task, f, pathOf(["missionSteps", task]));
      duplicates(
        list,
        (x) => x.id,
        (i, id) =>
          error(
            f,
            pathOf(["missionSteps", task, i, "id"]),
            `Duplicate step id "${id}" in "${task}"`,
          ),
      );
      list.forEach((st, i) => {
        const at = (k: string): string => pathOf(["missionSteps", task, i, k]);
        checkDay(st.earliestDay, f, ["missionSteps", task, i, "earliestDay"], "earliestDay");
        if (st.skill && !skills.has(st.skill))
          warn(f, at("skill"), `No character has the skill "${st.skill}", so nobody can be sent`);
        if (st.requiresStep) {
          const other = stepAt(st.requiresStep.task, st.requiresStep.step);
          if (!other)
            error(
              f,
              at("requiresStep"),
              `Unknown step "${st.requiresStep.task}.${st.requiresStep.step}"`,
            );
          else if (st.requiresStep.task === task && st.requiresStep.step === st.id)
            error(f, at("requiresStep"), "A step cannot require itself");
        }
        if (st.requiresTrust) {
          refCheck(
            characterIds,
            "character id",
            st.requiresTrust.character,
            f,
            at("requiresTrust"),
          );
          if (st.requiresTrust.min > 100)
            error(f, at("requiresTrust"), "Minimum trust above 100 can never be met");
        }
        if (st.gatekeeper)
          refCheck(characterIds, "character id", st.gatekeeper, f, at("gatekeeper"));
        if (st.gatekeeper && !st.routes) error(f, at("routes"), "A gatekeeper needs routes");
        if (st.routes) {
          if (!st.gatekeeper) error(f, at("gatekeeper"), "A routed step needs a gatekeeper");
          duplicates(
            st.routes,
            (route) => route.id,
            (j, id) =>
              error(
                f,
                pathOf(["missionSteps", task, i, "routes", j, "id"]),
                `Duplicate route id "${id}"`,
              ),
          );
          const official = st.routes.filter((route) => route.kind === "official");
          if (official.length !== 1)
            error(f, at("routes"), "A routed step needs exactly one official route");
          else if (gated(official[0]!))
            error(f, at("routes"), "The official route must remain ungated.");
          for (const [j, route] of st.routes.entries()) {
            checkGate(route, f, ["missionSteps", task, i, "routes", j]);
            const path = pathOf(["missionSteps", task, i, "routes", j]);
            limit(
              route.label,
              TEXT_LIMITS.choiceLabel,
              f,
              ["missionSteps", task, i, "routes", j, "label"],
              "Route label",
            );
            limit(
              route.result,
              TEXT_LIMITS.choiceResult,
              f,
              ["missionSteps", task, i, "routes", j, "result"],
              "Route result",
            );
            if (route.days > days) error(f, path, "Route delivery exceeds the chapter length");
            if (
              route.kind === "official" &&
              (route.requires ||
                route.cash ||
                route.effects ||
                route.consequences ||
                route.days < 1)
            )
              error(f, path, "The official route must be unconditional and cost only time");
            for (const id of [
              route.requires?.trust?.character,
              route.requires?.trustOrFavour?.character,
              route.requires?.favour,
              route.consequences?.oweFavour,
            ])
              if (id) refCheck(characterIds, "character id", id, f, path);
            for (const id of Object.keys(route.consequences?.trust ?? {}))
              refCheck(characterIds, "character id", id, f, path);
            for (const id of Object.keys(route.consequences?.delayed?.trust ?? {}))
              refCheck(characterIds, "character id", id, f, path);
            if (route.requires?.fact && !taughtFacts.has(route.requires.fact))
              error(f, path, `Fact "${route.requires.fact}" is never taught`);
            if (route.requires?.outcome) {
              const required = route.requires.outcome;
              const event = eventById.get(required.story);
              if (!event || !event.choices.some((choice) => choice.id === required.outcome))
                error(f, path, `Unknown story outcome "${required.story}.${required.outcome}"`);
            }
            if (
              route.consequences?.oweFavour &&
              !events.some((e) => e.callInFor === route.consequences?.oweFavour)
            )
              error(f, path, `No call-in event for "${route.consequences.oweFavour}"`);
            readFlag(route.requires?.flag, f, path);
            readFlag(route.requires?.expiresOnFlag, f, path);
            for (const flag of route.requires?.expiresOnFlags ?? []) readFlag(flag, f, path);
            setFlag(route.consequences?.flag, f, path);
            setFlag(route.consequences?.delayed?.flag, f, path);
            if (route.requires?.expiresDay !== undefined)
              checkDay(
                route.requires.expiresDay,
                f,
                ["missionSteps", task, i, "routes", j, "requires", "expiresDay"],
                "expiresDay",
              );
            if (route.consequences?.delayed)
              checkDay(
                route.consequences.delayed.day,
                f,
                ["missionSteps", task, i, "routes", j, "consequences", "delayed", "day"],
                "delayed day",
              );
          }
        }
        limit(
          st.result,
          TEXT_LIMITS.choiceResult,
          f,
          ["missionSteps", task, i, "result"],
          "Step result",
        );
      });
    }
    // The earliest day each step can be done, following the order within a task and requiresStep.
    // A step that follows a step pushed back by a setback needs one more day. A loop between steps
    // can never be done at all.
    const key = (task: string, id: string) => `${task}.${id}`;
    const finishDays = (
      redo: Map<string, number>,
      baseline?: Map<string, number>,
    ): Map<string, number> => {
      const memo = new Map<string, number>();
      const stack = new Set<string>();
      const finishOf = (task: string, id: string): number => {
        const k = key(task, id);
        const known = memo.get(k);
        if (known !== undefined) return known;
        if (stack.has(k)) return Infinity;
        stack.add(k);
        const list = steps[task] ?? [];
        const index = list.findIndex((x) => x.id === id);
        const st = list[index];
        let day = Math.max(st?.earliestDay ?? Infinity, redo.get(k) ?? 0);
        const before = list[index - 1];
        if (before) {
          const prev = finishOf(task, before.id);
          day = Math.max(day, prev);
        }
        if (st?.requiresStep) {
          const other = finishOf(st.requiresStep.task, st.requiresStep.step);
          day = Math.max(day, other);
        }
        if (Number.isFinite(day) && day >= days) day = days + 1;
        else day += st?.routes?.find((route) => route.kind === "official")?.days ?? 0;
        stack.delete(k);
        memo.set(k, day);
        return day;
      };
      for (const [task, list] of Object.entries(steps))
        for (const st of list) finishOf(task, st.id);
      return memo;
    };
    const baselineDays = finishDays(new Map());
    for (const [task, list] of Object.entries(steps)) {
      const last = list[list.length - 1];
      if (!last) continue;
      const day = baselineDays.get(key(task, last.id)) ?? Infinity;
      if (!Number.isFinite(day))
        error(
          f,
          pathOf(["missionSteps", task]),
          `Task "${task}" can never be finished: its steps require each other in a loop`,
        );
      else if (days && day > days)
        error(
          f,
          pathOf(["missionSteps", task, list.length - 1, "earliestDay"]),
          `The last step of "${task}" cannot be done before day ${day}, but the final day (${days}) is the arrival`,
        );
    }
    // Setbacks.
    duplicates(
      manifest.setbacks ?? [],
      (x) => x.id,
      (i, id) => error(f, pathOf(["setbacks", i, "id"]), `Duplicate setback id "${id}"`),
    );
    (manifest.setbacks ?? []).forEach((sb, i) => {
      const at = (...k: Part[]): string => pathOf(["setbacks", i, ...k]);
      checkDay(sb.day, f, ["setbacks", i, "day"], "day");
      const mail = emailById.get(sb.mail);
      if (!mail) error(f, at("mail"), `Unknown email id "${sb.mail}"`);
      else if (mail.day !== sb.day)
        error(
          f,
          at("mail"),
          `Email "${sb.mail}" arrives on day ${mail.day}, not on the setback's day ${sb.day}`,
        );
      limit(sb.text, TEXT_LIMITS.choiceResult, f, ["setbacks", i, "text"], "Setback text");
      // Reopened steps must be redone in time, one step a day at worst.
      const redo = new Map<string, number>();
      sb.targets.forEach((t, j) => {
        const st = stepAt(t.task, t.step);
        if (!st) {
          error(f, at("targets", j), `Unknown step "${t.task}.${t.step}"`);
          return;
        }
        if (st.earliestDay <= sb.day) {
          redo.set(key(t.task, t.step), sb.day);
          if (st.cash || t.cashDelta)
            error(
              f,
              at("targets", j),
              `"${t.task}.${t.step}" can be reopened, so it must not cost cash`,
            );
        } else if (t.cashDelta !== undefined && t.cashDelta < 0)
          error(f, at("targets", j, "cashDelta"), "A setback cannot make a step cheaper");
      });
      if (redo.size) {
        const after = finishDays(redo, baselineDays);
        for (const [task, list] of Object.entries(steps)) {
          const last = list[list.length - 1];
          if (!last) continue;
          const day = after.get(key(task, last.id)) ?? Infinity;
          if (days && day > days)
            error(
              f,
              at("targets"),
              `After this setback, "${task}" cannot be finished before day ${day}; the player needs it done by day ${days - 1}`,
            );
        }
      }
    });
  }

  // Invitations.
  if (invitations) {
    const f = F.invitations;
    duplicates(
      invitations,
      (e) => e.id,
      (i, id) => error(f, pathOf([i, "id"]), `Duplicate invitation id "${id}"`),
    );
    invitations.forEach((inv, i) => {
      refCheck(locationIds, "location id", inv.location, f, pathOf([i, "location"]));
      refCheck(characterIds, "character id", inv.contact, f, pathOf([i, "contact"]));
      checkDay(inv.announceDay, f, [i, "announceDay"], "announceDay");
      checkDay(inv.day, f, [i, "day"], "day");
      if (inv.announceDay > inv.day)
        error(
          f,
          pathOf([i, "announceDay"]),
          `announceDay ${inv.announceDay} is after day ${inv.day}`,
        );
      if (manifest && (inv.block < 0 || inv.block >= manifest.blocks.length))
        error(
          f,
          pathOf([i, "block"]),
          `block ${inv.block} does not exist (0..${manifest.blocks.length - 1})`,
        );
      for (const r of RESPONSES) {
        needText(inv.choices[r]?.text, f, [i, "choices", r, "text"], "result text");
      }
      needText(inv.onMiss?.text, f, [i, "onMiss", "text"], "onMiss text");
    });
  }

  // Press.
  if (press) {
    const f = F.press;
    const outlets = new Set(press.outlets.map((o) => o.id));
    const clippingIds = new Set(press.clippings.map((c) => c.id));
    duplicates(
      press.outlets,
      (o) => o.id,
      (i, id) => error(f, pathOf(["outlets", i, "id"]), `Duplicate outlet id "${id}"`),
    );
    duplicates(
      press.clippings,
      (c) => c.id,
      (i, id) => error(f, pathOf(["clippings", i, "id"]), `Duplicate clipping id "${id}"`),
    );
    if (!clippingIds.has("horoscope"))
      error(
        f,
        "clippings",
        'Missing the "horoscope" clipping that the press review always appends',
      );
    press.clippings.forEach((c, i) => {
      const at = (...k: Part[]) => pathOf(["clippings", i, ...k]);
      setFlag(c.flagOnRead, f, at("flagOnRead"));
      refCheck(outlets, "outlet id", c.outlet, f, at("outlet"));
      checkDay(c.day, f, ["clippings", i, "day"], "day");
      checkDay(c.minDay, f, ["clippings", i, "minDay"], "minDay");
      checkDay(c.maxDay, f, ["clippings", i, "maxDay"], "maxDay");
      if (c.minDay !== undefined && c.maxDay !== undefined && c.minDay > c.maxDay)
        error(f, at("maxDay"), `maxDay ${c.maxDay} is before minDay ${c.minDay}`);
      limit(c.headline, TEXT_LIMITS.pressHeadline, f, ["clippings", i, "headline"], "Headline");
      limit(c.body, TEXT_LIMITS.pressBody, f, ["clippings", i, "body"], "Press body");
      if (c.maxim) {
        limit(
          c.maxim.headline,
          TEXT_LIMITS.pressHeadline,
          f,
          ["clippings", i, "maxim", "headline"],
          "Headline",
        );
        limit(
          c.maxim.body,
          TEXT_LIMITS.pressBody,
          f,
          ["clippings", i, "maxim", "body"],
          "Press body",
        );
      }
      const t = c.trigger;
      if (!t) return;
      readFlag(t.flag, f, at("trigger", "flag"));
      readFlag(t.notFlag, f, at("trigger", "notFlag"));
      // `accident:replyall` matches the `trait-accident:replyall:*` flags that store.ts sets.
      if (!t.trait?.startsWith("accident:"))
        refCheck(traitIds, "trait id", t.trait, f, at("trigger", "trait"));
      refCheck(
        characterIds,
        "character id",
        t.trustBelow?.id,
        f,
        at("trigger", "trustBelow", "id"),
      );
      if (t.outcome) {
        const ev = eventById.get(t.outcome.eventId);
        const inv = invitationById.get(t.outcome.eventId);
        if (!ev && !inv)
          error(f, at("trigger", "outcome", "eventId"), `Unknown event id "${t.outcome.eventId}"`);
        else if (t.outcome.choice !== undefined) {
          const known = ev ? ev.choices.map((x) => x.id) : RESPONSES.map(String);
          if (!known.includes(t.outcome.choice))
            error(
              f,
              at("trigger", "outcome", "choice"),
              `"${t.outcome.eventId}" has no choice "${t.outcome.choice}"`,
            );
        }
      }
    });
    for (const [dayKey, ids] of Object.entries(press.scenario)) {
      const n = Number(dayKey);
      if (!Number.isInteger(n))
        error(f, pathOf(["scenario", dayKey]), `Scenario key "${dayKey}" is not a day number`);
      else checkDay(n, f, ["scenario", dayKey], "scenario day");
      ids.forEach((id, j) => {
        const clip = press.clippings.find((c) => c.id === id);
        if (!clip) {
          error(f, pathOf(["scenario", dayKey, j]), `Unknown clipping id "${id}"`);
          return;
        }
        if (Number.isInteger(n)) {
          const outOfWindow =
            (clip.day !== undefined && clip.day !== n) ||
            (clip.minDay !== undefined && n < clip.minDay) ||
            (clip.maxDay !== undefined && n > clip.maxDay);
          if (outOfWindow)
            warn(
              f,
              pathOf(["scenario", dayKey, j]),
              `Clipping "${id}" is not valid on day ${n}, so it never appears there`,
            );
        }
      });
    }
  }

  // Payoffs and the smaller files.
  if (payoffs) {
    const f = F.conversationPayoffs;
    payoffs.forEach((p, i) => {
      readFlag(p.flag, f, pathOf([i, "flag"]));
      needText(p.text, f, [i, "text"], "payoff text");
    });
  }
  if (briefing) {
    needText(briefing.subject, F.postingBriefing, ["subject"], "subject");
    needText(briefing.intro, F.postingBriefing, ["intro"], "intro");
  }
  if (staffDuties)
    for (const id of Object.keys(staffDuties))
      refCheck(characterIds, "character id", id, F.staffDuties, id);
  if (euRep)
    for (const id of Object.keys(euRep))
      refCheck(characterIds, "character id", id, F.euRepresentation, id);
  if (embassy) {
    const f = F.embassy;
    duplicates(
      embassy.rooms,
      (r) => r.id,
      (i, id) => error(f, pathOf(["rooms", i, "id"]), `Duplicate room id "${id}"`),
    );
    duplicates(
      embassy.staff,
      (r) => r.id,
      (i, id) => error(f, pathOf(["staff", i, "id"]), `Duplicate staff id "${id}"`),
    );
    const rooms = new Set(embassy.rooms.map((r) => r.id));
    embassy.staff.forEach((s, i) => {
      refCheck(rooms, "embassy room id", s.room, f, pathOf(["staff", i, "room"]));
      if (!s.animal) refCheck(characterIds, "character id", s.id, f, pathOf(["staff", i, "id"]));
    });
  }

  // Flags: read but never set is an error, set but never read a warning.
  const codeSet = (flag: string) =>
    (CODE_SET_FLAGS.exact as readonly string[]).includes(flag) ||
    CODE_SET_FLAGS.prefixes.some((p) => flag.startsWith(p)) ||
    (demarches?.instructions.some(
      (d) => flag === `demarche-${d.id}-leak` || flag === `demarche-${d.id}-incident`,
    ) ??
      false);
  for (const r of flagsRead)
    if (!flagsSet.has(r.flag) && !codeSet(r.flag))
      error(r.file, r.path, `Flag "${r.flag}" is read but never set anywhere in the content`);
  const readNames = new Set(flagsRead.map((r) => r.flag));
  for (const [flag, where] of flagsSet)
    if (!readNames.has(flag) && !(CODE_READ_FLAGS as readonly string[]).includes(flag))
      warn(where.file, where.path, `Flag "${flag}" is set but never read`);

  const repIds = new Set(reputationData.map((r) => r.id));
  const derivedCounters = new Set([
    "ignored_mail",
    "favours_owed",
    "gossip_passed",
    "demarche_self",
    "money_routes",
    "replyall_accidents",
    "protocol_incidents",
    "drinks",
    "recalls",
  ]);
  const counters = new Set([...reputationData.map((r) => r.counter), ...derivedCounters]);
  const occurrences: Record<string, number> = {},
    unlocks = new Set<string>();
  let driftUses = 0;
  const inspect = (value: unknown, file: string, path: Part[]): void => {
    if (Array.isArray(value)) {
      value.forEach((item, i) => inspect(item, file, [...path, i]));
      return;
    }
    if (!value || typeof value !== "object") return;
    const obj = value as Record<string, unknown>;
    if (typeof obj["counter"] === "string" && !counters.has(obj["counter"]))
      error(file, pathOf([...path, "counter"]), `Unknown counter "${obj["counter"]}"`);
    if (Array.isArray(obj["counts"]))
      for (const [i, id] of obj["counts"].entries()) {
        if (typeof id === "string") {
          occurrences[id] = (occurrences[id] ?? 0) + 1;
          if (!counters.has(id))
            error(file, pathOf([...path, "counts", i]), `Unknown counter "${id}"`);
        }
      }
    if (obj["statDrift"]) driftUses++;
    for (const field of ["requiresReputation", "reputation"])
      if (typeof obj[field] === "string") {
        const id = obj[field] as string;
        if (!repIds.has(id)) error(file, pathOf([...path, field]), `Unknown reputation "${id}"`);
        if (field === "requiresReputation") unlocks.add(id);
      }
    for (const [key, item] of Object.entries(obj)) inspect(item, file, [...path, key]);
  };
  for (const [key, value] of Object.entries(pack))
    inspect(value, FILE_NAMES[key as keyof ChapterPack] ?? key, []);
  if (driftUses > 8)
    error(F.manifest, "statDrift", `At most 8 stat drift choices are allowed; found ${driftUses}`);
  for (const rep of reputationData) {
    if (!unlocks.has(rep.id)) error("reputations.json", rep.id, "Reputation has no unlock choice");
    if (!derivedCounters.has(rep.counter) && (occurrences[rep.counter] ?? 0) < rep.threshold)
      error("reputations.json", rep.id, "Reputation counter cannot reach its threshold");
  }
  for (const q of quirkData) {
    const t = q.trigger;
    if (t.counter && !counters.has(t.counter))
      error("earned-quirks.json", q.id, "Quirk has an unknown trigger counter");
    if (t.reputation && !repIds.has(t.reputation))
      error("earned-quirks.json", q.id, "Quirk has an unknown trigger reputation");
    if (t.flag && !JSON.stringify(pack).includes(`"${t.flag}"`))
      error("earned-quirks.json", q.id, "Quirk trigger flag is never authored");
    if (!t.counter && !t.reputation && !t.flag)
      error("earned-quirks.json", q.id, "Quirk has no trigger");
    if ([t.counter, t.reputation, t.flag].filter(Boolean).length !== 1)
      error("earned-quirks.json", q.id, "Quirk needs exactly one trigger");
    if (t.counter && t.threshold === undefined)
      error("earned-quirks.json", q.id, "Counter trigger needs a threshold");
    if (t.reputation && t.days === undefined)
      error("earned-quirks.json", q.id, "Reputation trigger needs a duration");
    for (const id of [q.cures, q.replaces])
      if (id && !traits.some((trait) => trait.id === id))
        error("earned-quirks.json", q.id, `Unknown replaced trait "${id}"`);
  }
  return findings;
}

function allGated(choices: Gate[]): boolean {
  return choices.length > 0 && choices.every(gated);
}

function duplicates<T>(
  items: T[],
  key: (item: T) => string,
  report: (index: number, id: string) => void,
) {
  const seen = new Set<string>();
  items.forEach((item, i) => {
    const id = key(item);
    if (seen.has(id)) report(i, id);
    seen.add(id);
  });
}

function reachability(
  nodes: string[],
  start: string,
  next: (node: string) => (string | undefined)[],
  report: (node: string) => void,
) {
  const reached = new Set<string>();
  const queue = [start];
  while (queue.length) {
    const n = queue.pop() as string;
    if (reached.has(n) || !nodes.includes(n)) continue;
    reached.add(n);
    for (const m of next(n)) if (m !== undefined) queue.push(m);
  }
  for (const n of nodes) if (!reached.has(n)) report(n);
}

// --- report ------------------------------------------------------------------------------

export type ChapterReport = {
  id: string;
  characters: number;
  locations: number;
  venues: number;
  storyEvents: number;
  storyChoices: number;
  dialogueTopics: number;
  dialogueChoices: number;
  emails: number;
  emailOptions: number;
  invitations: number;
  clippings: number;
  /** Choices and options tagged with requiresTrait, per trait id. */
  taggedByTrait: Record<string, number>;
};

export function chapterReport(pack: ChapterPack): ChapterReport {
  const taggedByTrait: Record<string, number> = {};
  const tag = (c: { requiresTrait?: string | undefined }) => {
    if (c.requiresTrait) taggedByTrait[c.requiresTrait] = (taggedByTrait[c.requiresTrait] ?? 0) + 1;
  };
  const events = pack.campaign.events;
  const topics = Object.values(pack.dialogues).flat();
  let dialogueChoices = 0;
  let storyChoices = 0;
  let emailOptions = 0;
  for (const e of events)
    for (const c of e.choices) {
      storyChoices++;
      tag(c);
    }
  for (const t of topics)
    for (const n of Object.values(t.nodes))
      for (const c of n.choices) {
        dialogueChoices++;
        tag(c);
      }
  for (const e of pack.emails)
    for (const o of Object.values(e.options)) {
      emailOptions++;
      tag(o);
    }
  return {
    id: pack.manifest.id,
    characters: pack.campaign.characters.length,
    locations: pack.campaign.locations.length,
    venues: pack.campaign.venues.length,
    storyEvents: events.length,
    storyChoices,
    dialogueTopics: topics.length,
    dialogueChoices,
    emails: pack.emails.length,
    emailOptions,
    invitations: pack.invitations.length,
    clippings: pack.press.clippings.length,
    taggedByTrait: Object.fromEntries(
      Object.entries(taggedByTrait).sort(([a], [b]) => a.localeCompare(b)),
    ),
  };
}

export function formatReport(r: ChapterReport): string {
  const rows: [string, number][] = [
    ["characters", r.characters],
    ["locations", r.locations],
    ["venues", r.venues],
    ["story events", r.storyEvents],
    ["story choices", r.storyChoices],
    ["dialogue topics", r.dialogueTopics],
    ["dialogue choices", r.dialogueChoices],
    ["emails", r.emails],
    ["email options", r.emailOptions],
    ["invitations", r.invitations],
    ["clippings", r.clippings],
  ];
  const lines = rows.map(([k, v]) => `  ${k.padEnd(18)}${v}`);
  const tagged = Object.entries(r.taggedByTrait);
  lines.push(
    `  tagged choices by trait (${tagged.reduce((n, [, v]) => n + v, 0)} total):`,
    ...tagged.map(([k, v]) => `    ${k.padEnd(16)}${v}`),
  );
  return lines.join("\n");
}
