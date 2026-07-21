# Marvira Platform

Location-based scavenger hunt platform â€” **NestJS API** + **Next.js admin dashboard**.

> Mobile app lives in a separate project. Point it at `http://localhost:3001`.

## Architecture

```
apps/
  api/          NestJS backend (PostgreSQL, optional Redis)
  dashboard/    Next.js 15 admin dashboard
packages/
  shared-types/ Shared TypeScript types
  shared-utils/ Shared utilities (geo, pagination)
```

## Prerequisites (Windows, no Docker)

- Node.js 22+
- pnpm 9+
- PostgreSQL 17+ ([download](https://www.postgresql.org/download/windows/))

Redis is **optional** for local dev (`REDIS_DISABLED=true` uses in-memory cache).

## Quick Start (Windows)

### 1. Install PostgreSQL

```cmd
winget install PostgreSQL.PostgreSQL.17 --accept-package-agreements
```

During install, set superuser password to `marvira` (or update `apps/api/.env`).

### 2. Create database

```cmd
set PATH=C:\Program Files\PostgreSQL\17\bin;%PATH%
set PGPASSWORD=marvira
psql -U postgres -h localhost -c "CREATE DATABASE marvira;"
```

Or run the setup script:

```cmd
scripts\setup-windows.cmd
```

### 3. Install & migrate

```cmd
pnpm install
pnpm --filter @marvira/shared-types build
pnpm --filter @marvira/shared-utils build
pnpm --filter @marvira/api exec prisma migrate deploy
pnpm db:seed
```

### 4. Run dev servers

Open **two terminals** from the project root (`marvira_dashboard_api`):

**Terminal 1 â€” API (port 3001):**

```powershell
cd d:\work\projects\marvira_dashboard_api
pnpm dev:api
```

Wait until you see: `Nest application successfully started` and `API running on http://localhost:3001`

**Terminal 2 â€” Dashboard (port 3000):**

```powershell
cd d:\work\projects\marvira_dashboard_api
pnpm dev:dashboard
```

Wait until you see: `Local: http://localhost:3000`

| Service   | URL                          |
|-----------|------------------------------|
| Dashboard | http://localhost:3000        |
| Login     | http://localhost:3000/login  |
| API       | http://localhost:3001        |
| Swagger   | http://localhost:3001/docs   |

**Admin:** `admin@marvira.com` / `admin123`  
**Demo user:** `demo@marvira.com` / `demo123`

---

## Starting & Stopping Servers

### Start (every day)

1. Ensure **PostgreSQL** is running (Windows service or pgAdmin).
2. Open two terminals and run `pnpm dev:api` and `pnpm dev:dashboard` (see Quick Start above).
3. Open http://localhost:3000/login in your browser.

### Check server status

**PowerShell â€” quick health check:**

```powershell
# API
Invoke-WebRequest -Uri "http://localhost:3001/events" -UseBasicParsing

# Dashboard
Invoke-WebRequest -Uri "http://localhost:3000/login" -UseBasicParsing
```

Both should return **StatusCode 200**. If you get a connection error, that service is not running.

**Check which process is using the ports:**

```powershell
Get-NetTCPConnection -LocalPort 3000,3001 -State Listen -ErrorAction SilentlyContinue |
  Select-Object LocalPort, OwningProcess
```

### Stop servers

Press `Ctrl+C` in each terminal running `dev:api` or `dev:dashboard`.

Or kill by port (PowerShell):

```powershell
# Stop API (3001)
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Stop Dashboard (3000)
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### Restart after code changes

Usually hot-reload is enough. If the dashboard shows **404**, blank pages, or module errors:

```powershell
# 1. Stop dashboard (Ctrl+C or kill port 3000)
# 2. Clear Next.js cache
Remove-Item -Recurse -Force apps\dashboard\.next

# 3. Start again
pnpm dev:dashboard
```

If the API fails with `EADDRINUSE` on port 3001, kill the old process (see above) then run `pnpm dev:api` again.

### Run manual smoke tests

With both servers running:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\manual-test.ps1
```

---

Copy `.env.example` â†’ `apps/api/.env`:

```env
DATABASE_URL=postgresql://postgres:marvira@localhost:5432/marvira?schema=public
REDIS_DISABLED=true
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

Dashboard: `apps/dashboard/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## API Endpoints

- `POST /auth/register` â€” Create account (email/password)
- `POST /auth/login` â€” Login
- `POST /auth/forgot-password` â€” Request password reset email
- `POST /auth/reset-password` â€” Set new password with reset token
- `POST /auth/google` â€” Google SSO (idToken or dev profile)
- `POST /auth/facebook` â€” Facebook SSO (accessToken or dev profile)
- `POST /auth/apple` â€” Apple SSO (identityToken or dev profile)
- `GET /events` â€” List events
- `GET /events/nearby?latitude=&longitude=` â€” Nearby events
- `GET /events/:id/places` â€” Event places
- `POST /places/:id/unlock` â€” GPS unlock
- `GET /admin/analytics` â€” Dashboard analytics

Full docs: http://localhost:3001/docs

## Mobile App Integration

```
API_URL=http://localhost:3001
USE_MOCK_API=false
```

## Database Commands

```cmd
pnpm db:generate   REM Prisma client
pnpm db:migrate    REM Dev migrations
pnpm db:seed       REM Seed demo data
pnpm db:reset      REM Reset database
```

## Docker (optional)

Docker is **not required**. For production or teams that prefer containers:

```cmd
docker compose -f docker/docker-compose.yml up --build
```

## Testing

```cmd
pnpm test
pnpm --filter @marvira/api test
```
