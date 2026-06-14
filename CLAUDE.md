# CLAUDE.md — Contexte projet « Mon Ranch »

> Ce fichier est chargé automatiquement par Claude Code. Il sert de **mémoire
> partagée entre sessions**. Si tu reprends le projet dans une nouvelle session :
> lis ce fichier, puis continue.

## 1. Le projet
Jeu de **simulation d'élevage de chevaux pour enfants (9-10 ans)**, en français.
Vue de dessus, on déplace un personnage dans un ranch, on s'occupe de chevaux
(nourrir, brosser, jouer, **monter**), on les personnalise, on agrandit le ranch.

- **Site 100 % statique** déployé sur **GitHub Pages** : https://jlrigau.github.io/my-little-stable/
- Moteur : **Phaser 3** (chargé via CDN jsDelivr), rendu **pixel art** avec de vrais sprites.
- Sauvegarde locale (localStorage). Pas de build : on édite directement les fichiers.

## 2. Fichiers
- `index.html` — écrans (accueil, choix du personnage, jeu) + chargement Phaser/CDN.
- `style.css` — styles (HUD, panneau, modale, grille de personnages…).
- `game.js` — toute la logique + rendu Phaser.
- `assets/` — `lpc/` (couches de personnages), `horse/` (chevaux + poulain), `world/` (ferme).
- `CREDITS.md` — licences des assets. `.github/workflows/deploy.yml` — déploiement Pages.
- Cache-busting : les assets sont versionnés `?v=lpcN` dans `index.html` et `game.js`.
  **Quand tu changes des assets/JS/CSS, incrémente ce numéro** (ex. lpc2 → lpc3).

## 3. Déploiement
- Branche de travail **et** de déploiement = **`main`**. Pousser sur `main` déclenche
  le workflow GitHub Actions qui publie sur Pages (source Pages = « GitHub Actions »).
- Après un push, vérifier que le run `deploy.yml` est **success**.
- Le déploiement depuis `main` est voulu par l'utilisateur (pas de PR nécessaire).

## 4. CONTRAINTE RÉSEAU IMPORTANTE (assets)
L'environnement d'exécution **ne peut accéder qu'à GitHub** :
`raw.githubusercontent.com` et `codeload.github.com` = OK ; **`kenney.nl`,
`itch.io`, `opengameart.org`, `cdn.jsdelivr.net` = 403 (bloqués)**.
→ On ne peut télécharger des assets que s'ils sont **hébergés sur GitHub**
(et **pas** en Git LFS : les pointeurs LFS font ~130 octets, pas la vraie image).
L'utilisateur essaie d'**élargir la politique réseau** de l'environnement pour
débloquer les autres banques (Kenney, etc.) → si c'est fait, re-tester avec
`curl -s -o /dev/null -w '%{http_code}' https://kenney.nl/`.

## 5. Sources d'assets utilisées (toutes via GitHub)
- **Personnages (filles/garçons)** : couches LPC du générateur
  `LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator`
  (`spritesheets/body|legs|torso|hair/...`, planches `walk.png` = **576x256**,
  9 colonnes × 4 lignes ; lignes = haut/gauche/bas/droite ; colonne 0 = immobile).
  Composées **à l'exécution** (superposition corps + bas + haut + cheveux).
  Licence : **CC-BY-SA 3.0 / GPL 3.0** (attribution requise).
- **Chevaux + poulain + poule** : `AntumDeluge/game-resources`
  (`sprite/animal/horse|baby_horse|chicken/...`). Chevaux 64x64 (3×4 :
  haut/gauche/bas/droite) ; poulain 48x64 (3×4 : N,E,S,W). LPC, CC-BY-SA 3.0/GPL.
- **Ferme (maison, plantes, etc.)** : Sprout Lands (Cup Nooble) via
  `Maaack/Sprout-Lands-Tilemap`. Gratuit (ne pas revendre les assets seuls).
- ⚠️ Le pack Sprout Lands « officiel » (perquis/sprout_lands) est en **Git LFS** → inaccessible.

## 6. Historique des décisions (pour ne pas refaire les erreurs)
Itérations successives, rejetées par l'utilisateur :
1. Cartes 2D (emoji) → « pas assez interactif ».
2. Monde 2D emoji déplaçable → ok mais l'utilisateur voulait de la 3D.
3. **3D Babylon.js (cubes)** → « très moche », rejeté.
4. **Isométrique dessiné main** → « raté », rejeté.
5. **Phaser + emojis** → jouable mais « toujours moche ».
6. **Phaser + vrais sprites** (état actuel) : chevaux LPC ✅ validés par l'utilisateur.
7. Personnages **PIPOYA** (chibi) → jugés « trop manga », remplacés par **LPC**.

Préférences utilisateur : **mignon, NON-manga, adapté aux enfants, filles ET garçons**,
personnage + chevaux personnalisables, jouabilité fluide.

## 7. Limite à garder en tête
**Je (Claude) ne peux pas voir le rendu** (pas de navigateur dans l'environnement).
→ La validation visuelle est faite par **l'utilisateur**, qui teste le site déployé
et dit si ça va. Itérer en conséquence ; ne pas affirmer qu'un visuel est beau sans
confirmation de sa part.

## 8. Pistes / TODO
- Si le réseau est élargi : récupérer des personnages plus variés (Kenney toon, etc.).
- Vérifier l'alignement des couches LPC (cheveux/jupe) d'après le retour utilisateur.
- Possibles ajouts : élevage de poulains, objectifs/médailles, plus de décor, sons.

## 9. Conventions
- Tout pousser sur `main`. Messages de commit clairs, en français.
- Ne pas créer de PR sauf demande explicite. Sauvegarde auto déjà en place.
