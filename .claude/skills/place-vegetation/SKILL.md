---
name: place-vegetation
description: Modifier la végétation et la bande forestière autour du parcours de cross du jeu « Mon Centre Équestre » (densité, bordure, ouvertures, angles) en respectant la RÈGLE DÉCLARATIVE UNIQUE qui garantit un rendu continu partout. À utiliser pour densifier/aérer la forêt, déplacer une ouverture, élargir le chemin, sans réintroduire les bugs d'angles/bords. Déclencheurs : « plus/moins d'arbres », « la forêt autour du cross », « l'ouverture/le chemin du cross », « on voit un bord/angle de sable ».
---

# place-vegetation

Toucher à la forêt du grand cross **sans casser** la continuité (le piège
historique : bords droits, angles de sable, couloirs bouchés, rondins décalés).

## Principe (à respecter absolument)
La végétation est posée par une **règle UNIQUE** dans `placerParcours()` — donc
identique et continue partout, angles et ouvertures gérés tout seuls :
- Grille sur tout le monde ; on ne garde que `dansBande(gx,gy)`.
- On **saute** `procheBatiment` et `clairiere` (paddock + carrière).
- Si `surChemin(gx,gy,6)` → on **dégage** le chemin (rien).
- Sinon si `surChemin(gx,gy,80)` → **HAIE** (buisson bas + petite collision).
- Sinon → **FORÊT** (pins, sans collision serrée).
- Le **sable déborde de `SAND` (~46) sous la végétation** → pas de bord/angle visible.
- `CHEMINS = LOOP_SEG.concat(OUVERTURES)` ; les rondins (`RONDINS`) sont au **centre
  VISIBLE** du chemin (remontés de `RDEC`), collision plus courte que le chemin.

## Bons réglages (leviers)
- **Densité forêt** : pas de la grille (`gy/gx += 44`) et échelles des pins.
- **Épaisseur de bordure (haie)** : la marge `surChemin(,80)`.
- **Largeur du chemin** : constante `PW` (et recalcule des `LOOP_SEG`/`RONDINS`).
- **Bande forestière** : `BAND` (garder paddock/carrière HORS de la bande, sinon
  des arbres poussent dedans → d'où `clairiere`).
- **Ouvertures** : `OUVERTURES` (couloirs de sable gauche/droite) ; elles restent
  ouvertes automatiquement car elles font partie de `CHEMINS`.

## Procédure
1. Modifier **les constantes/la règle**, jamais en posant des arbres « à la main »
   (sinon ça redevient incohérent).
2. **Valider obligatoirement avec map-verify** (`playtest.cjs --walk` + captures
   multi-zones : haut/bas/angles/ouvertures). Marchabilité doit être **vide**.
3. **Publier** : release-deploy si tout est propre.

## Garde-fous
- Toute zone hors-bande (intérieur jouable) **ne doit pas** recevoir de végétation
  qui gêne (paddock/carrière protégés par `clairiere`).
- Si un passage se bouche → revoir les marges, pas ajouter d'exceptions ponctuelles.

## Enchaînement
**place-vegetation** → map-verify → release-deploy.
