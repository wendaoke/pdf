#!/usr/bin/env bash
# 本地一键：先启动后端（后台），再前台启动 Next dev
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/start-local-dev-backend.sh" "${1:-}"
echo "等待 API 就绪（首次 Maven 较慢，可按 Ctrl+C 仅停前端，后端请用 stop-local-dev-backend.sh）..."
sleep 8
exec "$SCRIPT_DIR/start-local-dev-frontend.sh"
