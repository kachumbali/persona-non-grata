# B-02 Gatekeepers and routes: task brief

Repository: kachumbali/persona-non-grata, branch `main` at `07313d9` or later. Stack: React + TypeScript + Vite, zustand, vitest, bun.

Read first:

- AGENTS.md, including "Work packages", "Content checker" and "Simulated playthroughs".
- GAME_DESIGN.md.
- docs/MASTER_PLAN.md, section B-02 and "Fun rules".
- docs/BALANCE_REPORT.md.
- docs/WRITING_GUIDE.md.

Then read the code that B-01 added:

- `src/game/chapters/types.ts`: `MissionStep`, `Setback`, `StepRef`.
- `src/game/chapters/port-hesperia-2006/chapter.json`: `missionSteps`, `setbacks`, `economy`.
- `src/game/mission.ts`: `stepStatus`, `stepContext`, `inPersonBlock`, `stepCash`, `applySetbacks`.
- `src/game/store.ts`: `missionSteps`, `setbacksApplied`, the step handling in `queue` and `advance`.
- `src/game/components/MissionSteps.tsx` and PlanningDesk.tsx.
- `src/game/content-check.ts`.
- `src/game/sim/`: bots, run, report, `sim.test.ts`.
- `src/game/press.ts`: clipping triggers.
- `src/game/career.ts` and `saves.ts`.

## Where the game stands

The chapter's mission is preparing the Minister's visit. Four tasks (clearance, lounge, programme, security) are each split into 3–4 ordered steps with an earliest day. Four scripted setbacks reopen steps. Mission cash is ring-fenced. Day 15 is played.

Measured by `npm run sim`:

- No bot finishes before Day 13.
- A careful bot is still promoted in 100% of runs. The mission is long but not hard.
- One possible dead end exists. The step `clearance.protocol-stamp` needs trust 55 with `protocol` (Director Ndao) in person, or a colleague with the skill. If both fail for days, clearance is stuck.

## Goal

Make the mission hard as well as long, without ever locking a player out. Each key step gets a gatekeeper and several routes past them. Every route has its own price and its own later consequence.

## Design to implement

### 1. Routes as chapter data

Extend `MissionStep` with optional `gatekeeper` (a character id) and `routes` (2–4 per gated step). A step with routes is done by choosing one route. A step without routes works as today.

Each route has:

- `id`, `label` and `kind`: "official" | "favour" | "money" | "eu" | "knowledge".
- Costs: `dp`, `cash` (drawn from the mission reserve unless `fromGeneralFunds` is true) and `deniability` or other meter effects.
- `requires`, any of:
  - trust with a character;
  - a favour owed to you by a character;
  - a known fact (see 4);
  - a story flag or outcome;
  - `expiresDay` or `expiresOnFlag`.
- `days`: how many days the route takes to deliver once started. The official route is slow, e.g. 3 days. Others are immediate or 1 day.
- `quality`: "good" | "adequate" (see 6).
- `consequences`, any of:
  - a favour you now owe;
  - a story flag, so press clippings and later scenes can react;
  - trust changes with named characters;
  - a delayed effect on a later day.
- `result`: the result text.

**The official route is the guarantee.** Every gated step must have exactly one route of kind "official" with no trust, favour, knowledge or flag requirement. It costs time (DP and a delivery delay) and nothing else. It removes the dead end at `protocol-stamp`. Keep `requiresTrust` working for chapters that still use it.

### 2. Gate the steps where it is funny, not everywhere

In Port Hesperia, gate 5–6 of the 13 steps. Suggested:

- **clearance.protocol-stamp**, gatekeeper `protocol` (Director Ndao):
  - official: file and wait three days;
  - favour: Ndao's goodwill, if trust is high or he owes you;
  - money: an "expedited handling fee" through `fixer` (Marcel Deux), which costs cash and deniability and sets a flag;
  - eu: Celeste Norren (`eu`) raises it at coordination, and the confirmation arrives with a Team Europe cover note.
- **lounge.reservation** or **lounge.guest-list**, gatekeeper `protocol` or `port-officer` (Mira Sene): official; favour from Minister Bako (`golf`), who then calls it in; money through Marcel; eu.
- **programme.host-agreement**, gatekeeper `golf` (Minister Bako): official through the ministry; favour on the golf course; a knowledge route if you learned his real objection.
- **security.route-recon** and **security.motorcade**, gatekeeper `bianca` (Defence Attaché) for the embassy side and a host security contact for the host side: official; favour; money.

Use existing characters only. Write all labels and results in the house style: dry, institutional, deadpan, aimed at institutions and habits and never at nationality or accent, within the length limits in the writing guide.

### 3. Favours ledger

Add to the posting state `favours: { owedToYou: Record<characterId, number>; youOwe: Record<characterId, number> }`. Carry both into the career's chapter result, so later chapters can use them.

- **Earning:** existing choices can grant a favour. Add an optional `favour: { character, delta }` field to story, dialogue and email choices, with schema and content-check support. Tag 8–10 existing choices where it fits, such as helping Ndao with the seating complaint, or Mira with the clean-port story.
- **Spending:** a favour route consumes one favour owed to you by that character.
- **Owing:** a route can make you owe one. For each character who can be owed (at least Bako, Ndao, Marcel and Celeste), write one "calling it in" event that fires 1–3 days later at an awkward moment. Honouring it costs time or goodwill. Refusing costs trust and sets a flag.

### 4. Knowledge as a key

Add `knownFacts: string[]` to the posting state. A fact is learned from:

- a press clipping (extend clippings with optional `teaches: factId` when the review is read);
- a dialogue or event choice (optional `teaches` field);
- asking Lucien for background.

Routes with a `knowledge` requirement are shown as "?" on the dashboard until the fact is known. Then they appear with their label. Write 4–6 facts for Port Hesperia. Tie at least two to the existing press scenario: the reshuffle rumour, and who really controls the port portfolio.

### 5. Counter-demands and conflicting supporters

Each gatekeeper may have a `demand`: something they want in return for the favour route. Examples: Ndao's nephew's band at the reception; a statement from you on port clean-up for Mira.

- At least one pair of demands must conflict, e.g. satisfying Mira's demand lowers Bako's trust and voids his favour route.
- Model demands as flags and trust changes through the existing systems. Do not build a new subsystem.

### 6. Support that expires, and degrees of success

- **Expiry:** a route may have `expiresDay` or `expiresOnFlag`. At least one route must expire because of the press scenario, e.g. Bako's route lapses if the reshuffle goes against him. A route already used stays used.
- **Quality:** a step records the quality of the route used. Add a per-task quality summary to the mission state. Let ending text and the debrief line vary with it. Example: "The lounge was reserved. The flag in it was Valdoria's." Do not change the ending rules' thresholds. Add a small meter effect at the arrival on Day 15 for each "adequate" task. Document the numbers.

### 7. Setbacks interact with routes

When a setback reopens a gated step, the route used before is marked spent, unless it is the official route. The player must find another way or wait for the official one. Keep the checker rule that every setback leaves enough days to recover by the official route alone.

### 8. Screens

- **MissionSteps:** show the gatekeeper's name and portrait on gated steps, and the routes as a short list.
  - Each route shows its state: available, with its price; blocked, with the reason; expired; or "?" for undiscovered.
  - Add a small favours line: "Owed to you: Bako 1 · You owe: Marcel 1".
- **PlanningDesk** (or wherever steps are queued): choosing a gated step asks for the route.
- Readable at 400px width. Keyboard accessible. Existing CSS tokens only.

### 9. Saves, checker, simulation

- **Saves:** bump the posting version. Migrate so that steps already done keep their state with quality "good", favours start empty and known facts start empty.
- **Content checker:** route ids unique per step; exactly one unconditional official route per gated step; characters, facts and flags exist; every fact required by a route is taught somewhere; every "calling it in" event exists for characters who can be owed; expiry days within the chapter.
- **Simulation:** teach the bots routes.
  - careful prefers official routes.
  - socialiser prefers favour routes.
  - reckless prefers money routes.
  - press-reader uses knowledge routes.
  - ignorer uses official routes only when a step is otherwise blocked.

  Add to the report: route usage by kind per bot, favours owed at the end, quality per task, and how many setbacks forced a route change.

- **Simulation thresholds.** Set each from the measured result, and record the target in a comment.
  - No run is ever locked out of a step. This is a hard assertion.
  - The careful bot no longer wins 100%. Target: promoted in 60–90% of runs. If your first tuning does not reach this, tune route delays and setback timing, not the ending thresholds. Report what you tuned.
  - Every route kind is used by at least one bot.
  - No single route kind accounts for more than 60% of gated steps across competent bots.
- Regenerate docs/BALANCE_REPORT.md.

## Rules

- Optional stories must never block the mission. They may only provide shortcuts: favours, facts, trust.
- Content in JSON, rules in pure tested TypeScript, save migration.
- Never modify the Lovable block in AGENTS.md. Restore it if Prettier reformats it.
- Commit messages start with "B-02: ". Do not rewrite pushed history.
- Before pushing run `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run content:check`, `npm run sim` and `npm run build`. All must pass.
- Tick B-02 in roadmap.md and mark it done in docs/MASTER_PLAN.md.

## Deliverables

- Code, chapter data, tests and updated docs: GAME_DESIGN.md, the scene-writer prompt for the new `favour` and `teaches` fields, and BALANCE_REPORT.md.
- A summary covering:
  - the gated steps with their routes, prices and consequences;
  - the facts and where each is taught;
  - the favour-granting choices you tagged;
  - the conflicting demand pair;
  - before and after simulation numbers: careful bot win rate, route usage by kind, lock-outs;
  - what you tuned to reach the targets;
  - which existing tests you changed and why;
  - anything you could not do or are unsure about.
