# Implementation workplan: daily stories and locations

## Objective and constraints

Keep two concurrent arcs throughout a posting: the chapter-long mission and daily diplomatic stories. Deliver small, playable increments, retaining the existing scheduled blocks, DP, staff capacity, money, goodwill, travel and save systems. Author game content in JSON; keep scheduling and economic rules in browser-safe pure TypeScript, with persistent state in the game store. Story choices should produce consequences, but optional stories must not be mandatory for completing the mission.

Each work package ends with its acceptance checks and a working build. Do not start the next package until its dependency is complete; content and scene art can be prepared independently after the data format is settled.

## WP0 — Baseline and campaign pacing

**Work:** Play the existing opening and at least one complete 15-day posting. Record the availability of side stories, travel and task costs, invitation conflicts, player and staff DP, visit readiness and where the pace slows or feels unfair. Record the current save format and test an existing save.

**Done when:** There is a short list of observed issues and a repeatable playthrough checklist. Existing saves load; the existing tests, type check and build pass. Keep findings separate from assumptions.

## WP1 — Story progression and save compatibility

**Depends on:** WP0.

**Work:** Define a data-driven story format for stages, choice-specific follow-ups, eligibility, location, deadlines, consequences and completion. Keep existing story events playable; decide and document what happens when a lead is declined, missed or expires. Add pure scheduling/progression helpers and persisted story state. Migrate existing saves without losing the chapter mission, commitments or resolved choices. Keep choice resolution in the existing advance-block flow; validate replacement plans atomically. Prevent completed stories from being offered again as fallback events.

**Done when:** A small fixture story branches on the player's choice, resolves or expires exactly once, and survives save/reload. Existing saves and authored events continue to work. Tests cover branches, deadlines, no eligible events, repeat prevention and migration.

## WP2 — Leads, invitations and diplomatic calendar

**Depends on:** WP1.

**Work:** Add a BlockBerry view of active leads and upcoming invitations with host, purpose, location, day/block, deadline and known time/money costs. Model national days, EU coordination, UN and other multilateral meetings, and invitations from other missions. Where appropriate, allow attend, delegate or decline; show staff availability and displaced routine duties before confirming. Make travel, player/staff capacity and funds use the same existing validation and queue. Explain missed events and show outcomes in the round report. Use named fictional hosts and characters, expandable in JSON.

**Done when:** A sample invitation can be attended, delegated, declined or missed, with a distinct recorded outcome and no double resolution. The player sees conflicts before committing; failed scheduling leaves the existing plan intact. Dates, leads and statuses persist across reloads. The chapter can still be completed after missing an optional event.

## WP3 — First complete slice: supplier and the Quiet Amendment

**Depends on:** WP1–WP2.

**Work:** Write the supplier's cousin as a two- or three-stage story with accept, investigate and legitimate-alternative paths; connect choices to costs, relationships and later consequences. Give the Quiet Amendment a distinct painted 2D scene, accessible hotspots, its contact and an actionable map lead. Keep travel via the store's move().

**Done when:** A player can discover, visit and resolve the story through at least two materially different paths, including leaving it unresolved. The consequences appear in reports and a later follow-up. Verify on desktop and mobile, including keyboard access, travel costs and save/reload between stages.

## WP4 — Protocol and the Foreign Ministry

**Depends on:** WP3.

**Work:** Add the seating/protocol incident, a distinct ministry scene and protocol-desk hotspot. Offer choices involving host goodwill and Capital's expectations, including delegation where suitable. Connect at least one outcome optionally to the ministerial visit.

**Done when:** Different choices produce traceable consequences for the host, Capital or relationships, and a follow-up acknowledges the choice. The main visit remains finishable through alternative paths. Check invitation, travel and staff conflicts and end-of-block resolution.

## WP5 — Press, development and diplomatic community

**Depends on:** WP4.

**Work:** Add the press-club briefing story and Elise's development/UN story, each with choice-dependent follow-ups. Author a varied initial calendar of national-day receptions, EU meetings, UN or other multilateral meetings and invitations from other missions. Introduce a small set of recurring fictional diplomats rather than generating interchangeable names. Create distinct scenes and hotspots for the Press Club and UN House, then the EU Delegation and Golf Club; give each a clear reason to visit and appropriate opportunities. Reuse shared scene components and semantic styling.

**Done when:** Each story has at least two meaningful outcomes, meetings and receptions can recur without repeating already-completed one-off stories, and the calendar supplies varied opportunities across the 15-day chapter without guaranteeing a compulsory event every block. All six outside locations have a distinct visual and actionable purpose.

## WP6 — Endings, pacing and release check

**Depends on:** WP5.

**Work:** Include selected significant side-story and diplomatic-calendar outcomes in the end-of-posting report. Play complete campaigns with different approaches: attend, delegate, decline and miss events; pursue and ignore side stories; prepare or fail the visit. Tune timing, DP and costs based on observations. Check desktop/mobile layouts, accessibility, persistence, JSON validation, types, tests and production build.

**Done when:** Both arcs remain visible throughout the chapter; choices and consequences can be traced in reports; the ending reflects important events without contradictions; optional side stories do not block the core mission. Record any remaining balancing or content gaps before considering the work complete.

## Progress notes

- **WP0, partial:** The existing automated campaign test reaches the Day 15 ending, and the opening/diary have been inspected in the browser. A human full-campaign playthrough and pacing review are still needed.
- **WP1, first slice:** Story outcomes record resolved choices and missed episodes; follow-ups can depend on choices, deadlines can expire, completed episodes no longer fall back into the schedule, and existing supplier choices migrate from saved flags. The supplier now has separate investigation and acceptance follow-ups.
- **WP2, first slice:** The BlockBerry diary and map expose three authored invitations (EU, Valdorian national day and UN roundtable). Attend, delegate, decline and missed outcomes use the existing round, DP, staff and economy rules. Longer-term lead tracking, a broader calendar and richer recurring diplomats remain to be built.
- **WP3, first playable slice:** The Quiet Amendment has its own painted scene; the supplier's investigation and acceptance paths unlock different in-person follow-ups there, with later visit-day consequences. The map and diary show active location leads. Automated branch and UI tests pass; a full campaign playthrough and mobile visual check are still needed.
- **WP4, first playable slice:** The Foreign Ministry has its own scene and a seating-plan incident with two opening approaches, a protocol-desk follow-up and visit-day consequences. Automated branch and goodwill checks pass; full pacing and mobile verification remain.
- **WP5, first playable slice:** Press Club and UN House now have distinct scenes and choice-dependent press/development follow-ups with visit-day payoffs. EU Delegation and the Golf Club also have distinct scenes. Valdoria's Mara Velen and Asteria's Niko Arden are recurring contacts with conversations, invitations and relationship effects; an Asterian invitation unlocks a later EU follow-up. Existing saves acquire new contacts without resetting prior trust. Outside appointments are accessible at their destinations. A human full-posting balance pass and mobile visual checks remain.
- **WP5, continued:** The press and development stories now branch into Press Club and UN House leads and visit-day outcomes. All six outside locations have distinct painted scenes and local appointment controls. Two named ambassadors recur in conversations and national-day/meeting invitations; invitation choices change their trust, including on missed invitations. Asterian coffee can lead to a subsequent EU coordination story. Existing-save contact merging is tested.
- **WP6, partial:** The ending lists recorded diplomatic-calendar responses and displays authored visit payoffs. Automated campaign, story, migration and UI checks pass. A full human playthrough and pacing review are still outstanding. Mobile map labels were replaced by a readable destination list after visual inspection; scene controls were adjusted for small screens.
- **WP6, continued:** Three automated 15-day campaign paths now exercise attending, delegating and declining invitations. All reach a prepared visit, including a path that books security early to handle a meeting/fax conflict. The ending includes recorded side-story choices and unresolved location leads. Already-completed travel is protected from replacement plans. A human full-campaign pacing playthrough remains outstanding; automated paths do not establish subjective fun or balance.

- **EU coordination, first slice:** Self-review recorded in EU_IMPLEMENTATION_REVIEW.md; Celeste leads a selectable EU roster, the former Asteria representative is Danish with stable save IDs, and the 17.6% meeting has three branches and choice-dependent follow-ups. The optional clean-port dispute now has four resource-validated choices and branch-specific host follow-ups; three additional city contacts have two conversations each. Further city-cast expansion and a full human pacing review remain.
- **Embassy relationships:** Pair effects identify the intended colleague; joint visit work can draw on either person's expertise while consuming both people's capacity and fatigue. The Sola–Elise project dispute and Pavel–Anselm rivalry now have choice-dependent embassy follow-ups. Further staff arcs, richer relationship reactions and full human pacing review remain.
