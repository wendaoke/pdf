@echo off
setlocal EnableExtensions

rem =========================================================
rem Same arguments as start-prod.bat:
rem   restart-prod.bat [CONFIG_YML_PATH] [NEXT_PUBLIC_MERGE_API_BASE]
rem =========================================================

call "%~dp0stop-prod.bat"
timeout /t 2 /nobreak >nul
call "%~dp0start-prod.bat" %*
exit /b %errorlevel%
