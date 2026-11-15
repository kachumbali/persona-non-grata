# Master plan

Source of truth for work packages. Each coding tool takes one package, follows AGENTS.md, and ticks it in roadmap.md.

## Decisions

- One career played in order: intern (around 2001), Port Hesperia (2006), a 2013 posting, a 2022 posting as ambassador. The 1980s prequel is played as a different character.
- Browser only. Saves live in the browser, with export and import as a text code.
- Chapters are about 15 working days each. Version 1.0 has four chapters.
- Stories come from real anecdotes, anonymised and exaggerated by AI tools, approved by the owner.

## Fun rules

- A laugh in every block, a dilemma every day, a callback in every chapter.
- No block without a decision.
- Failure is funny.
- Jokes aim at institutions and habits, never at nationality, ethnicity or accent.
- Real situations must not be traceable: change country, decade and rank, merge people, move the venue.

## M1: Solid ground

Make the game ready for more than one chapter and more than one coding tool. Nothing here changes how Port Hesperia plays.

### F-01 Checks on every commit (done)

- Type: Rules and code · Size: S · Depends on: none
- Goal: Several tools will commit to the same repository, so every commit must be checked automatically.
- Work:
  - Add a GitHub Actions workflow that runs npm test, npx tsc --noEmit and npm run build on every push and pull request.
  - Format the whole repository with Prettier in one commit that changes nothing else, so the 487 existing formatting errors disappear and lint can join the workflow.
  - Replace the regression test in rules.test.ts that checks traits against the hand-written USED_STATS list. The new test must prove each stat changes at least one rule result.
  - Add a 'Work packages' section to AGENTS.md: one package per commit series, package id in every commit message, tests green before pushing, tick the package in roadmap.md.
- Done when: A push with a failing test shows a red check on GitHub. Lint passes. The stat test fails if a stat stops being read.

### F-02 Chapter packs (done)

- Type: Rules and code · Size: L · Depends on: F-01
- Goal: Everything specific to Port Hesperia is hard-coded today (15 days, the four visit tasks, the six endings, starting meters, one campaign.json). A second chapter is impossible until a chapter is data.
- Work:
  - Create src/game/chapters/port-hesperia-2006/ and move campaign, dialogues, emails, invitations, press, posting briefing, conversation payoffs, staff duties and embassy data into it.
  - Add chapter.json: id, title, year, era, player rank, number of days, blocks, mission tasks (today's VISIT_TASKS), ending rules and texts (today's ENDINGS and pickEnding), starting meters, starting funds and reserves, locations and scene art.
  - Make rules.ts, economy.ts, store.ts and the components read the active chapter instead of constants. Keep the rule functions pure.
  - Rename player-facing 'Chapter 1' labels so they come from the chapter pack.
- Done when: The game plays exactly as before. All existing tests pass with only import changes. A second, empty test chapter with 2 days and 1 mission task can be loaded in a test.

### F-03 Career record and save slots (done)

- Type: Rules and code · Size: M · Depends on: F-02
- Goal: A career must outlive a chapter. Today there is one save that holds one posting.
- Work:
  - Add a second persisted store, career: identity, portrait, background choices as ids, traits, earned quirks, languages, rank, savings, property, reputations, chapter results and legacy flags (choices later chapters can react to).
  - Chapter state keeps only what belongs to the posting and reads the character from the career.
  - Three save slots on the title screen.
  - Export and import a career as a text code, because browser storage can be wiped.
  - Migrate existing saves into slot 1.
- Done when: Finishing Port Hesperia writes a chapter result into the career. An exported code restores the same career in another browser. Old saves still load.

### F-04 Content checker (done)

- Type: Rules and code · Size: M · Depends on: F-02
- Goal: Most future work is writing JSON with AI tools. Mistakes in content must be caught by a script, not by players.
- Work:
  - Describe every content file with a schema (zod) and validate all chapter packs.
  - Add npm run content:check and run it in the workflow. It reports: unknown character, location, portrait, trait or event ids; flags that are set but never read, and read but never set; choices without a result text; scenes where every choice is gated, so some builds see nothing; texts over the length limits; clippings or events outside the chapter's days.
  - Print a per-chapter content count: scenes, choices, tagged choices per trait, clippings, emails.
- Done when: Breaking an id in any JSON file fails the check with the file and the id named. Port Hesperia passes.

### F-05 Simulated playthroughs (done)

- Type: Rules and code · Size: M · Depends on: F-02
- Goal: Balance and pacing cannot be judged by reading JSON. Bots that play whole chapters give numbers.
- Work:
  - Build bot players with different habits: careful planner, socialiser, reckless delegator, inbox ignorer, press reader.
  - Run each bot with several trait builds and seeds through a chapter using the real store.
  - Report: spread of endings per build, trait moments seen per run, scenes and choices never reached, blocks with nothing to decide, lowest funds, days where no scheduling conflict occurred.
  - Add npm run sim and a test with thresholds, for example no build wins more than 70% of runs and every build sees at least 10 trait moments.
- Done when: One command prints the report for Port Hesperia. The thresholds run as a test.

### F-06 Anecdote pipeline and writing guide (done)

- Type: Writing and content · Size: S · Depends on: none
- Goal: Your real stories are the game's advantage. They need a fixed route from a few lines of text to an anonymised, exaggerated scene in JSON.
- Work:
  - docs/anecdotes/TEMPLATE.md: what happened, why it was absurd, who was involved (roles only), what happened next, era. No names, countries or dates.
  - docs/WRITING_GUIDE.md: tone, hyperbole rules, the anonymising checklist (change country, decade and rank; merge two people into one; move the venue; drop anything ongoing or classified), length limits, and the rule that jokes aim at institutions and habits, never at nationality, ethnicity or accent.
  - Three prompt templates in docs/prompts/: scene writer (anecdote to JSON scene in the chapter's format), punch-up (make it funnier without changing mechanics), reviewer (checks anonymising, tone and the content checker's rules).
  - A folder flow: inbox, used, rejected.
- Done when: One of your anecdotes goes from the template to a playable scene using only the documents and prompts in the repository.

## M2: Port Hesperia complete

Finish every system inside the one chapter that exists, then test it with five people from the circuit before building more.

### B-01 Mission pacing: make the visit a fifteen-day job (done)

- Type: Rules and code · Size: M · Depends on: F-05
- Goal: The simulated playthroughs show a careful player confirms all four visit tasks on Day 1 for ƒ900. The main mission then creates no tension, and two thirds of the blocks have nothing waiting.
- Work:
  - Turn each mission task into three or four steps defined in the chapter pack, each with an earliest day, a cost in time or money, and a requirement such as a skill, a trust level or an earlier step.
  - Add scripted setbacks from Capital and the host that reopen steps: the arrival time moves, the delegation grows, the lounge is double-booked, the motorcade route is closed for a parade.
  - The visit is ready only when every task's last step is confirmed. Show the steps and what blocks each one on the mission dashboard.
  - Ring-fence the mission's own costs so hospitality spending cannot make the visit impossible by accident.
  - Make the final day playable as an arrival sequence instead of ending when the day counter is reached.
  - Update the simulation thresholds: no bot completes the mission before Day 11, a careful bot still succeeds in at least 80% of runs, and an ignorer still fails.
- Done when: In the simulation the mission stays open until the last days for every bot, and the number of blocks with nothing waiting drops clearly. Old saves still load.

### B-02 Gatekeepers and routes: make the mission hard, not only long (done)

- Type: Rules and code · Size: M · Depends on: B-01
- Goal: After B-01 the visit takes the whole chapter, but a careful player still never fails. Each key mission step should have a gatekeeper and several ways past them, each with its own price.
- Work:
  - Key mission steps get a gatekeeper (a named character) and two to four routes defined in the chapter pack: an official route that is slow but always open, a favour route, a money route and an EU route.
  - Routes have requirements (trust, a favour owed to you, knowledge, cash, a language level later) and consequences (a favour you now owe, a press clipping, lost deniability, a banner on the lounge).
  - A simple favours ledger: who owes you, whom you owe. People call favours in at awkward moments.
  - Counter-demands: a gatekeeper may want something in return, and two gatekeepers can want opposite things.
  - Knowledge as a key: some routes stay hidden as '?' until you learn of them from the press review, gossip or a colleague.
  - Support that expires: backing can lapse on a set day or when a press story turns.
  - Degrees of success: a step can be done well or adequately, and the difference shows in the ending.
  - The guaranteed official route removes the dead end at Protocol's stamp. The simulation proves a steady player can always finish and that no single route is always best.
- Done when: In the simulation a careful player no longer wins every game, every route is used by some bot, and no run is ever locked out of the mission.

### P-01 Portrait cleanup

- Type: Art · Size: S · Depends on: none
- Goal: The 8 original portraits are chunky pixel art and the 43 new ones are smooth illustrations. About 14 new portraits share one face.
- Work:
  - Regenerate the lookalike portraits with distinct face shape, age and skin tone: Elise, Bianca, Ines, Ruth Vale, Sofia da Costa, Tanya Farrugia, player-13, player-14, Anselm, Lucien, Maxim, Marcel, Idra Venn, Henri, player-21, player-23.
  - Write a script that reduces all portraits to one shared colour palette and sets the background to the exact teal of diplomat-1.png. Keep it in the repository for future portraits.
- Done when: On a contact sheet of all portraits, no two NPCs who appear in the same place look alike, and old and new portraits read as one style.

### S-01 Brussels and HQ circulars

- Type: Writing and content · Size: M · Depends on: F-04
- Goal: Endless, boring, mostly irrelevant mail is a core joke of the job. One in ten hides a real instruction.
- Work:
  - A new mail kind, circular, that never escalates when ignored.
  - A template generator for subjects and bodies so the supply never runs out.
  - Three ways to handle one: skim (free, may miss things), read properly (1 DP), have the intern summarise (staff time, sometimes confidently wrong).
  - Buried instructions with a deadline and a later cost if missed.
  - Mail from other missions: gossip that hints at the press story, favours asked, colleagues competing for the same promotion.
- Done when: A 15-day run receives 25 or more circulars. A bot that ignores all of them still finishes the visit but loses goodwill for each missed buried instruction.

### S-02 Démarche board (done)

- Type: Rules and code · Size: M · Depends on: F-04
- Goal: Capital instructs démarches. You deliver them yourself or assign them, and the choice of messenger is where the comedy is.
- Work:
  - Démarche instructions with subject, required level, deadline and talking points, listed on a board on the desk.
  - Four routes: yourself (Gravitas and language level decide), a colleague (existing delegation rules, plus personality outcomes per colleague), jointly with EU partners (more weight, letterhead dispute), note verbale (cheap, weak).
  - Wrong-level protocol incidents, a report cable back to Capital, the host's reaction, and a possible press clipping the next morning.
  - Absurd instructions mixed in. The Compulsive Démarche trait adds unrequested ones.
- Done when: Six to eight démarches across the chapter, each with at least three distinct outcomes depending on the messenger.

### S-03 Languages and the exam

- Type: Rules and code · Size: M · Depends on: F-03
- Goal: Language skill is a career-long track with comic failure built in, and passing the exam raises your salary.
- Work:
  - Levels 0 to 4 per language, stored in the career. Starting languages chosen in the builder. The host language starts at 0.
  - Language-gated choices with a mistranslation roll at low levels and a table of funny failures.
  - A plannable lesson activity with three teachers who teach different registers.
  - Press review quality follows the host-language level (the hook already exists).
  - The exam on a fixed day close to the mission deadline: five situational questions, pass with four. Passing grants a permanent allowance.
  - Language quirk traits such as False-Friend Collector.
- Done when: A player can go from level 0 to passing the exam in one chapter only by giving up other things. Failing is funny and allows a retake next chapter.

### S-04 Your past catches up

- Type: Writing and content · Size: M · Depends on: F-03
- Goal: The background you pick in the builder is never used. Each misstep should return as a story, and people should address you by name and title.
- Work:
  - Origins give a small perk. Each of the 8 missteps becomes a short event between days 4 and 12. The posting reason changes the briefing and one line of the final cable.
  - NPC lines use the player's title and surname. Titles marked '(pending)' get a running correction gag from Protocol.
- Done when: Every background choice changes at least one thing the player sees during the chapter.

### S-05 Reputations and earned quirks

- Type: Rules and code · Size: M · Depends on: F-03
- Goal: The character should change during play. Your file at the end should not be the file you started with.
- Work:
  - Counters on kinds of choices produce reputations with names, such as The Biscuit Hawk. A reputation changes greetings and unlocks one option.
  - At thresholds a 'Personnel file amended' cable adds a quirk, good or bad, up to three per chapter. Flaws can be cured.
  - Major choices can move a stat by one point.
  - Everything is stored in the career.
- Done when: Two bots with the same build and different habits finish with visibly different personnel files.

### S-06 The relationship web (done)

- Type: Rules and code · Size: L · Depends on: F-04
- Goal: You said the humour should come from the many characters and how they stand with each other. Today NPC pairs only have a hidden cooperation number.
- Work:
  - Give NPCs their own traits and stats, so who you are and who they are decide which options appear and how they land.
  - Named relationship states between any two people, including you: ally, rival, mentor, owes a favour, feud, former couple, shares an office and hates it.
  - A favours ledger: who owes whom, and options to call a favour in.
  - Gossip as an item you collect in conversations and receptions and can spend: pass it on, hold it, deny you ever heard it.
  - A 'Who is who' screen showing the web as it is known to you, with gaps until you learn more.
  - Events that fire when a relationship changes state, for example two feuding colleagues both invited to your dinner.
- Done when: At least 10 scenes in Port Hesperia read relationship states, and the player can change at least 6 relationships between other people through their choices.

### S-07 Scheduling conflicts

- Type: Rules and code · Size: M · Depends on: F-02
- Goal: Time is a main resource, but the calendar rarely forces a painful choice.
- Work:
  - A week view showing fixed events, deadlines, invitations and your plan.
  - Double bookings on purpose: two events in one block, with the options to attend one, split the block and offend both a little, send a colleague, or send apologies.
  - Last-minute changes: an invitation with twenty minutes' notice, a boss who moves a meeting, a flight that lands early.
  - Travel time between distant places.
  - Rules that guarantee at least one real conflict per day, checked by the simulation.
- Done when: The simulation reports a scheduling conflict on at least 12 of 15 days, and every way of resolving one has its own consequence.

### S-08 Debrief and endings

- Type: Screens · Size: M · Depends on: S-05
- Goal: The ending should read your whole posting back to you and make you want another one.
- Work:
  - Personnel file on day 1 next to the last day, with traits gained and lost.
  - One epithet for the posting, built from your most extreme choices.
  - Ending texts with a line that depends on your dominant trait and reputation.
  - A promotion board: three NPCs who know you judge your record in their own voices.
  - A payslip that itemises the jokes, including the language allowance.
- Done when: Two different runs produce clearly different debrief screens. Players can copy the debrief as text to share.

### S-15 The world file: background events for each chapter

- Type: Writing and content · Size: M · Depends on: F-04
- Goal: The press review needs a believable world behind it. Each chapter gets a file of background events and running stories that connect to each other, so the setting feels like a real place with its own politics.
- Work:
  - A world file per chapter pack: the host country's government and opposition, the economy, three or four national obsessions (a football cup run, a drought, a royal wedding, a pension reform), the neighbours, and a calendar of public events across the chapter's days.
  - Four to six background threads that run through the whole chapter and cross each other: the reshuffle rumour affects the port portfolio, the cup run empties the ministry on match days, the drought raises the price of the reception.
  - Press clippings, filler included, are drawn from these threads, so every item belongs to a story the player can follow.
  - NPC small talk, calendar events and prices refer to the same threads. A match day closes offices. A ministerial resignation changes who receives you.
  - A template for the world file in docs/, used by every chapter design package.
  - For Port Hesperia: write the Ombrazia world file and rework the existing filler clippings to fit it. The fuel quay story becomes one of the threads.
- Done when: Every press clipping in Port Hesperia belongs to a named thread, and at least three threads change something in play beyond the press review.

### A-01 Story arc: the cultural institute

- Type: Writing and content · Size: M · Depends on: F-04, S-06
- Goal: A cultural institute that answers to your government but listens to nobody, run by a very strange director. It creates its own problems, and they land on your desk.
- Work:
  - A director with strong traits and a vision, plus two or three staff with their own feuds.
  - An arc of four to six episodes over the chapter: an exhibition the host finds offensive, a poetry evening that becomes a diplomatic incident, a budget spent on something indefensible, an artist who will not leave.
  - Each episode offers ways to manage it: back the director, rein the director in, blame Capital, or look away and read about it in the press.
  - Consequences for host goodwill, HQ goodwill, the press threads and your relationship with the director.
  - Built as a reusable kit, so a different institute with a different director can appear in another chapter.
- Done when: The arc plays in Port Hesperia from first episode to a resolution with at least three different outcomes, and never blocks the Minister's visit.

### P-02 Port Hesperia balance and first playtest

- Type: Writing and content · Size: M · Depends on: S-01, S-02, S-03, S-04, S-05, S-06, S-07, S-08, F-05
- Goal: Before building more chapters, prove that one chapter is fun for the people it is made for.
- Work:
  - Tune costs and numbers using the simulation report.
  - Add a short guided first morning so new players are not lost.
  - Fill any day the simulation shows as empty with scenes from the anecdote inbox.
  - Give the build to five people from the diplomatic circuit. Ask three questions: did you finish, which moment did you retell to someone, where were you bored.
- Done when: At least four of five testers finish the chapter and each can name a moment they retold. Their boredom points are logged as fixes.

## M3: A career

Link chapters into one career and build the intern chapter as the new beginning.

### F-07 Career screen and time between postings

- Type: Screens · Size: M · Depends on: F-03, S-08
- Goal: Chapters need connecting tissue: where you stand, what comes next, and what you do with your money and leave.
- Work:
  - A career screen: rank, personnel file, languages, savings, property, postings completed.
  - After the debrief, an interlude of a few choices: home leave, a course, a visit to HQ to lobby for the next posting.
  - A posting letter that opens the next chapter, sometimes with a choice between two postings with different hazard pay.
  - Chapter select for replaying finished chapters without changing the career.
- Done when: A player can finish one chapter, spend the interlude and start the next without leaving the game or losing the character.

### S-09 Salary, hazard pay and the house back home

- Type: Rules and code · Size: M · Depends on: F-07
- Goal: A personal reason to take risks and improve: money of your own, and something to build with it.
- Work:
  - A personal ledger separate from the embassy account: base salary by rank, allowances, hazard pay by posting, deductions.
  - A property ladder back home in four steps, each with a perk in later chapters and a running complication delivered by mail.
  - Courses bought between chapters that raise a skill or cure a flaw.
  - Prices rise each chapter.
- Done when: Savings from two chapters can buy the first property step. Choosing the riskier posting changes what the player can afford.

### S-10 Rank changes how you play

- Type: Rules and code · Size: M · Depends on: F-02
- Goal: An intern and an ambassador should not play the same way.
- Work:
  - A rank table that sets DP per block, who you may delegate to, who agrees to receive you, your salary and how people greet you.
  - Junior mode: you have no staff. Several bosses give you tasks with conflicting deadlines, and choosing whose task slips is the game.
  - Senior mode: you mostly delegate and represent. Your time goes to receptions, speeches and deciding who gets blamed.
  - Access rules: some doors open only from a certain rank, or with a favour.
- Done when: The same scheduling engine runs a day as an intern and a day as an ambassador with clearly different choices.

### S-11 People who come back

- Type: Rules and code · Size: M · Depends on: F-03, S-06
- Goal: A career is funny because the same people keep turning up in new roles.
- Work:
  - A people register in the career: who you met, how you left things, favours owed.
  - Chapter packs can cast a returning person in a new role and at a new age, with the relationship carried over.
  - Legacy flags from earlier chapters trigger scenes: the intern you were kind to is now your desk officer, the rival got the posting you wanted.
  - Portraits for returning people at different ages.
- Done when: At least five people from one chapter can appear in the next with their relationship to you intact.

### A-02 Spies, secrets and honeypots

- Type: Rules and code · Size: M · Depends on: S-06, S-12
- Goal: Someone is always after what you know. A light counter-intelligence layer played for comedy.
- Work:
  - Secrets as items: instructions, gossip, the Minister's dietary file. Each has a sensitivity level.
  - A discretion check on what you say, to whom and where: the bar, the golf course and the taxi all listen.
  - Agents among the cast, not all of them competent: the too-friendly new acquaintance, the journalist with perfect timing, the honeypot whose cover story has gaps you can notice.
  - Ways to respond: report it to security, feed false information, play along for information of your own, or miss it entirely.
  - Consequences later: a leak in the press, a security interview, a commendation, or a file note that follows you to the next posting.
  - A security officer character who distrusts everyone, especially you.
- Done when: A chapter can stage two or three approaches. The player can spot one from clues before it is revealed, and each response leads somewhere different.

### A-03 Story arc: the zoo deal

- Type: Writing and content · Size: M · Depends on: F-04
- Goal: A zoo back home wants animals from the host country. You negotiate the deal, and then the transport goes wrong.
- Work:
  - Episodes: the request from a persistent zoo director, the negotiation with a ministry that has no form for this, veterinary and customs paperwork, the transport, the incident, the press.
  - Things that can go wrong, chosen by the player's earlier shortcuts: the wrong species, a quarantine, an escape at the airport, a diplomatic bag that is moving.
  - A good home for the intern chapter, where you are the one holding the crate, or for Port Hesperia as a side story.
- Done when: The arc runs over at least five days with a transport finale that depends on earlier choices.

### E-01 Eras

- Type: Rules and code · Size: M · Depends on: F-02
- Goal: Each decade should feel different to play, not only look different.
- Work:
  - An era definition used by chapter packs: the devices you have, how fast messages reach you, the form the press takes, the interface skin and the period vocabulary.
  - Around 2001: fax, desk phone and dial-up. Mail reaches you only at your desk. Faxes queue and jam.
  - 2006: the BlackBerry, as built today.
  - 2013: smartphone and social media. Public posts get instant reactions, and anything written can leak.
  - 2022: group chats and video calls. Messages arrive in any block, and you can attend two things at once on video, badly.
  - Port Hesperia is converted to use the 2006 era without changing how it plays.
- Done when: Switching a test chapter between two eras changes when messages arrive and which device screens appear, with no change to chapter content.

### C-01 Design the intern chapter

- Type: Writing and content · Size: M · Depends on: F-06
- Goal: The career starts around 2001 at the bottom. This is a design document, written from your anecdotes, before anything is built.
- Work:
  - Setting, proposed: headquarters in Bellaluxe's capital, in the Protocol Department, during preparations for a summit the country is hosting.
  - Main mission, proposed: get the right folder to the right minister at the right moment, through three weeks of everyone else's emergencies.
  - A cast of 12 to 15 with traits, relationships and at least five who return in later chapters, including the future absent Ambassador of Port Hesperia.
  - Six side stories, the mission tasks, the endings, and the tutorial role of the first days.
  - Period details of 2001: the fax room, the photocopier queue, the first mobile phones, the currency changeover.
- Done when: A design document in the repository that a coding tool can build from, reviewed by you.

### C-02 Build the intern chapter

- Type: Writing and content · Size: L · Depends on: C-01, F-02, S-10, E-01, S-11
- Goal: The second playable chapter, and the proof that the chapter format works.
- Work:
  - Split into three packages when started: the chapter pack with mission and endings; dialogues, events, mail and press; portraits and scenes.
  - Use the content checker and the simulation from the first commit.
  - Doubles as the tutorial: fewer systems on day 1, more each day.
- Done when: A new career starts as an intern, finishes the chapter, and continues into Port Hesperia with the same character, people and consequences.

## M4: Eras

Add the 2013 chapter and the systems that make decades and old choices matter.

### S-12 Delayed and cross-chapter consequences

- Type: Rules and code · Size: M · Depends on: F-03
- Goal: Actions should come back later, including years later.
- Work:
  - Schedule an effect for a later day or block ('three days later, the caterer calls').
  - Consequences that wait for a condition, such as the next time you meet a person.
  - Cross-chapter callbacks from legacy flags, with a line in the debrief showing which old choice caused them.
  - A record screen: 'Things you set in motion'.
- Done when: Content can schedule a consequence without code. At least five Port Hesperia consequences come from intern-chapter choices.

### S-13 Two small games inside the game

- Type: Screens · Size: M · Depends on: S-06
- Goal: Two short, repeatable activities that people from the circuit will recognise at once.
- Work:
  - The seating plan: place guests at a table by rank, feuds, languages and who must not sit near the press. Uses the relationship web.
  - The communiqué: pick the wording for a joint statement while partners each demand a different adjective. The result is judged by Capital, the host and the press.
  - Both are optional, take under two minutes, and have funny failures.
- Done when: Each appears at least twice in a chapter and can be delegated, with worse results.

### S-14 Life at post: Sims-like needs and interactions

- Type: Rules and code · Size: L · Depends on: S-06, S-07
- Goal: People at the embassy should feel alive between the scripted scenes. Today you have energy, composure and alcohol, NPCs have trust and fatigue, and every interaction is an authored dialogue.
- Work:
  - Needs for you and for every NPC: energy and composure (existing), plus hunger, company, comfort and homesickness. Each need drifts over the day and shows as a mood.
  - Mood bubbles on portraits in each place, so you can see at a glance who is hungry, sulking, in love or about to resign.
  - A free interaction menu on any person, beside the authored dialogues: compliment, gossip, complain about Capital, ask a favour, borrow the stapler, invite for coffee. Results depend on both people's traits, needs, mood and relationship state.
  - NPCs act on their own between blocks: they move between rooms, talk to each other, and start feuds, friendships and office romances that you find out about later.
  - Needs feed back into work: a hungry attaché delegates badly, a homesick chef changes the menu, a lonely ambassador calls you at night.
  - Your residence as a place: spend your salary on furniture and comforts that restore needs faster and impress guests. This links to the house back home.
  - Keep it light. Needs must create comic situations and choices, not chores. The simulation checks that looking after needs never takes more than about one block a day.
- Done when: In a normal day at least three things happen between NPCs without the player causing them, and the player can change someone's mood through free interactions. Testers describe the staff as characters, not menus.

### A-04 Story arc: the national day

- Type: Writing and content · Size: L · Depends on: S-07, S-13, A-02
- Goal: Your own national day reception: the biggest logistical event of a posting, and a chapter-long side arc.
- Work:
  - Guests of honour: get a senior host official to come, and a politician or television personality from home who then has demands.
  - The programme: find artists, agree the speeches, and settle the order of the anthems.
  - Imports: beer, sausages, cheese and wine have to arrive through customs in time. Something is always stuck, spoiled or missing.
  - The guest list and the seating plan, using the relationship web and the seating game.
  - The day itself as a sequence of quick decisions: the guest of honour is late, the generator fails, the wrong anthem plays, a spy works the room.
  - Rank changes your part: as an intern you carry the sausages, as ambassador you give the speech.
  - Aftermath in the press, with Capital, and in the next year's budget.
- Done when: The reception day plays as a finale whose problems come from earlier planning choices, with at least four clearly different outcomes.

### A-05 Story arc: the school abroad

- Type: Writing and content · Size: M · Depends on: F-04, S-06
- Goal: A school financed by your government, with you or your cultural attaché on the board. Parents, teachers and the head each believe the embassy works for them.
- Work:
  - Board meetings as scenes with votes, where every member has an agenda.
  - Episodes: a fee increase, a headteacher appointment, a parent who is also a minister, a school play with a political problem, a building that fails inspection.
  - The choice to sit on the board yourself or send the cultural attaché, with different information and different blame.
  - Links to host goodwill, the press and your own family if you have children at the school.
- Done when: The arc gives at least four board meetings with outcomes that carry into the next one.

### A-06 Story arc: posts that go horribly wrong

- Type: Writing and content · Size: M · Depends on: E-01
- Goal: In the social media eras, an ambassador or the embassy account posts something that should never have been posted.
- Work:
  - Available from the 2013 era: the embassy account, your own account and your ambassador's account.
  - Disasters: the wrong photo, a private message sent in public, a hashtag with a second meaning, a like at two in the morning, a post scheduled before the news changed.
  - A reaction that spreads over the following blocks, and a choice between deleting, explaining, doubling down, blaming the intern or waiting for the next scandal.
  - As a junior you clean up after your ambassador. As ambassador the account is yours.
  - The Reply-All Reflex trait carries over naturally.
- Done when: At least five different post disasters, each with a spread over several blocks and three ways to handle it.

### C-03 Design the 2013 chapter

- Type: Writing and content · Size: M · Depends on: F-06, C-02
- Goal: Mid-career in the smartphone decade. A design document first.
- Work:
  - Setting, proposed: a permanent mission in a fictional multilateral city.
  - Main mission, proposed: win a vote for a seat on an obscure committee nobody can explain.
  - The era's mechanics: social media reactions, leaks, and video links that fail.
  - Cast with returning people, side stories, endings, and at least ten callbacks to earlier chapters.
- Done when: A reviewed design document in the repository.

### C-04 Build the 2013 chapter

- Type: Writing and content · Size: L · Depends on: C-03, E-01, S-12
- Goal: The third playable chapter.
- Work:
  - Same three-way split as the intern chapter: pack, content, art.
- Done when: A career plays three chapters in a row.

## M5: Version 1.0

Add the 2022 chapter, finish the career with an epilogue, and polish for a wider audience.

### C-05 Design the 2022 chapter

- Type: Writing and content · Size: M · Depends on: C-04
- Goal: You are the ambassador. A design document first.
- Work:
  - Setting, proposed: your own embassy in a difficult post.
  - Main mission, proposed: a crisis that turns into a visit, or a visit that turns into a crisis.
  - The era's mechanics: group chats in every block, hybrid meetings, AI-drafted cables that need correcting.
  - Senior play: residence, receptions, a deputy who is the person you used to be.
- Done when: A reviewed design document in the repository.

### C-06 Build the 2022 chapter

- Type: Writing and content · Size: L · Depends on: C-05
- Goal: The fourth playable chapter and the end of the career.
- Work:
  - Pack, content and art.
  - A final epilogue built from rank, personnel file, people and the house back home.
- Done when: A career can be played from intern to ambassador with a personal epilogue.

### X-01 Medals, boss key and sound

- Type: Screens · Size: M · Depends on: F-03
- Goal: Small rewards and jokes that make people show the game to colleagues.
- Work:
  - Achievements as decorations, such as the Order of the Stapler, shown on the career screen.
  - The boss key already on the roadmap: one key turns the screen into a spreadsheet.
  - Music and sound per era, with a mute button.
- Done when: At least 30 decorations across four chapters. The boss key works on every screen.

### X-02 Release pass

- Type: Rules and code · Size: M · Depends on: C-06
- Goal: Make the full game ready for a wider audience.
- Work:
  - Full-career simulation from intern to ambassador with all builds.
  - Loading size and speed, phone layout, keyboard use and readable contrast.
  - First-run help, a credits and disclaimer screen stating that people and events are fictional.
  - A second round of playtests with the target audience.
- Done when: Version 1.0: four chapters, one career, tested by people from the circuit.

## Later: After 1.0

Parked until the four-chapter career works.

### L-01 The 1980s prequel

- Type: Writing and content · Size: L · Depends on: X-02
- Goal: Play a different character: the person who becomes your Ambassador in Port Hesperia, as a young attaché in the 1980s.
- Work:
  - Telex, cipher room, smoke-filled receptions and paper files.
  - Choices that explain who that Ambassador later is.
- Done when: A stand-alone chapter that changes how Port Hesperia reads on a replay.

### L-02 The humanitarian field mission

- Type: Writing and content · Size: L · Depends on: X-02
- Goal: A short chapter away from the embassy with the highest hazard pay. The jokes aim at the system around aid, never at the people receiving it.
- Work:
  - Convoys, forms, donor logos and visiting delegations.
  - Fewer comforts: energy and composure matter more than money.
- Done when: A side chapter that can be slotted between two postings.

### L-03 Contributors and languages

- Type: Rules and code · Size: M · Depends on: X-02
- Goal: Let colleagues send in stories and let the game be played in more than one language.
- Work:
  - A submission form that follows the anecdote template, with an editing step before anything is used.
  - Text moved into language files so German and French versions become possible.
- Done when: A submitted story can become a scene without a developer. One chapter is playable in a second language.
