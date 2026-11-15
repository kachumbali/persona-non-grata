/**
 * Content checker (F-04). A pure function that validates one chapter pack against
 * the shape of every content file and against the other files it refers to.
 * No file-system access here: scripts/content-check.ts loads the packs, tests pass fixtures.
 */
import { z } from "zod";
import type { Invitation } from "./calendar";
import type { Topic } from "./dialogues";
import type { Email, StoryChoice, StoryEvent } from "./rules";
import type { Campaign, ChapterManifest, ChapterPack, PressData } from "./chapters/types";

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
  /** Portrait file names that exist on disk. When omitted, file existence is not checked. */
  portraitFiles?: string[];
};

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
  exact: ["fuel-lead", "fuel-protected"],
  prefixes: ["trait:", "trait-accident:", "social:", "dialogue:", "reward:"],
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
  };
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
  });
  const event = obj({
    id: str,
    title: str,
    npc: str,
    text: str,
    minDay: day,
    expiresDay: opt(day),
    location: opt(str),
    requires: opt(str),
    requiresFlag: opt(str),
    requiresChoice: opt(obj({ eventId: str, choiceId: str })),
    onMiss: opt(obj({ text: str, effects })),
    choices: z.array(storyChoice),
  });
  const campaign = obj({
    characters: z.array(
      obj({
        id: str,
        name: str,
        role: str,
        location: str,
        likes: z.array(str),
        dislikes: z.array(str),
        skills: z.array(str),
        line: str,
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
    text: str,
    label: opt(str),
    effects,
    confirms: opt(str),
    formal: opt(z.boolean()),
    ...gate,
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
  });
  const press = obj({
    outlets: z.array(obj({ id: str, name: str, voice: str })),
    clippings: z.array(
      obj({
        id: str,
        outlet: str,
        headline: str,
        body: str,
        day: opt(day),
        minDay: opt(day),
        maxDay: opt(day),
        priority: num,
        trigger: opt(trigger),
        signal: opt(z.boolean()),
        once: opt(z.boolean()),
        capital: opt(obj({ confidence: num })),
        maxim: opt(obj({ headline: str, body: str })),
      }),
    ),
    scenario: z.record(str, z.array(str)),
  });
  const manifest = obj({
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
    endings: z.record(str, obj({ title: str, text: str })),
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
    startRelationships: z.array(obj({ a: str, b: str, value: num })),
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
}): boolean => !!(c.requiresTrait || c.blockedByTrait || c.requiresStat);

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
  const traitIds = new Set(traits.map((t) => t.id));
  const portraitById = new Map(portraits.map((p) => [p.id, p]));

  // Chapter files.
  const manifest = parseFile("manifest", pack.manifest, add) as ChapterManifest | undefined;
  const campaign = parseFile("campaign", pack.campaign, add) as Campaign | undefined;
  const dialogues = parseFile("dialogues", pack.dialogues, add) as
    Record<string, Topic[]> | undefined;
  const emails = parseFile("emails", pack.emails, add) as Email[] | undefined;
  const invitations = parseFile("invitations", pack.invitations, add) as Invitation[] | undefined;
  const press = parseFile("press", pack.press, add) as PressData | undefined;
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
  const venueIds = new Set((campaign?.venues ?? []).map((v) => v.id));
  const taskIds = new Set(Object.keys(manifest?.missionTasks ?? {}));
  const events = campaign?.events ?? [];
  const eventById = new Map(events.map((e) => [e.id, e]));
  const invitationById = new Map((invitations ?? []).map((i) => [i.id, i]));

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

  // Manifest.
  if (manifest) {
    const f = F.manifest;
    refCheck(locationIds, "location id", manifest.startLocation, f, "startLocation");
    refCheck(locationIds, "location id", manifest.officeLocation, f, "officeLocation");
    const rooms = new Set((embassy?.rooms ?? []).map((r) => r.id));
    refCheck(rooms, "embassy room id", manifest.startRoom, f, "startRoom");
    manifest.startRelationships.forEach((r, i) => {
      refCheck(characterIds, "character id", r.a, f, pathOf(["startRelationships", i, "a"]));
      refCheck(characterIds, "character id", r.b, f, pathOf(["startRelationships", i, "b"]));
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
        needText(o.text, f, [...op, "text"], "result text");
        limit(o.text, TEXT_LIMITS.emailOptionText, f, [...op, "text"], "Email option text");
        if (o.confirms)
          refCheck(taskIds, "mission task id", o.confirms, f, pathOf([...op, "confirms"]));
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
    CODE_SET_FLAGS.prefixes.some((p) => flag.startsWith(p));
  for (const r of flagsRead)
    if (!flagsSet.has(r.flag) && !codeSet(r.flag))
      error(r.file, r.path, `Flag "${r.flag}" is read but never set anywhere in the content`);
  const readNames = new Set(flagsRead.map((r) => r.flag));
  for (const [flag, where] of flagsSet)
    if (!readNames.has(flag) && !(CODE_READ_FLAGS as readonly string[]).includes(flag))
      warn(where.file, where.path, `Flag "${flag}" is set but never read`);

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
