#!/usr/bin/env bash
# 停止 start-local-dev-backend.sh 启动的 Maven API / Worker（按 pid 文件）
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/logs/local-dev"

stop_pid() {
  local f="$1" name="$2"
  if [[ -f "$f" ]]; then
    local pid
    pid="$(cat "$f" 2>/dev/null || true)"
    if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
      echo "Stopping $name (pid $pid)..."
      kill "$pid" 2>/dev/null || true
      sleep 1
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$f"
  fi
}

stop_pid "$PID_DIR/api.pid" "pdf-merge-api"
stop_pid "$PID_DIR/worker.pid" "pdf-merge-worker"
echo "Done. Child java/mvn processes may linger until compile finishes; check: ps aux | grep pdf-merge"
