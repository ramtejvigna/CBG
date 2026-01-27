#!/bin/bash

# =============================================================================
# Full Deployment Script - Lambda + EC2
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "=============================================="
echo "CBG Platform - Full Deployment"
echo "=============================================="
echo ""

# Check AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS CLI not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi

STAGE=${1:-prod}
REGION=${AWS_REGION:-us-east-1}

echo -e "${CYAN}Stage: $STAGE${NC}"
echo -e "${CYAN}Region: $REGION${NC}"
echo ""

# =============================================================================
# Step 1: Deploy Lambda API
# =============================================================================
echo -e "${YELLOW}Step 1: Deploying Lambda API...${NC}"
./scripts/deploy-lambda.sh $STAGE

# Get the API Gateway URL
cd lambda-api
API_URL=$(npx serverless info --stage $STAGE 2>/dev/null | grep -oP 'https://[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com')
cd ..

if [ -z "$API_URL" ]; then
    echo -e "${RED}Warning: Could not automatically extract API URL${NC}"
    echo "Please check serverless output and update EC2 .env manually"
else
    echo -e "${GREEN}API URL: $API_URL${NC}"
fi

# =============================================================================
# Step 2: Deploy to EC2 (if configured)
# =============================================================================
echo ""
echo -e "${YELLOW}Step 2: EC2 Deployment${NC}"

# Check if EC2 deployment is configured
if [ -f "scripts/deploy-ec2.sh" ]; then
    read -p "Deploy to EC2? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Update EC2 environment with new API URL
        if [ ! -z "$API_URL" ]; then
            echo "Remember to update EC2 .env with:"
            echo "  API_GATEWAY_URL=\"$API_URL\""
        fi
        
        ./scripts/deploy-ec2.sh
    fi
else
    echo "EC2 deployment script not configured"
    echo "Run ./scripts/ec2-setup.sh on your EC2 instance first"
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "=============================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "=============================================="
echo ""
echo "Services:"
echo -e "  Lambda API: ${CYAN}$API_URL${NC}"
echo "  EC2 Code Execution: http://your-ec2-ip:3002"
echo ""
echo "Verification Commands:"
echo "  curl $API_URL/health"
echo "  curl http://your-ec2-ip:3002/health"
echo ""
echo "Don't forget to:"
echo "  1. Update Vercel environment variables with API_URL"
echo "  2. Configure VPC security groups for Lambda-EC2 communication"
echo "  3. Run database migrations: npx prisma migrate deploy"
echo ""
