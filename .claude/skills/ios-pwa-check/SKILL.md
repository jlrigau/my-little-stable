---
name: ios-pwa-check
description: Vérifier et corriger la mise en page mobile / PWA du jeu « Mon Centre Équestre » sur iPhone (zones de sécurité, plein écran, barre d'état, panneau du bas, fond, icône d'accueil). À utiliser pour tout problème d'affichage iOS : bandeau/marge en haut ou en bas, panneau qui dépasse, raccourci d'accueil. Déclencheurs : « sur iPhone ça déborde », « bandeau en haut/bas », « le panneau prend trop de place », « le nom de l'icône », « plein écran ».
---

# ios-pwa-check

Garder l'affichage iPhone propre (plein écran, sans bandeau, safe areas).

## Points à respecter (acquis du projet)
- **`index.html`** : `meta viewport ... viewport-fit=cover`, `theme-color`,
  `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`,
  `apple-mobile-web-app-title` (**court**, ex. « Mon Centre », sinon tronqué/collé),
  `link rel="manifest"`, metas no-cache.
- **`manifest.webmanifest`** : `name`, `short_name` court, `display: standalone`,
  `background_color`, `theme_color`, `icons` (180 + 512).
- **`style.css`** :
  - `html, body` plein écran ; **fond doux** sans bandeau foncé (dégradé léger,
    `background-attachment: fixed`).
  - `#ecran-jeu { position: fixed; inset: 0; }` → couvre tout l'écran (sinon le fond
    du body dépasse en bas).
  - `.panneau` (bas) `position: fixed; bottom: 0` + `padding-bottom: calc(... + env(safe-area-inset-bottom))`,
    **compact** (min-height/padding réduits) → collé au bas, sans bandeau.
  - `.barre-haut` : `padding-top: calc(... + env(safe-area-inset-top))` (encoche).
  - `100dvh` (pas seulement `vh`) pour les écrans.

## Procédure
1. Reproduire le souci en **captures** à taille iPhone (Playwright viewport ~390×844,
   `deviceScaleFactor: 2`) via `playtest.cjs --shots` / un probe, puis **Read** des PNG.
2. Corriger dans `index.html` / `style.css` / `manifest.webmanifest` selon la liste.
3. **Re-tester** visuellement (panneau collé en bas, pas de bandeau, haut propre).
4. **Note iOS** : un raccourci d'écran d'accueil **fige son nom** à l'ajout → pour
   le mettre à jour, le supprimer et le recréer (le préciser à l'utilisateur).
5. **Publier** : **release-deploy** (bump `phN` car css/html changent).

## Garde-fous
- Tester un **vrai gabarit téléphone** (pas seulement desktop).
- Ne pas réintroduire le « bandeau orange » (fond du body qui dépasse) : `#ecran-jeu`
  fixe + `.panneau` fixe.
- Cache-busting indispensable (sinon iOS garde l'ancienne CSS).

## Enchaînement
**ios-pwa-check** → release-deploy.
