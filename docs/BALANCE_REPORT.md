# Balance report: Port Hesperia

Findings from the simulated playthroughs (work package F-05). Nothing in the game was changed to
improve these numbers; this document only measures. Regenerate the tables after any content or
rule change.

## How to reproduce

```
npm run sim                    # same as: bun scripts/sim.ts  (5 bots x 14 builds x 3 seeds, about 8 seconds)
bun scripts/sim.ts --seeds 10  # 700 runs, about 25 seconds
bun scripts/sim.ts --json runs.json --chapter port-hesperia-2006
```

Five bots play the chapter through the real `useGame` store, so every plan is validated by the real
economy and capacity rules:

| Bot          | Habit                                                                                                                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| careful      | Mission tasks first (delegated by skill), answers every email with the best-looking option, attends invitations, rests when tired, stays within budget. Does not read the press.                         |
| press-reader | Careful, and always reads the press review, clips the signal item for Capital and travels to every location lead.                                                                                        |
| socialiser   | One outing a block, talks to everyone in the room, wanders into town, takes trait options 90% of the time, sometimes delegates or declines invitations, random choices, rescues the mission from Day 11. |
| reckless     | Delegates to any staff member (skills ignored), raids reserves, requests the supplement, drinks at the expensive venues, always picks the riskiest option.                                               |
| ignorer      | Never opens mail, skips the press, ignores episodes and invitations, only does mission tasks.                                                                                                            |

Builds: one per trait (the trait plus the cheapest valid flaw: every flaw refunds one point and gates five choices, so
the tie breaks alphabetically and "Brussels Brain" is the flaw in six builds, which adds its
moments to those builds), plus three mixed builds. All are checked with `pointsLeft` and the
builder's rules. Seeds 1 to N vary the bot's decisions and the game seed; seed 1 uses the shipped
game seed (23), so it is the game a player actually gets.

Definitions used below:

- Trait moment: a trait-tagged choice that was taken and resolved (the store's `trait:` flag).
- Idle block: no mail that could be answered, no episode, no invitation and no lead at the player's
  location was waiting at the start of the block. Optional activities (work, coffee, conversation,
  rest) are always available and do not count as something to decide.
- Scheduling conflict: two or more time-bound things in one block among: invitation due, daily
  episode, mission-confirming mail, a lead on its last day. The second table also counts ordinary
  mail arriving in the block.
- "Competent" bots: careful, socialiser and press-reader. The other two lose or idle by design.

## Headline

- The game is easy to win and hard to lose by accident. Careful and press-reader end "promoted"
  in 100% of runs; socialiser ends "ambassador" 81% of the time. Only neglect or recklessness
  loses (reckless: "replaced" by Day 2 to 8; ignorer: "replaced" on Day 8 in 93%).
- The trait build barely changes the outcome. Per-build endings are almost identical because the
  bot's habit decides the ending.
- The whole mission is done on Day 1 by a careful player (four tasks for ƒ900), so nothing about
  the visit builds tension.
- About two thirds of the blocks have nothing waiting for the player: 37 of 56 for a careful
  bot. Days 7, 10 and 14 are almost always completely empty.
- Scheduling conflicts occur on 2 to 3 of 14 days (target 12 of 15).
- Trait moments are rare for anyone who is not chatting all day: a careful bot sees 0 to 2 per
  run (target 10).

## Tables

Output of `npm run sim`:

```
Simulated playthroughs: chapter port-hesperia-2006, 210 runs (5 bots x 14 builds x 3 seeds)

== Endings per bot ==

bot           runs  png   replaced  cancelled  retired  ambassador   promoted
------------  ----  ---  ---------  ---------  -------  ----------  ---------
careful         42    .          .          .        .           .  42 (100%)
socialiser      42    .          .     1 (2%)   1 (2%)    34 (81%)    6 (14%)
reckless        42    .  42 (100%)          .        .           .          .
ignorer         42    .   39 (93%)          .        .      3 (7%)          .
press-reader    42    .          .          .        .           .  42 (100%)

== Endings per trait build (all bots) ==

build         runs  png  replaced  cancelled  retired  ambassador  promoted
------------  ----  ---  --------  ---------  -------  ----------  --------
liver           15    .   6 (40%)          .        .     3 (20%)   6 (40%)
replyall        15    .   6 (40%)          .        .     3 (20%)   6 (40%)
punctual        15    .   6 (40%)          .        .     3 (20%)   6 (40%)
brussels        15    .   6 (40%)          .        .      1 (7%)   8 (53%)
demarche        15    .   6 (40%)          .        .     3 (20%)   6 (40%)
namedrop        15    .   6 (40%)          .        .     2 (13%)   7 (47%)
cuisine         15    .   6 (40%)          .        .     3 (20%)   6 (40%)
novelist        15    .   3 (20%)          .        .     6 (40%)   6 (40%)
sideevents      15    .   6 (40%)          .        .     2 (13%)   7 (47%)
eyesopen        15    .   6 (40%)          .        .     3 (20%)   6 (40%)
ngo             15    .   6 (40%)          .        .     2 (13%)   7 (47%)
mixed-social    15    .   6 (40%)          .        .     3 (20%)   6 (40%)
mixed-staff     15    .   6 (40%)          .   1 (7%)     2 (13%)   6 (40%)
mixed-formal    15    .   6 (40%)     1 (7%)        .      1 (7%)   7 (47%)

Most lopsided builds: brussels promoted 53%, namedrop promoted 47%, sideevents promoted 47%, ngo promoted 47%, mixed-formal promoted 47%

== Endings per trait build (careful, socialiser and press-reader only) ==

build         runs  png  replaced  cancelled  retired  ambassador  promoted
------------  ----  ---  --------  ---------  -------  ----------  --------
liver            9    .         .          .        .     3 (33%)   6 (67%)
replyall         9    .         .          .        .     3 (33%)   6 (67%)
punctual         9    .         .          .        .     3 (33%)   6 (67%)
brussels         9    .         .          .        .     1 (11%)   8 (89%)
demarche         9    .         .          .        .     3 (33%)   6 (67%)
namedrop         9    .         .          .        .     2 (22%)   7 (78%)
cuisine          9    .         .          .        .     3 (33%)   6 (67%)
novelist         9    .         .          .        .     3 (33%)   6 (67%)
sideevents       9    .         .          .        .     2 (22%)   7 (78%)
eyesopen         9    .         .          .        .     3 (33%)   6 (67%)
ngo              9    .         .          .        .     2 (22%)   7 (78%)
mixed-social     9    .         .          .        .     3 (33%)   6 (67%)
mixed-staff      9    .         .          .  1 (11%)     2 (22%)   6 (67%)
mixed-formal     9    .         .    1 (11%)        .     1 (11%)   7 (78%)

== Day reached (15 = played to the end) ==

bot           mean  min  max
------------  ----  ---  ---
careful         15   15   15
socialiser    14.9   10   15
reckless       4.1    2    8
ignorer        8.5    8   15
press-reader    15   15   15
all           11.5    2   15

== Trait moments per run (trait-tagged choices taken), by build and bot ==

build          all  careful  socialiser  reckless  ignorer  press-reader
------------  ----  -------  ----------  --------  -------  ------------
liver          3.5        2          14       0.3        0           1.3
replyall       2.4      1.7         8.3       0.3        0           1.7
punctual       4.4      0.3        21.3         0        0           0.3
brussels       1.6      0.7         7.3         0        0             0
demarche       1.7        0         8.3         0        0             0
namedrop       4.4        2          18       0.3        0           1.7
cuisine        2.1      0.3          10         0        0             0
novelist       1.6        0           8         0        0             0
sideevents     1.1        0         5.7         0        0             0
eyesopen       6.7      1.3          32         0        0           0.3
ngo            3.7      0.7          18         0        0             0
mixed-social   4.9      2.3        19.3       0.7        0           2.3
mixed-staff   10.7        2        49.3       0.7        0           1.7
mixed-formal   6.3      0.7          31         0        0             0

== Trait coverage (runs of builds that include the trait) ==

trait       gated choices  ever offered  ever taken  offered/run  taken/run
----------  -------------  ------------  ----------  -----------  ---------
brussels                5             5           5          2.4        1.7
cuisine                 5             5           5          1.7        1.5
demarche                5             5           5          2.2        1.5
eyesopen                5             5           5          4.1        2.9
liver                   7             7           7          2.7        1.9
namedrop                7             7           7          3.3        2.3
ngo                     5             5           5            3        2.1
novelist                5             5           5          2.6        2.2
punctual                5             5           5          3.7        1.9
replyall                7             7           7          4.2        2.7
sideevents              5             5           5          1.2        0.9

== Content never reached ==

Authored: 33 story events, 49 dialogue topics, 14 emails, 7 invitations, 34 clippings, 355 choices.
Story events never seen: none
Dialogue topics never seen: none
Emails never seen: none
Invitations never seen: none
Press clippings never seen (7):
  press:fuel-bought
  press:consequence-sideevents
  press:consequence-accident
  press:consequence-double
  press:consequence-seating
  press:consequence-cold
  press:consequence-ruth
Choices never offered: none
Choices never taken (offered or not) (1):
  choice:event:fuel-quay:buy
Only counting the shipped game seed: 0 events, 0 topics, 2 choices never seen.

== Blocks with nothing to decide per run (no mail, episode, invitation or lead waiting) ==

bot           mean  min  max
------------  ----  ---  ---
careful       37.5   36   38
socialiser    36.4   22   39
reckless       5.3    1   18
ignorer          1    1    1
press-reader  37.8   36   39
all           23.6    1   39

Days on which nothing at all was waiting (all four blocks idle), per run:
bot           mean  min  max
------------  ----  ---  ---
careful        3.7    3    4
socialiser     3.5    2    5
reckless       0.3    0    2
ignorer          0    0    0
press-reader   3.6    3    4
all            2.2    0    5

Idle blocks (of 4) by day, careful / socialiser / press-reader runs:
day   1    2    3    4    5    6    7    8    9   10   11  12  13  14
----  -  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  --  --  --
idle  1  1.5  1.2  1.4  3.5  1.9  3.9  3.0  3.3  3.8  3.0   3   3   4

Blocks in which the bot itself queued nothing:
bot           mean  min  max
------------  ----  ---  ---
careful       36.0   33   38
socialiser       0    0    0
reckless       0.3    0    3
ignorer       26.9   25   52
press-reader  31.9   29   34
all           19.0    0   52

== Days with a scheduling conflict per run (two or more time-bound things in one block) ==

bot           mean  min  max
------------  ----  ---  ---
careful        2.7    2    3
socialiser     2.7    2    4
reckless       1.0    0    3
ignorer        2.7    2    3
press-reader   2.7    2    3
all            2.3    0    4

Same, but ordinary mail arriving in the block also counts as time-bound:
bot           mean  min  max
------------  ----  ---  ---
careful          5    5    5
socialiser     5.0    5    6
reckless       3.4    2    5
ignorer          5    5    5
press-reader     5    5    5
all            4.7    2    6

== Lowest funds seen per run (ƒ; ring-fenced visit reserves are part of funds) ==

bot           mean   min   max
------------  ----  ----  ----
careful       6229  5950  6700
socialiser    5481  5100  6950
reckless      5416  3640  6770
ignorer       9071  8700  9100
press-reader  6095  5650  6750
all           6459  3640  9100

Lowest funds above the ring-fenced reserves:
bot           mean   min   max
------------  ----  ----  ----
careful        729   450  1200
socialiser     -19  -400  1450
reckless       370    10  1270
ignorer       3571  3200  3600
press-reader   595   150  1250
all           1049  -400  3600

== Mission ==

Careful bot confirmed all mission tasks in 100% of runs.
Runs that ended with the mission unfinished: 24 of 210; of those, reached the final day unfinished: 1.
  socialiser/mixed-formal/seed3: 3/4 tasks

== Refusals and stalls ==

advance() refused a plan 0 times.
Work that stalled per run: careful 0, socialiser 0, reckless 10.3, ignorer 0, press-reader 0
Most common refusals the bots hit:
  206 x Insufficient discretionary funds; visit costs remain ring-fenced.
  131 x You have only 3 DP this block.
  110 x sola has only 2 DP this block.
  95 x Colleagues are off duty; dinner is social, not an extra work shift.
  91 x You have only 4 DP this block.
  74 x You have only 0 DP this block.
  60 x That commitment is already in your diary.
  59 x eu has only 2 DP this block.

```

## Most important problems, with suggested fixes

1. **The story content dries up after Day 5.** A competent bot finds nothing waiting in 37 of 56
   blocks (target 0), and 3 to 4 whole days (all four blocks) are empty, usually 7, 10 and 14.
   Daily episodes (1 to 3 a day) run out because nearly all episodes unlock by Day 4; only
   14 emails exist and none arrives after Day 10; there are 7 invitations, 5 of them after Day 4.
   Fix: spread `minDay` across the chapter (a second wave on Days 6 to 12), write mail for Days
   11 to 14 (the minister's preparations), and fill empty days from the anecdote inbox (P-02).
   Re-run `npm run sim` and watch the "idle blocks by day" row until no day is above 1.

2. **Almost no scheduling conflicts.** 2.7 days per run have a strict conflict (invitation,
   episode, mission mail or expiring lead sharing a block), 5 days if ordinary mail counts. The
   target is 12 of 15. Only one lead (the fuel quay) has an expiry at all, and invitations are
   announced days ahead with a single block each. Fix: schedule invitations in the same block as
   a daily episode or a mission mail on purpose, give more leads an `expiresDay`, announce some
   invitations with short notice (the "twenty minutes" joke is only used by one episode), and let
   `dailyEvents` favour episodes whose block collides with an invitation.

3. **The mission is trivial and finished on Day 1.** A careful bot delegates all four tasks in the
   first two blocks for ƒ900 (lounge 500, security 400). The four mission mails (Days 4, 6, 8, 10)
   then add nothing, and the finale has no tension: the only way to see "Ministerial Visit
   Cancelled" is to ignore the mission entirely or to spend the discretionary money first (see 6).
   Fix: make tasks unlock over time (a clearance cannot be asked for before the programme is
   fixed), let mail change the requirement (a new security level), or let a confirmed task lapse
   unless it is renewed after a block of trouble.

4. **Traits rarely decide anything.** Per build, the ending distribution is nearly identical,
   and for a careful bot the final confidence varies by about 10 points between builds. Goodwill reaches
   100 in every careful and press-reader run (a ceiling effect that makes the "promoted" test of
   goodwill 50 meaningless), and "Persona Non Grata" (goodwill 0) never occurred in 700 runs.
   Fix: raise the cost of the standard good moves, cap or diminish repeated goodwill gains,
   require morale or sanity for "promoted", and let stat effects (deniability, charm, stamina)
   change which endings are reachable, not just a few points.

5. **Trait moments are rare outside the staff conversations.** Of 61 trait-gated choices, 55 sit
   in staff dialogue, 3 in daily episodes and 3 in mail. Only the socialiser (who talks to staff
   all day) gets near 10 moments per run (5.7 to 49 by build); a careful bot gets about 1 (0 to 3 depending on trait),
   press-reader about 1. Rarest: Cannot Say No to Side Events (1.1 per run over all bots), Brussels
   Brain (1.6), Compulsive Démarche (1.7), Secret Novelist (1.6) and Allergic to Local Cuisine (2.1).
   Eight of the eleven traits have no option in any daily episode or email.
   Fix: add a trait option to at least one episode, email and invitation per trait, and surface
   trait-gated conversation topics (a visible "you have something to say" hint on the person).

6. **Money pressure appears only for spenders, and the mission is not protected from it.** The
   mission costs come from the same discretionary pool as hospitality. One socialiser run
   (mixed-formal, seed 3) spent its pool on dinners, could not afford the ƒ400 security
   arrangement, reached the last day with 3 of 4 tasks and ended "Ministerial Visit Cancelled".
   The end-of-chapter fuel and reserve charges also take funds below the ring-fenced reserves
   in the socialiser's runs (lowest funds above reserves: ƒ-400). Careful bots never go below
   ƒ450 above reserves. Fix: ring-fence mission task costs, or show the player the remaining
   mission cost next to the budget; make hospitality prices matter earlier for careful play.

7. **Delegation cannot be done without displacing routine duties.** Every delegated task needs
   the "displace baseline duties" box (see Bugs found), so each carries a morale and confidence
   penalty: 11 displacements per careful run. This removes the choice the box appears to offer.
   Fix: give staff 3 DP, lower baselines, or only count displacement when a second assignment
   overlaps.

8. **Failure is reached by two routes only, and it is quick.** Reckless ends "replaced" by Day 2
   to 8 (mean Day 4.1) and the ignorer on Day 8, long before most episodes unlock, so a player
   who fails sees little of the chapter. Only 5 of 6 endings occur at all in 210 runs
   ("png" never; "cancelled" and "retired" once each). Fix: soften the first week (a warning
   from Capital before confidence hits 0), and add failure paths that are slow and funny:
   an unlucky streak that leaves a recoverable debt, not a cliff.

9. **The last day is never played.** The posting ends when Day 15 begins (`day >= lastDay()` is
   checked as Day 14 closes), so there are 14 playable days and 56 blocks, not 15. Check that the
   "Minister in N days" countdown and the briefing text agree. Fix: either play Day 15 or set the
   chapter to 14 days.

10. **Dead-content candidates are few, and mostly need an unusual path.** In 700 runs every story
    event, dialogue topic, email and invitation was reached, and every authored choice was
    offered. Never reached: the press clippings `fuel-bought` (needs the fuel quay "Buy fuel
    early" choice, which the bots rank below "ask for the timetable"), `consequence-double`,
    `consequence-seating` (needs a missed seating complaint), `consequence-cold` (goodwill below
    25 on a press morning) and `consequence-ruth` (Ruth's trust below 30). All five fire only after
    a deliberately poor path, so they are untested by competent bots. With only 3 seeds the
    simulation also missed `asteria-coffee-delegated-followup` until the socialiser was given a
    habit of delegating invitations: that follow-up is only reachable by delegating one particular
    invitation, a narrow path worth a hint in the calendar.

## Bugs found

No crash, no choice that fails to queue and no plan that stalls `advance()` (0 stalls in 700
runs, 0 in the test matrix). One rule trap:

- **Delegated mission work can never validate without displacement.**
  Reproduction: `useGame.getState().start(...)`, then at any block 0 to 2 queue
  `{ id: "work-pavel", kind: "work", worker: "pavel", task: "lounge", ..., timeCost: 0, overload: false }`
  for any office colleague. `validatePlan` returns "pavel's baseline duties conflict. Explicitly
  authorise displacement of their routine duties." for every colleague and every block (every
  office colleague has a baseline of 1 or 2 DP in blocks 0 to 2 and an assignment takes 2 of the
  colleague's 2 DP). A first-time player who does not tick "Displace baseline duties (fatigue &
  backlog)" cannot delegate at all, and a player who does pays morale and confidence each time.
  It may be intended; if so the box is not a choice and should say so.

## What the bots cannot do

- They read the authored numbers behind an option to judge "best" and "risky"; a person reads the
  label. The bots add noise to the ranking, but they are better informed than a player.
- They never open the diary to plan ahead: invitations are answered in the block they are due, and
  nothing is queued for later blocks.
- They do not read the dialogue text or hints, travel for conversations except the socialiser's
  occasional trips, play golf (two-block commitment), use the express and driver services, or
  repeat yesterday's plan.
- Careful and press-reader have no real appetite for risk or fun: their idle blocks are partly
  their own restraint. The "idle block" count is therefore taken from what the game put in front of
  the player, not from what the bot did.
- Seeds only vary the daily episode order, the press selection and the Reply-All accident; the shipped
  game always uses seed 23.
