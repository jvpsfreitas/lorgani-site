@echo off
chcp 65001 >nul
cd /d "%~dp0"
title L'Organi Flow - Acesso externo (link temporario)
if not exist cloudflared.exe (
  echo.
  echo  [FALTA 1 PASSO] Baixe o cloudflared.exe ^(Windows 64-bit^) em:
  echo  https://github.com/cloudflare/cloudflared/releases/latest
  echo  e coloque o arquivo NESTA pasta. Depois rode este .bat de novo.
  echo.
  pause
  exit /b 1
)
echo.
echo  Gerando link publico temporario... o endereco https://....trycloudflare.com
echo  vai aparecer abaixo. Compartilhe-o. O link funciona enquanto esta janela
echo  estiver aberta e o INICIAR.bat estiver rodando.
echo.
cloudflared.exe tunnel --url http://localhost:3000
pause
