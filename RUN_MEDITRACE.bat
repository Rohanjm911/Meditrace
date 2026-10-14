@echo off
setlocal enabledelayedexpansion

:: ====================================================================
::   MediTrace Windows Native Launcher (Non-Docker Demo/Dev Runner)
::   "Every Batch. Every Journey. Verified."
:: ====================================================================

title MediTrace Launcher

:: 1. Navigate reliably to project root
cd /d "%~dp0"
echo [MediTrace] Working Directory: %CD%

:: 2. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js v20+ or v24+ from https://nodejs.org
    pause
    exit /b 1
)

:: 3. Check npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not found in PATH!
    pause
    exit /b 1
)

echo [MediTrace] Node.js and npm verified.

:: 4. Verify node_modules
if not exist "node_modules\" (
    echo [MediTrace] Project dependencies not detected. Running initial 'npm install'...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install encountered an error. Please inspect the log.
        pause
        exit /b 1
    )
)

:: 5. Ensure .env exists
if not exist ".env" (
    if exist ".env.example" (
        echo [MediTrace] Initializing .env configuration from .env.example...
        copy /y ".env.example" ".env" >nul
    ) else (
        echo [ERROR] Missing .env and .env.example configuration files!
        pause
        exit /b 1
    )
)

:: 6. Run Database Setup (starts dedicated local PostgreSQL on port 5433 if needed and applies Prisma schema)
echo [MediTrace] Checking database services and applying schema migrations...
call node scripts/db-setup.js
if %errorlevel% neq 0 (
    echo [ERROR] Database setup failed. Ensure PostgreSQL 18 is installed in 'C:\Program Files\PostgreSQL\18'.
    pause
    exit /b 1
)

:: 7. Check if Database has seed data; if empty, run seed
echo [MediTrace] Checking database status...
call node -e "import('./scripts/db-seed-check.js').catch(()=>{})" >nul 2>nul

echo ====================================================================
echo   MediTrace Services Starting Up:
echo    - Core API:            http://localhost:4000
echo    - API Documentation:   http://localhost:4000/api/docs
echo    - IoT Simulator:       http://localhost:4001
echo    - Desktop Application: http://localhost:5173
echo    - Consortium Mode:     DEMO_INTEGRITY (Native Windows Non-Docker)
echo ====================================================================
echo Press Ctrl+C in this terminal window to stop all services.
echo ====================================================================

:: 8. Launch unified development environment
call node scripts/start-all.js

pause
