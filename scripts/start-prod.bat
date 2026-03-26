@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem =========================================================
rem Production start script for dist/pdf-merge-deploy
rem Usage:
rem   scripts\start-prod.bat [CONFIG_YML_PATH] [NEXT_PUBLIC_MERGE_API_BASE]
rem Example:
rem   scripts\start-prod.bat "dist\pdf-merge-deploy\config\application.yml" "http://host:8080/api/v1/pdf/merge"
rem =========================================================

set "DIST_DIR=%~dp0..\dist\pdf-merge-deploy"
set "BACKEND_DIR=%DIST_DIR%\backend"
set "FRONTEND_DIR=%DIST_DIR%\frontend"
set "CONFIG_TEMPLATE=%~dp0application-prod.yml.example"

set "CONFIG_FILE=%~1"
if "%CONFIG_FILE%"=="" (
  set "CONFIG_FILE=%DIST_DIR%\config\application.yml"
)

set "NEXT_PUBLIC_MERGE_API_BASE=%~2"
if "%NEXT_PUBLIC_MERGE_API_BASE%"=="" (
  set "NEXT_PUBLIC_MERGE_API_BASE=http://localhost:8080/api/v1/pdf/merge"
)

echo DIST_DIR: %DIST_DIR%
echo CONFIG_FILE: %CONFIG_FILE%
echo NEXT_PUBLIC_MERGE_API_BASE: %NEXT_PUBLIC_MERGE_API_BASE%

if not exist "%BACKEND_DIR%\pdf-merge-api.jar" (
  echo ERROR: pdf-merge-api.jar not found in "%BACKEND_DIR%"
  exit /b 1
)
if not exist "%BACKEND_DIR%\pdf-merge-worker.jar" (
  echo ERROR: pdf-merge-worker.jar not found in "%BACKEND_DIR%"
  exit /b 1
)

if not exist "%CONFIG_FILE%" (
  echo WARN: external application.yml not found: "%CONFIG_FILE%"
  if exist "%CONFIG_TEMPLATE%" (
    for %%I in ("%CONFIG_FILE%") do if not exist "%%~dpI" mkdir "%%~dpI"
    copy /y "%CONFIG_TEMPLATE%" "%CONFIG_FILE%" >nul
    echo INFO: template config created from "%CONFIG_TEMPLATE%"
    echo INFO: please edit "%CONFIG_FILE%" and fill MySQL/Redis credentials first.
  ) else (
    echo ERROR: template config not found: "%CONFIG_TEMPLATE%"
  )
  exit /b 1
)

rem Start backend API
start "pdf-merge-api" java -jar "%BACKEND_DIR%\pdf-merge-api.jar" ^
  --spring.profiles.active=prod ^
  --spring.config.additional-location="file:%CONFIG_FILE%"

rem Start worker (use worker profile)
start "pdf-merge-worker" java -jar "%BACKEND_DIR%\pdf-merge-worker.jar" ^
  --spring.profiles.active=worker ^
  --spring.config.additional-location="file:%CONFIG_FILE%"

rem Start frontend
if not exist "%FRONTEND_DIR%\server.js" (
  echo ERROR: frontend server.js not found in "%FRONTEND_DIR%"
  exit /b 1
)
start "pdf-merge-web" cmd /c "cd /d ""%FRONTEND_DIR%"" ^& set NEXT_PUBLIC_MERGE_API_BASE=%NEXT_PUBLIC_MERGE_API_BASE% ^& node server.js"

echo Done (started processes).
exit /b 0

