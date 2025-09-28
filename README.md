# CBG - Coding Challenge Platform

A full-stack coding challenge platform built with Next.js, Express, and PostgreSQL.

## Project Structure

```
CBG/
├── client/          # Next.js frontend application
│   ├── src/
│   │   ├── app/     # App router pages
│   │   ├── components/ # Reusable components
│   │   ├── context/ # React contexts
│   │   ├── hooks/   # Custom hooks
│   │   └── lib/     # Utilities and stores
│   ├── prisma/     # Client-side Prisma schema
│   └── public/     # Static assets
└── server/         # Express backend API
    ├── src/
    │   ├── controllers/ # API controllers
    │   ├── routes/     # API routes
    │   ├── middleware/ # Express middleware
    │   ├── lib/        # Server utilities
    │   └── types/      # TypeScript types
    ├── prisma/        # Database schema and migrations
    └── build/         # Compiled TypeScript output
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CBG
```

### 2. Server Setup

```bash
cd server

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your database URL and other configurations

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with sample data
npm run db:seed

# Start the development server
npm run dev
```

The server will start on `http://localhost:3001`

### 3. Client Setup

```bash
cd ../client

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env.local
# Edit .env.local with your API URL and authentication credentials

# Start the development server
npm run dev
```

The client will start on `http://localhost:3000`

## Environment Variables

### Server (.env)

- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `JWT_SECRET`: Secret for JWT token signing
- `NEXTAUTH_SECRET`: Secret for NextAuth (if using)
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

### Client (.env.local)

- `NEXTAUTH_SECRET`: Secret for NextAuth
- `NEXTAUTH_URL`: Your application URL (http://localhost:3000)
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `NEXT_PUBLIC_API_URL`: Backend API URL (http://localhost:3001)

## Features

- **Challenge Management**: Create, view, and manage coding challenges
- **Code Execution**: Run and test code solutions (mock implementation)
- **User Authentication**: Google OAuth integration with NextAuth
- **Submissions Tracking**: Track user submissions and progress
- **Multi-language Support**: Support for JavaScript, Python, Java, C++, SQL
- **Categories**: Organize challenges by algorithms, data structures, databases
- **Responsive UI**: Modern, dark/light theme support

## API Endpoints

### Challenges
- `GET /api/challenges` - Get all challenges
- `GET /api/challenges/:id` - Get challenge by ID
- `GET /api/challenges/slug/:slug` - Get challenge by slug
- `GET /api/challenges/submissions?challengeId=&userId=` - Get submissions

### Code Execution
- `POST /api/execute` - Execute code with test cases

### Languages
- `GET /api/languages` - Get supported programming languages

## Database Schema

The application uses PostgreSQL with Prisma ORM. Key models include:

- **User**: User accounts and profiles
- **Challenge**: Coding challenges
- **TestCase**: Test cases for challenges
- **Submission**: User code submissions
- **Language**: Supported programming languages
- **ChallengeCategory**: Challenge categories

## Development

### Running Tests

```bash
# Server tests
cd server
npm test

# Client tests  
cd client
npm test
```

### Building for Production

```bash
# Build server
cd server
npm run build
npm start

# Build client
cd client
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.