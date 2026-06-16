---
name: asset-search
description: Chercher de nouveaux éléments graphiques (sprites pixel-art) pour le jeu « Mon Centre Équestre » à partir d'une description en langage naturel, puis proposer une liste de candidats SÛRS et ADAPTÉS aux enfants (9-10 ans) à sélectionner. À utiliser quand on veut ajouter un nouveau décor, une robe de cheval, un personnage, un obstacle, etc. Vérifie OBLIGATOIREMENT chaque asset (sécurité enfant + licence) avant de le proposer. Déclencheurs : « je veux ajouter un … », « trouve-moi un sprite de … », « cherche un nouveau décor/cheval/élément ».
---

# asset-search

À partir d'une **description** (« un abreuvoir en pierre », « un poney gris »,
« une barrière blanche », « un arbre fleuri »), chercher des assets, **les
vérifier**, et présenter une liste de propositions à choisir.

## Flux
1. **Comprendre le besoin** : reformuler en mots-clés (objet, couleur, style).
   Univers cible **uniquement** : ferme / poney / nature / mignon, pour enfant
   de 9-10 ans. Ne jamais élargir hors de cet univers.
2. **Chercher** sur les sources autorisées par la politique réseau (tester l'accès
   avec `curl -s -o /dev/null -w '%{http_code}' <url>` via Bash si besoin) :
   - **OK** : `opengameart.org` (priorité, style **LPC**), `cdn.jsdelivr.net`,
     `upload.wikimedia.org`.
   - **BLOQUÉS** : `kenney.nl`, `itch.io` (Cloudflare).
   - Utiliser **WebSearch** / **WebFetch** pour trouver les pages et leurs métadonnées.
3. **🔒 VÉRIFICATION OBLIGATOIRE de chaque candidat AVANT de le proposer**
   (bloquant — voir `references/securite-enfant.md`) :
   - **Regarder réellement l'image** (télécharger l'aperçu et l'ouvrir avec l'outil
     **Read**) + lire la page source (titre, description, tags, auteur).
   - **Rejeter** tout ce qui n'est pas adapté : violence, sang/gore, armes,
     horreur/effrayant, sexuel/suggestif, drogue/alcool, texte injurieux, thèmes
     adultes, style manga/anime, ou simplement hors-sujet.
   - **Licence** : uniquement **CC-BY / CC-BY-SA / CC0 / OGA-BY / GPL** compatibles,
     attribution possible. Noter auteur + licence + URL.
   - **En cas de doute → ne pas proposer.** Mieux vaut 1 option sûre que 3 douteuses.
4. **Proposer** via **AskUserQuestion** une liste de 2-3 candidats (tous vérifiés),
   chacun avec : courte description, **aperçu** (déjà regardé), source/URL, auteur,
   **licence**, dimensions de la planche, note d'adéquation au style LPC.
   - Si tu veux montrer les aperçus à l'utilisateur, utilise l'option `preview`
     d'AskUserQuestion, ou affiche-les avant la question.
5. **Sortie** : l'asset choisi (URL, licence, auteur, dimensions, découpe prévue)
   est transmis au skill **asset-add**.

## Garde-fous
- **Sécurité enfant prioritaire et bloquante** : rien d'inadapté n'est jamais montré.
- Style **mignon, non-manga, pixel-art LPC, pas d'emoji** dans le monde.
- Toujours conserver **licence + attribution** (servira à `assets/CREDITS.md`).
- Respecter la politique réseau (ne pas tenter les domaines bloqués sans vérifier).

## Enchaînement
→ **asset-add** (intégration) → **map-verify** (si visible sur la carte) →
**release-deploy**.
