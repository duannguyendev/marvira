-- Per-place and per-event duration tracking for leaderboards
ALTER TABLE "user_place_completion" ADD COLUMN IF NOT EXISTS "unlocked_at" TIMESTAMP(3);
ALTER TABLE "user_place_completion" ADD COLUMN IF NOT EXISTS "answer_duration_ms" INTEGER;

ALTER TABLE "user_event_progress" ADD COLUMN IF NOT EXISTS "total_duration_ms" INTEGER;

CREATE INDEX IF NOT EXISTS "user_event_progress_event_id_completed_score_total_duration_ms_idx"
  ON "user_event_progress"("event_id", "completed", "score", "total_duration_ms");
