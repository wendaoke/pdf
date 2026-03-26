@echo off
call "%~dp0build-deploy4.bat" %*
exit /b %errorlevel%
setlocal EnableExtensions EnableDelayedExpansion

rem =========================================================
rem build | package | deploy
rem Default: package
rem =========================================================
set MODE=package
if not "%~1"=="" set MODE=%~1

set REPO_ROOT=%~dp0..
set BACKEND_DIR=%REPO_ROOT%\backend\pdf-merge
set FRONTEND_DIR=%REPO_ROOT%\frontend\pdf-merge-web
set DIST_DIR=%REPO_ROOT%\dist\pdf-merge-deploy

echo Mode (bat): %MODE%
echo Repo root: %REPO_ROOT%
echo Dist: %DIST_DIR%

if /i "%MODE%"=="build" goto doBuild
if /i "%MODE%"=="package" goto doPackage
if /i "%MODE%"=="deploy" goto doDeploy

echo Invalid MODE: %MODE%
echo Usage: build-deploy.bat [build^|package^|deploy]
exit /b 1

:doBuild

:doBuild
echo [1/2] Build backend (skip tests)...
pushd "%BACKEND_DIR%"
mvn -q clean package -DskipTests
popd

echo [2/2] Build frontend (npm install + build)...
pushd "%FRONTEND_DIR%"
npm install
npm run build
popd
exit /b 0

:doPackage

:doPackage
call :doBuild

echo [3/3] Package deploy artifacts...
if exist "%DIST_DIR%" rmdir /s /q "%DIST_DIR%"
mkdir "%DIST_DIR%"
mkdir "%DIST_DIR%\backend"
mkdir "%DIST_DIR%\frontend"

rem Copy backend jars (pick newest matching jar file)
for /f "delims=" %%f in ('dir /b /o-d "%BACKEND_DIR%\pdf-merge-api\target\*.jar"') do (
  copy /y "%BACKEND_DIR%\pdf-merge-api\target\%%f" "%DIST_DIR%\backend\pdf-merge-api.jar" >nul
  goto :apiJarCopied
)
:apiJarCopied
for /f "delims=" %%f in ('dir /b /o-d "%BACKEND_DIR%\pdf-merge-worker\target\*.jar"') do (
  copy /y "%BACKEND_DIR%\pdf-merge-worker\target\%%f" "%DIST_DIR%\backend\pdf-merge-worker.jar" >nul
  goto :workerJarCopied
)
:workerJarCopied

rem Copy frontend standalone output
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

call :writeDeployHint
echo Done.
exit /b 0

:doDeploy

:doDeploy
call :doPackage

echo Starting backend...
start "pdf-merge-api" java -jar "%DIST_DIR%\backend\pdf-merge-api.jar"
start "pdf-merge-worker" java -jar "%DIST_DIR%\backend\pdf-merge-worker.jar" --spring.profiles.active=worker

echo Starting frontend...
start "pdf-merge-web" cmd /c "cd /d ""%DIST_DIR%\frontend"" ^& set NEXT_PUBLIC_MERGE_API_BASE=http://localhost:8080/api/v1/pdf/merge ^& node server.js"

echo Done (processes started).
exit /b 0

:writeDeployHint

:writeDeployHint
(
  echo Deploy hint:
  echo.
  echo 1) Start backend (MySQL and Redis must be available):
  echo    cd /d "%DIST_DIR%\backend"
  echo    start /b java -jar "pdf-merge-api.jar"
  echo    start /b java -jar "pdf-merge-worker.jar" --spring.profiles.active=worker
  echo.
  echo 2) Start frontend:
  echo    cd /d "%DIST_DIR%\frontend"
  echo    set NEXT_PUBLIC_MERGE_API_BASE=http://localhost:8080/api/v1/pdf/merge
  echo    node server.js
  echo.
  echo Notes:
  echo - Next.js standalone default port is 3000 (unless overridden).
  echo - backend default storage.root-dir is /data/pdf-merge; ensure it is writable in your runtime.
)> "%DIST_DIR%\DEPLOY_HINT.txt"
exit /b 0

