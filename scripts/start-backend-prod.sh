#!/usr/bin/env bash
# ============================================================
# 正式环境（Linux）：与 pdf-merge-api.jar、pdf-merge-worker.jar 放在同一目录运行。
#
# 推荐目录结构（二选一）：
#
# A) 打包产物（backend 与配置目录为兄弟目录）：
#   deploy/backend/   … 脚本、jar、application-prod.yml.example、logs/、run/
#   deploy/config/application.yml   或   deploy/conf/application.yml
#
# B) 单层目录（脚本与配置目录同在一级目录下）：
#   pdf/
#     start-backend-prod.sh、jar、…
#     conf/application.yml   或   config/application.yml
#
# Usage:
#   cd …/backend 或 cd …/pdf && chmod +x *.sh
#   ./start-backend-prod.sh [CONFIG_YML]
#
# 无参时 CONFIG 解析顺序（先文件存在者优先，conf 优先于 config）：
#   <脚本目录>/conf|config/application.yml → <脚本上一级>/conf|config/application.yml
#   若仍无文件：按已存在的 conf/config 目录选定生成路径；否则默认 <上一级>/config/application.yml
#
# JVM 堆内存默认 -Xms256m -Xmx512m（API 与 Worker 均使用）。
# 覆盖示例: export JAVA_OPTS="-Xms512m -Xmx1024m" && ./start-backend-prod.sh
#
# 若报错 env: "bash\r": 没有那个文件 — 脚本为 Windows CRLF，在服务器执行:
#   sed -i 's/\r$//' start-backend-prod.sh stop-backend-prod.sh
# ============================================================

set -euo pipefail

JAVA_OPTS="${JAVA_OPTS:--Xms256m -Xmx512m}"

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$DEPLOY_DIR/run"
LOG_DIR="$DEPLOY_DIR/logs"
CONFIG_TEMPLATE="$DEPLOY_DIR/application-prod.yml.example"

API_JAR="$DEPLOY_DIR/pdf-merge-api.jar"
WORKER_JAR="$DEPLOY_DIR/pdf-merge-worker.jar"

die() { echo "ERROR: $*" >&2; exit 1; }

command -v java >/dev/null 2>&1 || die "java not found in PATH (install JDK 21+)"

[[ -f "$API_JAR" ]] || die "missing $API_JAR (expected next to this script)"
[[ -f "$WORKER_JAR" ]] || die "missing $WORKER_JAR"

if [[ -n "${1:-}" ]]; then
  CONFIG_FILE="$1"
  mkdir -p "$(dirname "$CONFIG_FILE")"
  CONFIG_FILE="$(cd "$(dirname "$CONFIG_FILE")" && pwd)/$(basename "$CONFIG_FILE")"
else
  PARENT="$(cd "$DEPLOY_DIR/.." && pwd)"
  CONF_COL="$DEPLOY_DIR/conf/application.yml"
  CONF_SIB="$PARENT/conf/application.yml"
  CONFIG_COL="$DEPLOY_DIR/config/application.yml"
  CONFIG_SIB="$PARENT/config/application.yml"
  if [[ -f "$CONF_COL" ]]; then
    CONFIG_FILE="$CONF_COL"
  elif [[ -f "$CONFIG_COL" ]]; then
    CONFIG_FILE="$CONFIG_COL"
  elif [[ -f "$CONF_SIB" ]]; then
    CONFIG_FILE="$CONF_SIB"
  elif [[ -f "$CONFIG_SIB" ]]; then
    CONFIG_FILE="$CONFIG_SIB"
  elif [[ -d "$DEPLOY_DIR/conf" ]]; then
    CONFIG_FILE="$CONF_COL"
  elif [[ -d "$DEPLOY_DIR/config" ]]; then
    CONFIG_FILE="$CONFIG_COL"
  elif [[ -d "$PARENT/conf" ]]; then
    CONFIG_FILE="$CONF_SIB"
  elif [[ -d "$PARENT/config" ]]; then
    CONFIG_FILE="$CONFIG_SIB"
  else
    CONFIG_FILE="$CONFIG_SIB"
  fi
fi

if [[ ! -f "$CONFIG_FILE" ]]; then
  if [[ -f "$CONFIG_TEMPLATE" ]]; then
    mkdir -p "$(dirname "$CONFIG_FILE")"
    cp -f "$CONFIG_TEMPLATE" "$CONFIG_FILE"
    echo "First run: created config from template:"
    echo "  $CONFIG_FILE"
    echo "Edit MySQL/Redis etc., then run this script again."
    exit 1
  fi
  die "config missing: $CONFIG_FILE (pass path as arg or place template at $CONFIG_TEMPLATE)"
fi

mkdir -p "$RUN_DIR" "$LOG_DIR"

if [[ -f "$RUN_DIR/api.pid" ]] && kill -0 "$(cat "$RUN_DIR/api.pid")" 2>/dev/null; then
  die "api already running (pid $(cat "$RUN_DIR/api.pid")). Stop with ./stop-backend-prod.sh"
fi
if [[ -f "$RUN_DIR/worker.pid" ]] && kill -0 "$(cat "$RUN_DIR/worker.pid")" 2>/dev/null; then
  die "worker already running (pid $(cat "$RUN_DIR/worker.pid")). Stop with ./stop-backend-prod.sh"
fi

echo "DEPLOY_DIR=$DEPLOY_DIR"
echo "CONFIG_FILE=$CONFIG_FILE"
echo "JAVA_OPTS=$JAVA_OPTS"
echo "Logs: $LOG_DIR"

nohup java $JAVA_OPTS -jar "$API_JAR" \
  --spring.profiles.active=prod \
  --spring.config.additional-location="file:$CONFIG_FILE" \
  >>"$LOG_DIR/api.log" 2>&1 &
echo $! >"$RUN_DIR/api.pid"
echo "Started pdf-merge-api pid=$(cat "$RUN_DIR/api.pid")"

nohup java $JAVA_OPTS -jar "$WORKER_JAR" \
  --spring.profiles.active=worker \
  --spring.config.additional-location="file:$CONFIG_FILE" \
  >>"$LOG_DIR/worker.log" 2>&1 &
echo $! >"$RUN_DIR/worker.pid"
echo "Started pdf-merge-worker pid=$(cat "$RUN_DIR/worker.pid")"

echo "Done. tail -f \"$LOG_DIR/api.log\""
