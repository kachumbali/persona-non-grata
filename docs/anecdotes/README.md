# Anecdote pipeline

Your real stories turn into anonymised, exaggerated scenes in the game's JSON. This folder holds the stories. The route is fixed so that every scene is funny, untraceable and valid.

## Folders

- `inbox/` New anecdotes. One file per anecdote, named `YYYY-MM-short-title.md` (for example `2026-11-seating-cards.md`). Copy `TEMPLATE.md` to start.
- `used/` An anecdote moves here once it has become a scene. Add a line at the top of the file: `Became scene: <id>` (the story event id, topic id, email id or clipping id).
- `rejected/` An anecdote moves here if it will not be used. Add one line at the top saying why (too traceable, too ongoing, not funny enough, duplicate of scene X).
- `.gitkeep` files only keep the empty folders in git. Leave them.

Moving files is the only record-keeping needed. Do not delete anything.

## The route

1. **Fill in the template.** Copy `docs/anecdotes/TEMPLATE.md` into `inbox/`, fill it in. Roles only, no names, nothing ongoing or classified.
2. **Scene writer.** Open `docs/prompts/scene-writer.md` in an AI tool. Paste the filled-in anecdote, choose the target format (story event, dialogue topic, email or press clipping), and paste the character and location ids it asks for. Output: JSON, a disguise note, and the flags set and read.
3. **Punch-up.** Run `docs/prompts/punch-up.md` on the JSON to make it funnier. Ids, numbers, effects and mechanics must stay unchanged.
4. **Reviewer.** Give the result to a different AI tool with `docs/prompts/reviewer.md`. It returns pass/fail per item with fixes. Apply the fixes (a second scene-writer or punch-up pass if needed) until everything passes.
5. **Content checks and tests.** Add the JSON to the right file under `src/game/data/` (`campaign.json` events, `dialogues.json`, `emails.json`, `press.json`). Run `npm test` and `npx tsc --noEmit`. Fix anything that fails. Once the content checker (work package F-04) exists, run it too.
6. **Owner approval.** You read the final scene in the game or in the JSON. You decide: approve, send back with a note, or reject. Only approved scenes are committed.
7. **File the anecdote.** Move it to `used/` with the scene id, or to `rejected/` with one line why.

The style rules every step follows are in `docs/WRITING_GUIDE.md`.
