@echo off
setlocal EnableExtensions

rem One-shot local dev: backend (2 Maven windows) then Next.js in this window.
rem Usage: scripts\start-local-dev.bat [optional path to external application.yml]

call "%~dp0start-local-dev-backend.bat" %~1
if errorlevel 1 exit /b 1

echo.
echo Waiting 8 seconds before starting the frontend...
echo (Ctrl+C here stops only this window; Maven windows keep running.)
timeout /t 8 /nobreak >nul

call "%~dp0start-local-dev-frontend.bat"
exit /b %errorlevel%
