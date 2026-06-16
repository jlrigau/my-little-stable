---
name: test-debug
description: Tester et déboguer ce qui a été implémenté dans le jeu « Mon Centre Équestre », avec preuves, avant de publier. À utiliser pour valider une nouvelle fonctionnalité de bout en bout, ou pour reproduire/corriger un bug décrit (ex. « telle action ne fait rien », « telle lettre ne s'écrit pas »). Combine vérif statique, exécution headless (Playwright), assertions sur l'état du jeu, et boucle repro→cause→correctif→non-régression. Déclencheurs : « teste », « débogue », « vérifie que ça marche », « ça ne marche pas », « reproduis le bug ».
---

# test-debug

Prouver qu'une fonctionnalité **marche vraiment**, ou reproduire+corriger un bug —
jamais « ça devrait marcher ». Pré-requis : `python3`, `node` + Playwright.

## Procédure (outils Claude Code)

1. **Vérif statique** — Bash : `node --check game.js` (+ validité JSON du manifest s'il a changé).

2. **Servir le jeu** — Bash : `bash .claude/skills/_shared/serve.sh 8099`.

3. **Vérif runtime + assertions** — Bash, via le harnais `playtest.cjs` :
   ```bash
   # lire une valeur d'état
   node .claude/skills/_shared/playtest.cjs --eval "etat.chevaux.length"
   # capturer une zone
   node .claude/skills/_shared/playtest.cjs --shots "spawn:560:860:0.9"
   # scénario complet de la feature (assertions libres)
   node .claude/skills/_shared/playtest.cjs --probe ./scenario.cjs
   ```
   Un *probe* = module `.cjs` exportant `async (page) => {…}` qui pilote la page
   (clics, `page.keyboard.type`, `page.evaluate`) et renvoie un objet d'assertions.
   Le harnais **remonte toujours les `pageErrors`** (exit ≠ 0 s'il y en a).
   - Globales accessibles dans `page.evaluate` : `etat`, `joueur`, `COLLISIONS`,
     `WORLD`, `CHEMINS`, `LOOP_SEG`, `OUVERTURES`, `sc`, `onPointer`, …
   - **Test clavier réel** : `page.focus("#champ")` puis `page.keyboard.type("AZ…")`
     (et NON `page.fill`, qui court-circuite l'événement et ne testerait pas le bug).

4. **Regarder les captures** — outil **Read** sur les PNG (`/tmp/mce-shots/*.png`)
   pour valider visuellement (Claude Code affiche les images).

5. **Pour un BUG — boucle** : reproduire (probe qui échoue) → isoler la cause
   (`fichier:ligne`, via Grep/Read) → corriger (Edit) → relancer le test jusqu'à
   ce que ça passe **et** que rien d'autre ne casse. Pas un seul essai.

6. **Rapport** : ce qui marche / ce qui casse (sortie & erreur exactes), la cause,
   le correctif — avec captures + valeurs d'assertions comme **preuve**.

## Garde-fous
- **Ne jamais dire « ça marche » sans preuve** (capture + assertions + 0 pageError).
- Tester le **vrai scénario joueur**, pas seulement l'absence d'erreur JS.
- Si un choix fonctionnel est ambigu, demander via **AskUserQuestion** (jamais de
  jargon technique en mode « session de retour » enfant).

## Enchaînement
Avant **map-verify** (visuel carte) et **release-deploy** (publication).
Appelé par l'orchestrateur **retour-enfant** pour chaque retour.
