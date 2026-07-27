-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- Seed default live duration (30 days)
INSERT INTO "app_settings" ("key", "value", "updated_at")
VALUES ('event_live_duration_days', '30', NOW())
ON CONFLICT ("key") DO NOTHING;
