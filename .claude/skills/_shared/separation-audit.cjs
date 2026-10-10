#!/usr/bin/env node
/*
 * Separation audit — prove the engine/game boundary holds (golden rule):
 *   • engine.js carries NO game content (it's generic + English; game copy lives in config)
 *   • game.config.js is DATA only (no engine logic / DOM / Phaser)
 *   • the index.html <body> shell stays neutral (head <title>/app-title are per-game)
 *
 * Fast heuristic. Exit code 1 if a likely leak is found. Used by the
 * `capitalize-learnings` skill; safe to run any time.
 *   node .claude/skills/_shared/separation-audit.cjs
 */
const fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "../../..");
const read = (f) => { try { return fs.readFileSync(path.join(root, f), "utf8"); } catch { return ""; } };
const lines = (s) => s.split(/\r?\n/);
const ACCENT = /[À-ɏ]/;   // Latin accented letters (é à ç ñ …) — emoji are out of this range
let fail = 0;

// 1. engine.js — accented letters signal game-language copy (the engine is English).
console.log("== 1. engine.js — accented letters (engine is English → likely GAME text) ==");
{
  const hits = lines(read("engine.js")).map((l, i) => [i + 1, l]).filter(([, l]) => ACCENT.test(l));
  if (hits.length) { hits.forEach(([n, l]) => console.log(`  ${n}: ${l.trim().slice(0, 100)}`)); console.log("  ^ move user-facing copy to game.config.js as a `|| fallback`-guarded string"); fail = 1; }
  else console.log("  none ✓");
}

// 2. game.config.js — engine logic is a leak (config must be pure data).
console.log("\n== 2. game.config.js — engine logic (DOM / Phaser / functions) ==");
{
  const bad = /document\.|Phaser|addEventListener|getElementById|querySelector|\bfunction\b/;
  const hits = lines(read("game.config.js")).map((l, i) => [i + 1, l])
    .filter(([, l]) => bad.test(l) || (/window\./.test(l) && !/window\.GAME/.test(l)));
  if (hits.length) { hits.forEach(([n, l]) => console.log(`  ${n}: ${l.trim().slice(0, 100)}`)); console.log("  ^ engine logic belongs in engine.js, not the config"); fail = 1; }
  else console.log("  none ✓ (objectives `check:(state)=>…` arrow fns are allowed)");
}

// 3. index.html <body> — accented text in the shell body (head metas are per-game = OK).
console.log("\n== 3. index.html <body> — game-specific text (shell body should be neutral) ==");
{
  const html = read("index.html");
  const body = html.slice(Math.max(0, html.indexOf("<body")), (html.indexOf("</body>") + 7) || html.length);
  const hits = lines(body).filter((l) => ACCENT.test(l));
  if (hits.length) { hits.forEach((l) => console.log(`  ${l.trim().slice(0, 100)}`)); console.log("  ^ use neutral defaults; the engine fills text from config (this is advisory, not a hard fail)"); }
  else console.log("  none ✓");
}

// 4. engine.css — the shared structure stylesheet must stay theme-free (no game text).
console.log("\n== 4. engine.css — game-specific text (structure only; the theme lives in style.css) ==");
{
  const hits = lines(read("engine.css")).map((l, i) => [i + 1, l]).filter(([, l]) => ACCENT.test(l));
  if (hits.length) { hits.forEach(([n, l]) => console.log(`  ${n}: ${l.trim().slice(0, 100)}`)); fail = 1; }
  else console.log("  none ✓");
}

console.log("\n" + (fail ? "SEPARATION AUDIT: review the items above ✗" : "SEPARATION AUDIT: clean ✓"));
process.exit(fail);
