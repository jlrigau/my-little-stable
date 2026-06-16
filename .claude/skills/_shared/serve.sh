#!/usr/bin/env bash
# Sert le jeu en statique (pour tests/captures headless).
# Usage : bash .claude/skills/_shared/serve.sh [port]
# Portable : tout agent peut l'appeler. Dépend uniquement de python3 + curl.
set -euo pipefail
PORT="${1:-8099}"
# racine du repo = 3 niveaux au-dessus de ce script (.claude/skills/_shared/)
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"
# stoppe une éventuelle instance précédente sur ce port
pkill -f "http.server ${PORT}" 2>/dev/null || true
nohup python3 -m http.server "${PORT}" >/tmp/mce-http.log 2>&1 &
# attend que le serveur réponde (retry curl, pas de sleep)
if curl -s --retry 20 --retry-delay 1 --retry-connrefused -o /dev/null "http://localhost:${PORT}/index.html"; then
  echo "OK : http://localhost:${PORT}/"
else
  echo "ERREUR : serveur non démarré (voir /tmp/mce-http.log)" >&2
  exit 1
fi
