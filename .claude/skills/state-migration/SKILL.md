---
name: state-migration
description: Ajouter ou faire évoluer un champ de l'état de jeu sauvegardé (etat / localStorage) du jeu « Mon Centre Équestre » de façon RÉTRO-COMPATIBLE, pour ne pas casser les parties existantes des joueurs. À utiliser quand une nouvelle fonctionnalité doit stocker quelque chose (objectifs, niveau, nouveau réglage, compteur…). Déclencheurs : « sauvegarder ce nouveau truc », « ajouter un champ à l'état », « ne pas casser les parties en cours ».
---

# state-migration

Faire évoluer `etat` sans casser les sauvegardes existantes.

## Code concerné (game.js)
- `etat` = grand objet sauvegardé. **`sauvegarder()`** sérialise dans `localStorage`
  (clé `CLE`) en ignorant les `obj` (références Phaser) ; **`charger()`** relit.
- Normalisation des chevaux au chargement (ex. `nom` par défaut via `nomLibre()`).
- Sauvegarde **automatique** (appelée par `majHud()` et après les actions).

## Procédure
1. **Définir le champ** : nom clair, valeur par défaut sûre (ex. `etat.objectifs = {}`,
   `etat.niveau = 1`, `etat.xp = 0`).
2. **Rétro-compatibilité** (essentiel) : à la **création** (`nouvellePartie`) ET au
   **chargement** (`charger`/normalisation), garantir la présence du champ :
   `etat.niveau = etat.niveau ?? 1;` — jamais supposer qu'il existe déjà.
3. **Lire/écrire** le champ aux bons endroits, puis laisser la **sauvegarde auto**
   le persister (ou appeler `sauvegarder()` si hors flux normal).
4. **Tester** : **test-debug** —
   - nouvelle partie : champ présent et correct ;
   - **ancienne sauvegarde** (sans le champ) : on charge sans erreur et le défaut
     s'applique (simuler en injectant un `localStorage` partiel via `page.evaluate`).
5. **Publier** : **release-deploy** (bump `phN` car game.js a changé).

## Garde-fous
- **Toujours** une valeur par défaut + injection au chargement (sinon `undefined`
  casse l'UI des anciennes parties).
- Ne pas renommer/supprimer un champ existant sans migration (lire l'ancien, écrire
  le nouveau).
- Ne pas sérialiser de références Phaser (les `obj` sont déjà exclus).

## Enchaînement
(feature qui stocke des données) → **state-migration** → test-debug → release-deploy.
