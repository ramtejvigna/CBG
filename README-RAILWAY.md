# CBG Application - Railway Deployment

A competitive programming platform with automated code execution, built with Next.js frontend and Node.js/Express backend.

## 🏗️ Architecture

- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS
- **Backend**: Node.js/Express with TypeScript
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT with bcrypt
- **Code Execution**: Docker containers
- **Deployment**: Docker Hub + Railway

## 🚀 Quick Deploy to Railway

### Prerequisites
- Docker Hub account
- Railway account  
- GitHub repository (for automated builds)

### 1. Set Up GitHub Actions (Automated)

Add these secrets to your GitHub repository (Settings → Secrets):
- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Your Docker Hub access token

Push to main branch to trigger automatic builds.

### 2. Deploy to Railway

#### Server (Backend)
1. Create new Railway project
2. Add service from Docker Hub: `your-username/cbg-server:latest`
3. Set port: `5000`
4. Add environment variables:
   ```
   PORT=5000
   NODE_ENV=production
   DATABASE_URL=your-neon-database-url
   JWT_SECRET=your-secure-jwt-secret
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   EMAIL_USER=your-email
   EMAIL_PASS=your-email-password
   ```

#### Client (Frontend)
1. Add another service: `your-username/cbg-client:latest`
2. Set port: `3000`
3. Add environment variables:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://your-server-railway-url
   ```

## 🛠️ Manual Build & Test

### Windows
```bash
# Run the test script
./docker-test.bat
```

### Linux/Mac
```bash
# Make script executable
chmod +x docker-test.sh

# Run the test script
./docker-test.sh
```

### Manual Commands
```bash
# Build images
docker build -t your-username/cbg-server:latest ./server
docker build -t your-username/cbg-client:latest ./client

# Push to Docker Hub
docker push your-username/cbg-server:latest
docker push your-username/cbg-client:latest

# Test locally
docker-compose -f docker-compose.railway.yml up
```

## 📁 Project Structure

```
CBG/
├── client/                 # Next.js frontend
│   ├── Dockerfile
│   ├── src/
│   └── package.json
├── server/                 # Express backend
│   ├── Dockerfile
│   ├── src/
│   ├── prisma/
│   └── package.json
├── .github/workflows/      # GitHub Actions
├── docker-compose.railway.yml
├── docker-test.sh/.bat
└── RAILWAY_DEPLOYMENT.md
```

## 🔧 Environment Variables

### Server
| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `production` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://...` |
| `JWT_SECRET` | JWT signing key | `your-secret-key` |
| `SMTP_HOST` | Email server | `smtp.gmail.com` |
| `SMTP_PORT` | Email port | `587` |
| `EMAIL_USER` | Email username | `your-email@gmail.com` |
| `EMAIL_PASS` | Email password | `your-app-password` |

### Client
| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `NEXT_PUBLIC_API_URL` | Backend URL | `https://api.yourdomain.com` |

## 📊 Monitoring

### Health Checks
- Server: `GET /health` → `{"status": "OK"}`
- Client: Built-in Next.js health checks

### Logs
- View in Railway dashboard
- Docker logs: `docker logs container-name`

## 🔒 Security

- Non-root Docker users
- Environment variables for secrets
- CORS configuration
- Rate limiting
- Input validation

## 🎯 Features

- **Code Challenges**: Create and solve programming problems
- **Contests**: Timed competitive programming events
- **Real-time Execution**: Secure Docker-based code execution
- **Ranking System**: Automated scoring and leaderboards
- **User Management**: Authentication and profiles
- **Admin Dashboard**: Challenge and user management

## 🧪 Testing

```bash
# Run locally with Docker Compose
docker-compose -f docker-compose.railway.yml up

# Test endpoints
curl http://localhost:5000/health
curl http://localhost:3000
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Challenges
- `GET /api/challenges` - List challenges
- `POST /api/challenges` - Create challenge (admin)
- `GET /api/challenges/:id` - Get challenge details

### Code Execution
- `POST /api/execute` - Execute code submission

### Contests
- `GET /api/contests` - List contests
- `POST /api/contests` - Create contest (admin)

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Docker Hub credentials
   - Verify Dockerfile syntax
   - Check GitHub Actions logs

2. **Database Connection**
   - Verify `DATABASE_URL` format
   - Check Neon database settings
   - Ensure SSL configuration

3. **CORS Errors**
   - Update allowed origins in server
   - Check `NEXT_PUBLIC_API_URL`

4. **Memory Issues**
   - Upgrade Railway plan
   - Optimize Docker images
   - Check resource usage

### Debug Commands

```bash
# Check image sizes
docker images | grep cbg

# Test images locally
docker run -p 5000:5000 your-username/cbg-server:latest
docker run -p 3000:3000 your-username/cbg-client:latest

# Check logs
docker logs container-name
```

## 💰 Cost Estimation

Railway pricing (as of 2024):
- **Hobby Plan**: $5/month - Good for development
- **Pro Plan**: $20/month - Production ready
- **Team Plan**: $100/month - Team collaboration

Estimated monthly cost: $5-20 depending on usage.

## 🔄 CI/CD Pipeline

1. **Code Push** → GitHub
2. **GitHub Actions** → Build & Push Docker images
3. **Railway** → Deploy from Docker Hub
4. **Health Checks** → Verify deployment
5. **Monitor** → Railway dashboard & logs

## 📞 Support

- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Docker Hub: [hub.docker.com](https://hub.docker.com)
- GitHub Actions: [docs.github.com/actions](https://docs.github.com/actions)

---

**Happy Coding! 🎉**