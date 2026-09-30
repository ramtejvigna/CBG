# CBG Local Setup (Docker only)

Everything runs in containers: PostgreSQL, Redis, the API, the web app and the sandbox that runs submitted code. The only thing you install is **Docker Desktop**. No Node.js, PostgreSQL or Redis on your machine.

## Start

```bash
docker compose up --build
```

The first run takes several minutes (it downloads images and builds the code-execution sandbox). Later runs start in under a minute. When you see the API and web app logging, open:

| What | URL |
|---|---|
| App | http://localhost:3000 |
| API health | http://localhost:5000/health |
| Admin panel | http://localhost:3000/adminYmAF8aMHrK/login |
| Database (any SQL client) | `localhost:5433`, user `cbg`, password `cbg`, database `cbg` |
| Redis | `localhost:6379` |

Sample challenges, categories and an admin are created automatically. The admin login is **`admin@cbg.com`** with the password `LocalAdmin-ChangeMe1` (change it in `.env`, see below).

Stop with `Ctrl+C`. To run in the background use `docker compose up -d`, and `docker compose down` to stop it. Your data survives restarts.

## What runs

| Service | Role |
|---|---|
| `db` | PostgreSQL 16, data kept in the `pgdata` volume |
| `redis` | Cache for like counts and sessions. Holds no durable data, so losing it is harmless. |
| `sandbox` | Builds the `code-execution-sandbox` image and exits |
| `api-setup` | Installs dependencies, applies migrations and seeds data, then exits |
| `api` | Express server on port 5000, restarts when you edit `server/src` |
| `web` | Next.js dev server on port 3000, hot reloads when you edit `client/src` |

Your source code is mounted into the containers, so edits on your machine apply immediately. Dependencies live in Docker volumes, not in your project folders.

## Configuration (optional)

Every setting has a working default. To change any, copy the example and edit it:

```bash
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
```

| Variable | Purpose |
|---|---|
| `SEED_ADMIN_PASSWORD` | Password for `admin@cbg.com` (min 12 chars). Applies when the database is first seeded. |
| `WEB_PORT`, `API_PORT`, `DB_PORT`, `REDIS_PORT` | Change if a port is already used on your machine. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Enable "Sign in with Google" (see below). |
| `EMAIL_USER`, `EMAIL_PASS` | Enable password-reset emails. |

The old `server/.env`, `client/.env` and `client/.env.local` files are **not used** by Docker: the values in `docker-compose.yml` and `.env` take precedence, so nothing points at a remote database by accident.

## Google sign-in (optional)

1. In Google Cloud Console, go to APIs & Services, then Credentials, then Create OAuth client ID (Web application).
2. Add the redirect URI `http://localhost:3000/api/auth/callback/google`.
3. Put the client ID and secret in `.env`, then restart with `docker compose up -d`.

One client ID is shared by the web app and the API. The API verifies Google's ID token against it.

## Everyday commands

```bash
docker compose logs -f api            # follow the API logs (or: web, db)
docker compose restart api            # restart one service
docker compose exec api npx prisma studio   # browse the database
docker compose exec db psql -U cbg cbg      # SQL shell
docker compose exec redis redis-cli         # Redis shell
docker compose run --rm api-setup     # re-run install + migrations + seed
docker compose down -v                # stop AND wipe the database and caches (fresh start)
```

After you edit `server/prisma/schema.prisma`, create a migration with:

```bash
docker compose exec api npx prisma migrate dev --name describe_the_change
```

## Caching

Redis caches two things. Postgres stays the source of truth for both, and the API keeps working if Redis is down (it just reads from Postgres instead).

- **Challenge like/dislike totals.** Previously every challenge page view ran two `COUNT(*)` queries. Totals are now read from Redis and rewritten after each vote, so they cannot drift.
- **Sessions.** The cache used to live in each API process, which meant a logout or role change on one instance stayed invisible to the others until the entry expired. In Redis it is shared, so revocation takes effect everywhere at once.

To watch it work: `docker compose exec redis redis-cli --raw KEYS 'challenge:*'`

## How code execution works

When you press Run or Submit, the API starts a short-lived sandbox container through your Docker Desktop (the API container has the Docker socket mounted). Each run has no network, capped memory, CPU and processes, and only sees its own folder of a shared volume. Docker Desktop must be running for this to work.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `port is already allocated` | Set another port in `.env` (`WEB_PORT`, `API_PORT` or `DB_PORT`). |
| Web page loads but login fails | Wait until `docker compose ps` shows `api` as healthy, then retry. |
| Run/Submit fails immediately | Docker Desktop is stopped, or the sandbox image is missing. Run `docker compose build sandbox`. |
| Dependencies look stale after pulling changes | `docker compose run --rm api-setup`, then `docker compose restart web`. |
| Changes to code don't show up | Check `docker compose logs -f web`. Polling is on, so edits may take a second or two. |
| Want a clean slate | `docker compose down -v`, then `docker compose up --build`. |
| A change to `.env` has no effect | Run `docker compose up -d`, not `restart`. Variables are fixed when a container is created. |
| Like counts look wrong | `docker compose restart redis`. Totals are recomputed from Postgres on the next read. |
| Google login says "Invalid Google token" | `GOOGLE_CLIENT_ID` is missing or wrong in `.env`. |

## Known limits

Some pages don't work yet, even with a correct setup. Profile and rankings call routes that were commented out in the Express server, and `/api/user/stats` exists in no backend. These are tracked as B1 in the audit report.

## Not needed locally

`lambda-api/`, `code-execution-service/`, `scripts/`, `setup-local.*` and `docker-compose.railway.yml` are for deployment or the older non-Docker setup. Ignore them for local work.
