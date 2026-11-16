# U-02 The first hour: task brief

Repository: kachumbali/persona-non-grata, branch `main`. Stack: React + TypeScript + Vite, zustand, vitest, bun.

Read first: AGENTS.md (including "Work packages"), GAME_DESIGN.md, docs/WRITING_GUIDE.md, and docs/work-packages/U-01-agenda.md. Finish and push U-01 before starting this.

## What a hand-played first day showed

A new player with Reply-All Reflex, Compulsive Démarche and Name-dropper played Day 1 in a browser, doing reasonable things: read the press, answered the phone call, sent the note verbale, took a language lesson, talked to a colleague. Result at the end of Day 1: HQ goodwill 55 → 34, morale 50 → 37.

The cause was mail the player never saw:

- Two faxes from Capital were waiting on Day 1 Morning. The secure fax in the office scene shows no sign that anything has arrived. Both counted as ignored at the end of the block: HQ −18.
- Two PC mails arrived later in the day (the generator, the co-chairing proposal). Nothing on the main screen or in the office scene says so. Both were ignored: morale −13, HQ −3.
- Plausible Deniability 0, from two flaws, added 30% to every one of these penalties.

A first-time player plays like the simulation's "ignorer" bot, which is replaced by Day 8 in every run. The texts are funny. The first hour punishes the player for not knowing where to look.

## Part 1: show that something is waiting

- **Badges.** Show an unread count on:
  - the secure fax and the PC hotspots in the office scene;
  - the BlockBerry button in the bottom bar;
  - the Mail tabs in the BlockBerry and on the PC.

  Count only items that will cost something if ignored this block. Use a second, quieter style for items that are merely unread.

- **Arrival notice.** When a block starts, list what arrived in one short line in the situation area: "2 faxes from Capital, 1 mail on the PC, 1 invitation." Each item links to where it is read.
- **Away from the embassy.** If a fax is waiting and the player is elsewhere, the BlockBerry says so and says it can only be read at the embassy. Reuse the wording style of existing notices.
- **End-of-block confirmation.** U-01 adds a confirmation for time-bound items. Extend it to mail that will be marked ignored at the end of this block, grouped by device, with the number of items.

## Part 2: a gentler first day

- Capital mail that arrives on Day 1 Morning does not escalate until the end of Day 1 Midday. Put the grace period in the chapter pack as data, per mail or as a chapter-wide first-day rule.
- The first ignored-mail penalty of a career is halved, with a line in the report: "Capital assumes the fax was jammed. Once."
- Do not change penalties after Day 1.

## Part 3: a briefing that matches the game

The posting briefing explains the press review at length and nothing else that has been added since. Rewrite `posting-briefing.json` in the same voice. Keep it to one screen of reading:

- Where things arrive: fax, PC, BlockBerry, and what happens if they are ignored.
- The mission in steps: where to see them, that some open later, that Capital and the host will change some.
- People: favours, the notebook ("Who is who"), gossip that may be false.
- Démarches: where the board is and that the choice of messenger matters.
- Languages: lessons, attempts, the exam.
- Your personnel file changes with what you do.
- One sentence each. The press review section shrinks to two sentences.

Add a **first-day checklist** that stays on the main screen during Day 1 only, ticking itself off:

1. Read the secure fax.
2. Check the PC.
3. Start one mission step.
4. Talk to one colleague.
5. End the block from the bottom bar.

It can be dismissed. It never appears again in that career.

## Part 4: small things noticed while playing

- **Trait options that do not fit the scene.** In Anselm's conversation about a yacht invitation, the option "[Compulsive Démarche] Deliver a written protest about the delay" has nothing to do with the topic. Audit all trait-gated options added to existing scenes. Rewrite each one that does not follow from the scene's own subject. List what you changed.
- **The interpreter picker** ("Interpreter for unfamiliar languages: None / Sola / Anselm / Maxim") appears in conversations with embassy colleagues who share the player's language. Show it only when the conversation has a language-gated option the player cannot take unaided.
- **"Sola: Ombrazian is now level 0."** appears after a first lesson. Report lesson progress as progress toward the next level, and announce a level only when it changes.
- **Reloading the page on Day 1** shows the posting briefing and the press review again. Remember that they were dismissed.
- **The commitment line** "Language lesson with Sola · 1 your DP · ƒ0 · sola" prints the colleague's id. U-01's `describeCommitment` should cover it; check that it does.
- **The simulation's "ignorer" bot** should stay as it is. Add a sixth bot, "newcomer": it behaves like a careful player from Day 2, but on Day 1 it only does what the first-day checklist says. Report its ending rates. Target, recorded in a comment: a newcomer is not replaced before Day 10 in at least 90% of runs.

## Rules

- Parts 1, 3 and 4 change no rules. Part 2 changes Day 1 only.
- Content in JSON, rules in pure tested TypeScript. If you add saved state, bump the posting version and migrate.
- Never modify the Lovable block in AGENTS.md. Restore it if Prettier reformats it.
- Commit messages start with "U-02: ". Do not rewrite pushed history.
- Before pushing run `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run content:check`, `npm run sim` and `npm run build`. All must pass. Check that the test suite also passes on a slow machine: no test may depend on a tight time limit.
- Add a line to roadmap.md and mark U-02 done in docs/MASTER_PLAN.md with "(done)" after the heading.
- Push to `origin/main` when finished.

## Deliverables

- Code, content and tests.
- A summary with: a plain-text rendering of the main screen at the start of Day 1 Morning showing the badges and the arrival notice; the new briefing text; the list of trait options you rewrote; the newcomer bot's numbers before and after the grace period; anything you could not do.
