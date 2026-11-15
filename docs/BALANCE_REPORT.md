# Balance report: Port Hesperia

B-02 measurement: 210 runs, five bots, 14 builds and three seeds, through the real store. Reproduce with `npm run sim`; the test suite also checks the full matrix. Before B-02, the careful bot was promoted in 100% of runs. It is now promoted in 33/42 (79%); the other nine receive the ambassador ending. All 42 complete the mission. There were no observed route lock-outs. Before B-02 there were no route kinds to count.

The six gated steps are Protocol's stamp, provisional lounge reservation, guest list, host agreement, route reconnaissance and motorcade. Their official routes cost 3 DP, no money, and one to three days; the clearance stamp takes three days and the reopened security reconnaissance takes two. Every step has its own official fallback. A favour or trust route costs 1 DP, often an owed favour; EU routes cost 1 DP, a day and a debt to Celeste. Marcel's routes cost 1 DP, ƒ200–300, 2 host goodwill and a debt to Marcel, and yield adequate quality. Knowledge routes cost 1 DP and require the relevant fact. Ndao's routes accept either trust 55 or an owed favour. Four completed adequate tasks would cost up to 8 HQ goodwill at arrival (2 each). Ending thresholds are unchanged.

Mira's clean-port statement lowers Bako's trust and closes his favour route. Reading the reshuffle story also closes it. Calls on owed favours arrive two days later; honouring one uses time and refusing costs trust and sets a flag. A setback cancels a pending delivery or reopens a completed step; its non-official route is spent. The official route remains available.

Facts: `port-control` is taught by the Day 8 press item or Lucien's port background dialogue; `reshuffle-rumour` by the Day 9 item; `bako-objection` by Lucien's background briefing or dialogue, or Bako's conversation; `collection-point` by Mira's route conversation. Optional content provides shortcuts, not an exclusive mission path. Favours are granted by eight existing campaign choices (the two EU clean-port contributions, three Mira follow-ups, both seating compromises and Mira's fuel coordination) and two dialogue choices (Bianca's joint plan and carrying Bako's bag).

Tuning: official paperwork was raised from 1 to 3 DP, and the security recovery delays set to two days for reconnaissance and one for the escort. The checker verifies recovery through these official routes. Across competent bots, official routes account for 517/885 route starts (58.4%); each of the five route kinds is used. The simulation includes early losses: reckless bots used money routes but did not finish a task, so the report contains no completed adequate task. A separate store test exercises the adequate arrival penalty. Route lock-outs count blocks with an otherwise open gated step and no available route, excluding an in-flight delivery; they do not prove that a player who waits until the deadline can finish.

The quality, favour and route totals below count all runs, including early endings and repeated attempts after setbacks. The old B-01 test helpers were updated to select routes and to account for delivery and protected shortcut costs; legacy tests retain coverage for chapters without routes. Browser verification used a 400-pixel viewport. This measurement used Bun 1.4.4 for the `scripts/sim.ts` entry point.

## Simulation output

```text
Simulated playthroughs: chapter port-hesperia-2006, 210 runs (5 bots x 14 builds x 3 seeds)

== Endings per bot ==

bot           runs  png   replaced  cancelled  retired  ambassador   promoted
------------  ----  ---  ---------  ---------  -------  ----------  ---------
careful         42    .          .          .        .     9 (21%)   33 (79%)
socialiser      42    .    7 (17%)   12 (29%)   2 (5%)    20 (48%)     1 (2%)
reckless        42    .  42 (100%)          .        .           .          .
ignorer         42    .  42 (100%)          .        .           .          .
press-reader    42    .          .          .        .           .  42 (100%)

== Mission routes and quality ==

bot           official  favour  money   eu  knowledge  favours owed  good tasks  adequate tasks  route changes
------------  --------  ------  -----  ---  ---------  ------------  ----------  --------------  -------------
careful            336       0      0    0          0             0         168               0              0
socialiser          55      48      0  110          0             4         132               0              2
reckless             0       0     42    0          0             4           0               0              0
ignorer              0       0      0    0          0             0           0               0              0
press-reader       126       0      0  162         48             0         168               0             42

Route lock-outs: 0
task       good  adequate
---------  ----  --------
clearance   121         0
lounge      121         0
programme   120         0
security    106         0

== Endings per trait build (all bots) ==

build         runs  png  replaced  cancelled  retired  ambassador  promoted
------------  ----  ---  --------  ---------  -------  ----------  --------
liver           15    .   6 (40%)    2 (13%)        .     4 (27%)   3 (20%)
replyall        15    .   7 (47%)     1 (7%)        .     2 (13%)   5 (33%)
punctual        15    .   7 (47%)     1 (7%)        .      1 (7%)   6 (40%)
brussels        15    .   6 (40%)          .        .     3 (20%)   6 (40%)
demarche        15    .   8 (53%)          .        .      1 (7%)   6 (40%)
namedrop        15    .   6 (40%)     1 (7%)        .     2 (13%)   6 (40%)
cuisine         15    .   6 (40%)          .        .     3 (20%)   6 (40%)
novelist        15    .   6 (40%)     1 (7%)        .      1 (7%)   7 (47%)
sideevents      15    .   7 (47%)    2 (13%)        .     3 (20%)   3 (20%)
eyesopen        15    .   8 (53%)          .        .      1 (7%)   6 (40%)
ngo             15    .   6 (40%)    2 (13%)        .      1 (7%)   6 (40%)
mixed-social    15    .   6 (40%)    2 (13%)        .     3 (20%)   4 (27%)
mixed-staff     15    .   6 (40%)          .  2 (13%)      1 (7%)   6 (40%)
mixed-formal    15    .   6 (40%)          .        .     3 (20%)   6 (40%)

Most lopsided builds: demarche replaced 53%, eyesopen replaced 53%, replyall replaced 47%, punctual replaced 47%, novelist promoted 47%

== Endings per trait build (careful, socialiser and press-reader only) ==

build         runs  png  replaced  cancelled  retired  ambassador  promoted
------------  ----  ---  --------  ---------  -------  ----------  --------
liver            9    .         .    2 (22%)        .     4 (44%)   3 (33%)
replyall         9    .   1 (11%)    1 (11%)        .     2 (22%)   5 (56%)
punctual         9    .   1 (11%)    1 (11%)        .     1 (11%)   6 (67%)
brussels         9    .         .          .        .     3 (33%)   6 (67%)
demarche         9    .   2 (22%)          .        .     1 (11%)   6 (67%)
namedrop         9    .         .    1 (11%)        .     2 (22%)   6 (67%)
cuisine          9    .         .          .        .     3 (33%)   6 (67%)
novelist         9    .         .    1 (11%)        .     1 (11%)   7 (78%)
sideevents       9    .   1 (11%)    2 (22%)        .     3 (33%)   3 (33%)
eyesopen         9    .   2 (22%)          .        .     1 (11%)   6 (67%)
ngo              9    .         .    2 (22%)        .     1 (11%)   6 (67%)
mixed-social     9    .         .    2 (22%)        .     3 (33%)   4 (44%)
mixed-staff      9    .         .          .  2 (22%)     1 (11%)   6 (67%)
mixed-formal     9    .         .          .        .     3 (33%)   6 (67%)

== Day reached (15 = played to the end) ==

bot           mean  min  max
------------  ----  ---  ---
careful         15   15   15
socialiser    14.2    8   15
reckless       5.3    3    8
ignorer        7.6    6    9
press-reader    15   15   15
all           11.4    3   15

== Trait moments per run (trait-tagged choices taken), by build and bot ==

build          all  careful  socialiser  reckless  ignorer  press-reader
------------  ----  -------  ----------  --------  -------  ------------
liver          3.9        3        13.7       0.3        0           2.7
replyall       3.1      2.7        10.7       0.7        0           1.7
punctual       4.3      1.7          18         0        0           1.7
brussels       2.4      1.3         8.7         0        0             2
demarche       2.1        2           7         0        0           1.3
namedrop       4.7        2        19.3       0.3        0             2
cuisine        2.2      1.3         8.7         0        0             1
novelist       2.3        1        10.3         0        0           0.3
sideevents     1.5      1.3         5.7         0        0           0.7
eyesopen       6.3      3.3        26.7         0        0           1.7
ngo            3.7      2.7        14.3         0        0           1.7
mixed-social   4.4      3.3        14.7       0.3        0           3.7
mixed-staff   10.7      6.7        42.3       0.7        0             4
mixed-formal     7      3.3          29         0        0           2.7

== Trait coverage (runs of builds that include the trait) ==

trait       gated choices  ever offered  ever taken  offered/run  taken/run
----------  -------------  ------------  ----------  -----------  ---------
brussels                5             5           5          3.0        2.2
cuisine                 5             5           5          2.0        1.5
demarche                5             5           5          3.6        2.1
eyesopen                5             5           5          3.6        2.6
liver                   7             7           7          3.0        1.9
namedrop                7             7           7          3.8          2
ngo                     5             5           5          3.2        2.2
novelist                5             5           5          2.7          2
punctual                5             5           5          3.5        1.4
replyall                7             7           7          4.7        2.7
sideevents              5             5           5          1.7        1.2

== Content never reached ==

Authored: 38 story events, 50 dialogue topics, 28 emails, 7 invitations, 35 clippings, 409 choices.
Story events never seen (1):
  event:call-in-golf
Dialogue topics never seen: none
Emails never seen: none
Invitations never seen: none
Press clippings never seen (6):
  press:fuel-bought
  press:consequence-double
  press:consequence-seating
  press:consequence-cold
  press:consequence-ruth
  press:expedited-stamp-report
Choices never offered (2):
  choice:event:call-in-golf:honour
  choice:event:call-in-golf:refuse
Choices never taken (offered or not) (9):
  choice:event:fuel-quay:buy
  choice:event:call-in-golf:honour
  choice:event:call-in-golf:refuse
  choice:event:call-in-fixer:honour
  choice:email:visit-amendments:reply
  choice:email:visit-amendments:delegate
  choice:email:visit-security:delegate
  choice:email:visit-programme:delegate
  choice:email:visit-stamp:delegate
Only counting the shipped game seed: 1 events, 0 topics, 2 choices never seen.

== Blocks with nothing to decide per run (no mail, episode, invitation, lead or mission step waiting) ==

bot           mean  min  max
------------  ----  ---  ---
careful       12.2   11   13
socialiser     1.2    0    4
reckless       3.3    0   13
ignorer          0    0    0
press-reader  14.6   14   15
all            6.3    0   15

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
day     1  2    3    4    5    6  7  8  9  10  11  12   13   14   15
----  ---  -  ---  ---  ---  ---  -  -  -  --  --  --  ---  ---  ---
idle  0.7  0  0.8  0.8  2.0  1.3  2  0  0   0   0   0  0.1  0.8  1.0

Blocks with no mail, episode, invitation or lead waiting (mission steps not counted):
bot           mean  min  max
------------  ----  ---  ---
careful         31   30   32
socialiser    28.6   14   33
reckless       5.8    2   13
ignorer          1    1    1
press-reader  32.0   30   33
all           19.7    1   33

Same, by day, careful / socialiser / press-reader runs:
day   1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
----  -  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---
idle  1  1.4  1.2  1.3  2.9  1.9  3.8  2.8  3.0  2.9  2.1  1.9  2.0  2.0  1.0

Blocks in which the bot itself queued nothing:
bot           mean  min  max
------------  ----  ---  ---
careful       22.3   16   28
socialiser       0    0    0
reckless       0.1    0    2
ignorer       25.3   19   31
press-reader  18.7   13   23
all           13.3    0   31

== Days with a scheduling conflict per run (two or more time-bound things in one block) ==

bot           mean  min  max
------------  ----  ---  ---
careful        5.0    4    6
socialiser     4.9    2    6
reckless       1.7    1    3
ignorer        2.3    1    3
press-reader   5.6    4    6
all            3.9    1    6

Same, but ordinary mail arriving in the block also counts as time-bound:
bot           mean  min  max
------------  ----  ---  ---
careful        7.3    7    8
socialiser     9.1    4   11
reckless       3.1    3    4
ignorer        3.7    3    5
press-reader  10.0    9   10
all            6.6    3   11

== Lowest funds seen per run (ƒ; the reserves are part of funds) ==

bot            mean    min    max
------------  -----  -----  -----
careful        7843   7750   8200
socialiser     6766   5780   9060
reckless       7105   4410   8880
ignorer       10000  10000  10000
press-reader   7737   7450   8300
all            7890   4410  10000

Lowest funds above the reserves (visit reserves and mission steps):
bot           mean   min   max
------------  ----  ----  ----
careful       1543  1450  1900
socialiser     632  -100  1660
reckless       516    40  1540
ignorer       2600  2600  2600
press-reader  1411  1350  1900
all           1340  -100  2600

== Mission ==

Careful bot confirmed all mission tasks in 100% of runs.
Runs that ended with the mission unfinished: 104 of 210; of those, reached the final day unfinished: 13.
Runs that left the mission unfinished after a step was refused for lack of money: 0.

Day the mission was completed (runs that completed it; the chapter has 13 steps):
bot           completed  mean day  earliest  latest  steps done
------------  ---------  --------  --------  ------  ----------
careful            100%        14        14      14          13
socialiser          52%      13.8        13      14        11.0
reckless             0%         -         -       -         4.0
ignorer              0%         -         -       -           2
press-reader       100%        14        14      14          13
all                 50%      14.0        13      14         8.6
  socialiser/liver/seed2: 3/4 tasks
  socialiser/liver/seed3: 3/4 tasks
  socialiser/replyall/seed2: 3/4 tasks
  socialiser/punctual/seed2: 3/4 tasks
  socialiser/punctual/seed3: 3/4 tasks
  socialiser/namedrop/seed3: 3/4 tasks
  socialiser/novelist/seed1: 3/4 tasks
  socialiser/sideevents/seed1: 3/4 tasks
  socialiser/sideevents/seed3: 3/4 tasks
  socialiser/ngo/seed1: 3/4 tasks
  socialiser/ngo/seed3: 3/4 tasks
  socialiser/mixed-social/seed1: 3/4 tasks
  socialiser/mixed-social/seed3: 3/4 tasks

== Refusals and stalls ==

advance() refused a plan 0 times.
Work that stalled per run: careful 0, socialiser 0, reckless 9.0, ignorer 0, press-reader 0
Most common refusals the bots hit:
  376 x You have only 3 DP this block.
  361 x You have only 0 DP this block.
  243 x You have only 4 DP this block.
  199 x Not yet: Motorcade and escort for the new arrival time (needs the route reconnaissance).
  144 x sola has only 2 DP this block.
  119 x Colleagues are off duty; dinner is social, not an extra work shift.
  96 x You cannot afford the time or money to attend.
  94 x You have only 2 DP this block.

(210 runs in 4.2s)
```
