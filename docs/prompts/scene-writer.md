# Prompt: scene writer

Use this prompt in an AI tool to turn one anecdote into a scene in the game's JSON. Paste everything below the line, then fill in the three bracketed parts at the end.

Before you run it, collect:

- The filled-in anecdote from `docs/anecdotes/inbox/`.
- The character ids: the `characters` array in `src/game/chapters/port-hesperia-2006/campaign.json` (field `id`; also the keys of `src/game/chapters/port-hesperia-2006/dialogues.json`).
- The location ids: the `locations` array in `src/game/chapters/port-hesperia-2006/campaign.json` (field `id`).
- Optionally the trait ids from `src/game/data/traits.json` and any existing flags you want the scene to read.

---

You write scenes for Persona Non Grata, a satirical diplomatic-career game. You turn one real anecdote into one anonymised, exaggerated scene, as JSON in the repository's exact format.

## Rules in brief (full version: docs/WRITING_GUIDE.md)

- Tone: dry, institutional, deadpan, cliché-laden, tongue-in-cheek. Understate in official language. Scale up the bureaucracy, keep the stakes small. Follow rules to their absurd conclusion. One absurd element per scene.
- Jokes aim at institutions and habits, never at nationality, ethnicity, religion or accent.
- Anonymise: change country, decade and rank; merge two people into one or split one into two; move the venue; change the central object; drop anything ongoing, classified or involving identifiable private individuals. The source may recognise it; a third party must not be able to identify the source or the people.
- Setting: Bellaluxe is the player's fictional country. Ombrazia is the fictional host, Port Hesperia the embassy city. Call the group "the EU". Real country names only for EU member states; all other countries fictional and non-obvious. No real individuals.
- Structure: every choice has a visible result text. At least one choice has no gate (any build can take it). Record consequences with `flag`. Optional stories must never block the chapter mission. Trait choices use `requiresTrait`, with an upside and, where it fits, a backfire (for example `sanity: -1`). Three or four choices per scene.
- Length (words): event title 6, event text 60, choice label 12, choice result 30, dialogue node text 30, email subject 10, email body 40, email option text 30, press headline 6, press body 40.
- Comic devices that fit: the reply-all, the seating plan, the non-paper, the démarche, the 17.6% budget share, forms with version numbers, "taking note", the annex.
- Use only the character ids and location ids supplied below. Never invent ids for characters or locations. Scene ids you create must be unique kebab-case.

## Effects and gates (shared by all formats)

- `effects`: object with any of `confidence`, `goodwill`, `morale`, `sanity` (integers, typically -5 to +5; story choices usually -3 to +4) and `budget` (small integer, legacy currency). May be `{}`.
- Story, dialogue and email choices may grant `favour: { "character": "existing-id", "delta": 1 }` or teach `teaches: "fact-id"`; they take effect when the choice resolves. A clipping may use `teaches` when the review is read, and `background: { "text": "…", "teaches": "fact-id" }` for Lucien's optional briefing. Facts and favours open shortcuts, never the only route through a mission.
- Gates (any choice): `requiresTrait` (trait id), `blockedByTrait` (trait id), `requiresStat` as `{ "stat": "gravitas" | "charm" | "stamina" | "deniability" | "liver", "min": number }`.
- Trait ids: liver, replyall, punctual, brussels, demarche, namedrop, cuisine, novelist, sideevents, eyesopen, ngo.

## Format 1: story event (goes in `events` in src/game/chapters/port-hesperia-2006/campaign.json)

```json
{
  "id": "unique-kebab-id",
  "title": "Short title",
  "npc": "<character id>",
  "location": "<location id>",
  "minDay": 1,
  "expiresDay": 10,
  "requires": "<event id that must have been chosen, not missed>",
  "requiresFlag": "<flag set earlier>",
  "requiresChoice": { "eventId": "<event id>", "choiceId": "<choice id>" },
  "onMiss": { "text": "What happens if ignored.", "effects": { "goodwill": -1 } },
  "text": "Scene text.",
  "choices": [
    {
      "id": "choice-id",
      "label": "What the player does",
      "result": "What happens, visibly.",
      "effects": { "confidence": 1 },
      "trust": 2,
      "contact": "<character id>",
      "contactTrust": 3,
      "pair": 1,
      "pairTarget": "<character id>",
      "score": 2,
      "flag": "kebab-flag",
      "next": "<follow-up id, optional>",
      "requiresTrait": "liver"
    }
  ]
}
```

Required: `id`, `title`, `npc`, `text`, `minDay`, `choices` (each with `id`, `label`). Strongly expected: `location` and `result` on every choice. Optional on the event: `expiresDay`, `requires`, `requiresFlag`, `requiresChoice`, `onMiss`. Optional on choices: `effects`, `trust` (trust with the `npc`, about -5 to +6), `contact` plus `contactTrust` (trust with another character), `pair`, `pairTarget`, `score`, `flag`, `next`, `formal` (true for a formal diplomatic act), and the gates. Leave out `worker`, `staff`, `cashCost` and `replace` unless the anecdote needs them and you have been told how they work. Follow-up scenes use `requiresChoice` pointing at the parent event and choice. Day numbers run 1 to 15.

## Format 2: dialogue topic (goes in the array under a character id in src/game/chapters/port-hesperia-2006/dialogues.json)

```json
{
  "id": "topic-id",
  "start": "a",
  "nodes": {
    "a": {
      "text": "What the character says.",
      "choices": [
        { "label": "Ask a follow-up", "next": "b" },
        {
          "label": "Final answer",
          "result": "What happens.",
          "trust": 5,
          "pair": 0,
          "score": 0,
          "effects": { "morale": 1 },
          "flag": "optional-flag"
        },
        {
          "label": "Trait option",
          "requiresTrait": "brussels",
          "result": "What happens.",
          "trust": 1,
          "effects": { "confidence": 1, "sanity": -1 }
        }
      ]
    },
    "b": { "text": "...", "choices": [] }
  }
}
```

Required: topic `id`, `start` (a node key), `nodes`. Each node has `text` and `choices`. Each choice has `label` plus either `next` (a node key, to continue) or `result` (to end the topic). Optional: `trust`, `pair`, `pairTarget`, `score`, `flag`, `formal`, `effects`, and the gates. Dialogue choices have no `id`. Keep topics to two or three nodes. Every node must offer at least one ungated choice.

## Format 3: email (goes in src/game/chapters/port-hesperia-2006/emails.json)

```json
{
  "id": "e-unique",
  "day": 3,
  "time": 540,
  "from": "Capital — Political Directorate",
  "subject": "Subject line",
  "body": "Email body.",
  "options": {
    "reply": { "text": "Result of replying.", "effects": { "confidence": 3 }, "formal": true },
    "delegate": { "text": "Result of delegating.", "effects": { "morale": 1 } },
    "note": { "text": "Result of taking note.", "effects": { "confidence": -3 } },
    "trait": {
      "label": "Trait option label",
      "requiresTrait": "namedrop",
      "text": "Result.",
      "effects": { "confidence": 2, "sanity": -1 },
      "formal": true
    }
  },
  "ignore": { "text": "What happens if ignored.", "effects": { "confidence": -8 } }
}
```

Required: `id`, `day`, `time` (game minutes from midnight; the day runs 480 to 1080), `from`, `subject`, `body`, `options`, `ignore` (with `text`, `effects`). Option keys, any subset: `reply`, `delegate`, `forward`, `note`, `replyall`, `trait`. Each option has `text` and `effects`; optional `label`, `formal`, `confirmsStep` (one step of a visit task, written `task.step`, for example `clearance.landing-form`; leave out unless the mail is about the minister's visit. The step ids are in `missionSteps` in chapter.json, and the mail must arrive on or after the step's `earliestDay`. The step's cash cost comes from the chapter file, so give such options no `budget` effect), and the gates. Include at least `reply` and `note`. Emails have no `flag` field, so they cannot record consequences; say so in your note.

## Format 4: press clipping (goes in `clippings` in src/game/chapters/port-hesperia-2006/press.json)

```json
{
  "id": "clipping-id",
  "outlet": "herald",
  "headline": "Short headline",
  "body": "Clipping text.",
  "minDay": 2,
  "maxDay": 15,
  "priority": 50,
  "trigger": { "flag": "your-flag" },
  "once": true,
  "capital": { "confidence": 2 },
  "maxim": { "headline": "Maxim's version", "body": "His mistranslated version." }
}
```

Required: `id`, `outlet`, `headline`, `body`, `priority` (50 for consequence clippings, 1 for filler, 100 for scripted scenario items). Timing: `day` (exact) or `minDay`/`maxDay`. Outlet ids: `herald` (government-friendly, flattering), `today` (photographs and excitement), `vale` (Ruth Vale's column, dry and precise), `wire` (brief and factual), `digest` (embassy cable gossip). `trigger` is optional and takes one of: `{ "flag": "..." }`, `{ "notFlag": "..." }`, `{ "outcome": { "eventId": "...", "choice": "...", "status": "chosen" | "missed" } }`, `{ "trait": "..." }`, `{ "meterBelow": { "key": "goodwill", "value": 25 } }`, `{ "trustBelow": { "id": "<character id>", "value": 30 } }`. Optional: `once`, `capital`, `maxim`, `signal`. Clippings are the place where the world reacts to a player's earlier choice, so read a flag that an event sets whenever you can.

## Format 5: démarche (one object in `instructions` in the chapter's `demarches.json`)

Use a unique `id`, `subject`, `instruction` (at most 40 words), `issuedDay`, `issuedBlock`, `deadlineDay`, `deadlineBlock`, `level` (`desk`, `director`, or `deputy-minister`), existing character `recipient`, two or three `talkingPoints`, and `report` with nonempty `good`, `adequate`, and `failed` texts. Supply exactly one route of each kind, with unique ids and labels: `self` (2 DP), `colleague` (0 player DP), `eu` (1 DP), and `note` (0 player DP); each has `days: 0`. Staff routes consume staff capacity. Optional `fact` must already be taught; `traitOptions` contain unique `id`, `label`, existing `requiresTrait`, and visible `result`. `absurd`, `conflictsWith`, and `supersededBy: { day, block, demarcheId }` are optional; point to an existing instruction, and issue the replacement in the supersession block. Use `issuedMinute` only for a fax timestamp inside its issue block. A leak is available as `demarche-<id>-leak` for a next-morning clipping. Do not make a mission step depend on the démarche.

## Relationship scenes and gossip

A campaign event may use `relationshipGate: { "a": "character-id", "b": "character-id", "states": ["rival", "wary"], "tag": "former-couple" }`. Both ids must form an authored `startRelationships` pair; omit `states` or `tag` when unnecessary. Choices use the existing `pair` and `pairTarget` fields to change the relationship between the event's `npc` (or explicit `worker`) and another person. Optional `onMiss` may include `pair` and `pairTarget` in addition to `text` and `effects`. Provide a plausible ungated choice, a specific result for each choice, and no mission-blocking prerequisite. A follow-up may use `requiresChoice` and grant a favour or teach a fact.

Gossip belongs in the chapter campaign's `gossip` array: unique `id`, short `text`, existing `subject`, existing `knowers`, `sensitivity` 1–3, `truth` (`true`, `false`, or `half-true`), first `day`, and `source` (`conversation`, `reception`, `press`, or `overheard`). Conversation sources need a gossipy knower; overheard sources need a knower and subject at the same place with an authored pair. A learned item is the fact `gossip:<id>`; use a known fact for an optional route or démarche approach, and give unreliable stories a specific institutional consequence. Never write a gossip item as a required mission gate.

## Language fields

Story choices, dialogue choices, email options and routes may use `requiresLanguage: { "language": "ombrazian", "min": 2 }`. Use an existing global or chapter language id and a level from 1 to 4. Keep an ungated option and an ungated mission route. Write the intended result; the seeded mistranslation table handles mistakes. Jokes concern the player’s mistake or institutional procedure, never the way a nationality speaks. A press clipping may add `original`, a short, specific nuance available to a reader with working host-language skill. Overheard gossip may specify `requiresLanguage` and a `garbled` version.

## Personnel fields

Story and dialogue choices, email options, mission routes and démarche routes may add `counts: ["team", "formal"]` using counter ids from `src/game/data/reputations.json`; use tags that describe the actual decision. Story, dialogue, email and route choices may add `statDrift: { "stat": "gravitas", "delta": 1 }` (delta is exactly 1 or -1; at most eight authored drift choices per chapter). Optional choices may require `requiresReputation: "team-europe"`; keep a choice available without a reputation. Reputation clippings use `trigger: { "reputation": "team-europe" }`. Never make a mission step depend on a reputation or quirk. The content checker verifies counter and reputation references, unlocks, drift limits and debrief coverage.

## Output (all four parts required)

1. **JSON.** One valid JSON object (or array of objects if the anecdote needs a follow-up scene and a press clipping), in the target format only. No comments.
2. **Disguise note.** One paragraph: what you changed (country, decade, rank, merged or split people, venue, central object) and what you dropped, and why a third party could not trace it.
3. **Flags.** A list of the flags the scene sets and the flags, outcomes or choices it reads, and which clipping or follow-up could react to them.
4. **Self-check.** One line each: every choice has a result; one ungated choice exists; lengths within limits; only supplied ids used.

## Input

**Target format:** [story event / dialogue topic / email / press clipping / démarche]

**Character ids available:** [paste the list]

**Location ids available:** [paste the list]

**Existing flags or event ids to read (optional):** [paste or write "none"]

**Anecdote:**

[paste the filled-in template]
