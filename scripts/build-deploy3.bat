@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem =========================================================
rem build | package | deploy
rem Default: package
rem =========================================================
set "MODE=%~1"
if "%MODE%"=="" set "MODE=package"

set "REPO_ROOT=%~dp0.."
set "BACKEND_DIR=%REPO_ROOT%\backend\pdf-merge"
set "FRONTEND_DIR=%REPO_ROOT%\frontend\pdf-merge-web"
set "DIST_DIR=%REPO_ROOT%\dist\pdf-merge-deploy"

echo Mode: %MODE%
echo Repo root: %REPO_ROOT%
echo Dist: %DIST_DIR%

if /i "%MODE%"=="build" (
  echo [1/2] Build backend (skip tests)...
  cd /d "%BACKEND_DIR%"
  mvn -q clean package -DskipTests

  echo [2/2] Build frontend (npm install + build)...
  cd /d "%FRONTEND_DIR%"
  npm install
  npm run build
  exit /b 0
)

if /i "%MODE%"=="package" (
  echo [1/2] Build backend (skip tests)...
  cd /d "%BACKEND_DIR%"
  mvn -q clean package -DskipTests

  echo [2/2] Build frontend (npm install + build)...
  cd /d "%FRONTEND_DIR%"
  npm install
  npm run build

  echo [3/3] Package deploy artifacts...
  if exist "%DIST_DIR%" rmdir /s /q "%DIST_DIR%"
  mkdir "%DIST_DIR%"
  mkdir "%DIST_DIR%\backend"
  mkdir "%DIST_DIR%\frontend"

  rem Backend jars
  set "API_JAR="
  for /f "delims=" %%f in ('dir /b /o-d "%BACKEND_DIR%\pdf-merge-api\target\*.jar"') do (
    if not defined API_JAR set "API_JAR=%%f"
  )
  if not defined API_JAR (
    echo ERROR: Cannot find pdf-merge-api jar
    exit /b 1
  )
  copy /y "%BACKEND_DIR%\pdf-merge-api\target\%API_JAR%" "%DIST_DIR%\backend\pdf-merge-api.jar" >nul

  set "WORKER_JAR="
  for /f "delims=" %%f in ('dir /b /o-d "%BACKEND_DIR%\pdf-merge-worker\target\*.jar"') do (
    if not defined WORKER_JAR set "WORKER_JAR=%%f"
  )
  if not defined WORKER_JAR (
    echo ERROR: Cannot find pdf-merge-worker jar
    exit /b 1
  )
  copy /y "%BACKEND_DIR%\pdf-merge-worker\target\%WORKER_JAR%" "%DIST_DIR%\backend\pdf-merge-worker.jar" >nul

  rem Frontend standalone output
  if exist "%FRONTEND_DIR%\.next\standalone" (
    robocopy "%FRONTEND_DIR%\.next\standalone" "%DIST_DIR%\frontend" /E /NFL /NDL /NJH /NJS >nul
  )
  if exist "%FRONTEND_DIR%\.next\static" (
    if not exist "%DIST_DIR%\frontend\.next\static" mkdir "%DIST_DIR%\frontend\.next\static"
    robocopy "%FRONTEND_DIR%\.next\static" "%DIST_DIR%\frontend\.next\static" /E /NFL /NDL /NJH /NJS >nul
  )
  if exist "%FRONTEND_DIR%\public" (
    if not exist "%DIST_DIR%\frontend\public" mkdir "%DIST_DIR%\frontend\public"
    robocopy "%FRONTEND_DIR%\public" "%DIST_DIR%\frontend\public" /E /NFL /NDL /NJH /NJS >nul
  )

  echo Writing deploy hint...
  (
    echo Deploy hint:
    echo.
    echo 1) Start backend (MySQL and Redis must be available):
    echo    java -jar "backend\pdf-merge-api.jar"
    echo    java -jar "backend\pdf-merge-worker.jar" --spring.profiles.active=worker
    echo.
    echo 2) Start frontend:
    echo    set NEXT_PUBLIC_MERGE_API_BASE=http://localhost:8080/api/v1/pdf/merge
    echo    cd frontend
    echo    node server.js
    echo.
    echo Notes:
    echo - Next.js standalone default port is 3000 (unless overridden).
    echo - backend default storage.root-dir is /data/pdf-merge; ensure it is writable in your runtime.
  ) > "%DIST_DIR%\DEPLOY_HINT.txt"

  echo Done.
  exit /b 0
)

if /i "%MODE%"=="deploy" (
  call "%~dp0build-deploy3.bat" package
  if errorlevel 1 exit /b %errorlevel%

  echo Starting backend...
  start "pdf-merge-api" java -jar "%DIST_DIR%\backend\pdf-merge-api.jar"
  start "pdf-merge-worker" java -jar "%DIST_DIR%\backend\pdf-merge-worker.jar" --spring.profiles.active=worker

  echo Starting frontend...
  start "pdf-merge-web" cmd /c "cd /d ""%DIST_DIR%\frontend"" ^& set NEXT_PUBLIC_MERGE_API_BASE=http://localhost:8080/api/v1/pdf/merge ^& node server.js"

  echo Done (processes started).
  exit /b 0
)

echo Invalid MODE: %MODE%
echo Usage: build-deploy3.bat [build^|package^|deploy]
exit /b 1

