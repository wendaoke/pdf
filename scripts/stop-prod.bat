@echo off
setlocal EnableExtensions

rem =========================================================
rem Stop processes started by start-prod.bat (or same jars / frontend).
rem Matches: window titles pdf-merge-api, pdf-merge-worker, pdf-merge-web
rem          plus java command lines containing the deploy jars,
rem          plus node running this dist frontend server.js
rem =========================================================

set "DIST_DIR=%~dp0..\dist\pdf-merge-deploy"
for %%I in ("%DIST_DIR%") do set "DIST_ABS=%%~fI"
set "FE_JS=%DIST_ABS%\frontend\server.js"
set "STOP_FE_JS=%FE_JS%"

echo Stopping pdf-merge (titles + jar / node match)...

taskkill /FI "WINDOWTITLE eq pdf-merge-api*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq pdf-merge-worker*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq pdf-merge-web*" /F >nul 2>&1

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$fe = $env:STOP_FE_JS; " ^
  "Get-CimInstance Win32_Process | ForEach-Object { " ^
  "  $c = $_.CommandLine; if (-not $c) { return }; " ^
  "  if ($c -match 'pdf-merge-api\\.jar' -or $c -match 'pdf-merge-worker\\.jar') { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; return }; " ^
  "  if ($_.Name -ieq 'node.exe' -and $fe -and ($c.IndexOf($fe, [StringComparison]::OrdinalIgnoreCase) -ge 0)) { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } " ^
  "}"

echo Done.
exit /b 0
