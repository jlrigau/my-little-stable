---
name: add-collision
description: Add or tune a collision (obstacle) in a game built on this engine so the player (on foot or riding) can't pass through an element — or can hop over it. Handles the COLLISIONS array (AABB boxes) and the jumpable flag for hop-over obstacles. Triggers: "you can walk through the …, it needs a collision", "block this element", "make it jumpable", "the player passes through".
---

# add-collision

Stop the player crossing an element (or make it hop-over-able).

## Code involved (engine.js)
- Array **`COLLISIONS`**: **AABB** boxes `{ x, y, w, h }` (top-left corner), rebuilt
  every time the world is built (`buildWorld`).
- `blockObstacles` pushes the player back **per axis** (larger footprint when riding).
- Flag **`jumpable: true`** on a box = obstacle **clearable by hopping** (collision
  ignored during `jumpRunning`). Otherwise it fully blocks.
- Log convention (example): collision **shorter than the visual** so you can pass
  above/below → `{ x:r.x-22, y:r.y-50, w:44, h:100, jumpable:true }`.

## Where to add it
- Most obstacles are declared from **config data** (`GAME.environment`, `GAME.decor`
  collisions, scenery). Prefer adding the footprint there, via the matching skill
  (**add-decor-item**, **place-scatter**). Add a raw `COLLISIONS.push(...)` in
  `engine.js` only for a new engine-level element.

## Procedure
1. **Determine the box**: the element's **ground** footprint (not the whole sprite),
   centred on its base. Width/height in world pixels.
2. **Add it** when the element is created: `COLLISIONS.push({ x, y, w, h })`
   (+ `jumpable:true` if hop-over).
3. **Tune**:
   - Hard obstacle (tree, building, fence) → firm box, no `jumpable`.
   - Course obstacle (hedge, log) → `jumpable:true`, and a box **smaller than the
     visual** if the player should be able to go around it.
4. **Check walkability**: **map-verify** (`playtest.cjs --walk`) — corridors/paths
   stay passable, the player never gets stuck.
5. **Publish**: **release-deploy** if OK.

## Guard-rails
- A too-large collision **traps** the player → always test with `--walk`.
- On the trail paths, keep the openings clear (cf. **place-scatter**).
- Riding has a larger footprint: test mounted too if relevant.

## Chaining
(placing an element) → **add-collision** → map-verify → release-deploy.
