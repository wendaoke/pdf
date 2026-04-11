@echo off
setlocal EnableExtensions

rem =========================================================
rem Windows：start-local-dev-backend.bat 会在两个新窗口里跑 Maven。
rem 本脚本无法可靠按 PID 结束子窗口内的 java，请手动处理。
rem Linux 后台开发请用: scripts\stop-local-dev-backend.sh
rem =========================================================

echo.
echo 若刚才是用 scripts\start-local-dev-backend.bat 启动：
echo   请到标题为 "pdf-merge-api (local)" 与 "pdf-merge-worker (local)" 的窗口里按 Ctrl+C 停止。
echo.
echo 若窗口已关但 java 仍占用 8080，可在「任务管理器」结束对应 java.exe，或：
echo   netstat -ano ^| findstr :8080
echo   taskkill /PID ^<pid^> /F
echo.
exit /b 0
