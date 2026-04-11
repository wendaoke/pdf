@echo off
setlocal EnableExtensions

rem Local frontend: Next.js dev server (default port 3000).
rem Requires Node 18+. Runs npm install if node_modules is missing.
rem API base URL: see frontend\pdf-merge-web\.env.development
rem Change port: set FRONTEND_PORT=3001 before running this script.

set "WEB=%~dp0..\frontend\pdf-merge-web"
for %%I in ("%WEB%") do set "WEB=%%~fI"

if not exist "%WEB%\package.json" (
  echo ERROR: frontend not found: "%WEB%"
  exit /b 1
)

cd /d "%WEB%"
if not exist "node_modules\" (
  echo Running npm install ...
  call npm install
  if errorlevel 1 exit /b 1
)

if "%FRONTEND_PORT%"=="" set "FRONTEND_PORT=3000"
set "PORT=%FRONTEND_PORT%"

echo Frontend directory: %CD%
echo Browser: http://127.0.0.1:%PORT%/   Press Ctrl+C to stop.
call npm run dev
exit /b %errorlevel%
