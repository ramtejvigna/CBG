# CBG Platform - Lambda + EC2 Hybrid Deployment

This document provides a complete guide to deploying the CBG (Competitive Coding Battle Ground) platform using a cost-optimized hybrid architecture.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER REQUESTS                                   │
│                                                                              │
│  Browser ──────► Vercel (Frontend) ──────► API Gateway ──────► Lambda       │
│                      (Free)                  (Pay per request)   (APIs)     │
│                                                    │                         │
│                                                    │                         │
│                                                    ▼                         │
│                                            ┌──────────────┐                  │
│                                            │  EC2 t3.small │                 │
│                                            │  (~$15/month) │                 │
│                                            │               │                 │
│                                            │ ┌───────────┐ │                 │
│                                            │ │ Code Exec │ │                 │
│                                            │ │ Service   │ │                 │
│                                            │ │ (Docker)  │ │                 │
│                                            │ └───────────┘ │                 │
│                                            │       │       │                 │
│                                            │       ▼       │                 │
│                                            │ ┌───────────┐ │                 │
│                                            │ │PostgreSQL │ │                 │
│                                            │ │   14      │ │                 │
│                                            │ └───────────┘ │                 │
│                                            └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Cost Estimation (~$25-30/month)

| Service | Specification | Estimated Cost |
|---------|---------------|----------------|
| EC2 t3.small | 2 vCPU, 2GB RAM, 30GB EBS | ~$15/month |
| Lambda | ~500K requests/month | ~$1-3/month |
| API Gateway | HTTP API (cheaper than REST) | ~$1-2/month |
| Data Transfer | ~50GB/month | ~$4-5/month |
| Vercel | Free tier | $0 |
| **Total** | | **~$25-30/month** |

## Project Structure

```
CBG/
├── client/                      # Next.js Frontend (Vercel)
├── server/                      # Original monolithic server (reference)
├── lambda-api/                  # NEW: Lambda API handlers
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── handlers/           # Lambda function handlers
│   │   │   ├── auth.ts
│   │   │   ├── challenges.ts
│   │   │   ├── contests.ts
│   │   │   ├── users.ts
│   │   │   ├── execute.ts      # Proxies to EC2
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── prisma.ts
│   │   │   └── cache.ts
│   │   └── middleware/
│   │       └── auth.ts
│   ├── serverless.yml          # Serverless Framework config
│   ├── package.json
│   └── tsconfig.json
├── code-execution-service/      # NEW: EC2 Code Execution
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── server.ts
│   │   ├── controllers/
│   │   │   └── executeController.ts
│   │   ├── lib/
│   │   │   ├── prisma.ts
│   │   │   └── dockerExecutor.ts
│   │   └── middleware/
│   │       └── auth.ts
│   ├── Dockerfile.sandbox
│   ├── ecosystem.config.cjs    # PM2 configuration
│   └── package.json
├── scripts/                     # Deployment scripts
│   ├── ec2-setup.sh
│   ├── deploy-lambda.sh
│   ├── deploy-ec2.sh
│   └── deploy-full.sh
└── LAMBDA_EC2_HYBRID_DEPLOYMENT.md
```

## Prerequisites

1. **AWS Account** with CLI configured
2. **Node.js 18.x** installed locally
3. **Serverless Framework** installed: `npm install -g serverless`
4. **AWS credentials** configured: `aws configure`

## Deployment Steps

### Step 1: Set Up EC2 Instance

1. **Launch EC2 Instance:**
   - AMI: Ubuntu 22.04 LTS
   - Instance Type: t3.small
   - Storage: 30GB gp3
   - Security Group:
     - SSH (22) from your IP
     - Custom TCP (3002) from Lambda VPC

2. **Run Setup Script:**
   ```bash
   # SSH into your EC2 instance
   ssh -i your-key.pem ubuntu@your-ec2-ip
   
   # Download and run setup script
   curl -O https://raw.githubusercontent.com/your-repo/scripts/ec2-setup.sh
   chmod +x ec2-setup.sh
   ./ec2-setup.sh
   ```

3. **Save the database credentials** displayed at the end of the script.

### Step 2: Deploy Code Execution Service

1. **Copy files to EC2:**
   ```bash
   # From your local machine
   scp -i your-key.pem -r code-execution-service/* ubuntu@your-ec2-ip:/var/www/code-execution/
   ```

2. **SSH and set up:**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   cd /var/www/code-execution
   
   # Update .env file with your actual database credentials
   nano .env
   
   # Install dependencies
   npm install
   
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate deploy
   
   # Build Docker sandbox image
   docker build -t code-execution-sandbox:latest -f Dockerfile.sandbox .
   
   # Start with PM2
   pm2 start ecosystem.config.cjs
   pm2 save
   ```

3. **Verify:**
   ```bash
   curl http://localhost:3002/health
   # Should return: {"status":"ok","service":"code-execution"}
   ```

### Step 3: Deploy Lambda API

1. **Configure environment:**
   ```bash
   cd lambda-api
   cp .env.example .env
   # Edit .env with your EC2 private IP and database URL
   nano .env
   ```

2. **Deploy to AWS:**
   ```bash
   npm install
   npx prisma generate
   npx serverless deploy --stage prod
   ```

3. **Note the API Gateway URL** from the output.

### Step 4: Configure Vercel Frontend

1. **Update environment variables in Vercel:**
   - `NEXT_PUBLIC_API_URL`: Your API Gateway URL
   - Example: `https://abc123.execute-api.us-east-1.amazonaws.com`

2. **Redeploy frontend:**
   ```bash
   cd client
   vercel --prod
   ```

## Configuration Files

### Lambda API (.env)
```env
NODE_ENV=production
AWS_REGION=us-east-1
DATABASE_URL="postgresql://cbg_user:password@ec2-private-ip:5432/cbg_production"
CODE_EXECUTION_URL="http://ec2-private-ip:3002"
FRONTEND_URL="https://your-app.vercel.app"
JWT_SECRET="your-secret-key"
```

### Code Execution Service (.env)
```env
NODE_ENV=production
PORT=3002
DATABASE_URL="postgresql://cbg_user:password@localhost:5432/cbg_production"
API_GATEWAY_URL="https://your-api-id.execute-api.us-east-1.amazonaws.com"
TMP_DIR="/var/www/code-execution/tmp"
```

## API Endpoints

### Lambda Functions
| Endpoint | Method | Handler |
|----------|--------|---------|
| /health | GET | health |
| /api/auth/* | ANY | auth |
| /api/challenges/* | ANY | challenges |
| /api/contests/* | ANY | contests |
| /api/users/* | ANY | users |
| /api/categories/* | ANY | categories |
| /api/languages/* | ANY | languages |
| /api/activities/* | ANY | activities |
| /api/statistics/* | ANY | statistics |
| /api/search/* | ANY | search |
| /api/admin/* | ANY | admin |
| /api/execute | POST | execute (proxy) |

### Code Execution Service (EC2)
| Endpoint | Method | Description |
|----------|--------|-------------|
| /health | GET | Basic health check |
| /health/detailed | GET | Detailed health with Docker status |
| /execute | POST | Execute code against test cases |

## VPC Configuration (Recommended)

For production, configure Lambda to run in your VPC:

1. Create VPC with private subnet
2. Add NAT Gateway for internet access
3. Configure Lambda VPC settings in `serverless.yml`
4. Update security groups to allow Lambda → EC2 traffic

```yaml
# serverless.yml (add to provider section)
provider:
  vpc:
    securityGroupIds:
      - sg-xxx
    subnetIds:
      - subnet-xxx
```

## Monitoring & Maintenance

### PM2 Commands (EC2)
```bash
pm2 status                    # Check status
pm2 logs code-execution       # View logs
pm2 restart code-execution    # Restart
pm2 monit                     # Real-time monitoring
```

### CloudWatch (Lambda)
- Monitor in AWS Console → CloudWatch → Log groups → /aws/lambda/cbg-*

### Database Backup (EC2)
```bash
# Create backup
pg_dump -U cbg_user cbg_production > backup_$(date +%Y%m%d).sql

# Restore
psql -U cbg_user cbg_production < backup_file.sql
```

## Scaling Considerations

### When to Scale Up

1. **EC2 to t3.medium** (~$30/month):
   - If CPU consistently > 70%
   - If memory consistently > 1.5GB
   - More concurrent code executions needed

2. **Add Read Replica**:
   - High read traffic on challenges/leaderboards
   - Consider RDS for managed replication

3. **Separate PostgreSQL**:
   - When database needs exceed 2GB RAM
   - Move to RDS or dedicated EC2

### Auto-scaling Lambda
Lambda automatically scales. Monitor:
- Concurrent executions
- Cold start latency
- Memory usage

## Troubleshooting

### Lambda Issues
```bash
# Check logs
serverless logs -f functionName --stage prod

# Test locally
serverless invoke local -f health
```

### EC2 Issues
```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs code-execution --lines 100

# Check Docker
docker ps -a
docker logs container_id

# Check PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT 1"
```

### Connection Issues
```bash
# Test EC2 from Lambda (SSH into EC2)
curl http://localhost:3002/health

# Check security groups in AWS Console
# Ensure Lambda VPC can reach EC2
```

## Cost Optimization Tips

1. **Use Spot Instances** for development EC2 (up to 70% savings)
2. **Reserved Instances** for production (up to 40% savings for 1-year)
3. **Lambda ARM64** already configured (20% cheaper)
4. **CloudWatch Log Retention**: Set to 7-14 days
5. **Compress responses** in API Gateway

## Security Best Practices

1. **Never commit credentials** - use environment variables
2. **Rotate database passwords** periodically
3. **Enable VPC Flow Logs** for network monitoring
4. **Use IAM roles** with least privilege
5. **Enable AWS CloudTrail** for audit logging
6. **Regular security updates**: `sudo apt update && sudo apt upgrade`

---

## Deployment Scripts Reference

All scripts are located in the `scripts/` directory. Make them executable before use:

```bash
chmod +x scripts/*.sh
```

### 1. EC2 Setup Script (`ec2-setup.sh`)

**Purpose:** Initial setup of a fresh EC2 Ubuntu instance with Node.js, Docker, PostgreSQL, and PM2.

**Usage:**
```bash
# Run directly on the EC2 instance (after SSH)
./scripts/ec2-setup.sh
```

**What it does:**
- Updates system packages
- Installs Node.js 18.x
- Installs and configures Docker
- Installs PostgreSQL 14 and creates database/user
- Installs PM2 globally
- Creates application user and directories
- Configures swap space (2GB)
- Sets up firewall (UFW)
- Generates a random database password

**Output:** Displays database credentials at the end - **save these!**

---

### 2. Deploy Lambda Script (`deploy-lambda.sh`)

**Purpose:** Deploy all Lambda functions to AWS using Serverless Framework.

**Usage:**
```bash
# Deploy to production (default)
./scripts/deploy-lambda.sh

# Deploy to a specific stage
./scripts/deploy-lambda.sh prod
./scripts/deploy-lambda.sh dev
./scripts/deploy-lambda.sh staging
```

**Prerequisites:**
- AWS CLI configured (`aws configure`)
- Serverless Framework installed (`npm install -g serverless`)
- `.env` file configured in `lambda-api/`

**What it does:**
- Installs npm dependencies
- Generates Prisma client
- Builds TypeScript
- Deploys to AWS Lambda via Serverless Framework
- Outputs API Gateway URL

---

### 3. Deploy EC2 Script (`deploy-ec2.sh`)

**Purpose:** Deploy/update the code execution service on EC2.

**Usage:**
```bash
# First, edit the script to set your EC2 details
nano scripts/deploy-ec2.sh

# Set these variables in the script:
# EC2_HOST="your-ec2-public-ip"
# EC2_KEY="/path/to/your-key.pem"

# Then run
./scripts/deploy-ec2.sh
```

**Prerequisites:**
- EC2 instance already set up (via `ec2-setup.sh`)
- SSH key file (.pem)
- EC2 public IP or hostname

**What it does:**
- Builds TypeScript locally
- Syncs files to EC2 via rsync (excludes node_modules)
- Runs `npm install --production` on EC2
- Generates Prisma client
- Runs database migrations
- Builds Docker sandbox image (if not exists)
- Restarts PM2 application

---

### 4. Full Deploy Script (`deploy-full.sh`)

**Purpose:** Complete deployment of both Lambda API and EC2 service.

**Usage:**
```bash
# Deploy everything to production
./scripts/deploy-full.sh

# Deploy to a specific stage
./scripts/deploy-full.sh prod
./scripts/deploy-full.sh dev
```

**Prerequisites:**
- AWS CLI configured
- EC2 details configured in `deploy-ec2.sh`
- All `.env` files configured

**What it does:**
- Deploys Lambda API first
- Extracts API Gateway URL
- Prompts to deploy to EC2
- Provides summary and next steps

---

## Quick Reference

### Daily Operations
```bash
# Check system status
ssh -i key.pem ubuntu@ec2-ip "pm2 status && df -h && free -m"

# View recent logs
ssh -i key.pem ubuntu@ec2-ip "pm2 logs --lines 50"

# Restart service
ssh -i key.pem ubuntu@ec2-ip "pm2 restart all"
```

### Deployment Commands
```bash
# Full deployment (Lambda + EC2)
./scripts/deploy-full.sh prod

# Lambda only
./scripts/deploy-lambda.sh prod

# EC2 only (after configuring script)
./scripts/deploy-ec2.sh

# Initial EC2 setup (run ON the EC2 instance)
./scripts/ec2-setup.sh
```

### Manual Lambda Commands
```bash
cd lambda-api

# Deploy
npx serverless deploy --stage prod

# Deploy single function
npx serverless deploy function -f auth --stage prod

# View logs
npx serverless logs -f auth --stage prod --tail

# Remove deployment
npx serverless remove --stage prod

# Get info
npx serverless info --stage prod
```

### Manual EC2 Commands
```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Navigate to app
cd /var/www/code-execution

# PM2 commands
pm2 status
pm2 logs code-execution
pm2 restart code-execution
pm2 stop code-execution
pm2 delete code-execution

# Start fresh
pm2 start ecosystem.config.cjs
pm2 save

# View real-time monitoring
pm2 monit
```

### Emergency
```bash
# Rollback Lambda to previous version
cd lambda-api && npx serverless rollback --stage prod

# Restart EC2 services
ssh -i key.pem ubuntu@ec2-ip "pm2 restart all"

# Check EC2 disk space
ssh -i key.pem ubuntu@ec2-ip "df -h"

# Clear Docker cache on EC2
ssh -i key.pem ubuntu@ec2-ip "docker system prune -af"
```
