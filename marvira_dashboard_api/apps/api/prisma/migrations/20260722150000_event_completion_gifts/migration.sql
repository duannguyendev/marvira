-- AlterTable
ALTER TABLE "events" ADD COLUMN "completion_message" TEXT,
ADD COLUMN "gift_teaser" TEXT,
ADD COLUMN "gift_codes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "user_event_progress" ADD COLUMN "finish_rank" INTEGER,
ADD COLUMN "gift_code_awarded" TEXT;

-- CreateIndex
CREATE INDEX "user_event_progress_event_id_completed_completed_at_idx" ON "user_event_progress"("event_id", "completed", "completed_at");
