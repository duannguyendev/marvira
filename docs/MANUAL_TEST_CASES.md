# Marvira â€” Manual Test Cases

**Last updated:** 2026-06-30 (Practice & Favorites, event creation, i18n)  
**Scope:** API, Dashboard, Mobile App  
**Related script:** `marvira_dashboard_api/scripts/manual-test.ps1` (66 automated smoke steps)

---

## 1. Prerequisites

### 1.1 Software

| Requirement | Version / notes |
|-------------|-----------------|
| Node.js | >= 22 (dashboard/api), >= 18 (mobile) |
| pnpm | >= 9 |
| PostgreSQL | Running on `localhost:5432`, database `marvira` |
| Redis | Optional for local dev (`REDIS_DISABLED=true` in API `.env`) |
| Docker Desktop | Optional; required only for `docker/docker-compose.yml` stack |

### 1.2 Environment files

Copy and configure:

- `marvira_dashboard_api/apps/api/.env` (see `marvira_dashboard_api/.env.example`)
- `marvira_dashboard_api/apps/dashboard/.env.local` (`NEXT_PUBLIC_API_URL=http://localhost:3001`)

### 1.3 Database setup

```powershell
cd marvira_dashboard_api
pnpm install
pnpm db:migrate
pnpm db:seed
```

**Seed accounts:**

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@marvira.com` | `admin123` |
| Player | `demo@marvira.com` | `demo123` |

**Seed events:**

- `seed-event-downtown` â€” Downtown Discovery Hunt (3 places)
- `seed-event-golden-gate` â€” Golden Gate Adventure

### 1.4 Start services

```powershell
# Terminal 1 â€” API (port 3001)
cd marvira_dashboard_api
pnpm dev:api

# Terminal 2 â€” Dashboard (port 3000)
cd marvira_dashboard_api
pnpm dev:dashboard

# Terminal 3 â€” Mobile Metro (port 8081)
cd marvira_mobile
pnpm start

# Terminal 4 â€” Mobile on Android emulator/device
cd marvira_mobile
pnpm android
```

**URLs:**

- API: http://localhost:3001
- Swagger: http://localhost:3001/docs
- Dashboard: http://localhost:3000
- Mobile API (Android emulator): `http://10.0.2.2:3001`

### 1.5 Mobile prerequisites

- Android Studio with SDK 34
- `ANDROID_HOME` set
- JDK 17â€“20 (JDK 25 is not supported by React Native 0.73)
- Emulator running or physical device connected (`adb devices`)

Verify: `npx react-native doctor`

### 1.6 Quick automated smoke

```powershell
cd marvira_dashboard_api
.\scripts\manual-test.ps1
```

---

## 2. API Test Cases

Use Swagger (`/docs`) or curl/PowerShell. All successful responses use `{ "success": true, "data": ... }`.

**Get admin token (reuse in tests):**

```powershell
$login = (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST `
  -Body '{"email":"admin@marvira.com","password":"admin123"}' `
  -ContentType "application/json").data
$token = $login.tokens.accessToken
$headers = @{ Authorization = "Bearer $token" }
```

---

### TC-API-001 â€” Health check

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Endpoint** | `GET /health` |
| **Auth** | None |

**Steps:**

1. Call `GET http://localhost:3001/health`

**Expected:**

- Status `200`
- Body contains `"status": "ok"`

---

### TC-API-002 â€” Readiness check

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Endpoint** | `GET /ready` |
| **Auth** | None |

**Steps:**

1. Call `GET http://localhost:3001/ready`

**Expected:**

- Status `200`
- Body contains `"status": "ready"`

---

### TC-API-003 â€” Admin login

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Endpoint** | `POST /auth/login` |
| **Auth** | None |

**Steps:**

1. POST body: `{ "email": "admin@marvira.com", "password": "admin123" }`

**Expected:**

- Status `200`
- `data.user.role` = `ADMIN`
- `data.tokens.accessToken` and `data.tokens.refreshToken` present

---

### TC-API-004 â€” Player login

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Endpoint** | `POST /auth/login` |

**Steps:**

1. POST body: `{ "email": "demo@marvira.com", "password": "demo123" }`

**Expected:**

- Status `200`
- `data.user.role` = `USER`

---

### TC-API-005 â€” Invalid login

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Endpoint** | `POST /auth/login` |

**Steps:**

1. POST body: `{ "email": "demo@marvira.com", "password": "wrong" }`

**Expected:**

- Status `400` or `401`

---

### TC-API-006 â€” Register new user

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Endpoint** | `POST /auth/register` |

**Steps:**

1. POST body: `{ "email": "newuser@test.com", "name": "New User", "password": "TestPass123!" }`

**Expected:**

- Status `201`
- Returns user and tokens

---

### TC-API-007 â€” Duplicate registration

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Endpoint** | `POST /auth/register` |

**Steps:**

1. Register with `demo@marvira.com` again

**Expected:**

- Status `409` Conflict

---

### TC-API-008 â€” Token refresh

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Endpoint** | `POST /auth/refresh` |

**Steps:**

1. Login as admin
2. POST body: `{ "refreshToken": "<refreshToken from login>" }`

**Expected:**

- Status `200`
- New `accessToken` returned

---

### TC-API-009 â€” Get current user

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Endpoint** | `GET /auth/me` |
| **Auth** | Bearer token |

**Steps:**

1. Login as admin
2. `GET /auth/me` with `Authorization: Bearer <accessToken>`

**Expected:**

- Status `200`
- Email matches logged-in user

---

### TC-API-010 â€” Forgot password

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Endpoint** | `POST /auth/forgot-password` |

**Steps:**

1. POST body: `{ "email": "demo@marvira.com" }`
2. Check API console logs (SMTP not configured in dev)

**Expected:**

- Status `200`
- Reset URL logged to API console, e.g. `http://localhost:3000/reset-password?token=...`

---

### TC-API-011 â€” List events

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Endpoint** | `GET /events` |
| **Auth** | Optional |

**Steps:**

1. `GET /events`

**Expected:**

- Status `200`
- At least 2 seed events returned

---

### TC-API-012 â€” Event detail

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Endpoint** | `GET /events/:id` |

**Steps:**

1. `GET /events/seed-event-downtown`

**Expected:**

- Status `200`
- Title = "Downtown Discovery Hunt"

---

### TC-API-013 â€” Event places

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Endpoint** | `GET /events/:eventId/places` |

**Steps:**

1. `GET /events/seed-event-downtown/places` (with player token for unlock state)

**Expected:**

- Status `200`
- 3 places: Union Square, Ferry Building, Coit Tower

---

### TC-API-014 â€” Nearby events

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Endpoint** | `GET /events/nearby` |

**Steps:**

1. `GET /events/nearby?latitude=37.78825&longitude=-122.4324&radiusKm=50`

**Expected:**

- Status `200`
- Returns events near San Francisco

**Negative test:**

- Use `radiusMeters` instead of `radiusKm` â†’ expect `400`

---

### TC-API-015 â€” Global leaderboard

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Endpoint** | `GET /leaderboard/global` |

**Steps:**

1. `GET /leaderboard/global`
2. (Anti-abuse) Complete an event you created with high `rewardPoints` → your global total must **not** increase from that completion
3. (Fair play) Complete someone else’s event → global total increases by the platform formula (capped), not by `rewardPoints`

**Expected:**

- Status `200`
- Entries ranked by `SUM(globalScore)`, then events completed, then avg duration
- Creator self-completions contribute `0` global points; see `docs/SCORING_AND_LEADERBOARD.md`

---

### TC-API-016 â€” Event leaderboard

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Endpoint** | `GET /events/:id/leaderboard` |

**Steps:**

1. `GET /events/seed-event-downtown/leaderboard`

**Expected:**

- Status `200`

---

### TC-API-017 â€” Admin users list

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Endpoint** | `GET /admin/users` |
| **Auth** | Admin Bearer token |

**Steps:**

1. Login as admin
2. `GET /admin/users`

**Expected:**

- Status `200`
- Admin and demo users listed

---

### TC-API-018 â€” Admin events list

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Endpoint** | `GET /admin/events` |
| **Auth** | Admin |

**Steps:**

1. `GET /admin/events`

**Expected:**

- Status `200`
- Paginated list with seed events

---

### TC-API-019 â€” Admin analytics

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Endpoint** | `GET /admin/analytics` |
| **Auth** | Admin |

**Steps:**

1. `GET /admin/analytics`

**Expected:**

- Status `200`
- `overview`, `events`, `engagement`, `activity` sections present

---

### TC-API-020 â€” Analytics overview

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Endpoint** | `GET /analytics/overview` |
| **Auth** | Admin |

**Steps:**

1. `GET /analytics/overview`

**Expected:**

- Status `200`

---

### TC-API-021 â€” Gameplay: unlock place

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Endpoint** | `POST /places/:id/unlock` |
| **Auth** | Player Bearer token |

**Steps:**

1. Login as demo user (or register new player)
2. POST `/places/seed-place-1/unlock`
3. Body: `{ "latitude": 37.7879, "longitude": -122.4075 }` (Union Square coords)

**Expected:**

- Status `201`
- `data.unlocked` = true

**Negative tests:**

- Wrong GPS coords â†’ `400` "You must be within the place radius"
- Unlock place 2 before completing place 1 â†’ `403`

---

### TC-API-022 â€” Gameplay: get question

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Endpoint** | `GET /places/:id/question` |
| **Auth** | Player |

**Steps:**

1. Unlock place 1 (TC-API-021)
2. `GET /places/seed-place-1/question`

**Expected:**

- Status `200`
- Question text present
- Correct answer **not** exposed in response

---

### TC-API-023 â€” Gameplay: submit answer

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Endpoint** | `POST /places/:id/answer` |
| **Auth** | Player |

**Steps:**

1. After unlock, POST `/places/seed-place-1/answer`
2. Body:
   ```json
   {
     "answer": "1850",
     "latitude": 37.7879,
     "longitude": -122.4075
   }
   ```

**Expected:**

- Status `201`
- `data.correct` = true
- `data.nextPlaceId` = `seed-place-2`

**Answer key (Downtown Hunt):**

| Place | Answer |
|-------|--------|
| seed-place-1 | `1850` |
| seed-place-2 | `Big Ben` |
| seed-place-3 | `True` |

**Negative test:**

- Omit `latitude`/`longitude` â†’ `400` validation error

---

### TC-API-024 â€” Full gameplay progression

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Scope** | End-to-end |

**Steps:**

1. Register a new player
2. For each place in Downtown Hunt: unlock â†’ get question â†’ answer
3. Check `GET /profile/completed-events`
4. Check event leaderboard

**Expected:**

- All 3 places completed
- Event appears in completed events
- Leaderboard reflects score

---

### TC-API-025 â€” Player profile

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Endpoint** | `GET /profile` |
| **Auth** | Player |

**Steps:**

1. Login as demo
2. `GET /profile`

**Expected:**

- Status `200`
- Name and email returned

---

### TC-API-026 â€” Unauthorized admin access

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Endpoint** | `GET /admin/users` |
| **Auth** | Player token or none |

**Steps:**

1. Call admin endpoint with demo user token or no token

**Expected:**

- Status `401` or `403`

---

### TC-API-027 â€” Practice: list unfinished questions

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Endpoint** | `GET /practice/questions?status=unfinished` |
| **Auth** | Player Bearer token |

**Steps:**

1. Login as `demo@marvira.com`
2. `GET /practice/questions?status=unfinished`

**Expected:**

- Status `200`
- Only published `COMMUNITY` questions where user has no `user_practice_completions` row
- Each item: `id`, `question`, `type`, `points`; **no `answer` field**
- Seed: `seed-practice-2`, `seed-practice-3` (or any unpublished training items; `seed-practice-1` may appear if seed completion row exists)

---

### TC-API-028 â€” Practice: training answer flow

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Endpoint** | `POST /practice/questions/:id/answer` |
| **Auth** | Player |

**Steps:**

1. `POST /practice/questions/seed-practice-2/answer` with `{ "answer": "True" }` (wrong)
2. Repeat with `{ "answer": "False" }` (correct)

**Expected:**

- Wrong: `data.isCorrect` = false; no completion row created
- Correct: `data.isCorrect` = true; `explanation` may be present
- Question removed from unfinished list; appears in `?status=completed`

**Answer key (seed practice):**

| ID | Answer |
|----|--------|
| seed-practice-1 | `Paris` |
| seed-practice-2 | `False` |
| seed-practice-3 | `Mars` |

---

### TC-API-029 â€” Practice: no impact on event progress

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Scope** | Regression |

**Steps:**

1. Note `GET /profile/completed-events` and `user_event_progress` state for demo user
2. Complete a practice question (`POST /practice/questions/:id/answer`)
3. Re-check completed events and event leaderboard score

**Expected:**

- Event progress, score, and leaderboard **unchanged** by practice training

---

### TC-API-030 â€” Practice: list completed questions

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Endpoint** | `GET /practice/questions?status=completed` |
| **Auth** | Player |

**Steps:**

1. After TC-API-028, `GET /practice/questions?status=completed`

**Expected:**

- Status `200`
- Includes questions user finished in training mode
- No `answer` field in list items

---

### TC-API-031 â€” Favorites: list and add event

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Endpoint** | `GET /favorites/events`, `POST /favorites/events/:id` |
| **Auth** | Player |

**Steps:**

1. `GET /favorites/events` â€” seed includes `seed-event-downtown` for demo
2. `POST /favorites/events/seed-event-golden-gate` (add)
3. `POST /favorites/events/seed-event-golden-gate` again (idempotent)

**Expected:**

- List returns favorited events with event card fields
- Second POST succeeds without duplicate rows

---

### TC-API-032 â€” Favorites: list and remove question

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Endpoint** | `GET /favorites/questions`, `DELETE /favorites/questions/:id` |
| **Auth** | Player |

**Steps:**

1. `GET /favorites/questions` â€” seed includes `seed-practice-1` for demo
2. `DELETE /favorites/questions/seed-practice-1`
3. `DELETE /favorites/questions/seed-practice-1` again

**Expected:**

- First DELETE: `200` success
- Second DELETE: `404` (not favorited)

---

### TC-API-033 â€” Practice: my questions

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Endpoint** | `GET /practice/questions/mine` |
| **Auth** | Player |

**Steps:**

1. `GET /practice/questions/mine` as demo user

**Expected:**

- Status `200`
- Community questions created by user + EVENT-linked questions from user's created events
- EVENT-linked items include `eventId` / `eventTitle` when applicable

---

### TC-API-034 â€” Practice: create community question

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Endpoint** | `POST /practice/questions` |
| **Auth** | Player |

**Steps:**

1. POST body:
   ```json
   {
     "question": "Manual test practice question?",
     "type": "TEXT",
     "answer": "TestAnswer",
     "points": 10
   }
   ```

**Expected:**

- Status `201`
- `source` = `COMMUNITY`, `isPublished` = true, `createdBy` = current user
- Response shape has no `answer` in public list/detail fields
- Question appears in other users' unfinished practice pool

---

### TC-API-035 â€” Events: my created events

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Endpoint** | `GET /events/mine` |
| **Auth** | Player |

**Steps:**

1. Login as demo (or user who created events via mobile wizard)
2. `GET /events/mine?page=1&pageSize=20`

**Expected:**

- Status `200`
- Paginated list of events where `createdBy` = current user (draft + published)

---

### TC-API-036 â€” Admin: practice questions list

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Endpoint** | `GET /admin/practice/questions` |
| **Auth** | Admin |

**Steps:**

1. `GET /admin/practice/questions?page=1&pageSize=20`
2. Optional: `?published=true`, `?search=France`

**Expected:**

- Status `200`
- COMMUNITY questions listed with author, published flag, completion/favorite counts

---

### TC-API-037 â€” Admin: practice stats

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Endpoint** | `GET /admin/practice/stats` |
| **Auth** | Admin |

**Steps:**

1. `GET /admin/practice/stats`

**Expected:**

- Status `200`
- Counts: total/published community questions, completions, favorites

---

### TC-API-038 â€” Admin: event participants

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Endpoint** | `GET /admin/events/:id/participants` |
| **Auth** | Admin |

**Steps:**

1. Complete an event as demo user (TC-API-024 or smoke script)
2. `GET /admin/events/seed-event-downtown/participants?sortBy=fastest`

**Expected:**

- Status `200`
- Demo user listed with status, score, places progress, duration fields
- `?search=demo` filters by email

---

### TC-API-039 â€” User event creation (API)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Scope** | Mobile wizard backend |

**Steps:**

1. Register or login as USER
2. `POST /events` â€” draft (`isActive: false`)
3. `POST /questions` + `POST /events/:id/questions` + `POST /places` with `questionId`
4. `PATCH /events/:id` with `{ "isActive": true }` when all places have questions

**Expected:**

- Draft created; publish rejected if any place lacks question
- Creator can `PATCH` own event; other users cannot

---

### TC-API-040 â€” Password-protected event join

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Scope** | Private event access |
| **Automated** | `marvira_dashboard_api/scripts/manual-test.ps1` (section **Password-protected events**) |

**Steps:**

1. User A creates and publishes event with `joinPassword` via `PATCH /events/:id` `{ "isActive": true, "joinPassword": "hunt2026" }`
2. User B `GET /events/:id` â€” note `isPasswordProtected: true`, `hasAccess: false`, empty `places`
3. User B `GET /events/:id/places` â€” empty array
4. User B `POST /events/:id/join` with wrong password â†’ `403` "Incorrect password"
5. User B `POST /events/:id/join` with correct password â†’ `200` `{ joined: true, hasAccess: true }`
6. User B `GET /events/:id` â€” `hasAccess: true`, places visible
7. User B `POST /places/:firstPlaceId/unlock` with valid GPS â€” succeeds
8. User A (creator) opens same event â€” `hasAccess: true` without join

**Expected:**

- `joinPasswordHash` never returned in API responses
- Rate limit after repeated wrong passwords (`429`)
- Changing password invalidates prior `user_event_access` grants (except creator)

---

## 3. Dashboard Test Cases

Auth is **client-side** (Zustand store). Unauthenticated users see a spinner then redirect to `/login`. Test in a browser.

---

### TC-DASH-001 â€” Login page loads

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **URL** | http://localhost:3000/login |

**Steps:**

1. Open `/login` in browser

**Expected:**

- Login form visible
- No console errors

---

### TC-DASH-002 â€” Admin login

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **URL** | `/login` |

**Steps:**

1. Enter `admin@marvira.com` / `admin123`
2. Submit

**Expected:**

- Redirect to `/dashboard`
- Sidebar visible with navigation items

---

### TC-DASH-003 â€” Non-admin rejected

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **URL** | `/login` |

**Steps:**

1. Login with `demo@marvira.com` / `demo123`

**Expected:**

- Redirected back to `/login` (dashboard requires ADMIN role)

---

### TC-DASH-004 â€” Dashboard home

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **URL** | `/dashboard` |

**Steps:**

1. Login as admin
2. Navigate to dashboard home

**Expected:**

- Overview stats load without error

---

### TC-DASH-005 â€” Events list

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **URL** | `/dashboard/events` |

**Steps:**

1. Open events page

**Expected:**

- Seed events listed (Downtown Discovery Hunt, Golden Gate Adventure)
- Pagination works if many events

---

### TC-DASH-006 â€” Event detail

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **URL** | `/dashboard/events/seed-event-downtown` |

**Steps:**

1. Click an event from the list

**Expected:**

- Event details, places, and linked questions visible

---

### TC-DASH-007 â€” Event participants

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **URL** | `/dashboard/events/:id/participants` |

**Steps:**

1. Open participants tab/page for an event

**Expected:**

- Participant list loads (may be empty)
- Sort options work

---

### TC-DASH-008 â€” Create event

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **URL** | `/dashboard/events/new` |

**Steps:**

1. Fill required fields (title, description, city, difficulty)
2. Submit

**Expected:**

- Event created
- Appears in events list
- Visible via `GET /events`

---

### TC-DASH-009 â€” Questions list

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **URL** | `/dashboard/questions` |

**Steps:**

1. Open questions page

**Expected:**

- Seed questions listed

---

### TC-DASH-010 â€” Create question

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **URL** | `/dashboard/questions/new` |

**Steps:**

1. Create a TEXT, MULTIPLE_CHOICE, or TRUE_FALSE question
2. Link to an event

**Expected:**

- Question saved
- Assignable to a place on event detail

---

### TC-DASH-011 â€” Users management

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **URL** | `/dashboard/users` |

**Steps:**

1. Open users page
2. Deactivate demo user
3. Try demo login â†’ should fail
4. Reactivate demo user

**Expected:**

- User status toggles via `PATCH /admin/users/:id/deactivate` and `/activate`

---

### TC-DASH-012 â€” Analytics page

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **URL** | `/dashboard/analytics` |

**Steps:**

1. Open analytics page

**Expected:**

- Completion rate displays
- Event performance bar chart renders
- Daily activity line chart renders
- No API 500 errors in network tab

---

### TC-DASH-013 â€” Forgot password flow

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **URL** | `/forgot-password` â†’ `/reset-password` |

**Steps:**

1. Submit email on forgot-password page
2. Copy reset token from API console log
3. Open `http://localhost:3000/reset-password?token=<token>`
4. Set new password

**Expected:**

- Password updated
- Can login with new password

---

### TC-DASH-014 â€” Logout

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **URL** | Any dashboard page |

**Steps:**

1. Click logout in sidebar

**Expected:**

- Tokens cleared from localStorage
- Redirect to `/login`
- `/dashboard` no longer accessible

---

### TC-DASH-015 â€” Practice questions page

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **URL** | `/dashboard/practice` |

**Steps:**

1. Login as admin
2. Open Practice in sidebar

**Expected:**

- COMMUNITY practice questions table loads
- Search and published filter work
- Row actions: Edit, Publish/Unpublish, Delete

---

### TC-DASH-016 â€” Create practice question

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **URL** | `/dashboard/practice/new` |

**Steps:**

1. Create a TEXT community question with answer and points
2. Save

**Expected:**

- Question created with `source=COMMUNITY`
- Appears in practice list; visible in mobile Practice pool when published

---

### TC-DASH-017 â€” Practice analytics widgets (spec)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **URL** | `/dashboard/analytics` |

**Steps:**

1. Open analytics page after practice activity exists

**Expected (per requirement):**

- Widget: Practice completions (7d trend)
- Widget: Top practiced questions
- Widget: Community questions created

**Note:** Mark FAIL if widgets not yet implemented (see BUG-009).

---

## 4. Mobile App Test Cases

Requires Android emulator/device and Metro bundler. API must be reachable at `10.0.2.2:3001` (emulator) or host IP (physical device).

---

### TC-MOB-001 â€” App launch

| Field | Value |
|-------|-------|
| **Priority** | P0 |

**Steps:**

1. Start Metro: `pnpm start`
2. Run app: `pnpm android`
3. Wait for app to load

**Expected:**

- Login screen or main screen (if session persisted)
- No redbox errors

---

### TC-MOB-002 â€” Login

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Screen** | Login |

**Steps:**

1. Enter `demo@marvira.com` / `demo123`
2. Tap Login

**Expected:**

- Navigate to Events list (Home tab)

---

### TC-MOB-003 â€” Register

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Screen** | Register |

**Steps:**

1. Create account with new email and valid password

**Expected:**

- Account created and logged in

---

### TC-MOB-004 â€” Events list

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Screen** | EventsList |

**Steps:**

1. View events on Home tab

**Expected:**

- Seed events displayed with title, city, difficulty

---

### TC-MOB-005 â€” Event details

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Screen** | EventDetails |

**Steps:**

1. Tap an event

**Expected:**

- Map with place markers
- Place list in order
- Instructions for GPS unlock

---

### TC-MOB-006 â€” Place unlock (GPS)

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Screen** | PlaceGame |

**Steps:**

1. Open first place
2. Mock/set GPS to place coordinates (Union Square: 37.7879, -122.4075)
3. Tap unlock when within radius

**Expected:**

- Place unlocks
- Question becomes visible

---

### TC-MOB-007 â€” Submit answer

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Screen** | PlaceGame |

**Steps:**

1. After unlock, enter correct answer (`1850` for place 1)
2. Submit with GPS enabled

**Expected:**

- Success alert
- Navigate to next place or completion screen

---

### TC-MOB-008 â€” Event completion

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Screen** | EventCompletion |

**Steps:**

1. Complete all places in an event

**Expected:**

- Completion screen with score/summary

---

### TC-MOB-009 â€” Event leaderboard

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Screen** | EventLeaderboard |

**Steps:**

1. Open leaderboard from event flow

**Expected:**

- Ranked list loads

---

### TC-MOB-010 â€” Global leaderboard

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Screen** | GlobalLeaderboard |

**Steps:**

1. Navigate to global leaderboard

**Expected:**

- Global rankings load

---

### TC-MOB-011 â€” Profile

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Screen** | Profile (tab) |

**Steps:**

1. Open Profile tab

**Expected:**

- User name and email
- Completed events history

---

### TC-MOB-012 â€” Offline / network error

| Field | Value |
|-------|-------|
| **Priority** | P2 |

**Steps:**

1. Disable network on device
2. Try to load events

**Expected:**

- Graceful error message (no crash)

---

### TC-MOB-013 â€” WebSocket live updates

| Field | Value |
|-------|-------|
| **Priority** | P2 |

**Steps:**

1. Unlock a place
2. Observe real-time updates (if second client connected)

**Expected:**

- `place_unlocked` socket event received

---

### TC-MOB-014 â€” 4-tab navigation (Practice & Favorites)

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Screen** | MainNavigator |

**Steps:**

1. Login and verify bottom tabs: Events, Practice, Favorites, Profile
2. Open Practice tab â€” sub-tabs To Practice / Completed
3. Open Favorites tab â€” sub-tabs Events / Questions

**Expected:**

- All tabs load without crash
- Pull-to-refresh works on list screens

---

### TC-MOB-015 â€” Practice training flow

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Screen** | PracticeList â†’ QuestionTraining |

**Steps:**

1. Open To Practice; tap a question
2. Submit wrong answer, then correct answer

**Expected:**

- Wrong: retry allowed; no event score impact
- Correct: success feedback; question moves to Completed sub-tab

---

### TC-MOB-016 â€” Favorites toggle UX

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Screen** | EventDetails, Favorites |

**Steps:**

1. Favorite an event from Event Details (instant, no dialog)
2. Unfavorite from Favorites tab

**Expected:**

- Star fills immediately on favorite
- Unfavorite shows bottom-sheet confirmation before remove

---

### TC-MOB-017 â€” My Questions

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Screen** | Profile â†’ My Questions |

**Steps:**

1. Open My Questions from Profile
2. Add new community question via FAB or form
3. Edit and delete own community question

**Expected:**

- Lists user's COMMUNITY + EVENT-linked questions
- CRUD works against real API (`USE_MOCK_DATA=false`)

---

### TC-MOB-018 â€” Event creation wizard

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Screen** | CreateEvent (4 steps) |

**Steps:**

1. Tap FAB "+" on Events List
2. Step 1: event info â†’ Step 2: add place + question â†’ Step 3: review â†’ Publish or Save draft
3. Step 4: success screen links to My Events

**Expected:**

- Draft saved with `isActive: false`
- Publish only when all places have questions
- Event appears in My Events with correct badge

---

### TC-MOB-019 â€” My Events screen

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Screen** | Profile â†’ My Events |

**Steps:**

1. Open My Events
2. Tap draft and published events

**Expected:**

- Draft/published badges and place counts shown
- Owner can open draft event details

---

### TC-MOB-022 â€” Password-protected event (create + join)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Screen** | CreateEvent Review, EventDetails, Events list |

**Steps:**

1. Create event through wizard; on Review choose **Password required**, set password + confirm, publish
2. Success screen shows password share card; share message includes password
3. Log in as different user; open event from list â€” lock badge visible
4. Event details show title/description/place count only; map and places hidden
5. Tap **Join hunt**, enter wrong password â€” inline error
6. Enter correct password â€” full map and places appear
7. Unlock first place and play normally
8. Return to event details â€” no password prompt

**Expected:**

- Creator always has full access without joining
- Private events remain discoverable in list with lock indicator
- i18n strings present in vi/en/zh/ja for access and join flows

---

### TC-MOB-020 â€” i18n language switch

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Screen** | Profile â†’ Settings |

**Steps:**

1. Default language Vietnamese on first launch
2. Switch to English, ä¸­æ–‡, æ—¥æœ¬èªž
3. Verify tab labels and screen titles update
4. On a TRUE_FALSE question, submit answer

**Expected:**

- UI strings change immediately; choice persists after app restart
- API still receives `"True"` / `"False"` (not translated values)

---

### TC-MOB-021 â€” Leaderboard current user highlight

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Screen** | EventLeaderboard, GlobalLeaderboard |

**Steps:**

1. Complete an event as logged-in user
2. Open event and global leaderboards

**Expected:**

- Current user row visually highlighted
- Pull-to-refresh reloads rankings

---

### TC-MOB-PUSH-001 — Register device + inbox list

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Screen** | Profile → Notifications |

**Steps:**

1. Log in on a physical device (or emulator with Google Play)
2. Allow notification permission when prompted
3. Open Profile → Notifications
4. From another session/admin path, trigger an answer update / report / completion

**Expected:**

- `user_devices` row exists for the user
- Inbox shows the notification
- Unread badge appears on Profile notifications row

---

### TC-MOB-PUSH-002 — Tap tray → detail

| Field | Value |
|-------|-------|
| **Priority** | P1 |

**Steps:**

1. Background or kill the app
2. Trigger a push (with Firebase Admin credentials configured)
3. Tap the system notification

**Expected:**

- App opens Notification detail (or related event)
- Item marked read; badge decreases

---

### TC-MOB-PUSH-003 — Preferences skip FCM only

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Screen** | Settings |

**Steps:**

1. Settings → turn off Gameplay push preference
2. Complete an event (EVENT_COMPLETED)

**Expected:**

- Inbox still has the item
- No tray push (when FCM configured)

---

### TC-MOB-PUSH-004 — Logout unregisters token

| Field | Value |
|-------|-------|
| **Priority** | P1 |

**Steps:**

1. Log in (token registered)
2. Log out

**Expected:**

- Device token removed for that user (DELETE /devices)

---

## 5. Automated Test Cases

### TC-AUTO-001 â€” Unit tests (platform)

```powershell
cd marvira_dashboard_api
pnpm test
```

**Expected:** `geo.spec.ts` â€” 2 tests pass

---

### TC-AUTO-002 â€” API e2e tests

```powershell
cd marvira_dashboard_api/apps/api
npm run test:e2e
```

**Expected:**

- `app.e2e-spec.ts` â€” pass
- `gameplay.e2e-spec.ts` â€” pass (see BUG-005 if failing)

---

### TC-AUTO-003 â€” Mobile Jest

```powershell
cd marvira_mobile
npm test -- --passWithNoTests
```

**Expected:** No test files currently defined

---

### TC-AUTO-004 â€” Manual smoke script

```powershell
cd marvira_dashboard_api
.\scripts\manual-test.ps1
```

**Expected:** All steps PASS

---

## 6. Test Result Template

| ID | Result | Tester | Date | Notes |
|----|--------|--------|------|-------|
| TC-API-001 | PASS / FAIL | | | |
| TC-DASH-002 | PASS / FAIL | | | |
| TC-MOB-006 | PASS / FAIL / BLOCKED | | | |
| TC-API-027 | PASS / FAIL | | | |
| TC-API-028 | PASS / FAIL | | | |
| TC-DASH-015 | PASS / FAIL | | | |
| TC-MOB-014 | PASS / FAIL / BLOCKED | | | |

---

## 7. Known Test Blockers

See `docs/BUGS.md` for full bug details.

| Blocker | Affects |
|---------|---------|
| Pending/broken DB migrations | API leaderboard, analytics, practice/favorites, fresh setup |
| Docker not running | docker-compose full stack |
| Android SDK / emulator not configured | All mobile UI tests (TC-MOB-*) |
| Practice migration not applied | TC-API-027â€“034, TC-DASH-015â€“016 |
