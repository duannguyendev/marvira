-- AlterTable
ALTER TABLE "user_event_progress" ADD COLUMN "global_score" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "user_event_progress_completed_global_score_idx" ON "user_event_progress"("completed", "global_score");

-- Backfill completed rows (no daily cap). Creators stay at 0.
-- Formula: clamp(50 + places*20 + min(max(score - reward_points, 0), 200), 0, 300)
UPDATE "user_event_progress" AS uep
SET "global_score" = LEAST(
  300,
  GREATEST(
    0,
    50
      + (SELECT COUNT(*)::int FROM "places" p WHERE p."event_id" = uep."event_id") * 20
      + LEAST(GREATEST(uep."score" - e."reward_points", 0), 200)
  )
)
FROM "events" e
WHERE e."id" = uep."event_id"
  AND uep."completed" = true
  AND uep."user_id" <> e."created_by";
