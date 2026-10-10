---
name: place-scatter
description: Modify the scattered vegetation / forest band around the trail loop in a game built on this engine (density, border, openings, corners) while respecting the SINGLE DECLARATIVE RULE that keeps the rendering continuous everywhere. Use to thicken/thin the forest, move an opening, widen the path, without reintroducing corner/edge bugs. Triggers: "more/fewer trees", "the forest around the trail", "the opening/path of the loop", "I see a bare sand edge/corner".
---

# place-scatter

Touch the trail forest **without breaking** continuity (the classic traps: straight
edges, bare sand corners, blocked corridors, off-centre logs).

## Principle (respect strictly)
The vegetation is placed by a **single rule** in `buildEnvironment()` (engine.js),
driven by **`GAME.environment`** — so it's identical and continuous everywhere,
corners and openings handled automatically:
- Grid over the whole world; keep only `inBand(gx,gy)`.
- **Skip** `nearStation` and `inProtectedZone` (home zone + arena).
- If `onPath(gx,gy,6)` → **clear** the path (nothing).
- Else if `onPath(gx,gy, hedgeMargin)` → **HEDGE** (low bush + small collision).
- Else → **FOREST** (trees, no tight collision).
- The **sand overflows by `path.sand` (~46) under the vegetation** → no visible edge/corner.
- `PATHS = LOOP_SEG.concat(OPENINGS)`; the logs (`LOGS`) are at the **visible centre**
  of the path (raised by `logs.dec`), collision shorter than the path.

## Good knobs (in `GAME.environment`)
- **Forest density**: `forest.step` (grid pitch) and the tree scales.
- **Hedge border thickness**: `forest.hedgeMargin`.
- **Path width**: `path.width` (the engine recomputes `LOOP_SEG`/`LOGS`).
- **Forest band**: `band` (keep the protected zones OUT of the band, else trees grow
  inside them — that's what `inProtectedZone` guards).
- **Openings**: `path.openings` (sand corridors); they stay open automatically because
  they're part of `PATHS`.

## Procedure
1. Change **the config constants/rule**, never by placing trees "by hand".
2. **Validate with map-verify** (`playtest.cjs --walk` + multi-zone screenshots:
   top/bottom/corners/openings). Walkability must be **empty**.
3. **Publish**: release-deploy if everything is clean.

## Guard-rails
- Any in-band protected area must NOT receive blocking vegetation (`inProtectedZone`).
- If a passage gets blocked → revisit the margins, don't add one-off exceptions.

## Chaining
**place-scatter** → map-verify → release-deploy.
