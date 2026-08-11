# Marvira

Location-based scavenger hunt / city exploration platform.

- **Mobile app** — players and creators (`marvira_mobile/`)
- **API + admin + marketing** — NestJS / Next.js (`marvira_dashboard_api/`)

## Start here (humans)

→ **[docs/README.md](./docs/README.md)** — reading map by role  

Then:

1. [docs/PRODUCT_OVERVIEW.md](./docs/PRODUCT_OVERVIEW.md) — what the product does  
2. [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — how the pieces connect  
3. [docs/SERVICES.md](./docs/SERVICES.md) — third-party stack (Railway, Neon, Mapbox, …)  

## Quick setup

| Piece | Guide |
|-------|--------|
| API + dashboard | [marvira_dashboard_api/README.md](./marvira_dashboard_api/README.md) |
| Mobile app | [marvira_mobile/README.md](./marvira_mobile/README.md) |

## API environments (local / UAT / production)

Same idea as the mobile app: pick the API with an env var or a code flag — **no in-app UI**.

### Mobile (`marvira_mobile`)

See [marvira_mobile/README.md](./marvira_mobile/README.md) § Configure API Base URL.

### Dashboard + marketing (`marvira_dashboard_api`)

`.env.local` (no quotes):

```env
NEXT_PUBLIC_API_ENV=local
# NEXT_PUBLIC_API_ENV=uat

NEXT_PUBLIC_API_URL_LOCAL=http://localhost:3001
NEXT_PUBLIC_API_URL_UAT=https://api-uat.marvira.com
NEXT_PUBLIC_API_URL=https://api.marvira.com
```

Or code flag: `packages/shared-utils/src/public-api-url.ts` → `MANUAL_PUBLIC_API_ENV = 'uat'`

| Mode | API |
|------|-----|
| `next dev` (default) | **local** |
| Railway production build | **production** (`NEXT_PUBLIC_API_URL`) |
| Future UAT web deploy | `NEXT_PUBLIC_API_ENV=uat` + `_UAT` URL |

Restart the Next dev server after changing `.env.local`.

## Deep / regenerate source

[`requirement_all.txt`](./requirement_all.txt) — large product + regenerate seed.  
Read the **RECOVERY** header first, then **§14–24**. Not required for day-to-day onboarding.

## Launch companions

- [perfect_release_checklist.txt](./perfect_release_checklist.txt) — **v1.0 tracking** (website first → Meta → mobile → stores)
- [release_credentials.txt](./release_credentials.txt) — **API keys / accounts** (section A first for web deploy)
- [go_live_update_checklist.txt](./go_live_update_checklist.txt)
- [store_privacy_labels.txt](./store_privacy_labels.txt)
- [growth_plan.txt](./growth_plan.txt)
- [monetization_todo.txt](./monetization_todo.txt)
