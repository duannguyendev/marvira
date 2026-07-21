# Practice & Favorites â€” Full-Stack Checklist

## Requirements
- [x] Root `requirement_all.txt` includes DB + API + Dashboard spec

## Phase 1 â€” Database
- [x] Extend Prisma `Question` model (createdBy, source, isPublished)
- [x] Add `UserPracticeCompletion` model
- [x] Add `UserFavoriteEvent` model
- [x] Add `UserFavoriteQuestion` model
- [x] Create SQL migration (`20250630140000_practice_favorites`)
- [x] Update seed with community practice questions

## Phase 2 â€” Backend API
- [x] `practice` module (service, controller, DTOs)
- [x] `favorites` module (service, controller)
- [x] Register modules in `app.module.ts`
- [x] Admin practice endpoints on `admin.controller.ts`
- [x] `QuestionsService.create` defaults (source EVENT via schema default)

## Phase 3 â€” Shared Types
- [x] Add Practice/Favorites types to `@marvira/shared-types`

## Phase 4 â€” Admin Dashboard
- [x] Sidebar: Practice nav item
- [x] `/dashboard/practice` list page
- [x] `/dashboard/practice/new` create page
- [x] `/dashboard/practice/[id]` edit page

## Phase 5 â€” Mobile
- [x] Wire `practice.ts` / `favorites.ts` to real API (mock only when `USE_MOCK_DATA`)
- [x] Favorites events mapped via `mapEvent`
- [x] Favorite status checks use API when not in mock mode

## Verification
- [x] API `tsc --noEmit` succeeds
- [x] API `nest build` succeeds
- [x] `@marvira/shared-types` build succeeds
- [ ] Run `prisma migrate deploy` against your database before testing
- [ ] Run `pnpm --filter @marvira/api seed` after migration

## Post-deploy steps (manual)
1. `cd marvira_dashboard_api/apps/api`
2. `npx prisma migrate deploy`
3. `npx prisma generate`
4. `pnpm seed`
5. Restart API server
6. Rebuild mobile against API (`USE_MOCK_DATA=false`)
