@echo off
setlocal
cd /d "%~dp0"

set PORT=3310
set PID_FILE=.planner-box.pid
set LOG_FILE=.planner-box.log

echo Planner Box for Office를 시작합니다...

:: Node.js 설치 확인
where npm >nul 2>1
if %errorlevel% neq 0 (
    echo [오류] Node.js/npm이 설치되어 있지 않습니다.
    echo Node.js LTS 버전을 설치한 뒤 다시 실행해주세요.
    pause
    exit /b 1
)

:: 이미 실행 중인지 확인
if exist "%PID_FILE%" (
    set /p PID=<"%PID_FILE%"
    tasklist /FI "PID eq %PID%" 2>NUL | find /I "%PID%" >NUL
    if %errorlevel% equ 0 (
        echo 서버가 이미 실행 중입니다. 페이지를 엽니다...
        start http://localhost:%PORT%
        timeout /t 3 >nul
        exit /b 0
    )
    del "%PID_FILE%"
)

:: 패키지 설치 확인
if not exist "node_modules" (
    echo 첫 실행을 위한 라이브러리를 설치 중입니다 (최초 1회)...
    call npm install
)

:: 서버 백그라운드 실행 (Windows 특성상 별도 창으로 띄움)
echo 서버를 시작하는 중...
start /b cmd /c "npm run dev -- -p %PORT% > %LOG_FILE% 2>&1"

:: 서버 응답 대기 및 페이지 열기
echo 페이지가 열릴 때까지 잠시만 기다려주세요...
:wait_loop
set /a count+=1
if %count% geq 30 (
    echo [오류] 서버 시작 시간이 초과되었습니다. %LOG_FILE%를 확인해주세요.
    pause
    exit /b 1
)
curl -s http://localhost:%PORT% >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 1 >nul
    goto wait_loop
)

:: 성공
:: PID 찾기 (가장 최근 실행된 node 프로세스를 대략적으로 찾음)
for /f "tokens=2" %%a in ('tasklist /nh /fi "imagename eq node.exe" ^| sort /r ^| find "node.exe"') do (
    echo %%a > "%PID_FILE%"
    goto :opened
)

:opened
start http://localhost:%PORT%
echo 실행 성공! 3초 후 이 창은 자동으로 닫힙니다.
timeout /t 3 >nul
exit
