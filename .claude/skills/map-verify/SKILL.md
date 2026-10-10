---
name: map-verify
description: Verify that an element added/moved on the game map is correctly placed — visually AND programmatically — before publishing. Use after adding decor, an obstacle, scatter/vegetation, or changing geometry (zones, arena, trail loop, openings). Takes multi-zone screenshots and checks walkability (openings not blocked, hop over/under logs). Triggers: "check the map", "is it placed right?", "the path is blocked", "it overlaps", "collisions".
---

# map-verify

Validate map placement **before** pushing — avoid round-trips (floating element,
blocked path, bare sand corner, collision that traps the player).
Requirements: `python3`, `node` + Playwright.

## Map landmarks
**Zones** (`GAME.zones`, e.g. the pen), **Arena** (`GAME.environment.arena`),
**Trail loop** (`LOOP_SEG` + `OPENINGS` = `PATHS`), **Stations** (buildings).
Vegetation by a **single rule** (`inBand` + `onPath` + protected zones).

## Procedure (Claude Code tools)
1. **Serve** — Bash: `bash .claude/skills/_shared/serve.sh 8099`.
2. **Multi-zone screenshots + walkability** — Bash:
   ```bash
   node .claude/skills/_shared/playtest.cjs --walk \
     --shots "top:1100:215:0.8,bottom:1100:1885:0.8,cornerTL:220:220:0.9,cornerTR:2580:220:0.9,openLeft:450:1430:0.8,openRight:2350:1430:0.8"
   ```
   Adapt the `name:x:y:zoom` points to the changed element (its zone + at least one
   corner and one opening if the geometry moved).
3. **Read the report**:
   - **Walkability** (`--walk`): `openingLeft`, `openingRight`, `trailTop`,
     `trailBottom` must be **empty** (`[]`).
   - **0 `pageError`**.
4. **Look at the screenshots** — **Read** `/tmp/engine-shots/*.png`: nothing floating,
   no **bare sand edge/corner**, sand under the vegetation, logs **centred** on the
   visible path, fences at the path edge (no overlap into protected zones).
5. **Validate several spots** (top/bottom/left/right/corners/openings), not just one.
6. If all good → chain **release-deploy**. Otherwise fix and repeat.

## Guard-rails
- **Never** push a map change without this validation.
- Non-empty walkability = a passage is blocked → revisit the collision (skill
  **add-collision**) or the position.

## Chaining
After **add-decor-item** / **add-collision** / **place-scatter** / **asset-add**
(when the addition is visible on the map), before **release-deploy**.
