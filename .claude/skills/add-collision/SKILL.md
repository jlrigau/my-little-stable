---
name: add-collision
description: Ajouter ou ajuster une collision (obstacle) dans le jeu « Mon Centre Équestre » pour que le joueur (à pied ou à cheval) ne traverse pas un élément — ou puisse le sauter. Gère le tableau COLLISIONS (boîtes AABB) et le drapeau haie pour les obstacles franchissables au saut. Déclencheurs : « on peut traverser le …, il faut une collision », « bloquer cet élément », « rendre ça sautable », « le joueur passe à travers ».
---

# add-collision

Empêcher de traverser un élément (ou le rendre franchissable au saut).

## Code concerné (game.js)
- Tableau **`COLLISIONS`** : boîtes **AABB** `{ x, y, w, h }` (coin haut-gauche).
- `bloquerObstacles` repousse le joueur **par axe** (empreinte plus large à cheval).
- Drapeau **`haie: true`** sur une boîte = obstacle **franchissable au saut**
  (la collision est ignorée pendant `sautEnCours`). Sinon, blocage total.
- Convention rondins (exemple) : collision **plus courte que le rendu** pour
  pouvoir passer au-dessus/en-dessous → `{ x:r.x-22, y:r.y-50, w:44, h:100, haie:true }`.

## Procédure
1. **Déterminer la boîte** : prendre l'empreinte au **sol** de l'élément (pas tout
   le sprite), centrée sur sa base. Largeur/hauteur en pixels monde.
2. **Ajouter** au moment où l'élément est créé :
   `COLLISIONS.push({ x, y, w, h })` (+ `haie:true` si sautable).
3. **Doser** :
   - Obstacle « dur » (arbre, bâtiment, clôture) → boîte ferme, pas de `haie`.
   - Obstacle de parcours (haie, rondin) → `haie:true`, et collision **plus petite
     que le visuel** si on veut pouvoir le contourner sans rester coincé.
4. **Vérifier la marchabilité** : **map-verify** (`playtest.cjs --walk`) — les
   couloirs/chemins restent passables, on ne reste pas bloqué.
5. **Publier** : **release-deploy** si OK.

## Garde-fous
- Une collision trop large **coince** le joueur → toujours tester avec `--walk`.
- Sur les chemins du cross, garder les passages ouverts (cf. **place-vegetation**).
- À cheval l'empreinte est plus grande : tester aussi monté si pertinent.

## Enchaînement
(placement d'un élément) → **add-collision** → map-verify → release-deploy.
