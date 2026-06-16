---
name: add-character
description: Ajouter un nouveau PERSONNAGE jouable (avatar enfant) au jeu « Mon Centre Équestre » (en plus de fille/garçon). Gère l'entrée PERSOS, le spritesheet de marche 64×64 (walkcycle LPC), la vignette de menu, et la personnalisation. Déclencheurs : « ajoute un personnage », « un nouvel avatar », « un autre enfant à jouer ».
---

# add-character

Ajouter un avatar jouable (enfant LPC pré-composé).

## Code concerné (game.js)
- Tableau **`PERSOS`** : `{ id, nom, key, thumb }`
  (ex. `{ id:"fille", nom:"Cavalière", key:"kid_fille", thumb:"avatar_fille" }`).
- Chargement dans `scenePreload()` :
  `PERSOS.forEach((p) => this.load.spritesheet(p.key, av("assets/lpc/" + p.key + ".png"), { frameWidth: 64, frameHeight: 64 }))`.
- Walkcycle **576×256** (9 colonnes × 4 lignes : haut/gauche/bas/droite, col 0 =
  idle). Origine ~0.92 (pieds au sol), échelle ~1.7.
- `thumb` = vignette d'aperçu dans les menus (`assets/sprite/<thumb>.png`).

## Procédure
1. **Assets prêts** : `assets/lpc/<key>.png` (walkcycle 576×256, **même grille**
   que `kid_fille`/`kid_garcon`) + une vignette `assets/sprite/<thumb>.png`.
   Composer/recadrer si besoin (Pillow, skill asset-add).
2. **Ajouter l'entrée** dans `PERSOS` (`id` unique, `nom` FR, `key`, `thumb`).
3. Charger la vignette aussi (liste d'images de `scenePreload` si nécessaire).
4. **Tester** : **test-debug** — l'avatar apparaît à la création et via « Changer
   mon apparence », s'anime (4 directions + idle), pieds au sol (pas de flottement).
5. **Publier** : **release-deploy** (bump `phN`).

## Garde-fous
- **Mêmes dimensions/grille** que les persos existants (sinon anim cassée).
- Enfant **mignon, non-manga, mixte filles/garçons** ; pas d'emoji.
- `id`/`key`/`thumb` uniques et cohérents.

## Enchaînement
asset-add → **add-character** → test-debug → release-deploy.
