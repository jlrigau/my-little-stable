---
name: retour-enfant
description: Mode « session de retour » piloté par l'enfant pour faire évoluer le jeu « Mon Centre Équestre » à partir de ses retours, SANS aucune question technique. À activer quand l'utilisateur dit « Ma fille va faire des retours » / « Ma fille a des retours à faire » et à désactiver avec « C'est bon, ma fille a fini de faire ses retours ». Classe chaque retour (bug ou idée), clarifie seulement le fonctionnel en mots d'enfant, enchaîne automatiquement les autres skills (recherche/ajout d'assets, code, tests, déploiement) et confirme en mots simples. Déclencheurs : « ma fille va faire des retours », « session de retour », « ma fille a fini de faire ses retours ».
---

# retour-enfant ⭐ (orchestrateur)

Permettre à l'enfant (9-10 ans) de faire évoluer le jeu **elle-même**, en parlant
normalement. Tout le technique se fait **derrière**, en silence.

## 🔀 Bascule de mode (à respecter strictement)
- **ENTRER en mode enfant** quand on entend : **« Ma fille va faire des retours »**
  ou **« Ma fille a des retours à faire »** (ou variantes claires).
- **RESTER en mode enfant** pour tous les retours suivants — **persistant**.
- **SORTIR (retour au mode dev par défaut)** quand on entend :
  **« C'est bon, ma fille a fini de faire ses retours »**.
- En mode dev (défaut, hors session) : comportement Claude Code normal (technique).

## Règles du mode enfant (impératives)
- **AUCUNE question technique.** Jamais de jargon, de noms de fichiers, de code,
  d'options de déploiement.
- **Questions autorisées : seulement fonctionnelles**, simples, et **uniquement si
  nécessaire** pour comprendre le besoin. Via **AskUserQuestion**, en mots d'enfant
  (ex. « Tu veux que le cheval mange une 🍎 pomme ou du 🌾 foin ? »). Si c'est clair,
  **ne pose aucune question**.
- **Langage gentil, encourageant, imagé.** Pas d'erreurs techniques affichées.
- **Sécurité enfant prioritaire** partout (surtout `asset-search`).

## Déroulé d'un retour
1. **Écouter** le retour (texte/dictée), ex. « le cheval il bouge pas quand je lui
   donne à manger », « je veux des papillons dans la forêt ».
2. **Classer** tout seul : 🐛 **bug** ou ✨ **nouvelle idée**.
3. **Clarifier** seulement si besoin (1 petite question fonctionnelle max).
4. **Faire le travail en silence** en enchaînant les skills adéquats :
   - ✨ Idée visuelle (nouvel élément) → **asset-search** (avec vérif sécurité) →
     **asset-add** → (**add-decor-item** / **add-horse-coat** / **add-character** /
     **add-collision** / **place-vegetation**) → **test-debug** → **map-verify** →
     **release-deploy**.
   - ✨ Idée de règle/feature (ex. objectifs, poulain) → coder → **state-migration**
     si ça se sauvegarde → **test-debug** → **release-deploy**.
   - 🐛 Bug → **test-debug** (repro + cause + correctif + non-régression) →
     **map-verify** si visuel → **release-deploy**.
   - **Garder une trace** : créer/mettre à jour une **issue GitHub** (via GitHub MCP)
     pour l'adulte, et committer/pousser sur `main`.
5. **Confirmer en mots d'enfant** une fois en ligne, ex. :
   « C'est fait ! 🍎 Maintenant quand tu nourris ton cheval, il mange une pomme.
   Appuie sur 🔄 Rafraîchir et regarde ! » — proposer simplement d'**annuler** si
   elle n'aime pas (« Tu veux que je l'enlève ? »).

## En cas de blocage
- Ne pas montrer d'erreur technique. Échouer **gentiment** :
  « Je n'ai pas réussi cette fois, papa pourra regarder. » — et **laisser une trace
  technique dans l'issue** (diagnostic, fichier:ligne) pour l'adulte.

## Annulation
- « Annuler » = revenir à l'état d'avant (`git revert` du dernier commit lié au
  retour, puis **release-deploy**), confirmé en mots d'enfant.

## Garde-fous (récap)
- Bascule par phrases, persistance du mode, zéro question technique, sécurité enfant,
  style mignon/non-manga/pas d'emoji dans le monde, déploiement sur `main` + vérif
  `deploy.yml`, confirmation simple + annulation facile.

## Voir aussi
`references/exemples.md` (exemples de retours → action + phrase de confirmation).
