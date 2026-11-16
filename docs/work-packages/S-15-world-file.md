# S-15 The world file: task brief

Follow the workflow in `docs/work-packages/README.md`. Read AGENTS.md, GAME_DESIGN.md, docs/WRITING_GUIDE.md and docs/MASTER_PLAN.md section S-15 first.

Then read:

- `src/game/chapters/port-hesperia-2006/press.json`: 5 outlets, 63 clippings, and a `scenario` map of day to clipping ids (the "fuel quay" story on Days 2, 4, 5, 7, 8, 9, 11, 13).
- `src/game/press.ts`: how the morning review is selected, clipping triggers, the `signal` flag.
- `campaign.json`: characters, locations, venues, story events, gossip.
- `demarches.json`, `chapter.json` (mission steps, setbacks, route expiry), `invitations.json`.
- `src/game/agenda.ts`: fixed items by day.

## Why

The press review needs a believable world behind it. Today the fuel quay story is the only thread, and the other clippings are unconnected jokes. The host country has no politics, no calendar and no public mood, so nothing outside the embassy ever changes how a day plays.

## Part 1: the world file

Add `world.json` to the chapter pack, with a schema, a type and a loader. It describes Ombrazia during the 15 days of the chapter:

- **The state:** head of government, the governing coalition and the opposition, the ministries that matter to an embassy, and who holds each. People who are already characters keep their ids. New public figures are names and roles only.
- **The public mood:** three or four national obsessions that run through the chapter.
- **Neighbours and partners:** two or three fictional countries with one line each on how Ombrazia stands with them.
- **Threads:** 5 or 6 background stories. Each has an id, a title, a one-line summary, and a list of beats. A beat has a day, a public headline, and optional effects (see Part 3).
- **The public calendar:** fixed public events by day: a match, a holiday, a parade, a parliamentary vote, a strike day.

Write it for Ombrazia in the house style. Required threads:

1. **The fuel quay.** The existing scenario, moved into the world file as a thread. Its clippings and behaviour must not change.
2. **The reshuffle.** A cabinet reshuffle rumour that grows over the chapter and resolves around Day 9 to 11. It already exists as gossip and as a route expiry for Minister Bako. Make this thread the single source for it.
3. **The cup run.** The national football team keeps winning. Match days empty the ministries.
4. **The weather.** A drought or a rainy season, with consequences for the reception, the generator and the price of things.
5. **A public argument about something small:** a statue, a road name, the national dish. It divides the cabinet more than the budget does.
6. Optional sixth: a neighbour's election, watched closely.

Threads must cross. Give at least four beats where one thread changes another: the cup final is moved because of the fuel shortage; the reshuffle is postponed until after the match; the statue is unveiled in the rain.

## Part 2: every clipping belongs to a thread

- Add `thread` to every clipping. A clipping with no thread fails the content check, except the horoscope.
- Rework the existing filler clippings so each one is a small moment of a thread. Keep the jokes where they fit. Rewrite where they do not.
- Write new clippings so that every thread has an item on at least 6 different days.
- The morning review picks from that day's beats first: the fuel quay scenario clipping where one exists, then one item from each of two other threads, then consequence clippings as today.
- A returning reader should be able to follow each thread from the press alone. Add a "Stories so far" list to the press review: one line per thread with its latest headline, collapsed by default.

## Part 3: the world changes the day

A beat may carry effects. Keep them few and visible. Use existing systems only.

- **Closed offices.** On a match afternoon or a holiday, the ministry is closed for that block: no in-person mission step or démarche there, with a clear message and an entry in the agenda. The content checker verifies that no mission step or démarche becomes impossible: every affected item must still have a day on which it can be done.
- **Prices.** A beat can change a venue price or a step cost for a few days, shown where the price is shown.
- **Access.** The reshuffle changes who holds a portfolio. A character can lose the power to grant a route, or a new name can replace them for one démarche. The existing route expiry for Bako must come from this thread.
- **Mood.** A national win or loss shifts the trust gained from host officials for one day, with the reason shown in the result line.
- **Small talk.** Add at least 20 one-line remarks to conversations and greetings, each tied to a thread beat and shown only on days when that beat is current.
- At least three threads must change something in play beyond the press review.

## Part 4: a template for later chapters

Add `docs/WORLD_FILE_TEMPLATE.md`: what a world file contains, how threads should cross, how many beats, and a checklist. Every later chapter design starts from it.

## Part 5: checker, simulation, tests

- **Content checker:** thread ids exist; beats are inside the chapter's days; every clipping has a thread; every thread has clippings on at least 6 days; closures leave every mission step and démarche possible; calendar days are valid.
- **Simulation:** report closures hit per run, how often a bot found the ministry closed, and price changes paid. Thresholds: mission completion for careful bots does not fall by more than 5 points; no bot is ever locked out.
- **Tests:** review selection with threads; closures; price changes; the reshuffle changing access; small talk appearing only on its days.

## Deliverables

A summary with: the world file's threads and beats as a day-by-day table; the crossing points; the list of effects on play; five example mornings of press; simulation numbers before and after; anything you could not do.
