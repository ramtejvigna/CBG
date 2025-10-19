# CBG - Competitive Coding Battle Ground

A comprehensive full-stack competitive programming platform that enables developers to solve coding challenges, participate in contests, track progress, and compete with others in real-time. Built with modern web technologies and featuring Docker-based code execution, ranking systems, and comprehensive user profiles.

## 🚀 Project Overview

CBG (Competitive Coding Battle Ground) is designed to provide a complete competitive programming experience similar to platforms like LeetCode, HackerRank, or CodeChef. The platform offers:

- **Coding Challenges**: Browse and solve problems across various difficulty levels and categories
- **Live Contests**: Participate in timed programming contests with real-time leaderboards
- **Code Execution**: Secure Docker-based code execution environment supporting multiple languages
- **Progress Tracking**: Comprehensive user profiles with submission history, contest participation, and ranking
- **Social Features**: Activity feeds, user profiles, and community engagement
- **Admin Dashboard**: Contest creation, challenge management, and platform administration

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI + Custom components
- **State Management**: Zustand for global state
- **Authentication**: JWT-based custom authentication
- **Code Editor**: Monaco Editor (VS Code editor)
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation

### Backend (Server)
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with bcrypt
- **Code Execution**: Docker containers for secure code execution
- **File Processing**: Multer for file uploads
- **Email**: Nodemailer for password reset and notifications
- **Scheduling**: Node-cron for contest scheduling and ranking updates
- **Validation**: Zod schemas for API validation

### Infrastructure & DevOps
- **Database**: PostgreSQL (primary), Prisma for ORM
- **Code Execution**: Docker containers with language-specific images
- **File Storage**: Local filesystem (configurable for cloud storage)
- **Process Management**: PM2 for production deployment
- **Development**: Hot reloading, TypeScript compilation

## 📁 Project Structure

```
CBG/
├── client/                 # Next.js Frontend Application
│   ├── src/
│   │   ├── app/           # App Router Pages
│   │   │   ├── challenges/    # Challenge browsing and solving
│   │   │   ├── contests/      # Contest participation and leaderboards
│   │   │   ├── profile/       # User profiles and statistics
│   │   │   ├── rankings/      # Global and category rankings
│   │   │   ├── activity-feed/ # Social activity feed
│   │   │   ├── login/         # Authentication pages
│   │   │   └── api/           # API route handlers
│   │   ├── components/        # Reusable UI Components
│   │   │   ├── CodeEditor/    # Monaco-based code editor
│   │   │   ├── NavBar/        # Navigation components
│   │   │   ├── ui/            # Shadcn/ui components
│   │   │   └── ...
│   │   ├── context/           # React Context Providers
│   │   ├── hooks/             # Custom React Hooks
│   │   ├── lib/               # Utilities and Stores
│   │   └── types/             # TypeScript type definitions
│   ├── prisma/               # Client-side Prisma schema
│   ├── public/               # Static Assets
│   └── package.json
│
└── server/                   # Express.js Backend API
    ├── src/
    │   ├── controllers/      # API Route Controllers
    │   │   ├── authControllers.ts      # Authentication
    │   │   ├── challengeControllers.ts # Challenge management
    │   │   ├── contestControllers.ts   # Contest operations
    │   │   ├── executeControllers.ts   # Code execution
    │   │   ├── userControllers.ts      # User management
    │   │   └── ...
    │   ├── routes/           # Express Route Definitions
    │   ├── middleware/       # Express Middleware
    │   ├── lib/              # Server Utilities
    │   │   ├── dockerExecutor.ts      # Docker-based code execution
    │   │   ├── rankingSystem.ts       # User ranking calculations
    │   │   ├── contestScheduler.ts    # Contest lifecycle management
    │   │   ├── emailService.ts        # Email notifications
    │   │   └── prisma.ts              # Database connection
    │   └── types/            # TypeScript Types
    ├── prisma/               # Database Schema & Migrations
    │   ├── schema.prisma     # Database schema definition
    │   ├── seed.ts           # Database seeding script
    │   └── migrations/       # Database migration files
    ├── tests/                # Test Files
    ├── tmp/                  # Temporary files for code execution
    └── package.json
```

## ✨ Key Features

### 🏆 Competitive Programming
- **Challenge Library**: 100+ coding problems across multiple difficulty levels (Easy, Medium, Hard)
- **Categories**: Algorithms, Data Structures, Dynamic Programming, Graph Theory, and more
- **Multi-language Support**: JavaScript, Python, Java, C++, C, Go, and SQL
- **Real-time Code Execution**: Docker-based sandboxed execution environment
- **Test Cases**: Comprehensive test case validation with time and memory limits

### 🏁 Contest System
- **Live Contests**: Timed programming contests with real-time participant tracking
- **Contest Types**: Weekly contests, special events, and custom competitions
- **Leaderboards**: Real-time rankings during contests with point-based scoring
- **Contest History**: Track past contest performance and achievements
- **Registration System**: Contest registration with participant limits

### 👤 User Experience
- **Comprehensive Profiles**: Detailed user profiles with statistics, submission history, and contest participation
- **Progress Tracking**: Visual progress indicators, streak tracking, and achievement badges
- **Global Rankings**: Platform-wide ranking system based on problem-solving performance
- **Activity Feed**: Social feed showing recent activities and achievements
- **Submission History**: Complete history of code submissions with status and performance metrics

### 🎯 Platform Features
- **Responsive Design**: Mobile-first design that works across all devices
- **Dark/Light Theme**: Toggle between dark and light themes with persistent preference
- **Code Editor**: Full-featured Monaco Editor (VS Code) with syntax highlighting and autocomplete
- **Admin Dashboard**: Contest creation, challenge management, and platform administration
- **Email System**: Password reset, notifications, and contest announcements
- **Security**: JWT-based authentication, password hashing, and secure code execution

## 🚀 Quick Start

### Prerequisites

Before running this application, ensure you have the following installed:
- **Node.js** (v18.0.0 or higher)
- **PostgreSQL** (v13.0 or higher)
- **Docker** (for code execution environment)
- **Git** (for version control)
- **npm** or **yarn** (package manager)

### 1. Clone the Repository

```bash
git clone https://github.com/ramtejvigna/CBG.git
cd CBG
```

### 2. Database Setup

First, ensure PostgreSQL is running on your system, then create a database:

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE cbg_development;

# Create user (optional, you can use postgres user)
CREATE USER cbg_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cbg_development TO cbg_user;

# Exit PostgreSQL
\q
```

### 3. Server Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your configuration
nano .env  # or use your preferred editor
```

**Required Environment Variables for Server:**
```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/cbg_development"

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Email Configuration (for password reset)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="CBG Platform <noreply@cbg.com>"

# Docker Configuration (for code execution)
DOCKER_TIMEOUT=30
DOCKER_MEMORY_LIMIT="128m"
```

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database with sample data
npm run db:seed

# Start development server
npm run dev
```

The server will start on `http://localhost:3001`

### 4. Client Setup

Open a new terminal window/tab:

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local file
nano .env.local  # or use your preferred editor
```

**Required Environment Variables for Client:**
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Application Configuration
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL=http://localhost:3000

# Optional: Google OAuth (if implementing)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

```bash
# Start development server
npm run dev
```

The client will start on `http://localhost:3000`

### 5. Docker Setup (Code Execution)

The platform uses Docker for secure code execution. Ensure Docker is running and pull the required images:

```bash
# Pull language-specific Docker images
docker pull node:18-alpine           # For JavaScript
docker pull python:3.11-alpine      # For Python
docker pull openjdk:11-alpine        # For Java
docker pull gcc:latest               # For C/C++
docker pull golang:1.21-alpine      # For Go

# Verify Docker is working
docker run hello-world
```

### 6. Verify Installation

1. **Backend Health Check**: Visit `http://localhost:3001/api/health`
2. **Frontend**: Visit `http://localhost:3000`
3. **Database**: Check if you can register a new user
4. **Code Execution**: Try solving a simple challenge to test Docker execution

## 🔧 Development Workflow

### Running in Development Mode

```bash
# Terminal 1: Start PostgreSQL (if not already running)
sudo service postgresql start  # Linux
brew services start postgresql # macOS
# Or start PostgreSQL service on Windows

# Terminal 2: Start the backend server
cd server
npm run dev

# Terminal 3: Start the frontend
cd client  
npm run dev

# Terminal 4: Monitor Docker containers (optional)
docker ps -a
```

### Database Operations

```bash
cd server

# View database in Prisma Studio
npx prisma studio

# Reset database (WARNING: This will delete all data)
npx prisma migrate reset

# Apply pending migrations
npx prisma migrate dev

# Generate Prisma client after schema changes
npx prisma generate

# Seed database with sample data
npm run db:seed
```

### Code Execution Testing

Test the Docker-based code execution:

```bash
cd server

# Run the ranking test to verify Docker setup
npm test

# Or test individual components
node -e "const { dockerExecutor } = require('./build/src/lib/dockerExecutor.js'); dockerExecutor.execute('console.log(\"Hello World\")', 'javascript', '', 'Hello World', 5000, 128).then(console.log);"
```

## 🌐 API Documentation

### Authentication Endpoints
```
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout
POST   /api/auth/forgot-password   # Password reset request
POST   /api/auth/reset-password    # Password reset confirmation
GET    /api/auth/verify-token      # Token verification
```

### Challenge Endpoints
```
GET    /api/challenges             # Get all challenges (paginated)
GET    /api/challenges/:id         # Get challenge by ID
GET    /api/challenges/slug/:slug  # Get challenge by slug
POST   /api/challenges             # Create new challenge (admin)
PUT    /api/challenges/:id         # Update challenge (admin)
DELETE /api/challenges/:id         # Delete challenge (admin)
GET    /api/categories             # Get challenge categories
```

### Code Execution
```
POST   /api/execute                # Execute code with test cases
GET    /api/languages              # Get supported programming languages
```

### Contest Endpoints
```
GET    /api/contests               # Get all contests
GET    /api/contests/:id           # Get contest details
POST   /api/contests               # Create contest (admin)
POST   /api/contests/:id/register  # Register for contest
POST   /api/contests/submit        # Submit solution to contest
GET    /api/contests/upcoming      # Get upcoming contests
```

### User & Profile Endpoints
```
GET    /api/profile/:username           # Get user profile
GET    /api/profile/:username/submissions # Get user submissions
GET    /api/profile/:username/contests   # Get user contest history
GET    /api/profile/:username/activity   # Get user activity
GET    /api/leaderboard                 # Get global leaderboard
PUT    /api/users/:id/profile           # Update user profile
```

### Admin Endpoints
```
GET    /api/admin/users            # Get all users (admin)
GET    /api/admin/challenges       # Get challenge management data
GET    /api/admin/contests         # Get contest management data
POST   /api/admin/challenges       # Create challenge
PUT    /api/admin/challenges/:id   # Update challenge
DELETE /api/admin/challenges/:id   # Delete challenge
```

## 🗄️ Database Schema

### Core Models

**User Model**
```sql
- id: UUID (Primary Key)
- username: String (Unique)
- email: String (Unique)  
- password: String (Hashed)
- name: String
- image: String (Profile image URL)
- role: Enum (USER, ADMIN)
- isVerified: Boolean
- createdAt: DateTime
- updatedAt: DateTime
```

**Challenge Model**
```sql
- id: UUID (Primary Key)
- title: String
- slug: String (Unique)
- description: Text
- difficulty: Enum (EASY, MEDIUM, HARD)
- points: Integer
- timeLimit: Integer (seconds)
- memoryLimit: Integer (MB)
- categoryId: UUID (Foreign Key)
- tags: String[]
- isActive: Boolean
- createdAt: DateTime
- updatedAt: DateTime
```

**Contest Model**
```sql
- id: UUID (Primary Key)
- title: String
- description: Text
- startsAt: DateTime
- endsAt: DateTime
- registrationEnd: DateTime
- status: Enum (UPCOMING, REGISTRATION_OPEN, ONGOING, FINISHED)
- maxParticipants: Integer
- points: Integer
- tags: String[]
- createdAt: DateTime
- updatedAt: DateTime
```

**Submission Model**
```sql
- id: UUID (Primary Key)
- userId: UUID (Foreign Key)
- challengeId: UUID (Foreign Key)
- code: Text
- language: String
- status: Enum (ACCEPTED, WRONG_ANSWER, TIME_LIMIT_EXCEEDED, etc.)
- runtime: Integer (milliseconds)
- memory: Integer (KB)
- points: Integer
- createdAt: DateTime
```

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Role-Based Access**: User and Admin role separation
- **Token Expiration**: Configurable token lifetime
- **Password Reset**: Secure email-based password reset

### Code Execution Security
- **Docker Isolation**: Each code execution runs in isolated containers
- **Resource Limits**: CPU, memory, and time restrictions
- **Network Isolation**: No external network access during execution
- **File System Isolation**: Temporary file system for each execution
- **Input Sanitization**: All user inputs are validated and sanitized

### API Security
- **Rate Limiting**: Request rate limiting to prevent abuse
- **Input Validation**: Zod schema validation for all endpoints
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **SQL Injection Prevention**: Prisma ORM prevents SQL injection
- **XSS Protection**: Input sanitization and output encoding

## 🚢 Production Deployment

### Environment Setup

1. **Database**: Set up PostgreSQL database (recommended: AWS RDS, Google Cloud SQL, or DigitalOcean)
2. **Server Hosting**: Deploy to VPS, AWS EC2, DigitalOcean Droplet, or similar
3. **Frontend Hosting**: Deploy to Vercel, Netlify, or static hosting
4. **Docker**: Ensure Docker is installed on production server

### Build for Production

```bash
# Build backend
cd server
npm run build
npm run start

# Build frontend
cd client
npm run build
npm run start
```

### Production Environment Variables

**Server Production .env:**
```env
DATABASE_URL="postgresql://user:password@prod-db-host:5432/cbg_production"
PORT=3001
NODE_ENV=production
JWT_SECRET="your-production-jwt-secret"
EMAIL_HOST="your-smtp-host"
EMAIL_PORT=587
EMAIL_USER="your-production-email"
EMAIL_PASS="your-production-password"
DOCKER_TIMEOUT=30
DOCKER_MEMORY_LIMIT="256m"
```

**Client Production .env.local:**
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXTAUTH_SECRET="your-production-nextauth-secret"
NEXTAUTH_URL=https://your-app-domain.com
```

### PM2 Process Management

```bash
# Install PM2 globally
npm install -g pm2

# Start applications with PM2
cd server
pm2 start ecosystem.config.js

# Monitor applications
pm2 monit

# Restart applications
pm2 restart all
```

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test

# Run specific test suites
npm test -- --grep "authentication"
npm test -- --grep "code-execution"
```

### Test Coverage

```bash
# Generate test coverage report
cd server
npm run test:coverage

cd client
npm run test:coverage
```

## 🤝 Contributing

We welcome contributions to the CBG platform! Here's how you can contribute:

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch**: `git checkout -b feature/your-feature-name`
4. **Make your changes** following the coding standards
5. **Add tests** for new functionality
6. **Run tests** to ensure everything works
7. **Commit your changes**: `git commit -m "Add your feature"`
8. **Push to your fork**: `git push origin feature/your-feature-name`
9. **Create a Pull Request** on GitHub

### Coding Standards

- **TypeScript**: Use TypeScript for all new code
- **ESLint**: Follow the existing ESLint configuration
- **Prettier**: Use Prettier for code formatting
- **Conventional Commits**: Use conventional commit messages
- **Testing**: Add tests for new features and bug fixes

### Areas for Contribution

- **New Programming Languages**: Add support for additional languages
- **Challenge Categories**: Create new problem categories and challenges
- **UI/UX Improvements**: Enhance the user interface and experience
- **Performance Optimization**: Optimize database queries and API responses
- **Mobile App**: React Native mobile application
- **Advanced Features**: AI-powered hints, collaborative solving, etc.

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 CBG Platform

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 📞 Support

If you encounter any issues or have questions:

1. **GitHub Issues**: Open an issue on the GitHub repository
2. **Documentation**: Check the documentation in the `/docs` folder
3. **Community**: Join our Discord community (link coming soon)
4. **Email**: Contact us at support@cbg-platform.com

## 🎯 Roadmap

### Upcoming Features

- [ ] **Mobile Application**: React Native mobile app
- [ ] **AI Integration**: AI-powered code suggestions and hints
- [ ] **Collaborative Solving**: Team-based problem solving
- [ ] **Interview Mode**: Mock interview simulation
- [ ] **Company Challenges**: Company-sponsored coding challenges
- [ ] **Certification System**: Skill-based certifications
- [ ] **Live Streaming**: Stream coding sessions
- [ ] **Code Review**: Peer code review system
- [ ] **Advanced Analytics**: Detailed performance analytics
- [ ] **Multi-tenant**: Support for organizations and schools

### Version History

- **v1.0.0** (Current): Core platform with challenges, contests, and user profiles
- **v0.9.0**: Contest system and real-time leaderboards
- **v0.8.0**: User profiles and activity tracking
- **v0.7.0**: Docker-based code execution
- **v0.6.0**: Authentication and user management
- **v0.5.0**: Basic challenge system

---

**Built with ❤️ by the CBG Team**

*Happy Coding! 🚀*