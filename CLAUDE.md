# CLAUDE.md — Contexte projet « Mon Centre Équestre »

> Mémoire partagée entre sessions. Si tu reprends le projet : lis ce fichier, puis continue.

## 1. Le projet
Jeu de **simulation d'élevage de chevaux pour enfants (9-10 ans)**, en français.
Vue de dessus : on déplace un personnage dans un **centre équestre / ferme**, on
s'occupe des chevaux (nourrir, brosser, jouer, **monter**), on les personnalise, on
agrandit l'enclos.

- **Site 100 % statique** déployé sur **GitHub Pages** : https://jlrigau.github.io/my-little-stable/
- Moteur : **Phaser 3** (CDN jsDelivr), rendu **pixel-art** avec de vrais sprites.
- Sauvegarde locale (localStorage). Pas de build : on édite directement les fichiers.

## 2. Fichiers
- `index.html` — écrans (accueil, choix du personnage, jeu) + chargement Phaser/CDN.
- `style.css` — styles (HUD, panneau, modale, vignettes…).
- `game.js` — toute la logique + rendu Phaser.
- `assets/sprite/` — sprites recadrés prêts à l'emploi (sol, bâtiments, arbres, vignettes UI).
- `assets/lpc/` — planches sources utilisées au runtime (chevaux, persos, clôtures).
- `assets/CREDITS.md` — licences/attribution des assets.
- `.github/workflows/deploy.yml` — déploiement Pages.
- Cache-busting : `?v=phN` sur `style.css`/`game.js` dans `index.html`, ET constante
  `ASSET_VER` en haut de `game.js` (via `av()`) pour TOUTES les images (sinon Safari
  garde les anciennes si on réutilise un nom de fichier). **Quand tu changes JS/CSS/images,
  incrémente le numéro aux DEUX endroits** (ex. ph6 → ph7).
- iPhone : `viewport-fit=cover` + `env(safe-area-inset-*)` sur `.barre-haut` et `.panneau`
  pour ne pas passer sous l'encoche / barre d'état iOS.

## 3. Déploiement
- Branche de travail **ET** de déploiement = **`main`**. Pousser sur `main` déclenche
  le workflow GitHub Actions qui publie sur Pages.
- Après un push, vérifier que le run `deploy.yml` est **success**.
- Déploiement depuis `main` voulu par l'utilisateur, **pas de PR** sauf demande explicite.

## 4. Réseau de l'environnement
Dans cette session, l'accès sortant est **plus large que GitHub seul** :
`opengameart.org`, `cdn.jsdelivr.net`, `upload.wikimedia.org` = **OK** ;
**`kenney.nl` et `itch.io` (Cloudflare) = bloqués**. Tester au besoin :
`curl -s -o /dev/null -w '%{http_code}' https://kenney.nl/`.
On peut donc télécharger depuis OpenGameArt (+ PyPI pour Pillow pour découper les sprites).

## 5. Vérification visuelle possible dans cette session
Chromium est installé (`/opt/pw-browsers`, Playwright global). On PEUT rendre le jeu
et faire des captures : servir le dossier (`python3 -m http.server`), puis Playwright
avec `--ignore-certificate-errors` (le proxy TLS casse la validation des certifs CDN).
→ Toujours valider visuellement avant de pousser, et confirmer le rendu avec l'utilisateur.

## 6. État actuel du visuel (refonte « centre équestre », validée par l'utilisateur)
Style **pixel-art LPC**, **plus aucun emoji dans le monde** :
- **Sol** : pelouse tuilée + chemins de terre. **Enclos** : clôture en ganivelle
  AVEC collision (le joueur ne traverse pas, sauf portail gauche) → `MURS` + `bloquerCloture()`.
- **Bâtiments** : cabanes en rondins LPC pré-assemblées — `cabane_ardoise` (Maison/dormir),
  `cabane_chaume` (Magasin). (Les granges modulaires LPC s'assemblaient mal → abandonnées.)
- **Joueur** : ENFANTS LPC pré-composés (corps + habits + cheveux) → `assets/lpc/kid_fille.png`
  et `kid_garcon.png`. Walkcycle 576x256 (9 col × 4 lignes : haut/gauche/bas/droite, col 0 = idle).
  Origine ~0.92 (pieds au sol, pas de flottement), échelle ~1.7.
- **Chevaux** : `assets/lpc/horse-<couleur>_0.png` (5 robes : brown/black/gray/golden/white).
  Planche 512x2560 = grille **128×128** (4 col × 20 lignes). Marche latérale = ligne 5
  (frames 20-23), profil gauche ; flip X pour la droite. Échelle ~1.15 (plus grands que l'enfant),
  origine 0.9. Ils s'arrêtent quand le joueur est proche (<115) pour pouvoir interagir.
- **Déplacement** : clic/tap vers un point (PAS de dpad — retiré). Clavier flèches/ZQSD en bonus.
  **Vitesse auto** : un **double-tap rapide** (< 350 ms, `enCourse`) fait courir le perso ET le cheval
  (pas de bouton de vitesse).
- **Profondeur** : tout est trié par `y` (joueur inclus, plus de `+1000`) → le perso passe DERRIÈRE
  arbres/bâtiments. **Collisions** (`COLLISIONS` + `bloquerObstacles`) sur clôture + arbres + buissons
  + bâtiments + déco (empreinte plus large à cheval). Portail = trou clôture à gauche.
- **À cheval** : enfant assis sur le dos (`joueurSprite.y=-58`, ombre masquée), sans anim de marche.
- **Dormir** : transition nuit (voile `nuitVoile` qui s'assombrit puis s'éclaircit) ; interdit d'enchaîner
  les nuits (`actionsDepuisDodo` : il faut s'occuper d'un cheval entre deux dodos).
- **Déco** : achat au magasin puis **placement libre** au clic (positions dans `etat.decors=[{id,x,y}]`).
- **Noms de chevaux uniques** (`nomLibre`/`nomUtilise`).
- **Humeur** : petit cœur teinté (vert/orange/rouge), pas de smiley.
- **Déco achetable** : sapin/buisson/abreuvoir (sprites).
- Personnalisation : perso (fille/garçon) + cheval (5 robes, nom). Menus à vignettes-images.

## 7. Sources d'assets (toutes CC-BY / CC-BY-SA, attribution dans assets/CREDITS.md)
- LPC Base Assets (sol, arbres, persos princess/soldier) — Sharm, Redshrike & al.
- [LPC] Horses (bluecarrot16) — 5 robes animées.
- [LPC] Farm (bluecarrot16 & al.) — granges, abreuvoir.
- [LPC] Medieval Village Decorations — clôtures.
Outillage : Pillow + numpy (pip) pour découper/segmenter les planches.

## 8. Préférences utilisateur (à respecter)
**Mignon, NON-manga, adapté aux enfants, filles ET garçons**, perso + chevaux
personnalisables, jouabilité fluide. **Pas d'emoji-smiley** dans le décor.
L'utilisateur a une mémoire des itérations passées rejetées (3D cubes, isométrique
dessiné main, emojis) → ne pas y revenir.

## 9. Pistes / TODO possibles
- Remplacer aussi les petites icônes emoji du HUD/boutons par des icônes dessinées (demandé en option).
- Animation de galop quand on monte ; plus de chevaux dans l'enclos ; sons ; objectifs/médailles.
- Si réseau élargi à Kenney : assets supplémentaires.

## 10. Conventions
- Tout pousser sur `main`. Messages de commit clairs, en français. Sauvegarde auto en place.
