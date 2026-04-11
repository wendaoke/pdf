#!/usr/bin/env bash
# ============================================================
# 本地测试：Maven 启动 pdf-merge-api（8080）与 pdf-merge-worker（后台 + 日志）
# 依赖：JDK 21、Maven；MySQL / Redis 与配置一致
# Usage:
#   chmod +x scripts/start-local-dev-backend.sh
#   ./scripts/start-local-dev-backend.sh [可选: 外置 application.yml 路径]
# 停止：./scripts/stop-local-dev-backend.sh
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND="$REPO_ROOT/backend/pdf-merge"
LOG_DIR="$REPO_ROOT/logs/local-dev"
PID_DIR="$LOG_DIR"

if [[ ! -f "$BACKEND/pdf-merge-api/pom.xml" ]]; then
  echo "ERROR: backend not found: $BACKEND"
  exit 1
fi

mkdir -p "$LOG_DIR"

if [[ -n "${1:-}" ]]; then
  f="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
  export SPRING_CONFIG_ADDITIONAL_LOCATION="file:$f"
  echo "SPRING_CONFIG_ADDITIONAL_LOCATION=$SPRING_CONFIG_ADDITIONAL_LOCATION"
fi

cd "$BACKEND"
echo "Working directory: $PWD"

if [[ -f "$PID_DIR/api.pid" ]] && kill -0 "$(cat "$PID_DIR/api.pid")" 2>/dev/null; then
  echo "ERROR: api already running (pid $(cat "$PID_DIR/api.pid")). Run: scripts/stop-local-dev-backend.sh"
  exit 1
fi

echo "Starting pdf-merge-api -> $LOG_DIR/api.log"
cd "$BACKEND"
nohup mvn -pl pdf-merge-api -am spring-boot:run >>"$LOG_DIR/api.log" 2>&1 &
echo $! >"$PID_DIR/api.pid"
echo "api pid=$(cat "$PID_DIR/api.pid")"

sleep 5

echo "Starting pdf-merge-worker -> $LOG_DIR/worker.log"
nohup mvn -pl pdf-merge-worker -am spring-boot:run -Dspring-boot.run.profiles=worker >>"$LOG_DIR/worker.log" 2>&1 &
echo $! >"$PID_DIR/worker.pid"
echo "worker pid=$(cat "$PID_DIR/worker.pid")"

echo "Done. tail -f \"$LOG_DIR/api.log\""
