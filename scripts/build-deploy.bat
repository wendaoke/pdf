@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem =========================================================
rem build | package | deploy
rem Default: package
rem Production external yml: scripts\start-prod.bat
rem Sub-steps use call "%~f0" :label so mvn/npm do not break call :label stack.
rem =========================================================

if /i "%~1"==":bld" goto do_bld
if /i "%~1"==":pkg" goto do_pkg
if /i "%~1"==":hint" goto do_hint
goto main

:do_bld
echo [1/2] Build backend - skip tests...
cd /d "%BACKEND_DIR%"
if errorlevel 1 (
  echo ERROR: Backend dir not found: "%BACKEND_DIR%"
  exit /b 1
)
call mvn -q clean package -DskipTests
if errorlevel 1 exit /b %errorlevel%
echo [2/2] Build frontend - npm install and build...
cd /d "%FRONTEND_DIR%"
if errorlevel 1 (
  echo ERROR: Frontend dir not found: "%FRONTEND_DIR%"
  exit /b 1
)
call npm install
if errorlevel 1 exit /b %errorlevel%
call npm run build
if errorlevel 1 exit /b %errorlevel%
exit /b 0

:do_pkg
call "%~f0" :bld
if errorlevel 1 exit /b %errorlevel%
echo [3/3] Package deploy artifacts...
if exist "%DIST_DIR%" rmdir /s /q "%DIST_DIR%"
mkdir "%DIST_DIR%"
mkdir "%DIST_DIR%\backend"
mkdir "%DIST_DIR%\frontend"
set "API_JAR="
for /f "delims=" %%f in ('dir /b /o-d "%BACKEND_DIR%\pdf-merge-api\target\*.jar" 2^>nul') do (
  echo %%f | findstr /i /b "original-" >nul
  if errorlevel 1 (
    if not defined API_JAR set "API_JAR=%%f"
  )
)
if not defined API_JAR (
  echo ERROR: No pdf-merge-api jar in "%BACKEND_DIR%\pdf-merge-api\target"
  exit /b 1
)
copy /y "%BACKEND_DIR%\pdf-merge-api\target\%API_JAR%" "%DIST_DIR%\backend\pdf-merge-api.jar" >nul
set "WORKER_JAR="
for /f "delims=" %%f in ('dir /b /o-d "%BACKEND_DIR%\pdf-merge-worker\target\*.jar" 2^>nul') do (
  echo %%f | findstr /i /b "original-" >nul
  if errorlevel 1 (
    if not defined WORKER_JAR set "WORKER_JAR=%%f"
  )
)
if not defined WORKER_JAR (
  echo ERROR: No pdf-merge-worker jar in "%BACKEND_DIR%\pdf-merge-worker\target"
  exit /b 1
)
copy /y "%BACKEND_DIR%\pdf-merge-worker\target\%WORKER_JAR%" "%DIST_DIR%\backend\pdf-merge-worker.jar" >nul
if exist "%FRONTEND_DIR%\.next\standalone" (
  robocopy "%FRONTEND_DIR%\.next\standalone" "%DIST_DIR%\frontend" /E /NFL /NDL /NJH /NJS >nul
) else (
  echo ERROR: Missing "%FRONTEND_DIR%\.next\standalone"
  exit /b 1
)
if exist "%FRONTEND_DIR%\.next\static" (
  if not exist "%DIST_DIR%\frontend\.next\static" mkdir "%DIST_DIR%\frontend\.next\static"
  robocopy "%FRONTEND_DIR%\.next\static" "%DIST_DIR%\frontend\.next\static" /E /NFL /NDL /NJH /NJS >nul
)
if exist "%FRONTEND_DIR%\public" (
  if not exist "%DIST_DIR%\frontend\public" mkdir "%DIST_DIR%\frontend\public"
  robocopy "%FRONTEND_DIR%\public" "%DIST_DIR%\frontend\public" /E /NFL /NDL /NJH /NJS >nul
)
call "%~f0" :hint
exit /b 0

:do_hint
echo Deploy hint:>"%DIST_DIR%\DEPLOY_HINT.txt"
echo.>>"%DIST_DIR%\DEPLOY_HINT.txt"
echo 1^) Start backend - MySQL and Redis required:>>"%DIST_DIR%\DEPLOY_HINT.txt"
echo    cd /d "%DIST_DIR%\backend">>"%DIST_DIR%\DEPLOY_HINT.txt"
echo    start /b java -jar "pdf-merge-api.jar">>"%DIST_DIR%\DEPLOY_HINT.txt"
echo    start /b java -jar "pdf-merge-worker.jar" --spring.profiles.active=worker>>"%DIST_DIR%\DEPLOY_HINT.txt"
echo.>>"%DIST_DIR%\DEPLOY_HINT.txt"
echo 2^) Start frontend:>>"%DIST_DIR%\DEPLOY_HINT.txt"
echo    cd /d "%DIST_DIR%\frontend">>"%DIST_DIR%\DEPLOY_HINT.txt"
echo    set NEXT_PUBLIC_MERGE_API_BASE=http://localhost:8080/api/v1/pdf/merge>>"%DIST_DIR%\DEPLOY_HINT.txt"
echo    node server.js>>"%DIST_DIR%\DEPLOY_HINT.txt"
echo.>>"%DIST_DIR%\DEPLOY_HINT.txt"
echo 3^) Production - external application.yml:>>"%DIST_DIR%\DEPLOY_HINT.txt"
echo    scripts\start-prod.bat>>"%DIST_DIR%\DEPLOY_HINT.txt"
echo.>>"%DIST_DIR%\DEPLOY_HINT.txt"
echo Notes:>>"%DIST_DIR%\DEPLOY_HINT.txt"
echo - Next.js standalone default port is 3000.>>"%DIST_DIR%\DEPLOY_HINT.txt"
echo - Configure pdfmerge.storage.root-dir and DB/Redis in external yml or JVM args.>>"%DIST_DIR%\DEPLOY_HINT.txt"
exit /b 0

:main
set "MODE=%~1"
if "%MODE%"=="" set "MODE=package"

set "REPO_ROOT=%~dp0.."
set "BACKEND_DIR=%REPO_ROOT%\backend\pdf-merge"
set "FRONTEND_DIR=%REPO_ROOT%\frontend\pdf-merge-web"
set "DIST_DIR=%REPO_ROOT%\dist\pdf-merge-deploy"

echo Mode: %MODE%
echo Repo root: %REPO_ROOT%
echo Dist: %DIST_DIR%

if /i "%MODE%"=="build" goto MODE_BUILD
if /i "%MODE%"=="package" goto MODE_PACKAGE
if /i "%MODE%"=="deploy" goto MODE_DEPLOY

echo Invalid MODE: %MODE%
echo Usage: build-deploy.bat [build^|package^|deploy]
exit /b 1

:MODE_BUILD
call "%~f0" :bld
exit /b %errorlevel%

:MODE_PACKAGE
call "%~f0" :pkg
if errorlevel 1 exit /b %errorlevel%
echo Done.
exit /b 0

:MODE_DEPLOY
call "%~f0" :pkg
if errorlevel 1 exit /b %errorlevel%

echo Starting backend...
start "pdf-merge-api" java -jar "%DIST_DIR%\backend\pdf-merge-api.jar"
start "pdf-merge-worker" java -jar "%DIST_DIR%\backend\pdf-merge-worker.jar" --spring.profiles.active=worker

echo Starting frontend...
if not exist "%DIST_DIR%\frontend\server.js" (
  echo ERROR: server.js not found in "%DIST_DIR%\frontend"
  exit /b 1
)
set "PORT=3000"
set "NEXT_PUBLIC_MERGE_API_BASE=http://localhost:8080/api/v1/pdf/merge"
start "pdf-merge-web" /D "%DIST_DIR%\frontend" cmd.exe /k "node server.js"

echo Done - processes started. For production use: scripts\start-prod.bat
exit /b 0
