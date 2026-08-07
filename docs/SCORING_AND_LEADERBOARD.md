# Scoring & leaderboards — rules

Clear product rules for event rewards vs the global leaderboard. Implementation: API `ProgressService` + `global-score.util.ts`.

## Two separate score systems

| Score | Stored as | Used for | Who controls it |
|-------|-----------|----------|-----------------|
| **Event score** | `UserEventProgress.score` | Event leaderboard, finish celebrations, gifts | Creator (`question.points` + `event.rewardPoints`) |
| **Global contribution** | `UserEventProgress.globalScore` | Global leaderboard only | Platform formula (not creator reward) |

**Creator-set `rewardPoints` never increase global rank.** They only boost competition inside that event.

## Event score (unchanged gameplay)

On each correct place answer:

- Add `question.points`
- On the **last** place, also add `event.rewardPoints`

Event leaderboard order: `score DESC`, then `totalDurationMs ASC`.

### Reward points caps (event-only)

| Role | Max `rewardPoints` |
|------|--------------------|
| `USER` | 1,000 |
| `STAFF` / `ADMIN` | 10,000 |

Question points remain `1…1,000` per question (event score only; global uses a separate cap below).

## Global contribution formula

Awarded **once** when a player completes an event (snapshot on `globalScore`):

```text
raw = BASE + placeCount × PER_PLACE + min(questionPointsEarned, QUESTION_CAP)
contribution = clamp(raw, 0, PER_EVENT_CAP)
```

Constants (source of truth in code):

| Constant | Value | Meaning |
|----------|------:|---------|
| `BASE` | 50 | Flat completion credit |
| `PER_PLACE` | 20 | Credit per place in the hunt |
| `QUESTION_CAP` | 200 | Max question-points credit toward global |
| `PER_EVENT_CAP` | 300 | Hard max global points from one event |
| `DAILY_GLOBAL_CAP` | 1,000 | Soft max global points per user per UTC day |

`questionPointsEarned` = event score minus `rewardPoints` at completion (sum of place question points).

### Anti-abuse rules

1. **No self-boost:** if `userId === event.createdBy`, `globalScore = 0`.
2. **One credit per user per event** (progress row is unique).
3. **Daily soft cap:** further completions that UTC day get remaining budget only (`min(contribution, DAILY_GLOBAL_CAP − today’s sum)`).
4. Completing your own hunt still earns **event score** / gifts / event rank — only global credit is withheld.

## Global leaderboard ranking

Order:

1. `SUM(globalScore)` descending  
2. events completed (completed progress rows) descending  
3. average `totalDurationMs` ascending  

## Fair-play expectations (also in Terms)

- Do not create events or alt accounts to inflate rankings.
- Do not spoof GPS or otherwise cheat location checks.
- Marvira may recalculate, withhold, or remove global points and suspend accounts that abuse scoring.

## What we deliberately do not do (v1)

- Deferred credit waiting for N other finishers (may add later).
- Rolling-window-only global boards (may add later).
- Letting anticheat warnings auto-zero global score (moderation remains manual / suspension-based).
