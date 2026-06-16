---
name: map-verify
description: Vérifier qu'un élément ajouté/déplacé sur la carte du jeu « Mon Centre Équestre » est bien placé — visuellement ET par programme — avant de publier. À utiliser après avoir ajouté un décor, un obstacle, de la végétation, ou modifié la géométrie (paddock, carrière, parcours de cross, ouvertures). Prend des captures multi-zones et teste la marchabilité (couloirs non bouchés, passage au-dessus/en-dessous des rondins). Déclencheurs : « vérifie la carte », « c'est bien placé ? », « le chemin est bouché », « ça dépasse », « collisions ».
---

# map-verify

Valider le placement sur la carte **avant** de pousser — éviter les allers-retours
(élément qui flotte, chemin bouché, angle de sable nu, collision qui coince).
Pré-requis : `python3`, `node` + Playwright.

## Repères carte (libellés canoniques)
**Paddock** (`CORRAL`), **Carrière** (`PARCOURS`, obstacles), **Parcours de cross**
(`LOOP_SEG` + `OUVERTURES` = `CHEMINS`), **Sellerie** / **Maison** (`STATIONS`).
Végétation par **règle unique** (`dansBande` + `surChemin` + `clairiere`/`procheBatiment`).

## Procédure (outils Claude Code)
1. **Servir** — Bash : `bash .claude/skills/_shared/serve.sh 8099`.
2. **Captures multi-zones + marchabilité** — Bash :
   ```bash
   node .claude/skills/_shared/playtest.cjs --walk \
     --shots "haut:1100:215:0.8,bas:1100:1885:0.8,angleHG:220:220:0.9,angleHD:2580:220:0.9,ouvGauche:450:1430:0.8,ouvDroite:2350:1430:0.8"
   ```
   Adapter les points `nom:x:y:zoom` à l'élément modifié (la zone concernée + au
   moins un angle et une ouverture si la géométrie a bougé).
3. **Lire le rapport** :
   - **Marchabilité** (`--walk`) : `couloirGauche`, `couloirDroit`, `crossDessus`,
     `crossDessous` doivent être **vides** (`[]`).
   - **0 `pageError`**.
4. **Regarder les captures** — outil **Read** sur `/tmp/mce-shots/*.png` :
   pas d'élément qui flotte, pas de **bord/angle de sable nu**, sable sous la
   végétation, rondins **centrés** sur le chemin visible, clôtures au bord du
   chemin (pas d'overlap dans le paddock / la carrière).
5. **Valider plusieurs endroits** (haut/bas/gauche/droite/angles/ouvertures), pas
   un seul → c'est ce qui évite « ça marche ici mais pas là ».
6. Si tout est OK → enchaîner **release-deploy**. Sinon corriger et recommencer.

## Garde-fous
- Ne **jamais** pousser un changement de carte sans cette validation.
- Marchabilité non vide = un passage est bouché → revoir la collision (skill
  **add-collision**) ou la position.

## Enchaînement
Après **add-decor-item** / **add-collision** / **place-vegetation** / **asset-add**
(quand l'ajout est visible), puis avant **release-deploy**.
