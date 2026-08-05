# Marvira Marketing Site

Public consumer marketing site for Marvira (separate from the admin dashboard).

## Develop

From monorepo root:

```bash
pnpm install
pnpm --filter @marvira/marketing dev
```

Runs at http://localhost:3002

## Env

Copy `.env.example` to `.env.local`:

- `NEXT_PUBLIC_SITE_URL` — production www origin
- `NEXT_PUBLIC_API_ENV` — `local` (default in `next dev`) | `uat` | `production`
- `NEXT_PUBLIC_API_URL` — production API (used when env is `production`, and as local fallback)
- `NEXT_PUBLIC_API_URL_UAT` — UAT API (required when `NEXT_PUBLIC_API_ENV=uat`)
- `NEXT_PUBLIC_APP_STORE_URL` / `NEXT_PUBLIC_PLAY_STORE_URL` — set when stores are live

Or flip the code flag in `packages/shared-utils/src/public-api-url.ts`:

```typescript
const MANUAL_PUBLIC_API_ENV: PublicApiEnvironment | null = 'uat';
```

Restart `pnpm --filter @marvira/marketing dev` after changing env. No in-app switcher.

## Brand

Forest / outdoor adventure direction (CSS variables in `src/app/globals.css`) — intentionally distinct from admin purple UI.
