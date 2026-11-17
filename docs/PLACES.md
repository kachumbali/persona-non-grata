# Places bible: Port Hesperia 2006

Reference for the seven places in `campaign.json` (`locations`), plus the six venues. Everything is taken from the existing content. Source ids follow the key in `docs/CAST.md`. "Event tagged here" means the event's `location` field names the place. "Event based here" means the event has no `location` but its `npc` is located here; those are listed separately so the two are not confused.

## Embassy (`embassy`)

- **What it is:** the Bellaluxe embassy in Port Hesperia, and the player's starting place. The description is "Your team, your in-tray, your responsibility." (`location:embassy`). The start location and office are `embassy`, and the start room is "office" (`chapter:startLocation`, `chapter:officeLocation`, `chapter:startRoom`).
- **Rooms:** Ambassador's Office, Registry, Server Room, Rooftop Satellite Dish, Chancery, Reception Hall, Kitchen, Generator Shed, Consular Section, Residence Garden, Motor Pool (`embassy:rooms`).
- **Who is usually there:** Anselm, Pavel, Sola, Elise, Bianca, Ines, Lucien, Maxim and Ketu (`char:<id>.location` = `embassy`). The Ambassador is absent, and the cat has "assumed responsibility" for the Ambassador's office (`embassy:rooms[0]`).
- **Who appears in events here:**
  - Event tagged here: `staff-sola-elise`, `staff-sola-consult-followup`, `staff-sola-instruct-followup`, `staff-sola-pause-followup`, `staff-rivalry-mediate-followup`, `staff-rivalry-order-followup`.
  - Event based here (no location tag): `rivalry` (Pavel), `supplier` (Sola), `elise` (Elise), `call-in-bianca` (Bianca), `web-joint`, `web-team`, `web-repair` (Anselm), `web-office` (Pavel), `web-side` and `web-allies` (Sola).
- **What the player can do here:**
  - The work action is "Prepare visit arrangements" (`location:embassy`, `work`).
  - Four arrangements make up the visit: clearance, lounge, programme and security (`chapter:missionTasks`).
  - The route reconnaissance step is gated by Bianca, who is based here (`chapter:missionSteps.security.route-recon`).
  - Capital's démarche board is on the PC (`briefing:sections[4]`).
- **Events, leads and invitations:** the event ids above. No invitations are based here.
- **Atmosphere:** "Every document exists in triplicate. Usually." (`embassy:rooms[1]`, Registry). "Please take a number. Please retain hope." (`embassy:rooms[8]`, Consular Section). The embassy is a place where documents are kept and staff are asked to wait, and the rooms record that.

## Foreign Ministry / Protocol (`ministry`)

- **What it is:** the host ministry's protocol side. The description is "Appointments, landing permissions and wounded precedence." (`location:ministry`).
- **Who is usually there:** Ndao (Local Protocol Director) and Mira Sene (Ombrazian Port Environment Officer) (`char:protocol`, `char:port-officer`).
- **Who appears in events here:**
  - Event tagged here: `clean-port-accept-host`, `clean-port-national-host`, `clean-port-shared-host`, `clean-port-decline-host` (Mira), `seating-apology-followup`, `seating-capital-followup` (Ndao), `fuel-quay` (Mira).
  - Event based here (no location tag): `invitation`, `seating-complaint`, `call-in-protocol` and `web-seating` (Ndao), `web-mentor` (Ndao and Mira).
- **What the player can do here:**
  - The work action is "Negotiate protocol approval". Its listed effects are goodwill 4 and confidence 2; its cost is 0 (`location:ministry`).
  - Gated mission steps: protocol stamp and motorcade, both gated by Ndao (`chapter:missionSteps.clearance`, `chapter:missionSteps.security`); the lounge reservation and guest list, both gated by Mira (`chapter:missionSteps.lounge`).
  - Ndao's favour route needs trust or a favour with Protocol of at least 55 (`chapter:missionSteps`, route `ndao`).
  - Mira's favour route trades a clean-port statement for the lounge step and costs trust with Bako (-10) (`chapter:missionSteps.lounge`, route `mira`, consequences).
  - Démarches for this place: `demarche:0` (fuel inspection, to Mira, director level), `demarche:1` (the clean port, to Mira, desk level), `demarche:2` to `demarche:5` (letterhead, umbrellas, UN resolution, all to Protocol).
- **Events, leads and invitations:** `fuel-quay` is a lead that needs flag `fuel-lead` and expires on day 10 (`event:fuel-quay`). `invitation` is a protocol plaque ceremony on day 1 that "Your absence would be noticed" (`event:invitation`). No invitations in `invitations.json` are based here.
- **Atmosphere:** "Permission has three stamps. You have submitted two and a coffee stain." (`char:protocol`, `line`). "A corrected seating plan is issued, showing the dinner as it occurred and recording it as intended." (`email:arrival-banquet`, ignore text).

## EU Delegation (`eu`)

- **What it is:** the EU's local coordination office, where the joint positions are made. The description is "Coordination, contested clauses and exactly 17.6% of the refreshments." (`location:eu`).
- **Who is usually there:** Celeste Norren (Head of the EU Delegation), Niko Arden (Denmark), Klaus Weber (Germany), Henri de Valois (France), Tanya Farrugia (Malta) and Lars Lindqvist (Sweden) (`char:<id>.location` = `eu`).
- **Who appears in events here:**
  - Event tagged here: `eu-budget-share-meeting` (day 1), `eu-clean-port` (day 2), `asteria-coffee-followup` and `asteria-coffee-delegated-followup` (day 9, both Niko).
  - Event based here (no location tag): `eu-budget-share-claim-followup` and `eu-budget-share-share-followup` (Tanya), `eu-budget-share-reform-followup` (Klaus), `cookies` and `call-in-eu` (Celeste), `web-partners` (Henri).
- **What the player can do here:**
  - The work action is "Build a coalition". Its listed effects are confidence 3 and goodwill 1; its cost is 0 (`location:eu`).
  - Mission routes through the Delegation (`route europe`) are available in four steps: protocol stamp, lounge reservation, guest list and programme. Each needs trust of at least 45 with Celeste and costs 1 DP and a delay of one day (`chapter:missionSteps`).
  - Each démarche can be sent as a joint EU démarche (`demarche:0` to `demarche:7`, route kind `eu`).
- **Events, leads and invitations:**
  - Invitations based here: `invite:0` (EU coordination meeting, Celeste), `invite:3` (Danish coordination coffee, Niko) and `invite:5` (Danish national-day reception, Niko). The national-day reception is held at the Delegation while the Danish residence is repainted.
  - The two Niko follow-ups need the event `asteria-coffee`, which is not in the data (see Open items).
- **Atmosphere:** "Celeste slides the biscuit plate towards you." (`event:cookies`, text). "The room braces itself." (`event:cookies`, text). The room is a place of small, deliberate formality.

## The Quiet Amendment (`bar`)

- **What it is:** a bar where unofficial favours are done. The description is "Rumours and favours that never quite stay unofficial." (`location:bar`).
- **Who is usually there:** Marcel Deux (unofficial intermediary) and Sofia da Costa (Portuguese Maritime Liaison) (`char:fixer`, `char:bar-insurer`).
- **Who appears in events here:**
  - Event tagged here: `supplier-followup` and `supplier-accepted-followup` (day 2, Marcel).
  - Event based here (no location tag): `call-in-fixer` (Marcel).
  - `supplier` (day 1) sends you here: "Marcel at the Quiet Amendment can explain the connection starting Day 2."
- **What the player can do here:**
  - The work action is "Gather unofficial information". Its listed effects are confidence 1 and goodwill 2; its cost is 200 (`location:bar`).
  - Marcel sells expedited routes for cash in five steps: protocol stamp (300), motorcade (300), lounge reservation (200), lounge guest list (200) and route reconnaissance (200). Each one leaves you owing Marcel a favour (`chapter:missionSteps`, routes `marcel`).
- **Events, leads and invitations:** the event ids above. No invitations are based here.
- **Atmosphere:** "Everything is possible. The question is who owes whom afterwards." (`char:fixer`, `line`). The venue entry gives "A discreet bar with food and excessively well-informed regulars." (`venue:shady`).

## Press Correspondents Club (`pressclub`)

- **What it is:** where the press corps meets. The description is "Access, credibility and the dangerous phrase “off the record”." (`location:pressclub`).
- **Who is usually there:** Ruth Vale (press correspondent) (`char:journalist`).
- **Who appears in events here:**
  - Event tagged here: `press-honest-followup` and `press-promise-followup` (day 2, Ruth).
  - Event based here (no location tag): `press` (Ruth). Its honest option says "From Day 2, Ruth offers a longer conversation at the Press Correspondents Club."
- **What the player can do here:**
  - The work action is "Brief the correspondents". Its listed effects are confidence 3 and goodwill 2; its cost is 100 (`location:pressclub`).
  - Ruth's follow-ups depend on how you handled the press question on day 1 (`event:press`).
- **Events, leads and invitations:** the event ids above. No invitations are based here.
- **Atmosphere:** "Off the record is an agreement, not something you say after the quote." (`char:journalist`, `line`). "The microphone looks switched off. It is not." (`event:press`, text).

## Precedence Golf Club (`golf`)

- **What it is:** a golf club where the host's officials can be found and where the embassy's diplomatic receptions happen. The description is "The people who never answer letters are available on the ninth green." (`location:golf`).
- **Who is usually there:** Minister Bako (Deputy Foreign Minister) and Ambassador Mara Velen (Valdoria) (`char:golf`, `char:amb-valdoria`).
- **Who appears in events here:**
  - Event tagged here: none.
  - Event based here (no location tag): `call-in-golf` (Bako), `web-dinner` (Bako and Velen).
- **What the player can do here:**
  - The work action is "Seek an informal appointment". Its listed effect is goodwill 4; its cost is 400 (`location:golf`).
  - Gated mission step: the host agreement on the programme, gated by Bako (`chapter:missionSteps.programme.host-agreement`). His favour route needs a favour owed to him, and a route that uses the "bako-objection" fact is available (`chapter:missionSteps.programme`, routes `bako` and `knowledge`).
  - Démarches to Bako: `demarche:6` (protest the protest) and `demarche:7` (a point of complete agreement), both at deputy-minister level.
- **Events, leads and invitations:**
  - Invitations based here: `invite:1` (Valdorian national-day reception) and `invite:4` (Valdorian colleagues' lunch). Both are hosted by Velen.
- **Atmosphere:** "An appointment? My secretary says I am unavailable. My caddie disagrees." (`char:golf`, `line`). "The people who never answer letters are available on the ninth green." (`location:golf`, description).

## UN House & multilateral circuit (`un`)

- **What it is:** the UN's local office, with programmes, funding and the coordination circuit. The description is "Programmes, funding, mandates and competing logos." (`location:un`).
- **Who is usually there:** Dr Amara Chen (UN Resident Coordinator) and Idra Venn (UN Programme Logistics Officer) (`char:un`, `char:un-coordinator`).
- **Who appears in events here:**
  - Event tagged here: `development-beneficiaries-followup` and `development-photo-followup` (day 3, Amara).
  - Event based here (no location tag): none.
  - `elise` (day 2) sends you here: "From Day 3, Amara can discuss the programme at UN House."
- **What the player can do here:**
  - The work action is "Negotiate a development programme". Its listed effects are confidence 4 and goodwill 2; its cost is 0 (`location:un`).
  - Project visit choices: protect time for the community's questions (`development-voices`), or give the partners their speaking slots (`development-speeches`) (`event:development-beneficiaries-followup`, `event:development-photo-followup`).
- **Events, leads and invitations:**
  - Invitations based here: `invite:2` (UN development roundtable) and `invite:6` (UN partners' final coordination, "the agenda has seven annexes").
- **Atmosphere:** "Six agencies. One programme. Each wants its logo bigger than the others." (`dialogue:un/logo/a`). "We can support the programme. We cannot promise six agencies will agree on one logo." (`char:un`, `line`).

## Venues

The data gives venues by id, with no link to a location id. Character likes and dislikes use these ids (for example, Pavel dislikes `bling` and `sushi`; Ruth likes `local` and `shady`).

- **Embassy kitchen** (`venue:embassy`, cost 20): staff coffee and a lunch assembled by Ketu.
- **Chez Marcel** (`venue:classic`, cost 140): classic French and Italian dining, with quiet tables and serious cutlery.
- **Auntie's Courtyard** (`venue:local`, cost 40): local cuisine, open-air tables and conversations that travel.
- **The Gilded Palm** (`venue:bling`, cost 450): rooftop chandeliers, imported everything, a very visible bill.
- **Mizu** (`venue:sushi`, cost 150): sushi, minimalist surroundings and ambitious small plates.
- **The Quiet Amendment** (`venue:shady`, cost 80): a discreet bar with food and excessively well-informed regulars. Same name as the `bar` location, which costs 200. See Open items.

## Open items

- **Name clash.** `location:bar` and `venue:shady` are both "The Quiet Amendment", with costs 200 and 80. The data does not say whether they are the same place.
- **Missing parent event.** `event:asteria-coffee-followup` and `event:asteria-coffee-delegated-followup` require an event `asteria-coffee`, which does not exist in `campaign.json`. Both are EU Delegation follow-ups.
- **Events with no place.** Several events name a character but no location (for example `press`, `rivalry`, `supplier`). They are listed under "based here" above, not as tagged to a place.
