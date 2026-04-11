@echo off
setlocal EnableExtensions

rem Local backend: Maven runs pdf-merge-api :8080 and pdf-merge-worker.
rem Requires JDK 21, Maven, MySQL and Redis per application.yml.
rem Usage: scripts\start-local-dev-backend.bat [optional absolute path to application.yml]
rem Opens two cmd windows; close a window to stop that process.

set "REPO=%~dp0.."
for %%I in ("%REPO%") do set "REPO=%%~fI"
set "BACKEND=%REPO%\backend\pdf-merge"

if not exist "%BACKEND%\pdf-merge-api\pom.xml" (
  echo ERROR: backend not found: "%BACKEND%"
  exit /b 1
)

if not "%~1"=="" (
  for %%I in ("%~1") do set "SPRING_CONFIG_ADDITIONAL_LOCATION=file:%%~fI"
  echo SPRING_CONFIG_ADDITIONAL_LOCATION=%SPRING_CONFIG_ADDITIONAL_LOCATION%
)

cd /d "%BACKEND%"
echo Working directory: %CD%
echo Starting pdf-merge-api at http://127.0.0.1:8080 ...
start "pdf-merge-api (local)" cmd /k "mvn -pl pdf-merge-api -am spring-boot:run"

timeout /t 5 /nobreak >nul

echo Starting pdf-merge-worker ...
start "pdf-merge-worker (local)" cmd /k "mvn -pl pdf-merge-worker -am spring-boot:run -Dspring-boot.run.profiles=worker"

echo.
echo API and Worker started in new windows. Ensure MySQL and Redis are up before using the web app.
exit /b 0
