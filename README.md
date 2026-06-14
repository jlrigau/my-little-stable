# 🤠 Mon Ranch du Far West

Un petit jeu de **simulation d'élevage de chevaux** pensé pour les enfants de **9-10 ans**.
On élève des chevaux, on en prend soin, on gagne des rodéos et on fait grandir son ranch dans une ambiance Far West (canyons, cactus, coucher de soleil orangé) ! 🐴🌵

C'est un **site 100 % statique** (HTML + CSS + JavaScript, sans aucune dépendance ni installation).
Il peut s'ouvrir directement dans un navigateur **ou** être déployé sur **GitHub Pages**.

## ▶️ Jouer en ligne

👉 **[Jouer à Mon Ranch du Far West](https://jlrigau.github.io/my-little-stable/)** 🤠🐴

## 🎮 Comment jouer

Tu diriges une **cow-girl 🤠 que tu déplaces librement** dans un ranch en vue de dessus
(façon petit jeu de simulation/ville). Tu te promènes, tu vas voir tes chevaux et les
bâtiments, et tu agis.

- **Se déplacer** : flèches du clavier (ou Z Q S D), **clic/tap** sur le ranch, ou la **manette ▲◀▶▼** tactile.
- **S'occuper d'un cheval** : approche-toi de lui, puis utilise les boutons du panneau
  (🌾 Nourrir, 🧽 Brosser, 🎾 Jouer, 🤠 Dresser, 🏆 Rodéo). Garde ses 4 besoins au vert ;
  une frimousse 😀/😐/😢 au-dessus de lui indique son humeur.
- **🏪 Magasin** : va devant le bâtiment pour acheter du foin, des décorations, ou un cheval
  (avec **nom** et **robe** au choix), et agrandir le corral.
- **🛖 Élevage** : avec 2 chevaux adultes et heureux, fais naître un **poulain** qui grandit.
- **🏠 Maison** : va **dormir** pour passer au jour suivant.
- **🏆 Objectifs** : réussis des défis pour gagner des médailles et faire **monter ton ranch de niveau**.

La partie est **sauvegardée automatiquement** dans le navigateur (localStorage).

### ✨ Fonctionnalités

- 🗺️ **Monde 2D explorable** dessiné sur `<canvas>`, avec personnage déplaçable
- 🐴 Soin des chevaux (faim, énergie, propreté, bonheur) qui se baladent dans le corral
- 🎨 **Personnalisation** : nom et robe au choix, décorations posées dans le ranch
- 🏆 **Progression** : niveaux de ranch, objectifs et médailles
- 🤠 Dressage et rodéos pour gagner des dollars
- 🐣 Élevage de poulains · 💾 Sauvegarde automatique
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
| `style.css` | Thème graphique Far West |
| `game.js` | Toute la logique du jeu |
| `.github/workflows/deploy.yml` | Déploiement automatique sur GitHub Pages |

## 💡 Idées d'évolutions

- Plus de races et de couleurs de chevaux
- De nouveaux mini-jeux (courses, parcours d'obstacles)
- Des décors et objets à débloquer pour le ranch
- Des saisons et des événements spéciaux

Bonne aventure au Far West ! 🌅
