# =============================================================================
#  CBG - Local Development Setup Script (PowerShell)
#  Usage: .\setup-local.ps1
#  Tip:   If execution policy blocks it, run:
#         Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
# =============================================================================

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

function Write-Step  { param($msg) Write-Host "==> $msg"     -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "[OK]  $msg"   -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "[WARN] $msg"  -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  CBG - Local Development Setup          " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# ---------------------------------------------------------------------------
# 1. Prerequisites check
# ---------------------------------------------------------------------------
Write-Step "Checking prerequisites..."

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Fail "Node.js is not installed. Install v18+ from https://nodejs.org"
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Fail "npm is not installed. It should come bundled with Node.js."
}

$nodeVersion = [int](node -e "process.stdout.write(process.version.slice(1).split('.')[0])")
if ($nodeVersion -lt 18) {
    Write-Fail "Node.js v18+ is required. Current: $(node -v)"
}

$dockerAvailable = $true
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Warn "Docker not found. Code execution will not work."
    Write-Warn "Install Docker Desktop: https://docs.docker.com/desktop/windows/"
    $dockerAvailable = $false
}

Write-Ok "Node.js $(node -v) detected"
Write-Ok "npm $(npm -v) detected"
Write-Host ""

# ---------------------------------------------------------------------------
# Helper: copy .env from .env.example
# ---------------------------------------------------------------------------
function Initialize-EnvFile {
    param(
        [string]$Dir,
        [string]$TargetName = ".env",
        [string[]]$ExtraLines = @()
    )
    $target = Join-Path $Dir $TargetName
    $example = Join-Path $Dir ".env.example"

    if (Test-Path $target) {
        Write-Ok "$Dir\$TargetName already exists."
    }
    elseif (Test-Path $example) {
        Copy-Item $example $target
        foreach ($line in $ExtraLines) { Add-Content $target $line }
        Write-Warn "$Dir\$TargetName created from .env.example - update it before starting."
    }
    else {
        Write-Warn "No .env.example in $Dir - create $TargetName manually."
    }
}

# ---------------------------------------------------------------------------
# 2. Server setup
# ---------------------------------------------------------------------------
Write-Step "Setting up server..."
Set-Location "$Root\server"
Initialize-EnvFile -Dir "$Root\server"

npm install
if ($LASTEXITCODE -ne 0) { Write-Fail "npm install failed in server/" }
Write-Ok "Server dependencies installed."

Write-Step "Generating Prisma client for server..."
npx prisma generate
Write-Ok "Server Prisma client generated."

# Run migrations if DATABASE_URL points to localhost
$serverEnv = Get-Content "$Root\server\.env" -Raw -ErrorAction SilentlyContinue
if ($serverEnv -match "localhost") {
    Write-Step "Running database migrations..."
    try {
        npx prisma migrate dev --name init 2>&1 | Out-Null
        Write-Ok "Database migrations applied."
    }
    catch {
        Write-Warn "Migration failed - ensure PostgreSQL is running and DATABASE_URL is correct."
    }
}

# ---------------------------------------------------------------------------
# 3. Client setup
# ---------------------------------------------------------------------------
Write-Host ""
Write-Step "Setting up client..."
Set-Location "$Root\client"
Initialize-EnvFile -Dir "$Root\client" -TargetName ".env.local"

npm install
if ($LASTEXITCODE -ne 0) { Write-Fail "npm install failed in client/" }
Write-Ok "Client dependencies installed."

Write-Step "Generating Prisma client for client..."
npx prisma generate
Write-Ok "Client Prisma client generated."

# ---------------------------------------------------------------------------
# 4. Code-execution-service setup
# ---------------------------------------------------------------------------
Write-Host ""
Write-Step "Setting up code-execution-service..."
Set-Location "$Root\code-execution-service"

$cesEnv = "$Root\code-execution-service\.env"
if (-not (Test-Path $cesEnv)) {
    $example = "$Root\code-execution-service\.env.example"
    if (Test-Path $example) {
        Copy-Item $example $cesEnv
        Add-Content $cesEnv "NODE_ENV=development"
        Add-Content $cesEnv "PORT=3002"
    }
    else {
        @"
NODE_ENV=development
PORT=3002
DATABASE_URL="postgresql://username:password@localhost:5432/cbg_development"
API_GATEWAY_URL="http://localhost:5000"
LAMBDA_URL="http://localhost:5000"
TMP_DIR="./tmp"
"@ | Set-Content $cesEnv
    }
    Write-Warn "code-execution-service\.env created. Update DATABASE_URL to match server\.env."
}
else {
    Write-Ok "code-execution-service\.env already exists."
}

New-Item -ItemType Directory -Path "$Root\code-execution-service\tmp" -Force | Out-Null

npm install
if ($LASTEXITCODE -ne 0) { Write-Fail "npm install failed in code-execution-service/" }
Write-Ok "Code-execution-service dependencies installed."

Write-Step "Generating Prisma client for code-execution-service..."
npx prisma generate
Write-Ok "Code-execution-service Prisma client generated."

# ---------------------------------------------------------------------------
# 5. Docker sandbox image
# ---------------------------------------------------------------------------
Write-Host ""
if ($dockerAvailable) {
    Write-Step "Building Docker sandbox image for code execution..."
    Set-Location "$Root\server"
    docker build -t code-execution-sandbox:latest -f Dockerfile.sandbox .
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Docker sandbox image built."
    }
    else {
        Write-Warn "Docker sandbox build failed. Code execution may not work."
    }
}
else {
    Write-Warn "Skipping Docker sandbox build (Docker not installed)."
}

# ---------------------------------------------------------------------------
# 6. Done - print instructions
# ---------------------------------------------------------------------------
Set-Location $Root
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  Setup complete!                        " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Before starting, make sure to configure:" -ForegroundColor Yellow
Write-Host "  1. server\.env                  - DATABASE_URL, JWT_SECRET, SMTP_* etc."
Write-Host "  2. client\.env.local            - NEXT_PUBLIC_API_URL, NEXTAUTH_SECRET etc."
Write-Host "  3. code-execution-service\.env  - DATABASE_URL (same as server)"
Write-Host ""
Write-Host "To start the application, open 3 terminals:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Terminal 1 - Backend server (port 5000)" -ForegroundColor Cyan
Write-Host "    cd server ; npm run dev"
Write-Host ""
Write-Host "  Terminal 2 - Code execution service (port 3002)" -ForegroundColor Cyan
Write-Host "    cd code-execution-service ; npm run dev"
Write-Host ""
Write-Host "  Terminal 3 - Frontend / Next.js (port 3000)" -ForegroundColor Cyan
Write-Host "    cd client ; npm run dev"
Write-Host ""
Write-Host "  Optional - Seed the database" -ForegroundColor Cyan
Write-Host "    cd server ; npm run db:seed"
Write-Host ""
Write-Host "  Optional - Open Prisma Studio" -ForegroundColor Cyan
Write-Host "    cd server ; npx prisma studio"
Write-Host ""
