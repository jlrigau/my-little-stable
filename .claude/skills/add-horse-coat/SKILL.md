---
name: add-horse-coat
description: Ajouter une nouvelle ROBE (couleur de pelage) de cheval au jeu « Mon Centre Équestre ». Gère l'entrée COATS, le chargement de la planche animée 128×128, la pastille de couleur des menus, et la personnalisation. Déclencheurs : « ajoute une robe/couleur de cheval », « un nouveau pelage », « un cheval rose/pie/… ».
---

# add-horse-coat

Ajouter une robe de cheval (les chevaux sont des spritesheets animés).

## Code concerné (game.js)
- Tableau **`COATS`** : `{ id, nom, col }` (ex. `{ id:"brown", nom:"Bai", col:"#8a5a2b" }`).
  `col` = pastille de couleur affichée dans les menus de personnalisation.
- Chargement dans `scenePreload()` :
  `COATS.forEach((c) => this.load.spritesheet("horse-" + c.id, av("assets/lpc/horse-" + c.id + "_0.png"), { frameWidth: 128, frameHeight: 128 }))`.
- Planche LPC **512×2560** = grille **128×128** (4 col × 20 lignes). Marche
  latérale = ligne 5 (frames 20-23), profil gauche ; flip X pour la droite.

## Procédure
1. **Asset prêt** : `assets/lpc/horse-<id>_0.png` au **bon format** (512×2560,
   grille 128×128, même disposition que les robes existantes). Sinon, la découper/
   réaligner (Pillow, skill asset-add).
2. **Ajouter l'entrée** dans `COATS` : `id` unique (sert au nom de fichier et à la
   clé `horse-<id>`), `nom` FR (ex. « Pie », « Alezan »), `col` = couleur de la
   pastille (proche de la robe).
3. Le chargement et les menus à vignettes se font **automatiquement** via le
   `forEach` sur `COATS` — vérifier qu'aucune autre liste n'est codée en dur.
4. **Tester** : **test-debug** — la robe apparaît à la personnalisation, le cheval
   s'anime (marche profil G/D), pas d'erreur de chargement.
5. **Publier** : **release-deploy** (bump `phN`, nouvelle image).

## Garde-fous
- `id` unique, fichier nommé exactement `horse-<id>_0.png`.
- **Même grille 128×128** que les autres, sinon l'animation casse.
- Style cohérent (robe réaliste mignonne, pas manga).

## Enchaînement
asset-add → **add-horse-coat** → test-debug → release-deploy.
