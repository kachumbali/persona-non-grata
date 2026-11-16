# U-03 Briefings: the first one, and one every morning: task brief

Repository: kachumbali/persona-non-grata, branch `main`. Stack: React + TypeScript + Vite, zustand, vitest, bun.

Before you start, pull `main` and check that both of these are on it. If either is missing, stop and say so:

- **U-01, the agenda:** `src/game/agenda.ts` exists, with `describeCommitment` and `agendaItems`.
- **U-02, the first hour:** `docs/work-packages/U-02-first-hour.md` is ticked in roadmap.md. It rewrites the posting briefing and adds unread badges and a first-day checklist.

Read first: AGENTS.md (including "Work packages"), GAME_DESIGN.md, docs/WRITING_GUIDE.md.

Then read:

- `src/game/chapters/port-hesperia-2006/posting-briefing.json` and `src/game/components/PostingBriefing.tsx`: the first-day briefing.
- `src/game/components/GameScreen.tsx`: the order in which the briefing, the press review and interruptions are shown at the start of a block.
- `src/game/press.ts` and `PressReview.tsx`: the morning press review.
- `src/game/agenda.ts`: what is fixed for today and the coming days.
- `src/game/store.ts`: `goodwillHistory`, `log`, `report`, `todayPlans`, `yesterday`, `meters`, `economy`, `missionSteps`, `setbacksApplied`, `favours`, `knownFacts`, relationships, démarche state, language progress, reputations and counters.
- `src/game/mission.ts`, `demarche.ts`, `relationships.ts`, `languages.ts`, `personnel.ts`.
- `src/game/saves.ts`: `continueSlot`, used when a player returns to a career.

## Why this package

A playtester and a hand-played session showed the same thing: the game has many systems, and the player loses track of where they stand. Two briefings fix that:

- **The first briefing** must tell a new player what matters in one screen.
- **A morning briefing** every day must recap what happened and what needs attention, so a player who returns after a day away can pick up at once.

## Part 1: the first briefing

U-02 has already rewritten the text. Do not rewrite it again. Improve how it is delivered:

1. **Split it into three short pages** with Next and Back: "Your posting" (who you are, the mission, the deadline), "Your desk" (fax, PC, BlockBerry, what ignoring mail costs), "Your people" (staff, favours, the notebook, démarches, languages). The last page ends with the first-day checklist from U-02. A "Skip" control is on every page.
2. **Make it personal.** Use the player's title and surname, their posting reason from the background, and one line that reacts to their traits. Example for Reply-All Reflex: "Personnel notes your enthusiasm for transparency." Write one line per starting trait, including the three language quirks. Keep them in the chapter-independent data, so later chapters reuse them.
3. **Keep it reachable.** It stays in the BlockBerry mail inbox, as today, and opens to the page last read.
4. Text limit: each page fits on one phone screen at 400px width without scrolling more than once.

## Part 2: the morning briefing

Every Morning block from Day 2 opens with a one-screen situation report, shown before the press review.

### Who writes it

It is written in the voice of the player's head of chancery. In Port Hesperia that is Sola Dewrin (`sola`). Name the author in the chapter pack, so later chapters can use someone else.

Her tone follows her relationship with the player, using the named states from `relationships.ts`:

- ally or friendly: candid, with one piece of advice she was not asked for;
- neutral: correct and complete;
- wary, rival or feud: brief, formally perfect, and missing the one thing the player most needs. The missing item is still shown below her note under "Also", so the player is never actually deprived of it.

If she is absent, exhausted (fatigue 80 or more) or was assigned work in the previous Evening block, Maxim writes it. He gets the day number wrong in the heading and adds a doodle description. The facts under it stay correct.

### What it contains

Build it from a pure function `morningBriefing(state, chapter)` in a new `src/game/briefing.ts`. It returns structured data, and the component only renders it. Sections, in this order, each one to three lines:

1. **Where we stand.** Day N of the chapter's days, days until the mission deadline, and one sentence of verdict chosen from the state: on track, slipping, in trouble, or beyond help. Write four to six verdict lines per level.
2. **Capital and the host.** HQ goodwill and host goodwill with the change since yesterday morning, and the single biggest cause of each change, taken from `goodwillHistory`. Example: "HQ 37 (−18): two faxes went unanswered."
3. **The mission.** Tasks confirmed out of the total, steps done yesterday, steps that open today, steps a setback has reopened, and the next step that can be done now. If a route is waiting to deliver, say when.
4. **Yesterday.** Up to four lines: what the player did that mattered, and what was missed or ignored. Use `describeCommitment` for what was done. Never invent: every line comes from the log, the report or the history.
5. **Today.** Fixed things from `agendaItems`: invitations due, démarche deadlines, the exam, an event waiting. Then counts of unread fax, PC mail and BlockBerry mail.
6. **People.** Relationships that changed state yesterday, favours owed to the player and by the player, and one person who is waiting on the player.
7. **You.** Language progress toward the next level, a reputation gained or close, a quirk added, energy and composure if either is low.
8. **Money.** Free funds, the mission reserve, and a warning only if a coming step cannot be paid.
9. **One recommendation.** The single most useful thing to do this morning, chosen by a simple priority rule and written as advice from the author. Priority, highest first:
   - a meter at risk of ending the posting;
   - unanswered Capital mail;
   - a mission step that expires or was reopened;
   - a démarche at its deadline;
   - an invitation today;
   - a person owed a favour who is about to call it in;
   - otherwise the next mission step.

Rules:

- A section with nothing to report is left out. The briefing is never padded.
- It never reveals outcomes, hidden routes or facts the player has not learned.
- The whole briefing is at most about 150 words on a normal day.
- Actions: "Read the press" (continues to the press review), "Open the agenda", "Close". Reading it costs 0 DP.
- It can be reopened from the BlockBerry during the day, and it is added to the BlockBerry mail inbox as "Morning report, Day N", so earlier days can be read again.
- A setting in the menu turns the morning briefing off. The recommendation line then appears on the main screen instead.

### The same recap when you come back

When a player uses Continue on a save slot and the posting is past Day 1 Morning, show a short "Previously" card before the game screen, built from the same function: where we stand, the mission, the last three things that happened, and the recommendation. One button: "Back to work". Do not show it on the first load after a block that the player ended in the same session.

### Day 15 and endings

On the final day the morning briefing becomes "Arrival day": the four tasks with their quality so far, what can still be fixed today, and who is at the airport. It does not predict the ending.

## Part 3: writing

Write all template lines in the house style: dry, institutional, deadpan. Put them in JSON, in the chapter pack where they name people or places and in `src/game/data/` where they are general:

- Verdict lines: at least 20 across the four levels.
- Recommendation templates: at least two per priority.
- Sola's opening line per relationship state: at least three each.
- Maxim's headings and doodles: at least eight.
- The trait lines for the first briefing: one per starting trait.

No line may blame the player for something that did not happen. Every number in a line comes from state.

## Part 4: saves, checker, simulation, tests

- **Saves:** store only what is needed: the last day a morning briefing was shown, the page of the first briefing last read, and the setting. Bump the posting version and migrate.
- **Content checker:** every template has the placeholders its rule fills; the author exists; lengths within limits.
- **Tests for `morningBriefing`:**
  - Each section appears only when it has content.
  - The biggest cause of a goodwill change is picked correctly.
  - The recommendation follows the priority order, with one test per priority.
  - The tone follows the relationship state.
  - Maxim replaces the author under the stated conditions.
  - Nothing unlearned leaks: test with a hidden route and an unknown fact.
  - A quiet day produces a short briefing, and Day 15 produces the arrival version.
- **Component tests:** shown on Day 2 Morning before the press review; not shown on Day 1; reopenable; the setting turns it off; the "Previously" card appears on Continue and not after an in-session block end.
- **Simulation:** add a check that `morningBriefing` returns a recommendation on every morning of every run and never throws. Report how often each recommendation priority fires. If one priority fires on more than 70% of mornings, say so in the balance report: it means the game keeps asking for the same thing.
- No rule or outcome changes. The simulation's ending numbers must not move.

## Rules

- Content in JSON, rules in pure tested TypeScript, save migration.
- Readable at 400px width. Keyboard accessible. Existing CSS tokens only.
- Never modify the Lovable block in AGENTS.md. Restore it if Prettier reformats it.
- Commit messages start with "U-03: ". Do not rewrite pushed history.
- Before pushing run `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run content:check`, `npm run sim` and `npm run build`. All must pass. No test may depend on a tight time limit.
- Add a line to roadmap.md and add U-03 to docs/MASTER_PLAN.md marked "(done)".
- Push to `origin/main` when finished.

## Deliverables

- Code, content and tests.
- A summary with:
  - the three pages of the first briefing as plain text for one example character;
  - four example morning briefings as plain text: a good day, a bad day, a day when Sola is wary, and a day when Maxim writes it;
  - an example "Previously" card;
  - how often each recommendation priority fired in the simulation;
  - anything you could not derive from existing state.
