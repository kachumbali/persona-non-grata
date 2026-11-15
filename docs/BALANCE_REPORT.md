# Balance report: Port Hesperia

S-02 measurement: 210 runs, five bots, 14 builds and three seeds, through the real store. Reproduce with `npm run sim`. The comparison below uses the same matrix from B-02 commit `2d4f9f4`. Counts of completed missions mean all four visit tasks were confirmed, not promotion.

| Bot          | Mission completions before → after | Idle blocks before → after | Conflict days before → after | Trait moments before → after | Promotions before → after |
| ------------ | ---------------------------------: | -------------------------: | ---------------------------: | ---------------------------: | ------------------------: |
| Careful      |                            42 → 42 |               12.19 → 9.21 |                  4.95 → 7.98 |                  2.55 → 3.45 |                   33 → 27 |
| Socialiser   |                            22 → 33 |                1.19 → 3.26 |                  4.86 → 8.02 |                16.36 → 15.52 |                     1 → 8 |
| Press-reader |                            42 → 42 |              14.57 → 11.24 |                  5.62 → 7.98 |                  1.93 → 3.45 |                   42 → 42 |
| Reckless     |                              0 → 0 |                3.33 → 2.74 |                  1.74 → 2.81 |                  0.17 → 0.33 |                     0 → 0 |
| Ignorer      |                              0 → 0 |                      0 → 0 |                  2.31 → 5.14 |                        0 → 0 |                     0 → 0 |

Careful idle time falls 24.4%; competent bots average at least seven conflict days; no bot loses mission completions; all reckless runs cause a protocol incident. Careful promotions fall from 79% to 64%, although all missions still finish. Careful trait moments remain below the plan's long-term target of ten. Socialiser's changed mission timing is part of its policy; a direct comparison measures the complete bot policy and content together. Conflict counting now includes a newly available mission step competing with an open démarche, when no related mission mail arrives in that block; it is therefore not an identical measure to B-02. Idle blocks count blocks without an outstanding time-bound demand, including open démarches; the prompts-only metric remains separately reported below.

The eight instructions are: Day 2 director, port officer, fuel inspection timetable; Day 4 desk, port officer, clean-port crews and collection; Day 6 director, Protocol, France and Germany's letterhead; Day 7 director, Protocol, an umbrella protest; Day 7 director, Protocol, its reversal an hour later; Day 7 desk, Protocol, a UN resolution about agenda ordering; Day 10 deputy minister, golf contact, a protest about Valdoria's protest; Day 13 deputy minister, golf contact, complete agreement with no next step.

Anselm improves the text and credits himself; Ines adds a consular angle and queue number; Bianca makes it an ultimatum; Maxim visits the wrong ministry; Sola secures a signature without explaining how; Pavel produces a receipt; Elise asks who benefits. The compulsive trait's extra notes request lanyards or minutes (helpful), or protest an old parade or a nonexistent umbrella ban (costly).

Press adds one leak for each of the eight instructions, plus an old-parade trait clipping. B-02 follow-ups cover the expedited stamp, lounge, guest list, route survey and motorcade, and the programme-background flag. Refusing Protocol, the golf contact, the fixer, Celeste or Bianca closes that contact's favour routes and changes their greeting.

Existing mission and chapter tests were updated for the posting version; simulation coverage was adjusted to exclude newly conditional clippings from legacy unconditional coverage while adding S-02 thresholds. Dedicated tests cover outcomes, deadlines, delayed delivery, migration, fax, UI, content validation and save round trips. The checker retains 11 pre-existing writing-length warnings. Browser verification exercised the board and fax at 400 px.

## Simulation output

```text
Simulated playthroughs: chapter port-hesperia-2006, 210 runs (5 bots x 14 builds x 3 seeds)

== Endings per bot ==

bot           runs     png   replaced  cancelled  retired  ambassador   promoted
------------  ----  ------  ---------  ---------  -------  ----------  ---------
careful         42       .          .          .        .    15 (36%)   27 (64%)
socialiser      42       .     1 (2%)    8 (19%)   1 (2%)    24 (57%)    8 (19%)
reckless        42  2 (5%)   40 (95%)          .        .           .          .
ignorer         42       .  42 (100%)          .        .           .          .
press-reader    42       .          .          .        .           .  42 (100%)

== Démarche deliveries and outcomes ==

bot           self  colleague   eu  note  good  adequate  failed  missed  incidents
------------  ----  ---------  ---  ----  ----  --------  ------  ------  ---------
careful         84        168    0    84   222       114       0       0          0
socialiser       0          0  287     0   190        94       3       6          0
reckless         0         89    0     0     0         0      89       0         54
ignorer          0          0    0     0     0         0       0      81          0
press-reader    84        168    0    84   223       113       0       0          0

== Mission routes and quality ==

bot           official  favour  money   eu  knowledge  favours owed  good tasks  adequate tasks  route changes
------------  --------  ------  -----  ---  ---------  ------------  ----------  --------------  -------------
careful            336       0      0    0          0             0         168               0              0
socialiser          93     144      0   81          0             0         159               0             45
reckless             0       0     42    0          0            15           0               0              0
ignorer              0       0      0    0          0             0           0               0              0
press-reader       126       0      0  166         44             0         168               0             42

Route lock-outs: 0
task       good  adequate
---------  ----  --------
clearance   126         0
lounge      126         0
programme   126         0
security    117         0

== Endings per trait build (all bots) ==

build         runs     png  replaced  cancelled  retired  ambassador  promoted
------------  ----  ------  --------  ---------  -------  ----------  --------
liver           15  1 (7%)   5 (33%)     1 (7%)        .     3 (20%)   5 (33%)
replyall        15       .   7 (47%)          .        .     5 (33%)   3 (20%)
punctual        15       .   6 (40%)          .        .     2 (13%)   7 (47%)
brussels        15       .   6 (40%)          .        .     4 (27%)   5 (33%)
demarche        15       .   6 (40%)          .        .     5 (33%)   4 (27%)
namedrop        15       .   6 (40%)          .        .     2 (13%)   7 (47%)
cuisine         15       .   6 (40%)          .        .     6 (40%)   3 (20%)
novelist        15       .   6 (40%)     1 (7%)        .      1 (7%)   7 (47%)
sideevents      15       .   6 (40%)    3 (20%)        .     2 (13%)   4 (27%)
eyesopen        15       .   6 (40%)          .   1 (7%)           .   8 (53%)
ngo             15       .   6 (40%)          .        .     5 (33%)   4 (27%)
mixed-social    15  1 (7%)   5 (33%)    3 (20%)        .      1 (7%)   5 (33%)
mixed-staff     15       .   6 (40%)          .        .     3 (20%)   6 (40%)
mixed-formal    15       .   6 (40%)          .        .           .   9 (60%)

Most lopsided builds: mixed-formal promoted 60%, eyesopen promoted 53%, replyall replaced 47%, punctual promoted 47%, namedrop promoted 47%

== Endings per trait build (careful, socialiser and press-reader only) ==

build         runs  png  replaced  cancelled  retired  ambassador  promoted
------------  ----  ---  --------  ---------  -------  ----------  --------
liver            9    .         .    1 (11%)        .     3 (33%)   5 (56%)
replyall         9    .   1 (11%)          .        .     5 (56%)   3 (33%)
punctual         9    .         .          .        .     2 (22%)   7 (78%)
brussels         9    .         .          .        .     4 (44%)   5 (56%)
demarche         9    .         .          .        .     5 (56%)   4 (44%)
namedrop         9    .         .          .        .     2 (22%)   7 (78%)
cuisine          9    .         .          .        .     6 (67%)   3 (33%)
novelist         9    .         .    1 (11%)        .     1 (11%)   7 (78%)
sideevents       9    .         .    3 (33%)        .     2 (22%)   4 (44%)
eyesopen         9    .         .          .  1 (11%)           .   8 (89%)
ngo              9    .         .          .        .     5 (56%)   4 (44%)
mixed-social     9    .         .    3 (33%)        .     1 (11%)   5 (56%)
mixed-staff      9    .         .          .        .     3 (33%)   6 (67%)
mixed-formal     9    .         .          .        .           .  9 (100%)

== Day reached (15 = played to the end) ==

bot           mean  min  max
------------  ----  ---  ---
careful         15   15   15
socialiser    15.0   13   15
reckless       4.7    3    6
ignorer        6.1    6    8
press-reader    15   15   15
all           11.2    3   15

== Trait moments per run (trait-tagged choices taken), by build and bot ==

build          all  careful  socialiser  reckless  ignorer  press-reader
------------  ----  -------  ----------  --------  -------  ------------
liver          5.5      5.7        14.7       0.7        0           6.7
replyall         3      2.3         8.7       0.7        0           3.3
punctual       4.1        2        16.7         0        0           1.7
brussels       1.6      1.7         4.3       0.3        0           1.7
demarche       3.1      1.3        10.7         0        0           3.3
namedrop       3.9      3.3          14       0.3        0             2
cuisine        2.2      2.3         7.3         0        0           1.3
novelist       2.4      4.3         6.3       0.3        0             1
sideevents       1        1         3.3         0        0           0.7
eyesopen       7.7      3.3        32.3         0        0             3
ngo            4.7      3.3        15.7       0.3        0           4.3
mixed-social   6.1      7.7          13       1.3        0           8.3
mixed-staff   10.3      4.3        41.7       0.7        0             5
mixed-formal   8.1      5.7        28.7         0        0             6

== Trait coverage (runs of builds that include the trait) ==

trait       gated choices  ever offered  ever taken  offered/run  taken/run
----------  -------------  ------------  ----------  -----------  ---------
brussels                6             6           6          3.2        2.2
cuisine                 6             6           6          2.1        1.5
demarche                6             6           6          2.9        2.7
eyesopen                5             5           5          3.6        2.6
liver                  14            14          14          7.3        3.8
namedrop                8             8           8          3.6        2.0
ngo                     6             6           6          3.9        2.3
novelist                6             6           6          2.5        1.7
punctual                6             6           6          4.1        1.7
replyall                8             8           8          5.0        3.1
sideevents              5             5           5          1.4        0.8

== Content never reached ==

Authored: 38 story events, 50 dialogue topics, 28 emails, 7 invitations, 49 clippings, 424 choices.
Story events never seen (1):
  event:call-in-golf
Dialogue topics never seen: none
Emails never seen: none
Invitations never seen: none
Press clippings never seen (10):
  press:fuel-bought
  press:consequence-double
  press:consequence-seating
  press:consequence-cold
  press:consequence-ruth
  press:expedited-stamp-report
  press:report-lounge-expedited
  press:report-lounge-guest-list-expedited
  press:report-security-route-recon-expedited
  press:report-security-motorcade-expedited
Choices never offered (2):
  choice:event:call-in-golf:honour
  choice:event:call-in-golf:refuse
Choices never taken (offered or not) (14):
  choice:event:fuel-quay:buy
  choice:event:call-in-golf:honour
  choice:event:call-in-golf:refuse
  choice:event:call-in-fixer:honour
  choice:event:call-in-bianca:refuse
  choice:dialogue:pavel:stapler:b:0
  choice:email:visit-security:note
  choice:email:setback-arrival:reply
  choice:email:setback-arrival:delegate
  choice:email:setback-arrival:note
  choice:email:visit-programme:reply
  choice:email:visit-programme:delegate
  choice:email:visit-programme:note
  choice:email:visit-motorcade:delegate
Only counting the shipped game seed: 1 events, 0 topics, 5 choices never seen.

== Blocks with nothing to decide per run (no mail, episode, invitation, lead or mission step waiting) ==

bot           mean  min  max
------------  ----  ---  ---
careful        9.2    8   10
socialiser     3.3    1    9
reckless       2.7    0    8
ignorer          0    0    0
press-reader  11.2    9   12
all            5.3    0   12

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
day     1  2    3    4    5    6  7    8    9  10  11  12   13   14  15
----  ---  -  ---  ---  ---  ---  -  ---  ---  --  --  --  ---  ---  --
idle  0.7  0  0.8  0.8  1.9  1.7  0  0.1  0.1   0   0   0  0.0  1.0   1

Blocks with no mail, episode, invitation or lead waiting (mission steps not counted):
bot           mean  min  max
------------  ----  ---  ---
careful       27.0   26   28
socialiser    21.4   16   24
reckless       4.7    2    8
ignorer          1    1    1
press-reader  27.5   25   29
all           16.3    1   29

Same, by day, careful / socialiser / press-reader runs:
day   1    2    3    4    5    6    7    8    9   10   11   12   13  14  15
----  -  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  --  --
idle  1  1.2  1.1  1.1  2.8  2.0  0.8  2.2  3.0  1.4  2.5  1.7  1.6   2   1

Blocks in which the bot itself queued nothing:
bot           mean  min  max
------------  ----  ---  ---
careful       19.5   13   24
socialiser       0    0    0
reckless       0.1    0    2
ignorer       20.4   19   27
press-reader  16.2   11   20
all           11.2    0   27

== Days with a scheduling conflict per run (two or more time-bound things in one block) ==

bot           mean  min  max
------------  ----  ---  ---
careful        8.0    7    9
socialiser     8.0    7    9
reckless       2.8    1    4
ignorer        5.1    5    7
press-reader   8.0    7    9
all            6.4    1    9

Same, but ordinary mail arriving in the block also counts as time-bound:
bot           mean  min  max
------------  ----  ---  ---
careful       10.3   10   11
socialiser    11.8   11   13
reckless       4.1    3    5
ignorer        6.1    6    8
press-reader  12.3   12   13
all            8.9    3   13

== Lowest funds seen per run (ƒ; the reserves are part of funds) ==

bot            mean    min    max
------------  -----  -----  -----
careful        7864   7750   8250
socialiser     6703   5550   7730
reckless       7662   5980   9280
ignorer       10000  10000  10000
press-reader   7718   7450   8300
all            7989   5550  10000

Lowest funds above the reserves (visit reserves and mission steps):
bot           mean   min   max
------------  ----  ----  ----
careful       1564  1450  1950
socialiser    1002     0  2150
reckless       717    40  2080
ignorer       2600  2600  2600
press-reader  1420  1350  1750
all           1461     0  2600

== Mission ==

Careful bot confirmed all mission tasks in 100% of runs.
Runs that ended with the mission unfinished: 93 of 210; of those, reached the final day unfinished: 8.
Runs that left the mission unfinished after a step was refused for lack of money: 0.

Day the mission was completed (runs that completed it; the chapter has 13 steps):
bot           completed  mean day  earliest  latest  steps done
------------  ---------  --------  --------  ------  ----------
careful            100%        14        14      14          13
socialiser          79%      14.0        13      14        12.6
reckless             0%         -         -       -         3.7
ignorer              0%         -         -       -           2
press-reader       100%        14        14      14          13
all                 56%      14.0        13      14         8.9
  socialiser/liver/seed3: 3/4 tasks
  socialiser/novelist/seed2: 3/4 tasks
  socialiser/sideevents/seed1: 3/4 tasks
  socialiser/sideevents/seed2: 3/4 tasks
  socialiser/sideevents/seed3: 3/4 tasks
  socialiser/mixed-social/seed1: 3/4 tasks
  socialiser/mixed-social/seed2: 3/4 tasks
  socialiser/mixed-social/seed3: 3/4 tasks

== Refusals and stalls ==

advance() refused a plan 0 times.
Work that stalled per run: careful 0, socialiser 0, reckless 7.3, ignorer 0, press-reader 0
Most common refusals the bots hit:
  537 x You have only 0 DP this block.
  483 x You have only 3 DP this block.
  293 x You have only 2 DP this block.
  233 x You have only 4 DP this block.
  224 x You cannot afford the time or money to attend.
  196 x Not yet: Motorcade and escort for the new arrival time (needs the route reconnaissance).
  158 x Colleagues are off duty; dinner is social, not an extra work shift.
  104 x sola has only 2 DP this block.

(210 runs in 4.5s)
Raw results written to /private/tmp/s02-final.json
```
