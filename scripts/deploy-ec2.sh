#!/bin/bash

# =============================================================================
# Deploy Code Execution Service to EC2
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration - Update these values
EC2_HOST=""  # Your EC2 public IP or hostname
EC2_USER="ubuntu"
EC2_KEY=""   # Path to your .pem file
APP_DIR="/var/www/code-execution"
LOCAL_DIR="code-execution-service"

# Check if required variables are set
if [ -z "$EC2_HOST" ]; then
    echo -e "${RED}Error: EC2_HOST is not set${NC}"
    echo "Usage: Edit this script and set EC2_HOST, EC2_KEY variables"
    exit 1
fi

if [ -z "$EC2_KEY" ]; then
    echo -e "${RED}Error: EC2_KEY is not set${NC}"
    exit 1
fi

echo "=============================================="
echo "Deploying Code Execution Service to EC2"
echo "=============================================="
echo "Host: $EC2_HOST"
echo "Directory: $APP_DIR"
echo ""

# =============================================================================
# Build locally first
# =============================================================================
echo -e "${YELLOW}Building TypeScript...${NC}"
cd $LOCAL_DIR
npm install
npm run build
cd ..

# =============================================================================
# Sync files to EC2
# =============================================================================
echo -e "${YELLOW}Syncing files to EC2...${NC}"

# Create deployment archive (excluding node_modules)
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude 'tmp/*' \
    -e "ssh -i $EC2_KEY" \
    $LOCAL_DIR/ \
    $EC2_USER@$EC2_HOST:$APP_DIR/

# =============================================================================
# Run deployment commands on EC2
# =============================================================================
echo -e "${YELLOW}Running deployment commands on EC2...${NC}"

ssh -i $EC2_KEY $EC2_USER@$EC2_HOST << 'ENDSSH'
    cd /var/www/code-execution
    
    # Install dependencies
    echo "Installing dependencies..."
    npm install --production
    
    # Generate Prisma client
    echo "Generating Prisma client..."
    npx prisma generate
    
    # Run migrations
    echo "Running database migrations..."
    npx prisma migrate deploy
    
    # Build Docker sandbox image if needed
    if ! docker images | grep -q "code-execution-sandbox"; then
        echo "Building Docker sandbox image..."
        docker build -t code-execution-sandbox:latest -f Dockerfile.sandbox .
    fi
    
    # Restart application with PM2
    echo "Restarting application..."
    pm2 restart ecosystem.config.cjs || pm2 start ecosystem.config.cjs
    pm2 save
    
    echo "Deployment complete!"
ENDSSH

echo ""
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
echo "Verify the service is running:"
echo "  ssh -i $EC2_KEY $EC2_USER@$EC2_HOST 'pm2 status'"
echo "  curl http://$EC2_HOST:3002/health"
