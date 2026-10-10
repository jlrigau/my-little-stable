#!/usr/bin/env node
/*
 * Prune unused (e.g. leftover demo) assets — list, or delete with --delete, every file
 * under assets/ that NO game/shell file references. Used by new-game after it replaces
 * the demo with a new game. DRY-RUN by default (safe); pass --delete to remove.
 *
 *   node .claude/skills/_shared/prune-assets.cjs            # list candidates
 *   node .claude/skills/_shared/prune-assets.cjs --delete   # actually remove them
 *
 * Conservative: a file is kept if its path, filename, OR filename-without-extension
 * (assets are often referenced by KEY, not path) appears in any source — so it errs
 * toward keeping a file rather than deleting one that's actually used.
 */
const fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "../../..");
const del = process.argv.includes("--delete");

const SOURCES = ["game.config.js", "index.html", "manifest.webmanifest", "style.css", "engine.js"];
const hay = SOURCES.map((f) => { try { return fs.readFileSync(path.join(root, f), "utf8"); } catch { return ""; } }).join("\n");

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc); else acc.push(p);
  }
  return acc;
}
const assetsDir = path.join(root, "assets");
let files = [];
try { files = walk(assetsDir); } catch { console.log("no assets/ directory"); process.exit(0); }

const KEEP = new Set(["CREDITS.md"]);   // never prune attribution / docs
const rel = (p) => path.relative(root, p).split(path.sep).join("/");
const referenced = (p) => {
  const base = path.basename(p), noext = base.replace(/\.[^.]+$/, "");
  return hay.includes(rel(p)) || hay.includes(base) || hay.includes(noext);
};

const unused = files.filter((p) => !KEEP.has(path.basename(p)) && !referenced(p));
if (!unused.length) { console.log("No unreferenced assets ✓"); process.exit(0); }
console.log(`${unused.length} unreferenced asset(s)${del ? " — deleting:" : " (dry run; pass --delete to remove):"}`);
for (const p of unused) { console.log("  " + rel(p)); if (del) fs.unlinkSync(p); }
if (!del) console.log("\nReview before deleting: KEEP generic reusable building blocks (ground, trees,\nbushes, fences, generic buildings) you may want when iterating — prune only the\nprevious game's theme-specific art.");
process.exit(0);
