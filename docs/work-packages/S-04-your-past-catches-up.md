# S-04 Your past catches up: task brief

Follow the workflow in `docs/work-packages/README.md`. Read AGENTS.md, GAME_DESIGN.md, docs/WRITING_GUIDE.md and docs/MASTER_PLAN.md section S-04 first.

Then read:

- `src/game/data/backgrounds.json`: 8 origins, 8 missteps, 8 posting reasons.
- `src/game/career.ts`: `Career.background` stores the three choices as indexes (`origin`, `misstep`, `reason`; null for old saves).
- `src/game/components/CharacterBuilder.tsx`: where they are chosen.
- `src/game/chapters/port-hesperia-2006/campaign.json`: story events and their fields.
- `src/game/dialogues.ts` (`moodOpener` and greetings), `src/game/personnel.ts` (the debrief), `src/game/press.ts` (triggers).

## Why

The player picks an origin, a misstep and a reason for the posting. All three are jokes with a story inside them, and none is ever used again. Nobody addresses the player by title or name.

## Part 1: give the choices ids

- Give every origin, misstep and reason a stable `id` in `backgrounds.json`, keeping the texts. Store ids on the career as well as indexes, and migrate old saves and old career codes.
- Add gates `requiresBackground: { origin?, misstep?, reason? }` to story, dialogue and email choices and to press triggers, with schema and content-check support.

## Part 2: each origin gives a small perk

One perk per origin, expressed through existing systems only (trust, a known fact, a favour, a language point, a stat modifier in one kind of scene). Examples:

- "Child of two rival protocol officers": starts friendly with the protocol director and knows one protocol fact.
- "Grew up above the family cheese shop": hospitality costs less, and the chef starts friendly.
- "The only child in the village with a fax machine": the first fax each day costs no DP to answer.

Show the perk in the character builder under the chosen origin and in the personnel file.

## Part 3: each misstep returns as a story

Write one short event per misstep, 8 in total, each appearing between Day 4 and Day 12, with three choices and consequences. Examples:

- "Lost a diplomatic pouch on a regional train": the pouch turns up at the port, opened, with a customs form.
- "Accidentally recognised a micronation during a karaoke night": its ambassador arrives and requests accreditation.
- "Once replied-all to the entire Foreign Service with a lasagne recipe": Capital quotes the recipe back in an instruction, with corrections.
- "Failed the entrance exam twice": the language examiner on Day 13 is the same examiner. Hook into the existing exam scene.

Rules for these events:

- Each can be resolved well, badly, or ignored, and never blocks the mission.
- Each sets a flag that a press clipping reacts to. Write one clipping per misstep.
- Each has at least one option gated by a trait or a stat that fits the story.

## Part 4: the posting reason

- It changes one sentence of the posting briefing and one sentence of the final cable in the debrief. Write both for all 8 reasons.
- It gives the debrief's promotion board one extra line when it fits.

## Part 5: people use your name and title

- Add placeholders `{title}`, `{surname}` and `{address}` for dialogue, event, mail and press text, filled at render time. `{address}` is the correct form for the speaker's relationship: formal with strangers, surname only with colleagues who are friendly, and a deliberately wrong title from one character who never gets it right.
- Use them in at least 30 existing lines where a greeting or a quote fits. Do not sprinkle them everywhere.
- A title marked "(pending)" gets a running gag: the protocol director corrects it every time it is used in his presence, with three variant lines, and stops if the player earns his trust.
- The content checker validates placeholders.

## Part 6: saves, checker, simulation

- Migrate saves and career codes: an old career with null background gets no perk and no callback, and the game says nothing about it.
- The simulation gives each run a background and reports: callbacks seen per run, how they were resolved, and whether any origin perk changes ending rates by more than 10 points. If one does, weaken it.
- Thresholds: every misstep event is reached in at least 90% of runs that have that misstep; no perk moves the promotion rate by more than 10 points.

## Deliverables

A summary with: the 8 perks; the 8 misstep events with their choices; the 16 reason sentences; ten example lines using the placeholders; simulation numbers; anything you could not do.
