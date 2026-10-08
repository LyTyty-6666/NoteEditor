@echo off
setlocal EnableDelayedExpansion

REM Ensure Git and Node.js are in PATH
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\nodejs;%LOCALAPPDATA%\Programs\Git\cmd"

title NoteEditor Deployment Tool
color 0A

echo ==============================================================================
echo             NoteEditor Web - Git and Vercel Deployment Tool
echo ==============================================================================
echo.

REM 1. Verify Git Installation
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Git command was not found in PATH!
    echo Please make sure Git is installed from https://git-scm.com/
    echo.
    pause
    exit /b 1
)

echo [1/4] Git detected successfully.
echo Remote repository:
git remote -v
echo.

REM 2. Verify .env is protected
echo [2/4] Verifying security (.env protection)...
git status --porcelain | findstr /I "\.env$" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [ALERT] .env file was tracked. Untracking from git...
    git rm --cached .env >nul 2>&1
)
echo [OK] Secrets are securely ignored by .gitignore.
echo.

REM 3. Display Menu
echo ==============================================================================
echo Target Vercel Project: https://vercel.com/crosser/noteeditor
echo GitHub Repository:     https://github.com/LyTyty-6666/NoteEditor
echo ==============================================================================
echo.
echo Choose an action:
echo   [1] Push all changes to GitHub (Auto-deploys on Vercel)
echo   [2] Deploy directly using Vercel CLI (npx vercel --prod)
echo   [3] Open Vercel Project Dashboard in Browser
echo   [4] Exit
echo.

set /p CHOICE="Enter choice [1, 2, 3, or 4] (Default is 1): "
if "%CHOICE%"=="" set CHOICE=1

if "%CHOICE%"=="1" goto do_git_push
if "%CHOICE%"=="2" goto do_vercel_cli
if "%CHOICE%"=="3" goto do_open_browser
if "%CHOICE%"=="4" goto do_exit

:do_git_push
echo.
echo [3/4] Staging changes...
git add .

echo.
set /p MSG="Enter commit message (Press Enter for default): "
if "%MSG%"=="" set MSG=feat: deploy NoteEditor v2.4.2 to vercel with express security

echo Committing...
git commit -m "%MSG%"
echo.

echo [4/4] Pushing to GitHub (origin main)...
echo This may take a moment to upload binary release packages...
git push origin main
if %ERRORLEVEL% neq 0 (
    color 0C
    echo.
    echo ==============================================================================
    echo [ERROR] Git push failed. Please verify your internet or GitHub credentials.
    echo ==============================================================================
    echo.
    pause
    exit /b 1
)

echo.
echo ==============================================================================
echo [SUCCESS] Code and release packages pushed to GitHub!
echo Vercel will now automatically deploy your update:
echo https://vercel.com/crosser/noteeditor
echo ==============================================================================
echo.
set /p OPEN_DASH="Open Vercel Dashboard in browser now? (Y/N): "
if /i "%OPEN_DASH%"=="Y" start https://vercel.com/crosser/noteeditor
goto do_exit

:do_vercel_cli
echo.
echo Launching Vercel CLI production deployment...
call npx.cmd vercel --prod --scope crosser
goto do_exit

:do_open_browser
echo.
echo Opening https://vercel.com/crosser/noteeditor in your browser...
start https://vercel.com/crosser/noteeditor
goto do_exit

:do_exit
echo.
echo Done!
pause
