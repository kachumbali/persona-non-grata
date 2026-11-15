# Balance report: Port Hesperia

Findings from the simulated playthroughs (work package F-05), updated after B-01 (mission
pacing). F-05 only measured; B-01 changed the game: each mission task is now a chain of steps
across the chapter, scripted setbacks reopen steps, the cash for the steps is ring-fenced and the
last day is played. The "before" numbers quoted below are the F-05 measurements (56 blocks, no
steps); the tables are regenerated. Regenerate them after any content or rule change.

## How to reproduce

```
npm run sim                    # same as: bun scripts/sim.ts  (5 bots x 14 builds x 3 seeds, about 10 seconds)
bun scripts/sim.ts --seeds 10  # 700 runs, about 25 seconds
bun scripts/sim.ts --json runs.json --chapter port-hesperia-2006
```

Five bots play the chapter through the real `useGame` store, so every plan is validated by the real
economy and capacity rules:

| Bot          | Habit                                                                                                                                                                                                                |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| careful      | Mission steps as soon as each opens (delegated by skill, by hand from Day 9), answers every email with the best-looking option, attends invitations, rests when tired, stays within budget. Does not read the press. |
| press-reader | Careful, and always reads the press review, clips the signal item for Capital and travels to every location lead.                                                                                                    |
| socialiser   | One outing a block, talks to everyone in the room, wanders into town, takes trait options 90% of the time, sometimes delegates or declines invitations, random choices, works on the mission steps only from Day 10. |
| reckless     | Delegates to any staff member (skills ignored), raids reserves, requests the supplement, drinks at the expensive venues, always picks the riskiest option.                                                           |
| ignorer      | Never opens mail, skips the press, ignores episodes and invitations, and does only the mission steps that no mail offers to confirm (the first step of three tasks).                                                 |

Builds: one per trait (the trait plus the cheapest valid flaw: every flaw refunds one point and gates five choices, so
the tie breaks alphabetically and "Brussels Brain" is the flaw in six builds, which adds its
moments to those builds), plus three mixed builds. All are checked with `pointsLeft` and the
builder's rules. Seeds 1 to N vary the bot's decisions and the game seed; seed 1 uses the shipped
game seed (23), so it is the game a player actually gets.

Definitions used below:

- Trait moment: a trait-tagged choice that was taken and resolved (the store's `trait:` flag).
- Idle block: no mail that could be answered, no episode, no invitation, no lead at the player's
  location and no mission step that can be done now was waiting at the start of the block.
  Optional activities (work, coffee, conversation, rest) are always available and do not count as
  something to decide. "Prompts only" is the F-05 definition, without the mission steps.
- Scheduling conflict: two or more time-bound things in one block among: invitation due, daily
  episode, mail that confirms a mission step, a lead on its last day. The second table also counts ordinary
  mail arriving in the block.
- "Competent" bots: careful, socialiser and press-reader. The other two lose or idle by design.

## Headline

After B-01 (F-05 numbers in brackets):

- The mission is a fifteen-day job. A careful bot works through the 13 steps as each opens and
  completes the mission on Day 13 in 100% of runs, and no bot in any of the 210 runs completes it
  before Day 13 [Day 1, for ƒ900]. Setbacks reopen 4 steps of a steady run on Days 8, 9, 11 and
  12, and the bot redoes them. The ignorer never completes it (it does only the three steps no
  mail offers) and is replaced on Day 7 to 10. No run left the mission unfinished after a step was
  refused for lack of money [one F-05 run lost the visit for that reason]: mission cash is
  ring-fenced (ƒ1,100 of the ƒ4,500 above the visit reserves).
- The game is still easy to win and hard to lose by accident. Careful and press-reader end
  "promoted" in 100% of runs, as before; socialiser ends "ambassador" 71% of the time and is now
  "replaced" in 12% of runs [0%], because the extra mission mail is more mail to answer at random
  or miss. Reckless is "replaced" in 100% of runs (mean Day 4.9 [4.1]) and the ignorer in 100%
  (mean Day 8.0 [93%, 8.5]).
- The trait build barely changes the outcome. Per-build endings are almost identical because the
  bot's habit decides the ending.
- Idle blocks drop. Counting a mission step that can be done as something waiting, a careful bot
  finds nothing waiting in 28.8 of 60 blocks [37.5 of 56]; counting only authored prompts, as
  F-05 did, 32.8 of 60 [37.5 of 56]. The new mail (five for the steps, four for the setbacks, five for
  the arrival) fills Days 5 to 15; Days 7 to 11 are still the quietest (about 3 idle blocks of 4
  by prompts only). No day is completely empty any more [3.7 empty days per run].
- Scheduling conflicts occur on 5.0 of 15 days for a careful bot [2.7 of 14] (target 12 of 15).
- Day 15 is played: a bot that survives plays all 60 blocks [56].
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
socialiser      42    .    5 (12%)          .   2 (5%)    30 (71%)    5 (12%)
reckless        42    .  42 (100%)          .        .           .          .
ignorer         42    .  42 (100%)          .        .           .          .
press-reader    42    .          .          .        .           .  42 (100%)

== Endings per trait build (all bots) ==

build         runs  png  replaced  cancelled  retired  ambassador  promoted
------------  ----  ---  --------  ---------  -------  ----------  --------
liver           15    .   6 (40%)          .        .     2 (13%)   7 (47%)
replyall        15    .   7 (47%)          .        .     2 (13%)   6 (40%)
punctual        15    .   7 (47%)          .        .      1 (7%)   7 (47%)
brussels        15    .   6 (40%)          .        .     3 (20%)   6 (40%)
demarche        15    .   7 (47%)          .        .     2 (13%)   6 (40%)
namedrop        15    .   6 (40%)          .        .     2 (13%)   7 (47%)
cuisine         15    .   6 (40%)          .        .     3 (20%)   6 (40%)
novelist        15    .   6 (40%)          .        .     3 (20%)   6 (40%)
sideevents      15    .   7 (47%)          .        .     2 (13%)   6 (40%)
eyesopen        15    .   6 (40%)          .        .     3 (20%)   6 (40%)
ngo             15    .   6 (40%)          .        .     3 (20%)   6 (40%)
mixed-social    15    .   6 (40%)          .        .     2 (13%)   7 (47%)
mixed-staff     15    .   7 (47%)          .  2 (13%)           .   6 (40%)
mixed-formal    15    .   6 (40%)          .        .     2 (13%)   7 (47%)

Most lopsided builds: liver promoted 47%, replyall replaced 47%, punctual promoted 47%, demarche replaced 47%, namedrop promoted 47%

== Endings per trait build (careful, socialiser and press-reader only) ==

build         runs  png  replaced  cancelled  retired  ambassador  promoted
------------  ----  ---  --------  ---------  -------  ----------  --------
liver            9    .         .          .        .     2 (22%)   7 (78%)
replyall         9    .   1 (11%)          .        .     2 (22%)   6 (67%)
punctual         9    .   1 (11%)          .        .     1 (11%)   7 (78%)
brussels         9    .         .          .        .     3 (33%)   6 (67%)
demarche         9    .   1 (11%)          .        .     2 (22%)   6 (67%)
namedrop         9    .         .          .        .     2 (22%)   7 (78%)
cuisine          9    .         .          .        .     3 (33%)   6 (67%)
novelist         9    .         .          .        .     3 (33%)   6 (67%)
sideevents       9    .   1 (11%)          .        .     2 (22%)   6 (67%)
eyesopen         9    .         .          .        .     3 (33%)   6 (67%)
ngo              9    .         .          .        .     3 (33%)   6 (67%)
mixed-social     9    .         .          .        .     2 (22%)   7 (78%)
mixed-staff      9    .   1 (11%)          .  2 (22%)           .   6 (67%)
mixed-formal     9    .         .          .        .     2 (22%)   7 (78%)

== Day reached (15 = played to the end) ==

bot           mean  min  max
------------  ----  ---  ---
careful         15   15   15
socialiser    14.2    8   15
reckless       4.9    3    9
ignorer          8    7   10
press-reader    15   15   15
all           11.4    3   15

== Trait moments per run (trait-tagged choices taken), by build and bot ==

build         all  careful  socialiser  reckless  ignorer  press-reader
------------  ---  -------  ----------  --------  -------  ------------
liver         3.3      1.7        13.3       0.3        0           1.3
replyall      2.4        2           8       0.7        0           1.3
punctual      3.5        1        16.3         0        0           0.3
brussels      1.5      0.7         6.7         0        0             0
demarche      1.9        0           9         0        0           0.3
namedrop      4.2      1.7        18.3       0.3        0           0.7
cuisine       2.2      0.3        10.3         0        0           0.3
novelist      2.3      0.3        11.3         0        0             0
sideevents    1.1      0.3         5.3         0        0             0
eyesopen      5.1      0.7          25         0        0             0
ngo           3.2      0.7        15.3         0        0             0
mixed-social  4.7      2.3        18.7       0.7        0             2
mixed-staff     9      2.3        40.3       0.7        0           1.7
mixed-formal  6.7        1        32.7         0        0             0

== Trait coverage (runs of builds that include the trait) ==

trait       gated choices  ever offered  ever taken  offered/run  taken/run
----------  -------------  ------------  ----------  -----------  ---------
brussels                5             5           5          2.5        1.7
cuisine                 5             5           5          2.0        1.6
demarche                5             5           5          2.8        2.0
eyesopen                5             5           5          3.1        2.1
liver                   7             7           7          2.7        1.7
namedrop                7             7           7          3.3        1.9
ngo                     5             5           5          2.9        1.9
novelist                5             5           5          2.1        1.6
punctual                5             5           5          3.0        1.6
replyall                7             7           7          4.2        2.6
sideevents              5             5           5          1.4        1.0

== Content never reached ==

Authored: 33 story events, 49 dialogue topics, 28 emails, 7 invitations, 34 clippings, 397 choices.
Story events never seen: none
Dialogue topics never seen: none
Emails never seen: none
Invitations never seen: none
Press clippings never seen (8):
  press:fuel-bought
  press:consequence-eyesopen
  press:consequence-sideevents
  press:consequence-accident
  press:consequence-double
  press:consequence-seating
  press:consequence-cold
  press:consequence-ruth
Choices never offered: none
Choices never taken (offered or not) (5):
  choice:event:fuel-quay:buy
  choice:email:visit-amendments:delegate
  choice:email:visit-security:delegate
  choice:email:visit-programme:reply
  choice:email:visit-programme:delegate
Only counting the shipped game seed: 0 events, 0 topics, 0 choices never seen.

== Blocks with nothing to decide per run (no mail, episode, invitation, lead or mission step waiting) ==

bot           mean  min  max
------------  ----  ---  ---
careful       28.8   28   31
socialiser     6.4    0    8
reckless       2.8    0   14
ignorer          0    0    0
press-reader  29.2   28   30
all           13.4    0   31

Days on which nothing at all was waiting (all four blocks idle), per run:
bot           mean  min  max
------------  ----  ---  ---
careful          0    0    0
socialiser       0    0    0
reckless         0    0    0
ignorer          0    0    0
press-reader     0    0    0
all              0    0    0

Idle blocks (of 4) by day, careful / socialiser / press-reader runs:
day     1    2    3    4    5    6  7  8    9   10   11   12  13  14   15
----  ---  ---  ---  ---  ---  ---  -  -  ---  ---  ---  ---  --  --  ---
idle  0.7  1.0  0.8  0.9  1.9  1.3  2  2  2.0  1.4  1.8  1.0   2   2  1.0

Blocks with no mail, episode, invitation or lead waiting (mission steps not counted):
bot           mean  min  max
------------  ----  ---  ---
careful       32.8   32   34
socialiser    29.1   14   33
reckless       6.2    2   17
ignorer          1    1    1
press-reader  33.2   32   34
all           20.4    1   34

Same, by day, careful / socialiser / press-reader runs:
day   1    2    3    4    5    6    7    8    9   10   11  12  13  14   15
----  -  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  --  --  --  ---
idle  1  1.5  1.1  1.4  2.9  2.0  3.8  3.0  2.9  2.9  2.9   2   2   2  1.0

Blocks in which the bot itself queued nothing:
bot           mean  min  max
------------  ----  ---  ---
careful       28.4   26   32
socialiser       0    0    0
reckless       0.0    0    1
ignorer         26   22   34
press-reader  24.9   23   27
all           15.9    0   34

== Days with a scheduling conflict per run (two or more time-bound things in one block) ==

bot           mean  min  max
------------  ----  ---  ---
careful        5.0    4    6
socialiser     4.8    2    6
reckless       1.7    1    3
ignorer        2.6    1    4
press-reader   5.0    4    6
all            3.8    1    6

Same, but ordinary mail arriving in the block also counts as time-bound:
bot           mean  min  max
------------  ----  ---  ---
careful        7.3    7    8
socialiser     7.0    4    8
reckless       3.0    3    5
ignorer          4    3    6
press-reader   7.3    7    8
all            5.7    3    8

== Lowest funds seen per run (ƒ; the reserves are part of funds) ==

bot            mean    min    max
------------  -----  -----  -----
careful        7264   7150   7600
socialiser     5960   5100   8080
reckless       7247   5170   9210
ignorer       10000  10000  10000
press-reader   7108   6850   7650
all            7516   5100  10000

Lowest funds above the reserves (visit reserves and mission steps):
bot           mean   min   max
------------  ----  ----  ----
careful       1764  1650  2100
socialiser     317  -400  1480
reckless       885     0  2610
ignorer       3400  3400  3400
press-reader  1608  1350  2150
all           1595  -400  3400

== Mission ==

Careful bot confirmed all mission tasks in 100% of runs.
Runs that ended with the mission unfinished: 90 of 210; of those, reached the final day unfinished: 0.
Runs that left the mission unfinished after a step was refused for lack of money: 0.

Day the mission was completed (runs that completed it; the chapter has 13 steps):
bot           completed  mean day  earliest  latest  steps done
------------  ---------  --------  --------  ------  ----------
careful            100%        13        13      13          13
socialiser          86%        13        13      13        11.4
reckless             0%         -         -       -         3.6
ignorer              0%         -         -       -           3
press-reader       100%        13        13      13          13
all                 57%        13        13      13         8.8

== Refusals and stalls ==

advance() refused a plan 0 times.
Work that stalled per run: careful 0, socialiser 0, reckless 11.1, ignorer 0, press-reader 0
Most common refusals the bots hit:
  176 x You have only 3 DP this block.
  124 x sola has only 2 DP this block.
  99 x Insufficient discretionary funds; visit costs remain ring-fenced.
  95 x You have only 4 DP this block.
  76 x Colleagues are off duty; dinner is social, not an extra work shift.
  70 x pavel has only 2 DP this block.
  64 x You have only 0 DP this block.
  63 x eu has only 2 DP this block.
```

## Most important problems, with suggested fixes

1. **The story content dries up after Day 5.** (Partly addressed by B-01: a careful bot now finds
   nothing waiting in 28.8 of 60 blocks counting mission steps, 32.8 by prompts only, and no day
   is completely empty. Days 7 to 11 are still thin.) A competent bot found nothing waiting in 37
   of 56 blocks (target 0), and 3 to 4 whole days (all four blocks) were empty, usually 7, 10 and 14. Daily episodes (1 to 3 a day) run out because nearly all episodes unlock by Day 4; only
   14 emails existed and none arrived after Day 10 (there are now 28, up to Day 15); there are 7 invitations, 5 of them after Day 4.
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

3. **The mission was trivial and finished on Day 1. (Fixed by B-01.)** A careful bot delegated all
   four tasks in the first two blocks for ƒ900 (lounge 500, security 400); the four mission
   mails (Days 4, 6, 8, 10) added nothing and the finale had no tension. Now each task is three
   or four steps (13 in all, earliest days 1 to 13), four setbacks reopen steps, and the
   mission completes on Day 13 for every bot that completes it. Still open: a careful bot never
   fails the mission, because it does every step the day it opens. A failure now needs
   neglect (the ignorer) or a bot that is replaced first; "Ministerial Visit Cancelled" occurred in
   0 of 210 runs [1]. Idea: make one setback hit a step that is already done late (Day 13),
   so that even careful play risks the visit.

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

6. **Money pressure appears only for spenders, and the mission was not protected from it. (Fixed
   by B-01 for the mission; the pressure itself is unchanged.)** One F-05 socialiser run spent
   its pool on dinners and could not afford the ƒ400 security arrangement. Now the cash for the
   steps still to do (ƒ1,100, including the ƒ100 a setback adds to the motorcade) is a mission
   reserve that optional spending cannot touch, and 0 of 210 runs had a step refused for lack of
   money. The end-of-chapter fuel and reserve charges still take funds below the ring-fenced
   reserves in some socialiser runs (lowest funds above the reserves: ƒ-400, as before); careful
   bots stay at least ƒ1,650 above them [ƒ450]. Fix for the rest: show the player the remaining
   hospitality budget next to the reserves; make hospitality prices matter earlier.

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

9. **The last day was never played. (Fixed by B-01.)** The posting used to end when Day 15 began, so
   there were 56 playable blocks. Day 15 is now played (60 blocks): the arrangements are closed,
   five arrival mails (Days 14 and 15) are waiting, and the ending is
   decided when the evening block resolves; a meter at zero still ends the posting at once.
   "Minister in N days" reads "arrives today" on Day 15.

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
- They do not read the dashboard's reasons: they ask the store what is open, as a person reads the
  step list. A person who ignores the dashboard and the mail can still miss a step window that the
  bots never miss, because the bots look every block.
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
