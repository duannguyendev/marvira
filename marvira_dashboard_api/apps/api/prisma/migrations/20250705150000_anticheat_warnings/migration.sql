-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM (
  'SUSPEND_PLAY_1_DAY',
  'SUSPEND_PLAY_2_DAYS',
  'SUSPEND_PLAY_1_WEEK',
  'SUSPEND_PLAY_1_MONTH',
  'LIFT_SUSPENSION',
  'DEACTIVATE',
  'ACTIVATE',
  'RESET_WARNING_POINTS'
);

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "warning_points" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "play_suspended_until" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "users_warning_points_idx" ON "users"("warning_points");

-- CreateTable
CREATE TABLE "user_location_warnings" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "place_id" TEXT,
  "event_id" TEXT,
  "payload" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_location_warnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_moderation_actions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "admin_id" TEXT NOT NULL,
  "action" "ModerationActionType" NOT NULL,
  "reason" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_location_warnings_user_id_created_at_idx" ON "user_location_warnings"("user_id", "created_at");
CREATE INDEX "user_location_warnings_code_idx" ON "user_location_warnings"("code");
CREATE INDEX "user_moderation_actions_user_id_created_at_idx" ON "user_moderation_actions"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "user_location_warnings"
  ADD CONSTRAINT "user_location_warnings_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_moderation_actions"
  ADD CONSTRAINT "user_moderation_actions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_moderation_actions"
  ADD CONSTRAINT "user_moderation_actions_admin_id_fkey"
  FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
