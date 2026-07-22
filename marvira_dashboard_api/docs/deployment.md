# Marvira Production Deployment

## Prerequisites

- PostgreSQL 16+ with PostGIS (optional; haversine fallback available)
- Redis 7+ (required in production for rate limits, cache, job queues)
- Node.js 22, pnpm 9
- TLS-terminated load balancer (ALB, nginx, or Cloudflare)

## Secrets (never commit to git)

Set via platform env vars or secrets manager:

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Include `connection_limit=20` for pooled connections |
| `REDIS_URL` | Required; do **not** set `REDIS_DISABLED` in production |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Min 32 random chars each |
| `OAUTH_DEV_BYPASS` | Must be `false` |
| `AWS_*` / `S3_BUCKET` / `CDN_URL` | For image uploads at scale |
| `SENTRY_DSN` | Optional error tracking |

Rotate seed demo passwords (`demo123`, `admin123`) before public launch.

## API deploy

```bash
pnpm install
pnpm --filter @marvira/api exec prisma migrate deploy
pnpm --filter @marvira/api build
pnpm --filter @marvira/api start:prod
```

Docker: `docker/api.Dockerfile` runs migrations via `docker/entrypoint.sh`.

Health probes:

- Liveness: `GET /health`
- Readiness: `GET /ready` (DB + Redis + required schema columns from latest migrations)
- Metrics: `GET /metrics` (Prometheus text; restrict by network in prod)

## Dashboard deploy

```bash
# apps/dashboard/.env.production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_CDN_URL=https://cdn.yourdomain.com   # when using S3/CloudFront
```

```bash
pnpm --filter @marvira/dashboard build
pnpm --filter @marvira/dashboard start
```

## Marketing site deploy

```bash
# apps/marketing/.env.production (or Docker build args)
NEXT_PUBLIC_SITE_URL=https://www.yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_CDN_URL=https://cdn.yourdomain.com
NEXT_PUBLIC_APP_STORE_URL=
NEXT_PUBLIC_PLAY_STORE_URL=
```

```bash
pnpm --filter @marvira/marketing build
pnpm --filter @marvira/marketing start
```

Docker Compose includes `marketing` on port **3002** (`docker/marketing.Dockerfile`).

Set `CORS_ORIGIN` on the API to a comma-separated list of browser origins (dashboard + marketing), e.g. `https://admin.yourdomain.com,https://www.yourdomain.com`.

## Horizontal scaling

```
[Mobile] â†’ HTTPS â†’ [Load balancer] â†’ [API x N] â†’ [Redis]
                                      â†“
                               [PostgreSQL + PostGIS]
                                      â†“
                               [S3 / CDN uploads]
```

- 2+ stateless API replicas behind the load balancer
- Shared Redis and Postgres
- WebSocket / Socket.IO **not required** for v1 (REST gameplay only)

## Mobile release

- Android: configure `key.properties`, `API_BASE_URL` production HTTPS
- iOS: generate native project on Mac (`marvira_mobile/ios/README.md`); Android-first launch is acceptable
