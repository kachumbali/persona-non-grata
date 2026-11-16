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

## S-03 language and exam results

The 255-run matrix covers five bots, 17 trait builds and three seeds. The preceding S-05/S-08 baseline had 42/42 careful mission completions; the current careful result is 51/51. The level-2-by-Day-10 target is 80%, the exam-pass target is 40–80% of takers, and reckless runs must each produce at least three mistranslations.

| Bot          | Mean final level | Level 2 by Day 10 | Exam passed / sat | Mistranslations per run (minimum) | Mission completed |
| ------------ | ---------------: | ----------------: | ----------------: | --------------------------------: | ----------------: |
| careful      |             3.29 |             51/51 |             33/51 |                          0.00 (0) |             51/51 |
| socialiser   |             3.00 |             51/51 |               0/0 |                          0.33 (0) |             51/51 |
| reckless     |             1.96 |             49/51 |               0/0 |                          5.20 (3) |              0/51 |
| ignorer      |             0.00 |              0/51 |               0/0 |                          0.00 (0) |              0/51 |
| press-reader |             3.55 |             51/51 |             37/51 |                          0.00 (0) |             51/51 |

Progress thresholds are 4, 8 and 16 points for levels 1, 2 and 3. Without traits, interruptions or field practice, Sola needs 2, 4 and 8 lessons per respective level; the tutor needs 1, 2 and 4. Taxi practice gives 3 points at level 0 and 2 afterward, requiring 2 journeys for level 1, another 4 for level 2 and another 8 for level 3. Tutor homework and Ear for Accents can accelerate progress; ignored homework slows tuition. Level 4 requires the examination.

### Ombrazian mistranslations

1. You thanked the Deputy Minister for his excellent goat.
2. You asked whether the minutes had received their vaccinations.
3. You congratulated the office on its recent merger with a chair.
4. You requested an urgent meeting with the corridor.
5. You assured the Director that the embassy was entirely edible.
6. You called the programme a ceremonial turnip.
7. You offered the Minister a complimentary filing cabinet.
8. You described the port as professionally embarrassed.
9. You asked for a permit to postpone Tuesday.
10. You thanked the official for the decisive intervention of a spoon.
11. You promised that the ambassador would arrive by envelope.
12. You praised the department for its unusually well-behaved curtains.
13. You asked the Director to sign the nearest sandwich.
14. You described the appointment as legally refrigerated.
15. You assured the host that the memorandum had no known allergies.
16. You requested a bilateral discussion with the afternoon.
17. You explained that the reception had been approved by a cabbage.
18. You informed the ministry that the schedule was wearing a hat.
19. You called the revised agenda an extremely patient fish.
20. You apologised on behalf of the embassy’s imaginary accordion.

### Formal slang mistakes

1. You opened the formal meeting by calling it a paperwork picnic.
2. You referred to the Deputy Minister as the person in charge of the good chairs.
3. You asked Protocol to hurry the extremely official paperwork bus.

### Examination pool

The correct answer is bold. The game shuffles answer display and draws five questions.

- **q01 — A meeting is running late. What do you tell the host?** **Thank you for your patience.** / Thank you for your furniture. / Your patience has expired. / Please arrest the clock.
- **q02 — A minister has been promoted. Offer congratulations.** **Congratulations on your appointment.** / Condolences on your appointment. / Congratulations on your appointment book. / The chair is now your legal guardian.
- **q03 — Ask whether the port is open tomorrow.** **Will the port be open tomorrow?** / Will the door be open yesterday? / Is tomorrow under arrest? / May I marry the quay?
- **q04 — The host offers tea. You prefer water.** **Water, please, if convenient.** / Your water is inconvenient. / Tea has been abolished. / I accept the ceremonial kettle.
- **q05 — You need the signed document.** **Could we have the signed document?** / Could we sign the document cupboard? / The document has signed us. / I request diplomatic custody of the stapler.
- **q06 — An official says the matter is under review.** **Thank them and ask when to follow up.** / Announce that the matter is closed. / Demand a review of the furniture. / Promote the matter to minister.
- **q07 — A colleague introduces the examiner as Director Vela. How do you address them?** **Director Vela.** / Minister Vela. / Director Velour. / Your Impossibly Official Highness.
- **q08 — You must decline an invitation politely.** **Thank you; regrettably I cannot attend.** / I regret that you invited me. / I will attend your regret. / The invitation has eaten my diary.
- **q09 — Ask for a receipt.** **May I have a receipt, please?** / May I receive the receptionist? / The receipt asks for you. / The invoice has diplomatic immunity.
- **q10 — The driver asks which entrance.** **The main entrance, please.** / The entrance to next week. / Please enter the ministry of exits. / Whichever entrance is king.
- **q11 — A revised programme arrives.** **Thank you; we will check the changes.** / The changes will check your gratitude. / We refuse all programmes on principle. / Please file the programme under weather.
- **q12 — Ask an official to repeat a date.** **Could you repeat the date, please?** / Could the date repeat the official? / Yesterday is your responsibility. / Please appoint the calendar ambassador.
- **q13 — The host proposes a short delay.** **We understand; please keep us informed.** / We understand that you are short. / Delay is a form of dessert. / Please give the delay a passport.
- **q14 — You are offered the floor at a meeting.** **Thank you. I have one brief point.** / Thank you. I shall take the carpet. / Your floor is diplomatically unacceptable. / I appoint the ceiling my deputy.
- **q15 — The official says the permit is pending.** **Ask what remains to be completed.** / Congratulate them on the completed permit. / Demand a permit for the pen. / Declare the permit a sovereign state.
- **q16 — You wish to confirm a time.** **May I confirm the meeting is at noon?** / May noon confirm the meeting with me? / Your noon has been cancelled. / Please notarise the sun.

Language gates appear in the Protocol, port officer and golf conversations, the French and German EU conversations, a host-agreement mission route and a démarche route. The mission keeps an ungated official alternative.

## Simulation output

```text
Simulated playthroughs: chapter port-hesperia-2006, 255 runs (5 bots x 17 builds x 3 seeds)

== Languages per bot ==

careful: {"level":3.2941176470588234,"level2ByDay10":1,"lessons":{"sola":0,"tutor":3.1372549019607843,"fixer":0},"attempts":0,"errors":0,"sat":51,"passed":33,"failed":18}
socialiser: {"level":3,"level2ByDay10":1,"lessons":{"sola":0,"tutor":0,"fixer":27},"attempts":1.7254901960784315,"errors":0.3333333333333333,"sat":0,"passed":0,"failed":0}
reckless: {"level":1.9607843137254901,"level2ByDay10":0.9607843137254902,"lessons":{"sola":0,"tutor":0,"fixer":0},"attempts":12.019607843137255,"errors":5.196078431372549,"sat":0,"passed":0,"failed":0}
ignorer: {"level":0,"level2ByDay10":0,"lessons":{"sola":0,"tutor":0,"fixer":0},"attempts":0,"errors":0,"sat":0,"passed":0,"failed":0}
press-reader: {"level":3.549019607843137,"level2ByDay10":1,"lessons":{"sola":0,"tutor":6.627450980392157,"fixer":0},"attempts":0,"errors":0,"sat":51,"passed":37,"failed":14}

== Endings per bot ==

bot           runs       png   replaced  cancelled  retired  ambassador  promoted
------------  ----  --------  ---------  ---------  -------  ----------  --------
careful         51         .          .          .        .    14 (27%)  37 (73%)
socialiser      51         .    9 (18%)          .        .    42 (82%)         .
reckless        51  18 (35%)   33 (65%)          .        .           .         .
ignorer         51         .  51 (100%)          .        .           .         .
press-reader    51         .          .          .        .     9 (18%)  42 (82%)

== Personnel records and debriefs ==

careful: reputations {"team-europe":51,"credit-taker":47,"known-to-fax":51,"envoy":51,"absent":34,"reply-all":6}; quirks {"annex-reader":51}; stat drift {"charm":48,"gravitas":46}
socialiser: reputations {"team-europe":51,"rule-bender":47,"gossip":51,"known-to-fax":51,"debtor":51,"absent":17,"expediter":31,"credit-taker":36,"host":42,"biscuit-hawk":7,"capital-pleaser":2,"reply-all":2}; quirks {"annex-reader":51,"quiet-source":45,"owe-corps":22,"incident-prone":2,"morning-after":22,"over-explainer":8,"reliable-host":1,"dispatches":2}; stat drift {"gravitas":30,"charm":-27}
reckless: reputations {"rule-bender":25,"host":29,"capital-pleaser":15}; quirks {"annex-reader":51,"morning-after":23,"dispatches":1,"over-explainer":1}; stat drift {"gravitas":9}
ignorer: reputations {"absent":51}; quirks {}; stat drift {}
press-reader: reputations {"team-europe":51,"known-to-fax":51,"credit-taker":48,"gossip":51,"debtor":51,"absent":15,"envoy":51,"reply-all":6}; quirks {"annex-reader":51,"quiet-source":51,"owe-corps":51}; stat drift {"gravitas":89,"charm":46}
Reputations by build: {"liver":{"team-europe":9,"credit-taker":7,"known-to-fax":9,"envoy":6,"absent":11,"rule-bender":4,"gossip":6,"debtor":6,"expediter":2},"replyall":{"reply-all":6,"team-europe":9,"known-to-fax":9,"credit-taker":9,"absent":6,"envoy":6,"host":5,"gossip":6,"debtor":6,"rule-bender":4,"expediter":2,"capital-pleaser":1},"punctual":{"team-europe":9,"credit-taker":8,"known-to-fax":9,"envoy":6,"gossip":6,"debtor":6,"host":6,"rule-bender":6,"expediter":2,"biscuit-hawk":1,"capital-pleaser":1,"absent":3},"brussels":{"team-europe":9,"known-to-fax":9,"credit-taker":9,"absent":7,"envoy":6,"gossip":6,"rule-bender":3,"debtor":6,"host":3,"expediter":2,"biscuit-hawk":1,"capital-pleaser":1},"demarche":{"team-europe":9,"known-to-fax":9,"credit-taker":9,"absent":7,"envoy":6,"gossip":6,"host":5,"debtor":6,"rule-bender":5,"expediter":2,"capital-pleaser":1},"namedrop":{"team-europe":9,"known-to-fax":9,"absent":7,"envoy":6,"credit-taker":6,"gossip":6,"debtor":6,"rule-bender":4,"expediter":3,"host":4,"capital-pleaser":1},"cuisine":{"team-europe":9,"known-to-fax":9,"credit-taker":7,"absent":6,"envoy":6,"gossip":6,"debtor":6,"rule-bender":5,"expediter":3,"host":5,"biscuit-hawk":1,"capital-pleaser":2},"novelist":{"credit-taker":7,"team-europe":9,"known-to-fax":9,"envoy":6,"absent":11,"rule-bender":3,"gossip":6,"debtor":6,"host":2,"expediter":1},"sideevents":{"credit-taker":8,"known-to-fax":9,"team-europe":9,"envoy":6,"absent":11,"debtor":6,"gossip":6,"rule-bender":3,"expediter":3,"host":2},"eyesopen":{"team-europe":9,"credit-taker":8,"known-to-fax":9,"envoy":6,"rule-bender":6,"host":6,"biscuit-hawk":2,"gossip":6,"debtor":6,"capital-pleaser":3,"absent":3},"ngo":{"credit-taker":8,"team-europe":9,"known-to-fax":9,"absent":7,"envoy":6,"gossip":6,"biscuit-hawk":1,"host":5,"debtor":6,"rule-bender":4,"expediter":1,"capital-pleaser":2},"false-friend":{"team-europe":9,"known-to-fax":9,"credit-taker":7,"absent":7,"envoy":6,"host":5,"gossip":6,"debtor":6,"rule-bender":4,"expediter":1,"capital-pleaser":1},"old-textbook":{"team-europe":9,"known-to-fax":9,"credit-taker":7,"absent":8,"envoy":6,"rule-bender":5,"host":5,"debtor":6,"gossip":6,"expediter":3,"capital-pleaser":1},"ear-accents":{"team-europe":9,"credit-taker":7,"known-to-fax":9,"absent":7,"envoy":6,"rule-bender":4,"host":5,"gossip":6,"debtor":6,"expediter":1,"capital-pleaser":1},"mixed-social":{"credit-taker":6,"team-europe":9,"known-to-fax":9,"envoy":6,"absent":10,"debtor":6,"gossip":6,"rule-bender":2,"host":1,"expediter":1},"mixed-staff":{"reply-all":8,"team-europe":9,"credit-taker":9,"known-to-fax":9,"envoy":6,"rule-bender":4,"host":6,"gossip":6,"debtor":6,"expediter":2,"capital-pleaser":1,"absent":3},"mixed-formal":{"team-europe":9,"credit-taker":9,"known-to-fax":9,"envoy":6,"gossip":6,"host":6,"biscuit-hawk":1,"debtor":6,"rule-bender":6,"expediter":2,"capital-pleaser":1,"absent":3}}
Epithets: {"The diplomat who shared the credit in triplicate.":100,"The diplomat who trusted the supplier’s receipt.":23,"The diplomat who copied the entire service.":7,"The diplomat who annotated every annex.":22,"The diplomat who could not pass a ministry.":6,"The diplomat who negotiated with the canapé.":5,"The diplomat who attended the side event.":6,"The diplomat who declared a family interest.":3,"The diplomat who signed above the signature.":1,"The diplomat who kept the reception open.":2,"The diplomat who shared a confidence.":36,"The diplomat who registered the final toast.":3,"The diplomat who chose the louder briefing.":30,"The diplomat who arrived before the agenda.":1,"The diplomat who mentioned the Commissioner.":1,"The diplomat who revised the official account.":3,"The diplomat who left the fax to mature.":6}
Promotion-board appearances: {"ines":48,"bianca":31,"protocol":108,"sola":187,"development":73,"pavel":90,"maxim":30,"anselm":121,"eu":26,"press":10,"journalist":15,"golf":25,"port-officer":1}

== Relationships and gossip per run ==

bot           state changes  pairs changed  learned  passed  held  false acted  scenes
------------  -------------  -------------  -------  ------  ----  -----------  ------
careful                15.6            5.3      6.7     0.0   6.7          0.0     9.0
socialiser             29.5           14.1      9.5     9.3   0.3          4.6    10.0
reckless                3.5            2.4      0.1     0.1   0.0          0.0     2.5
ignorer                 4.1            0.0      0.0     0.0   0.0          0.0     5.1
press-reader           24.8           14.5     10.2    10.2   0.0          6.0     9.0

== Démarche deliveries and outcomes ==

bot           self  colleague   eu  note  good  adequate  failed  missed  incidents
------------  ----  ---------  ---  ----  ----  --------  ------  ------  ---------
careful        102        204    0   102   306       102       0       0          0
socialiser       0          0  355     0   253       102       0       0          0
reckless         0         77    0     0     0         0      77       0         51
ignorer          0          0    0     0     0         0       0      99          0
press-reader   102        204    0   102   306       102       0       0          0

== Mission routes and quality ==

bot           official  favour  money   eu  knowledge  favours owed  good tasks  adequate tasks  route changes
------------  --------  ------  -----  ---  ---------  ------------  ----------  --------------  -------------
careful            408       0      0    0          0             0         204               0              0
socialiser          36     177     80  102          0            12         155              49             54
reckless             0       0     26    0          0            18           0               0              0
ignorer              0       0      0    0          0             0           0               0              0
press-reader       153       0      0  202         53             0         204               0             51

Route lock-outs: 0
task       good  adequate
---------  ----  --------
clearance   153         0
lounge      153         0
programme   153         0
security    104        49

== Endings per trait build (all bots) ==

build         runs      png  replaced  cancelled  retired  ambassador  promoted
------------  ----  -------  --------  ---------  -------  ----------  --------
liver           15  3 (20%)   3 (20%)          .        .     5 (33%)   4 (27%)
replyall        15        .   8 (53%)          .        .     5 (33%)   2 (13%)
punctual        15   1 (7%)   6 (40%)          .        .     2 (13%)   6 (40%)
brussels        15        .   7 (47%)          .        .     3 (20%)   5 (33%)
demarche        15        .   6 (40%)          .        .     4 (27%)   5 (33%)
namedrop        15  2 (13%)   4 (27%)          .        .     3 (20%)   6 (40%)
cuisine         15        .   7 (47%)          .        .     4 (27%)   4 (27%)
novelist        15   1 (7%)   7 (47%)          .        .     2 (13%)   5 (33%)
sideevents      15   1 (7%)   6 (40%)          .        .     5 (33%)   3 (20%)
eyesopen        15   1 (7%)   5 (33%)          .        .     4 (27%)   5 (33%)
ngo             15  2 (13%)   4 (27%)          .        .     4 (27%)   5 (33%)
false-friend    15  2 (13%)   4 (27%)          .        .     5 (33%)   4 (27%)
old-textbook    15        .   7 (47%)          .        .     5 (33%)   3 (20%)
ear-accents     15   1 (7%)   5 (33%)          .        .     3 (20%)   6 (40%)
mixed-social    15  3 (20%)   3 (20%)          .        .     5 (33%)   4 (27%)
mixed-staff     15   1 (7%)   5 (33%)          .        .     3 (20%)   6 (40%)
mixed-formal    15        .   6 (40%)          .        .     3 (20%)   6 (40%)

Most lopsided builds: replyall replaced 53%, brussels replaced 47%, cuisine replaced 47%, novelist replaced 47%, old-textbook replaced 47%

== Endings per trait build (careful, socialiser and press-reader only) ==

build         runs  png  replaced  cancelled  retired  ambassador  promoted
------------  ----  ---  --------  ---------  -------  ----------  --------
liver            9    .         .          .        .     5 (56%)   4 (44%)
replyall         9    .   2 (22%)          .        .     5 (56%)   2 (22%)
punctual         9    .   1 (11%)          .        .     2 (22%)   6 (67%)
brussels         9    .   1 (11%)          .        .     3 (33%)   5 (56%)
demarche         9    .         .          .        .     4 (44%)   5 (56%)
namedrop         9    .         .          .        .     3 (33%)   6 (67%)
cuisine          9    .   1 (11%)          .        .     4 (44%)   4 (44%)
novelist         9    .   2 (22%)          .        .     2 (22%)   5 (56%)
sideevents       9    .   1 (11%)          .        .     5 (56%)   3 (33%)
eyesopen         9    .         .          .        .     4 (44%)   5 (56%)
ngo              9    .         .          .        .     4 (44%)   5 (56%)
false-friend     9    .         .          .        .     5 (56%)   4 (44%)
old-textbook     9    .   1 (11%)          .        .     5 (56%)   3 (33%)
ear-accents      9    .         .          .        .     3 (33%)   6 (67%)
mixed-social     9    .         .          .        .     5 (56%)   4 (44%)
mixed-staff      9    .         .          .        .     3 (33%)   6 (67%)
mixed-formal     9    .         .          .        .     3 (33%)   6 (67%)

== Day reached (15 = played to the end) ==

bot           mean  min  max
------------  ----  ---  ---
careful         15   15   15
socialiser    14.8   13   15
reckless       3.6    2    5
ignorer        6.1    6    8
press-reader    15   15   15
all           10.9    2   15

== Trait moments per run (trait-tagged choices taken), by build and bot ==

build         all  careful  socialiser  reckless  ignorer  press-reader
------------  ---  -------  ----------  --------  -------  ------------
liver         5.5        8        11.3         1        0             7
replyall      2.2      3.3           5         0        0           2.7
punctual      3.9        3        12.3       0.7        0           3.3
brussels      1.5        2         4.3         0        0             1
demarche      2.5        2         4.7       2.7        0             3
namedrop      2.9        3          10       0.3        0           1.3
cuisine       1.3      1.3         3.7         0        0           1.7
novelist        2      2.3           5         0        0           2.7
sideevents    0.6      0.3         1.7         0        0             1
eyesopen      4.9        2        20.3         0        0           2.3
ngo           2.7      2.3           9       0.3        0             2
false-friend  0.9        0         3.3         0        0           1.3
old-textbook  1.2      0.7         3.7         0        0           1.7
ear-accents   2.5      2.3         8.7         0        0           1.7
mixed-social  6.6        9        14.7       1.3        0             8
mixed-staff   6.3      6.3        19.3       0.7        0           5.3
mixed-formal  7.3      5.3        19.7         3        0           8.3

== Trait coverage (runs of builds that include the trait) ==

trait         gated choices  ever offered  ever taken  offered/run  taken/run
------------  -------------  ------------  ----------  -----------  ---------
brussels                  6             6           6          2.6        1.6
cuisine                   6             6           6          2.0        1.2
demarche                  6             6           6          2.6        2.8
ear-accents               5             5           5          1.5        1.1
eyesopen                  5             5           5          2.5        1.5
false-friend              5             5           5          1.2        0.9
liver                    14            14          14          7.0        4.1
namedrop                  8             8           8          2.8        1.5
ngo                       6             6           6          2.6        1.3
novelist                  6             6           6          1.6        0.9
old-textbook              5             5           5          1.6        1.2
punctual                  6             6           6          3.6        1.7
replyall                  8             8           8          3.7        2.3
sideevents                5             5           5          1.0        0.6

== Content never reached ==

Authored: 48 story events, 50 dialogue topics, 28 emails, 7 invitations, 63 clippings, 493 choices.
Story events never seen (2):
  event:asteria-coffee-followup
  event:call-in-golf
Dialogue topics never seen: none
Emails never seen: none
Invitations never seen: none
Press clippings never seen (15):
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
  press:reputation-expediter
  press:reputation-protocol
  press:reputation-host
Choices never offered (17):
  choice:event:eu-budget-share-meeting:reputation-biscuit-hawk
  choice:event:eu-budget-share-share-followup:reputation-known-to-fax
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
  choice:dialogue:protocol:stamps:a:5
  choice:dialogue:protocol:seating:a:5
  choice:dialogue:eu-germany:annex:a:2
  choice:dialogue:eu-germany:annex:a:3
  choice:dialogue:eu-germany:novel:a:2
Choices never taken (offered or not) (46):
  choice:event:eu-budget-share-meeting:reputation-biscuit-hawk
  choice:event:eu-budget-share-share-followup:reputation-known-to-fax
  choice:event:eu-clean-port:reputation-capital-pleaser
  choice:event:clean-port-national-host:reputation-absent
  choice:event:clean-port-shared-host:reputation-debtor
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
  choice:event:web-side:side
  choice:event:web-repair:side
  choice:event:web-seating:side
  choice:event:web-mentor:side
  choice:event:web-allies:side
  choice:event:web-dinner:side
  choice:dialogue:protocol:stamps:a:1
  choice:dialogue:protocol:stamps:a:5
  choice:dialogue:protocol:seating:a:5
  ... and 21 more
Only counting the shipped game seed: 2 events, 0 topics, 27 choices never seen.

== Blocks with nothing to decide per run (no mail, episode, invitation, lead or mission step waiting) ==

bot           mean  min  max
------------  ----  ---  ---
careful        7.8    6    9
socialiser     6.5    2   12
reckless       0.9    0    3
ignorer          0    0    0
press-reader   9.5    8   11
all            4.9    0   12

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
idle  0.7  0  0.7  0.5  1.6  1.8  0  0.0  0.1   0   0  0.3  0.3  1.2  1.0

Blocks with no mail, episode, invitation or lead waiting (mission steps not counted):
bot           mean  min  max
------------  ----  ---  ---
careful       23.2   18   26
socialiser    16.8    9   22
reckless       1.7    1    3
ignorer          1    1    1
press-reader  24.4   23   26
all           13.4    1   26

Same, by day, careful / socialiser / press-reader runs:
day   1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
----  -  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---
idle  1  0.8  0.9  0.8  1.8  1.8  0.7  2.1  2.8  1.3  2.0  1.6  1.1  1.9  1.0

Blocks in which the bot itself queued nothing:
bot           mean  min  max
------------  ----  ---  ---
careful       16.4    9   23
socialiser       0    0    0
reckless         0    0    0
ignorer       20.3   19   27
press-reader   9.3    6   13
all            9.2    0   27

== Days with a scheduling conflict per run (two or more time-bound things in one block) ==

bot           mean  min  max
------------  ----  ---  ---
careful         10   10   10
socialiser    10.1   10   11
reckless       2.5    1    4
ignorer        5.1    5    7
press-reader    11   11   11
all            7.7    1   11

Same, but ordinary mail arriving in the block also counts as time-bound:
bot           mean  min  max
------------  ----  ---  ---
careful         12   12   12
socialiser    14.5   13   15
reckless       3.6    2    5
ignorer        6.1    6    8
press-reader    13   13   13
all            9.8    2   15

== Lowest funds seen per run (ƒ; the reserves are part of funds) ==

bot            mean    min    max
------------  -----  -----  -----
careful        7855   7750   8250
socialiser     6807   5430   8360
reckless       9025   7400   9840
ignorer       10000  10000  10000
press-reader   8073   7500   8700
all            8352   5430  10000

Lowest funds above the reserves (visit reserves and mission steps):
bot           mean   min   max
------------  ----  ----  ----
careful       1555  1450  1950
socialiser    1199   -70  2450
reckless      1723   200  2440
ignorer       2600  2600  2600
press-reader  1697  1350  2100
all           1755   -70  2600

== Mission ==

Careful bot confirmed all mission tasks in 100% of runs.
Runs that ended with the mission unfinished: 102 of 255; of those, reached the final day unfinished: 0.
Runs that left the mission unfinished after a step was refused for lack of money: 0.

Day the mission was completed (runs that completed it; the chapter has 13 steps):
bot           completed  mean day  earliest  latest  steps done
------------  ---------  --------  --------  ------  ----------
careful            100%        14        14      14          13
socialiser         100%        13        13      13          13
reckless             0%         -         -       -         2.9
ignorer              0%         -         -       -           2
press-reader       100%        14        14      14          13
all                 60%      13.7        13      14         8.8

== Refusals and stalls ==

advance() refused a plan 0 times.
Work that stalled per run: careful 0, socialiser 0, reckless 5.2, ignorer 0, press-reader 0
Most common refusals the bots hit:
  1011 x That language lesson is not available.
  966 x You have only 0 DP this block.
  764 x You have only 3 DP this block.
  559 x You have only 2 DP this block.
  509 x You have only 4 DP this block.
  367 x You cannot afford the time or money to attend.
  284 x Colleagues are off duty; dinner is social, not an extra work shift.
  261 x anselm has only 2 DP this block.

(255 runs in 11.7s)
```
