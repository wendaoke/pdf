#!/usr/bin/env bash
# ============================================================
# Linux / macOS：启动 dist/pdf-merge-deploy 下的后端 + 前端（nohup）
#
# Usage（仓库根）:
#   chmod +x scripts/start-prod.sh
#   ./scripts/start-prod.sh [CONFIG_YML] [NEXT_PUBLIC_MERGE_API_BASE]
#
# 默认 CONFIG: <dist>/config/application.yml（不存在则从 application-prod.yml.example 复制）
# 默认 API:    http://localhost:8080/api/v1/pdf/merge
# 端口:       FRONTEND_PORT=3001 ./scripts/start-prod.sh
#
# 需先执行: ./scripts/build-deploy.sh package
# 停止:     ./scripts/stop-prod.sh
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST="$(cd "$SCRIPT_DIR/../dist/pdf-merge-deploy" && pwd)"
BACKEND="$DIST/backend"
FRONTEND="$DIST/frontend"
RUN_ROOT="$DIST/run"
LOG_ROOT="$DIST/logs"
CONFIG_TEMPLATE="$SCRIPT_DIR/application-prod.yml.example"

CONFIG_FILE="${1:-$DIST/config/application.yml}"
NEXT_PUBLIC_MERGE_API_BASE="${2:-http://localhost:8080/api/v1/pdf/merge}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

die() { echo "ERROR: $*" >&2; exit 1; }

[[ -f "$BACKEND/pdf-merge-api.jar" ]] || die "missing api jar; run: scripts/build-deploy.sh package"
[[ -f "$BACKEND/pdf-merge-worker.jar" ]] || die "missing worker jar"
[[ -f "$FRONTEND/server.js" ]] || die "missing frontend server.js"

mkdir -p "$RUN_ROOT" "$LOG_ROOT"

if [[ ! -f "$CONFIG_FILE" ]]; then
  [[ -f "$CONFIG_TEMPLATE" ]] || die "no config and no template: $CONFIG_TEMPLATE"
  mkdir -p "$(dirname "$CONFIG_FILE")"
  cp -f "$CONFIG_TEMPLATE" "$CONFIG_FILE"
  echo "First run: created $CONFIG_FILE — edit MySQL/Redis, then:"
  echo "  ./scripts/stop-prod.sh 2>/dev/null; ./scripts/start-prod.sh \"$CONFIG_FILE\" \"$NEXT_PUBLIC_MERGE_API_BASE\""
  exit 1
fi

CONFIG_FILE="$(cd "$(dirname "$CONFIG_FILE")" && pwd)/$(basename "$CONFIG_FILE")"

echo "DIST=$DIST"
echo "CONFIG=$CONFIG_FILE"
echo "NEXT_PUBLIC_MERGE_API_BASE=$NEXT_PUBLIC_MERGE_API_BASE"
echo "Frontend http://127.0.0.1:$FRONTEND_PORT/"

(cd "$BACKEND" && ./start-backend-prod.sh "$CONFIG_FILE")

if [[ -f "$RUN_ROOT/frontend.pid" ]] && kill -0 "$(cat "$RUN_ROOT/frontend.pid")" 2>/dev/null; then
  die "frontend already running (pid $(cat "$RUN_ROOT/frontend.pid")). Run scripts/stop-prod.sh"
fi

export PORT="$FRONTEND_PORT"
export NEXT_PUBLIC_MERGE_API_BASE
(
  cd "$FRONTEND"
  nohup node server.js >>"$LOG_ROOT/frontend.log" 2>&1 &
  echo $! >"$RUN_ROOT/frontend.pid"
)
echo "Frontend pid=$(cat "$RUN_ROOT/frontend.pid") log=$LOG_ROOT/frontend.log"
echo "Done."
