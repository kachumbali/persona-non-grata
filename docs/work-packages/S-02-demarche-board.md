# S-02 The démarche board: task brief

Repository: kachumbali/persona-non-grata, branch `main` at `2d4f9f4` or later. Stack: React + TypeScript + Vite, zustand, vitest, bun.

Read first:

- AGENTS.md, including "Work packages", "Content checker" and "Simulated playthroughs".
- GAME_DESIGN.md.
- docs/MASTER_PLAN.md, section S-02 and "Fun rules".
- docs/BALANCE_REPORT.md.
- docs/WRITING_GUIDE.md.

Then read the code you will build on:

- `src/game/chapters/types.ts` and `src/game/chapters/port-hesperia-2006/` (chapter.json, campaign.json, emails.json, press.json).
- `src/game/mission.ts` and the route handling in `src/game/store.ts` (favours, known facts, delayed confirmations, call-ins).
- `src/game/rules.ts`: `PendingDecision`, `delegationSucceeds`, `StoryEvent`.
- `src/game/character.ts`: `formalBonus`, `eligible`, gates.
- `src/game/press.ts`: clipping triggers.
- `src/game/components/`: PlanningDesk.tsx, MissionSteps.tsx, Mailbox.tsx, GameScreen.tsx, PressReview.tsx.
- `src/game/content-check.ts` and `src/game/sim/`.

## Where the game stands

Measured by `npm run sim` after B-02:

- A careful bot is promoted in 79% of runs and never needs anything but official routes.
- Days 7 to 11 are the quietest. About half of all blocks have nothing waiting.
- A scheduling conflict occurs on about 5 of 15 days. The target is 12.
- A careful player sees 0 to 2 trait moments per game. The target is 10.

The démarche board is meant to fill the quiet days with time-bound work that has to go to someone, and to make the choice of messenger the joke.

## Part 0: loose ends from B-02 (small, do first)

The content checker reports flags that are set but never read. Give each a consequence so the money route and refused favours come back:

- `stamp-expedited`, `lounge-expedited` and the other money-route flags: one press clipping each (Ombrazia Today or Ruth Vale's column), triggered by the flag, in the following days.
- `programme-background-used`: one clipping or one line in a later scene.
- `refused-favour-protocol`, `-golf`, `-fixer`, `-eu`, `-bianca`: each makes that person's favour route unavailable for the rest of the chapter, and changes one later greeting or scene line.

After this, `npm run content:check` should report no "set but never read" warnings for these flags.

## Part 1: démarches as chapter data

Add `demarches.json` to the chapter pack, with a schema in the content checker and a loader in the chapter index. A démarche has:

- `id`, `subject` and `instruction` (the mail text from Capital, 40 words or fewer).
- `issuedDay` and `deadlineDay`.
- `level`: "desk" | "director" | "deputy-minister". This is the level it must be delivered at.
- `recipient`: a character id at the host, e.g. `protocol`, `port-officer`, `golf`.
- `talkingPoints`: two or three short lines.
- `routes`: see Part 2.
- `report`: what Capital says for a good, adequate or failed delivery.
- Optional `absurd: true`, `conflictsWith: demarcheId`, and `supersededBy: { day, demarcheId }` for contradictory instructions.

Write 8 démarches for Port Hesperia across Days 2 to 13, in the house style. Weight them toward Days 6 to 11, which are the quiet days. Include:

- Two ordinary ones tied to the existing world: the fuel quay, the clean-port story, the Minister's visit.
- One tied to the EU cast: a joint démarche where France and Germany disagree on the letterhead.
- One on a UN resolution the host has never heard of.
- One protesting another country's démarche.
- One pair of contradictory instructions that arrive an hour apart, the second superseding the first. Delivering the first after it was superseded is a failure with its own joke.
- One the recipient agrees with completely, where the instructions do not say what to do next.
- One with the deadline on the same day and block as an existing invitation or a mission step's earliest day, to force a scheduling conflict.

## Part 2: four ways to deliver

Each démarche offers these routes. Reuse the route model from B-02 where it fits; do not build a second, parallel one.

| Route               | Cost                                                                 | What decides the outcome                                                                                                                                                                                                                           |
| ------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deliver it yourself | 2 DP plus travel to the recipient's location                         | Gravitas (use `formalBonus`), trust with the recipient, and a matching known fact if one exists. Required when the level is "deputy-minister".                                                                                                     |
| Assign a colleague  | Staff DP under the existing delegation rules (skill, trust, fatigue) | The colleague's personality. Write a distinct outcome line per colleague for at least five staff. Anselm delivers his own improved version. Ines adds a consular angle. Bianca makes it sound like an ultimatum. Maxim goes to the wrong ministry. |
| Joint EU démarche   | 1 DP plus a coordination step at the EU Delegation                   | Trust with `eu` (Celeste) and the EU ambassadors. More weight with the host. Risk: the letterhead dispute delays it past the deadline, or Celeste brands it Team Europe.                                                                           |
| Note verbale        | Staff time only, no travel                                           | Always on time, always adequate at best. Capital asks why you did not go in person if the level was director or above.                                                                                                                             |

Rules:

- **Wrong level is a protocol incident.** Sending a colleague below the required level costs host goodwill and sets a flag, with a funny result line. Sending the intern to a Director is the worst case.
- **Outcome quality** is good, adequate or failed. It drives the report mail from Capital (HQ goodwill), the host's reaction (host goodwill, trust with the recipient), and possibly a favour earned or owed.
- **Missing the deadline** is a failure, with a "Missed instruction" record like an ignored mail.
- **Leaks.** Any démarche may set a flag that triggers a press clipping the next morning. Write one clipping per démarche for at least five of them.
- **Démarches are optional for the mission.** No démarche may block a mission step. They may help: a well-delivered démarche can grant a favour or teach a fact that opens a mission route.

## Part 3: traits and stats

- **Compulsive Démarche** (`demarche` trait): on each trip to the ministry, the player automatically delivers one extra, unrequested démarche drawn from a small pool of 4. Half are harmless or helpful. Half are out of date, with a cost and a joke. Record `trait:demarche:<id>` so the press can react.
- **Gravitas** raises the outcome of in-person delivery. **Charm** raises trust gained from a good delivery. **Plausible Deniability** softens the penalty for a failed one.
- Add at least 6 trait-gated options across the démarches for traits other than `demarche`, using `requiresTrait`. Examples: Name-dropper invokes the Commissioner at the ministry; Brussels Brain turns the talking points into a non-paper; Reply-All Reflex copies the démarche text to the whole EU list.

## Part 4: the board

- A démarche board on the embassy desk, reachable from the place where the mission steps are shown. It lists open démarches with subject, level, recipient, days left and status: new, in progress, delivered (with quality), missed or superseded.
- Choosing one shows the talking points and the four routes with their costs and what blocks each.
- A new démarche arrives as a mail from Capital on the secure fax and appears on the board at the same time.
- The situation report at the end of the block states each delivery outcome.
- Readable at 400px width. Keyboard accessible. Existing CSS tokens only.

## Part 5: saves, checker, simulation

- **Saves:** add démarche state to the posting. Bump the posting version and migrate old saves with an empty board. Démarches issued before the save's current day appear as open if their deadline has not passed, and are skipped silently if it has.
- **Career:** record delivered, failed and missed counts in the chapter result.
- **Content checker:** ids unique; recipient and colleague ids exist; issued and deadline days inside the chapter and in order; every démarche has a note-verbale route, so it can always be done; `supersededBy` and `conflictsWith` point at existing démarches; report texts present for all three qualities; length limits.
- **Simulation:**
  - careful and press-reader deliver every démarche, choosing the route by level.
  - socialiser prefers the joint EU route.
  - reckless always sends the intern.
  - ignorer misses them all.
  - Add to the report: démarches delivered by route and quality per bot, protocol incidents, missed deadlines, and the new idle-block and conflict-day numbers next to the old ones.
- **Thresholds**, set from measured results, with the target in a comment:
  - Idle blocks for the careful bot drop by at least 15% from the B-02 figure.
  - Conflict days for competent bots rise to at least 7 of 15.
  - No bot's mission completion rate falls because of démarches.
  - The reckless bot causes at least one protocol incident per run.
- Regenerate docs/BALANCE_REPORT.md.

## Rules

- Optional stories never block the mission.
- Content in JSON, rules in pure tested TypeScript, save migration.
- House style from docs/WRITING_GUIDE.md: dry, institutional, deadpan. Jokes aim at institutions and habits, never at nationality, ethnicity or accent. Fictional host and third countries; real names only for EU member states; no real people.
- Never modify the Lovable block in AGENTS.md. Restore it if Prettier reformats it.
- Commit messages start with "S-02: ". Do not rewrite pushed history.
- Before pushing run `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run content:check`, `npm run sim` and `npm run build`. All must pass.
- Tick S-02 in roadmap.md and mark it done in docs/MASTER_PLAN.md.

## Deliverables

- Code, chapter data, tests and updated docs: GAME_DESIGN.md, the scene-writer prompt for the démarche format, BALANCE_REPORT.md.
- A summary covering:
  - the 8 démarches with day, level, recipient and the joke of each;
  - the per-colleague outcome lines;
  - the unrequested démarche pool for the trait;
  - the press clippings added, including those for the B-02 flags;
  - before and after simulation numbers: idle blocks, conflict days, trait moments, careful bot win rate;
  - which existing tests you changed and why;
  - anything you could not do or are unsure about.
