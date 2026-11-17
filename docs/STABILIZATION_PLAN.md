# Stabilization plan

**Feature freeze from 17 November 2026.** No new systems, screens or story arcs until this plan is complete. Work is limited to fixing, checking and deepening what exists.

On hold until the freeze ends: U-03 (briefings), S-04 (your past catches up), S-15 (world file), A-01 (cultural institute), and every later package in docs/MASTER_PLAN.md. U-04 (polish pass) is folded into Q-06 below.

## Why

In eight days the game gained mission steps, routes, démarches, relationships, gossip, reputations, languages, an agenda and a first-hour guide, written by four different tools. Bots have played it thousands of times; people have played it a handful of times. A playtest found an EU message that made no sense where it appeared. The same kind of problem is likely elsewhere.

Known example: the event `cookies` appears anywhere as "Phone call · Celeste Norren", but its text has Celeste sliding a biscuit plate across a table while "the room braces itself". It also repeats the 17.6% meeting that already happens at the EU Delegation. Of 48 story events, 24 appear as pop-ups wherever the player is.

## What "stable" means

The freeze ends when all of these are true:

1. The GitHub Actions run on `main` is green, and stays green for three consecutive pushes.
2. A scripted browser playthrough of all 15 days completes for three different character builds, at desktop and phone width, with no console errors and no screen the player cannot leave.
3. `npm run content:check` reports 0 errors and 0 warnings.
4. Every pop-up event reads correctly where it appears: as a call, a message or a visit that makes sense from any location.
5. Every character has a short biography and a voice note. Every place has a description that says what happens there.
6. Every dialogue, event, mail, démarche, invitation and clipping has been read against the cast and places bible, and every finding is fixed or recorded as accepted.
7. Saves from every earlier version load, and a damaged save does not crash the game.
8. A person plays Days 1 to 3 by hand and reports nothing broken or confusing that is not already on the list.

## Packages

Each package is small and has one owner at a time. Packages in the same wave touch different files and can run in parallel.

| Wave | Id    | Package                                               | Main files                                                           |
| ---- | ----- | ----------------------------------------------------- | -------------------------------------------------------------------- |
| 1    | Q-01  | Cast and places bible                                 | `docs/CAST.md`, `docs/PLACES.md` (new)                               |
| 1    | Q-02  | Pop-ups that make sense where they appear             | `campaign.json` events, `Interruption.tsx`, `content-check.ts`       |
| 1    | Q-03  | Scripted full playthroughs in a browser               | `scripts/`, a new test folder                                        |
| 2    | Q-04  | Substance for places and people                       | `campaign.json` characters and locations, notebook and place screens |
| 3    | Q-05a | Text audit: staff and contact dialogues               | `dialogues.json`                                                     |
| 3    | Q-05b | Text audit: story events, gossip, relationship scenes | `campaign.json` events and gossip                                    |
| 3    | Q-05c | Text audit: mail, démarches, invitations, press       | `emails.json`, `demarches.json`, `invitations.json`, `press.json`    |
| 4    | Q-06  | Polish pass (was U-04)                                | various; see `docs/work-packages/U-04-polish-pass.md`                |
| 5    | Q-07  | Saves and crashes                                     | `store.ts`, `saves.ts`, a new error boundary                         |
| 6    | Q-08  | Hand playtest and release notes                       | `docs/RELEASE_NOTES.md`                                              |

### Q-01 Cast and places bible

One reference that every later check reads against. Built from the existing content only; nothing is invented that contradicts it.

- `docs/CAST.md`: for each of the 24 characters:
  - id, name, role, gender, where they work;
  - NPC traits and what they want;
  - a voice note: how they speak, with two quoted lines from existing content;
  - facts established in content: relationships, history, running jokes, things they have said about themselves;
  - contradictions found between pieces of content.
- `docs/PLACES.md`: for each of the 7 places:
  - what it is, who is usually there, what the player can do there, and which events, leads and invitations happen there;
  - its atmosphere in two or three sentences, taken from existing text where possible.
- A section "Setting facts": Bellaluxe, Ombrazia, Port Hesperia, the 17.6% premise, the EU cast, the year, the technology.
- A section "Open contradictions" listing every inconsistency found, with file and id.

### Q-02 Pop-ups that make sense where they appear

- Give every event without a location a `channel`: `call`, `message` or `visit`.
  - `call`: a phone call. The text is what the caller says or what the call is about. No physical actions in the room.
  - `message`: a note, a fax or a BlockBerry message. Written as such.
  - `visit`: someone at your door. Only for embassy staff. When the player is elsewhere, it is shown as a `message` with a short `remoteText`.
- The pop-up header follows the channel: "Phone call · Celeste Norren", "Message · Celeste Norren", "At your door · Pavel Oskarsen".
- Read all 24 pop-up events. Rewrite the text of any that does not work in its channel. Move to a location (making it a lead) any that can only happen in a specific place.
- `cookies`: remove the duplicate of the 17.6% meeting. Either turn it into Celeste's call ahead of the meeting, inviting the player and setting up the joke, or delete it if nothing depends on it. Check flags, press triggers and reputations that read it.
- The content checker reports a pop-up event without a channel, a `visit` from someone who does not work at the embassy, and a `call` or `message` text containing physical stage directions from a short word list (slides, hands you, across the table, the room).
- Tests for the channel header, visit deferral and the fallback message.

### Q-03 Scripted full playthroughs in a browser

- A Playwright script, `scripts/playthrough.mjs`, that starts the dev server, creates a career through the real character builder, and plays all 15 days through the real screens: dismisses briefings, reads the press, opens the fax and PC and answers mail, starts mission steps, answers pop-ups, travels, talks to colleagues, ends each block.
- Three builds and two screen sizes (1280 by 900, 400 by 800).
- It records: console errors, page errors, any block in which no "End" button could be reached, any dialog that could not be closed, any text containing `undefined`, `null`, `NaN`, `[object Object]`, an unfilled `{placeholder}` or a raw id, and a screenshot of each Morning.
- Output: `docs/PLAYTHROUGH_REPORT.md` with findings grouped and counted, and the screenshots in a folder ignored by git.
- `npm run playthrough` runs it locally. It is not part of the CI workflow.
- The package ends with the bug list. It fixes nothing except the script itself.

### Q-04 Substance for places and people

Uses the bible from Q-01.

- Characters get `bio` (two or three sentences) and `voice` (one line for writers, not shown to players). Write them from the bible. Do not contradict established facts.
- Places get a fuller `description` (two or three sentences), `regulars` (character ids), and `atmosphere` per block: one short line for morning, midday, afternoon and evening.
- Show the bio in "Who is who" once the player has met the person. Show the place description and the current block's atmosphere line in the place scene. Small display changes only.
- The content checker requires `bio` and `voice` for every character, and `description`, `regulars` and `atmosphere` for every place.

### Q-05 Text audit (three parts, in parallel)

Every piece of player-visible text is read against `docs/CAST.md`, `docs/PLACES.md` and `docs/WRITING_GUIDE.md`. For each item, check:

1. **Speaker:** the right person says it, in their voice, with the right pronouns.
2. **Context:** it fits where and when it can appear. It does not refer to things that may not have happened yet, to people the player cannot have met, or to places in the wrong way.
3. **Choice and result:** each result follows from its choice. No result contradicts the choice's effects. Trait, language and reputation options fit the scene.
4. **Continuity:** facts agree with the bible. Numbers agree: days, money, the 17.6% premise.
5. **Duplicates:** no two items tell the same joke or the same scene.
6. **Language:** spelling, grammar, punctuation, British English, consistent names and titles, length limits.
7. **Tone:** the house style. Jokes aim at institutions and habits, never at nationality, ethnicity or accent.

Each part:

- writes its findings to `docs/audit/Q-05x.md`: id, problem, fix;
- fixes what it can without changing ids, effects, numbers, flags or gates;
- lists what needs a decision from the owner.

Parts: Q-05a `dialogues.json`; Q-05b story events, relationship scenes, call-ins and gossip in `campaign.json`; Q-05c `emails.json`, `demarches.json`, `invitations.json`, `press.json`, `posting-briefing.json`, `mail-choices.json`.

### Q-06 Polish pass

The brief `docs/work-packages/U-04-polish-pass.md`, items 1 to 7, plus every bug from Q-03's report that is not covered by another package.

### Q-07 Saves and crashes

- Save fixtures: one saved game for each posting version from 5 to the current one, generated by checking out the old code or written by hand from the migrations. A test loads each, continues one block, and checks that nothing is lost.
- A damaged save (truncated, wrong types, missing fields) loads as an empty slot with a clear message, and the damaged data is kept under a backup key. Test it.
- An error boundary around the game screen: if a screen throws, the player sees a short apology, a button to return to the title screen, and a button to copy an error report (the error, the day and block, the save version). The game state is not lost.

### Q-08 Hand playtest and release notes

- A person plays Days 1 to 3 at desktop and phone width with a fresh career, and Days 1 to 15 once.
- `docs/RELEASE_NOTES.md`: what changed during the stabilization, what is known and accepted, and how to report a problem.
- The freeze ends when the criteria above are met.

## Working rules for this plan

- Same workflow as `docs/work-packages/README.md`.
- Commit messages start with the package id, e.g. "Q-02: ".
- Content changes keep ids, effects, numbers, flags and gates unless the package says otherwise. Save compatibility is not broken.
- After every package: the six checks pass, the simulation's ending numbers do not move by more than 5 points for any bot, unless the package is meant to change them.
