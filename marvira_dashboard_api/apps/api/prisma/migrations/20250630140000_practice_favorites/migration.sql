-- CreateEnum
CREATE TYPE "QuestionSource" AS ENUM ('COMMUNITY', 'EVENT');

-- AlterTable
ALTER TABLE "questions" ADD COLUMN "created_by" TEXT,
ADD COLUMN "source" "QuestionSource" NOT NULL DEFAULT 'EVENT',
ADD COLUMN "is_published" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "questions_source_is_published_idx" ON "questions"("source", "is_published");
CREATE INDEX "questions_created_by_idx" ON "questions"("created_by");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

-- CreateIndex
CREATE UNIQUE INDEX "user_practice_completions_user_id_question_id_key" ON "user_practice_completions"("user_id", "question_id");
CREATE INDEX "user_practice_completions_user_id_idx" ON "user_practice_completions"("user_id");

CREATE UNIQUE INDEX "user_favorite_events_user_id_event_id_key" ON "user_favorite_events"("user_id", "event_id");
CREATE INDEX "user_favorite_events_user_id_idx" ON "user_favorite_events"("user_id");

CREATE UNIQUE INDEX "user_favorite_questions_user_id_question_id_key" ON "user_favorite_questions"("user_id", "question_id");
CREATE INDEX "user_favorite_questions_user_id_idx" ON "user_favorite_questions"("user_id");

-- AddForeignKey
ALTER TABLE "user_practice_completions" ADD CONSTRAINT "user_practice_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_practice_completions" ADD CONSTRAINT "user_practice_completions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_favorite_events" ADD CONSTRAINT "user_favorite_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_favorite_events" ADD CONSTRAINT "user_favorite_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_favorite_questions" ADD CONSTRAINT "user_favorite_questions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_favorite_questions" ADD CONSTRAINT "user_favorite_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
