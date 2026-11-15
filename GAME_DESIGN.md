# Game design

## Two concurrent story arcs

Every posting carries two kinds of story at the same time:

- **Chapter mission:** A longer arc that gives the posting its main objective and runs through the chapter. In Chapter 1, the mission is preparing for the Minister's visit.
- **Daily side stories:** Smaller, day-to-day situations and side quests that give the player decisions to make alongside the mission. These can involve embassy staff, contacts, invitations, messages and events. They may develop over multiple encounters and their consequences can affect relationships, resources or the chapter mission.

Both arcs should remain present as the game grows. Daily stories should offer room for humour and meaningful choices without replacing the chapter mission; mission pressure should give those choices context without crowding out the daily stories. Decisions should produce consequences wherever practical, including later payoffs when appropriate.

## Mission steps, setbacks and the arrival

Each mission task is an ordered chain of steps authored in `chapter.json`. Six Port Hesperia steps have a gatekeeper and routes chosen in the diary. Other steps can still be delegated, done in person, or confirmed by mail. Mail for a gated step can be answered, but the player must choose a route to complete the step. The official route needs no favours, facts, money or trust; it costs 3 DP and a delivery delay. Shortcuts may cost money, goodwill, favours or future obligations. A delivery is completed on its due morning; the step remains open until then.

Setbacks reopen completed steps and cancel deliveries that have not arrived. A non-official route invalidated this way is spent; the official route remains available. The content checker calculates recovery with official delivery times. Favours owed to the player are earned through choices; favours the player owes are called in two days later. Reading selected clippings or making choices teaches facts. Mira's request for a clean-port statement reduces Bako's trust and closes his favour route; reading the reshuffle story closes it too.

Money for the steps is ring-fenced like the visit reserves. The mission reserve holds the largest reserve-funded route cost per unfinished step, plus possible setback costs; optional spending cannot touch it. Money routes cost 1 DP, ƒ200–300 and 2 host goodwill. They produce adequate quality; other routes produce good quality. On arrival each completed adequate task costs 2 HQ goodwill, without changing ending thresholds. The final cable uses the chapter's task-quality text.

The last day is played. The Minister arrives on Day 15: its four blocks are played, the arrangements are closed, and the ending is decided when the last block resolves. A meter at zero still ends the posting at once.

## Capital's démarche board

Capital sends time-bound instructions to the secure fax and the embassy desk's démarche board. The board shares the ordinary block plan and its capacity ledger with mission work. Personal delivery costs 2 DP and travel; gravitas, the recipient's trust and a relevant fact affect the outcome. Staff delivery uses delegation and can produce a protocol incident if the messenger is too junior. A note verbale uses staff time and is adequate at best. A joint EU delivery needs coordination at the EU Delegation; poor trust may delay its delivery by a block. The player sees the outcome in the situation report and a report on the secure fax. The mission never requires a démarche, though a good delivery can earn a favour.

The contradictory umbrella instructions demonstrate supersession: the earlier fax remains visible and can be delivered, but doing so after the correction fails. The compulsive démarche trait adds one seeded, unrequested note per trip to the ministry, drawn from four authored outcomes. Failed or missed instructions can affect goodwill; leaks appear in later press. Posting saves retain board progress and old saves silently skip instructions whose deadlines have already passed.

## Diplomatic calendar

Daily side stories can arise from the wider diplomatic community: other countries' national-day receptions, EU coordination meetings, UN and other multilateral meetings, and invitations from diplomats at other missions. These are opportunities for relationships, information and diplomacy as well as competing demands on the player's time. Depending on the event, the player may attend, send a colleague or decline, with consequences appropriate to the host and circumstances. Some encounters can lead to follow-up stories or affect the chapter mission.

## Period and diplomatic satire

The setting is around 2006, with EU membership based on the 25-member period after the 2004 enlargement; the exact fictional roster and Bellaluxe membership slot are still design decisions. The BlockBerry, fax machines, desktop computers and other period technology belong in the setting. In player-facing text, call the group the **EU**, without a membership number. EU member states may use real country names; the host country and all other third countries use fictional, non-obvious equivalents. Bellaluxe's 17.6% contribution is an in-universe comic premise, not a claim about a real member state's historical contribution.

The EU setting combines the mid-2000s atmosphere with the user's requested EU Delegation and "Team Europe" language as intentional anachronisms. The head of delegation champions joint initiatives, while member states negotiate workload, ownership and credit; host officials can favour larger partners and overlook smaller missions. National-day events, speaking on behalf of absent states, and the absurd extension of budget shares into biscuits, speaking time and credit are material for recurring, consequential stories. See EU_DIPLOMATIC_CAST_PLAN.md for the proposed cast and implementation plan; its unresolved setting choices are subject to review.

## Embassy staff and cooperation

The player has separate trust with each colleague and cooperation between pairs of colleagues. Dialogue that changes cooperation identifies the other colleague explicitly; older queued named conversations retain their intended pair when resolved. Generic conversations do not silently change an unnamed pair. A joint visit assignment uses two staff DP per colleague: either person can supply the required expertise, but both must have trust of at least 25, fatigue below 80 and mutual cooperation of at least 25. Both accrue work fatigue; routine-duty displacement is still explicit and affects the existing capacity ledger.

Embassy staff stories are optional daily arcs alongside the Minister's visit. Sola and Elise's disagreement about consulting local partners branches into different follow-ups according to the player's choice. The existing Pavel–Anselm rivalry also leads to a different later embassy scene for mediation or an order to cooperate. These scenes record trust, pair cooperation and other authored effects at the end of the block, and do not make the chapter mission depend on completing them.

## Character statistics and traits

Charm adjusts positive social and contact trust gains (minimum +1); Gravitas adds up to +2 HQ goodwill to formal decisions. Plausible Deniability changes negative ignored-instruction and missed-event effects by 10% per point away from 3, rounded toward zero. Stamina affects DP and overnight energy; Liver affects alcohol tolerance and adds social trust when drinking. A Functional Alcoholism character who drinks in the evening has −1 DP the next morning. Reply-All Reflex can misdirect one reply in four; the queued message may be recalled for one extra DP before the block resolves. Name-dropper improves positive interactions with host officials and loses Ruth's trust when a tagged name-dropping choice is used. Traits and stat requirements can unlock visibly tagged options; the builder requires a flaw and at most four traits. Existing saves retain their characters and receive no retroactive hangover.

## Morning press review

Each morning's optional review combines a developing fuel-quay story with consequences of earlier decisions and local filler. Reading the signals from Day 4 can reveal an optional ministry lead; early action protects the generator fuel reserve, while late procurement costs more without blocking the visit. The review can be skipped and reopened during the morning. One clipping per day can be sent to Capital; Lucien can identify the significant item for one DP. Maxim substitutes when Lucien is tired, recently worked late or is unavailable by chance. Translation quality is an explicit selection parameter for future language mechanics.

## Chapter packs

A chapter is data. Everything specific to one posting lives in `src/game/chapters/<id>/`: `chapter.json` (id, label, title, year, era, number of days, time blocks, mission tasks with their steps and setbacks, ending texts and ordered ending rules, starting meters, energy, relationships, funds, visit reserves and supplement) next to the content files (campaign, dialogues, emails, invitations, press, posting briefing, conversation payoffs, staff duties, embassy, EU representation, mail choices). `src/game/chapters/index.ts` registers the packs and exposes `activeChapter()`; the rules, the store and the components read the active chapter at call time, so a second chapter needs new data, not new rules. Ending rules are checked in order and the first match wins; a rule marked `finalDay` is only checked on the last day. Career-level data (traits, backgrounds, portraits) stays in `src/game/data`. Saves record a `chapterId`.

## Career and save slots

A diplomatic career outlives one chapter. `src/game/career.ts` holds the pure `Career` record: identity, the three background choices as indexes into `data/backgrounds.json` (null for migrated saves), traits, earned quirks, languages, rank, savings, property, reputations, people (trust and an optional note), legacy flags and one `ChapterResult` per finished posting (ending, day, final meters, score, legacy flags, story outcomes, final trust per character, finish time). Legacy flags are a copy of the posting's story flags without bookkeeping prefixes (`social:`, `dialogue:`, `reward:`); later chapters may react to them.

The browser keeps three save slots under `persona-non-grata-slots`: `{ version, activeSlot, slots: [Slot | null × 3] }`, where a slot is the career plus the posting in progress (or none, between postings). `useGame` remains the store for the posting being played; `src/game/saves.ts` loads a slot into it (activating the posting's chapter), writes the posting and career back on every change, and records the chapter result once when a posting reaches its ending. The old single save (`persona-non-grata-save`) is migrated into slot 1 on first load and left in place as a backup.

A slot can be exported as a code, `PNG1.` followed by base64url of the JSON and a checksum, and imported into an empty slot, because browser storage can be wiped. The code includes the posting in progress. Imported data is validated with zod and truncated or altered codes are rejected.
