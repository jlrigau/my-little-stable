---
name: release-deploy
description: Publier en production le jeu « Mon Centre Équestre » (site statique GitHub Pages, déployé depuis main). À utiliser quand des modifs de game.js / style.css / index.html / assets sont prêtes à partir en ligne. Gère le cache-busting phN, le commit, le push sur main, puis vérifie que le déploiement GitHub Actions est réussi. Déclencheurs : « déploie », « publie », « pousse en prod », « mets en ligne », « release ».
---

# release-deploy

Publie proprement une modification du jeu en production.

## À savoir
- Site **100 % statique**, déployé sur **GitHub Pages depuis `main`**. Pousser sur
  `main` déclenche `.github/workflows/deploy.yml`. **Pas de PR** sauf demande.
- **Cache-busting obligatoire** dès qu'on change JS/CSS/images : la version `phN`
  doit être incrémentée à **deux endroits** (`ASSET_VER` dans `game.js` + tous les
  `?v=phN` d'`index.html`). Sinon iOS/Safari sert l'ancienne version.

## Procédure (outils Claude Code)
1. **Bash** : `git status` + `git branch --show-current`. Travailler sur `main` ;
   ne pas changer de branche sans accord, ne pas ouvrir de PR sans demande.
2. **Cache-busting** si un fichier du *site* a changé (game.js / style.css /
   index.html / assets) — **Bash** :
   ```bash
   node .claude/skills/_shared/bump-version.mjs
   ```
   (Inutile si tu n'as touché qu'à `.claude/` ou de la doc.)
3. **Vérif** — Bash : `node --check game.js` (et la validité JSON du manifest s'il a changé).
4. **Commit** clair, **en français** (quoi + pourquoi).
5. **Push avec retry** — Bash :
   ```bash
   for i in 1 2 3 4; do git push -u origin main && break || sleep $((2**i)); done
   ```
6. **Vérifier le déploiement** : charger les outils GitHub avec **ToolSearch**
   (`select:mcp__github__actions_list,mcp__github__actions_get`), récupérer le
   dernier run de `deploy.yml` sur `main`, et confirmer `conclusion = success`.
   > La sortie de `actions_list` est volumineuse : si elle dépasse la limite,
   > elle est sauvegardée dans un fichier — la parser avec un petit `python3`
   > (Bash) pour extraire `head_sha`/`status`/`conclusion` du run le plus récent.
   La tâche n'est **pas finie** tant que ce n'est pas vert.
7. **Confirmer** : https://jlrigau.github.io/my-little-stable/ (+ rappeler le
   bouton « 🔄 Rafraîchir » sur iPhone).

## Garde-fous
- Toujours `main`, jamais une autre branche / PR sans accord explicite.
- Ne jamais oublier le cache-busting si un fichier du site change (le script le fait).
- Si le run échoue : lire le log (GitHub MCP `get_job_logs`), corriger, re-pousser.

## Enchaînement
Dernière étape, après **test-debug** (la feature marche) et, pour un changement
visuel de carte, après **map-verify**.
