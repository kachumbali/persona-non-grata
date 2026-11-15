# S-05 and S-08 Your personnel file changes, and the ending reads it back: task brief

Repository: kachumbali/persona-non-grata, branch `main` at `0b065d1` or later. Stack: React + TypeScript + Vite, zustand, vitest, bun.

Read first:

- AGENTS.md, including "Work packages", "Content checker" and "Simulated playthroughs".
- GAME_DESIGN.md.
- docs/MASTER_PLAN.md, sections S-05 and S-08 and "Fun rules".
- docs/BALANCE_REPORT.md.
- docs/WRITING_GUIDE.md.

Then read the code you will build on:

- `src/game/career.ts`: `Career` (already has `earnedQuirks`, `reputations`, `people`, `legacyFlags`, `chapters`), `ChapterResult`, `chapterResultFrom`.
- `src/game/saves.ts`: how a chapter result is recorded once at an ending.
- `src/game/store.ts`: `storyFlags` (including `trait:<trait>:<source>` and `trait-accident:` flags), `storyOutcomes`, `goodwillHistory`, `favours`, `knownFacts`, relationships, démarche state, `stepQualities`.
- `src/game/character.ts` and `src/game/data/traits.json`: player traits, stats, `computeStats`.
- `src/game/relationships.ts` and `src/game/data/npc-traits.json`.
- `src/game/components/GameScreen.tsx`: the ending screen starts at `if (g.ending)`.
- `src/game/components/CharacterBuilder.tsx`: how the personnel file is shown at creation.
- `src/game/content-check.ts` and `src/game/sim/`.

## Why this package

Two things are still missing from the character:

- **Nothing about you changes during a posting.** Traits and stats are fixed at creation. After fifteen days of choices, your personnel file is the one you started with.
- **The ending ignores who you were.** It shows a title, one paragraph, two meters and a few payoff lines. Two very different postings read almost the same.

Do this in two commit series. Each must leave the game working.

## Series 1 (S-05): reputations, earned quirks and stat drift

### Reputations

A reputation is a named label the player earns from a pattern of choices.

- Define reputations as global data in `src/game/data/reputations.json`. Each has:
  - `id`, `name` and `description`, e.g. "The Biscuit Hawk", "Celeste's Favourite", "Known to Fax";
  - a `counter` it listens to and a `threshold`;
  - an optional `greeting` line per relationship state;
  - an optional `unlocks` tag that choices can require.
- Counters are incremented by tagged choices. Add an optional `counts: string[]` field to story, dialogue, email, démarche-route and mission-route choices, with schema and content-check support. Derive some counters from existing state, with no new tags needed:
  - emails ignored;
  - favours owed;
  - gossip passed on;
  - démarches delivered in person;
  - money routes used;
  - reply-all accidents;
  - protocol incidents;
  - drinks accepted.
- Write 14 reputations in the house style. Cover credit-taking, team play, neglect, rule-bending, gossip, formality, hospitality and Capital-pleasing.
- Tag enough existing choices for each reputation to be reachable in a normal game. At least 60 tagged choices in Port Hesperia.
- A reputation, once earned, does three things:
  - it changes how people greet the player (extend the greeting logic that already uses relationship state and NPC traits);
  - it unlocks at least one choice somewhere, shown with a tag like `[The Biscuit Hawk]`;
  - it can be read by press clipping triggers. Add a `reputation` trigger, and write one clipping per reputation.
- At most three reputations are active at once. A fourth replaces the oldest, with a line in the report.

### Earned quirks: "Personnel file amended"

- At defined moments, a mail from the Personnel Directorate arrives with the subject "Personnel file amended". It adds a trait to the player for the rest of the career.
- Define earned quirks in `src/game/data/earned-quirks.json`. Each has:
  - an id, name, description and stat changes, in the same shape as traits;
  - a trigger: a reputation held for N days, a counter threshold, or a specific flag;
  - the text of the mail.
- Write 10 earned quirks, half helpful and half not. Examples: "Recovering Reply-All-ic" (cures Reply-All Reflex after five recalls), "Owes Half the Corps", "Reads Annexes", "Mentioned in Dispatches (Unfavourably)".
- A quirk can **cure** a starting flaw or **replace** a starting trait. Say so in the mail.
- At most three per posting. Store them in `career.earnedQuirks`. `computeStats` and trait gating must include earned quirks, so they affect play at once and in later chapters.

### Stat drift

- A small number of major choices can move one stat by one point for the rest of the career. Add an optional `statDrift: { stat, delta }` field, limited by the content checker to at most 8 uses per chapter.
- Tag 6 existing high-stakes choices. A disastrous dinner costs Charm. Standing up to Capital raises Gravitas.
- Store drift in the career, so it carries over.

### Where the player sees it

- A "Personnel file" view reachable from the main game screen, next to "Who is who". It shows identity and background, traits (starting, earned, cured), stats with drift marked, active reputations with their effect, and counters close to a threshold as a hint, such as "Capital has started to notice your forwarding habits."
- The situation report announces each reputation gained or lost, each quirk and each stat change.

## Series 2 (S-08): the debrief

Replace the ending screen with a debrief that reads the posting back. Keep the ending title and text as the first thing shown.

1. **Final cable.** The existing ending title and text, with one added sentence chosen by the player's dominant trait or active reputation. Write a variant line per ending for at least 8 traits or reputations.
2. **Personnel file, Day 1 next to the last day.** Two columns: traits, stats and reputations at the start and at the end. Mark gained items, cured items and drifted stats.
3. **Epithet.** One line naming the posting, built from the player's most extreme recorded choices, in the form "The diplomat who …". Use a pool of at least 20 templates keyed to flags, counters and outcomes, with a rule for picking the most distinctive. Deterministic for a given game.
4. **Promotion board.** Three characters who know the player comment on the record in their own voices. Pick the three with the strongest relationships, positive or negative. Each character needs a line for a good, mixed and bad record, written to match their NPC traits. Write lines for at least 12 characters.
5. **The mission.** The four tasks with their quality lines (already in `missionQualityTexts`), plus démarches delivered, failed and missed.
6. **People.** The relationships that changed most, favours still owed either way, and gossip the player acted on that turned out to be false.
7. **Things you set in motion.** Up to five earlier choices with the consequence they caused, drawn from flags and the goodwill history.
8. **Payslip.** An itemised joke payslip: base salary for the rank, acting allowance, a hardship line, and deductions drawn from play, such as rejected expense claims and the dry-cleaning after the toast. The total is stored as `savings` on the career. Keep the numbers in the chapter pack, so the later salary package can reuse them.
9. **Copy as text.** A button that copies the whole debrief as plain text for sharing. Call `navigator.clipboard.writeText` inside the click handler, with a fallback that shows the text selected in a textarea.
10. **Next.** The existing "Request a new posting" button.

Layout rules:

- One scrolling page in the existing paper style. Readable at 400px width. Keyboard accessible.
- Everything is visible without interaction. Nothing depends on animation.

## Saves, career, checker, simulation

- **Saves:** bump the posting version. Migrate old saves with empty counters, no reputations, and a Day 1 snapshot rebuilt from the career's starting traits.
- **Career:** reputations at the end of the chapter, earned quirks, stat drift, the epithet and the payslip total go into the chapter result. Old career codes must still import.
- **Content checker:** reputation, quirk and counter ids exist; every reputation is reachable (some content increments its counter enough times); every quirk's trigger can fire; unlock tags are used by at least one choice; stat-drift uses within the limit; every ending has variant lines; length limits.
- **Simulation:** add to the report: reputations earned per bot and per build, quirks earned, stat drift, the spread of epithets, and which promotion-board characters appear.
- **Thresholds**, set from measured results, with the target in a comment:
  - Every competent bot earns at least one reputation per run.
  - Two bots with the same build end with different personnel files in at least 80% of paired runs.
  - At least 8 different epithets appear across the run matrix.
  - No reputation is earned in more than 70% of all runs.
  - Mission completion rates do not fall.
- Regenerate docs/BALANCE_REPORT.md.

## Rules

- Optional stories never block the mission.
- Content in JSON, rules in pure tested TypeScript, save migration.
- House style from docs/WRITING_GUIDE.md: dry, institutional, deadpan. Jokes aim at institutions and habits, never at nationality, ethnicity or accent. No real people.
- Never modify the Lovable block in AGENTS.md. Restore it if Prettier reformats it.
- Commit messages start with "S-05: " for series 1 and "S-08: " for series 2. Do not rewrite pushed history.
- Before pushing run `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run content:check`, `npm run sim` and `npm run build`. All must pass.
- Tick S-05 and S-08 in roadmap.md and mark them done in docs/MASTER_PLAN.md with "(done)" after the heading.
- Push to `origin/main` when finished.

## Deliverables

- Code, data, tests and updated docs: GAME_DESIGN.md, the scene-writer prompt for the new fields, BALANCE_REPORT.md.
- A summary covering:
  - the 14 reputations with their counters and thresholds;
  - the 10 earned quirks with their triggers;
  - the stat-drift choices;
  - three example debriefs as plain text, from three different simulated runs;
  - simulation numbers: reputations per bot, how often two same-build runs differ, the number of different epithets;
  - which existing tests you changed and why;
  - anything you could not do or are unsure about.
