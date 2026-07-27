# Marvira — architecture (1 page)

High-level map for engineers. Details live in each package README and `requirement_all.txt` §14–24.

## Repos / folders

```
marvira/
├── marvira_mobile/              # React Native 0.85 — players & creators
└── marvira_dashboard_api/       # Turborepo
    ├── apps/api/                # NestJS + Prisma + PostgreSQL
    ├── apps/dashboard/          # Next.js admin
    ├── apps/marketing/          # Next.js public site
    └── packages/                # shared-types, shared-utils, …
```

Mobile is **separate** from the API Turborepo. Point the app at the API base URL (local default `http://localhost:3001`).

## Runtime diagram

```
┌─────────────────┐     HTTPS/JWT      ┌──────────────────┐
│ marvira_mobile  │ ─────────────────► │ apps/api (Nest)  │
│  Maps + GPS     │                    │  Prisma / PG     │
│  Firebase       │ ── Analytics ────► │  optional Redis  │
└─────────────────┘    Crashlytics     └────────┬─────────┘
                                               │
         ┌─────────────────────────────────────┼─────────────────────┐
         ▼                                     ▼                     ▼
┌─────────────────┐                  ┌─────────────────┐   ┌─────────────────┐
│ apps/dashboard  │                  │ apps/marketing  │   │ Uploads / S3    │
│ Admin / Staff   │                  │ www + invites   │   │ images          │
└─────────────────┘                  └─────────────────┘   └─────────────────┘
```

## Domain model (simplified)

| Concept | Meaning |
|---------|---------|
| **Event** | A hunt (city, difficulty, places, optional password, gifts) |
| **Place** | Ordered stop with lat/lng, radius, one **Question** |
| **Question** | Bank item: TEXT / TRUE_FALSE / MULTIPLE_CHOICE / IMAGE |
| **Progress** | Per-user event state: started, places done, score, duration |
| **Access** | Password join grant for private events |
| **Practice** | Standalone community questions (not tied to a hunt place) |

## Critical gameplay path (API)

1. `POST /places/:id/unlock` — GPS within `radius_meters` (+ play access check)
2. `GET /places/:id/question` — question without answer
3. `POST /places/:id/answer` — grade; on success return `nextPlaceId` / completion
4. Server enforces linear order and `assertCanPlay` (password / suspension)

Dashboard may show **all** places for editing; mobile play stays sequential.

## Auth & roles

- JWT sessions (access + refresh) on API
- Roles: `USER`, `STAFF`, `ADMIN`
- Creators manage **own** events (`createdBy`); admins broader access
- Google OAuth supported in stack; Apple placeholder historically noted in requirements

## Data stores

| Store | Use |
|-------|-----|
| PostgreSQL + PostGIS-style geo | Users, events, places, progress, practice, feedback |
| Redis (optional locally) | Cache / queues; can disable for Windows dev |
| File uploads or S3/CDN | Question / event images |
| Firebase (mobile) | Product analytics + Crashlytics — not a substitute for API DB |

## Admin vs product analytics

- **Admin `/dashboard/analytics`**: ops (completions, engagement, practice stats). “Active users” ≈ hunt starts in 30d, **not** MAU.
- **Firebase (mobile)**: product MAU / funnels / crashes. Spec: `requirement_all.txt` §24.

## Local ports (typical)

| Service | Port |
|---------|------|
| API | `3001` |
| Dashboard | Next default (often `3000`) |
| Marketing | separate Next app port (see marketing README) |
| PostgreSQL | `5432` |

## Where to go deeper

| Topic | Doc |
|-------|-----|
| Features / flows | [PRODUCT_OVERVIEW.md](./PRODUCT_OVERVIEW.md) |
| Run API + admin | `marvira_dashboard_api/README.md` |
| Run mobile | `marvira_mobile/README.md` |
| Deploy / backup | `marvira_dashboard_api/docs/*.md` |
| Firebase | `marvira_mobile/FIREBASE_SETUP.md` |
| Full acceptance | `requirement_all.txt` (RECOVERY + §14–24) |
