---
name: add-character
description: Add a new playable CHARACTER (player avatar) to a game built on this engine. Handles the GAME.characters entry, the walkcycle spritesheet (LPC layout, any frame size — 128 px recommended), the menu thumbnail, and the create/change-look flow. Triggers: "add a character", "a new avatar", "another playable hero".
---

# add-character

Add a playable avatar (4-direction walkcycle).

## Code involved (game.config.js)
- Array **`GAME.characters`**: `{ id, name, sheet, thumb }`
  (e.g. `{ id:"a", name:"Robin", sheet:"char_a", thumb:"char_a_thumb" }`).
- `sheet` = a spritesheet key in `GAME.assets.sheets` (frame **N×N**, same size as the
  other avatars — 128 px for smooth hi-res art, 64 px for legacy pixel art; walkcycle
  **9 cols × 4 rows** = up/left/down/right, col 0 = idle). Origin ~0.97 (feet on the
  ground), scale via `GAME.player.scale` (~0.8 for 128-px frames, ~1.7 for 64-px).
- `thumb` = a menu thumbnail in `assets/ui/<thumb>.png`, referenced by the engine as
  `assets/ui/<thumb>.png` (cropped portrait of the avatar).

## Procedure
1. **Assets ready**: spritesheet (**same grid** as the existing avatars, e.g. `1152×512`
   for 128-px frames) registered in `GAME.assets.sheets`, plus a thumbnail
   `assets/ui/<thumb>.png`. **Preferred:** add a palette/style entry to the game's art
   module (`tools/art/<game>.cjs` — the character is a parametric function drawn for each
   direction/phase) and render it with `render-svg.cjs` (see ENGINE.md "Art pipeline").
   Otherwise compose/crop an external sheet (skill **asset-add**).
2. **Add the entry** to `GAME.characters` (unique `id`, `name`, `sheet`, `thumb`).
3. **Test**: **test-debug** — the avatar appears at creation and via "change my look",
   animates (4 directions + idle), feet on the ground (no floating).
4. **Publish**: **release-deploy** (bump `vN`).

## Guard-rails
- **Same dimensions/grid** as the existing avatars (else the animation breaks).
- `id`/`sheet`/`thumb` unique and consistent.

## Chaining
asset-add → **add-character** → test-debug → release-deploy.
