<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Game content (emails, traits, backgrounds) lives in JSON under src/game/data so it can be extended without code; rules are pure TS in src/game/rules.ts (tested), state in a persisted zustand store.
- Embassy locations and personnel live in data/embassy.json; scene modules render a voxel diorama and nearest-filtered pixel sprites without changing gameplay rules.
- Embassy rendering uses CSS semantic palette tokens, a demand-rendered orthographic Canvas, and data-scene-ready on its wrapper so visual checks can wait for a drawn frame.

- Player portraits use bundled low-resolution raster assets with nearest-neighbour display; the retro interface is themed centrally through semantic CSS tokens and shared button bevels so gameplay rules remain separate from presentation.
- Record actual before/after goodwill values for every resolved decision or missed instruction; confirmed visit requirements come from JSON outcomes so the dashboard and endings share one source of truth.
- Scheduled blocks replace the live clock: queue decisions in the persisted store and resolve once on advance; NPCs, venues, dialogue and story episodes are authored in campaign JSON, with pure scheduling/social rules in rules.ts.
- Keep campaign money and capacity validation in browser-safe pure economy helpers, separate from clamped goodwill/needs; validate complete replacement plans atomically before committing so failed edits cannot discard existing obligations.
- Legacy JSON budget effects convert to currency at resolution boundaries; new commitments use explicit currency costs and TP, preserving authored outcomes during the staged economy refactor.
- The town map (CityMap) is the game's home screen; travel goes through the store's move(), which queues a DP-costing decision so the time rules stay in one place.
- Place screens (PlaceScene) use painted 2D backgrounds with percentage hotspots; the 3D EmbassyScene is no longer mounted. Capital mail goes to the secure fax (embassy only) by sender; other mail to the PC or the always-docked BlackBerry, which also owns round status and End block.
- Every posting has two concurrent story arcs: a chapter-long mission and daily side stories or side quests. Preserve both when extending the game; see GAME_DESIGN.md for the design rule.
- The diplomatic setting is around 2006: call the group the EU, use real country names only for EU member states, and keep the host and other third countries fictional and non-obvious. Preserve the user's deliberately anachronistic "Team Europe" satire; see GAME_DESIGN.md and EU_DIPLOMATIC_CAST_PLAN.md.
