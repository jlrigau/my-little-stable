---
name: sync-engine
description: Backport engine + skills + tooling improvements FROM a game (made from this template) INTO the template, so learnings made while building games enrich the template for the next game. Run from the TEMPLATE repo. Use when a game has evolved the engine layer and you want it upstream. Triggers: "backport the engine from <game>", "sync the template with <game>", "pull the learnings back into the template", "harvest engine changes from a game".
---

# sync-engine (template ⇐ game)

A template-generated repo shares **no git history** with the template (it's not a fork),
so this is **not a merge** — it's a deliberate, file-scoped backport. It works only
because the **engine layer is cleanly separated** (proven by `separation-audit.cjs`): it's
a known set of files with **zero game content**, so they port across unrelated repos.

> **Direction:** runs in the **template**, pulls FROM a game. (The `capitalize-learnings`
> skill is what put each learning into the engine layer in the first place — this skill
> harvests it.)

## What moves vs what doesn't
- **Backported (engine layer):** `engine.js`, `engine.css`, `ENGINE.md`, `.claude/skills/`
  (incl. `_shared/` tooling). Optionally `vendor/` (Phaser, fonts), `.github/workflows/`.
- **Never backported (game layer):** `game.config.js`, `assets/`, `index.html`,
  `style.css`, `manifest.webmanifest`, `README.md`, `tools/`, `.claude/settings*.json`.
- **By hand:** `CLAUDE.md` (mixes engine conventions + template identity) — merge only the
  convention bullets.

## 1. Find the games (discovery)
There is **no GitHub API** that lists repos generated from a template (a generated repo
knows its template via the `template_repository` field, but not the reverse). So enumerate
them one of these ways:
- **Topic search (preferred):** `new-game` tags each game with a topic
  `built-with-<template>`; list via `GET /search/repositories?q=topic:built-with-<template>`.
- **Account scan:** list your repos and keep those whose `template_repository.full_name`
  is your template.
- **Manual registry:** a `GAMES.md` in the template.

## 2. First time = manual bootstrap
You can't use this skill to import this skill. The **first** backport from the most-
evolved game is manual (it brings everything, including this skill):
```bash
git remote add <game> <url> && git fetch <game>
git checkout <game>/main -- engine.js ENGINE.md .claude/skills
node .claude/skills/_shared/separation-audit.cjs && node --check engine.js
# review, then commit
```

## 3. Routine harvest (after bootstrap)
```bash
bash .claude/skills/_shared/sync-engine.sh <game-git-url|remote> [ref]
```
It refuses on a dirty tree, fetches, checks out **only** the engine-layer paths, runs the
separation audit + `node --check`, and stops **without committing** so you review
`git diff --cached`. Then:
1. Resolve overlaps if several games touched `engine.js` differently — **one game at a
   time**, audit + tests after each.
2. **Upgrade the demo** to exercise any new flagship capability so it can't rot and is
   discoverable — e.g. give the demo a **close-up** loop (`action.type:"closeup"`). Keep
   the demo MINIMAL (one creature, one zoom-clean action): small *and* showcases the
   feature. This is **game content authored in the template**, not pulled from a game.
3. Verify on the demo (**test-debug**, `--engine webkit` for touch), then **release-deploy**.

## Guard-rails
- Pull **only** the engine-layer paths; never a game's config/assets/theme/README.
- The **separation audit must stay green** after a sync — if a game leaked content into
  `engine.js`, fix it in the game (and via `capitalize-learnings`) before backporting.
- Keep new engine features config-gated, so the demo and every existing game still run.
- Never `--force`; review every staged diff before committing.

## Chaining
Source side: **capitalize-learnings** (puts learnings into the engine layer per game).
Template side: **sync-engine** (harvest) → upgrade demo → **test-debug** → **release-deploy**.
