#!/usr/bin/env bash
# ============================================================
# 停止 start-prod.sh 启动的前端 node，以及 dist/backend 下 jar 进程
# Usage: ./scripts/stop-prod.sh
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST="$(cd "$SCRIPT_DIR/../dist/pdf-merge-deploy" && pwd)"
BACKEND="$DIST/backend"
RUN_ROOT="$DIST/run"

if [[ -f "$BACKEND/stop-backend-prod.sh" ]]; then
  (cd "$BACKEND" && ./stop-backend-prod.sh) || true
fi

if [[ -f "$RUN_ROOT/frontend.pid" ]]; then
  pid="$(cat "$RUN_ROOT/frontend.pid" 2>/dev/null || true)"
  if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
    echo "Stopping frontend (pid $pid)..."
    kill "$pid" 2>/dev/null || true
    sleep 1
    kill -9 "$pid" 2>/dev/null || true
  fi
  rm -f "$RUN_ROOT/frontend.pid"
fi

if command -v pgrep >/dev/null 2>&1; then
  if pgrep -f "$DIST/frontend/server.js" >/dev/null 2>&1; then
    pkill -f "$DIST/frontend/server.js" 2>/dev/null || true
  fi
fi

echo "Done."
