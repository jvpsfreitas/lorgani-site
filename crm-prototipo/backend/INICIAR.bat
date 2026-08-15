@echo off
chcp 65001 >nul
cd /d "%~dp0"
title L'Organi Flow - Servidor
if exist config.bat call config.bat
echo.
echo  L'Organi Flow ligando...
echo  Deixe esta janela aberta enquanto o sistema estiver em uso.
echo  Acesse: http://localhost:3000
echo  ^(Para desligar: feche esta janela ou aperte Ctrl+C^)
echo.
node server.js
pause
