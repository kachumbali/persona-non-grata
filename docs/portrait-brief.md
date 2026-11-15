# Portrait artwork brief

Each image is a 96×128 px PNG: pixel-art head and shoulders in three-quarter view, comic caricature with a knowing side-eye. Use the exact flat teal background from `diplomat-1.png`, with the existing palette depth, outline weight and lighting. Dress characters in mid-2000s diplomatic office wear.

## Player pool

Create 16 new player-selectable portraits: eight women and eight men, ages 25–65, with a broad range of ethnicities and hair. Include glasses, beards, a headscarf and grey hair. Comic touches come from accessories, not identity: a lanyard with too many badges, a BlackBerry at the ear, a coffee stain on a tie, or an upside-down lapel flag pin.

## NPC portraits

Create one unique portrait for each NPC, with a filename `npc-<id>.png`. Match the gender and show a fitting role detail:

- `anselm` — Anselm Voss-Rietveld (male): Political & Press Officer · first posting.
- `pavel` — Pavel Oskarsen (male): Veteran Head of Administration.
- `sola` — Sola Dewrin (female): Local Staff Chief.
- `development` — Elise (female): Development Counsellor.
- `bianca` — Bianca Montefiore (female): defence attaché uniform.
- `ines` — Ines Thibault-Lund (female): Consul.
- `press` — Lucien Falk (male): Digital & Public Diplomacy Officer.
- `maxim` — Maxim (male): oversized suit and intern badge.
- `ketu` — Ketu Marrimba (female): chef's whites.
- `protocol` — Director Ndao (male): immaculate protocol suit and sash.
- `eu` — Celeste Norren (female): EU-blue scarf and stars pin.
- `fixer` — Marcel Deux (male): sunglasses and open collar.
- `journalist` — Ruth Vale (female): notebook and press lanyard.
- `golf` — Minister Bako (male): golf visor over ministerial suit.
- `un` — Dr Amara Chen (female): UN Resident Coordinator.
- `amb-valdoria` — Ambassador Mara Velen (female): Ambassador of Valdoria.
- `amb-asteria` — Ambassador Niko Arden (male): Ambassador of Denmark.
- `port-officer` — Mira Sene (female): Ombrazian Port Environment Officer.
- `bar-insurer` — Sofia da Costa (female): Portuguese Maritime Liaison.
- `un-coordinator` — Idra Venn (male): UN Programme Logistics Officer.
- `eu-germany` — Klaus Weber (male): German Ambassador.
- `eu-france` — Henri de Valois (male): French Ambassador.
- `eu-malta` — Tanya Farrugia (female): Maltese Ambassador.
- `eu-sweden` — Lars Lindqvist (male): Swedish Ambassador.

## Integration

Place each PNG in `src/assets/portraits/`, then add its stable ID, filename, gender, age (`young`, `mid`, or `senior`) and short look description to `src/game/data/portraits.json`. For an NPC-specific portrait, add `reservedFor` with the NPC ID and update that NPC's `portrait` in the chapter's `campaign.json`. Reserved portraits are excluded from the player picker. The integrity tests check the assignments as the collection grows.
