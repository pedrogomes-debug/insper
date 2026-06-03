@echo off
echo Parando servidor da carteira...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
  echo Encerrando PID %%a
  taskkill /F /PID %%a >nul 2>&1
)
echo Pronto.
timeout /t 2 >nul
