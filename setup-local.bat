@echo off
:: =============================================================================
::  CBG - Local Development Setup Script (Windows)
:: =============================================================================
setlocal EnableDelayedExpansion

set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"

echo.
echo =========================================
echo   CBG - Local Development Setup
echo =========================================
echo.

:: ---------------------------------------------------------------------------
:: 1. Prerequisites check
:: ---------------------------------------------------------------------------
echo [STEP] Checking prerequisites...

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed. Install v18+ from https://nodejs.org
    exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not installed. It should come bundled with Node.js.
    exit /b 1
)

where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [WARN] Docker is not installed. Code execution will not work.
    echo        Install Docker Desktop from https://docs.docker.com/desktop/windows/
    set "DOCKER_MISSING=1"
)

for /f "tokens=*" %%v in ('node -e "process.stdout.write(process.version)"') do set "NODE_VER=%%v"
echo [OK] Node.js %NODE_VER% detected
for /f "tokens=*" %%v in ('npm -v') do echo [OK] npm %%v detected
echo.

:: ---------------------------------------------------------------------------
:: 2. Server setup
:: ---------------------------------------------------------------------------
echo [STEP] Setting up server...
cd /d "%ROOT%\server"

if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [WARN] server\.env created from .env.example
        echo        Edit server\.env with your database credentials before starting.
    ) else (
        echo [WARN] No .env.example found. Create server\.env manually.
    )
) else (
    echo [OK] server\.env already exists.
)

call npm install
if %ERRORLEVEL% neq 0 ( echo [ERROR] npm install failed in server. & exit /b 1 )
echo [OK] Server dependencies installed.

echo [STEP] Generating Prisma client for server...
call npx prisma generate
if %ERRORLEVEL% neq 0 ( echo [WARN] Prisma generate failed for server. )
echo [OK] Server Prisma client generated.

:: ---------------------------------------------------------------------------
:: 3. Client setup
:: ---------------------------------------------------------------------------
echo.
echo [STEP] Setting up client...
cd /d "%ROOT%\client"

if not exist ".env.local" (
    if exist ".env.example" (
        copy ".env.example" ".env.local" >nul
        echo [WARN] client\.env.local created from .env.example
        echo        Edit client\.env.local if needed.
    ) else (
        echo [WARN] No .env.example found. Create client\.env.local manually.
    )
) else (
    echo [OK] client\.env.local already exists.
)

call npm install
if %ERRORLEVEL% neq 0 ( echo [ERROR] npm install failed in client. & exit /b 1 )
echo [OK] Client dependencies installed.

echo [STEP] Generating Prisma client for client...
call npx prisma generate
if %ERRORLEVEL% neq 0 ( echo [WARN] Prisma generate failed for client. )
echo [OK] Client Prisma client generated.

:: ---------------------------------------------------------------------------
:: 4. Code-execution-service setup
:: ---------------------------------------------------------------------------
echo.
echo [STEP] Setting up code-execution-service...
cd /d "%ROOT%\code-execution-service"

if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo NODE_ENV=development>> ".env"
        echo PORT=3002>> ".env"
        echo [WARN] code-execution-service\.env created. Update DATABASE_URL to match server\.env.
    ) else (
        (
            echo NODE_ENV=development
            echo PORT=3002
            echo DATABASE_URL="postgresql://username:password@localhost:5432/cbg_development"
            echo API_GATEWAY_URL="http://localhost:5000"
            echo LAMBDA_URL="http://localhost:5000"
            echo TMP_DIR="./tmp"
        ) > ".env"
        echo [WARN] Default code-execution-service\.env created. Update DATABASE_URL.
    )
) else (
    echo [OK] code-execution-service\.env already exists.
)

if not exist "tmp" mkdir tmp

call npm install
if %ERRORLEVEL% neq 0 ( echo [ERROR] npm install failed in code-execution-service. & exit /b 1 )
echo [OK] Code-execution-service dependencies installed.

echo [STEP] Generating Prisma client for code-execution-service...
call npx prisma generate
if %ERRORLEVEL% neq 0 ( echo [WARN] Prisma generate failed for code-execution-service. )
echo [OK] Code-execution-service Prisma client generated.

:: ---------------------------------------------------------------------------
:: 5. Docker sandbox image
:: ---------------------------------------------------------------------------
echo.
if not defined DOCKER_MISSING (
    echo [STEP] Building Docker sandbox image for code execution...
    cd /d "%ROOT%\server"
    docker build -t code-execution-sandbox:latest -f Dockerfile.sandbox .
    if %ERRORLEVEL% neq 0 (
        echo [WARN] Docker sandbox build failed. Code execution may not work.
    ) else (
        echo [OK] Docker sandbox image built.
    )
) else (
    echo [WARN] Skipping Docker sandbox build ^(Docker not installed^).
)

:: ---------------------------------------------------------------------------
:: 6. Done - print instructions
:: ---------------------------------------------------------------------------
echo.
echo =========================================
echo   Setup complete!
echo =========================================
echo.
echo Before starting, make sure to:
echo   1. Edit server\.env                  - DATABASE_URL, JWT_SECRET, SMTP_* etc.
echo   2. Edit client\.env.local            - NEXT_PUBLIC_API_URL, NEXTAUTH_SECRET etc.
echo   3. Edit code-execution-service\.env  - DATABASE_URL (same as server)
echo.
echo To start the application, open 3 terminals:
echo.
echo   Terminal 1 - Backend server (port 5000)
echo     cd server  ^&^&  npm run dev
echo.
echo   Terminal 2 - Code execution service (port 3002)
echo     cd code-execution-service  ^&^&  npm run dev
echo.
echo   Terminal 3 - Frontend / Next.js (port 3000)
echo     cd client  ^&^&  npm run dev
echo.
echo   Optional - Seed the database with sample data
echo     cd server  ^&^&  npm run db:seed
echo.
echo   Optional - Open Prisma Studio
echo     cd server  ^&^&  npx prisma studio
echo.

endlocal
