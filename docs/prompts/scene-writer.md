# Prompt: scene writer

Use this prompt in an AI tool to turn one anecdote into a scene in the game's JSON. Paste everything below the line, then fill in the three bracketed parts at the end.

Before you run it, collect:

- The filled-in anecdote from `docs/anecdotes/inbox/`.
- The character ids: the `characters` array in `src/game/data/campaign.json` (field `id`; also the keys of `src/game/data/dialogues.json`).
- The location ids: the `locations` array in `src/game/data/campaign.json` (field `id`).
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
- Gates (any choice): `requiresTrait` (trait id), `blockedByTrait` (trait id), `requiresStat` as `{ "stat": "gravitas" | "charm" | "stamina" | "deniability" | "liver", "min": number }`.
- Trait ids: liver, replyall, punctual, brussels, demarche, namedrop, cuisine, novelist, sideevents, eyesopen, ngo.

## Format 1: story event (goes in `events` in src/game/data/campaign.json)

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

## Format 2: dialogue topic (goes in the array under a character id in src/game/data/dialogues.json)

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

## Format 3: email (goes in src/game/data/emails.json)

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

Required: `id`, `day`, `time` (game minutes from midnight; the day runs 480 to 1080), `from`, `subject`, `body`, `options`, `ignore` (with `text`, `effects`). Option keys, any subset: `reply`, `delegate`, `forward`, `note`, `replyall`, `trait`. Each option has `text` and `effects`; optional `label`, `formal`, `confirms` (a visit task: clearance, lounge, programme or security; leave out unless the mail is about the minister's visit), and the gates. Include at least `reply` and `note`. Emails have no `flag` field, so they cannot record consequences; say so in your note.

## Format 4: press clipping (goes in `clippings` in src/game/data/press.json)

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

## Output (all four parts required)

1. **JSON.** One valid JSON object (or array of objects if the anecdote needs a follow-up scene and a press clipping), in the target format only. No comments.
2. **Disguise note.** One paragraph: what you changed (country, decade, rank, merged or split people, venue, central object) and what you dropped, and why a third party could not trace it.
3. **Flags.** A list of the flags the scene sets and the flags, outcomes or choices it reads, and which clipping or follow-up could react to them.
4. **Self-check.** One line each: every choice has a result; one ungated choice exists; lengths within limits; only supplied ids used.

## Input

**Target format:** [story event / dialogue topic / email / press clipping]

**Character ids available:** [paste the list]

**Location ids available:** [paste the list]

**Existing flags or event ids to read (optional):** [paste or write "none"]

**Anecdote:**

[paste the filled-in template]
