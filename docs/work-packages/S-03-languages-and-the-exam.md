# S-03 Languages and the exam: task brief

Repository: kachumbali/persona-non-grata, branch `main` at `6ba0f8b` or later. Stack: React + TypeScript + Vite, zustand, vitest, bun.

Read first:

- AGENTS.md, including "Work packages", "Content checker" and "Simulated playthroughs".
- GAME_DESIGN.md.
- docs/MASTER_PLAN.md, section S-03 and "Fun rules".
- docs/BALANCE_REPORT.md.
- docs/WRITING_GUIDE.md.

Then read the code you will build on:

- `src/game/career.ts`: `Career.languages` already exists as `Record<string, number>` and is empty today.
- `src/game/personnel.ts`: reputations, earned quirks, counters, the debrief and the payslip.
- `src/game/character.ts`: gates (`requiresTrait`, `requiresStat`), `eligible`, `gateLabel`.
- `src/game/press.ts`: `pressReview(..., translationQuality)` already accepts "standard" or "maxim" and uses each clipping's `maxim` variant.
- `src/game/demarche.ts` and `src/game/mission.ts`: in-person routes.
- `src/game/relationships.ts`: gossip and overhearing.
- `src/game/components/`: CharacterBuilder.tsx, PlanningDesk.tsx (how rest and social activities are queued), Conversation.tsx, PressReview.tsx, the personnel file view and the debrief.
- `src/game/content-check.ts` and `src/game/sim/`.

## Why this package

Diplomacy runs on language, and the game does not use it yet. The host language is never named. Language skill should be a career-long track with comic failure built in. Learning the host language is the player's personal goal for a posting, and passing the exam raises the salary.

## Part 1: languages as data

- Add `src/game/data/languages.json`: `bellaluxian` (native), `english`, `french`, `german`, and a special register `communique`. Each has an id, a name and a one-line description.
- Each chapter pack names its `hostLanguage`. For Port Hesperia it is `ombrazian`, defined in the chapter pack with a name and a short flavour description.
- Levels 0 to 4, stored in `career.languages`:

| Level | Name           | In play                                                                                                                       |
| ----- | -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 0     | None           | You need an interpreter. A colleague spends staff DP, or you smile and nod.                                                   |
| 1     | Phrasebook     | You may attempt a language-gated line. Each attempt rolls on a mistranslation table.                                          |
| 2     | Dangerous      | Gated choices unlock. Mistakes are rarer but bigger, because you now attempt idioms.                                          |
| 3     | Working        | No roll. Extra trust with speakers. You catch what interpreters leave out.                                                    |
| 4     | Exam-certified | A permanent salary allowance. Hosts stop speaking freely in front of you, so overheard gossip in that language becomes rarer. |

## Part 2: the builder

- The native language is fixed at level 3.
- The player picks two of English, French and German and distributes 4 level points between them (each 1 to 3). This does not use trait points.
- The host language starts at 0.
- Add three language quirks to `src/game/data/traits.json` as ordinary traits with real effects:
  - **False-Friend Collector** (flaw): mistranslation chance doubled; one fixed false friend recurs all posting.
  - **Learned It From a 1970s Textbook** (flaw): correct grammar, vocabulary from a regime that no longer exists; host officials over 60 like it, everyone else is puzzled.
  - **Ear for Accents** (perk): learning is faster, but the player starts copying whoever they last spoke to, with a small trust effect.
- Add `communique` as a skill any player can raise: fluent in saying nothing at length. At level 2 and above it unlocks a tagged choice `[Communiqué]` in formal scenes: "Welcome the constructive exchange of views." It always avoids a penalty and never earns a reward.
- Show languages in the personnel file view and the debrief.

## Part 3: language-gated choices and mistranslation

- Add an optional gate `requiresLanguage: { language, min }` to story, dialogue, email, démarche-route and mission-route choices. Add it to `ChoiceGate`, `eligible`, `gateLabel` (shown as `[Ombrazian 2]`), the schemas and the content checker.
- **Attempting above your level.** A choice gated at level N is offered to a player at level N−1 as an attempt, marked as risky. The outcome is rolled with the seeded generator, never `Math.random`:
  - success: the normal result;
  - mistranslation: a funny result from a table, with a small cost, and a line in the log.
- Write a mistranslation table for Ombrazian of at least 20 entries in the house style. Example: "You thanked the Deputy Minister for his excellent goat." Entries must not mock how anyone speaks. The joke is always the player's error.
- **Interpreter.** At level 0 the player may bring a colleague as interpreter for a gated choice. This costs that colleague 1 staff DP under the existing capacity rules. Each colleague interprets in character: Sola is exact, Anselm improves your remarks, Maxim guesses.
- **Where it matters.** Add language gates and attempts to:
  - at least 12 existing or new choices with host officials (`protocol`, `port-officer`, `golf`);
  - in-person démarche delivery, where Ombrazian 2 or higher improves the outcome by one step, and level 0 without an interpreter worsens it;
  - French and German for the EU cast: at least 3 choices each with `eu-france` and `eu-germany`, extending the existing "cordial or constructive" translation dialogue;
  - overheard gossip: some gossip items can only be learned with Ombrazian 2 or higher. At level 1 the player learns a garbled version that is recorded as false.
- **The press review.** Pass translation quality from the host-language level:
  - level 0 or 1: Maxim's translation, as today when Maxim compiles;
  - level 2 or higher: the standard text;
  - level 3 or higher: add an optional `original` field on clippings, an extra line of nuance the translation left out. Write it for at least 8 clippings, including at least 3 scenario clippings, so that reading the original is how the player spots the signal early.

## Part 4: learning

- A plannable activity "Language lesson" in the Planning Desk, queued like rest or a social activity. It costs 1 DP for the block.
- Three teachers, each a different trade-off. Define them in the chapter pack:
  - **Sola** (`sola`): free, teaches formal ministry language, costs her 1 staff DP, and builds trust with her. Vocabulary learned this way suits ministry scenes.
  - **A private tutor**: costs cash from the player's own money, not the embassy account (see Part 6). Fastest progress. Sends homework by mail.
  - **The fixer's taxi** (`fixer`): free and takes no DP if combined with a journey. Teaches slang. Raises level fastest at first, but adds a "slang" marker that causes a specific mistranslation family in formal scenes until level 3.
- Progress is points toward the next level, stored on the career. Thresholds are in one exported constant. A steady learner (one lesson most days) must reach level 2 by about Day 9 and be able to attempt the exam. Level 3 in one chapter needs real sacrifice.
- Field practice: every attempt in a real scene earns progress, successful or not. A mistranslation earns more.
- Homework: the tutor's mails are ordinary mails with a reply option. Ignoring them slows progress and lowers the tutor's patience. After three ignored, the tutor quits, with a letter.
- Ear for Accents and the language flaws modify these numbers.

## Part 5: the exam

- The Ministry's language examiner visits on a fixed day, set in the chapter pack. For Port Hesperia: Day 13, Midday. That is one block before the final print of the programme opens, so studying and sitting the exam compete with the mission.
- Sitting the exam is optional and costs the block (2 DP). The player must be at level 2 or higher to sit it.
- The exam is five situational questions shown one at a time. Each has four answers: one right, two false friends or register mistakes, one absurd. Draw five from a pool of at least 15 per host language, seeded so a retake differs. Include one trick question about the examiner's own name or title.
- Scoring: the player's level and lesson history shift the odds only by revealing a hint on some questions. The player still chooses the answer.
- Pass with 4 or 5 correct:
  - level 4;
  - a permanent language allowance on the payslip, stored on the career so later chapters pay it too;
  - a cable from Capital;
  - a counter increment toward a reputation.
- Fail:
  - a note in the personnel file;
  - a retake is offered in the next chapter;
  - a callback line if the player's background says they failed the entrance exam twice.
- The examiner is a new character with a portrait placeholder from the existing pool, two NPC traits, and lines for pass, narrow pass, fail and spectacular fail.

## Part 6: personal money, kept minimal

The tutor is paid from the player's own money. The full salary system comes in a later package (S-09). Do only this now:

- Add `personalFunds` to the posting state, starting from an advance defined in the chapter pack's payslip data.
- The tutor's fee is deducted from it. If it runs out, the tutor stops.
- The payslip in the debrief shows the advance, the tutor's fees and the language allowance as lines, and the total goes to `career.savings` as it does today.
- Do not build shops, property or courses.

## Part 7: saves, checker, simulation

- **Saves:** bump the posting version. Migrate old saves with languages `{ bellaluxian: 3 }`, host language 0, no lesson progress, and `personalFunds` at the chapter's advance. Old career codes must still import.
- **Content checker:** language ids exist; every `requiresLanguage` names a known language and a level 1 to 4; the exam pool has at least 15 questions with exactly one correct answer each; the mistranslation table has at least 20 entries; the exam day is inside the chapter; teachers reference existing characters; `original` only on existing clippings; length limits.
- **Simulation:**
  - careful takes a lesson when a block is otherwise idle and sits the exam if eligible.
  - socialiser learns from the taxi and by attempting everything.
  - press-reader prioritises lessons early to read originals.
  - reckless attempts every gated line at any level.
  - ignorer never learns.
  - For exam answers, bots choose correctly with a probability set by level and lesson count.
  - Add to the report: final host-language level per bot, lessons by teacher, attempts and mistranslations, exam sat / passed / failed, and whether lessons reduced mission completion.
- **Thresholds**, set from measured results, with the target in a comment:
  - A careful bot reaches level 2 by Day 10 in at least 80% of runs.
  - The exam pass rate for bots that sit it is between 40% and 80%.
  - Mission completion for careful bots does not fall by more than 5 points.
  - The reckless bot produces at least 3 mistranslations per run.
- Regenerate docs/BALANCE_REPORT.md.

## Rules

- Optional stories never block the mission. Language never blocks a mission step: every gated mission or démarche route keeps an ungated alternative.
- Content in JSON, rules in pure tested TypeScript, save migration.
- House style from docs/WRITING_GUIDE.md: dry, institutional, deadpan. Jokes aim at the player's own mistakes and at institutions. Never at how a nationality speaks, at accents, or at ethnicity. Ombrazian is fictional and must not read as a disguised real language.
- Never modify the Lovable block in AGENTS.md. Restore it if Prettier reformats it.
- Commit messages start with "S-03: ". Do not rewrite pushed history.
- Before pushing run `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run content:check`, `npm run sim` and `npm run build`. All must pass.
- Tick S-03 in roadmap.md and mark it done in docs/MASTER_PLAN.md with "(done)" after the heading.
- Push to `origin/main` when finished.

## Deliverables

- Code, data, tests and updated docs: GAME_DESIGN.md, the scene-writer prompt for `requiresLanguage` and `original`, BALANCE_REPORT.md.
- A summary covering:
  - the level thresholds and how many lessons each teacher needs per level;
  - the full mistranslation table;
  - the exam question pool with correct answers marked;
  - where language gates were added;
  - simulation numbers: levels reached, exam pass rate, mistranslations per run, mission completion before and after;
  - which existing tests you changed and why;
  - anything you could not do or are unsure about.
