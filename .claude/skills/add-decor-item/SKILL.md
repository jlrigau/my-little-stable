---
name: add-decor-item
description: Ajouter un nouvel objet de décoration ACHETABLE à la sellerie du jeu « Mon Centre Équestre » (ex. sapin, buisson, abreuvoir, banc, fleur…). Gère l'entrée DECORS, l'apparition au magasin (sellerie), et le système de pose par fantôme « Poser ici ». Déclencheurs : « ajoute une déco », « nouvel objet à acheter », « on peut acheter un … et le poser ».
---

# add-decor-item

Ajouter un décor achetable + posable par le joueur.

## Code concerné (game.js)
- Tableau **`DECORS`** : `{ id, nom, sprite, prix }` (ex. `{ id:"arbre", nom:"Sapin", sprite:"pine", prix:28 }`).
- Le sprite doit être **chargé dans `scenePreload()`** (cf. skill **asset-add**).
- Achat → **fantôme** semi-transparent qui suit le joueur (`ghostDecor`,
  `setAlpha(0.6)`), puis bouton **« ✅ Poser ici »** (`poserDecor`).
- Positions sauvegardées dans `etat.decors = [{ id, x, y }]` ; rendu avec
  `setOrigin(0.5,0.95)`, `setScale(1.2)`, `setDepth(y)` (tri par y).

## Procédure
1. **Asset prêt** : sprite recadré dans `assets/sprite/<sprite>.png` et chargé
   dans `scenePreload()` via `av()` (skill asset-add).
2. **Ajouter l'entrée** dans `DECORS` : `id` unique, `nom` joli (FR), `sprite`
   (= clé chargée), `prix` cohérent avec les autres.
3. **Vérifier le rendu de pose** : origine/échelle/profondeur cohérentes avec les
   décors existants (pieds au sol, passe derrière par tri `y`).
4. **Règles d'emplacement** : un décor (sauf abreuvoir) ne doit pas gêner les
   chevaux dans le paddock (`dansCorral` → message de refus). Réutiliser cette logique.
5. **Tester** : **test-debug** (achat → fantôme → pose → présent dans `etat.decors`,
   persiste après reload), puis **map-verify** si pertinent.
6. **Publier** : **release-deploy** (bump `phN` car nouvelle image).

## Garde-fous
- `id` et clé sprite **uniques**. Prix équilibré.
- Style mignon / pixel-art LPC, pas d'emoji dans le monde.
- Collision éventuelle si l'objet est « dur » → voir skill **add-collision**.

## Enchaînement
asset-add → **add-decor-item** → test-debug → map-verify → release-deploy.
