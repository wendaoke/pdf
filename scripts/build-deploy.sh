#!/usr/bin/env bash
# ============================================================
# 与 build-deploy.bat 对齐：构建后端 + 前端，打包到 dist/pdf-merge-deploy
#
# Usage（在仓库根或任意目录）:
#   chmod +x scripts/build-deploy.sh
#   ./scripts/build-deploy.sh           # 默认 package
#   ./scripts/build-deploy.sh build     # 仅 mvn + npm build，不拷贝 dist
#   ./scripts/build-deploy.sh package   # build + 写入 dist/
#
# 依赖：JDK 21+、Maven、Node 18+；前端需已配置 standalone（next.config）
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND="$REPO_ROOT/backend/pdf-merge"
FRONTEND="$REPO_ROOT/frontend/pdf-merge-web"
DIST="$REPO_ROOT/dist/pdf-merge-deploy"

MODE="${1:-package}"

pick_fat_jar() {
  local dir="$1" j
  while read -r j; do
    case "$j" in *original*) continue ;; esac
    printf '%s' "$j"
    return 0
  done < <(ls -t "$dir"/*.jar 2>/dev/null || true)
  return 1
}

do_bld() {
  echo "[1/2] Backend: mvn clean package -DskipTests ..."
  (cd "$BACKEND" && mvn -q clean package -DskipTests)
  echo "[2/2] Frontend: npm install && npm run build ..."
  (cd "$FRONTEND" && npm install && npm run build)
}

do_pkg() {
  do_bld
  echo "[3/3] Package -> $DIST"
  rm -rf "$DIST"
  mkdir -p "$DIST/backend" "$DIST/frontend"

  API_JAR="$(pick_fat_jar "$BACKEND/pdf-merge-api/target")" || {
    echo "ERROR: no pdf-merge-api jar under $BACKEND/pdf-merge-api/target"
    exit 1
  }
  WORKER_JAR="$(pick_fat_jar "$BACKEND/pdf-merge-worker/target")" || {
    echo "ERROR: no pdf-merge-worker jar under $BACKEND/pdf-merge-worker/target"
    exit 1
  }

  cp -f "$API_JAR" "$DIST/backend/pdf-merge-api.jar"
  cp -f "$WORKER_JAR" "$DIST/backend/pdf-merge-worker.jar"
  cp -f "$SCRIPT_DIR/start-backend-prod.sh" "$SCRIPT_DIR/stop-backend-prod.sh" "$SCRIPT_DIR/application-prod.yml.example" "$DIST/backend/"
  chmod +x "$DIST/backend"/*.sh 2>/dev/null || true

  if [[ ! -d "$FRONTEND/.next/standalone" ]]; then
    echo "ERROR: missing $FRONTEND/.next/standalone (need output: standalone in next.config)"
    exit 1
  fi
  cp -a "$FRONTEND/.next/standalone/." "$DIST/frontend/"
  mkdir -p "$DIST/frontend/.next/static"
  [[ -d "$FRONTEND/.next/static" ]] && cp -a "$FRONTEND/.next/static/." "$DIST/frontend/.next/static/"
  if [[ -d "$FRONTEND/public" ]]; then
    mkdir -p "$DIST/frontend/public"
    cp -a "$FRONTEND/public/." "$DIST/frontend/public/"
  fi

  if command -v python3 >/dev/null 2>&1; then
    python3 "$SCRIPT_DIR/normalize-sh-lf.py" "$DIST/backend" 2>/dev/null || true
  fi

  cat >"$DIST/DEPLOY_HINT.txt" <<EOF
1) 后端（需 MySQL、Redis）:
   cd $DIST/backend && ./start-backend-prod.sh
   配置: 上级 config/application.yml 或首参传入 yml 路径；停止: ./stop-backend-prod.sh

2) 前端（Next standalone）:
   cd $DIST/frontend
   export PORT=\${FRONTEND_PORT:-3000}
   export NEXT_PUBLIC_MERGE_API_BASE=http://localhost:8080/api/v1/pdf/merge
   node server.js

3) 一键（本机 Linux）:
   $SCRIPT_DIR/start-prod.sh [config.yml] [NEXT_PUBLIC_MERGE_API_BASE]
EOF
  echo "Done. See $DIST/DEPLOY_HINT.txt"
}

case "$MODE" in
build)
  do_bld
  ;;
package)
  do_pkg
  ;;
*)
  echo "Usage: $0 [build|package]"
  exit 1
  ;;
esac
