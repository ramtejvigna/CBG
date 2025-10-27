# Railway Deployment Guide

This guide will help you deploy your CBG application to Railway using Docker Hub images.

## Prerequisites

1. **Docker Hub Account**: Create account at [hub.docker.com](https://hub.docker.com)
2. **Railway Account**: Create account at [railway.app](https://railway.app)
3. **GitHub Account**: For automated builds

## Step 1: Set up GitHub Secrets

In your GitHub repository, go to **Settings** → **Secrets and variables** → **Actions** and add:

- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Your Docker Hub access token (recommended) or password

To create a Docker Hub access token:
1. Go to Docker Hub → Account Settings → Security
2. Click "New Access Token"
3. Give it a name and full access
4. Copy the token and use it as `DOCKER_PASSWORD`

## Step 2: Build and Push Images

### Option A: Automatic (Recommended)
Push your code to GitHub. The GitHub Actions workflow will automatically:
- Build both client and server Docker images
- Push them to Docker Hub with tags like:
  - `your-username/cbg-server:latest`
  - `your-username/cbg-client:latest`

### Option B: Manual Build
```bash
# Build and push server
cd server
docker build -t your-username/cbg-server:latest .
docker push your-username/cbg-server:latest

# Build and push client  
cd ../client
docker build -t your-username/cbg-client:latest .
docker push your-username/cbg-client:latest
```

## Step 3: Deploy to Railway

### Deploy the Server (Backend)

1. **Create New Project**:
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from Docker Hub"

2. **Configure Server Service**:
   - Image: `your-username/cbg-server:latest`
   - Service name: `cbg-server`
   - Port: `5000`

3. **Set Environment Variables**:
   ```
   PORT=5000
   NODE_ENV=production
   DATABASE_URL=your-neon-database-url
   JWT_SECRET=your-jwt-secret-key-here-make-it-long-and-secure
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   EMAIL_USER=testx3748@gmail.com
   EMAIL_PASS=wztctydjrcrfykbo
   ```

4. **Deploy**: Click "Deploy"

### Deploy the Client (Frontend)

1. **Add New Service**:
   - In the same project, click "New Service"
   - Select "Deploy from Docker Hub"

2. **Configure Client Service**:
   - Image: `your-username/cbg-client:latest`
   - Service name: `cbg-client`
   - Port: `3000`

3. **Set Environment Variables**:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://your-server-railway-url
   ```
   
   Replace `your-server-railway-url` with the Railway-generated URL for your server service.

4. **Deploy**: Click "Deploy"

## Step 4: Database Setup

Your Neon PostgreSQL database should work as-is. Make sure:
1. The `DATABASE_URL` environment variable is correctly set in the server service
2. Your database allows connections from Railway's IP ranges (Neon allows this by default)

## Step 5: Custom Domains (Optional)

1. **Add Custom Domain**:
   - Go to your Railway project
   - Click on the client service
   - Go to "Settings" → "Domains"
   - Add your custom domain

2. **Configure DNS**:
   - Add a CNAME record pointing to the Railway-provided domain

## Continuous Deployment

With the GitHub Actions workflow in place:
1. Push changes to the `main` branch
2. GitHub Actions automatically builds and pushes new Docker images
3. Go to Railway dashboard and trigger a redeploy
4. Or set up Railway GitHub integration for automatic redeployment

## Monitoring and Logs

- **Health Checks**: Both services have health endpoints
  - Server: `https://your-server-url/health`
  - Client: Next.js built-in health checks

- **Logs**: View logs in Railway dashboard under each service

## Environment-Specific Configuration

### Production Optimizations
- Images are multi-stage builds for smaller size
- Non-root users for security
- Health checks included
- Proper CORS configuration

### Scaling
- Railway automatically handles horizontal scaling
- Monitor resource usage in the Railway dashboard
- Upgrade plan if needed for higher limits

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Verify `DATABASE_URL` is correct
   - Check Neon database allows external connections
   - Ensure SSL mode is properly configured

2. **CORS Issues**:
   - Update CORS origins in server code
   - Add Railway URLs to allowed origins

3. **Build Failures**:
   - Check Docker Hub for successful image pushes
   - Verify Dockerfile syntax
   - Check build logs in GitHub Actions

### Debug Commands
```bash
# Check if images were pushed successfully
docker pull your-username/cbg-server:latest
docker pull your-username/cbg-client:latest

# Test images locally
docker run -p 5000:5000 -e PORT=5000 your-username/cbg-server:latest
docker run -p 3000:3000 your-username/cbg-client:latest
```

## Security Notes

- Use Railway's environment variables for secrets
- Never commit sensitive data to Git
- Consider using Railway's private networking for service communication
- Regularly update dependencies and base images

## Cost Optimization

- Railway offers a free tier with limitations
- Monitor usage to avoid unexpected charges
- Consider using Railway's sleep mode for development environments
- Optimize Docker images for smaller sizes