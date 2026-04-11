#!/usr/bin/env bash
# ============================================================
# 本地测试：Next.js 开发服（默认 3000）
# Usage:
#   chmod +x scripts/start-local-dev-frontend.sh
#   ./scripts/start-local-dev-frontend.sh
# 端口: FRONTEND_PORT=3001 ./scripts/start-local-dev-frontend.sh
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB="$SCRIPT_DIR/../frontend/pdf-merge-web"
WEB="$(cd "$WEB" && pwd)"

if [[ ! -f "$WEB/package.json" ]]; then
  echo "ERROR: frontend not found: $WEB"
  exit 1
fi

cd "$WEB"
if [[ ! -d node_modules ]]; then
  echo "npm install ..."
  npm install
fi

export PORT="${FRONTEND_PORT:-3000}"
echo "Open http://127.0.0.1:$PORT/ (Ctrl+C to stop)"
exec npm run dev
