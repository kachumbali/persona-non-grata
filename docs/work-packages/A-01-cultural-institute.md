# A-01 Story arc: the cultural institute: task brief

Follow the workflow in `docs/work-packages/README.md`. Do S-15 (the world file) first if it is not done: this arc should hang on its threads and calendar.

Read AGENTS.md, GAME_DESIGN.md, docs/WRITING_GUIDE.md and docs/MASTER_PLAN.md section A-01 and "A catalogue of arcs to reuse".

Then read: `campaign.json` (characters, locations, events, gossip), `src/game/relationships.ts`, `src/game/data/npc-traits.json`, `src/game/personnel.ts` (reputations and counters), `src/game/press.ts`, `demarches.json`, `invitations.json`, `src/game/agenda.ts`.

## Why

A cultural institute answers to your government and listens to nobody. Its director has a vision. Each time the vision meets the host country, the result lands on the acting head of mission's desk. This is the first reusable story arc: built once, so that another institute with another director can appear in a later chapter.

## Part 1: an arc as data

Add a reusable format for arcs. An arc lives in its own file in the chapter pack (`arcs/cultural-institute.json`), loaded with the chapter. It contains:

- **Cast:** new characters with the usual fields, including gender, a portrait id, NPC traits and what they want.
- **A place:** a new location with a scene image placeholder and a short description.
- **Episodes:** ordered story beats. Each has an earliest day, a trigger (a day, a flag, an earlier episode's outcome, or a world-file beat), a scene with choices, and what happens if the player does nothing.
- **Arc state:** a small set of named values the episodes read and write, such as the director's confidence, the host's patience and the budget left. Keep it to three or four.
- **Endings of the arc:** three or more, each with a consequence for the chapter and a line for the debrief.

Add types, a schema, loader support and content-check rules: episodes reachable, every episode has an outcome for doing nothing, arc values stay in range, no episode blocks the mission.

## Part 2: the institute in Port Hesperia

Write the arc in the house style.

**The cast**

- **The director.** Very strange, completely sincere, never wrong in their own eyes. Give them three NPC traits, a vision in one sentence, and a habit of speech. They treat the embassy as a branch office of the institute.
- **The deputy.** Competent, exhausted, keeps the receipts, and tells the player things the director would not.
- **The artist in residence.** Was meant to stay two weeks. Has been there seven months.
- Use existing portraits from the unreserved pool, with a note on which new ones would be needed.

**The episodes: six, spread over Days 2 to 13**

1. **The courtesy call.** The director presents the season's programme. It contains one item that will plainly cause trouble. The player may ask about it, miss it, or encourage it.
2. **The exhibition.** It opens during a world-file event and offends someone the embassy needs. The host protocol director calls.
3. **The budget.** The deputy shows the player what the season's money was spent on. Capital will ask.
4. **The poetry evening.** A visiting poet reads something about the host country's national argument from the world file. A minister is in the front row.
5. **The artist will not leave.** The residence permit has expired. The artist has started a mural on the institute's outside wall.
6. **The closing event.** It falls close to the Minister's arrival. The director wants the Minister to open it.

**How each episode can be managed**

Every episode offers at least these four kinds of answer, each with different effects on host goodwill, HQ goodwill, the arc values and relationships:

- back the director;
- rein the director in;
- send it to Capital and let them decide;
- look away, and read about it in the press.

Add trait-gated and reputation-gated options where they fit, and at least two options that use a favour or a piece of gossip.

**Links to the rest of the game**

- The director asks the embassy cultural officer for help. Use an existing staff member, so the arc costs staff time under the existing rules.
- Each episode sets flags. Write at least two press clippings per episode, in the outlets' voices, tied to world-file threads.
- One démarche from Capital arrives because of the institute.
- One invitation: the exhibition opening, attend, delegate or decline.
- The arc's ending adds one line to the Minister's arrival on Day 15 and one to the debrief's promotion board.
- Counters for at least two reputations.

**Endings of the arc**

- The season is a triumph, and the director takes the credit.
- The institute is quietly put under the embassy's supervision, and the director writes to Capital about it.
- The director is recalled, and the artist is made acting director.
- Nothing is resolved, and next season's programme arrives.

## Part 3: saves, simulation, tests

- **Saves:** arc state goes into the posting state with a migration. The arc's outcome goes into the career's chapter result, so a later chapter can refer to it.
- **Simulation:** bots handle episodes by habit. Report: episodes seen per run, the spread of arc endings per bot, and the arc's effect on mission completion and ending rates. Thresholds: every arc ending is reached by some bot; no single ending occurs in more than 60% of runs; mission completion for careful bots does not fall by more than 5 points.
- **Tests:** episode triggers, doing nothing, arc values in range, each ending reachable, links to press, démarche and invitation.

## Part 4: make it reusable

Write `docs/ARC_TEMPLATE.md`: the arc format, the four kinds of answer, how an arc links to press, démarches, invitations and the debrief, and a checklist. The next arcs (school abroad, national day, zoo deal) will be written from it.

## Deliverables

A summary with: the cast with traits; the six episodes with their choices and effects as a table; the arc endings and how each is reached; the press clippings; simulation numbers; anything you could not do.
