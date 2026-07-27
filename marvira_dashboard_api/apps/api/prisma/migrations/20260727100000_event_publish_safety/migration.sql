-- Event publish safety: verify passes, answer reports, scheduled publish, answer updated tracking

ALTER TABLE "events" ADD COLUMN "scheduled_publish_at" TIMESTAMP(3);

ALTER TABLE "questions" ADD COLUMN "answer_updated_at" TIMESTAMP(3);

CREATE TABLE "event_publish_verify_passes" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "verified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_publish_verify_passes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "place_answer_reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "place_answer_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_publish_verify_passes_event_id_question_id_key" ON "event_publish_verify_passes"("event_id", "question_id");
CREATE INDEX "event_publish_verify_passes_event_id_idx" ON "event_publish_verify_passes"("event_id");

CREATE UNIQUE INDEX "place_answer_reports_user_id_place_id_key" ON "place_answer_reports"("user_id", "place_id");
CREATE INDEX "place_answer_reports_place_id_idx" ON "place_answer_reports"("place_id");
CREATE INDEX "place_answer_reports_event_id_idx" ON "place_answer_reports"("event_id");

ALTER TABLE "event_publish_verify_passes" ADD CONSTRAINT "event_publish_verify_passes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_publish_verify_passes" ADD CONSTRAINT "event_publish_verify_passes_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "place_answer_reports" ADD CONSTRAINT "place_answer_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "place_answer_reports" ADD CONSTRAINT "place_answer_reports_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "place_answer_reports" ADD CONSTRAINT "place_answer_reports_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
