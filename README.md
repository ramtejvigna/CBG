# CBG - Competitive Coding Battle Ground

A full-stack competitive programming platform. Solve coding challenges, take part in timed contests, track your progress and climb a live leaderboard. Submitted code runs in isolated Docker containers.

## 🚀 Quick Start

The only thing you need is **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**. No Node.js, PostgreSQL or Redis on your machine.

```bash
git clone https://github.com/ramtejvigna/CBG.git
cd CBG
docker compose up --build
```

The first run takes several minutes (it downloads images and builds the code-execution sandbox). Later runs start in under a minute.

| What | URL |
|---|---|
| App | http://localhost:3000 |
| API health | http://localhost:5000/health |
| Admin panel | http://localhost:3000/adminYmAF8aMHrK/login |
| PostgreSQL | `localhost:5433` (user `cbg`, password `cbg`, database `cbg`) |
| Redis | `localhost:6379` |

Sample categories, challenges and an admin account are created on first start. Admin login: **`admin@cbg.com`** with the password `LocalAdmin-ChangeMe1` (change it with `SEED_ADMIN_PASSWORD`).

Everything is configurable but nothing is required. See **[SETUP.md](SETUP.md)** for the full guide: configuration, Google sign-in, password-reset emails, everyday commands and troubleshooting.

## 🛠️ Tech Stack

### Frontend (`client/`)
- **Next.js 15** (App Router, Turbopack) with **React 19** and TypeScript
- **Tailwind CSS 4**, Radix UI, Framer Motion, Lucide icons
- **Zustand** for state, **NextAuth** for sign-in (email and password, Google)
- **Monaco Editor** for the code editor

### Backend (`server/`)
- **Express 5** with TypeScript
- **PostgreSQL** with **Prisma 6**
- **Redis** (ioredis) for cached sessions and like counts
- **WebSocket** (`ws`) for live leaderboard updates at `/ws/leaderboard`
- **Docker** for sandboxed code execution
- `express-rate-limit`, Nodemailer (password reset), `google-auth-library` (Google ID-token verification)

### Authentication
Sessions are opaque random tokens stored in the database and sent as `Authorization: Bearer <token>`. Google sign-in sends Google's ID token, which the API verifies before creating a session.

## 📁 Project Structure

```
CBG/
├── docker-compose.yml        # Local development stack (db, redis, sandbox, api, web)
├── docker/Dockerfile.dev     # Shared Node image for the api and web containers
├── SETUP.md                  # Detailed local setup guide
├── .env.example              # Optional overrides for docker compose
│
├── client/                   # Next.js frontend
│   └── src/
│       ├── app/              # Pages: challenges, contests, profile, rankings,
│       │                     #   submissions, settings, activity-feed, admin panel, api/auth
│       ├── components/       # CodeEditor, NavBar, profile widgets, UI primitives
│       ├── context/  hooks/  # React contexts and custom hooks
│       └── lib/              # API helpers and Zustand stores
│
├── server/                   # Express API (used for local development)
│   ├── src/
│   │   ├── controllers/      # auth, challenges, contests, execute, users, admin ...
│   │   ├── routes/           # Route definitions
│   │   ├── middleware/       # Authentication and rate limiting
│   │   └── lib/              # dockerExecutor, rankingSystem, contestScheduler,
│   │                         #   redis, sessionCache, leaderboardSocket, emailService
│   ├── prisma/               # schema.prisma, migrations, seed.ts
│   └── Dockerfile.sandbox    # Image that runs submitted code
│
├── lambda-api/               # AWS Lambda version of the API (deployment option)
├── code-execution-service/   # Standalone execution service for EC2 (used with Lambda)
├── scripts/                  # AWS deployment scripts
└── docker-compose.railway.yml
```

## ✨ Features

### Challenges
- Browse by difficulty (Easy, Medium, Hard) and category, with search
- Monaco editor with starter code, run against visible tests, submit against all tests
- Verdicts: Accepted, Wrong Answer, Time Limit, Memory Limit, Runtime Error, Compilation Error
- Submission history, with a detail page for each submission showing code and per-test results
- Like and dislike counts

### Code execution
- Languages in the sandbox: JavaScript, TypeScript, Python, Java, C, C++, Go, Rust, Ruby
- Each run starts a throwaway container with no network, capped memory, CPU and processes, and only its own folder mounted
- The seed enables JavaScript, Python and Java on the sample challenges. Sample SQL challenges are included, but there is no SQL engine in the sandbox yet.

### Contests
- Registration with participant limits, timed rounds and per-challenge points
- Contest leaderboard, and a scheduler that moves contests through their lifecycle

### Users and community
- Profiles with points, level, streaks, a streak heatmap, badges and contest history
- Global rankings that update live over WebSocket
- Activity feed, notification, security and preference settings
- Admin panel for users, challenges and contests

## 🔧 Development

Everything runs through Docker Compose. Your source folders are mounted into the containers, so edits apply immediately (the API restarts, the web app hot reloads).

```bash
docker compose up -d                        # start in the background
docker compose logs -f api                  # follow logs (api, web, db, redis)
docker compose restart api                  # restart one service
docker compose exec api npx prisma studio   # browse the database
docker compose exec db psql -U cbg cbg      # SQL shell
docker compose run --rm api-setup           # reinstall deps, migrate, seed
docker compose down                         # stop
docker compose down -v                      # stop and wipe all data (fresh start)
```

After changing `server/prisma/schema.prisma`:

```bash
docker compose exec api npx prisma migrate dev --name describe_the_change
```

Type-check and lint before opening a PR:

```bash
docker compose exec api npx tsc --noEmit
docker compose exec web npx tsc --noEmit
docker compose exec web npm run lint
```

## 🌐 API Overview

All routes are under the API base URL (`http://localhost:5000`). Routes marked 🔒 need a login, 👑 need an admin.

**Auth** (`/api/auth`)
```
POST  /signup  /login  /logout  /google
POST  /forgot-password  /reset-password  /validate-reset-token
POST  /complete-onboarding 🔒       GET  /me 🔒
```

**Challenges, categories, languages**
```
GET   /api/challenges  /home  /slug/:slug  /:id  /:id/stats
POST  /api/challenges 👑           PUT  /api/challenges/:id 👑
POST  /api/challenges/:id/like 🔒
GET   /api/categories  /:id        POST /api/categories 👑
GET   /api/languages 🔒            POST /api/languages 👑
```

**Code execution and submissions**
```
POST  /api/execute 🔒                   # run or submit code
GET   /api/submissions 🔒               # your submissions
GET   /api/submissions/:id 🔒           # one submission (owner or admin)
```

**Contests**
```
GET   /api/contests  /upcoming  /:id
POST  /api/contests/:id/register 🔒     GET /api/contests/:id/registration-status 🔒
POST  /api/contests/submit 🔒           POST /api/contests/create 👑
```

**Users and profiles**
```
GET   /api/profile/:username  /ranking  /heatmap
GET   /api/profile/:username/activity  /submissions  /contests 🔒
GET   /api/leaderboard     GET /api/statistics     GET /api/search?q=
PUT   /api/profile 🔒      GET /api/:userId/image  GET /api/me/image 🔒
GET|PUT /api/settings/notifications  /security  /preferences 🔒
GET   /api/activity  /activity/recent 🔒
```

**Admin** (`/api/admin`, 👑 except login)
```
POST  /login          GET /profile
GET   /dashboard/stats  /dashboard/activities  /dashboard/system-status
GET   /users          PUT /users/:id    PATCH /users/:id/ban    DELETE /users/:id
GET   /challenges  /challenges/stats    DELETE /challenges/:id
GET   /contests    /contests/stats      PUT|DELETE /contests/:id
```

**Live leaderboard:** WebSocket at `ws://localhost:5000/ws/leaderboard`.

## 🗄️ Data Model

Defined in [`server/prisma/schema.prisma`](server/prisma/schema.prisma).

| Area | Models |
|---|---|
| Users | `User`, `UserProfile`, `Session`, `Account`, `PasswordResetToken`, `AdminLead`, `Badge` |
| Settings | `NotificationSettings`, `SecuritySettings`, `UserPreferences` |
| Challenges | `Challenge`, `ChallengeCategory`, `TestCase`, `Language`, `ChallengeLike`, `ChallengeAttempt` |
| Submissions | `Submission` (status, runtime, memory, per-test results) |
| Contests | `Contest`, `ContestChallenge`, `ContestParticipant`, `ContestSubmission` |
| Feed | `Activity` |

## 🔒 Security

- Passwords are hashed with bcrypt. Reset tokens are hashed and single use, and a reset ends all sessions.
- Google sign-in is verified server-side against the Google ID token.
- Sandbox: no network, memory, CPU and process limits, non-root user, one isolated folder per run.
- Rate limits on auth, search, admin and code execution.
- Submissions are only visible to their owner or an admin.

### Known gaps
A code audit lists what is still open. The most important items:
- Contest points are re-awarded when an accepted solution is resubmitted.
- Execution results include the input and expected output of hidden test cases.
- The sandbox has no host-side timeout or concurrency cap, and the API container has access to the Docker socket. Fine for local development, but do not expose it publicly as is.
- Challenge descriptions are rendered as raw HTML.
- The Express API and the Lambda API expose different sets of routes, so the AWS deployment does not yet match local behaviour.

## 🚢 Deployment

Local development uses Docker Compose as above. Two deployment layouts exist in the repo, both less maintained than the local setup:

- **Container hosting** (for example Railway): `docker-compose.railway.yml` and `railway.json`, built from `server/Dockerfile` and `client/Dockerfile`.
- **AWS**: `lambda-api/` (Serverless Framework) behind API Gateway, with `code-execution-service/` on EC2. See `scripts/`.

For any deployment set strong secrets (`NEXTAUTH_SECRET`, `SEED_ADMIN_PASSWORD`), use a managed PostgreSQL that requires TLS, and set `GOOGLE_CLIENT_ID` on the API if you use Google sign-in.

## 🧪 Testing

There is no automated test suite yet. Use the type-check and lint commands above, and try the flows by hand: sign up, solve a challenge, open the submission, and check the leaderboard.

## 🤝 Contributing

1. Fork the repository and create a branch: `git checkout -b feature/your-feature`
2. Make your change, following the existing TypeScript and ESLint style
3. Run the type-check and lint commands
4. Commit with a clear message and open a Pull Request

Good areas to help: a test suite, the audit's open items, more challenges and languages, and UI polish.

## 🎯 Roadmap

- [ ] Automated tests and CI checks on pull requests
- [ ] Fix the open audit items (contest scoring, hidden tests, sandbox limits)
- [ ] One API for local and hosted deployments
- [ ] SQL execution engine for database challenges
- [ ] Mobile app
- [ ] AI hints, team solving and interview mode

## 📄 License

No license file has been added to the repository yet.

---

**Built with ❤️ by the CBG Team**
