@echo off
setlocal
cd /d "%~dp0"

set PID_FILE=.planner-box.pid

if not exist "%PID_FILE%" (
    echo 실행 중인 Planner Box 서버를 찾지 못했습니다.
    timeout /t 3 >nul
    exit /b 0
)

set /p PID=<"%PID_FILE%"

echo 서버(PID: %PID%)를 종료하는 중...

taskkill /F /PID %PID% >nul 2>&1
if %errorlevel% equ 0 (
    echo Planner Box 서버가 종료되었습니다.
) else (
    echo 이미 종료되었거나 찾을 수 없는 서버입니다.
)

del "%PID_FILE%"
echo 3초 후 이 창은 자동으로 닫힙니다.
timeout /t 3 >nul
exit
