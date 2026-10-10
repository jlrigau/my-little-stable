---
name: add-creature-variant
description: Add a new VARIANT (colour/skin) of the creature in a game built on this engine. Handles the GAME.creature.variants entry — either a colour TINT of the base spritesheet, or its own dedicated spritesheet — plus the customization swatch. Triggers: "add a colour/variant of the creature", "a new skin", "a pink/spotted/… one".
---

# add-creature-variant

Add a creature variant. Two supported modes — pick one per variant.

## Code involved (game.config.js)
- Array **`GAME.creature.variants`**: `{ id, name, color, tint?, sheet?, happySheet?, thumb?,
  closeupBg?, closeupBgDone?, fixedName? }` (see ENGINE.md).
  - **Tint mode** (simplest): `{ id:"sky", name:"Sky", color:"#6fb7e8", tint:"#6fb7e8" }`.
    The engine recolours the base spritesheet (`GAME.creature.sheet`) with `setTint`.
    `color` = the swatch shown in the customize menu (usually = the tint).
  - **Sheet mode**: `{ id:"spotty", name:"Spotty", color:"#cccccc", sheet:"creature_spotty" }`
    where `creature_spotty` is a spritesheet key in `GAME.assets.sheets`, **same grid**
    as the base (`GAME.assets.sheets.critter` in the demo).
- Loading is automatic: tint mode needs no new asset; sheet mode is loaded via the
  `assets.sheets` registry. Customization menus iterate over `variants` automatically.

## Procedure
1. **Choose mode**: tint (no asset, instant) or dedicated sheet. **Preferred for quality:**
   add the variant to the game's art module (`tools/art/<game>.cjs` — the creature is a
   parametric function: add a colour/palette entry) and re-render with
   `render-svg.cjs --only <key>`: you get the walk sheet, the customize `thumb`, and the
   close-up backdrops (`closeupBg` / `closeupBgDone`) consistently from one drawing.
2. **Add the entry** to `GAME.creature.variants`: unique `id`, friendly `name`,
   `color` swatch, and either `tint` or `sheet`.
3. **Look**: **visual-review** (art-check on the new sheet + full-size look).
   **Test**: **test-debug** — the variant appears in the Style menu, the creature renders
   with the new look and still animates, no load error.
4. **Publish**: **release-deploy** (bump `vN` if you added an image).

## Guard-rails
- `id` unique. Sheet mode: **same frame grid** as the base, else the animation breaks.
- Keep the style consistent with the game's theme.

## Chaining
(asset-add if sheet mode) → **add-creature-variant** → test-debug → release-deploy.
