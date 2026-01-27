#!/bin/bash

# =============================================================================
# EC2 Initial Setup Script for CBG Platform
# Ubuntu 22.04 LTS - Code Execution Service + PostgreSQL
# =============================================================================

set -e

echo "=============================================="
echo "CBG Platform - EC2 Setup Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_USER="cbg"
APP_DIR="/var/www/code-execution"
DB_NAME="cbg_production"
DB_USER="cbg_user"

# Generate a random password for PostgreSQL
DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)

echo -e "${YELLOW}Updating system packages...${NC}"
sudo apt-get update && sudo apt-get upgrade -y

# =============================================================================
# Install Node.js 18.x
# =============================================================================
echo -e "${YELLOW}Installing Node.js 18.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

# =============================================================================
# Install Docker
# =============================================================================
echo -e "${YELLOW}Installing Docker...${NC}"
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Start Docker and enable on boot
sudo systemctl start docker
sudo systemctl enable docker

# Verify Docker
docker --version

# =============================================================================
# Install PostgreSQL 14
# =============================================================================
echo -e "${YELLOW}Installing PostgreSQL 14...${NC}"
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
echo -e "${YELLOW}Configuring PostgreSQL...${NC}"
sudo -u postgres psql << EOF
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\q
EOF

# Configure PostgreSQL for local connections only
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/14/main/postgresql.conf

# Restart PostgreSQL
sudo systemctl restart postgresql

echo -e "${GREEN}PostgreSQL configured successfully!${NC}"
echo -e "Database: ${DB_NAME}"
echo -e "User: ${DB_USER}"
echo -e "Password: ${DB_PASSWORD}"
echo ""
echo -e "${RED}IMPORTANT: Save this password securely!${NC}"

# =============================================================================
# Install PM2
# =============================================================================
echo -e "${YELLOW}Installing PM2...${NC}"
sudo npm install -g pm2

# =============================================================================
# Create application user and directories
# =============================================================================
echo -e "${YELLOW}Creating application user and directories...${NC}"

# Create app user if not exists
if ! id "$APP_USER" &>/dev/null; then
    sudo useradd -m -s /bin/bash $APP_USER
fi

# Add app user to docker group
sudo usermod -aG docker $APP_USER

# Create application directory
sudo mkdir -p $APP_DIR
sudo mkdir -p $APP_DIR/tmp
sudo chown -R $APP_USER:$APP_USER $APP_DIR

# =============================================================================
# Configure Swap (optional but recommended for t3.small)
# =============================================================================
echo -e "${YELLOW}Configuring swap space...${NC}"
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# =============================================================================
# Configure System Limits
# =============================================================================
echo -e "${YELLOW}Configuring system limits...${NC}"

# Increase file descriptor limits
cat << 'EOF' | sudo tee -a /etc/security/limits.conf
* soft nofile 65536
* hard nofile 65536
EOF

# =============================================================================
# Create Environment File Template
# =============================================================================
echo -e "${YELLOW}Creating environment file template...${NC}"
cat << EOF | sudo tee $APP_DIR/.env
# Environment
NODE_ENV=production
PORT=3002

# Database
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"

# Allowed Origins (Update with your API Gateway URL)
API_GATEWAY_URL="https://your-api-id.execute-api.us-east-1.amazonaws.com"

# Temporary directory
TMP_DIR="${APP_DIR}/tmp"
EOF

sudo chown $APP_USER:$APP_USER $APP_DIR/.env
sudo chmod 600 $APP_DIR/.env

# =============================================================================
# Build Docker Sandbox Image
# =============================================================================
echo -e "${YELLOW}Note: Docker sandbox image needs to be built after deployment${NC}"
echo "Run: cd $APP_DIR && docker build -t code-execution-sandbox:latest -f Dockerfile.sandbox ."

# =============================================================================
# Configure Firewall
# =============================================================================
echo -e "${YELLOW}Configuring firewall...${NC}"
sudo apt-get install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 3002/tcp  # Code execution service (from VPC only ideally)
sudo ufw --force enable

# =============================================================================
# Setup PM2 Startup
# =============================================================================
echo -e "${YELLOW}Configuring PM2 startup...${NC}"
sudo -u $APP_USER pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $APP_USER --hp /home/$APP_USER

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "=============================================="
echo -e "${GREEN}EC2 Setup Complete!${NC}"
echo "=============================================="
echo ""
echo "System Information:"
echo "  Node.js: $(node --version)"
echo "  NPM: $(npm --version)"
echo "  Docker: $(docker --version | cut -d' ' -f3 | tr -d ',')"
echo "  PostgreSQL: $(psql --version | cut -d' ' -f3)"
echo ""
echo "Database Credentials:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: ${DB_NAME}"
echo "  User: ${DB_USER}"
echo "  Password: ${DB_PASSWORD}"
echo ""
echo "DATABASE_URL:"
echo "  postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"
echo ""
echo -e "${RED}IMPORTANT: Save these credentials securely!${NC}"
echo ""
echo "Next Steps:"
echo "  1. Copy code-execution-service files to $APP_DIR"
echo "  2. Update .env file with API Gateway URL"
echo "  3. Run: cd $APP_DIR && npm install"
echo "  4. Run: npx prisma migrate deploy"
echo "  5. Run: docker build -t code-execution-sandbox:latest -f Dockerfile.sandbox ."
echo "  6. Run: pm2 start ecosystem.config.cjs"
echo "  7. Run: pm2 save"
echo ""
