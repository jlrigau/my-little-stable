---
name: state-migration
description: Add or evolve a saved game-state field (state / localStorage) in a game built on this engine in a BACKWARD-COMPATIBLE way, so existing players' saves don't break. Use when a new feature needs to store something (goals, level, a new setting, a counter…). Triggers: "save this new thing", "add a field to the state", "don't break in-progress games".
---

# state-migration

Evolve `state` without breaking existing saves.

## Code involved (engine.js)
- `state` = the big saved object. **`save()`** serialises to `localStorage`
  (key `GAME.meta.saveKey`), skipping `obj` (Phaser refs); **`load()`** reads it back.
- `continueGame()` normalises the loaded state (defaults for missing fields, merges
  each creature onto a fresh template so new need fields appear).
- Saving is **automatic** (called by `refreshHud()` and after actions).

## Procedure
1. **Define the field**: clear name, safe default (e.g. `state.goalsDone = {}`,
   `state.level = 1`).
2. **Backward compatibility** (essential): at **creation** (`newGame`) AND at **load**
   (`continueGame` normalisation), guarantee the field exists:
   `state.level = state.level ?? 1;` — never assume it's already there.
   - For per-creature fields, the engine already merges each creature onto a fresh
     `newCreature({})`, so new `GAME.creature.needs` get defaults automatically.
3. **Read/write** the field where needed, then let the **auto-save** persist it
   (or call `save()` if outside the normal flow).
4. **Test**: **test-debug** —
   - new game: field present and correct;
   - **old save** (without the field): loads without error and the default applies
     (simulate by injecting a partial `localStorage` via `page.evaluate`).
5. **Publish**: **release-deploy** (bump `vN` — engine.js/config changed).

## Guard-rails
- **Always** a default + injection on load (else `undefined` breaks old games' UI).
- Don't rename/remove an existing field without migrating (read old, write new).
- Don't serialise Phaser refs (the `obj` keys are already excluded).

## Chaining
(feature that stores data) → **state-migration** → test-debug → release-deploy.
