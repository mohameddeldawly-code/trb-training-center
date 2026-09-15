@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Attendance Sync - TRB Training Center
color 0B

echo ============================================================
echo    ATTENDANCE SYNC   ^|   SchoolSystem  --^>  Platform
echo ============================================================
echo.

REM ---------- 1) Node.js check ----------
where node >nul 2>nul
if errorlevel 1 goto :no_node
goto :node_ok

:no_node
echo [ERROR] Node.js is not installed on this computer.
echo         Download the LTS version from:  https://nodejs.org
echo         Install it, then run this file again.
echo.
pause
exit /b 1

:node_ok
for /f "tokens=*" %%v in ('node --version') do set "NODEV=%%v"
echo [OK] Node.js found: %NODEV%
echo.

REM ---------- 2) Credentials file ----------
if exist "tools\.env.sync" goto :env_ok

echo [SETUP] First run - the secret key is needed.
echo.
echo   Where to get it (Supabase dashboard):
echo     Project Settings  ^>  API Keys  ^>  Secret keys  ^>  default
echo     Reveal it, then copy it.
echo     (older projects: Project Settings ^> API ^> service_role)
echo.
echo   IMPORTANT: this key is SECRET. It is saved only in
echo   tools\.env.sync on this computer, is ignored by Git,
echo   and must NEVER be placed inside any file under src\.
echo.

set "SB_URL="
if exist ".env" for /f "usebackq tokens=1,* delims==" %%A in (`findstr /b "VITE_SUPABASE_URL" ".env"`) do set "SB_URL=%%B"
if not "%SB_URL%"=="" goto :url_ok
set /p "SB_URL=Supabase project URL (https://xxxx.supabase.co): "
:url_ok
echo   Project URL: %SB_URL%
echo.

set "SB_KEY="
:ask_key
set /p "SB_KEY=Paste the SECRET key here (starts with sb_secret_): "
if "%SB_KEY%"=="" goto :no_key

REM  The publishable key is the one most people copy by mistake. It cannot
REM  write to the database, and the failure it causes later is cryptic
REM  ("row-level security policy"), so we reject it right here.
echo %SB_KEY% | findstr /b /c:"sb_publishable_" >nul
if errorlevel 1 goto :key_ok
echo.
echo   [WRONG KEY] That is the PUBLISHABLE key - it cannot write data.
echo               You need the SECRET key from the same page:
echo               Project Settings ^> API Keys ^> Secret keys ^> default
echo               Reveal it, copy it, and paste it here.
echo.
set "SB_KEY="
goto :ask_key
:key_ok

REM  The dashboard shows the key truncated (sb_secret_iYoP...). Selecting that
REM  text with the mouse yields a short, useless key and the server then
REM  answers only "Invalid API key". Catch it here instead.
set "KEYLEN=0"
for /f %%L in ('cmd /c echo %SB_KEY%^| find /v /c ""') do rem
echo %SB_KEY%> "%TEMP%\trb_key.tmp"
for %%F in ("%TEMP%\trb_key.tmp") do set /a KEYLEN=%%~zF-2
del "%TEMP%\trb_key.tmp" >nul 2>nul
if %KEYLEN% GEQ 30 goto :len_ok
echo.
echo   [KEY TOO SHORT] Only %KEYLEN% characters - the real key is 40+.
echo                   You copied the shortened text shown on screen.
echo                   Use the COPY ICON next to the key instead of
echo                   selecting the text with the mouse.
echo.
set "SB_KEY="
goto :ask_key
:len_ok

if not exist "tools" mkdir "tools"
>"tools\.env.sync" echo # Secret file - do NOT upload to GitHub
>>"tools\.env.sync" echo SUPABASE_URL=%SB_URL%
>>"tools\.env.sync" echo SUPABASE_SERVICE_KEY=%SB_KEY%
echo.
echo [OK] Saved to tools\.env.sync
echo.
goto :env_ok

:no_key
echo.
echo [ERROR] No key entered. Nothing was saved.
echo.
pause
exit /b 1

:env_ok

REM ---------- 3) Run the sync ----------
echo ------------------------------------------------------------
echo  Running sync...  (arguments: %*)
echo ------------------------------------------------------------
echo.
node "tools\sync-attendance.mjs" %*
set "RC=%ERRORLEVEL%"
echo.
echo ------------------------------------------------------------
if "%RC%"=="0" goto :done_ok
echo  [FAILED] The sync stopped with errors. Read the report above
echo           and the detailed log inside  tools\logs\
echo.
pause
exit /b 1

:done_ok
echo  [DONE] Sync finished successfully.
echo         Detailed log saved in  tools\logs\
echo.
echo  Tip: run   %~nx0 --dry-run   to preview without writing.
echo.
pause
exit /b 0
