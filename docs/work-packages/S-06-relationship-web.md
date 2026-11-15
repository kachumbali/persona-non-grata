# S-06 The relationship web: task brief

Repository: kachumbali/persona-non-grata, branch `main` at `9c9b3d4` or later. Stack: React + TypeScript + Vite, zustand, vitest, bun.

Read first:

- AGENTS.md, including "Work packages", "Content checker" and "Simulated playthroughs".
- GAME_DESIGN.md.
- docs/MASTER_PLAN.md, section S-06 and "Fun rules".
- docs/BALANCE_REPORT.md.
- docs/WRITING_GUIDE.md.

Then read the code you will build on:

- `src/game/chapters/port-hesperia-2006/campaign.json`: `characters` (fields today: id, name, role, location, likes, dislikes, skills, line, gender, portrait), `events`, and `chapter.json` (`startRelationships`).
- `src/game/store.ts`: `colleagues` (trust and fatigue per character), `relationships` (a number per pair, via `pairKey`), `favours`, `knownFacts`, and how `pair` / `pairTarget` on choices change a pair.
- `src/game/rules.ts`: `delegationSucceeds` (uses pair cooperation), `StoryEvent`, `StoryChoice`.
- `src/game/dialogues.ts`: `moodOpener`, `pickTopic`, `TalkChoice`.
- `src/game/character.ts`: gates and stat modifiers.
- `src/game/demarche.ts` and `src/game/mission.ts`: routes that use trust, favours and facts.
- `src/game/press.ts`, `src/game/content-check.ts`, `src/game/sim/`.
- Components: Conversation.tsx, PlaceScene.tsx, Interruption.tsx, PlanningDesk.tsx, GameScreen.tsx.

## Why this package

The game's humour should come from the many characters and how they stand with each other. Today:

- A character has trust with the player and fatigue. Nothing else changes during play.
- Two characters have a single hidden number between them. It starts at 50 for every pair except two.
- Characters have no traits of their own, so the player's traits never meet anyone else's.
- The press-reader bot is promoted in 100% of simulated games. Information from the press is currently always good and never costs anything.

## Part 1: characters with traits

Add to each character in `campaign.json`:

- `traits`: 2–3 short trait ids from a new chapter-independent file `src/game/data/npc-traits.json`. Each trait has an id, a name, a one-line description, and rule hooks from this closed set:
  - `likesPlayerTrait` / `dislikesPlayerTrait`: a player trait id, with a trust gain or loss on first meeting and a modifier on later gains.
  - `likesStat` / `dislikesStat`: a player stat with a threshold.
  - `clashesWith` / `clicksWith`: another NPC trait id. This moves the pair's relationship each time the two work together.
  - `gossips`: passes on what they know (see Part 3).
  - `holdsGrudges`: negative changes with this person decay slowly or not at all.
- `wants`: one line on what this person wants this chapter. Shown in "Who is who" once discovered.

Write about 16 NPC traits in the house style. Examples: Template Enthusiast, Keeper of the Seating Plan, Allergic to Initiative, Remembers Everything, Credits Self, Loyal to the Previous Ambassador, Believes in the Process.

Assign traits to all 24 characters. They must fit what the existing dialogues already show: Anselm credits himself, Pavel guards receipts, Klaus loves templates, Celeste brands everything Team Europe.

## Part 2: named relationship states

Replace the bare pair number with a relationship that has a value and a named state. Keep the number, so `delegationSucceeds` and existing content keep working.

- States: `ally`, `friendly`, `neutral`, `wary`, `rival`, `feud`, plus special tags that can sit on top: `mentor`, `owes-a-favour`, `former-couple`, `shares-an-office`. The state is derived from the value, with thresholds in one exported constant. The tags are authored or set by events.
- The same model applies between the player and each character (today's trust) and between any two characters.
- Author starting relationships for Port Hesperia in `chapter.json`: at least 14 pairs that are not neutral, across embassy staff, the EU cast and the host. Keep the two existing ones (Anselm–Pavel, Sola–Elise). Add tags where they are funny. Examples: two EU ambassadors who are a former couple; Pavel sharing an office with Lucien; Ndao as an unwilling mentor to Mira.
- A relationship changes through: existing `pair` effects on choices; working together (improves or worsens depending on trait clashes); the player's choices in scenes that involve both; and gossip (Part 3).
- When a relationship crosses into a new state, record it and add a line to the situation report. Example: "Anselm and Pavel: rivalry has become a feud."

## Part 3: gossip

Gossip is something the player collects and can spend. Build it on the existing `knownFacts` mechanism where that fits. Do not add a parallel system if facts can carry it.

- A gossip item has: id, text, who it is about, who knows it at the start, and how sensitive it is.
- The player learns gossip from: conversations with characters who have the `gossips` trait; receptions and invitations; the press review; and overhearing in a place where two characters with a relationship are both present.
- The player can do one of three things with an item, each as a choice in conversation with a relevant person:
  - **Pass it on.** Raises trust with the listener. Changes the relationship between the listener and the subject. May reach the subject later, with a consequence.
  - **Hold it.** It can later open a mission route or a démarche option that requires knowledge.
  - **Deny you ever heard it.** Uses Plausible Deniability when someone asks.
- **Gossip can be wrong.** At least a third of items are false or half-true. Acting on false gossip has a cost and a joke. This also gives the press and the rumour mill a risk, which they lack today.
- Write 12 gossip items for Port Hesperia. Tie at least 4 to existing stories: the fuel quay, the reshuffle rumour, the supplier, the seating complaint.

## Part 4: relationships create scenes

Write at least 10 new or reworked story events for Port Hesperia that read relationship states or tags. Each has choices that change relationships between other people, not only with the player. Required kinds:

- Two feuding or rival colleagues both needed for one joint task, with the choice of who gets it and how it is announced.
- A dinner or reception where the seating depends on who is speaking to whom this week.
- A former couple who must co-sign something.
- A colleague asking the player to take their side, and the other colleague hearing about it.
- A relationship that the player can repair over several steps, with a payoff in a mission route or a démarche.
- A relationship that gets worse if ignored, with a consequence before the chapter ends.

Rules for these scenes:

- The player must be able to change at least 6 relationships between other people over a chapter.
- At least 10 scenes read relationship states.
- None of these scenes may block the mission.
- Greetings use the named state and the NPC's traits, extending `moodOpener`.

## Part 5: the "Who is who" screen

- A screen reachable from the main game screen. It lists the people the player has met, grouped by place.
- For each person: portrait, role, the relationship with the player as a named state, known traits, what they want if discovered, favours owed either way, and their known relationships with others.
- Information appears as the player learns it. Unknown traits and relationships show as "?".
- Relationships between others are shown as a readable list per person. A graph is not required.
- Mood on portraits in place scenes: a small marker when someone is in a feud, owes the player, or is owed by the player.
- Readable at 400px width. Keyboard accessible. Existing CSS tokens only.

## Part 6: saves, career, checker, simulation

- **Saves:** bump the posting version. Migrate old saves: existing pair numbers keep their values; new pairs start from the chapter's authored values; known gossip starts empty; discovered traits start empty.
- **Career:** carry the final relationship state with each character and the tags into the chapter result, so a later chapter can bring a person back with the relationship intact.
- **Content checker:** NPC trait ids exist; every character has 2–3 traits; relationship pairs reference existing characters and are not duplicated; gossip subjects and knowers exist; every gossip item can be learned somewhere; scenes that read a relationship reference existing pairs; length limits.
- **Simulation:**
  - Bots handle gossip by habit: socialiser passes everything on; careful holds everything; press-reader acts on gossip and press items, including false ones; reckless spreads the most sensitive items; ignorer learns nothing.
  - Add to the report: relationship state changes per run, relationships between others changed by the player, gossip learned, passed on, held and false gossip acted on, and scenes that read relationships seen per run.
- **Thresholds**, set from measured results, with the target in a comment:
  - The player changes at least 6 relationships between others in a socialiser run.
  - At least 10 relationship-reading scenes are reachable.
  - The press-reader bot no longer wins 100% of runs. Target: 70–90% promoted, through false gossip and press items that mislead. Tune content, not ending thresholds.
  - Mission completion rates do not fall for careful bots.
- Regenerate docs/BALANCE_REPORT.md.

## How to split the work

This is a large package. Do it in three commit series so each one leaves the game working:

1. NPC traits, named relationship states, authored starting relationships, migration and "Who is who".
2. Gossip, including false gossip, and the bots' handling of it.
3. The relationship scenes, greetings and report updates.

## Rules

- Optional stories never block the mission.
- Content in JSON, rules in pure tested TypeScript, save migration.
- House style from docs/WRITING_GUIDE.md: dry, institutional, deadpan. Jokes aim at institutions and habits, never at nationality, ethnicity or accent. Relationships between adults are played for office comedy, never explicit. No real people.
- Never modify the Lovable block in AGENTS.md. Restore it if Prettier reformats it.
- Commit messages start with "S-06: ". Do not rewrite pushed history.
- Before pushing run `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run content:check`, `npm run sim` and `npm run build`. All must pass.
- Tick S-06 in roadmap.md and mark it done in docs/MASTER_PLAN.md.

## Deliverables

- Code, chapter data, tests and updated docs: GAME_DESIGN.md, the scene-writer prompt for the new fields, BALANCE_REPORT.md.
- A summary covering:
  - the NPC traits and who has which;
  - the authored starting relationships and tags;
  - the 12 gossip items, marking which are false;
  - the relationship scenes;
  - before and after simulation numbers: press-reader and careful win rates, relationship changes per run, gossip use;
  - which existing tests you changed and why;
  - anything you could not do or are unsure about.
