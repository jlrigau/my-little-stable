# 🐴 Mon Centre Équestre

Un jeu de **centre équestre** pour les enfants de **9-10 ans** (filles et garçons), en
français. On se promène dans son centre, on s'occupe de ses chevaux — **nourrir**,
**brosser** (on frotte la boue avec le doigt jusqu'à ce que le pelage brille), **jouer**,
**relooker** — on les **monte** sur le parcours de cross et on **saute** les obstacles de
la carrière. Des poulains naissent quand deux chevaux sont très heureux, et le centre
s'embellit au fil des progrès.

▶ **[Jouer à Mon Centre Équestre](https://jlrigau.github.io/my-little-stable/)**

> Les parties de l'ancienne version sont **reprises automatiquement** (chevaux, noms,
> robes, pièces, décorations, objectifs).

> Mon Centre Équestre is built on a **generic, reusable 2D game engine** (Phaser 3, 100%
> static, no build). The whole game lives in `game.config.js` + assets (all art generated
> from `tools/art/stable.cjs`); the engine code is never game-specific. The rest of this
> README is that engine's documentation — **how to build your own game the same way.**

---

# 🎮 The engine behind it

## 🆕 Create a new game

This repo is a **GitHub template** — each game lives in its **own repository**, so the
engine stays clean and you can make as many games as you like.

1. **Use this template → Create a new repository.** Click the green **“Use this
   template”** button on the repo home and name your game (e.g. `my-space-game`). You get
   a fresh, independent repo containing the whole engine + a game that already runs.
2. **Open it in Claude Code, on the `main` branch** (see the warning below).
3. **Run `/new-game`.** It interviews you — **theme, target age/audience, art style,
   language, core loop** — then writes your `game.config.js`, creates/sources the assets,
   themes the look, tests it, and can deploy. It **never edits `engine.js`**.
4. **Turn on GitHub Pages:** in your repo, **Settings → Pages → Source → “GitHub
   Actions”**. Your game goes live at `https://<you>.github.io/<repo>/`, and every later
   push to `main` redeploys automatically.

That's it — you now have your own game. Keep shaping it by [iterating](#️-make-it-yours-by-iterating).

> **⚠️ Run the Claude Code session on `main`.** When you open your game repo in Claude
> Code (web), make sure it **develops on `main`** — a session can otherwise spin up a
> separate branch. If the game is pushed to another branch, GitHub Pages won't publish it
> (Pages deploys the **default branch**) and the first deploy fails. Working on `main`
> keeps every push a one-click deploy.

> **Start small.** A new game should be tiny: one place, one creature, 1–2 needs, two
> actions, maybe a small goal. You grow it by iterating — that's the whole workflow, so
> don't pile on features up front.

*(Prefer a hands-on start? You can skip `/new-game` and edit `game.config.js` yourself —
the full field-by-field schema is in **[ENGINE.md](ENGINE.md)**.)*

---

## ✏️ Make it yours by iterating

Most changes are a small config edit, each with a dedicated skill — just ask in plain
language (e.g. *“add a pink critter”*, *“let me ride them”*, *“add a shop”*):

| Want to add… | Where it lives | Skill |
| --- | --- | --- |
| A new colour/skin for the creature | `creature.variants` (a tint, or a sheet drawn in `tools/art/`) | add-creature-variant |
| Rename / restyle creatures | `creature.customize` | — |
| A shop & coins | `economy` + `shop` (and `meta.showCoins`) | — |
| Buyable, placeable decorations | `GAME.decor` | add-decor-item |
| Riding + obstacles to hop | `creature.ride` (+ `environment.arena`) | add-collision |
| Babies / growing up | `creature.breeding`, `creature.aging` | — |
| A scattered forest / trail loop | `GAME.environment` | place-scatter |
| More goals / levels | `GAME.objectives.levels` | — |
| Another playable character | `GAME.characters` | add-character |
| Brand-new art | `tools/art/<game>.cjs` → `assets/` (SVG → PNG) | asset-add (or asset-search for external art) |
| New UI icons | `GAME.icons` (`_shared/icon-kit.cjs`) | — |
| Theme-specific effects (e.g. stars when playing) | `action.anim` particles | — |

Nothing here ships in the starter on purpose — you switch features on as you need them.
For **non-technical feedback** (a child, a client, a playtester), the **feedback-session**
skill lets them drive changes in plain words while the technical work happens silently.

---

## 🤖 Skills (Claude Code)

Game-authoring helpers in `.claude/skills/` — invoke with `/<name>` or just describe what
you want.

| Skill | What it does |
| --- | --- |
| **new-game** | Scaffold a brand-new game (interactive; starts minimal). |
| **feedback-session** | Non-technical “playtester” mode — changes from plain-language feedback. |
| add-character · add-creature-variant · add-decor-item · add-collision · place-scatter | Add the matching piece of content. |
| asset-search · asset-add | Find (with content + license checks) and integrate art. |
| state-migration | Add a saved field without breaking existing saves. |
| test-debug · map-verify | Prove a change works / check map placement (headless, with proof). |
| visual-review | Art + UI QA at full size (anatomy, clipping, icons, short/tall screens) — before every publish. |
| capitalize-learnings · sync-engine | Fold learnings back into the engine/skills; backport them into the template. |
| ios-pwa-check | Keep the iPhone/PWA layout clean. |
| release-deploy | Cache-bust, push to `main`, verify the Pages deploy. |

---

## ▶ Run & test locally (optional)

You rarely need this — Claude Code tests for you — but to run the game yourself:

```bash
bash .claude/skills/_shared/serve.sh 8099    # open http://localhost:8099/
```

Phaser is **vendored** (`vendor/phaser.min.js`) — no CDN, works offline. A headless
Playwright harness (`playtest.cjs`) drives the real game with screenshots and assertions;
the **test-debug** / **map-verify** skills use it.

---

## 🌐 Deploying

Pushing to `main` runs `.github/workflows/deploy.yml`, which publishes to GitHub Pages
(enable it once, step 4 above). Whenever JS/CSS/images change, the cache version `vN`
must be bumped — the **release-deploy** skill (and `bump-version.mjs`) does it, commits,
pushes, and confirms the deploy went green.

---

## 🧩 How the game works with the engine

You don't need this to make a game (the steps above do), but it explains what's actually
happening, and it's what you'll edit for advanced changes.

**The model — a game is `engine + config + assets`.** At load, `index.html` runs three
scripts **in order**:

```
vendor/phaser.min.js   →   game.config.js   →   engine.js
                            (window.GAME)        (reads window.GAME)
```

- `engine.js` is the **generic engine**: it implements every system (movement, rendering,
  collisions, UI, day cycle, save…) but contains **no game content**. You don't edit it.
- `game.config.js` is your **whole game**: all data, strings, world geometry, the
  creature and its needs/actions, economy, objectives, and references to assets — set on
  the global `window.GAME`.
- `style.css` is the **theme** (CSS variables at the top). `assets/` holds the art.

**Anatomy of `game.config.js`.** It assigns one object whose top-level keys are the
game's building blocks:

```js
window.GAME = {
  meta,            // title, icons, save key, theme colours, audience, UI strings
  world, camera,   // size, ground tile, background, zoom
  assets, fence,   // images + spritesheets to load
  player, characters,   // avatar(s) and the create screen
  creature,        // the creature system (needs, actions, variants, ride, breeding…)
  zones, stations, // the pen; buildings (rest / shop / custom)
  economy, shop, decor,      // coins, shop, placeable decorations
  environment, scenery,      // arena + trail loop + scattered props
  objectives, help,          // gamification levels; help screen
};
```

For example, the demo's creature is described — not coded — like this:

```js
creature: {
  label: "critters", sheet: "critter", scale: 1.0,
  moodNeed: "joy", moodFrom: ["fuel", "joy"],
  needs: [ { id: "fuel", icon: "battery", start: 70, perDay: -22 }, { id: "joy", icon: "joy", start: 80 } ],
  actions: [
    { id: "feed", label: "Feed", icon: "battery", effects: { fuel: 35, joy: 8 },
      anim: { motion: "nod", particle: "spark", colors: ["#9fe8ff", "#ffffff"] }, message: "{i:battery} {name} recharged!" },
    { id: "play", label: "Play", icon: "ball", effects: { joy: 22, fuel: -6 },
      anim: { motion: "hop", particle: "star", colors: ["#fff2a8", "#a8e6ff"] }, message: "{i:ball} {name} had fun!" },
  ],
  names: ["Zib", "Lumi", "Pulse"], startCount: 3,
},
```

Handy to know:
- **Every UI string** has an engine fallback — override only what you want in `meta`.
  Strings interpolate `{name}`, `{day}`, `{names}`, `{item}`; `{i:key}` inserts an
  illustrated icon from `GAME.icons` (never emoji).
- **Actions** are data: needs they change, a coin reward, a cost, and a **theme-driven
  animation** (`motion` + a particle `shape` + `colors`). Stars, sparks, hearts… are
  chosen here, not hard-coded.
- **Objectives** use a `check(state)` function, so a goal can test anything in the game
  state (`state.coins`, `state.creatures`, `state.stats`, …).
- **Variants** can be a colour **tint** of one sheet (no extra art) or a dedicated sheet.
- **Whole systems turn off by omission** (`ride`, `breeding`, `aging`, `shop`, `decor`,
  `environment`, `objectives`); `meta.showCoins:false` hides the economy.

**Everything the engine can do** (all optional, switched on from config): tiled world +
camera/zoom · walkcycle avatars + create screen · creatures with
needs/actions/variants/customize/aging/breeding · ride + hop-over obstacles · stations
(rest/shop/menus) · economy + shop + placeable decor · AABB collisions · arena + trail-loop
environment · day/night · objectives/levels · theme-driven particle effects · close-up
mini-scene · vehicles (top-down sheets, missions, chase, buyable models, pseudo-3D race) ·
localStorage save (+ legacy save migration) · PWA/iOS. **The full field-by-field schema is in
[ENGINE.md](ENGINE.md).**

> **Golden rule:** never put game content in `engine.js`. If the engine truly lacks a
> capability, add it there as a *generic, config-gated* feature and document it in
> ENGINE.md — so every game can use it.

```
index.html · style.css · engine.js · game.config.js   the site
ENGINE.md                                              full config schema + capabilities
assets/ (img · sheet · ui · CREDITS.md) · vendor/phaser.min.js
.claude/skills/ (+ _shared/ tooling) · .github/workflows/deploy.yml
```

---

## 🎨 Credits

All art is **generated** (CC0) from `tools/art/stable.cjs`. Phaser 3 is MIT; the Fredoka
font is OFL. See [`assets/CREDITS.md`](assets/CREDITS.md).
