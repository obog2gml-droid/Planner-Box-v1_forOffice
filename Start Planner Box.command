#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

PORT=3310
PID_FILE=".planner-box.pid"
LOG_FILE=".planner-box.log"

if ! command -v npm >/dev/null 2>&1; then
  osascript -e 'display alert "Node.js/npm이 설치되어 있지 않습니다." message "Node.js LTS를 설치한 뒤 다시 실행해주세요." as critical' || true
  exit 1
fi

if [[ -f "$PID_FILE" ]]; then
  PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "$PID" ]] && kill -0 "$PID" 2>/dev/null; then
    open "http://localhost:$PORT"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

if [[ ! -d node_modules ]]; then
  npm install
fi

nohup npm run dev -- -p "$PORT" > "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

for _ in {1..60}; do
  if curl -fsS "http://localhost:$PORT" >/dev/null 2>&1; then
    open "http://localhost:$PORT"
    echo "실행 성공! 3초 후 터미널을 종료합니다."
    sleep 3
    osascript -e 'tell application "Terminal" to close (every window whose name contains "Start Planner Box")' &
    exit 0
  fi
  sleep 1
done

echo "서버 시작 시간이 초과되었습니다. 로그를 확인해주세요: $LOG_FILE"
open -a TextEdit "$LOG_FILE" || true
sleep 5
exit 1
