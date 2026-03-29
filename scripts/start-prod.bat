@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem =========================================================
rem Production start script for dist/pdf-merge-deploy
rem Usage:
rem   scripts\start-prod.bat [CONFIG_YML_PATH] [NEXT_PUBLIC_MERGE_API_BASE]
rem Example:
rem   scripts\start-prod.bat "dist\pdf-merge-deploy\config\application.yml" "http://host:8080/api/v1/pdf/merge"
rem Optional before run: set FRONTEND_PORT=3001
rem Stop / restart:
rem   scripts\stop-prod.bat
rem   scripts\restart-prod.bat  (same optional args as start-prod)
rem If a black window flashes and closes: open cmd.exe, cd to repo, run this
rem script again to keep the parent window; or run java -jar / node server.js
rem by hand in cmd to read the error text.
rem =========================================================

for %%I in ("%~dp0..\dist\pdf-merge-deploy") do set "DIST_DIR=%%~fI"
set "BACKEND_DIR=%DIST_DIR%\backend"
set "FRONTEND_DIR=%DIST_DIR%\frontend"
set "CONFIG_TEMPLATE=%~dp0application-prod.yml.example"

set "CONFIG_FILE=%~1"
if "%CONFIG_FILE%"=="" (
  set "CONFIG_FILE=%DIST_DIR%\config\application.yml"
)
for %%I in ("%CONFIG_FILE%") do set "CONFIG_FILE=%%~fI"

set "NEXT_PUBLIC_MERGE_API_BASE=%~2"
if "%NEXT_PUBLIC_MERGE_API_BASE%"=="" (
  set "NEXT_PUBLIC_MERGE_API_BASE=http://localhost:8080/api/v1/pdf/merge"
)

rem Next standalone server.js reads PORT; optional FRONTEND_PORT before this script
if "%FRONTEND_PORT%"=="" set "FRONTEND_PORT=3000"

echo DIST_DIR: %DIST_DIR%
echo CONFIG_FILE: %CONFIG_FILE%
echo NEXT_PUBLIC_MERGE_API_BASE: %NEXT_PUBLIC_MERGE_API_BASE%
echo FRONTEND_URL: http://127.0.0.1:%FRONTEND_PORT%/

if not exist "%BACKEND_DIR%\pdf-merge-api.jar" (
  echo ERROR: pdf-merge-api.jar not found in "%BACKEND_DIR%"
  echo Run: scripts\build-deploy.bat package
  exit /b 1
)
if not exist "%BACKEND_DIR%\pdf-merge-worker.jar" (
  echo ERROR: pdf-merge-worker.jar not found in "%BACKEND_DIR%"
  echo Run: scripts\build-deploy.bat package
  exit /b 1
)

if not exist "%CONFIG_FILE%" (
  if exist "%CONFIG_TEMPLATE%" (
    for %%I in ("%CONFIG_FILE%") do if not exist "%%~dpI" mkdir "%%~dpI"
    copy /y "%CONFIG_TEMPLATE%" "%CONFIG_FILE%" >nul
    echo.
    echo ============================================================
    echo First run: created config from template:
    echo   "%CONFIG_FILE%"
    echo Edit MySQL/Redis/passwords as needed. Services start now; if API/worker fail,
    echo fix the yml then run scripts\restart-prod.bat ^(or stop-prod + start-prod^).
    echo ============================================================
    echo.
  ) else (
    echo ERROR: config missing and template not found.
    echo   CONFIG: "%CONFIG_FILE%"
    echo   TEMPLATE: "%CONFIG_TEMPLATE%"
    exit /b 1
  )
)

rem Backend listens on server.port (8080 in example yml). cmd /k keeps the window if startup fails.
echo API listens on port 8080 by default. If netstat shows nothing, read errors in pdf-merge-api window.
start "pdf-merge-api" cmd.exe /k java -jar "%BACKEND_DIR%\pdf-merge-api.jar" --spring.profiles.active=prod --spring.config.additional-location="file:%CONFIG_FILE%"
start "pdf-merge-worker" cmd.exe /k java -jar "%BACKEND_DIR%\pdf-merge-worker.jar" --spring.profiles.active=worker --spring.config.additional-location="file:%CONFIG_FILE%"

rem Start frontend
if not exist "%FRONTEND_DIR%\server.js" (
  echo ERROR: frontend server.js not found in "%FRONTEND_DIR%"
  echo Run: scripts\build-deploy.bat package
  exit /b 1
)
rem Use START /D for working dir - avoids broken cd quoting. Pass PORT via inherited env
rem (do not put http://... inside cmd /k string - CMD treats colons like drive letters).
set "PORT=%FRONTEND_PORT%"
rem cmd /k runs node in this window - do not use echo ... ^& node (start/batch breaks the & chain)
start "pdf-merge-web" /D "%FRONTEND_DIR%" cmd.exe /k "node server.js"

echo.
echo Done: started three windows - API, Worker, Web.
echo Browser: http://127.0.0.1:%FRONTEND_PORT%/  - if refused, check pdf-merge-web window for node errors.
echo Tip: Set FRONTEND_PORT before this script to change port. Do not press Ctrl+C in this window.
echo.
exit /b 0
