# AWS Deployment & Billing Estimation
## Architecture for 150 Concurrent Users with Cloudflare Gateway

**Document Version:** 1.0  
**Date:** January 9, 2026  
**Target Capacity:** 150 concurrent users  
**Gateway:** Cloudflare

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [AWS Services Required](#aws-services-required)
3. [Cloudflare Configuration](#cloudflare-configuration)
4. [Infrastructure Specifications](#infrastructure-specifications)
5. [Monthly Cost Estimation](#monthly-cost-estimation)
6. [Scaling Considerations](#scaling-considerations)
7. [Deployment Strategy](#deployment-strategy)
8. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Architecture Overview

### High-Level Architecture
```
Users
  ↓
Cloudflare (CDN + DDoS Protection + SSL)
  ↓
AWS Application Load Balancer (ALB)
  ↓
┌─────────────────────────────────────┐
│  Auto Scaling Group                 │
│  ┌──────────────┐  ┌──────────────┐ │
│  │   Client     │  │   Client     │ │
│  │  (Next.js)   │  │  (Next.js)   │ │
│  │  Container   │  │  Container   │ │
│  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐ │
│  │   Server     │  │   Server     │ │
│  │  (Node.js)   │  │  (Node.js)   │ │
│  │  Container   │  │  Container   │ │
│  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────┘
          ↓
    AWS RDS (PostgreSQL)
          ↓
    AWS S3 (Static Assets/User Uploads)
```

### Traffic Flow
1. **User Request** → Cloudflare Edge Network
2. **Cloudflare** → AWS Application Load Balancer
3. **ALB** → ECS Fargate Containers (Client/Server)
4. **Application** → RDS PostgreSQL Database
5. **Static Assets** → S3 → CloudFront (optional) or Cloudflare

---

## AWS Services Required

### 1. Compute - Amazon ECS Fargate
**Purpose:** Run containerized applications without managing servers

**Configuration:**
- **Service:** ECS Fargate (Serverless containers)
- **Client Tasks:** 2 tasks × 0.5 vCPU, 1 GB RAM
- **Server Tasks:** 2 tasks × 1 vCPU, 2 GB RAM
- **Total Compute:** 3 vCPU, 6 GB RAM

**Why Fargate:**
- No server management
- Auto-scaling capabilities
- Pay only for what you use
- Perfect for containerized apps (your Docker setup)

### 2. Database - Amazon RDS PostgreSQL
**Purpose:** Managed database service

**Configuration:**
- **Instance Type:** db.t4g.small (2 vCPU, 2 GB RAM)
- **Storage:** 50 GB GP3 SSD
- **Multi-AZ:** No (for cost savings, single AZ)
- **Backup:** 7-day automated backups
- **Engine:** PostgreSQL 15.x

**Why this size:**
- 150 concurrent users with moderate queries
- Room for growth
- Cost-effective for startup/medium traffic

### 3. Load Balancing - Application Load Balancer
**Purpose:** Distribute traffic across containers

**Configuration:**
- **Type:** Application Load Balancer (Layer 7)
- **Availability Zones:** 2 AZs for high availability
- **Health Checks:** Enabled
- **SSL Termination:** Handled by Cloudflare

### 4. Storage - Amazon S3
**Purpose:** Store static assets, user uploads, images

**Configuration:**
- **Storage Class:** S3 Standard
- **Estimated Usage:** 20 GB initial + 5 GB/month growth
- **Transfer:** ~100 GB/month to Cloudflare
- **Versioning:** Enabled for uploads bucket

### 5. Networking - Amazon VPC
**Purpose:** Isolated network environment

**Configuration:**
- **VPC:** 1 VPC with public/private subnets
- **Subnets:** 2 public, 2 private (across 2 AZs)
- **NAT Gateway:** 1 NAT Gateway (for private subnet internet access)
- **Internet Gateway:** 1 IGW

### 6. Container Registry - Amazon ECR
**Purpose:** Store Docker images

**Configuration:**
- **Repositories:** 2 (client, server)
- **Storage:** ~5 GB for images
- **Image Scanning:** Enabled

### 7. Monitoring - CloudWatch
**Purpose:** Logging and monitoring

**Configuration:**
- **Logs:** 10 GB/month retention
- **Metrics:** Standard metrics
- **Alarms:** 5 alarms (CPU, Memory, Errors, Latency, DB connections)

### 8. Domain & SSL - Route 53 (Optional)
**Purpose:** DNS management

**Configuration:**
- **Hosted Zone:** 1 zone
- **Queries:** ~10 million/month (most handled by Cloudflare)

---

## Cloudflare Configuration

### Cloudflare Plan Required
**Recommended:** Cloudflare Pro Plan

**Features Included:**
- **CDN:** Global content delivery
- **DDoS Protection:** Advanced protection
- **SSL/TLS:** Full (Strict) mode
- **WAF:** Web Application Firewall (Basic rules)
- **Page Rules:** 20 page rules
- **Caching:** Aggressive caching for static assets
- **Bandwidth:** Unlimited

### Cloudflare Setup
1. **DNS Records:**
   - A Record: `yourdomain.com` → AWS ALB IP
   - CNAME: `www` → `yourdomain.com`
   - CNAME: `api` → `yourdomain.com` (if separate subdomain needed)

2. **Page Rules:**
   - Cache static assets aggressively
   - Bypass cache for API endpoints
   - SSL enforcement

3. **Security Settings:**
   - Challenge suspected bots
   - Rate limiting (100 requests/min per IP)
   - DNSSEC enabled

---

## Infrastructure Specifications

### Compute Resources Breakdown

#### ECS Fargate Tasks
| Component | Tasks | vCPU/Task | RAM/Task | Total vCPU | Total RAM |
|-----------|-------|-----------|----------|------------|-----------|
| Client    | 2     | 0.5       | 1 GB     | 1.0        | 2 GB      |
| Server    | 2     | 1.0       | 2 GB     | 2.0        | 4 GB      |
| **Total** | **4** | -         | -        | **3.0**    | **6 GB**  |

### Auto Scaling Configuration
- **Minimum Tasks:** 2 per service
- **Maximum Tasks:** 4 per service (peak traffic)
- **Scaling Metric:** CPU > 70% or Memory > 80%
- **Scale-up Cooldown:** 60 seconds
- **Scale-down Cooldown:** 300 seconds

### Database Configuration
- **Instance:** db.t4g.small
- **Storage:** 50 GB GP3 (3000 IOPS, 125 MB/s throughput)
- **Connections:** Up to 200 concurrent connections
- **Expected Load:** ~50-100 active connections for 150 users

---

## Monthly Cost Estimation

### AWS Services Cost Breakdown (US East - N. Virginia Region)

#### 1. ECS Fargate Compute
```
Client Tasks: 2 × 0.5 vCPU × $0.04048/vCPU-hour × 730 hours = $29.55
              2 × 1 GB RAM × $0.004445/GB-hour × 730 hours = $6.49
              
Server Tasks: 2 × 1 vCPU × $0.04048/vCPU-hour × 730 hours = $59.10
              2 × 2 GB RAM × $0.004445/GB-hour × 730 hours = $12.98

Total Fargate: $108.12/month
```

#### 2. RDS PostgreSQL (db.t4g.small)
```
Instance:      $0.036/hour × 730 hours = $26.28
Storage:       50 GB × $0.138/GB = $6.90
Backup:        25 GB × $0.095/GB = $2.38 (avg)

Total RDS: $35.56/month
```

#### 3. Application Load Balancer
```
ALB Hours:     $0.0225/hour × 730 hours = $16.43
LCU Usage:     ~10 LCUs × $0.008/LCU-hour × 730 hours = $58.40

Total ALB: $74.83/month
```

#### 4. Amazon S3
```
Storage:       25 GB × $0.023/GB = $0.58
PUT Requests:  10,000 × $0.005/1000 = $0.05
GET Requests:  100,000 × $0.0004/1000 = $0.04
Data Transfer: 100 GB × $0.00/GB (to Cloudflare) = $0.00

Total S3: $0.67/month
```

#### 5. NAT Gateway
```
NAT Gateway:   $0.045/hour × 730 hours = $32.85
Data Transfer: 50 GB × $0.045/GB = $2.25

Total NAT: $35.10/month
```

#### 6. Amazon ECR
```
Storage:       5 GB × $0.10/GB = $0.50
Data Transfer: Minimal = $0.20

Total ECR: $0.70/month
```

#### 7. CloudWatch
```
Logs:          10 GB × $0.50/GB = $5.00
Metrics:       50 custom metrics × $0.30 = $15.00
Alarms:        5 alarms × $0.10 = $0.50

Total CloudWatch: $20.50/month
```

#### 8. Data Transfer (Outbound)
```
From ALB to Cloudflare: 200 GB × $0.09/GB = $18.00

Total Transfer: $18.00/month
```

#### 9. Route 53 (Optional)
```
Hosted Zone:   $0.50/zone
Queries:       10M × $0.40/million = $4.00

Total Route 53: $4.50/month
```

### **Total AWS Monthly Cost: ~$298/month**

---

### Cloudflare Cost

#### Cloudflare Pro Plan
```
Monthly Subscription: $20/month
Bandwidth: Unlimited (included)
```

### **Total Cloudflare Monthly Cost: $20/month**

---

## Total Monthly Infrastructure Cost

| Service Category | Monthly Cost |
|------------------|--------------|
| AWS Compute (ECS) | $108.12 |
| AWS Database (RDS) | $35.56 |
| AWS Load Balancer | $74.83 |
| AWS Storage (S3) | $0.67 |
| AWS NAT Gateway | $35.10 |
| AWS ECR | $0.70 |
| AWS CloudWatch | $20.50 |
| AWS Data Transfer | $18.00 |
| AWS Route 53 | $4.50 |
| Cloudflare Pro | $20.00 |
| **TOTAL** | **~$318/month** |

### Cost Per User
```
$318 / 150 concurrent users = $2.12 per concurrent user/month
```

---

## Scaling Considerations

### Current Capacity (150 Users)
- **ECS Tasks:** 4 tasks (2 client, 2 server)
- **Database:** db.t4g.small
- **Estimated Cost:** $318/month

### Scaling to 300 Users
- **ECS Tasks:** 6-8 tasks (auto-scaling)
- **Database:** db.t4g.medium (upgrade)
- **Estimated Cost:** $450-500/month

### Scaling to 500 Users
- **ECS Tasks:** 10-12 tasks
- **Database:** db.r6g.large
- **RDS Read Replica:** Consider adding
- **Estimated Cost:** $700-800/month

### Cost Optimization Tips
1. **Reserved Instances:** Save 30-40% on RDS with 1-year commitment
2. **Savings Plans:** Save 20-30% on Fargate compute
3. **S3 Lifecycle Policies:** Move old data to Glacier
4. **CloudWatch Logs:** Reduce retention period to 7 days
5. **NAT Gateway:** Consider NAT instances for cost savings (requires management)
6. **Cloudflare:** Use aggressive caching to reduce AWS data transfer

---

## Deployment Strategy

### Phase 1: Infrastructure Setup
1. **Create VPC and Networking**
   - VPC with CIDR 10.0.0.0/16
   - 2 public subnets (10.0.1.0/24, 10.0.2.0/24)
   - 2 private subnets (10.0.3.0/24, 10.0.4.0/24)
   - Internet Gateway
   - NAT Gateway in public subnet

2. **Setup RDS PostgreSQL**
   - Create DB subnet group
   - Launch db.t4g.small instance
   - Configure security groups (allow from ECS tasks only)
   - Create initial database and user

3. **Setup S3 Buckets**
   - Static assets bucket (public read)
   - User uploads bucket (private)
   - Configure CORS policies
   - Enable versioning

4. **Create ECR Repositories**
   - Repository for client image
   - Repository for server image
   - Enable image scanning

### Phase 2: Container Deployment
1. **Build Docker Images**
   ```bash
   # Client
   docker build -t cbg-client ./client
   docker tag cbg-client:latest <account>.dkr.ecr.us-east-1.amazonaws.com/cbg-client:latest
   docker push <account>.dkr.ecr.us-east-1.amazonaws.com/cbg-client:latest
   
   # Server
   docker build -t cbg-server ./server
   docker tag cbg-server:latest <account>.dkr.ecr.us-east-1.amazonaws.com/cbg-server:latest
   docker push <account>.dkr.ecr.us-east-1.amazonaws.com/cbg-server:latest
   ```

2. **Create ECS Cluster**
   - Cluster type: Fargate
   - Enable CloudWatch Container Insights

3. **Create Task Definitions**
   - Client task: 0.5 vCPU, 1 GB RAM
   - Server task: 1 vCPU, 2 GB RAM
   - Environment variables (DB connection, API keys)
   - Logging to CloudWatch

4. **Create ECS Services**
   - Client service: 2 tasks minimum
   - Server service: 2 tasks minimum
   - Configure auto-scaling
   - Health check grace period: 60 seconds

### Phase 3: Load Balancer Setup
1. **Create Target Groups**
   - Client target group (port 3000)
   - Server target group (port 5000)
   - Health check endpoints

2. **Create Application Load Balancer**
   - Internet-facing
   - 2 availability zones
   - Configure listeners (HTTP/HTTPS)
   - Add rules for routing

### Phase 4: Cloudflare Configuration
1. **Add Domain to Cloudflare**
   - Update nameservers at registrar
   - Wait for DNS propagation

2. **Configure DNS Records**
   - Point to ALB DNS name
   - Enable Cloudflare proxy (orange cloud)

3. **SSL/TLS Settings**
   - Set to Full (Strict)
   - Enable Always Use HTTPS
   - Minimum TLS 1.2

4. **Performance Settings**
   - Enable Auto Minify (JS, CSS, HTML)
   - Enable Brotli compression
   - Set caching levels

5. **Security Settings**
   - Configure WAF rules
   - Set up rate limiting
   - Enable DDoS protection

### Phase 5: Database Migration
1. **Run Prisma Migrations**
   ```bash
   # From your local machine or CI/CD
   DATABASE_URL="postgresql://user:pass@rds-endpoint/db" npx prisma migrate deploy
   ```

2. **Seed Initial Data**
   ```bash
   DATABASE_URL="postgresql://user:pass@rds-endpoint/db" npx prisma db seed
   ```

---

## Monitoring & Maintenance

### CloudWatch Alarms
1. **CPU Utilization** (ECS Tasks)
   - Threshold: > 80% for 5 minutes
   - Action: SNS notification + Auto-scale

2. **Memory Utilization** (ECS Tasks)
   - Threshold: > 85% for 5 minutes
   - Action: SNS notification + Auto-scale

3. **Database CPU** (RDS)
   - Threshold: > 75% for 10 minutes
   - Action: SNS notification

4. **Database Connections** (RDS)
   - Threshold: > 150 connections
   - Action: SNS notification

5. **ALB Target Health**
   - Threshold: < 2 healthy targets
   - Action: SNS notification (critical)

### Monitoring Metrics
- **Application Performance:**
  - Request latency (P50, P95, P99)
  - Error rates (4xx, 5xx)
  - Request throughput

- **Database Performance:**
  - Query execution time
  - Connection pool usage
  - Slow query logs

- **Infrastructure:**
  - Container health status
  - Network throughput
  - Data transfer costs

### Backup Strategy
1. **RDS Automated Backups**
   - Daily snapshots
   - 7-day retention
   - Point-in-time recovery enabled

2. **S3 Versioning**
   - Enable on all buckets
   - Lifecycle policy to expire old versions after 30 days

3. **ECR Image Retention**
   - Keep last 10 images
   - Tag production images as "stable"

### Security Best Practices
1. **IAM Roles & Policies**
   - Use IAM roles for ECS tasks (no hardcoded credentials)
   - Principle of least privilege
   - Separate roles for client/server

2. **Network Security**
   - Security groups: Allow only necessary ports
   - Private subnets for RDS (no public access)
   - VPC endpoints for AWS services (optional, saves NAT costs)

3. **Secrets Management**
   - Use AWS Secrets Manager or Parameter Store
   - Rotate database credentials regularly
   - Encrypt environment variables

4. **Cloudflare Security**
   - Enable DNSSEC
   - Configure firewall rules (geo-blocking if needed)
   - Enable bot management

---

## Cost Optimization Recommendations

### Immediate Savings (0-3 months)
1. **Fargate Spot Tasks:** Save up to 70% for non-critical tasks
2. **S3 Intelligent Tiering:** Automatic cost optimization
3. **Cloudflare Caching:** Reduce AWS data transfer by 60-80%
4. **Reserved Capacity:** Not recommended initially (need usage data)

### Medium-term Savings (3-6 months)
1. **RDS Reserved Instance:** 1-year commitment, save 30-40%
2. **Compute Savings Plans:** Save 20-30% on Fargate
3. **Right-sizing:** Analyze CloudWatch metrics, adjust resources
4. **Cost Allocation Tags:** Track spending by service

### Long-term Optimization (6+ months)
1. **Multi-region Strategy:** Consider if needed
2. **Database Read Replicas:** For read-heavy workloads
3. **ElastiCache:** Add Redis for session/cache management
4. **CDN Strategy:** Evaluate CloudFront vs Cloudflare

---

## Alternative Architecture (Lower Cost)

### Budget Option (~$180/month)
**For tighter budgets, consider:**

1. **Single EC2 Instance (t4g.medium)**
   - Run both client and server on one instance
   - Cost: ~$25/month (with Reserved Instance)
   - Docker Compose deployment

2. **RDS db.t4g.micro**
   - Cost: ~$15/month
   - Good for 50-100 concurrent users

3. **No NAT Gateway**
   - Use NAT Instance (t4g.nano) or public subnets
   - Save: $35/month

4. **Cloudflare Free Plan**
   - Basic CDN and DDoS protection
   - Save: $20/month

**Total Alternative Cost: ~$180/month**

**Trade-offs:**
- Less redundancy (single instance)
- Manual scaling required
- More maintenance overhead
- Lower availability guarantees

---

## Summary & Recommendations

### For 150 Concurrent Users

**Recommended Setup:**
- **Architecture:** ECS Fargate + RDS + Cloudflare Pro
- **Monthly Cost:** ~$318/month
- **Cost per User:** $2.12/month
- **High Availability:** Yes (multi-AZ, auto-scaling)
- **Management Overhead:** Low (managed services)

**Performance Expectations:**
- **Response Time:** < 200ms (with Cloudflare caching)
- **Uptime:** 99.9% (with proper monitoring)
- **Scalability:** Can handle 300+ users with auto-scaling

**Next Steps:**
1. Set up AWS account and enable billing alerts
2. Configure Cloudflare account and add domain
3. Review and adjust infrastructure based on actual usage
4. Implement cost monitoring and optimization
5. Set up CI/CD pipeline for automated deployments

### Budget Considerations
- **Initial Setup:** $318/month is for steady-state operation
- **First Month:** May be higher ($400-500) due to setup, testing, data transfer
- **Growth:** Plan for 30-50% cost increase when scaling to 300 users
- **Reserve Budget:** Keep $100-200/month buffer for unexpected costs

---

## Appendix: Additional Services (Optional)

### A. Amazon CloudFront (Alternative to Cloudflare caching)
- **Cost:** ~$15-30/month
- **Use Case:** If you prefer AWS-native CDN
- **Note:** Cloudflare Pro offers better value

### B. AWS WAF (If not using Cloudflare Pro)
- **Cost:** $5/month + rules
- **Use Case:** Web application firewall protection

### C. Amazon ElastiCache (Redis)
- **Instance:** cache.t4g.micro
- **Cost:** ~$12/month
- **Use Case:** Session management, caching

### D. Amazon SES (Email Service)
- **Cost:** $0.10 per 1,000 emails
- **Use Case:** Transactional emails, notifications

### E. AWS Lambda (Serverless functions)
- **Cost:** Free tier covers light usage
- **Use Case:** Background jobs, image processing

---

**Document End**

*Note: All prices are estimates based on AWS pricing as of January 2026 (US East - N. Virginia region). Actual costs may vary based on usage patterns, data transfer, and AWS pricing changes. Always use the AWS Pricing Calculator for precise estimates.*

*For questions or updates to this document, contact your DevOps team.*
