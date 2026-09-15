@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Deploy Website - TRB Training Center
color 0A

echo ============================================================
echo    DEPLOY WEBSITE   ^|   build + check + push to GitHub
echo ============================================================
echo.

REM ---------- 1) Node.js ----------
where node >nul 2>nul
if errorlevel 1 goto :no_node
for /f "tokens=*" %%v in ('node --version') do set "NODEV=%%v"
echo [OK] Node.js found: %NODEV%
goto :check_git

:no_node
echo [ERROR] Node.js is not installed.
echo         Download the LTS version from:  https://nodejs.org
echo.
pause
exit /b 1

REM ---------- 2) Git ----------
:check_git
where git >nul 2>nul
if errorlevel 1 goto :no_git
for /f "tokens=*" %%v in ('git --version') do set "GITV=%%v"
echo [OK] %GITV%
echo.
goto :check_repo

:no_git
echo [ERROR] Git is not installed.
echo         Download it from:  https://git-scm.com/download/win
echo.
pause
exit /b 1

REM ---------- 3) Repository + remote ----------
:check_repo
if exist ".git" goto :repo_ok
echo [SETUP] Initializing a Git repository in this folder...
git init
git branch -M main
:repo_ok

git remote get-url origin >nul 2>nul
if not errorlevel 1 goto :remote_ok
echo [SETUP] Adding remote 'origin'...
git remote add origin https://github.com/mohameddeldawly-code/trb-training-center.git
:remote_ok
for /f "tokens=*" %%r in ('git remote get-url origin') do set "ORIGIN=%%r"
echo [OK] Remote: %ORIGIN%
echo.

REM ---------- 4) Git identity ----------
set "GN="
for /f "tokens=*" %%i in ('git config user.name 2^>nul') do set "GN=%%i"
if not "%GN%"=="" goto :have_name
set /p "GN=Your name for Git commits: "
git config user.name "%GN%"
:have_name

set "GE="
for /f "tokens=*" %%i in ('git config user.email 2^>nul') do set "GE=%%i"
if not "%GE%"=="" goto :have_mail
set /p "GE=Your email for Git commits: "
git config user.email "%GE%"
:have_mail
echo [OK] Commit identity: %GN% ^<%GE%^>
echo.

REM ---------- 5) Dependencies ----------
REM  A folder alone is not proof the install is healthy: an interrupted
REM  npm install leaves node_modules in place but broken. We probe for a
REM  file that must exist in a complete install, and reinstall if missing.
if not exist "node_modules" goto :deps_install
if not exist "node_modules\typescript\lib\lib.dom.d.ts" goto :deps_repair
if not exist "node_modules\pdfjs-dist\build\pdf.worker.min.mjs" goto :deps_repair
if not exist "node_modules\vite\package.json" goto :deps_repair
goto :deps_ok

:deps_repair
echo [WARN] The installed packages look incomplete. Reinstalling from scratch...
rmdir /s /q node_modules 2>nul

:deps_install
echo [STEP] Installing dependencies (npm ci) - this may take a few minutes...
call npm ci
if errorlevel 1 goto :deps_failed
:deps_ok
echo [OK] Dependencies ready.
echo.
goto :typecheck

:deps_failed
echo.
echo [ERROR] npm ci failed. Check your internet connection and try again.
echo.
pause
exit /b 1

REM ---------- 6) Type check ----------
:typecheck
echo [STEP] Type checking (npm run typecheck)...
call npm run typecheck
if errorlevel 1 goto :type_failed
echo [OK] No type errors.
echo.
goto :build

:type_failed
echo.
echo [STOPPED] There is a code error. Nothing was published.
echo           Read the messages above, fix the file, then run again.
echo.
pause
exit /b 1

REM ---------- 7) Build ----------
:build
echo [STEP] Building the site (npm run build)...
call npm run build
if errorlevel 1 goto :build_failed
echo [OK] Build succeeded.
echo.
goto :stage

:build_failed
echo.
echo [STOPPED] The build failed. Nothing was published.
echo           Read the messages above, fix the problem, then run again.
echo.
pause
exit /b 1

REM ---------- 8) Stage changes ----------
:stage
git add -A
git rev-parse --verify HEAD >nul 2>nul
if errorlevel 1 goto :ask_message
git diff --cached --quiet
if errorlevel 1 goto :ask_message
echo [INFO] No updates to publish - everything is already up to date.
echo.
pause
exit /b 0

REM ---------- 9) Commit ----------
:ask_message
set "NOW="
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd HH:mm'"`) do set "NOW=%%i"
echo.
set "MSG="
set /p "MSG=Commit message (press Enter for the default): "
if not "%MSG%"=="" goto :do_commit
set "MSG=تحديث الموقع — %NOW%"
:do_commit
git commit -m "%MSG%"
if errorlevel 1 goto :commit_failed
echo [OK] Commit created: %MSG%
echo.
goto :pull

:commit_failed
echo.
echo [ERROR] Could not create the commit. See the message above.
echo.
pause
exit /b 1

REM ---------- 10) Pull (rebase) ----------
:pull
echo [STEP] Syncing with GitHub (git pull --rebase origin main)...
git pull --rebase origin main
if errorlevel 1 goto :pull_failed
echo [OK] In sync with the remote branch.
echo.
goto :push

:pull_failed
echo.
echo [STOPPED] Merge conflict with the version on GitHub. NOTHING was pushed.
echo.
echo   What to do:
echo     1^) Open a terminal here and run:   git status
echo     2^) Fix the conflicting files marked in the list.
echo     3^) Then run:   git add -A  ^&^&  git rebase --continue
echo     4^) Run this file again.
echo   To cancel and return to the previous state:   git rebase --abort
echo.
pause
exit /b 1

REM ---------- 11) Push ----------
:push
echo [STEP] Publishing (git push origin main)...
git push origin main
if errorlevel 1 goto :push_failed
echo.
echo ============================================================
echo  [DONE] Update pushed successfully.
echo.
echo  Deployment progress (GitHub Actions):
echo    https://github.com/mohameddeldawly-code/trb-training-center/actions
echo.
echo  Live site (ready in about 1-3 minutes):
echo    https://mohameddeldawly-code.github.io/trb-training-center/
echo ============================================================
echo.
pause
exit /b 0

:push_failed
echo.
echo [ERROR] The push failed.
echo   Common causes:
echo     - No internet connection.
echo     - GitHub asked for a login and it was cancelled.
echo     - You do not have write access to the repository.
echo   Your work is safely committed locally; just run this file again.
echo.
pause
exit /b 1
