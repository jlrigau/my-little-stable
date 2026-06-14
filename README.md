# 🐴 Mon Centre Équestre

Un petit jeu de **simulation d'élevage de chevaux** pensé pour les enfants de **9-10 ans**.
On élève des chevaux, on en prend soin et on fait grandir son centre équestre dans une
jolie ambiance de ferme verdoyante ! 🐴🌳

C'est un **site 100 % statique** (HTML + CSS + JavaScript, sans aucune dépendance ni installation).
Il peut s'ouvrir directement dans un navigateur **ou** être déployé sur **GitHub Pages**.

## ▶️ Jouer en ligne

👉 **[Jouer à Mon Centre Équestre](https://jlrigau.github.io/my-little-stable/)** 🐴

## 🎮 Comment jouer

Le centre est en **vue de dessus fluide** (moteur **Phaser 3**). Tout le visuel utilise de
vrais **assets pixel-art libres** (style **LPC**) : pelouse, chemins, clôtures, écuries,
arbres, **personnages animés** et **chevaux animés** (plus aucun emoji dans le décor).
Tu commences par **choisir ton personnage**, puis tu le déplaces dans le centre pour
t'occuper de tes chevaux.

- **Se déplacer** : **clic/tap** sur le sol, flèches du clavier (Z Q S D), ou la **manette ▲◀▶▼**.
  Tu peux aussi cliquer directement sur un cheval ou un bâtiment.
- **S'occuper d'un cheval** : approche-toi, puis 🌾 Nourrir, 🧽 Brosser, 🎾 Jouer,
  **🏇 Monter** (promène-toi à cheval !) ou **🎨 Relooker** (robe, nom).
  Un petit cœur (vert / orange / rouge) indique son humeur.
- **Magasin** : foin, décorations, et adopter de nouveaux chevaux. **Écurie** : dormir
  pour passer au jour suivant.
- **🧍 (en haut)** : change ton personnage quand tu veux.

La partie est **sauvegardée automatiquement** dans le navigateur (localStorage).

### ✨ Fonctionnalités

- 🎮 **Moteur Phaser 3** (déplacement fluide, caméra qui suit) + visuel **pixel-art**
- 🎨 **Personnalisation** : ton personnage **et** chaque cheval (robe parmi 5 pelages, nom)
- 🐴 Soins : nourrir, brosser, jouer — et **monter à cheval** 🏇
- 🛒 Magasin pour agrandir l'enclos · 💰 économie simple · 💾 sauvegarde automatique
- 📱 Jouable au clavier, à la souris **et au tactile**

## 🚀 Jouer en local

Aucune installation : ouvre simplement le fichier `index.html` dans un navigateur.

## 🌐 Déploiement sur GitHub Pages

Le dépôt contient un workflow GitHub Actions (`.github/workflows/deploy.yml`) qui publie
automatiquement le site sur GitHub Pages à chaque push.

Pour activer la publication (une seule fois) :

1. Sur GitHub, va dans **Settings → Pages**.
2. Dans **Build and deployment → Source**, choisis **GitHub Actions**.
3. Le site sera disponible à l'adresse `https://<utilisateur>.github.io/<dépôt>/`.

## 📁 Structure du projet

| Fichier | Rôle |
| --- | --- |
| `index.html` | Structure de la page et écrans du jeu |
| `style.css` | Thème graphique |
| `game.js` | Toute la logique du jeu |
| `assets/` | Images pixel-art (sprites, planches LPC) et crédits (`CREDITS.md`) |
| `.github/workflows/deploy.yml` | Déploiement automatique sur GitHub Pages |

## 🎨 Crédits graphiques

Assets pixel-art libres de l'univers **LPC (Liberated Pixel Cup)**, sous licence
**CC-BY / CC-BY-SA**. Attribution complète dans [`assets/CREDITS.md`](assets/CREDITS.md).

## 💡 Idées d'évolutions

- Plus de races et de couleurs de chevaux
- De nouveaux mini-jeux (courses, parcours d'obstacles)
- Des décors et objets à débloquer pour le centre
- Des saisons et des événements spéciaux

Bonne balade au centre équestre ! 🐴
