# Balance report: Port Hesperia

S-05/S-08 measurement: 210 runs (five bots, 14 builds, three seeds) through the real store. Reproduce with `npm run sim`. Compared with S-06, careful mission completion remains 42/42, press-reader remains 42/42, and socialiser rises from 30/42 to 40/42. The socialiser now reserves time for security and uses an expedited route when the late parade closes the road; that policy change and the new content are measured together. Press-reader promotion is 36/42 (86%), inside the 70–90% target. No ending thresholds changed.

| Bot          | Reputations earned/run | Quirks earned/run | Promoted | Missions completed |
| ------------ | ---------------------: | ----------------: | -------: | -----------------: |
| careful      |                   4.50 |              1.00 |    32/42 |              42/42 |
| socialiser   |                   7.55 |              3.00 |     2/42 |              40/42 |
| reckless     |                   2.95 |              2.81 |     0/42 |               0/42 |
| ignorer      |                   1.00 |              0.00 |     0/42 |               0/42 |
| press-reader |                   6.14 |              3.00 |    36/42 |              42/42 |

Every competent run earns at least one reputation. The most common is Known to Fax, earned in 130/210 runs (62%), below the 70% ceiling. All 84 paired same-build, same-seed comparisons between careful and the other competent bots ended with different personnel files (target 80%). The matrix produced 15 different epithets (target eight). [Three complete plain-text debriefs](DEBRIEF_EXAMPLES.md) show different runs. Reputation-triggered clippings and options are conditional; reduced-matrix coverage bounds were adjusted to reflect the socialiser's mission-first policy and cured traits. Existing save-version tests now expect version 14, and the simulator's `endedEarly` correctly includes endings during the last day.

## Reputations

- **The Biscuit Hawk** (`biscuit-hawk`): `hospitality` at 3. Hospitality budgets now come with a covering note.
- **Celeste’s Favourite** (`team-europe`): `team` at 3. Shared credit has become a private achievement.
- **Known to Fax** (`known-to-fax`): `formal` at 14. The secure fax recognises your handwriting.
- **First Among Signatories** (`credit-taker`): `credit` at 3. Your name appears before the attached decision.
- **Capital’s Reliable Correspondent** (`capital-pleaser`): `capital` at 4. Capital has started to notice your forwarding habits.
- **The Annex Wrangler** (`rule-bender`): `rules` at 3. Procedures have learned to move around you.
- **The Unread Diplomat** (`absent`): `ignored_mail` at 12. Several instructions are still looking for you.
- **Owes Half the Corps** (`debtor`): `favours_owed` at 2. Your favours ledger needs its own ledger.
- **The Discreet Source** (`gossip`): `gossip_passed` at 3. Your discretion is widely quoted.
- **The Walking Note** (`envoy`): `demarche_self` at 2. You are increasingly delivered in person.
- **The Expedited Official** (`expediter`): `money_routes` at 2. Your paperwork arrives with an invoice.
- **The Distribution List** (`reply-all`): `replyall_accidents` at 2. Your replies have an extensive readership.
- **The Protocol Exception** (`protocol`): `protocol_incidents` at 2. Protocol has added an exception for you.
- **The Last Toast** (`host`): `drinks` at 3. The reception has requested your glass be registered.

## Earned quirks

- **Recovering Reply-All-ic** (`recovering-replyall`): recalls ≥ 5; stats {'deniability': 1}; cures `replyall`.
- **Reads Annexes** (`annex-reader`): formal ≥ 4; stats {'liver': 1}.
- **Cited Off the Record** (`quiet-source`): gossip_passed ≥ 4; stats {'liver': 1}; replaces `namedrop` when present.
- **Mentioned in Dispatches** (`dispatches`): capital-pleaser held 2 days; stats {'gravitas': 1}.
- **Keeper of the Coffee** (`reliable-host`): hospitality ≥ 4; stats {'stamina': 1}.
- **Owes Half the Corps** (`owe-corps`): favours_owed ≥ 3; stats {'deniability': -1}.
- **Administrative Abrasion** (`paper-cut`): ignored_mail ≥ 15; stats {'stamina': -1}.
- **Protocol’s Special Case** (`incident-prone`): flag refused-favour-protocol; stats {'charm': -1}.
- **Explains the Annex** (`over-explainer`): rules ≥ 4; stats {'charm': -1}.
- **The Morning After** (`morning-after`): drinks ≥ 4; stats {'stamina': -1}.

## Stat drift choices

- Whose project is it? / Tell Sola to translate Elise’s proposal as written: charm -1.
- Two briefings, no shared facts / Give Pavel the lead and Anselm visible credit: charm +1.
- The generous supplier · part I / Ask Sola to check the ownership: gravitas +1.
- A chair of national importance / Defend Capital's seating instructions: charm -1.
- The seating plan · a delicate compromise / Move the Deputy Minister forward and explain to Capital: gravitas +1.
- Dinner for two / Wait for agreement: charm -1.

## Previous S-06 findings

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
careful         42    .          .          .        .    10 (24%)  32 (76%)
socialiser      42    .    8 (19%)          .        .    32 (76%)    2 (5%)
reckless        42    .  42 (100%)          .        .           .         .
ignorer         42    .  42 (100%)          .        .           .         .
press-reader    42    .          .          .        .     6 (14%)  36 (86%)

== Personnel records and debriefs ==

careful: reputations {"credit-taker":39,"team-europe":42,"known-to-fax":42,"envoy":42,"absent":18,"reply-all":6}; quirks {"annex-reader":42}; stat drift {"gravitas":38,"charm":40}
socialiser: reputations {"team-europe":42,"rule-bender":38,"gossip":41,"known-to-fax":42,"debtor":42,"absent":12,"expediter":25,"credit-taker":30,"host":32,"reply-all":3,"biscuit-hawk":7,"capital-pleaser":3}; quirks {"annex-reader":42,"quiet-source":36,"owe-corps":23,"morning-after":15,"over-explainer":5,"dispatches":3,"incident-prone":2}; stat drift {"gravitas":25,"charm":-21}
reckless: reputations {"host":41,"rule-bender":41,"gossip":19,"protocol":6,"capital-pleaser":13,"known-to-fax":4}; quirks {"annex-reader":42,"morning-after":39,"over-explainer":37}; stat drift {"charm":-53,"gravitas":4}
ignorer: reputations {"absent":42}; quirks {}; stat drift {}
press-reader: reputations {"credit-taker":42,"team-europe":42,"known-to-fax":42,"gossip":42,"debtor":42,"envoy":42,"reply-all":6}; quirks {"annex-reader":42,"quiet-source":42,"owe-corps":42}; stat drift {"gravitas":80,"charm":41}
Reputations by build: {"liver":{"credit-taker":7,"team-europe":9,"known-to-fax":9,"envoy":6,"rule-bender":5,"gossip":8,"debtor":6,"absent":6,"expediter":1,"host":4,"protocol":1},"replyall":{"team-europe":9,"known-to-fax":9,"credit-taker":9,"absent":6,"envoy":6,"reply-all":7,"host":6,"gossip":6,"debtor":6,"rule-bender":6,"expediter":1,"capital-pleaser":1},"punctual":{"team-europe":9,"credit-taker":8,"known-to-fax":10,"envoy":6,"gossip":7,"rule-bender":6,"host":6,"biscuit-hawk":2,"debtor":6,"expediter":1,"capital-pleaser":3,"protocol":1,"absent":3},"brussels":{"team-europe":9,"known-to-fax":9,"credit-taker":9,"absent":6,"envoy":6,"rule-bender":6,"debtor":6,"gossip":9,"host":5,"expediter":2,"capital-pleaser":1},"demarche":{"team-europe":9,"known-to-fax":9,"credit-taker":9,"absent":6,"envoy":6,"gossip":7,"host":5,"debtor":6,"rule-bender":6,"expediter":3,"capital-pleaser":1},"namedrop":{"team-europe":9,"known-to-fax":9,"absent":6,"envoy":6,"credit-taker":6,"gossip":6,"debtor":6,"rule-bender":5,"expediter":2,"host":5,"biscuit-hawk":1},"cuisine":{"team-europe":9,"known-to-fax":9,"credit-taker":8,"absent":6,"envoy":6,"rule-bender":6,"gossip":7,"host":6,"debtor":6,"expediter":2,"capital-pleaser":1,"biscuit-hawk":1},"novelist":{"credit-taker":8,"team-europe":9,"known-to-fax":9,"envoy":6,"debtor":6,"gossip":8,"absent":6,"rule-bender":5,"expediter":2,"host":4,"protocol":2},"sideevents":{"credit-taker":8,"known-to-fax":9,"team-europe":9,"envoy":6,"debtor":6,"absent":6,"gossip":6,"rule-bender":6,"expediter":2,"host":3},"eyesopen":{"team-europe":9,"credit-taker":8,"known-to-fax":9,"envoy":6,"capital-pleaser":4,"rule-bender":6,"host":6,"gossip":7,"debtor":6,"expediter":1,"absent":3},"ngo":{"team-europe":9,"known-to-fax":10,"credit-taker":7,"absent":6,"envoy":6,"rule-bender":6,"gossip":8,"host":6,"debtor":6,"expediter":3,"protocol":1},"mixed-social":{"credit-taker":7,"team-europe":9,"known-to-fax":9,"envoy":6,"debtor":6,"absent":6,"rule-bender":4,"expediter":2,"host":5,"gossip":6},"mixed-staff":{"team-europe":9,"credit-taker":8,"known-to-fax":10,"reply-all":8,"envoy":6,"rule-bender":6,"host":6,"gossip":8,"debtor":6,"biscuit-hawk":1,"expediter":1,"capital-pleaser":2,"absent":3},"mixed-formal":{"team-europe":9,"credit-taker":9,"known-to-fax":10,"envoy":6,"gossip":9,"host":6,"biscuit-hawk":2,"debtor":6,"rule-bender":6,"expediter":2,"capital-pleaser":3,"protocol":1,"absent":3}}
Epithets: {"The diplomat who shared the credit in triplicate.":79,"The diplomat who copied the entire service.":8,"The diplomat who annotated every annex.":18,"The diplomat who trusted the supplier’s receipt.":33,"The diplomat who could not pass a ministry.":5,"The diplomat who negotiated with the canapé.":6,"The diplomat who declared a family interest.":3,"The diplomat who shared a confidence.":34,"The diplomat who registered the final toast.":12,"The diplomat who signed above the signature.":1,"The diplomat who kept the reception open.":1,"The diplomat who arrived before the agenda.":1,"The diplomat who mentioned the Commissioner.":1,"The diplomat who revised the official account.":3,"The diplomat who attended the side event.":5}
Promotion-board appearances: {"sola":166,"development":56,"ines":43,"pavel":83,"anselm":113,"protocol":45,"press":18,"maxim":18,"bianca":34,"eu":25,"golf":21,"journalist":8}

== Relationships and gossip per run ==

bot           state changes  pairs changed  learned  passed  held  false acted  scenes
------------  -------------  -------------  -------  ------  ----  -----------  ------
careful                16.3            5.4      7.0     0.0   7.0          0.0     9.0
socialiser             29.3           13.9      9.0     9.0   0.1          4.6    10.0
reckless                6.3            5.0      2.8     2.5   0.3          1.0     2.8
ignorer                 4.1            0.0      0.0     0.0   0.0          0.0     5.1
press-reader           25.9           14.4     10.1    10.1   0.0          6.0     9.0

== Démarche deliveries and outcomes ==

bot           self  colleague   eu  note  good  adequate  failed  missed  incidents
------------  ----  ---------  ---  ----  ----  --------  ------  ------  ---------
careful         84        168    0    84   250        86       0       0          0
socialiser       0          0  291     0   208        83       0       0          0
reckless         0         73    0     0     0         0      73       0         48
ignorer          0          0    0     0     0         0       0      81          0
press-reader    84        168    0    84   252        84       0       0          0

== Mission routes and quality ==

bot           official  favour  money   eu  knowledge  favours owed  good tasks  adequate tasks  route changes
------------  --------  ------  -----  ---  ---------  ------------  ----------  --------------  -------------
careful            336       0      0    0          0             0         168               0              0
socialiser          26     145     65   84          0             9         124              40             45
reckless             0       0     42    0          0            23           0               0              0
ignorer              0       0      0    0          0             0           0               0              0
press-reader       126       0      0  166         44             0         168               0             42

Route lock-outs: 0
task       good  adequate
---------  ----  --------
clearance   126         0
lounge      125         0
programme   124         0
security     85        40

== Endings per trait build (all bots) ==

build         runs  png  replaced  cancelled  retired  ambassador  promoted
------------  ----  ---  --------  ---------  -------  ----------  --------
liver           15    .   6 (40%)          .        .     5 (33%)   4 (27%)
replyall        15    .   8 (53%)          .        .     5 (33%)   2 (13%)
punctual        15    .   7 (47%)          .        .     2 (13%)   6 (40%)
brussels        15    .   6 (40%)          .        .     6 (40%)   3 (20%)
demarche        15    .   6 (40%)          .        .     4 (27%)   5 (33%)
namedrop        15    .   6 (40%)          .        .     4 (27%)   5 (33%)
cuisine         15    .   7 (47%)          .        .     4 (27%)   4 (27%)
novelist        15    .   7 (47%)          .        .     2 (13%)   6 (40%)
sideevents      15    .   7 (47%)          .        .     4 (27%)   4 (27%)
eyesopen        15    .   6 (40%)          .        .     3 (20%)   6 (40%)
ngo             15    .   7 (47%)          .        .     2 (13%)   6 (40%)
mixed-social    15    .   6 (40%)          .        .     4 (27%)   5 (33%)
mixed-staff     15    .   7 (47%)          .        .      1 (7%)   7 (47%)
mixed-formal    15    .   6 (40%)          .        .     2 (13%)   7 (47%)

Most lopsided builds: replyall replaced 53%, punctual replaced 47%, cuisine replaced 47%, novelist replaced 47%, sideevents replaced 47%

== Endings per trait build (careful, socialiser and press-reader only) ==

build         runs  png  replaced  cancelled  retired  ambassador  promoted
------------  ----  ---  --------  ---------  -------  ----------  --------
liver            9    .         .          .        .     5 (56%)   4 (44%)
replyall         9    .   2 (22%)          .        .     5 (56%)   2 (22%)
punctual         9    .   1 (11%)          .        .     2 (22%)   6 (67%)
brussels         9    .         .          .        .     6 (67%)   3 (33%)
demarche         9    .         .          .        .     4 (44%)   5 (56%)
namedrop         9    .         .          .        .     4 (44%)   5 (56%)
cuisine          9    .   1 (11%)          .        .     4 (44%)   4 (44%)
novelist         9    .   1 (11%)          .        .     2 (22%)   6 (67%)
sideevents       9    .   1 (11%)          .        .     4 (44%)   4 (44%)
eyesopen         9    .         .          .        .     3 (33%)   6 (67%)
ngo              9    .   1 (11%)          .        .     2 (22%)   6 (67%)
mixed-social     9    .         .          .        .     4 (44%)   5 (56%)
mixed-staff      9    .   1 (11%)          .        .     1 (11%)   7 (78%)
mixed-formal     9    .         .          .        .     2 (22%)   7 (78%)

== Day reached (15 = played to the end) ==

bot           mean  min  max
------------  ----  ---  ---
careful         15   15   15
socialiser    14.8   11   15
reckless       4.1    3    6
ignorer        6.1    6    8
press-reader    15   15   15
all             11    3   15

== Trait moments per run (trait-tagged choices taken), by build and bot ==

build         all  careful  socialiser  reckless  ignorer  press-reader
------------  ---  -------  ----------  --------  -------  ------------
liver         4.9      6.7        10.7       0.7        0           6.7
replyall      2.3        3         4.7       0.3        0           3.3
punctual      3.8        3        11.7       0.3        0             4
brussels      1.5      1.7         4.7         0        0           1.3
demarche      1.9        1           5         0        0           3.7
namedrop      2.7        2         9.3       0.3        0             2
cuisine       1.5      1.7         4.3         0        0           1.3
novelist      1.7        3           3         0        0           2.3
sideevents    0.6      0.3         1.7         0        0             1
eyesopen      5.9        4        21.7         0        0             4
ngo           2.9        3         9.3       0.3        0             2
mixed-social  6.2      8.7          15       1.3        0             6
mixed-staff   7.7      4.7        28.7       0.7        0           4.3
mixed-formal  6.6      7.3        20.7       0.3        0           4.7

== Trait coverage (runs of builds that include the trait) ==

trait       gated choices  ever offered  ever taken  offered/run  taken/run
----------  -------------  ------------  ----------  -----------  ---------
brussels                6             6           6          2.7        1.7
cuisine                 6             6           6          1.9        1.2
demarche                6             6           6          2.8        2.2
eyesopen                5             5           5          2.9        1.8
liver                  14            14          14          7.0        3.6
namedrop                8             8           8          2.6        1.3
ngo                     6             6           6          2.6        1.5
novelist                6             6           6          1.9        1.1
punctual                6             6           6          3.1        1.5
replyall                8             8           8          4.2        2.5
sideevents              5             5           5          1.2        0.5

== Content never reached ==

Authored: 48 story events, 50 dialogue topics, 28 emails, 7 invitations, 63 clippings, 458 choices.
Story events never seen (2):
  event:asteria-coffee-followup
  event:call-in-golf
Dialogue topics never seen: none
Emails never seen: none
Invitations never seen: none
Press clippings never seen (16):
  press:fuel-bought
  press:consequence-double
  press:consequence-cold
  press:consequence-ruth
  press:expedited-stamp-report
  press:report-lounge-expedited
  press:report-lounge-guest-list-expedited
  press:report-security-route-recon-expedited
  press:report-security-motorcade-expedited
  press:reputation-biscuit-hawk
  press:reputation-capital-pleaser
  press:reputation-rule-bender
  press:reputation-absent
  press:reputation-expediter
  press:reputation-protocol
  press:reputation-host
Choices never offered (11):
  choice:event:eu-budget-share-meeting:reputation-biscuit-hawk
  choice:event:eu-clean-port:reputation-capital-pleaser
  choice:event:clean-port-national-host:reputation-absent
  choice:event:staff-sola-elise:reputation-envoy
  choice:event:staff-sola-consult-followup:reputation-expediter
  choice:event:staff-sola-instruct-followup:reputation-reply-all
  choice:event:staff-sola-pause-followup:reputation-protocol
  choice:event:asteria-coffee-followup:compromise
  choice:event:asteria-coffee-followup:credit
  choice:event:call-in-golf:honour
  choice:event:call-in-golf:refuse
Choices never taken (offered or not) (37):
  choice:event:eu-budget-share-meeting:reputation-biscuit-hawk
  choice:event:eu-clean-port:reputation-capital-pleaser
  choice:event:clean-port-accept-host:reputation-rule-bender
  choice:event:clean-port-national-host:release
  choice:event:clean-port-national-host:reputation-absent
  choice:event:clean-port-decline-host:reputation-gossip
  choice:event:staff-sola-elise:reputation-envoy
  choice:event:staff-sola-consult-followup:reputation-expediter
  choice:event:staff-sola-instruct-followup:reputation-reply-all
  choice:event:staff-sola-pause-followup:reputation-protocol
  choice:event:staff-rivalry-mediate-followup:reputation-host
  choice:event:asteria-coffee-followup:compromise
  choice:event:asteria-coffee-followup:credit
  choice:event:fuel-quay:buy
  choice:event:call-in-golf:honour
  choice:event:call-in-golf:refuse
  choice:event:web-joint:side
  choice:event:web-repair:side
  choice:event:web-seating:side
  choice:event:web-mentor:side
  choice:event:web-allies:side
  choice:event:web-dinner:side
  choice:dialogue:pavel:stapler:b:1
  choice:dialogue:journalist:drinks:a:1
  choice:dialogue:journalist:drinks:a:2
  ... and 12 more
Only counting the shipped game seed: 2 events, 0 topics, 13 choices never seen.

== Blocks with nothing to decide per run (no mail, episode, invitation, lead or mission step waiting) ==

bot           mean  min  max
------------  ----  ---  ---
careful        7.8    6    9
socialiser     6.5    1   12
reckless       1.5    0    6
ignorer          0    0    0
press-reader   9.4    8   10
all            5.0    0   12

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
idle  0.7  0  0.6  0.4  1.6  1.8  0  0.0  0.1   0   0  0.3  0.3  1.2  1.0

Blocks with no mail, episode, invitation or lead waiting (mission steps not counted):
bot           mean  min  max
------------  ----  ---  ---
careful       24.2   21   26
socialiser    16.5    9   22
reckless       2.6    1    7
ignorer          1    1    1
press-reader  25.4   24   27
all           13.9    1   27

Same, by day, careful / socialiser / press-reader runs:
day   1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
----  -  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---
idle  1  0.8  0.8  0.7  1.9  1.8  0.7  2.2  2.8  1.3  2.0  1.6  1.6  1.9  1.0

Blocks in which the bot itself queued nothing:
bot           mean  min  max
------------  ----  ---  ---
careful       18.3   10   23
socialiser       0    0    0
reckless       0.0    0    1
ignorer       20.4   19   27
press-reader  11.2    4   17
all           10.0    0   27

== Days with a scheduling conflict per run (two or more time-bound things in one block) ==

bot           mean  min  max
------------  ----  ---  ---
careful         10   10   10
socialiser    10.1    9   11
reckless       3.1    2    5
ignorer        5.1    5    7
press-reader    11   11   11
all            7.9    2   11

Same, but ordinary mail arriving in the block also counts as time-bound:
bot           mean  min  max
------------  ----  ---  ---
careful         12   12   12
socialiser    14.5   11   15
reckless       4.1    3    6
ignorer        6.1    6    8
press-reader    13   13   13
all            9.9    3   15

== Lowest funds seen per run (ƒ; the reserves are part of funds) ==

bot            mean    min    max
------------  -----  -----  -----
careful        7861   7750   8250
socialiser     6750   5400   8360
reckless       8042   6420   9040
ignorer       10000  10000  10000
press-reader   7755   7500   8300
all            8081   5400  10000

Lowest funds above the reserves (visit reserves and mission steps):
bot           mean   min   max
------------  ----  ----  ----
careful       1561  1450  1950
socialiser    1150  -100  2450
reckless       965   150  1840
ignorer       2600  2600  2600
press-reader  1405  1350  1750
all           1536  -100  2600

== Mission ==

Careful bot confirmed all mission tasks in 100% of runs.
Runs that ended with the mission unfinished: 86 of 210; of those, reached the final day unfinished: 0.
Runs that left the mission unfinished after a step was refused for lack of money: 0.

Day the mission was completed (runs that completed it; the chapter has 13 steps):
bot           completed  mean day  earliest  latest  steps done
------------  ---------  --------  --------  ------  ----------
careful            100%        14        14      14          13
socialiser          95%        13        13      13        12.9
reckless             0%         -         -       -         3.5
ignorer              0%         -         -       -           2
press-reader       100%        14        14      14          13
all                 59%      13.7        13      14         8.9

== Refusals and stalls ==

advance() refused a plan 0 times.
Work that stalled per run: careful 0, socialiser 0, reckless 6.6, ignorer 0, press-reader 0
Most common refusals the bots hit:
  675 x You have only 0 DP this block.
  626 x You have only 3 DP this block.
  485 x You have only 2 DP this block.
  296 x You cannot afford the time or money to attend.
  293 x You have only 4 DP this block.
  285 x anselm has only 2 DP this block.
  235 x Colleagues are off duty; dinner is social, not an extra work shift.
  164 x Not yet: Motorcade and escort for the new arrival time (needs the route reconnaissance).

(210 runs in 8.7s)
Raw results written to /private/tmp/s08-final-verified.json
```
