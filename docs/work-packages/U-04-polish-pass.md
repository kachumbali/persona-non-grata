# U-04 Polish pass: task brief

Follow the workflow in `docs/work-packages/README.md`. Read AGENTS.md, GAME_DESIGN.md, docs/WRITING_GUIDE.md and docs/BALANCE_REPORT.md first.

These are loose ends found by playing Day 1 by hand and by reading the simulation report. Each is small. Do them all, one commit per item.

## 1. Why do careful players ignore 14 mails per game?

The balance report shows the careful and press-reader bots end a game with about 14 mails marked ignored, none of them on Day 1. Find out why.

- If the bots fail to answer mail a player could answer (wrong device, wrong location, no DP left), fix the bots.
- If the game marks mail ignored that a player cannot reasonably answer in time (it arrives while they are away from the embassy, or more arrives than DP allows), that is a design problem. Report it with numbers per day and propose a fix. Implement the fix only if it is one of these:
  - mail that arrives while the player is away from the embassy gets one extra block before it counts as ignored;
  - a second answer on the same device in one block costs no extra DP.
- Record the finding in docs/BALANCE_REPORT.md either way.

## 2. Meters hit the ceiling

Host goodwill sits at 99 to 100 for a careful player from mid-game, so later gains do nothing. HQ goodwill does the same in some runs.

- Report, per bot, the day each meter first reaches 95 and the total of gains lost to the cap.
- Rebalance by scaling down routine gains, not by raising the cap. Target: for a careful bot, neither meter reaches 95 before Day 12 in more than 20% of runs.
- Ending thresholds stay as they are. Report how ending rates move.

## 3. The phone layout is crowded at the top

At 400px the header, the "Waiting" line, the first-day checklist and the mission panel push the game itself below the first screen.

- Make the header one compact row: portrait, name, day and block. Move "Personnel file", "Who is who" and "Menu" into one menu button on phones.
- The first-day checklist starts collapsed to one line on phones: "First day: 0 of 5 done", expandable.
- The bottom bar must not cover content: check every screen at 400 by 700.

## 4. The badges are too quiet

The count on the secure fax is small and sits apart from the label. Put the count inside the hotspot label ("Secure fax · 2"), in both the quiet and the urgent style. Do the same for the PC.

## 5. The planning desk reads like a spreadsheet

The "Staff & diary" tab opens with nine lines of "N baseline · N planned · N free DP" and five money figures.

- Collapse the staff capacity list behind a control: "Staff capacity: 5 of 9 colleagues have free time". Expanded, show it as today.
- Show money as one line, "Free to spend ƒ2,600", with the breakdown behind the existing "Visit costs & Capital funding" control.
- The large empty panel on the left ("Embassy: Your team, your in-tray, your responsibility.") should show the agenda for the current block instead.
- No rule changes.

## 6. Small text fixes

- The payslip prints deductions of zero, such as "Dry cleaning after toasts: −ƒ0". Leave out lines whose amount is zero.
- The personnel file lists languages by raw id and number: "bellaluxian: 3, ombrazian: 0". Show names and level names: "Bellaluxian: native. Ombrazian: none."
- Stats in the personnel file are shown as "gravitas: 5". Use the same labels and bars as the character builder.

## 7. Housekeeping

- The simulation's full-matrix test takes over 20 seconds on a slow machine. Split it so that no single test runs more than about 10 seconds on your machine, or move the full matrix behind `npm run sim` and keep a reduced matrix in the test suite. Thresholds must still be checked somewhere that the workflow runs.
- Regenerate docs/BALANCE_REPORT.md.

## Deliverables

A summary with: the finding and numbers for item 1; before and after ceiling numbers for item 2; screenshots or plain-text renderings of the phone header and the planning desk; test and simulation results; anything you could not do.
