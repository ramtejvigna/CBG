#!/usr/bin/env bash
# =============================================================================
#  CBG - Local Development Setup Script (Linux / macOS)
# =============================================================================
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

step() { echo -e "${BLUE}==>${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  CBG - Local Development Setup          ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# ---------------------------------------------------------------------------
# 1. Prerequisites check
# ---------------------------------------------------------------------------
step "Checking prerequisites..."

command -v node  >/dev/null 2>&1 || fail "Node.js is not installed. Install v18+ from https://nodejs.org"
command -v npm   >/dev/null 2>&1 || fail "npm is not installed. It should come with Node.js."
command -v docker>/dev/null 2>&1 || warn "Docker is not installed. Code execution will not work. Install from https://docs.docker.com/get-docker/"
command -v psql  >/dev/null 2>&1 || warn "psql not found. Ensure PostgreSQL is running and DATABASE_URL is set correctly."

NODE_VERSION=$(node -e "process.stdout.write(process.version.slice(1).split('.')[0])")
if [ "$NODE_VERSION" -lt 18 ]; then
  fail "Node.js v18+ is required. Current version: $(node -v)"
fi

ok "Node.js $(node -v) detected"
ok "npm $(npm -v) detected"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------------------------------------------------------------------------
# 2. Server setup
# ---------------------------------------------------------------------------
step "Setting up server..."

cd "$ROOT_DIR/server"

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    warn ".env created from .env.example. Edit server/.env with your database credentials before starting."
  else
    warn "No .env.example found in server/. Create server/.env manually."
  fi
else
  ok "server/.env already exists."
fi

npm install
ok "Server dependencies installed."

step "Generating Prisma client for server..."
npx prisma generate
ok "Server Prisma client generated."

# Run migrations only if DATABASE_URL looks like a real local DB
if grep -q "localhost" .env 2>/dev/null; then
  step "Running database migrations..."
  npx prisma migrate dev --name init 2>/dev/null || warn "Migration failed. Ensure PostgreSQL is running and DATABASE_URL in server/.env is correct."
  ok "Database migrations applied."
fi

# ---------------------------------------------------------------------------
# 3. Client setup
# ---------------------------------------------------------------------------
step "Setting up client..."

cd "$ROOT_DIR/client"

if [ ! -f .env.local ]; then
  if [ -f .env.example ]; then
    cp .env.example .env.local
    warn ".env.local created from .env.example. Edit client/.env.local if needed."
  else
    warn "No .env.example found in client/. Create client/.env.local manually."
  fi
else
  ok "client/.env.local already exists."
fi

npm install
ok "Client dependencies installed."

step "Generating Prisma client for client..."
npx prisma generate
ok "Client Prisma client generated."

# ---------------------------------------------------------------------------
# 4. Code-execution-service setup
# ---------------------------------------------------------------------------
step "Setting up code-execution-service..."

cd "$ROOT_DIR/code-execution-service"

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    # Override for local development defaults
    sed -i.bak 's|NODE_ENV=production|NODE_ENV=development|g' .env
    sed -i.bak 's|PORT=3002||g' .env
    echo "" >> .env
    echo "NODE_ENV=development" >> .env
    echo "PORT=3002" >> .env
    rm -f .env.bak
    warn ".env created from .env.example. Edit code-execution-service/.env if needed."
  else
    cat > .env <<'EOF'
NODE_ENV=development
PORT=3002
DATABASE_URL="postgresql://username:password@localhost:5432/cbg_development"
API_GATEWAY_URL="http://localhost:5000"
LAMBDA_URL="http://localhost:5000"
TMP_DIR="./tmp"
EOF
    warn "Default code-execution-service/.env created. Update DATABASE_URL to match server/.env."
  fi
else
  ok "code-execution-service/.env already exists."
fi

mkdir -p tmp
npm install
ok "Code-execution-service dependencies installed."

step "Generating Prisma client for code-execution-service..."
npx prisma generate
ok "Code-execution-service Prisma client generated."

# ---------------------------------------------------------------------------
# 5. Docker sandbox image
# ---------------------------------------------------------------------------
if command -v docker >/dev/null 2>&1; then
  step "Building Docker sandbox image for code execution..."
  cd "$ROOT_DIR/server"
  docker build -t code-execution-sandbox:latest -f Dockerfile.sandbox . && \
    ok "Docker sandbox image built." || \
    warn "Docker sandbox build failed. Code execution may not work."
else
  warn "Skipping Docker sandbox build (Docker not installed)."
fi

# ---------------------------------------------------------------------------
# 6. Done - print instructions
# ---------------------------------------------------------------------------
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  Setup complete!                        ${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${YELLOW}Before starting, make sure to:${NC}"
echo "  1. Edit ${BLUE}server/.env${NC}                 → set DATABASE_URL, JWT_SECRET, SMTP_* etc."
echo "  2. Edit ${BLUE}client/.env.local${NC}           → set NEXT_PUBLIC_API_URL, NEXTAUTH_SECRET etc."
echo "  3. Edit ${BLUE}code-execution-service/.env${NC} → set DATABASE_URL (same as server)"
echo ""
echo -e "${YELLOW}To start the application, open 3 terminals:${NC}"
echo ""
echo -e "  ${BLUE}Terminal 1 – Backend server (port 5000)${NC}"
echo "    cd server && npm run dev"
echo ""
echo -e "  ${BLUE}Terminal 2 – Code execution service (port 3002)${NC}"
echo "    cd code-execution-service && npm run dev"
echo ""
echo -e "  ${BLUE}Terminal 3 – Frontend / Next.js (port 3000)${NC}"
echo "    cd client && npm run dev"
echo ""
echo -e "  ${BLUE}Optional – Seed the database with sample data${NC}"
echo "    cd server && npm run db:seed"
echo ""
echo -e "  ${BLUE}Optional – Open Prisma Studio${NC}"
echo "    cd server && npx prisma studio"
echo ""
