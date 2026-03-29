#!/usr/bin/env bash
# ============================================================
# 正式环境（Linux）：停止与本脚本同目录下启动的 pdf-merge-api / pdf-merge-worker。
# 与 start-backend-prod.sh 成对使用，放在 backend/ 与两个 jar 同级。
#
# Usage:
#   cd .../backend && ./stop-backend-prod.sh
#
# 若 env: "bash\r": 没有那个文件 — 脚本为 CRLF，执行:
#   sed -i 's/\r$//' stop-backend-prod.sh start-backend-prod.sh
# ============================================================

set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$DEPLOY_DIR/run"

stop_pidfile() {
  local f="$1"
  local name="$2"
  if [[ -f "$f" ]]; then
    local pid
    pid="$(cat "$f" 2>/dev/null || true)"
    if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
      echo "Stopping $name (pid $pid)..."
      kill "$pid" 2>/dev/null || true
      for _ in {1..30}; do
        kill -0 "$pid" 2>/dev/null || break
        sleep 0.2
      done
      if kill -0 "$pid" 2>/dev/null; then
        echo "Force kill $name (pid $pid)"
        kill -9 "$pid" 2>/dev/null || true
      fi
    fi
    rm -f "$f"
  fi
}

stop_pidfile "$RUN_DIR/api.pid" "pdf-merge-api"
stop_pidfile "$RUN_DIR/worker.pid" "pdf-merge-worker"

if command -v pgrep >/dev/null 2>&1; then
  for pattern in "pdf-merge-api.jar" "pdf-merge-worker.jar"; do
    if pgrep -f "$pattern" >/dev/null 2>&1; then
      echo "Fallback: pkill -f $pattern"
      pkill -f "$pattern" 2>/dev/null || true
    fi
  done
fi

echo "Done."
