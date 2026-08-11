# Marvira — third-party services

Quick inventory of vendors / platforms the project uses (or is wired for).  
Secrets live in hosting env / Codemagic — never in git. See also [`release_credentials.txt`](../release_credentials.txt).

Update the **Provider** column when you switch vendors.

| Area | Role | Provider | Notes / where configured |
|------|------|----------|---------------------------|
| **App hosting** | Deploy API, dashboard, marketing | **Railway** | `railway.*.toml`, custom domains `api` / `dashboard` / `www` |
| **Database** | PostgreSQL (+ optional PostGIS) | **Neon** | `DATABASE_URL`; Prisma in `apps/api` |
| **Cache / queues** | Redis — cache, rate limits, BullMQ (FCM worker) | **Upstash** | `REDIS_URL`; required in prod (`REDIS_DISABLED` only for local) |
| **Maps** | Mobile map + dashboard place picker | **Mapbox** | Mobile `MAPBOX_ACCESS_TOKEN`; dashboard `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` |
| **Email** | Password reset / transactional | **Resend** (preferred on Railway) | `RESEND_API_KEY`; SMTP/Gmail is local fallback only |
| **Object storage** | Event / question images | **Cloudflare R2** | S3-compatible API: `AWS_*` + `S3_BUCKET` + `S3_ENDPOINT` (R2) + `CDN_URL` |
| **CDN / DNS / TLS** | Domains, HTTPS, upload CDN | **Cloudflare** | `marvira.com` → Railway; R2 public/CDN URL → `CDN_URL` / `NEXT_PUBLIC_CDN_URL` |
| **Mobile CI / store upload** | iOS + Android release builds | **Codemagic** | Group `marvira_mobile_secrets`; see `marvira_mobile/CODEMAGIC.md` |
| **Push + analytics (mobile)** | FCM, Analytics, Crashlytics | **Firebase** (`marvira-biggame`) | Mobile configs + API `FIREBASE_ADMIN_*` for FCM |
| **Auth — Google** | Sign-In (ID token) | **Google Cloud OAuth** | `GOOGLE_CLIENT_ID(S)` / mobile `GOOGLE_WEB_CLIENT_ID` |
| **Auth — Apple** | Sign in with Apple | **Apple Developer** | API `APPLE_CLIENT_ID=com.marvira` |
| **Auth — Facebook** | Facebook Login | **Meta Developers** | API `FACEBOOK_APP_*`; mobile App ID + Client Token |
| **Error monitoring** | Optional APM / errors | **Sentry** (optional) | `SENTRY_DSN` — env ready; wire SDK if enabled |
| **App stores** | Distribution | **App Store Connect** + **Google Play** | Codemagic integrations `marvira_asc` / Play internal track |

## Public production URLs (target)

| Surface | URL |
|---------|-----|
| Marketing | https://www.marvira.com |
| API | https://api.marvira.com |
| Dashboard | https://dashboard.marvira.com |
| Support | support@marvira.com |

Do **not** ship mobile release builds still pointed at `*.up.railway.app` once custom domains are live.

## Local vs production (short)

| Need | Local | Production |
|------|--------|------------|
| Postgres | Native / Docker on `:5432` | **Neon** |
| Redis | Optional (`REDIS_DISABLED=true`) | **Upstash** — required |
| Email | Gmail SMTP OK | Resend |
| Uploads | Disk under `uploads/` | **Cloudflare R2** + `CDN_URL` |
| Maps | Mapbox token in `.env.local` | Same token (restricted) in Codemagic / Railway |

## Related docs

- Deploy: [`marvira_dashboard_api/docs/deployment.md`](../marvira_dashboard_api/docs/deployment.md)
- Env templates: `marvira_dashboard_api/.env.example`, `marvira_mobile/.env.example`
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Owner secrets checklist: [`../release_credentials.txt`](../release_credentials.txt)
