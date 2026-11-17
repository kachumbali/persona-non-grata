# Cast bible: Port Hesperia 2006

Reference for the 24 characters in the Port Hesperia chapter. Everything here is taken from the existing content; nothing is invented. Later checks should read against this file. Open contradictions are collected at the end.

## Source ids

| Prefix                               | Where it comes from                                                          |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| `char:<id>`                          | `campaign.json`, `characters` (field after the colon where relevant)         |
| `event:<id>`                         | `campaign.json`, `events`                                                    |
| `gossip:<id>`                        | `campaign.json`, `gossip`                                                    |
| `location:<id>`, `venue:<id>`        | `campaign.json`, `locations` and `venues`                                    |
| `dialogue:<character>/<tree>/<node>` | `dialogues.json` (a `/choice` suffix means the text is a choice result)      |
| `email:<id>`                         | `emails.json` (`id`, or the index where no id exists)                        |
| `invite:<n>`                         | `invitations.json`, entry index `n` from zero                                |
| `demarche:<n>`                       | `demarches.json`, `instructions[n]` (or `colleagueLines`, `colleagueLevels`) |
| `press:<n>`                          | `press.json`, `clippings[n]`                                                 |
| `embassy:<x>`                        | `embassy.json` (`rooms`, `staff`)                                            |
| `duties:<id>`                        | `staff-duties.json`                                                          |
| `briefing:<x>`                       | `posting-briefing.json`                                                      |
| `eu-rep:<id>`                        | `eu-representation.json`                                                     |
| `mail:<id>`                          | `mail-choices.json`                                                          |
| `payoff:<id>`                        | `conversation-payoffs.json`                                                  |
| `chapter:<x>`                        | `chapter.json`                                                               |

Traits are listed by name from `npc-traits.json`. Locations are given as id and place name.

## Embassy staff

### Anselm Voss-Rietveld (anselm) — Political & Press Officer · first posting

- **Gender:** male (`char:anselm`)
- **Workplace:** `embassy`, Embassy
- **Traits:** Credits self; Reception regular
- **Wants:** Get credit for the visit programme.
- **Voice:** Eager and self-regarding, with a habit of quoting himself. He offers help that tends to be about his own credit.
  - "I could brief Capital myself. They remember me from training." (`char:anselm`, `line`)
  - "I drafted the Minister's speech. Eleven pages. I quoted myself twice — as 'a promising young voice'." (`dialogue:anselm/ghostwriter/a`)
- **Established facts:**
  - First posting (`char:anselm`).
  - Drafted the Minister's speech and quoted himself (`dialogue:anselm/ghostwriter/a`). The speech is a running gag: the "promising young voice" is himself (`dialogue:anselm/ghostwriter/b`).
  - Wrote a briefing of his own. Pavel wrote one too, and neither would combine them (`event:rivalry`). The gossip that he wrote the briefing before the meeting is marked true (`gossip:briefing`).
  - Was invited to the yacht of a man who "does imports" and looked him up on Chercheur, a fictional search engine (`dialogue:anselm/networking/a`, choice result).
  - Drafts a document that reaches Capital first, signed by him (`email:e1`, delegate option).
  - Absorbs Capital's amendments overnight (`email:visit-amendments`), circulates the new arrival time (`email:setback-arrival`), confirms readiness on your behalf (`email:arrival-eve`) and hands over the programme, after which the Minister asks who he is (`email:arrival-programme`).
  - Replies to Capital's Protocol email and mentions that you "are coping, considering" (`email:e10`, delegate option).
  - Keeps a careful record of whose name is on which draft after you overrule him (`event:staff-rivalry-order-followup`, choice result).
- **Relationships:**
  - Pavel: start value 20, no tags. A feud over briefings (`chapter:startRelationships`; `event:rivalry`, `event:web-joint`, `event:web-repair`, `event:staff-rivalry-mediate-followup`).
  - Bianca: start value 65, no tags. Two final versions of a document (`chapter:startRelationships`; `event:web-team`, gate neutral, friendly or ally).
- **Contradictions:**
  - Weak overlap, not counted as a direct conflict: `duties:anselm` gives him "press monitoring", while `briefing:sections[7]` says that Lucien or Maxim compiles the local press. See Open contradictions.

### Pavel Oskarsen (pavel) — Veteran Head of Administration

- **Gender:** male (`char:pavel`)
- **Workplace:** `embassy`, Embassy
- **Traits:** Guards receipts; Remembers everything
- **Wants:** Keep every expense supported by a receipt.
- **Voice:** Dry and weary, a man who has kept the paperwork through several ambassadors. He speaks in long-memory asides.
  - "I have seen six ambassadors. Five also thought a promise was a reservation." (`char:pavel`, `line`)
  - "Someone has taken my stapler. The red one. It was issued in 1994." (`dialogue:pavel/stapler/a`)
- **Established facts:**
  - Veteran Head of Administration (`char:pavel`). The embassy record calls him "Head of Admin" (`embassy:staff[2]`). His duties are administration, procurement and the generator (`duties:pavel`).
  - Missing red stapler, issued in 1994 (`dialogue:pavel/stapler/a`). A joke runs through the stapler tree and a checklist (`dialogue:pavel/stapler/b`).
  - Keeps a receipt for each lost receipt (`gossip:receipts`, true).
  - Keeps a small book of ambassadors' promises (`dialogue:pavel/ambassadors`, choice result).
  - Sent the generator report: out of diesel, and "I still have the keys" (`email:e3`).
  - Negotiated the lounge rate and got written confirmation (`email:visit-lounge`, delegate option), sent the headcount with a map of the chairs (`email:arrival-headcount`), and met the aircraft with the lounge manager (`email:arrival-landed`).
  - Lucien filed Pavel's cupboard as a media asset (`gossip:office-cupboard`, half-true; `event:web-office`).
- **Relationships:**
  - Anselm: start value 20, no tags. Rivalry (see Anselm).
  - Lucien (press): start value 35, tag `shares-an-office` (`chapter:startRelationships`). The cupboard dispute is in `event:web-office`.
  - Maxim: start value 30 (`chapter:startRelationships`). Maxim made a checklist about the stapler (`dialogue:pavel/stapler/b`).
  - Sola: they check the programme together (`email:visit-programme`, delegate option).
- **Contradictions:**
  - Weak: the `shares-an-office` tag (`chapter:startRelationships`) does not match the staff list, which places Pavel in the Generator Shed (`embassy:staff[2]`) and Lucien on the Rooftop (`embassy:staff[7]`). See Open contradictions.

### Sola Dewrin (sola) — Local Staff Chief

- **Gender:** female (`char:sola`)
- **Workplace:** `embassy`, Embassy
- **Traits:** Allergic to delay; Public servant
- **Wants:** Make the visit work with the staff available.
- **Voice:** Practical and tired of being used as everyone's fixer. She is precise about her limits and sharp about procedure.
  - "I can make the calls. But I am not everybody’s translator and emergency exit." (`char:sola`, `line`)
  - "Three colleagues asked me to 'just translate quickly'. One was a novel. One was a menu. One was a love letter." (`dialogue:sola/translator/a`)
- **Established facts:**
  - Local Staff Chief (`char:sola`). Her duties are the registry, local coordination and diplomatic paperwork (`duties:sola`). Her room is the Registry (`embassy:staff[4]`).
  - Her cousin works in the Protocol Office, can fast-track a landing permit, and wants a visa for his band (`dialogue:sola/cousin/a`). A different cousin, of a supplier, is the source of the diesel she arranges in `email:e3` ("from a cousin of a supplier"). The content does not link the two cousins.
  - Translates Elise's finished proposal and says the partners should have been asked what they need first (`event:staff-sola-elise`).
  - Teaches Ombrazian (lessons for points, no fee; `chapter:hostLanguage.teachers`).
  - Obtains the signed landing permission (`email:visit-clearance`, delegate option), gets version 7.3 of a form from "a drawer that was not on the list" (`email:setback-form`), and moves the place cards (`email:arrival-banquet`).
  - Shares a queue with Ines (`event:web-allies`).
- **Relationships:**
  - Ketu: start value 75 (`chapter:startRelationships`).
  - Ines: start value 70 (`chapter:startRelationships`). They share a queue (`event:web-allies`).
  - Elise (development): start value 35 (`chapter:startRelationships`). They clash over the proposal (`event:staff-sola-elise`; `dialogue:development/sola/a`, "Sola won't speak to me since the 'cultural sensitivity workshop'.").
  - Pavel: they check the programme together (`email:visit-programme`).
- **Contradictions:** None found.

### Elise (development) — Development Counsellor

- **Gender:** female (`char:development`)
- **Workplace:** `embassy`, Embassy
- **Traits:** Public servant; Incurably curious
- **Wants:** Leave a project that local crews can maintain.
- **Voice:** Earnest and practical about the people her projects serve. She is quick to ask who will benefit.
  - "The Minister could visit our project. Provided we remember the people, not just the photograph." (`char:development`, `line`)
  - "I need the Minister to stand next to a well. Not to pose. To understand." (`dialogue:development/wells/a`)
- **Established facts:**
  - Development Counsellor (`char:development`). The character record gives no surname; she is called "Elise" in the content. Her room is the Garden (`embassy:staff[8]`).
  - Wants the Minister to meet project beneficiaries, not just a donor plaque (`event:elise`).
  - Her finished project proposal is the subject of the dispute with Sola (`event:staff-sola-elise`).
  - Commits ƒ150 to the clean-port collection planning and agrees routes with Mira (`event:eu-clean-port`, shared option).
  - Lucien already has a mood board for her project visit (`dialogue:development/wells/a`, choice result).
  - Asks who will actually benefit when a démarche is delivered (`demarche:colleagueLines.development`).
- **Relationships:**
  - Sola: start value 35 (`chapter:startRelationships`), see Sola.
  - Ines: start value 65 (`chapter:startRelationships`).
  - Sola asks the player to take a side: "Elise asks you to support her plan over Sola’s." (`event:web-side`).
- **Contradictions:** None found. (A pump date in her well tree is a setting issue, see Open contradictions.)

### Bianca Montefiore (bianca) — Defence Attaché

- **Gender:** female (`char:bianca`)
- **Workplace:** `embassy`, Embassy (her room is the Motor Pool, `embassy:staff[1]`)
- **Traits:** Everything is urgent; Keeper of the seating plan
- **Wants:** Keep the motorcade under a clear chain of command.
- **Voice:** Brisk and operational. She wants vehicles and procedure rather than presentation, and she takes orders seriously.
  - "A convoy needs vehicles, not a beautifully formatted spreadsheet." (`char:bianca`, `line`)
  - "Convoy plan. Seven cars. Two decoys. One goat, for local credibility." (`dialogue:bianca/convoy/a`)
- **Established facts:**
  - Defence Attaché (`char:bianca`, `embassy:staff[1]`). Her duties are defence liaison and security reporting (`duties:bianca`).
  - The convoy plan includes a goat for "local credibility" (`dialogue:bianca/convoy/a`). The goat is named "Attaché" if you keep it (`dialogue:bianca/convoy/b`, choice result).
  - Books the escort with the Desk's liaison (`email:visit-motorcade`, delegate option) and finds a route that crosses the parade only twice (`email:setback-parade`, delegate option).
  - Gatekeeper for the route reconnaissance step (`chapter:missionSteps.security.route-recon`).
  - Lucien's "visually optimised" convoy spreadsheet, with a sunset gradient, is the source of a running dispute (`dialogue:bianca/spreadsheets/a`).
  - An email addressed to "Colonel Montefiore" says she attends a lunch with a tank model (`email:e6`, delegate option). The rank does not appear in any role field. See Open contradictions.
  - Call-in: asks you to review an exercise plan (`event:call-in-bianca`).
- **Relationships:**
  - Anselm: start value 65 (`chapter:startRelationships`). Two final versions (`event:web-team`).
  - Lucien: the convoy spreadsheet dispute (`dialogue:bianca/spreadsheets/a`).
- **Contradictions:**
  - Date conflict: `dialogue:bianca/convoy/b` says "Field-tested in 2011. Do not ask about 2012." The chapter is set in 2006 (`chapter:year`, `chapter:era`). See Open contradictions.

### Ines Thibault-Lund (ines) — Consul

- **Gender:** female (`char:ines`)
- **Workplace:** `embassy`, Embassy (her room is the Consular Section, `embassy:staff[3]`)
- **Traits:** Public servant; Believes in the process
- **Wants:** Reduce the consular queue without losing its paperwork.
- **Voice:** Dry and overworked. She reports the queue numerically and does not pretend it will go away.
  - "Four hundred people in the queue. No, they do not disappear when the Minister arrives." (`char:ines`, `line`)
  - "There is a man in the visa queue who claims to be the Minister's cousin. He has a photo. It's a painting." (`dialogue:ines/queue/a`)
- **Established facts:**
  - Consul (`char:ines`, `embassy:staff[3]`). Her duties are consular cases and the public counter (`duties:ines`).
  - The queue is 400 people (`email:e8`). She has issued a queue number to an ambassador (`gossip:consular-queue`, true).
  - A painting of the Minister on a horse, fighting a dragon, becomes the embassy mascot. Ines denies involvement (`dialogue:ines/queue/b`, choice result).
  - Capital wants her at the airport to "wave" (`dialogue:ines/consular/a`).
  - Submits the stamp request through the consular channel (`email:visit-stamp`, delegate option).
- **Relationships:**
  - Sola: start value 70 (`chapter:startRelationships`); they share a queue (`event:web-allies`).
  - Elise: start value 65 (`chapter:startRelationships`).
- **Contradictions:** None found.

### Lucien Falk (press) — Digital & Public Diplomacy Officer

- **Gender:** male (`char:press`)
- **Workplace:** `embassy`, Embassy (his room is the Rooftop, `embassy:staff[7]`)
- **Traits:** Reception regular; Knows everyone
- **Wants:** Get the visit photographed from its best side.
- **Voice:** Image-first and cheerful about risk. He writes slogans and then worries about Legal.
  - "A good photograph is worth a thousand words. Legal would prefer zero." (`char:press`, `line`)
  - "Hashtag for the visit: #BellaLuxeMoment. Or #MinisterialVibes. Legal hates both." (`dialogue:press/hashtag/a`)
- **Established facts:**
  - Digital & Public Diplomacy Officer (`char:press`, `embassy:staff[7]`). His duties are public diplomacy and media updates (`duties:press`).
  - Compiles the local press each morning, or Maxim does (`briefing:sections[7]`).
  - Is the source of three gossip items: fuel-quay, reshuffle and clean-port, all marked false (`gossip:fuel-quay`, `gossip:reshuffle`, `gossip:clean-port`).
  - Filed Pavel's cupboard as a media asset (`gossip:office-cupboard`, half-true).
  - Says Bako wants a constituency visit before the port announcement (`dialogue:press/port-background`, choice result).
  - The Deputy Foreign Minister wants a selfie with the cat, and Lucien needs approval (`dialogue:press/selfie/a`).
- **Relationships:**
  - Pavel: start value 35, tag `shares-an-office` (`chapter:startRelationships`).
  - Bako: the constituency story (`dialogue:press/port-background`).
- **Contradictions:**
  - Weak: see Pavel. The tag `shares-an-office` does not match his room on the Rooftop (`embassy:staff[7]`).

### Maxim (maxim) — Intern

- **Gender:** male (`char:maxim`)
- **Workplace:** `embassy`, Embassy (his room is the Server Room, `embassy:staff[6]`)
- **Traits:** Allergic to delay; Incurably curious
- **Wants:** Turn this internship into a recommendation.
- **Voice:** Eager and earnest, with a habit of making lists. He is cheerful about his own lack of clout.
  - "I made a checklist of the checklists. Is that useful?" (`char:maxim`, `line`)
  - "Do you think I'll be an ambassador one day? I already practise waving." (`dialogue:maxim/future/a`)
- **Established facts:**
  - Intern (`char:maxim`, `embassy:staff[6]`). Technical support and filing (`duties:maxim`).
  - Makes a checklist of checklists, then loses it (`dialogue:maxim/checklist/a`). Laminates everything (`dialogue:maxim/checklist/a`, choice result).
  - Reads the manual aloud to the queue, which does not help (`email:e8`, delegate option).
  - Compiles the morning press, or Lucien does (`briefing:sections[7]`). His translation of the fuel-quay clipping is `press:0` (its `maxim` field).
  - Visits the wrong ministry and files a detailed account when sent on a démarche (`demarche:colleagueLines.maxim`).
  - Waves with such joy that it makes the evening news (`dialogue:ines/consular/a`, choice result).
- **Relationships:**
  - Pavel: start value 30 (`chapter:startRelationships`).
- **Contradictions:** None found.

### Ketu Marrimba (ketu) — Embassy Chef

- **Gender:** female (`char:ketu`)
- **Workplace:** `embassy`, Embassy (her room is the Kitchen, `embassy:staff[5]`)
- **Traits:** Quiet observer; Knows everyone
- **Wants:** Serve dinner before the meeting overruns.
- **Voice:** Dry and unflappable. She accepts every absurd request and then points out its cost.
  - "I can feed the delegation. I cannot feed its ego." (`char:ketu`, `line`)
  - "The Minister's office sent dietary requirements: 'no garlic, no gluten, no foreign words on the menu'." (`dialogue:ketu/menu/a`)
- **Established facts:**
  - Embassy Chef (`char:ketu`). Her duties are kitchen preparation and embassy meals (`duties:ketu`). The embassy record calls her "Chef" (`embassy:staff[5]`).
  - Prepares the embassy lunch (`venue:embassy`, "assembled by Ketu") and drafts the guest list with the menu in mind (`email:visit-guestlist`, delegate option).
  - Calls the garlic "an aromatic diplomatic misunderstanding" (`payoff:menu-garlic`).
  - Suggested "fish soup with ambition" in place of a French dish (`dialogue:ketu/menu/b`), which became the visit's diplomatic triumph (`payoff:menu-gold`).
  - Bakes a pie-chart cookie that is 17.6% chocolate (`dialogue:ketu/cookies/a`, choice result).
  - Is a knower of three gossip items: seating, receipts and consular-queue (`gossip:seating`, `gossip:receipts`, `gossip:consular-queue`).
- **Relationships:**
  - Sola: start value 75 (`chapter:startRelationships`).
- **Contradictions:** None found.

## Host officials

### Director Ndao (protocol) — Local Protocol Director

- **Gender:** male (`char:protocol`)
- **Workplace:** `ministry`, Foreign Ministry / Protocol
- **Traits:** Keeper of the seating plan; Believes in the process
- **Wants:** Keep the visiting delegation in the approved order.
- **Age:** 64 (`char:protocol`)
- **Voice:** Formal, rule-bound and quietly sardonic about forms. He answers with procedure and small ceremonial gestures.
  - "Permission has three stamps. You have submitted two and a coffee stain." (`char:protocol`, `line`)
  - "Your landing permit has two stamps and a coffee ring. The coffee ring is not an official stamp. Yet." (`dialogue:protocol/stamps/a`)
- **Established facts:**
  - Local Protocol Director (`char:protocol`). His office stamps your arrival confirmation "slowly, with feeling" (`email:visit-stamp`, reply option).
  - Calls about a seating plan with a decorative fern: the Deputy Minister sits behind it (`event:seating-complaint`).
  - Asks you to review a seating chart as a favour (`event:call-in-protocol`).
  - Mentor to Mira (`chapter:startRelationships`, tag `mentor`; `gossip:protocol-apprentice`, true).
  - Gossip says Ndao has already selected the next minister (`gossip:reshuffle`, false).
  - The seating compromise gives Ndao a favour owed to you (`event:seating-apology-followup`, compromise option).
  - Gatekeeper for the protocol stamp and the motorcade steps (`chapter:missionSteps.clearance.protocol-stamp`, `chapter:missionSteps.security.motorcade`).
- **Relationships:**
  - Mira: start value 65, tag `mentor` (`chapter:startRelationships`; `event:web-mentor`).
  - Bako: start value 30 (`chapter:startRelationships`). They are the two officials "who are not speaking" beside one microphone (`event:web-seating`).
- **Contradictions:** None found.

### Mira Sene (port-officer) — Ombrazian Port Environment Officer

- **Gender:** female (`char:port-officer`)
- **Workplace:** `ministry`, Foreign Ministry / Protocol
- **Traits:** Public servant; Allergic to delay
- **Wants:** Keep the port clean without overlooking its crews.
- **Age:** 49 (`char:port-officer`)
- **Voice:** Blunt and practical about the port. She cares about crews more than photographs.
  - "The port needs a working waste collection, not another photograph of an empty bin." (`char:port-officer`, `line`)
  - "Mira says port crews have practical ideas but rarely appear in project announcements." (`dialogue:port-officer/crews/a`)
- **Established facts:**
  - Ombrazian Port Environment Officer (`char:port-officer`). She controls the inspection timetable (`press:4`, and `event:fuel-quay`).
  - Has an inspection timetable and a warning about fuel deliveries (`event:fuel-quay`, requires flag `fuel-lead`, expires day 10).
  - Coordinates inspected fuel deliveries (`press:8`).
  - Gatekeeper for the lounge reservation and the guest-list steps (`chapter:missionSteps.lounge`). Offers a favour route in exchange for a clean-port statement (`chapter:missionSteps.lounge.reservation`, route `mira`).
  - Gossip: she reserved all the fuel for visiting delegations (`gossip:fuel-quay`, false). She cancelled the clean-port programme (`gossip:clean-port`, false).
  - Learned protocol from Ndao (`gossip:protocol-apprentice`, true, overheard).
- **Relationships:**
  - Ndao: start value 65, tag `mentor` (`chapter:startRelationships`).
  - Fixer (Marcel): start value 30 (`chapter:startRelationships`), no content beyond that.
  - Elise and the crews: the clean-port collection (`event:eu-clean-port`).
- **Contradictions:** None found.

### Minister Bako (golf) — Deputy Foreign Minister

- **Gender:** male (`char:golf`)
- **Workplace:** `golf`, Precedence Golf Club
- **Traits:** Keeper of the seating plan; Remembers everything
- **Wants:** Keep the reception on the proper course.
- **Age:** 62 (`char:golf`)
- **Voice:** Jovial and evasive. He treats business as a game, with bets and jokes about his caddie.
  - "An appointment? My secretary says I am unavailable. My caddie disagrees." (`char:golf`, `line`)
  - "A friendly bet: if I sink this putt, your Minister visits my constituency. If I miss, you buy dinner." (`dialogue:golf/bet/a`)
- **Established facts:**
  - Deputy Foreign Minister (`char:golf`, `press:2`, `dialogue:press/selfie/a`). The name in the data is "Minister Bako".
  - Wants a constituency visit before the port announcement (`dialogue:press/port-background`; `press:5`). The constituency stop is in the revised programme (`press:39`).
  - Gatekeeper for the host-agreement step (`chapter:missionSteps.programme.host-agreement`). His favour route for the host agreement requires an existing favour owed to him (`chapter:missionSteps.programme.host-agreement`, route `bako`).
  - Calls in a favour for a constituency briefing (`event:call-in-golf`).
  - Objects to the chair beside the window (`gossip:seating`, half-true).
  - Delighted by the cat selfie (`dialogue:press/selfie/a`, choice result).
  - Is one of the two parties in a dinner-signature dispute with Ambassador Velen (`event:web-dinner`).
- **Relationships:**
  - Ndao: start value 30 (`chapter:startRelationships`; `event:web-seating`).
  - Ambassador Velen: start value 30 (`chapter:startRelationships`; `event:web-dinner`).
- **Contradictions:** None found.

## EU cast

### Celeste Norren (eu) — Head of the EU Delegation

- **Gender:** female (`char:eu`)
- **Workplace:** `eu`, EU Delegation
- **Traits:** Team Europe enthusiast; Reception regular
- **Wants:** Get Team Europe credit for a common initiative.
- **Voice:** Smooth and institutional, with a pointed joke about the 17.6% premise. She puts everything in the minutes.
  - "Yes, Bellaluxe contributes 17.6% of the EU's Multiannual Financial Framework. No, that is not your biscuit quota." (`char:eu`, `line`)
  - "Yes, Bellaluxe contributes 17.6% of the EU's Multiannual Financial Framework. That does not entitle you to 17.6% of the biscuits, speaking time and meeting chairs. Please do not bring a calculator again." (`dialogue:eu/cookies/a`)
- **Established facts:**
  - Head of the EU Delegation, who convenes the meeting (`eu-rep:eu`; `event:eu-budget-share-meeting`).
  - Proposes the Team Europe clean-port initiative, with the Delegation's announcement crediting the Delegation (`event:eu-clean-port`; `dialogue:eu/team-europe/a`).
  - Gossip: she has branded the rain as Team Europe (`gossip:team-europe`, half-true).
  - Puts your refusal in the minutes (`char:eu`, `refusalGreeting`).
  - Signs a common letter when asked (`event:web-partners`).
  - Her favour route is the EU Delegation route in the mission (`chapter:missionSteps`, route `europe`, needs trust 45).
- **Relationships:**
  - France (Henri): start value 70 (`chapter:startRelationships`).
  - Germany (Klaus): start value 65 (`chapter:startRelationships`).
- **Contradictions:** None found.

### Ambassador Niko Arden (amb-asteria) — Ambassador of Denmark

- **Gender:** male (`char:amb-asteria`)
- **Workplace:** `eu`, EU Delegation
- **Traits:** Quiet observer; Believes in the process
- **Wants:** Keep the Danish mission represented at every meeting.
- **Voice:** Quiet and dry. He compares coffee cups and footnotes, and he is pleased with small victories.
  - "Denmark supports consensus, provided someone else writes the first draft." (`char:amb-asteria`, `line`)
  - "Denmark has agreed to the EU consensus, subject to a footnote longer than the consensus." (`dialogue:amb-asteria/consensus/a`)
- **Established facts:**
  - Ambassador of Denmark, resident representative (`eu-rep:amb-asteria`).
  - Hosts Denmark's national-day reception at the EU Delegation while the residence is repainted (`invite:5`).
  - Invites colleagues to a coffee with a single agenda item (`invite:3`).
  - Counted the coffee cups at the last EU meeting (`dialogue:amb-asteria/coffee/a`).
  - Offers a joint statement after coffee (`event:asteria-coffee-followup`, requires `asteria-coffee`, see Open contradictions).
- **Relationships:**
  - None in the start relationships. Content: works with the EU Delegation on the joint statement (`payoff:asteria-compromise`).
- **Contradictions:** None found.

### Klaus Weber (eu-germany) — German Ambassador

- **Gender:** male (`char:eu-germany`)
- **Workplace:** `eu`, EU Delegation
- **Traits:** Template enthusiast; Believes in the process
- **Wants:** Use the approved template for every joint note.
- **Voice:** Procedural and fond of annexes. He is proud of the paperwork and dislikes a loose draft.
  - "The coordination table is in Annex IV. The chairs have their own annex." (`char:eu-germany`, `line`)
  - "I have reduced the meeting agenda to one page. The annex explaining the reduction is twelve pages." (`dialogue:eu-germany/annex/a`)
- **Established facts:**
  - German Ambassador, resident representative (`eu-rep:eu-germany`).
  - Keeps a template for the joint logo (`gossip:letterhead`, true).
  - Put the stopwatch in an annex (`event:eu-budget-share-meeting`).
  - Proposes an equal first round, subject to an annex (`event:eu-budget-share-reform-followup`).
  - Former couple with Henri: start value 25, tag `former-couple` (`chapter:startRelationships`). They must co-sign a letter (`event:web-partners`).
- **Relationships:**
  - France (Henri): start value 25, tag `former-couple` (`chapter:startRelationships`).
  - Celeste: start value 65 (`chapter:startRelationships`).
- **Contradictions:** None found.

### Henri de Valois (eu-france) — French Ambassador

- **Gender:** male (`char:eu-france`)
- **Workplace:** `eu`, EU Delegation
- **Traits:** Credits self; Keeper of the seating plan
- **Wants:** Have the French signature recognised first.
- **Voice:** Courteous and precise, with a fondness for French phrasing and a concern for who signs first.
  - "The draft is acceptable in principle. In French, the principle is considerably more elegant." (`char:eu-france`, `line`)
  - "The French draft calls the meeting cordial. Henri says the English version has made it sound affectionate." (`dialogue:eu-france/translation/a`)
- **Established facts:**
  - French Ambassador, resident representative (`eu-rep:eu-france`).
  - Wants to reach the host ministry before it closes (`event:eu-budget-share-meeting`).
  - Holds a screwdriver beside a printer that has refused three requests (`dialogue:eu-france/printer/a`).
  - Gossip: he is a knower of the letterhead gossip (`gossip:letterhead`).
- **Relationships:**
  - Germany (Klaus): former couple (`chapter:startRelationships`, value 25).
  - Celeste: start value 70 (`chapter:startRelationships`).
- **Contradictions:** None found.

### Tanya Farrugia (eu-malta) — Maltese Ambassador

- **Gender:** female (`char:eu-malta`)
- **Workplace:** `eu`, EU Delegation
- **Traits:** Quiet observer; Incurably curious
- **Wants:** Make sure the smaller missions are heard.
- **Voice:** Precise and generous. She speaks for others as well as for Malta and makes the smaller briefs heard.
  - "I have Malta's brief and, with permission for this meeting, the briefs from Cyprus and Luxembourg. They agree on the biscuits, at least." (`char:eu-malta`, `line`)
  - "Tanya taps an intricate rhythm on the meeting table. It is the most decisive thing the table has heard all morning." (`dialogue:eu-malta/drums/a`)
- **Established facts:**
  - Maltese Ambassador, authorised by Cyprus and Luxembourg to present their briefs at the 17.6% meeting (`eu-rep:eu-malta`; `event:eu-budget-share-meeting`).
  - Cyprus's paragraph is left out if you claim the speaking time (`event:eu-budget-share-claim-followup`).
  - Cyprus has authorised an amendment after you share the time (`event:eu-budget-share-share-followup`).
  - Describes an old band and offers a louder reception (`dialogue:eu-malta/drums/a`, choice result).
  - Knows the team-europe gossip (`gossip:team-europe`).
- **Relationships:**
  - Sweden (Lars): start value 70 (`chapter:startRelationships`).
- **Contradictions:** None found.

### Lars Lindqvist (eu-sweden) — Swedish Ambassador

- **Gender:** male (`char:eu-sweden`)
- **Workplace:** `eu`, EU Delegation
- **Traits:** Public servant; Cautious operator
- **Wants:** Turn the discussion into an actual programme.
- **Voice:** Careful and dry. He asks who has been left out before deciding anything.
  - "Before we decide who speaks, perhaps we should ask who has not been invited." (`char:eu-sweden`, `line`)
  - "Lars has marked every absent mission on the agenda. There are more pencil notes than agenda items." (`dialogue:eu-sweden/agenda/a`)
- **Established facts:**
  - Swedish Ambassador, resident representative (`eu-rep:eu-sweden`).
  - Marks authorised proxies and leaves the rest blank until they respond (`dialogue:eu-sweden/agenda/a`, choice result).
  - Runs an evening card game that is "strictly informal" (`dialogue:eu-sweden/cards/a`).
- **Relationships:**
  - Malta (Tanya): start value 70 (`chapter:startRelationships`).
- **Contradictions:** None found.

## Others

### Marcel Deux (fixer) — Unofficial intermediary

- **Gender:** male (`char:fixer`)
- **Workplace:** `bar`, The Quiet Amendment
- **Traits:** Knows everyone; Cautious operator
- **Wants:** Be consulted before anyone finds an official shortcut.
- **Voice:** Suave and knowing. He offers shortcuts in a tone that makes them sound like favours he is granting.
  - "Everything is possible. The question is who owes whom afterwards." (`char:fixer`, `line`)
  - "Rumour says your Minister snores in meetings. I could… adjust that rumour." (`dialogue:fixer/rumour/a`)
- **Established facts:**
  - Unofficial intermediary (`char:fixer`). The bar is named "The Quiet Amendment" (`location:bar`).
  - Explains the supplier connection starting on day 2 (`event:supplier`, `event:supplier-followup`). The supplier's invoice is for chairs that have not arrived (`gossip:supplier`, true).
  - Offers expedited routes for money at several steps: cash 300 for the protocol stamp and the motorcade, cash 200 for the lounge reservation, lounge guest list and route reconnaissance (`chapter:missionSteps`, routes `marcel`).
  - Calls in a favour: sit through a supplier meeting (`event:call-in-fixer`).
  - Can arrange a cancellation at the VIP lounge (`dialogue:fixer/lounge/a`).
  - Teaches Ombrazian as the "Fixer's taxi" (`chapter:hostLanguage.teachers`).
  - Is a knower of the reshuffle and clean-port gossip (`gossip:reshuffle`, `gossip:clean-port`).
- **Relationships:**
  - Mira: start value 30 (`chapter:startRelationships`), no content beyond that.
- **Contradictions:** None found.

### Ruth Vale (journalist) — Press correspondent

- **Gender:** female (`char:journalist`)
- **Workplace:** `pressclub`, Press Correspondents Club
- **Traits:** Incurably curious; Knows everyone
- **Wants:** Find the story behind the official statement.
- **Voice:** Sharp and dry, enjoying the distance between quote and fact. She keeps score of promises.
  - "Off the record is an agreement, not something you say after the quote." (`char:journalist`, `line`)
  - "Off the record: is it true your embassy owns a parrot that knows the server password?" (`dialogue:journalist/offrecord/a`)
- **Established facts:**
  - Press correspondent (`char:journalist`). Her column is "Ruth Vale's foreign column" (`press.json`, `outlets[2]`).
  - Offers a longer conversation at the Press Correspondents Club from day 2 (`event:press`).
  - Says "You're buying, right?" and remembers the diplomat's choice (`dialogue:journalist/drinks/a`).
  - Writes about the visit in several clippings; these are attributed to her outlet ("vale") (for example `press:10`, `press:24`, `press:44`).
  - Is a knower of seven gossip items (`gossip:fuel-quay`, `gossip:reshuffle`, `gossip:seating`, `gossip:letterhead`, `gossip:protocol-apprentice`, `gossip:clean-port`, `gossip:team-europe`).
- **Relationships:**
  - None in the start relationships. Content: Lucien's hashtag jokes include her ("Even Ruth Vale admits it's decent.", `dialogue:press/hashtag/b`).
- **Contradictions:** None found.

### Dr Amara Chen (un) — UN Resident Coordinator

- **Gender:** female (`char:un`)
- **Workplace:** `un`, UN House & multilateral circuit
- **Traits:** Believes in the process; Public servant
- **Wants:** Publish a joint development plan.
- **Voice:** Diplomatic and tired of logos. She is honest about what agencies can and cannot agree.
  - "We can support the programme. We cannot promise six agencies will agree on one logo." (`char:un`, `line`)
  - "Six agencies. One programme. Each wants its logo bigger than the others." (`dialogue:un/logo/a`)
- **Established facts:**
  - UN Resident Coordinator (`char:un`). Hosts the UN development roundtable and the final coordination (`invite:2`, `invite:6`).
  - Can discuss the programme at UN House from day 3 (`event:elise`, choice result).
  - Reserves a project visit with the community and revises the programme so the community can speak (`event:development-beneficiaries-followup`).
  - Shows you the proposed photo stop (`event:development-photo-followup`).
  - The Minister's office asks what "UNDAF-PPCC-WGSD" stands for (`dialogue:un/acronyms/a`). "Dr Chen notes your generosity and your ego in the same memo." (`dialogue:un/logo/a`, choice result).
- **Relationships:**
  - None in the start relationships. Content: works with Elise on the project (`event:elise`).
- **Contradictions:** None found.

### Idra Venn (un-coordinator) — UN Programme Logistics Officer

- **Gender:** male (`char:un-coordinator`)
- **Workplace:** `un`, UN House & multilateral circuit
- **Traits:** Template enthusiast; Believes in the process
- **Wants:** Deliver the supplies before the coordination meeting.
- **Voice:** Drily exasperated by paperwork. He notices the gap between donor reports and reality.
  - "The donor reports say the bins have arrived. The bins say they are still in customs." (`char:un-coordinator`, `line`)
  - "Idra is tracking donated bins stuck in customs. Each agency has produced a separate spreadsheet." (`dialogue:un-coordinator/customs/a`)
- **Established facts:**
  - UN Programme Logistics Officer (`char:un-coordinator`).
  - Tracks donated bins stuck in customs (`dialogue:un-coordinator/customs/a`).
  - Wants local crews involved before donors announce another programme (`dialogue:un-coordinator/handover/a`).
  - Points to the empty maintenance line in the budget (`dialogue:un-coordinator/handover/a`, choice result).
- **Relationships:**
  - None in the start relationships or in the content.
- **Contradictions:** None found.

### Sofia da Costa (bar-insurer) — Portuguese Maritime Liaison

- **Gender:** female (`char:bar-insurer`)
- **Workplace:** `bar`, The Quiet Amendment
- **Traits:** Guards receipts; Cautious operator
- **Wants:** Make sure the quay and its cargo are insured.
- **Voice:** Careful and businesslike. She asks for evidence before offering introductions.
  - "I can introduce you to the insurers. First tell me who actually maintains the harbour." (`char:bar-insurer`, `line`)
  - "Sofia knows which insurers will cover port cargo, but needs reliable collection records before recommending a contract." (`dialogue:bar-insurer/insurance/a`)
- **Established facts:**
  - Portuguese Maritime Liaison (`char:bar-insurer`). She is not listed in the EU representation (`eu-rep`).
  - Needs collection records before recommending insurance (`dialogue:bar-insurer/insurance/a`). Asks whether your promise is insured (`dialogue:bar-insurer/insurance/a`, choice result).
  - Organises a Portuguese reception and is deciding between an insurer and a musician for the last seat (`dialogue:bar-insurer/music/a`).
- **Relationships:**
  - None in the start relationships or in the content.
- **Contradictions:** None found.

### Ambassador Mara Velen (amb-valdoria) — Ambassador of Valdoria

- **Gender:** female (`char:amb-valdoria`)
- **Workplace:** `golf`, Precedence Golf Club
- **Traits:** Keeper of the seating plan; Reception regular
- **Wants:** Secure a seat that confirms the mission's importance.
- **Voice:** Witty and sharp about ceremony. She is wry about speeches and locked doors.
  - "My national-day speech was eight minutes. The applause was longer because the exit was locked." (`char:amb-valdoria`, `line`)
  - "Valdoria's national anthem has seven verses. Protocol insists the reception cannot begin until the choir has found the last one." (`dialogue:amb-valdoria/anthem/a`)
- **Established facts:**
  - Ambassador of Valdoria (`char:amb-valdoria`). Hosts the Valdorian national-day reception and a colleagues' lunch, both at the golf club (`invite:1`, `invite:4`).
  - Her seating plan has a reserved chair for each ambassador (`dialogue:amb-valdoria/seating/a`).
  - Sends a "Light lunch?" invitation to a colleague (`email:e6`).
  - Is the other party in the dinner-signature dispute with Bako (`event:web-dinner`).
- **Relationships:**
  - Bako: start value 30 (`chapter:startRelationships`; `event:web-dinner`).
- **Contradictions:** None found.

## Setting facts

- **Player country: Bellaluxe.** The posting comes from the "Personnel Directorate · Republic of Bellaluxe" (`briefing:from`). The embassy is "Embassy of Bellaluxe, Port Hesperia" (`chapter:post`). Bellaluxe is the fictional home country (`WRITING_GUIDE.md`, Setting rules).
- **Host country: Ombrazia.** The host foreign ministry is "Ministry of Foreign Affairs of Ombrazia" (`email:e5`). The host language is Ombrazian (`chapter:hostLanguage`). Ombrazia is fictional (`WRITING_GUIDE.md`, Setting rules).
- **City: Port Hesperia** (`chapter:city`). The embassy is there (`chapter:post`).
- **Player rank:** "Chargé d'Affaires a.i." (`chapter:playerRank`). The briefing calls the player "Deputy Head of Mission, now Acting Head of Mission" (`briefing:intro`). The Ambassador is absent and is not one of the 24 characters.
- **Length:** 15 days (`chapter:days`). The Minister arrives on Day 15 (`email:e10`). The Ombrazian exam is on Day 13 (`chapter:hostLanguage.exam`).
- **The 17.6% premise.** Bellaluxe contributes 17.6% of the EU's Multiannual Financial Framework (`char:eu`, `line`; `event:eu-budget-share-meeting`; `event:cookies`). The premise is an in-universe comic device and is not a claim about a real member state (`GAME_DESIGN.md`, "Period and diplomatic satire"). It recurs as speaking time, biscuits and credit (`event:eu-budget-share-meeting`; `dialogue:eu/cookies/a`; `WRITING_GUIDE.md`, "The 17.6% budget share").
- **Year and era: 2006.** `chapter:year` is 2006 and `chapter:era` is "2006". `GAME_DESIGN.md` says the default setting is around 2006. The content contains later dates (see Open contradictions).
- **Technology.** Capital writes by secure fax at the embassy only; ordinary mail goes to the office PC; the BlockBerry carries the diary and round reports (`briefing:sections[0]`). The rooftop dish's note reads "A direct line to Capital. Unfortunately." (`embassy:rooms[3]`). Fictional services: "Chirper" (`email:e9`), "Chercheur" (`dialogue:anselm/networking/a`). "Team Europe" is a deliberate anachronism (`GAME_DESIGN.md`).
- **Currency and points.** Amounts are shown in ƒ (`event:eu-clean-port`). Diplo-Points (DP) are four per block (`briefing:sections[1]`).
- **EU members present.** The EU Delegation (Celeste Norren, `eu`), Denmark (Niko Arden, `amb-asteria`), Germany (Klaus Weber, `eu-germany`), France (Henri de Valois, `eu-france`), Malta (Tanya Farrugia, `eu-malta`) and Sweden (Lars Lindqvist, `eu-sweden`). Real EU member names are used (`WRITING_GUIDE.md`).
- **EU members absent and their representation.** Cyprus and Luxembourg are absent. Malta presents their briefs at the 17.6% meeting (`eu-rep:eu-malta`; `event:eu-budget-share-meeting`; `dialogue:eu-malta/two-briefs/a`). The other members are listed in `eu-representation.json` as "resident representative".
- **Other EU-country presence.** Sofia da Costa (`bar-insurer`) is "Portuguese Maritime Liaison". She is not in the EU representation file.
- **Non-EU and fictional states.** Valdoria (`amb-valdoria`) is fictional and is not an EU member. The UN appears as "UN House" with six agencies (`dialogue:un/logo/a`).
- **Host officials.** Director Ndao (protocol), Mira Sene (port-officer) and Deputy Foreign Minister Bako (golf).
- **Examiner.** "Director Vela" is the Ombrazian examiner (`chapter:hostLanguage.exam.examiner`). The examiner is not one of the 24 characters.
- **Recurring objects.** The cat, which "has assumed responsibility" for the Ambassador's office (`embassy:rooms[0]`). The registry parrot, which "knows the password" (`embassy:rooms[2]`). Both appear as staff (`embassy:staff[9]`, `embassy:staff[10]`).

## Open contradictions

Every contradiction found in the sections above, plus content issues found while reading the sources.

**About characters**

1. **Pronouns for the visiting Minister (not one of the 24).** `email:e10` says "Please confirm the Ambassador will greet her personally", which makes the Minister female. `email:arrival-programme` (option note) says "The Minister's aide supplies a programme of his own", which makes the Minister male. Source ids: `email:e10` and `email:arrival-programme`.
2. **Pavel and Lucien: shared office versus separate rooms (weak).** `chapter:startRelationships` tags them `shares-an-office`. `embassy:staff[2]` puts Pavel in the Generator Shed and `embassy:staff[7]` puts Lucien on the Rooftop. The content calls the shared space a cupboard (`event:web-office`, `gossip:office-cupboard`), so the two may not be in conflict. Source ids: `chapter:startRelationships`, `embassy:staff[2]`, `embassy:staff[7]`.
3. **Anselm and press monitoring (weak).** `duties:anselm` gives "Political reporting and press monitoring" to Anselm. `briefing:sections[7]` says Lucien "compiles the local press, or Maxim the intern does". Source ids: `duties:anselm`, `briefing:sections[7]`.
4. **Bianca's rank (weak, a title only).** `email:e6` and `mail:e6` refer to "Colonel Montefiore". `char:bianca` gives the role "Defence Attaché" and no rank. Source ids: `email:e6`, `mail:e6`, `char:bianca`.

**About setting and dates**

5. **Dates after the 2006 setting.** `chapter:year` and `chapter:era` are 2006. `dialogue:bianca/convoy/b` says "Field-tested in 2011. Do not ask about 2012." and offers the choice "What happened in 2012?". Source ids: `chapter:year`, `dialogue:bianca/convoy/b`.
6. **A pump dated 2009 and 2010.** `dialogue:development/wells/b` says the pump "was donated in 2009, broke in 2010". Source ids: `chapter:year`, `dialogue:development/wells/b`.

**Other content issues (not about one person)**

7. **Copied garbled text.** `gossip:protocol-apprentice`, `gossip:office-cupboard` and `gossip:briefing` all carry the same garbled text: "You heard that a meeting had been cancelled because the minutes requested leave." It does not match the content of any of the three.
8. **Missing parent event.** `event:asteria-coffee-followup` and `event:asteria-coffee-delegated-followup` require `requiresChoice.eventId` "asteria-coffee". No event with that id exists in `campaign.json`.
9. **Shared name, different costs.** The location `location:bar` and the venue `venue:shady` are both called "The Quiet Amendment". Their costs are 200 and 80. The data does not say whether they are the same place.
