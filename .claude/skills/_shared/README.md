# Outillage partagé des skills

Briques réutilisées par les **skills Claude Code** de **Mon Centre Équestre**
(dossiers `.claude/skills/<nom>/SKILL.md`). Les scripts sont du Node / Python /
bash standard, lancés par Claude Code via l'outil **Bash**.

| Fichier | Rôle |
| --- | --- |
| `serve.sh` | Sert le jeu en statique : `bash .claude/skills/_shared/serve.sh [port]` (def. 8099). |
| `bump-version.mjs` | Incrémente la version de cache `phN` **aux deux endroits** (`ASSET_VER` de game.js + tous les `?v=` d'index.html). `node .claude/skills/_shared/bump-version.mjs`. |
| `playtest.cjs` | Harnais Playwright headless : démarre une partie, prend des captures de zones (`--shots`), vérifie la marchabilité du cross (`--walk`), évalue des expressions (`--eval`), lance des assertions (`--probe`), et **remonte les erreurs de page**. |

## Pré-requis
- `python3` (serveur statique), `node` + **Playwright** (Chromium), et pour les
  skills d'assets : `Pillow`/`numpy` (découpe d'images).
- Playwright est cherché via `require("playwright")` puis, à défaut,
  `/opt/node22/lib/node_modules/playwright`.

## Exemple complet
```bash
bash .claude/skills/_shared/serve.sh 8099
node .claude/skills/_shared/playtest.cjs --walk \
  --shots "spawn:560:860:0.9,paddock:1210:300:0.8,carriere:2010:760:0.8"
```
Le rapport JSON liste les captures, la marchabilité et les `pageErrors`
(code de sortie ≠ 0 s'il y a une erreur de page).
