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
- `NEXT_PUBLIC_APP_STORE_URL` / `NEXT_PUBLIC_PLAY_STORE_URL` — set when stores are live

## Brand

Forest / outdoor adventure direction (CSS variables in `src/app/globals.css`) — intentionally distinct from admin purple UI.
