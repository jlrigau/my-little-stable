#!/usr/bin/env node
/*
 * Bump the cache version "vN" in BOTH places at once:
 *   - meta.assetVersion in game.config.js (used by av() for every image)
 *   - every ?v=vN in index.html (css, js, config, manifest, favicon, apple-touch)
 *
 * Avoids the classic "I forgot one of the two places" that leaves Safari
 * serving a stale version. Portable: plain Node, no dependency.
 *
 * Usage: node .claude/skills/_shared/bump-version.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const configPath = resolve(root, "game.config.js");
const indexPath = resolve(root, "index.html");

let config = readFileSync(configPath, "utf8");
const m = config.match(/assetVersion:\s*"v(\d+)"/);
if (!m) {
  console.error('ERROR: assetVersion ("v<N>") not found in game.config.js');
  process.exit(1);
}
const cur = parseInt(m[1], 10);
const oldV = `v${cur}`, newV = `v${cur + 1}`;

config = config.replace(`assetVersion: "${oldV}"`, `assetVersion: "${newV}"`);
writeFileSync(configPath, config);

let index = readFileSync(indexPath, "utf8");
const before = index;
index = index.replace(/\?v=v\d+/g, `?v=${newV}`);
writeFileSync(indexPath, index);

const nbIndex = (before.match(/\?v=v\d+/g) || []).length;
console.log(`Cache version: ${oldV} -> ${newV}  (game.config.js + ${nbIndex} ?v= in index.html)`);
