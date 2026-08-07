# Marvira — product overview

**Marvira** is a location-based scavenger hunt / city exploration app. Players walk to real places, unlock stops with GPS, answer questions, and compete on leaderboards. Creators can publish hunts from the mobile app; staff manage content and ops from an admin dashboard.

Tagline (marketing): *City adventure, on foot.*

---

## Who uses it

| Role | Surface | What they do |
|------|---------|----------------|
| Player | Mobile app | Discover hunts, play, practice, favorites, leaderboards |
| Creator | Mobile app | Create / publish / manage own events (My Events) |
| Staff / Admin | Dashboard | Users, events, questions, practice moderation, analytics, feedback |
| Public visitor | Marketing site | Learn about Marvira, Explore articles, invite pages, support / privacy |

---

## Core player loop (hunt)

1. Browse or open an event (nearby / search / invite link).
2. If password-protected → enter shared password once to unlock play.
3. Travel to **Place #1** → GPS unlock when inside radius.
4. Answer the place question → on success, next place unlocks.
5. Repeat until the hunt is complete → score, time, optional gift code, share.

Admin configures the full hunt; **mobile enforces linear unlock** (you cannot skip ahead).

---

## Main features (v1)

### Mobile — play
- Auth (email/password; Google OAuth supported in stack)
- Events list / nearby / search / details + map
- Place gameplay (unlock → question → next)
- Event + global leaderboards
- Favorites (events & practice questions)
- Profile, settings, language (vi / en / zh / ja)
- In-app feedback
- Invite / deep links into an event

### Mobile — practice
- Community practice question list
- Training (answer practice questions)
- My Questions (create / manage own practice questions)
- Content language filter (+ optional “All languages”)

### Mobile — create
- Multi-step wizard: event info → places + questions → review → publish
- Question types: text, true/false, multiple choice, **image** (camera/gallery)
- Public or password-protected hunts
- Optional completion message + gift codes for first N finishers
- My Events list (draft / published)

### Admin dashboard
- Users, events (place-first editor), questions bank
- Event participants / finishers
- Practice question moderation + stats
- Ops analytics (completions, engagement — **not** Firebase MAU)
- Feedback inbox
- Push notifications + in-app notification inbox (FCM; transactional gameplay/creator alerts)
- Articles for marketing Explore

### Marketing site
- Landing / brand pages
- Explore (articles)
- Public invite / event entry pages (no answer spoilers)
- Support feedback form, Privacy Policy, Terms

### Product analytics (mobile)
- Firebase Analytics + Crashlytics for MAU / funnels / crashes
- Ops charts stay on the admin dashboard
- Details: `requirement_all.txt` §24; setup: `marvira_mobile/FIREBASE_SETUP.md`

---

## Important product rules

- **Precise GPS** is required for gameplay unlock; it is not sent as lat/lng in Firebase Analytics params.
- **Private hunts** stay visible in browse with a lock badge; only play is gated by password.
- **Gifts**: first N finishers by completion time get codes; public UI shows teaser/count, never unused codes.
- **Content language**: Practice and discovery default to the user’s content language; My Events / deep links are not filtered out.
- **Kids**: not directed at children under 13 (see Privacy Policy).
- **Scores**: event `rewardPoints` affect **event** leaderboards only. Global rank uses a platform formula (`globalScore`) with creator exclusion and daily caps — see [SCORING_AND_LEADERBOARD.md](./SCORING_AND_LEADERBOARD.md).

---

## What is not in v1 (see companions)

| Topic | Where |
|-------|--------|
| Ads / IAP / subscriptions | `monetization_todo.txt` |
| Growth experiments & north-star metrics | `growth_plan.txt` |
| Production store / Firebase launch checklist | `go_live_update_checklist.txt` |

---

## Seed accounts (local)

Typical local seeds (see API README / manual tests):

- Admin: `admin@marvira.com` / `admin123`
- Demo player: `demo@marvira.com` / `demo123`
- Staff: `staff@marvira.com` (see seed)

---

## Next reading

- How systems connect → [ARCHITECTURE.md](./ARCHITECTURE.md)
- Scoring rules → [SCORING_AND_LEADERBOARD.md](./SCORING_AND_LEADERBOARD.md)
- Doc index → [README.md](./README.md)
- Deep acceptance / regenerate → [`../requirement_all.txt`](../requirement_all.txt) §14–24
