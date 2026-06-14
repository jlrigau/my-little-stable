# 🤠 Mon Ranch du Far West

Un petit jeu de **simulation d'élevage de chevaux** pensé pour les enfants de **9-10 ans**.
On élève des chevaux, on en prend soin, on gagne des rodéos et on fait grandir son ranch dans une ambiance Far West (canyons, cactus, coucher de soleil orangé) ! 🐴🌵

C'est un **site 100 % statique** (HTML + CSS + JavaScript, sans aucune dépendance ni installation).
Il peut s'ouvrir directement dans un navigateur **ou** être déployé sur **GitHub Pages**.

## 🎮 Comment jouer

1. Donne un nom à ton ranch et clique sur **« Commencer l'aventure »**.
2. Occupe-toi de chaque cheval grâce à ses 4 besoins :
   - 🌾 **Faim** — nourris-le avec du foin.
   - ⚡ **Énergie** — il récupère en dormant la nuit.
   - 🧼 **Propreté** — brosse-le.
   - 😊 **Bonheur** — joue avec lui.
3. **🤠 Dresse** tes chevaux pour qu'ils gagnent des **🏆 rodéos** et rapportent des 💰.
4. À la **🛒 boutique**, achète du foin, agrandis ton corral et achète de nouveaux chevaux.
5. Avec deux chevaux adultes et heureux, fais naître un **🐣 poulain** dans l'onglet **Élevage**.
6. Clique sur **🌙 Jour suivant** pour faire passer le temps.

La partie est **sauvegardée automatiquement** dans le navigateur (localStorage).

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
