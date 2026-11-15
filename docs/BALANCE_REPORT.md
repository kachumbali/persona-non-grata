# Balance report: Port Hesperia

S-06 measurement: 210 runs, five bots, 14 builds and three seeds through the real store. Reproduce with `npm run sim`. The S-02 baseline was commit `9c9b3d4`: careful promotion 27/42 (64%), press-reader promotion 42/42 (100%), and mission completions 42/42 for each. S-06 measures 29/42 (69%) and 37/42 (88%) promotions, respectively; both still complete 42/42 missions. The socialiser completes 30 missions, versus 33 in S-02 and 22 in B-02. False gossip is a deliberate new cost; ending thresholds were not changed.

The socialiser changes at least seven distinct other-person pairs in each run (mean 14.5); all ten relationship-reading scenes are seen across the full matrix. In a mean run, the socialiser learns 10.0 stories, passes 9.7, holds 0.2 and acts on 5.0 unreliable ones; the press-reader learns 10.2, passes 10.2 and acts on 6.0. The careful bot learns and holds 7.0, and the ignorer learns none. Pair-change, state-transition and gossip metrics were not instrumented in S-02, so no comparable baseline exists. The report counts distinct pairs directly changed by the player's decisions separately from state transitions, which can include unattended disputes.

The old reduced simulation coverage limit for previously authored choices moved from 75 to 78 because relationship scenes now occupy some event slots; new relationship choices are excluded from that legacy bound and have their own reachability check. The full-posting test deliberately ignores the new optional relationship episodes to verify they cannot block the mission. Invitation, EU coordination and favour tests now include the authored first-impression effect. Existing migration tests were updated for posting version 13. The 400px browser check used a new local test career in slot 2; the notebook showed a met colleague, a revealed trait and unknown relationships.

## NPC traits and assignments

- **Template enthusiast** (template): Believes all ideas improve inside a template.
- **Keeper of the seating plan** (seating): Remembers the order of every chair.
- **Allergic to delay** (initiative): Finds a way around a stalled process.
- **Remembers everything** (grudge): Keeps a careful record of slights.
- **Credits self** (credits): Treats a shared success as a drafting opportunity.
- **Loyal to the previous ambassador** (loyal): Compares every novelty with the old arrangement.
- **Believes in the process** (process): Trusts a procedure to outlast its purpose.
- **Knows everyone** (gossip): Passes news along with impeccable discretion.
- **Reception regular** (social): Can find common ground beside a buffet.
- **Guards receipts** (receipt): Can prove that a discussion occurred.
- **Team Europe enthusiast** (branding): Knows where the joint logo should go.
- **Public servant** (service): Asks whom the plan will help.
- **Cautious operator** (caution): Reads the small print before reading the headline.
- **Incurably curious** (curious): Asks a second question after the meeting.
- **Everything is urgent** (urgent): Has marked the reminder urgent too.
- **Quiet observer** (quiet): Notices what the minutes omit.

- Anselm Voss-Rietveld: Credits self, Reception regular.
- Pavel Oskarsen: Guards receipts, Remembers everything.
- Sola Dewrin: Allergic to delay, Public servant.
- Elise: Public servant, Incurably curious.
- Bianca Montefiore: Everything is urgent, Keeper of the seating plan.
- Ines Thibault-Lund: Public servant, Believes in the process.
- Lucien Falk: Reception regular, Knows everyone.
- Maxim: Allergic to delay, Incurably curious.
- Ketu Marrimba: Quiet observer, Knows everyone.
- Director Ndao: Keeper of the seating plan, Believes in the process.
- Celeste Norren: Team Europe enthusiast, Reception regular.
- Marcel Deux: Knows everyone, Cautious operator.
- Ruth Vale: Incurably curious, Knows everyone.
- Minister Bako: Keeper of the seating plan, Remembers everything.
- Dr Amara Chen: Believes in the process, Public servant.
- Ambassador Mara Velen: Keeper of the seating plan, Reception regular.
- Ambassador Niko Arden: Quiet observer, Believes in the process.
- Mira Sene: Public servant, Allergic to delay.
- Sofia da Costa: Guards receipts, Cautious operator.
- Idra Venn: Template enthusiast, Believes in the process.
- Klaus Weber: Template enthusiast, Believes in the process.
- Henri de Valois: Credits self, Keeper of the seating plan.
- Tanya Farrugia: Quiet observer, Incurably curious.
- Lars Lindqvist: Public servant, Cautious operator.

## Starting relationships

- Anselm Voss-Rietveld / Pavel Oskarsen: 20.
- Sola Dewrin / Elise: 35.
- Pavel Oskarsen / Lucien Falk: 35; shares-an-office.
- Anselm Voss-Rietveld / Bianca Montefiore: 65.
- Sola Dewrin / Ines Thibault-Lund: 70.
- Elise / Ines Thibault-Lund: 65.
- Maxim / Pavel Oskarsen: 30.
- Ketu Marrimba / Sola Dewrin: 75.
- Director Ndao / Mira Sene: 65; mentor.
- Director Ndao / Minister Bako: 30.
- Mira Sene / Marcel Deux: 30.
- Henri de Valois / Klaus Weber: 25; former-couple.
- Celeste Norren / Henri de Valois: 70.
- Celeste Norren / Klaus Weber: 65.
- Tanya Farrugia / Lars Lindqvist: 70.
- Minister Bako / Ambassador Mara Velen: 30.

## Gossip

- **fuel-quay** (false; press, Day 3): Mira reserved all the fuel for visiting delegations. Subject: Mira Sene; known to Lucien Falk, Ruth Vale; sensitivity 2.
- **reshuffle** (false; press, Day 5): Ndao has already selected the next minister. Subject: Director Ndao; known to Marcel Deux, Ruth Vale; sensitivity 3.
- **supplier** (true; conversation, Day 4): The supplier invoices for chairs that have not arrived. Subject: Marcel Deux; known to Pavel Oskarsen, Lucien Falk; sensitivity 2.
- **seating** (half-true; reception, Day 6): Bako objects to the chair beside the window. Subject: Minister Bako; known to Ruth Vale, Ketu Marrimba; sensitivity 2.
- **letterhead** (true; conversation, Day 5): Klaus keeps a template for the joint logo. Subject: Klaus Weber; known to Celeste Norren, Henri de Valois, Ruth Vale; sensitivity 1.
- **protocol-apprentice** (true; overheard, Day 4): Mira learned protocol from Ndao. Subject: Mira Sene; known to Director Ndao, Ruth Vale; sensitivity 1.
- **office-cupboard** (half-true; overheard, Day 5): Lucien has filed Pavel’s cupboard as a media asset. Subject: Lucien Falk; known to Pavel Oskarsen, Anselm Voss-Rietveld; sensitivity 2.
- **receipts** (true; conversation, Day 2): Pavel keeps a receipt for each lost receipt. Subject: Pavel Oskarsen; known to Ketu Marrimba, Lucien Falk; sensitivity 1.
- **consular-queue** (true; reception, Day 7): Ines has issued a queue number to an ambassador. Subject: Ines Thibault-Lund; known to Sola Dewrin, Ketu Marrimba; sensitivity 1.
- **clean-port** (false; press, Day 8): Mira cancelled the clean-port programme. Subject: Mira Sene; known to Ruth Vale, Marcel Deux; sensitivity 3.
- **team-europe** (half-true; reception, Day 9): Celeste has branded the rain as Team Europe. Subject: Celeste Norren; known to Tanya Farrugia, Ruth Vale; sensitivity 1.
- **briefing** (true; overheard, Day 10): Anselm wrote the briefing before the meeting. Subject: Anselm Voss-Rietveld; known to Pavel Oskarsen, Lucien Falk; sensitivity 2.

## Relationship scenes

- Day 2, **A joint assignment**: The two officers must prepare one joint briefing. Each has already drafted a credit line.
- Day 3, **The shared office**: Pavel finds that Lucien has described their shared cupboard as a communications platform.
- Day 4, **Two versions**: Anselm and Bianca have each sent a final version. Both say the other version is provisional.
- Day 5, **The separate signatures**: The former couple must co-sign a common letter. Neither will hand the pen to the other.
- Day 6, **Take a side**: Elise asks you to support her plan over Sola’s. Sola is standing behind the folder.
- Day 7, **A second draft**: Anselm and Pavel will revisit the briefing if the first draft can remain unsigned.
- Day 8, **The seating test**: The reception seating chart puts two officials who are not speaking beside one microphone.
- Day 9, **The reluctant mentor**: Mira has asked Ndao to explain a protocol rule. He has brought the previous edition.
- Day 10, **An orderly queue**: Ines and Sola have agreed to share a queue. Each has printed a different first number.
- Day 11, **Dinner for two**: A dinner needs two signatures from people who disagree about where the signatures should sit.

Anselm and Pavel's joint briefing can be repaired again in the later second-draft scene, which grants Pavel's favour. The France–Germany former couple must co-sign, the seating episode concerns a strained pair, Elise's request is overheard by Sola, and ignored episodes worsen their pair. The checker retains 11 pre-existing writing-length warnings.

## Simulation output

```text
Simulated playthroughs: chapter port-hesperia-2006, 210 runs (5 bots x 14 builds x 3 seeds)

== Endings per bot ==

bot           runs  png   replaced  cancelled  retired  ambassador  promoted
------------  ----  ---  ---------  ---------  -------  ----------  --------
careful         42    .          .          .        .    13 (31%)  29 (69%)
socialiser      42    .    5 (12%)   10 (24%)        .    26 (62%)    1 (2%)
reckless        42    .  42 (100%)          .        .           .         .
ignorer         42    .  42 (100%)          .        .           .         .
press-reader    42    .          .          .        .     5 (12%)  37 (88%)

== Relationships and gossip per run ==

bot           state changes  pairs changed  learned  passed  held  false acted  scenes
------------  -------------  -------------  -------  ------  ----  -----------  ------
careful                15.0            5.3      7.0     0.0   7.0          0.0     9.0
socialiser             30.2           14.5     10.0     9.7   0.2          5.0     9.9
reckless                6.6            5.1      2.8     2.5   0.3          1.0     2.9
ignorer                 4.1            0.0      0.0     0.0   0.0          0.0     5.1
press-reader           25.0           14.5     10.2    10.2   0.0          6.0     9.0

== Démarche deliveries and outcomes ==

bot           self  colleague   eu  note  good  adequate  failed  missed  incidents
------------  ----  ---------  ---  ----  ----  --------  ------  ------  ---------
careful         84        168    0    84   223       113       0       0          0
socialiser       0          0  290     0   206        84       0       0          0
reckless         0         74    0     0     0         0      74       0         47
ignorer          0          0    0     0     0         0       0      81          0
press-reader    84        168    0    84   222       114       0       0          0

== Mission routes and quality ==

bot           official  favour  money   eu  knowledge  favours owed  good tasks  adequate tasks  route changes
------------  --------  ------  -----  ---  ---------  ------------  ----------  --------------  -------------
careful            336       0      0    0          0             0         168               0              0
socialiser          64     151      0   82          0             2         153               0             43
reckless             0       0     42    0          0            23           0               0              0
ignorer              0       0      0    0          0             0           0               0              0
press-reader       126       0      0  166         44             0         168               0             42

Route lock-outs: 0
task       good  adequate
---------  ----  --------
clearance   125         0
lounge      125         0
programme   125         0
security    114         0

== Endings per trait build (all bots) ==

build         runs  png  replaced  cancelled  retired  ambassador  promoted
------------  ----  ---  --------  ---------  -------  ----------  --------
liver           15    .   6 (40%)     1 (7%)        .     3 (20%)   5 (33%)
replyall        15    .   8 (53%)          .        .     5 (33%)   2 (13%)
punctual        15    .   6 (40%)          .        .     3 (20%)   6 (40%)
brussels        15    .   7 (47%)          .        .     5 (33%)   3 (20%)
demarche        15    .   6 (40%)          .        .     4 (27%)   5 (33%)
namedrop        15    .   6 (40%)          .        .     4 (27%)   5 (33%)
cuisine         15    .   7 (47%)          .        .     5 (33%)   3 (20%)
novelist        15    .   6 (40%)    3 (20%)        .           .   6 (40%)
sideevents      15    .   6 (40%)    3 (20%)        .     3 (20%)   3 (20%)
eyesopen        15    .   6 (40%)          .        .     3 (20%)   6 (40%)
ngo             15    .   7 (47%)          .        .     3 (20%)   5 (33%)
mixed-social    15    .   6 (40%)    3 (20%)        .           .   6 (40%)
mixed-staff     15    .   6 (40%)          .        .     3 (20%)   6 (40%)
mixed-formal    15    .   6 (40%)          .        .     3 (20%)   6 (40%)

Most lopsided builds: replyall replaced 53%, brussels replaced 47%, cuisine replaced 47%, ngo replaced 47%, liver replaced 40%

== Endings per trait build (careful, socialiser and press-reader only) ==

build         runs  png  replaced  cancelled  retired  ambassador  promoted
------------  ----  ---  --------  ---------  -------  ----------  --------
liver            9    .         .    1 (11%)        .     3 (33%)   5 (56%)
replyall         9    .   2 (22%)          .        .     5 (56%)   2 (22%)
punctual         9    .         .          .        .     3 (33%)   6 (67%)
brussels         9    .   1 (11%)          .        .     5 (56%)   3 (33%)
demarche         9    .         .          .        .     4 (44%)   5 (56%)
namedrop         9    .         .          .        .     4 (44%)   5 (56%)
cuisine          9    .   1 (11%)          .        .     5 (56%)   3 (33%)
novelist         9    .         .    3 (33%)        .           .   6 (67%)
sideevents       9    .         .    3 (33%)        .     3 (33%)   3 (33%)
eyesopen         9    .         .          .        .     3 (33%)   6 (67%)
ngo              9    .   1 (11%)          .        .     3 (33%)   5 (56%)
mixed-social     9    .         .    3 (33%)        .           .   6 (67%)
mixed-staff      9    .         .          .        .     3 (33%)   6 (67%)
mixed-formal     9    .         .          .        .     3 (33%)   6 (67%)

== Day reached (15 = played to the end) ==

bot           mean  min  max
------------  ----  ---  ---
careful         15   15   15
socialiser    14.8    8   15
reckless       4.1    3    6
ignorer        6.1    6    8
press-reader    15   15   15
all           11.0    3   15

== Trait moments per run (trait-tagged choices taken), by build and bot ==

build         all  careful  socialiser  reckless  ignorer  press-reader
------------  ---  -------  ----------  --------  -------  ------------
liver           5      6.7          11       0.7        0           6.7
replyall      2.5      3.7         5.3       0.3        0           3.3
punctual      3.9        3        12.3         0        0             4
brussels      1.1      1.7         2.7         0        0           1.3
demarche      2.3        1         6.7         0        0           3.7
namedrop      3.4      1.7          12       0.3        0             3
cuisine       1.5      1.3         4.7         0        0           1.3
novelist      1.8        3         3.7         0        0           2.3
sideevents    0.8      0.3         2.7         0        0             1
eyesopen      5.3        3        19.3         0        0             4
ngo           2.9        3         8.7       0.7        0             2
mixed-social  6.5      8.7        16.7       1.3        0             6
mixed-staff   8.6      7.3        30.7       0.7        0           4.3
mixed-formal  5.9      4.7        20.3         0        0           4.7

== Trait coverage (runs of builds that include the trait) ==

trait       gated choices  ever offered  ever taken  offered/run  taken/run
----------  -------------  ------------  ----------  -----------  ---------
brussels                6             6           6          2.6        1.6
cuisine                 6             6           6          1.8        1.3
demarche                6             6           6          2.8        2.4
eyesopen                5             5           5          2.8        1.7
liver                  14            14          14          7.2        3.7
namedrop                8             8           8          3.5        1.7
ngo                     6             6           6          2.5        1.3
novelist                6             6           6          2.6        1.6
punctual                6             6           6          3.1        1.5
replyall                8             8           8          4.4        2.4
sideevents              5             5           5          1.3        0.7

== Content never reached ==

Authored: 48 story events, 50 dialogue topics, 28 emails, 7 invitations, 49 clippings, 444 choices.
Story events never seen (2):
  event:asteria-coffee-followup
  event:call-in-golf
Dialogue topics never seen: none
Emails never seen: none
Invitations never seen: none
Press clippings never seen (9):
  press:fuel-bought
  press:consequence-double
  press:consequence-cold
  press:consequence-ruth
  press:expedited-stamp-report
  press:report-lounge-expedited
  press:report-lounge-guest-list-expedited
  press:report-security-route-recon-expedited
  press:report-security-motorcade-expedited
Choices never offered (4):
  choice:event:asteria-coffee-followup:compromise
  choice:event:asteria-coffee-followup:credit
  choice:event:call-in-golf:honour
  choice:event:call-in-golf:refuse
Choices never taken (offered or not) (29):
  choice:event:clean-port-national-host:release
  choice:event:asteria-coffee-followup:compromise
  choice:event:asteria-coffee-followup:credit
  choice:event:fuel-quay:buy
  choice:event:call-in-golf:honour
  choice:event:call-in-golf:refuse
  choice:event:call-in-fixer:honour
  choice:event:web-joint:side
  choice:event:web-repair:side
  choice:event:web-seating:side
  choice:event:web-mentor:side
  choice:event:web-allies:side
  choice:event:web-dinner:side
  choice:dialogue:anselm:networking:a:0
  choice:dialogue:press:hashtag:a:1
  choice:dialogue:fixer:lounge:a:1
  choice:dialogue:journalist:drinks:a:1
  choice:dialogue:journalist:drinks:a:2
  choice:email:visit-security:delegate
  choice:email:visit-security:note
  choice:email:setback-arrival:reply
  choice:email:setback-arrival:delegate
  choice:email:setback-arrival:note
  choice:email:visit-programme:reply
  choice:email:visit-programme:delegate
  ... and 4 more
Only counting the shipped game seed: 2 events, 0 topics, 5 choices never seen.

== Blocks with nothing to decide per run (no mail, episode, invitation, lead or mission step waiting) ==

bot           mean  min  max
------------  ----  ---  ---
careful        7.8    6    9
socialiser     4.6    1    8
reckless       1.6    0    6
ignorer          0    0    0
press-reader   9.4    8   10
all            4.7    0   10

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
day     1  2    3    4    5    6  7    8    9  10  11   12   13   14   15
----  ---  -  ---  ---  ---  ---  -  ---  ---  --  --  ---  ---  ---  ---
idle  0.7  0  0.6  0.4  1.6  1.8  0  0.0  0.0   0   0  0.0  0.0  1.0  1.0

Blocks with no mail, episode, invitation or lead waiting (mission steps not counted):
bot           mean  min  max
------------  ----  ---  ---
careful       24.2   21   26
socialiser    16.8    7   22
reckless       2.9    1    7
ignorer          1    1    1
press-reader  25.4   24   27
all           14.1    1   27

Same, by day, careful / socialiser / press-reader runs:
day   1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
----  -  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---
idle  1  0.8  0.8  0.7  1.9  1.8  0.7  2.2  2.8  1.4  2.0  1.6  1.6  2.0  1.0

Blocks in which the bot itself queued nothing:
bot           mean  min  max
------------  ----  ---  ---
careful       18.3   10   25
socialiser       0    0    0
reckless       0.0    0    1
ignorer       20.4   19   27
press-reader  11.1    4   17
all           10.0    0   27

== Days with a scheduling conflict per run (two or more time-bound things in one block) ==

bot           mean  min  max
------------  ----  ---  ---
careful         10   10   10
socialiser    10.0    7   11
reckless       3.1    2    5
ignorer        5.1    5    7
press-reader    11   11   11
all            7.9    2   11

Same, but ordinary mail arriving in the block also counts as time-bound:
bot           mean  min  max
------------  ----  ---  ---
careful         12   12   12
socialiser    13.4    8   15
reckless       4.1    3    6
ignorer        6.1    6    8
press-reader    13   13   13
all            9.7    3   15

== Lowest funds seen per run (ƒ; the reserves are part of funds) ==

bot            mean    min    max
------------  -----  -----  -----
careful        7861   7750   8250
socialiser     7046   5720   8760
reckless       7846   5810   9390
ignorer       10000  10000  10000
press-reader   7755   7500   8300
all            8102   5720  10000

Lowest funds above the reserves (visit reserves and mission steps):
bot           mean   min   max
------------  ----  ----  ----
careful       1561  1450  1950
socialiser    1242   220  2280
reckless       827    20  2190
ignorer       2600  2600  2600
press-reader  1405  1350  1750
all           1527    20  2600

== Mission ==

Careful bot confirmed all mission tasks in 100% of runs.
Runs that ended with the mission unfinished: 96 of 210; of those, reached the final day unfinished: 10.
Runs that left the mission unfinished after a step was refused for lack of money: 0.

Day the mission was completed (runs that completed it; the chapter has 13 steps):
bot           completed  mean day  earliest  latest  steps done
------------  ---------  --------  --------  ------  ----------
careful            100%        14        14      14          13
socialiser          71%      13.9        13      14        12.3
reckless             0%         -         -       -         3.5
ignorer              0%         -         -       -           2
press-reader       100%        14        14      14          13
all                 54%      14.0        13      14         8.8
  socialiser/liver/seed1: 3/4 tasks
  socialiser/novelist/seed1: 3/4 tasks
  socialiser/novelist/seed2: 3/4 tasks
  socialiser/novelist/seed3: 3/4 tasks
  socialiser/sideevents/seed1: 3/4 tasks
  socialiser/sideevents/seed2: 3/4 tasks
  socialiser/sideevents/seed3: 3/4 tasks
  socialiser/mixed-social/seed1: 3/4 tasks
  socialiser/mixed-social/seed2: 3/4 tasks
  socialiser/mixed-social/seed3: 3/4 tasks

== Refusals and stalls ==

advance() refused a plan 0 times.
Work that stalled per run: careful 0, socialiser 0, reckless 6.8, ignorer 0, press-reader 0
Most common refusals the bots hit:
  654 x You have only 0 DP this block.
  654 x You have only 2 DP this block.
  575 x You have only 3 DP this block.
  344 x You have only 4 DP this block.
  302 x You cannot afford the time or money to attend.
  292 x anselm has only 2 DP this block.
  226 x Colleagues are off duty; dinner is social, not an extra work shift.
  189 x Not yet: Motorcade and escort for the new arrival time (needs the route reconnaissance).

(210 runs in 8.4s)
Raw results written to /private/tmp/s06-verified.json
```
