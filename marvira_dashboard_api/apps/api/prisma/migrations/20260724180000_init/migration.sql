-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'FACEBOOK', 'APPLE', 'LOCAL');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TEXT', 'TRUE_FALSE', 'IMAGE');

-- CreateEnum
CREATE TYPE "QuestionSource" AS ENUM ('COMMUNITY', 'EVENT');

-- CreateEnum
CREATE TYPE "EventDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('SUSPEND_PLAY_1_DAY', 'SUSPEND_PLAY_2_DAYS', 'SUSPEND_PLAY_1_WEEK', 'SUSPEND_PLAY_1_MONTH', 'LIFT_SUSPENSION', 'DEACTIVATE', 'ACTIVATE', 'RESET_WARNING_POINTS');

-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('FEEDBACK', 'SUGGESTION', 'BUG', 'OTHER');

-- CreateEnum
CREATE TYPE "FeedbackSource" AS ENUM ('WEB', 'MOBILE');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'READ', 'RESOLVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "password_hash" TEXT,
    "provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "warning_points" INTEGER NOT NULL DEFAULT 0,
    "play_suspended_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "cover_image" TEXT,
    "difficulty" "EventDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "reward_points" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT NOT NULL DEFAULT 'vi',
    "join_password_hash" TEXT,
    "completion_message" TEXT,
    "gift_teaser" TEXT,
    "gift_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "places" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radius_meters" INTEGER NOT NULL DEFAULT 100,
    "order_index" INTEGER NOT NULL,
    "hint" TEXT,
    "question_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL DEFAULT 'TEXT',
    "image_url" TEXT,
    "options" JSONB,
    "answer" TEXT NOT NULL,
    "explanation" TEXT,
    "points" INTEGER NOT NULL DEFAULT 10,
    "language" TEXT NOT NULL DEFAULT 'vi',
    "created_by" TEXT,
    "source" "QuestionSource" NOT NULL DEFAULT 'EVENT',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_questions" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "event_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_event_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "current_place_index" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "total_duration_ms" INTEGER,
    "finish_rank" INTEGER,
    "gift_code_awarded" TEXT,

    CONSTRAINT "user_event_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_event_access" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_event_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_place_completion" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "answer" TEXT,
    "unlocked_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "answer_duration_ms" INTEGER,

    CONSTRAINT "user_place_completion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_name" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_practice_completions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_practice_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_favorite_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorite_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_favorite_questions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorite_questions_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "category" "FeedbackCategory" NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "source" "FeedbackSource" NOT NULL,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'NEW',
    "admin_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "place_name" TEXT NOT NULL,
    "city" TEXT,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "cover_image" TEXT,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "event_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_warning_points_idx" ON "users"("warning_points");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "events_city_idx" ON "events"("city");

-- CreateIndex
CREATE INDEX "events_is_active_idx" ON "events"("is_active");

-- CreateIndex
CREATE INDEX "events_language_idx" ON "events"("language");

-- CreateIndex
CREATE INDEX "places_event_id_order_index_idx" ON "places"("event_id", "order_index");

-- CreateIndex
CREATE INDEX "questions_source_is_published_idx" ON "questions"("source", "is_published");

-- CreateIndex
CREATE INDEX "questions_source_is_published_language_idx" ON "questions"("source", "is_published", "language");

-- CreateIndex
CREATE INDEX "questions_created_by_idx" ON "questions"("created_by");

-- CreateIndex
CREATE INDEX "questions_language_idx" ON "questions"("language");

-- CreateIndex
CREATE INDEX "event_questions_event_id_order_index_idx" ON "event_questions"("event_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "event_questions_event_id_question_id_key" ON "event_questions"("event_id", "question_id");

-- CreateIndex
CREATE INDEX "user_event_progress_user_id_idx" ON "user_event_progress"("user_id");

-- CreateIndex
CREATE INDEX "user_event_progress_event_id_idx" ON "user_event_progress"("event_id");

-- CreateIndex
CREATE INDEX "user_event_progress_event_id_completed_score_total_duration_idx" ON "user_event_progress"("event_id", "completed", "score", "total_duration_ms");

-- CreateIndex
CREATE INDEX "user_event_progress_event_id_completed_completed_at_idx" ON "user_event_progress"("event_id", "completed", "completed_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_event_progress_user_id_event_id_key" ON "user_event_progress"("user_id", "event_id");

-- CreateIndex
CREATE INDEX "user_event_access_user_id_idx" ON "user_event_access"("user_id");

-- CreateIndex
CREATE INDEX "user_event_access_event_id_idx" ON "user_event_access"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_event_access_user_id_event_id_key" ON "user_event_access"("user_id", "event_id");

-- CreateIndex
CREATE INDEX "user_place_completion_user_id_idx" ON "user_place_completion"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_place_completion_user_id_place_id_key" ON "user_place_completion"("user_id", "place_id");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_refresh_token_idx" ON "sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "analytics_events_event_name_idx" ON "analytics_events"("event_name");

-- CreateIndex
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events"("created_at");

-- CreateIndex
CREATE INDEX "user_practice_completions_user_id_idx" ON "user_practice_completions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_practice_completions_user_id_question_id_key" ON "user_practice_completions"("user_id", "question_id");

-- CreateIndex
CREATE INDEX "user_favorite_events_user_id_idx" ON "user_favorite_events"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_favorite_events_user_id_event_id_key" ON "user_favorite_events"("user_id", "event_id");

-- CreateIndex
CREATE INDEX "user_favorite_questions_user_id_idx" ON "user_favorite_questions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_favorite_questions_user_id_question_id_key" ON "user_favorite_questions"("user_id", "question_id");

-- CreateIndex
CREATE INDEX "user_location_warnings_user_id_created_at_idx" ON "user_location_warnings"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_location_warnings_code_idx" ON "user_location_warnings"("code");

-- CreateIndex
CREATE INDEX "user_moderation_actions_user_id_created_at_idx" ON "user_moderation_actions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "feedback_status_idx" ON "feedback"("status");

-- CreateIndex
CREATE INDEX "feedback_category_idx" ON "feedback"("category");

-- CreateIndex
CREATE INDEX "feedback_source_idx" ON "feedback"("source");

-- CreateIndex
CREATE INDEX "feedback_created_at_idx" ON "feedback"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_status_idx" ON "articles"("status");

-- CreateIndex
CREATE INDEX "articles_slug_idx" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_published_at_idx" ON "articles"("published_at");

-- CreateIndex
CREATE INDEX "articles_place_name_idx" ON "articles"("place_name");

-- CreateIndex
CREATE INDEX "articles_city_idx" ON "articles"("city");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_questions" ADD CONSTRAINT "event_questions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_questions" ADD CONSTRAINT "event_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_event_progress" ADD CONSTRAINT "user_event_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_event_progress" ADD CONSTRAINT "user_event_progress_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_event_access" ADD CONSTRAINT "user_event_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_event_access" ADD CONSTRAINT "user_event_access_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_place_completion" ADD CONSTRAINT "user_place_completion_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_place_completion" ADD CONSTRAINT "user_place_completion_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_practice_completions" ADD CONSTRAINT "user_practice_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_practice_completions" ADD CONSTRAINT "user_practice_completions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_events" ADD CONSTRAINT "user_favorite_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_events" ADD CONSTRAINT "user_favorite_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_questions" ADD CONSTRAINT "user_favorite_questions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_questions" ADD CONSTRAINT "user_favorite_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_location_warnings" ADD CONSTRAINT "user_location_warnings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_moderation_actions" ADD CONSTRAINT "user_moderation_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_moderation_actions" ADD CONSTRAINT "user_moderation_actions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- PostGIS is optional; API falls back to haversine when the extension is unavailable.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS postgis;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'PostGIS extension not available — using haversine fallback';
END
$$;

-- Spatial index for nearby place queries (only when PostGIS is installed).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    CREATE INDEX IF NOT EXISTS places_geo_idx
      ON places USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));
  END IF;
END
$$;
