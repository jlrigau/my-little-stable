---
name: asset-add
description: Intégrer dans le jeu « Mon Centre Équestre » un asset graphique choisi (issu du skill asset-search) — téléchargement, découpe/recadrage pixel-art (Pillow), enregistrement de la texture dans game.js, et mise à jour de l'attribution. À utiliser une fois qu'on a sélectionné un sprite à ajouter. Déclencheurs : « ajoute cet asset/sprite », « intègre l'image choisie », « importe ce décor/cheval ».
---

# asset-add

Intégrer de bout en bout un asset choisi (sortie de **asset-search**).

## Où vont les fichiers
- `assets/lpc/` : planches sources utilisées **au runtime** (chevaux, persos, clôtures).
- `assets/sprite/` : **extraits / recadrages** prêts à l'emploi (sol, bâtiments,
  arbres, vignettes UI, décors). PNG avec transparence.
- Outillage de découpe : **Pillow + numpy** (`pip install pillow numpy` si besoin) — Bash.

## Procédure
1. **Télécharger** la planche source (Bash `curl`) vers `assets/lpc/` (ou un dossier
   temporaire si on doit la découper d'abord).
2. **Découper / recadrer** avec un petit script Python (Pillow) :
   - Détourer / recadrer un sprite unique → `assets/sprite/<nom>.png`.
   - Ou segmenter une planche animée (grilles connues : **chevaux 128×128**,
     **persos 64×64** d'une feuille 9 colonnes, **clôtures 32×32**).
   - Garder la transparence (mode RGBA), ne pas dénaturer le style.
3. **Enregistrer la texture** dans `game.js` → fonction `scenePreload()` :
   - Image simple : ajouter la clé à la liste
     `["pine","bush","trough","cabane_ardoise","cabane_chaume","haie","rondins"]`
     (chargée via `this.load.image(k, av("assets/sprite/" + k + ".png"))`).
   - Spritesheet : `this.load.spritesheet("<clé>", av("assets/lpc/<fichier>.png"), { frameWidth, frameHeight })`.
   - **Toujours via `av(...)`** (cache-busting).
4. **Brancher l'entrée jeu** selon l'usage (déléguer au skill spécialisé) :
   - décor achetable → **add-decor-item** (`DECORS`)
   - robe de cheval → **add-horse-coat** (`COATS`)
   - personnage → **add-character** (`PERSOS`)
   - obstacle/élément fixe → placement + **add-collision** si besoin.
5. **Mettre à jour l'attribution** : ajouter une ligne dans `assets/CREDITS.md`
   (asset, source/URL, auteur, **licence**).
6. **Vérifier** : **test-debug** (l'image charge, pas d'erreur) puis **map-verify**
   si l'élément est visible sur la carte.

## Garde-fous
- **Licence + attribution obligatoires** dans `assets/CREDITS.md`.
- Respecter le style (pixel-art LPC, mignon, non-manga, pas d'emoji dans le monde).
- Cache-busting : nouvelles images chargées via `av()`. Le bump `phN` se fait à la
  publication (**release-deploy** / `bump-version.mjs`).
- Conserver la cohérence des libellés (Paddock, Carrière, Sellerie, Parcours de cross).

## Enchaînement
asset-search → **asset-add** → (add-decor-item / add-horse-coat / add-character /
add-collision) → test-debug → map-verify → release-deploy.
