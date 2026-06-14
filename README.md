# 🤠 Mon Ranch du Far West

Un petit jeu de **simulation d'élevage de chevaux** pensé pour les enfants de **9-10 ans**.
On élève des chevaux, on en prend soin, on gagne des rodéos et on fait grandir son ranch dans une ambiance Far West (canyons, cactus, coucher de soleil orangé) ! 🐴🌵

C'est un **site 100 % statique** (HTML + CSS + JavaScript, sans aucune dépendance ni installation).
Il peut s'ouvrir directement dans un navigateur **ou** être déployé sur **GitHub Pages**.

## ▶️ Jouer en ligne

👉 **[Jouer à Mon Ranch du Far West](https://jlrigau.github.io/my-little-stable/)** 🤠🐴

## 🎮 Comment jouer

Le ranch est en **vue isométrique 2.5D**. Tu commences par **créer ton personnage**
(peau, cheveux, habit, pantalon, chapeau), puis tu le déplaces dans le ranch pour
t'occuper de tes chevaux.

- **Se déplacer** : **clic/tap** sur le sol, flèches du clavier (Z Q S D), ou la **manette ▲◀▶▼**.
  Tu peux aussi cliquer directement sur un cheval ou un bâtiment.
- **S'occuper d'un cheval** : approche-toi, puis 🌾 Nourrir, 🧽 Brosser, 🎾 Jouer,
  **🏇 Monter** (promène-toi à cheval !) ou **🎨 Relooker** (robe, crinière, accessoire, nom).
  Une frimousse 😀/😐/😢 indique son humeur.
- **🏪 Magasin** : foin, décorations, et adopter de nouveaux chevaux. **🏠 Maison** : dormir
  pour passer au jour suivant.
- **🧍 (en haut)** : change ton apparence quand tu veux.

La partie est **sauvegardée automatiquement** dans le navigateur (localStorage).

### ✨ Fonctionnalités

- 🗺️ **Monde isométrique 2.5D** dessiné sur `<canvas>` (sprites vectoriels)
- 🎨 **Personnalisation poussée** : ton personnage **et** chaque cheval (robe, crinière, accessoire, nom)
- 🐴 Soins : nourrir, brosser, jouer — et **monter à cheval** 🏇
- 🛒 Magasin pour agrandir le ranch · 💰 économie simple · 💾 sauvegarde automatique
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
