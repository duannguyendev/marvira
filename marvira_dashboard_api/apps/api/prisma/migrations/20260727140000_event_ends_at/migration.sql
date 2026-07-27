-- AlterTable
ALTER TABLE "events" ADD COLUMN "ends_at" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN "ended_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "events_ends_at_idx" ON "events"("ends_at");
CREATE INDEX "events_ended_at_idx" ON "events"("ended_at");

-- Backfill: currently live events get a 30-day auto-end window from now
UPDATE "events"
SET "ends_at" = NOW() + INTERVAL '30 days'
WHERE "is_active" = true
  AND "ends_at" IS NULL
  AND "ended_at" IS NULL;
