# Work package briefs: queue and workflow

> **Feature freeze from 17 November 2026.** Work only on `docs/STABILIZATION_PLAN.md` until it is complete. The queue below is on hold. U-04 is folded into Q-06 of the stabilization plan.

One brief per package. Take them in this order unless told otherwise.

| Order (on hold) | Brief                          | What it is                                                     |
| --------------- | ------------------------------ | -------------------------------------------------------------- |
| 1               | `U-03-morning-briefing.md`     | The first briefing in three pages, and a report every morning  |
| 2               | `U-04-polish-pass.md`          | Loose ends found while playing and in the balance report       |
| 3               | `S-04-your-past-catches-up.md` | The character's background returns as story                    |
| 4               | `S-15-world-file.md`           | Background events that make the press and the setting coherent |
| 5               | `A-01-cultural-institute.md`   | A story arc: the institute and its very strange director       |

Done briefs stay in this folder as a record: B-02, S-02, S-03, S-05/S-08, S-06, U-01, U-02.

## Workflow for every package

1. `git fetch origin` and start from the latest `origin/main`.
2. Work on the branch `dev`. Reset it to `origin/main` first if it is behind: `git switch -C dev origin/main`.
3. Commit in small steps. Every commit message starts with the package id.
4. Before integrating, run all six checks. All must pass:
   - `npx tsc --noEmit`
   - `npm run lint`
   - `npm test`
   - `npm run content:check`
   - `npm run sim`
   - `npm run build`
5. Integrate into `main` yourself:
   - `git fetch origin`
   - `git rebase origin/main` (or merge, if the rebase conflicts)
   - run the six checks again if `main` had moved
   - `git push origin dev`
   - `git push origin dev:main` (fast-forward only; never force-push `main`)
6. Check that the GitHub Actions run on `main` is green. If it is red, fix it before starting the next package.
7. Tick the package in `roadmap.md` and mark it "(done)" in `docs/MASTER_PLAN.md`.
8. Finish with the summary the brief asks for.

## Standing rules

- Optional stories never block the chapter's mission.
- Content in JSON, rules in pure tested TypeScript, a save migration for every new saved field.
- House style from `docs/WRITING_GUIDE.md`. Jokes aim at institutions and habits, never at nationality, ethnicity or accent. No real people.
- No test may depend on a tight time limit. GitHub's machines are slower than a laptop.
- Never modify the Lovable block in AGENTS.md. Restore it if Prettier reformats it.
- Readable at 400px width. Keyboard accessible. Existing CSS tokens only.
- Do not rewrite pushed history.
