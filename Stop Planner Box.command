#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

PID_FILE=".planner-box.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "실행 중인 Planner Box 서버를 찾지 못했습니다."
  exit 0
fi

PID="$(cat "$PID_FILE" 2>/dev/null || true)"
if [[ -n "$PID" ]] && kill -0 "$PID" 2>/dev/null; then
  kill "$PID" || true
  sleep 1
  if kill -0 "$PID" 2>/dev/null; then
    kill -9 "$PID" || true
  fi
  echo "Planner Box 서버를 종료했습니다. (PID: $PID)"
else
  echo "이미 종료된 서버입니다."
fi

rm -f "$PID_FILE"
echo "3초 후 터미널을 종료합니다."
sleep 3
osascript -e 'tell application "Terminal" to close (every window whose name contains "Stop Planner Box")' &
exit 0
