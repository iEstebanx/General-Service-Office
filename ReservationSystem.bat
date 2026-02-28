@echo off
title Reservation System - Production (FAST)

REM ✅ Project folder is wherever this .bat is located
set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%" || (echo Project folder not found & pause & exit /b 1)

REM ====== Read PORT from backend\.env (fallback to 4000) ======
set "PORT=4000"
for /f "usebackq tokens=1,* delims==" %%A in ("%PROJECT_DIR%backend\.env") do (
  if /i "%%A"=="PORT" set "PORT=%%B"
)

echo ===============================
echo Building frontend (Vite build)
echo ===============================
cd frontend || (echo Frontend folder not found & pause & exit /b 1)
call npm run build || (echo Frontend build failed & pause & exit /b 1)

echo ===============================
echo Starting backend server (new window)
echo ===============================
cd ..\backend || (echo Backend folder not found & pause & exit /b 1)
start "Backend Server" /min cmd /k "npm run start"

echo ===============================
echo Waiting for server to be ready...
echo ===============================

for /l %%I in (1,1,30) do (
  powershell -NoProfile -Command ^
    "try { (Invoke-WebRequest -UseBasicParsing http://localhost:%PORT%/api/health -TimeoutSec 2).StatusCode; exit 0 } catch { exit 1 }" ^
    >nul 2>&1
  if not errorlevel 1 goto :OPEN
  timeout /t 1 >nul
)

echo Server did not respond in time. Opening anyway...
:OPEN
start http://localhost:%PORT%
exit