#!/usr/bin/env bash
# ============================================================
# 与 restart-prod.bat 相同参数:
#   ./scripts/restart-prod.sh [CONFIG_YML] [NEXT_PUBLIC_MERGE_API_BASE]
# ============================================================

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/stop-prod.sh" || true
sleep 2
exec "$SCRIPT_DIR/start-prod.sh" "$@"
