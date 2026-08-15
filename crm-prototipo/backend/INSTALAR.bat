@echo off
chcp 65001 >nul
cd /d "%~dp0"
title L'Organi Flow - Instalacao
echo.
echo  ==============================================
echo   L'ORGANI FLOW - INSTALACAO AUTOMATICA
echo  ==============================================
echo.

REM ---- 1. Node.js ----
where node >nul 2>nul
if errorlevel 1 (
  echo  [ERRO] O Node.js nao esta instalado.
  echo  Baixe em: https://nodejs.org  ^(botao LTS^), instale e rode este arquivo de novo.
  echo.
  pause
  exit /b 1
)
echo  [OK] Node.js encontrado.

REM ---- 2. localizar o MariaDB ----
set "MYSQL=mysql"
where mysql >nul 2>nul
if errorlevel 1 (
  for /d %%i in ("C:\Program Files\MariaDB*") do set "MYSQL=%%i\bin\mysql.exe"
)
if not exist "%MYSQL%" if "%MYSQL%" neq "mysql" (
  echo  [ERRO] Nao encontrei o MariaDB. Ele esta instalado e o servico esta iniciado?
  pause
  exit /b 1
)
echo  [OK] MariaDB encontrado.
echo.

REM ---- 3. senha do banco ----
set /p DBSENHA= Digite a senha do usuario root do MariaDB e aperte Enter:

REM ---- 4. criar o banco ----
echo.
echo  Criando o banco de dados lorgani_flow...
"%MYSQL%" -u root -p%DBSENHA% < schema.sql
if errorlevel 1 (
  echo.
  echo  [ERRO] Nao consegui criar o banco. A senha esta certa? O servico MariaDB esta rodando?
  echo  ^(Servicos do Windows -^> MariaDB -^> Iniciar^)
  pause
  exit /b 1
)
echo  [OK] Banco criado.

REM ---- 5. dependencias ----
echo.
echo  Instalando dependencias ^(pode levar 1-2 minutos^)...
call npm install --silent
if errorlevel 1 ( echo  [ERRO] npm install falhou. Tem internet? & pause & exit /b 1 )
echo  [OK] Dependencias instaladas.

REM ---- 6. usuarios iniciais ----
set DB_SENHA=%DBSENHA%
node seed.js
if errorlevel 1 ( echo  [ERRO] seed falhou. & pause & exit /b 1 )

REM ---- 7. guardar configuracao para o INICIAR.bat ----
> config.bat echo @set DB_SENHA=%DBSENHA%
echo.
echo  ==============================================
echo   TUDO PRONTO!
echo   Login inicial: admin@lorgani.com.br
echo   Senha inicial: Lorgani@2026
echo   No dia a dia, use o INICIAR.bat
echo  ==============================================
echo.
echo  Iniciando o sistema agora... ^(deixe esta janela aberta^)
echo  Abra no navegador: http://localhost:3000
echo.
node server.js
pause
