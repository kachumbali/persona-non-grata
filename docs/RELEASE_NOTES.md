# Release notes

## Stabilization, 17 November 2026

A feature freeze to make the existing game consistent and dependable. No new systems were added.

### What changed for players

- **Pop-ups make sense where they appear.** Every pop-up is now a phone call, a message or a visit at your door, and says so in its heading. A visit while you are away from the embassy arrives as a note. Scenes that only work in a room were rewritten or moved.
- **People and places have more substance.** Everyone in "Who is who" has a short biography. Each place has a description, its regulars and a line on what it is like at each time of day.
- **All text was read and corrected.** Dialogues, story events, gossip, mail, démarches, invitations and the press were checked against a cast and places reference. More than 100 fixes, including:
  - language options that all shared one answer;
  - dates after 2006;
  - repeated jokes;
  - jokes that came close to aiming at nationality or accent;
  - the visiting Minister's pronoun;
  - Bianca's rank;
  - three pieces of gossip that shared one misheard version.
- **Options you cannot afford** are greyed out with the reason underneath, instead of doing nothing when clicked.
- **Phones:**
  - The header is one compact row, with the extra buttons in a menu.
  - The first-day checklist starts collapsed.
  - Nothing hides behind the bottom bar.
- **Waiting mail** shows as a count inside the fax and PC labels.
- **The planning desk** shows the current block's agenda, one money line and a collapsible staff list.
- **Saves:**
  - A damaged save slot no longer wipes the other slots. It is kept as a backup and the title screen says so.
  - Saves from every earlier version load.
- **If a screen crashes,** you see a short message with "Back to the title screen" and "Copy error report". Your save is not touched.
- **Small text fixes from a hand playtest:** colleague names instead of internal ids in reports, plurals, and an accurate place for each agenda item.

### Known and accepted

- **Attentive play is too safe.** Simulated careful players are promoted in 98–100% of games. Balance changes wait for more human playtests. See `docs/BALANCE_REPORT.md`.
- **Goodwill meters reach 100 by mid-chapter** for careful players, so late gains do nothing. Same decision as above.
- **The first "Personnel file amended" quirk can arrive on Day 1** for a character who makes formal choices from the start. It works as designed, but feels early. Review with the balance work.
- **Some pop-ups need a colleague who has no free time** in that block. The option is greyed out with a checkbox to pull them off routine duties. Playtesters should say whether this is clear.
- **Deliberate choices:**
  - Lucien's social-media words ("hashtag", "selfie") are a deliberate anachronism.
  - BlockBerry, Chirper and Chercheur are deliberate satirical brands.
  - Quote marks are made consistent as text is edited, not in bulk.
- **The scripted browser playthrough (`npm run playthrough`)** checks for crashes and broken text. Its fixed playing style loses the chapter early, so it does not cover Day 15 or the debrief.

### How to report a problem

Note the day, the block and what you clicked. If the game shows the crash screen, press "Copy error report" and paste it into your note. Screenshots help, especially on phones.

### For developers

- `npm run playthrough`: a scripted 15-day browser run with a findings report in `docs/PLAYTHROUGH_REPORT.md`.
- `npm run sim:check`: the full simulation thresholds. They also run on every push.
- `docs/CAST.md` and `docs/PLACES.md` are the reference for every text change. Audit findings are in `docs/audit/`.
