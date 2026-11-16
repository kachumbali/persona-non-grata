# U-01 The agenda: what you committed to, where and when: task brief

Repository: kachumbali/persona-non-grata, branch `main`. Stack: React + TypeScript + Vite, zustand, vitest, bun.

Read first: AGENTS.md (including "Work packages"), GAME_DESIGN.md, docs/WRITING_GUIDE.md.

Then read:

- `src/game/rules.ts`: `PendingDecision` and its fields (`source`, `kind`, `eventId`, `eventChoice`, `location`, `worker`, `partner`, `task`, `step`, `emailId`, `emailAction`, `timeCost`, `cashCost`, `remainingBlocks`).
- `src/game/store.ts`: `pending` (the plan for the current block), `todayPlans` (plans already resolved today, by block), `yesterday`, `report`, `log`.
- `src/game/calendar.ts`: `visibleInvitations`, `dueInvitations`.
- `src/game/mission.ts`, `src/game/demarche.ts`, and the language exam day if S-03 has landed.
- `src/game/components/BlackBerry.tsx` (tabs: status, calendar, mail), `DiplomaticCalendar.tsx`, `PlanningDesk.tsx` ("Committed this round"), `ResourceDesk.tsx` ("Your diary"), `PlaceScene.tsx` (the embassy PC tabs: mail, tasks, watch), `Interruption.tsx`, `LocationLead.tsx`.

## The problem, from a playtester

> "I committed to visit something, forgot what it was, but all I can find in my diary is a note that I've committed to something, but not what or where."

What the code does today:

- The commitment lists in the BlockBerry status tab and the Planning Desk print one line per commitment: `source · N DP · cost`. `source` is only a title, such as an event's headline ("Your presence is requested immediately"). The line does not say what the player chose, where it happens, or who goes.
- Both lists show the current block only. There is no view of the whole day.
- The BlockBerry calendar tab lists upcoming invitations, but not what the player has already committed to, and nothing else that is time-bound.
- Blocks already played today are not shown anywhere except in the running log.

## Goal

At any moment, in one place, the player can answer: what am I doing this block, where, with whom, what did I already do today, and what is coming that I must not miss.

## Part 1: describe a commitment properly (pure function)

Add `src/game/agenda.ts` with a pure, tested function:

`describeCommitment(decision, chapter): { what: string; choice?: string; where?: string; who?: string; dp: number; cash: number; kind: string }`

It derives everything from ids already on the decision. No new saved fields.

- **what:** the title of the event, invitation, lead, démarche or mission step. For a mail, the subject. For travel, "Travel to <place>".
- **choice:** the label of the option the player picked, looked up from `eventChoice`, `emailAction`, the route id, or the invitation response ("Attend in person", "Send Anselm", "Decline"). Never show the result text, which would spoil the outcome.
- **where:** the location name from `decision.location`, or the event's or invitation's own location.
- **who:** the colleague's name when `worker` or `partner` is set. "You" otherwise.
- If something cannot be derived, fall back to `source`. Never show an empty line.

Use it in both existing lists:

- BlockBerry status tab, "Committed this <block>".
- Planning Desk, "Committed this round".

Each line reads like: **Plaque unveiling at the Foreign Ministry** · Attend in person · you · 2 DP · ƒ0.

## Part 2: the agenda view

Add an `Agenda` component and show it in two places:

- As the first thing in the BlockBerry **calendar** tab, above the invitations. Rename the tab label to "Diary" if "Calendar" no longer fits.
- As a new tab on the embassy PC next to mail, tasks and watch.

It shows today as four rows, one per block (Morning, Midday, Afternoon, Evening):

- **Past blocks today:** what the player did, from `todayPlans`, using `describeCommitment`. Greyed, with a tick.
- **The current block**, marked "now":
  - what is committed, with remove buttons as in the existing lists;
  - what is still unanswered in this block: an invitation due now, an event waiting, a mail that will count as ignored at the end of the block, a démarche whose deadline is this block, a mission step that expires or that a setback has reopened. Each unanswered item says where to go to deal with it.
- **Later blocks today:** fixed things known in advance: invitations due, démarche deadlines, the language exam, a mission step that opens.
- Under today, a compact **"Coming up"** list for the next three days: the same fixed things, one line each, with day and block.

Rules:

- The agenda never reveals outcomes or hidden content: only things the player has already been told about.
- Every entry shows what, where and when. An entry at another location says so, with the travel cost.
- If nothing is planned for the current block, say so in the game's voice, as the existing empty states do.
- Readable at 400px width in the BlockBerry. Keyboard accessible. Existing CSS tokens only.

## Part 3: stop the player from forgetting

- **End-of-block check.** When the player presses "End <block>" while something time-bound in this block is unanswered (an invitation due now, a waiting event, a démarche at its deadline), show a short in-page confirmation that lists those items by name and place, with "Go back" and "End the block anyway". Do not use `window.confirm`. Mail that is not time-critical does not trigger it.
- **Travel check.** The existing message "You have an appointment here this block. Cancel it before travelling." must name the appointment and the place.
- **The header line.** Next to "N DP left this block" on the main screen, show the next fixed commitment in one short line, such as "Next: Danish reception, EU Delegation, Day 3 Midday".

## Part 4: tests

- Unit tests for `describeCommitment` covering: an event choice, an invitation attended, delegated and declined, a location lead, a mission step done in person and delegated, a mission route, a démarche by each route, a mail reply, travel, a social meal, rest, and the fallback.
- Component tests: the agenda shows past, current and later blocks; unanswered items appear and disappear when answered; the end-of-block confirmation appears only when something time-bound is unanswered; the commitment lines in both lists show what, choice, where and who.
- No changes to rules or outcomes. The simulation numbers must not move.

## Rules

- No gameplay change: this package only shows information the game already has, plus the end-of-block confirmation.
- No new saved state unless unavoidable. If you add any, bump the posting version and migrate.
- Never modify the Lovable block in AGENTS.md. Restore it if Prettier reformats it.
- Commit messages start with "U-01: ". Do not rewrite pushed history.
- Before pushing run `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run content:check`, `npm run sim` and `npm run build`. All must pass.
- Add a line to roadmap.md and mark U-01 done in docs/MASTER_PLAN.md with "(done)" after the heading.
- Push to `origin/main` when finished.

## Deliverables

- Code and tests.
- A summary with: three example commitment lines before and after; a plain-text rendering of the agenda for a busy day; what triggers the end-of-block confirmation; anything you could not derive from existing state.
