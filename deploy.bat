@echo off
chcp 65001 >nul
title NoteEditor - One-Click Git & Cloud Deployment Script
color 0A

echo ==============================================================================
echo       🚀 NoteEditor Web - One-Click Git & Deployment Automation
echo ==============================================================================
echo.

:: 1. Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Git is not installed or not in PATH!
    echo Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

:: 2. Check remote repository
echo [1/5] Checking Git Remote Repository...
git remote -v
echo.

:: 3. Safety Check: Ensure .env is NOT staged
echo [2/5] Running Security Check (Ensuring .env is protected)...
git status --porcelain | findstr /I "\.env$" >nul 2>&1
if %errorlevel% equ 0 (
    color 0C
    echo [SECURITY ALERT] .env was detected in staged files!
    echo Removing .env from git cache for security...
    git rm --cached .env >nul 2>&1
    echo Protected!
) else (
    echo [OK] Secrets and .env are securely ignored by .gitignore.
)
echo.

:: 4. Ask user for custom commit message (or use default)
echo [3/5] Preparing Commit...
set /p COMMIT_MSG="Enter commit message (Press Enter for default): "
if "%COMMIT_MSG%"=="" (
    set COMMIT_MSG=feat: update NoteEditor v2.4.2 templates, express security framework and deployment configs
)

echo.
echo Staging all changes...
git add .

echo Committing changes...
git commit -m "%COMMIT_MSG%"
if %errorlevel% neq 0 (
    echo [INFO] No new changes to commit or commit already up to date.
)
echo.

:: 5. Push to GitHub
echo [4/5] Pushing to GitHub (origin main)...
echo This may take a few moments to upload release binaries...
git push origin main

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo ==============================================================================
    echo [ERROR] Push failed! Please check your internet connection or Git permissions.
    echo ==============================================================================
    pause
    exit /b 1
)

echo.
echo ==============================================================================
echo [SUCCESS] 🌟 Code & Release Templates Pushed to GitHub Successfully!
echo ==============================================================================
echo.
echo Your GitHub Repository:
echo https://github.com/LyTyty-6666/NoteEditor
echo.
echo Your Vercel Project Dashboard:
echo https://vercel.com/crosser/noteeditor
echo.
echo ==============================================================================
echo            🚀 DEPLOY TO VERCEL (crosser/noteeditor)
echo ==============================================================================
echo.
echo [1] Open Vercel Project Dashboard in Browser (https://vercel.com/crosser/noteeditor)
echo [2] Deploy directly via Vercel CLI in this terminal (npx vercel --prod)
echo [3] Exit
echo.
set /p DEPLOY_CHOICE="Select an option [1, 2, or 3] (Default: 1): "
if "%DEPLOY_CHOICE%"=="" set DEPLOY_CHOICE=1

if "%DEPLOY_CHOICE%"=="1" (
    echo Opening Vercel Project Dashboard...
    start https://vercel.com/crosser/noteeditor
)
if "%DEPLOY_CHOICE%"=="2" (
    echo.
    echo Running Vercel 