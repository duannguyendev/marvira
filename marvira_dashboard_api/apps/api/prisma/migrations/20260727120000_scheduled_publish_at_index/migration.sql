-- Index for scheduled publish safety poll / due queries
CREATE INDEX IF NOT EXISTS "events_scheduled_publish_at_idx" ON "events"("scheduled_publish_at");
