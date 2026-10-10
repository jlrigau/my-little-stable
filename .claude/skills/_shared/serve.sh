#!/usr/bin/env bash
# Serve the game statically (for headless tests / screenshots).
# Usage: bash .claude/skills/_shared/serve.sh [port]
# Portable: any agent can call it. Depends only on python3 + curl.
set -euo pipefail
PORT="${1:-8099}"
# repo root = 3 levels above this script (.claude/skills/_shared/)
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"
pkill -f "http.server ${PORT}" 2>/dev/null || true
nohup python3 -m http.server "${PORT}" >/tmp/engine-http.log 2>&1 &
if curl -s --retry 20 --retry-delay 1 --retry-connrefused -o /dev/null "http://localhost:${PORT}/index.html"; then
  echo "OK: http://localhost:${PORT}/"
else
  echo "ERROR: server did not start (see /tmp/engine-http.log)" >&2
  exit 1
fi
