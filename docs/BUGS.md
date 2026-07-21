# Marvira â€” Bug & Issue Tracker

**Last updated:** 2026-07-05 (section 18 hardening â€” gameplay, dashboard, tests)  
**Source:** Manual QA session (API, Dashboard, Mobile)  
**Related:** `docs/MANUAL_TEST_CASES.md`, `requirement_all.txt`

---

## Re-verification (2026-06-30 PM â€” Practice & Favorites regression)

| ID | Priority | Status | Verification result |
|----|----------|--------|---------------------|
| BUG-001 | P0 | **Fixed** | PostGIS migration file present; `migrate deploy` succeeds |
| BUG-002 | P0 | **Fixed** | Gameplay timing columns applied; leaderboard/analytics `200` |
| BUG-003 | P1 | **Open** | Mobile UI blocked: JDK 25, `ANDROID_HOME` unset, multiple adb devices |
| BUG-004 | P1 | **Fixed** | `npm run test:e2e` â†’ 5/5 pass |
| BUG-009 | P2 | **Fixed** | Practice analytics widgets on `/dashboard/analytics` (Â§18.7) |
| BUG-010 | P1 | **Fixed** | `20250630140000_practice_favorites` migration applied this session |
| BUG-011 | P2 | **Open** | No unit/integration tests for `practice` / `favorites` modules |

**Smoke script:** `manual-test.ps1` â†’ **56/56 PASS** (includes Practice, Favorites, leaderboards, participants, full gameplay).

---

## Summary

| Priority | Open | Description |
|----------|------|-------------|
| P0 | 0 | ~~Database migration failures~~ â€” fixed |
| P1 | 1 | Mobile environment not configured (BUG-003) |
| P2 | 4 | Practice analytics widgets; no practice API tests; no mobile tests; SMTP; Docker |
| P3 | 1 | Dashboard client-only auth guard |

---

## P0 â€” Critical

### BUG-001 â€” Missing PostGIS migration file

| Field | Value |
|-------|-------|
| **ID** | BUG-001 |
| **Priority** | P0 |
| **Status** | **Fixed** (re-verified 2026-06-30) |
| **Component** | API / Database |

**Description:**  
Prisma migration `20250630100000_postgis_extension` was missing `migration.sql` during initial QA. File has since been restored.

**Re-verification:** `migrate deploy` succeeds; 7 migrations total in repo.

---

### BUG-002 â€” Gameplay timing migration not applied on existing DBs

| Field | Value |
|-------|-------|
| **ID** | BUG-002 |
| **Priority** | P0 |
| **Status** | **Fixed** (re-verified 2026-06-30) |
| **Component** | API / Database |

**Description:**  
Migration `20250630120000_gameplay_timing` adds columns required by leaderboard and analytics. Was not applied during initial QA.

**Re-verification:** `GET /leaderboard/global`, `GET /admin/analytics`, event leaderboard â†’ **200**.

---

## P1 â€” High

### BUG-003 â€” Android development environment not configured

| Field | Value |
|-------|-------|
| **ID** | BUG-003 |
| **Priority** | P1 |
| **Status** | **Open** (re-verified 2026-06-30 PM) |
| **Component** | Mobile |

**Description:**  
Mobile app cannot be built or run reliably on the test machine. All **TC-MOB-*** UI cases are **BLOCKED**.

**Re-verification (2026-06-30 PM):**
- `react-native doctor` â€” fails: `error: more than one device/emulator` (multiple adb targets)
- `ANDROID_HOME` â€” not set
- `java -version` â€” OpenJDK **25.0.1** (RN 0.73 requires 17â€“20)
- API-level mobile flows verified via `manual-test.ps1` (56 steps PASS)

**Impact:** Cannot execute TC-MOB-014 through TC-MOB-021 (Practice, Favorites, i18n, wizard UI).

**Suggested fix:** Install Android Studio SDK 34, set `ANDROID_HOME`, use JDK 17â€“20, single emulator or `adb -s <id>`.

---

### BUG-004 â€” Gameplay e2e test fails on place unlock

| Field | Value |
|-------|-------|
| **ID** | BUG-004 |
| **Priority** | P1 |
| **Status** | **Fixed** (re-verified 2026-06-30) |
| **Component** | API / Tests |

**Re-verification:** `npm run test:e2e` â†’ **5 passed, 5 total** (includes full gameplay flow).

---

### BUG-010 â€” Practice & Favorites migration not applied on dev DB

| Field | Value |
|-------|-------|
| **ID** | BUG-010 |
| **Priority** | P1 |
| **Status** | **Fixed** (2026-06-30 PM) |
| **Component** | API / Database |
| **Found** | 2026-06-30 PM regression session |

**Description:**  
Migration `20250630140000_practice_favorites` was present in repo but **not applied** on the local `marvira` database. All `/practice/*` and `/favorites/*` endpoints would fail until deployed.

**Steps to reproduce:**

1. Fresh clone with existing DB at migration `20250630120000`
2. Start API without `npx prisma migrate deploy`
3. `GET /practice/questions` with player JWT

**Expected:** `200` with practice question list.

**Actual (before fix):** Prisma error â€” missing tables/columns (`user_practice_completions`, `QuestionSource`, etc.).

**Fix applied:** `npx prisma migrate deploy` + `pnpm db:seed`.

**Suggested fix (repo):**
- Document `migrate deploy` in onboarding (not only `db:migrate`)
- Add practice/favorites health check to `manual-test.ps1` (done)
- Consider failing `/ready` when pending migrations exist

---

## P2 â€” Medium

### BUG-005 â€” No automated tests in mobile app

| Field | Value |
|-------|-------|
| **ID** | BUG-005 |
| **Priority** | P2 |
| **Status** | Open |
| **Component** | Mobile |

**Description:** `marvira_mobile` has Jest configured but zero test files. `npm test` exits with "No tests found".

---

### BUG-009 â€” Practice analytics widgets not implemented

| Field | Value |
|-------|-------|
| **ID** | BUG-009 |
| **Priority** | P2 |
| **Status** | **Open** |
| **Component** | Dashboard |
| **Found** | 2026-06-30 PM (TC-DASH-017) |

**Description:**  
Per `requirement_all.txt` Â§16 and TC-DASH-017, `/dashboard/analytics` should show Practice-specific widgets:
- Practice completions (7d trend)
- Top practiced questions
- Community questions created (user vs admin)

**Verification:** `apps/dashboard/src/app/dashboard/analytics/page.tsx` has no practice-related queries or UI. API endpoint `GET /admin/practice/stats` **works** (returns `totalCommunityQuestions`, `topPracticed`, etc.).

**Impact:** Admin cannot see practice engagement in analytics UI; data only via API/Swagger.

**Suggested fix:** Add TanStack Query widgets calling `/admin/practice/stats` on analytics page.

---

### BUG-011 â€” No backend tests for Practice & Favorites modules

| Field | Value |
|-------|-------|
| **ID** | BUG-011 |
| **Priority** | P2 |
| **Status** | **Open** |
| **Component** | API / Tests |
| **Found** | 2026-06-30 PM |

**Description:**  
`requirement_all.txt` requires unit and integration tests for practice answer validation, unfinished/completed filtering, favorites idempotency, and author-only enforcement. No `*.spec.ts` files exist under `apps/api/src/practice/` or `favorites/`.

**Current automated coverage:**
- `geo.spec.ts` â€” 2 tests
- `app.e2e-spec.ts`, `gameplay.e2e-spec.ts` â€” 5 e2e tests (no practice/favorites)
- `manual-test.ps1` â€” 14 new smoke steps for practice/favorites (PASS)

**Suggested fix:** Add `practice.service.spec.ts` and `practice.e2e-spec.ts`.

---

### BUG-006 â€” Password reset email not sent in development

| Field | Value |
|-------|-------|
| **ID** | BUG-006 |
| **Priority** | P2 |
| **Status** | Open (by design) |
| **Component** | API / Email |

**Description:** `SMTP_HOST` empty in dev; reset URL logged to API console only.

---

### BUG-007 â€” Docker Desktop not available for full-stack testing

| Field | Value |
|-------|-------|
| **ID** | BUG-007 |
| **Priority** | P2 |
| **Status** | Open (environment) |
| **Component** | Infrastructure |

**Description:** Docker daemon not running during QA; compose stack not verified.

---

## P3 â€” Low

### BUG-008 â€” Dashboard auth is client-side only

| Field | Value |
|-------|-------|
| **ID** | BUG-008 |
| **Priority** | P3 |
| **Status** | Open |
| **Component** | Dashboard |

**Description:** Dashboard routes return HTTP `200` when unauthenticated; redirect is client-side only.

---

## Issues Verified as Expected Behavior

| Item | Behavior |
|------|----------|
| Answer without GPS coords | `POST /places/:id/answer` requires lat/lng â€” **400** |
| Practice training wrong answer | `isCorrect: false`; no completion row |
| Practice does not affect event score | Verified via smoke gameplay + practice isolation design |
| Practice list hides `answer` field | Verified in smoke script |
| Favorites idempotent POST | Verified in smoke script |
| Participants API shape | `data.participants.items` (not `data.items`) |
| Duplicate registration | **409** |
| Invalid login | **400** |

---

## Test Session Results

### Full regression (2026-06-30 PM)

**Test cases added:** TC-API-027â€“039, TC-DASH-015â€“017, TC-MOB-014â€“021 (see `MANUAL_TEST_CASES.md`).

| Area | Result | Notes |
|------|--------|-------|
| `manual-test.ps1` (56 steps) | **PASS** | Practice, Favorites, leaderboards, participants, gameplay |
| Unit tests (`pnpm test`) | **PASS** | 2 geo tests |
| E2E tests (`npm run test:e2e`) | **PASS** | 5/5 |
| API health/auth | **PASS** | |
| Practice & Favorites API | **PASS** | After BUG-010 migration deploy |
| Leaderboards (global + event) | **PASS** | |
| Admin participants | **PASS** | |
| Dashboard HTTP (login, events, questions, **practice**) | **PASS** | |
| Dashboard analytics practice widgets | **FAIL** | BUG-009 |
| Mobile UI (TC-MOB-*) | **BLOCKED** | BUG-003 |
| Practice backend unit tests | **N/A** | BUG-011 |

### Prior sessions

| Area | Result | Notes |
|------|--------|-------|
| Initial session (AM) | Partial | Migration workarounds required |
| Re-verification (PM early) | BUG-001/002/004 fixed | |

---

## Bug ID Quick Reference

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| BUG-001 | Missing PostGIS migration file | P0 | **Fixed** |
| BUG-002 | Gameplay timing migration not applied | P0 | **Fixed** |
| BUG-003 | Android dev environment not configured | P1 | **Open** |
| BUG-004 | Gameplay e2e test unlock failure | P1 | **Fixed** |
| BUG-005 | No mobile automated tests | P2 | Open |
| BUG-006 | SMTP not configured in dev | P2 | Open |
| BUG-007 | Docker not running | P2 | Open |
| BUG-008 | Dashboard client-only auth | P3 | Open |
| BUG-009 | Practice analytics widgets missing | P2 | **Open** |
| BUG-010 | Practice migration not applied on DB | P1 | **Fixed** |
| BUG-011 | No practice/favorites API tests | P2 | **Open** |
