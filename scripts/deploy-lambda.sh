#!/bin/bash

# =============================================================================
# Deploy Lambda API to AWS
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
LAMBDA_DIR="lambda-api"
STAGE=${1:-prod}  # Default to 'prod' stage

echo "=============================================="
echo "Deploying Lambda API to AWS"
echo "Stage: $STAGE"
echo "=============================================="

# Navigate to lambda directory
cd $LAMBDA_DIR

# =============================================================================
# Install dependencies
# =============================================================================
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# =============================================================================
# Generate Prisma Client
# =============================================================================
echo -e "${YELLOW}Generating Prisma client...${NC}"
npx prisma generate

# =============================================================================
# Build TypeScript
# =============================================================================
echo -e "${YELLOW}Building TypeScript...${NC}"
npm run build

# =============================================================================
# Deploy with Serverless Framework
# =============================================================================
echo -e "${YELLOW}Deploying to AWS Lambda...${NC}"
npx serverless deploy --stage $STAGE

# =============================================================================
# Get API Gateway URL
# =============================================================================
echo ""
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
echo "Getting API endpoints..."
npx serverless info --stage $STAGE

echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update your EC2 .env file with the new API Gateway URL"
echo "2. Update your Vercel environment variables with the API URL"
echo "3. Test the endpoints:"
echo "   curl https://your-api-id.execute-api.us-east-1.amazonaws.com/health"
echo ""
