#!/usr/bin/env node
/*
 * Incrémente la version de cache « phN » AUX DEUX ENDROITS d'un coup :
 *   - ASSET_VER dans game.js  (utilisé par av() pour toutes les images)
 *   - tous les ?v=phN dans index.html (css, js, manifest, favicon, apple-touch-icon)
 *
 * Évite l'erreur classique « j'ai oublié l'un des deux endroits » qui laisse
 * Safari servir l'ancienne version. Portable : Node standard, aucune dépendance.
 *
 * Usage : node .claude/skills/_shared/bump-version.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const gamePath = resolve(root, "game.js");
const indexPath = resolve(root, "index.html");

let game = readFileSync(gamePath, "utf8");
const m = game.match(/const ASSET_VER = "ph(\d+)";/);
if (!m) {
  console.error("ERREUR : ASSET_VER (ph<N>) introuvable dans game.js");
  process.exit(1);
}
const cur = parseInt(m[1], 10);
const oldV = `ph${cur}`;
const newV = `ph${cur + 1}`;

game = game.replace(`const ASSET_VER = "${oldV}";`, `const ASSET_VER = "${newV}";`);
writeFileSync(gamePath, game);

let index = readFileSync(indexPath, "utf8");
const before = index;
index = index.replace(/\?v=ph\d+/g, `?v=${newV}`);
writeFileSync(indexPath, index);

const nbIndex = (before.match(/\?v=ph\d+/g) || []).length;
console.log(`Version de cache : ${oldV} -> ${newV}  (game.js + ${nbIndex} ?v= dans index.html)`);
