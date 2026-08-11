# PRO Mobile Regression — Bug Report

**Date:** 2026-08-10  
**API:** `https://api.marvira.com`  
**Scope:** Full mobile-user API flows on production (register, auth, create/join/play event, practice, favorites, leaderboard, notifications, feedback, owner)  
**Method:** Automated API regression mirroring mobile app clients (`pro-mobile-regression.mjs` + `pro-mobile-edge-cases.mjs` + targeted probes)

## Summary

| Suite | Passed | Failed | Notes |
|-------|--------|--------|-------|
| Main regression | 65/66 | 1 false positive | Practice assertion used `correct` instead of `isCorrect` for practice |
| Edge cases | 30/30 | 0 | Location, password gate, MC/TF, end event, logout refresh |
| Targeted probes | — | — | Found 1 real bug (practice answer leak) |

**Real bugs to fix: 0** (BUG-1 fixed in code — deploy to PRO)  
**Observations / product decisions: 2**

---

## Test Accounts (admin cleanup)

Password for all accounts: `QaProTest123!`

| # | Email | User ID |
|---|-------|---------|
| 1 | `qa.pro.1786358978197.1@marvira-qa.test` | `c557c937-1254-47b7-910a-40996f7eb6ce` |
| 2 | `qa.pro.1786358978197.2@marvira-qa.test` | `29ce0bb3-1c17-4c55-bf87-39f0d9492caf` |
| 3 | `qa.pro.1786358978197.3@marvira-qa.test` | `2aa95a73-d651-46d6-bbf0-cb9e4dee5d52` |
| 4 | `qa.pro.1786358978197.4@marvira-qa.test` | `3446371a-44db-43c7-8ed0-8a1573bf3b3e` |
| 5 | `qa.pro.1786358978197.5@marvira-qa.test` | `52eb73ae-2127-45ff-ab6c-c44981d7ebd3` |
| 6 | `qa.pro.1786358978197.6@marvira-qa.test` | `9c4da3d7-1317-41c8-95e9-809db57412e0` |
| 7 | `qa.pro.1786358978197.7@marvira-qa.test` | `f986bd8e-6a6b-4aa7-a513-a1348a719879` |
| 8 | `qa.pro.1786358978197.8@marvira-qa.test` | `06790d9b-efd6-42be-ae77-74dee52d3d1c` |
| 9 | `qa.pro.1786358978197.9@marvira-qa.test` | `7976660e-17f9-48e0-bb28-42c1b51d8696` |
| 10 | `qa.pro.1786358978197.10@marvira-qa.test` | `ca7a49fb-e022-434f-9811-29a126087f9b` |

Account #1 was used as event owner; others as players. Account #4 password was changed during test and restored.

---

## Events created (unpublished after test)

Main suite + edge suite + probes created several events; all targeted events were set `isActive=false` after testing. If any remain active, search titles starting with `QA ` / `QA Open` / `QA Gift` / `QA Multi` / `QA SelfPlay` / `QA Case` / `QA VerifyGate`.

---

## Bugs to fix

### BUG-1 — HIGH — Practice training API leaks correct answer — FIXED

- **Status:** Fixed in codebase (`PracticeService.getQuestionForTraining` now delegates to `getQuestion(..., includeAnswer=true)`, which only attaches `answer` for the author). Unit test: `practice.service.spec.ts`.
- **Endpoint:** `GET /practice/questions/:id`
- **Impact (before fix):** Any logged-in player received the correct `answer` before submitting.
- **Fix behavior:**
  - Non-author / training player: no `answer` field; grading via `POST /practice/questions/:id/answer`.
  - Author (edit / create response): still receives `answer`.
- **Deploy note:** Must ship API to PRO before the leak is gone in production.

---

## Observations (not blocking, confirm product intent)

### OBS-1 — LOW — Owner can play their own published event

- Owner successfully unlocked their own place on PRO.
- If product rule is “creators cannot play their own hunts”, add `assertCanPlay` ownership check; otherwise document as allowed (useful for self-QA).

### OBS-2 — LOW — Unlocking an ended event returns HTTP 404

- After owner `POST /events/:id/end`, player unlock returns **404** (not 403 with “event ended”).
- Works as a hard block, but client error messaging may be confusing (“not found” vs “event ended”). Prefer `403`/`400` with a clear message if UX matters.

---

## Flows verified PASS on PRO

### Auth
- Register ×10, duplicate register → 409, wrong password → 401
- Login, `/auth/me`, refresh token, logout
- Change password + re-login
- Forgot password (PRO does **not** return `devResetToken` — expected; email reset not fully e2e without inbox)
- Refresh token invalid after logout → 401

### Event create / publish
- Create draft → add place (radius 5000m at Hà Nội 21.0285, 105.8542) → publish-verify → publish
- Open event, password-protected event, gift event (gift code assigned)
- Schedule + cancel schedule
- Publish blocked without answer verify (`Answer verification incomplete`)
- Validation: short title / short password rejected

### Discover / join / play
- Nearby + list + details + places (answers not leaked on places endpoints)
- Wrong join password → 403; correct join → access
- Unlock outside radius blocked; answer before unlock blocked
- Password event cannot unlock without join
- Play TEXT / MULTIPLE_CHOICE / TRUE_FALSE
- Multi-place: cannot skip ahead; sequential unlock/answer works
- Wrong answer + report wrong answer + owner sees report counts
- Completion snapshot, profile completed-events, finishers, event/global leaderboard
- Case-insensitive TEXT answers work
- End event → further unlock blocked

### Favorites / practice / notifications / feedback / owner
- Favorite add/remove event & practice question
- Practice create + wrong/correct training answer (`isCorrect` field)
- Notifications list, unread count, preferences, mark read / read-all
- Feedback submit
- `/events/mine`, owner-places, finishers
- Unpublish cleanup (`isActive: false`)

---

## Not covered (needs manual / device / OAuth)

- Google / Facebook / Apple login (needs real provider tokens; PRO OAuth fallback should be off)
- Forgot → email link → reset password (needs mailbox access)
- Image upload / IMAGE question type / avatar upload (multipart)
- Push notification delivery (FCM device)
- Map / GPS UX on real device (API location gates verified with coords)
- Full UI-only flows (bottom sheets, navigation, i18n rendering)

---

## How to re-run

```bash
# Full suite creates 10 NEW accounts — avoid unless needed
node marvira_dashboard_api/scripts/pro-mobile-regression.mjs

# Edge suite reuses accounts from report JSON
node marvira_dashboard_api/scripts/pro-mobile-edge-cases.mjs
```

Reports:
- `marvira_dashboard_api/scripts/pro-mobile-regression-report.json`
- `marvira_dashboard_api/scripts/pro-mobile-edge-cases-report.json`
- This file: `docs/pro-mobile-bugs.md`
