@echo off
title Carteira de Estudante - Servidor Local
cd /d "%~dp0"
echo Iniciando servidor da carteira...
echo.
start "" "http://localhost:8000/"
node server.js
pause
