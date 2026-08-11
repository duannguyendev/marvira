# Marvira docs — start here

Human reading map for the Marvira project. **Do not start with `requirement_all.txt`** unless you are regenerating source or need deep edge cases.

## Read in this order

| # | If you are… | Read | Time |
|---|-------------|------|------|
| 1 | New to Marvira | [PRODUCT_OVERVIEW.md](./PRODUCT_OVERVIEW.md) | ~10 min |
| 2 | Engineering / onboarding | [ARCHITECTURE.md](./ARCHITECTURE.md) | ~10 min |
| 3 | Checking vendors / accounts | [SERVICES.md](./SERVICES.md) | ~2 min |
| 4 | Setting up a machine | Repo READMEs below | — |
| 5 | Shipping / stores | Launch & ops links below | — |
| 6 | Recovering lost source | [`../requirement_all.txt`](../requirement_all.txt) §14–24 | deep |

## By role

### Product / PM / stakeholders
- [PRODUCT_OVERVIEW.md](./PRODUCT_OVERVIEW.md) — features & user flows
- [SCORING_AND_LEADERBOARD.md](./SCORING_AND_LEADERBOARD.md) — event vs global points, anti-abuse
- [`../growth_plan.txt`](../growth_plan.txt) — post-launch growth metrics
- [`../monetization_todo.txt`](../monetization_todo.txt) — ads / IAP (later)

### Mobile developers
- [`../marvira_mobile/README.md`](../marvira_mobile/README.md) — run the app
- [`../marvira_mobile/ANDROID_SETUP.md`](../marvira_mobile/ANDROID_SETUP.md)
- [`../marvira_mobile/FIREBASE_SETUP.md`](../marvira_mobile/FIREBASE_SETUP.md)
- [`../push_notification_requirement.txt`](../push_notification_requirement.txt) — FCM push + inbox (not shipped yet)
- [`../marvira_mobile/TROUBLESHOOTING.md`](../marvira_mobile/TROUBLESHOOTING.md)
- [`../marvira_mobile/CODEMAGIC.md`](../marvira_mobile/CODEMAGIC.md) — CI builds

### API / dashboard / marketing developers
- [`../marvira_dashboard_api/README.md`](../marvira_dashboard_api/README.md) — API + admin
- [`../marvira_dashboard_api/apps/marketing/README.md`](../marvira_dashboard_api/apps/marketing/README.md)
- [`../marvira_dashboard_api/docs/deployment.md`](../marvira_dashboard_api/docs/deployment.md)
- [`../marvira_dashboard_api/docs/backup-restore.md`](../marvira_dashboard_api/docs/backup-restore.md)
- [SERVICES.md](./SERVICES.md) — Railway / Neon / Redis / Resend / Mapbox / …

### Launch / ops / legal
- [`../go_live_update_checklist.txt`](../go_live_update_checklist.txt)
- [`../store_privacy_labels.txt`](../store_privacy_labels.txt) — App Store / Play copy-paste
- Marketing Privacy Policy: `apps/marketing` → `/privacy`

### QA
- [MANUAL_TEST_CASES.md](./MANUAL_TEST_CASES.md)
- API smoke: `marvira_dashboard_api/scripts/manual-test.ps1`

### AI / source regenerate only
- [`../requirement_all.txt`](../requirement_all.txt) — start at **RECOVERY** header, then **§14–24**
- Prefer live Prisma schema + `.env.example` for schema fidelity

## Repo map

```
marvira/
  marvira_mobile/           React Native player + creator app
  marvira_dashboard_api/    NestJS API + Next.js admin + marketing site
  docs/                     Human docs (this folder)
  requirement_all.txt       Full regenerate / deep requirements (large)
```

## What each big file is for

| File | Audience | Use for |
|------|----------|---------|
| `docs/PRODUCT_OVERVIEW.md` | Humans | “What does the product do?” |
| `docs/ARCHITECTURE.md` | Engineers | “How are the pieces connected?” |
| `docs/SERVICES.md` | Engineers / ops | “Which vendors do we use?” |
| `requirement_all.txt` | Agents / deep dive | Rebuild or precise acceptance criteria |
| `growth_plan.txt` | Product | Metrics & growth backlog |
| `go_live_update_checklist.txt` | Launch | Production / store gates |
| `store_privacy_labels.txt` | Launch | Store privacy forms |
| `monetization_todo.txt` | Later | Ads / subscriptions |
| `push_notification_requirement.txt` | Engineers | FCM + in-app inbox implement plan |
