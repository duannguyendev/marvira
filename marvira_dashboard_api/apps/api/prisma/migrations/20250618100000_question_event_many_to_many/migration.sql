-- Add timestamps to questions
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Event <-> Question junction
CREATE TABLE "event_questions" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "event_questions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_questions_event_id_question_id_key" ON "event_questions"("event_id", "question_id");
CREATE INDEX "event_questions_event_id_order_index_idx" ON "event_questions"("event_id", "order_index");

ALTER TABLE "event_questions" ADD CONSTRAINT "event_questions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_questions" ADD CONSTRAINT "event_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Place references a question from the event pool
ALTER TABLE "places" ADD COLUMN "question_id" TEXT;
ALTER TABLE "places" ADD CONSTRAINT "places_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate existing place-bound questions into the new model
INSERT INTO "event_questions" ("id", "event_id", "question_id", "order_index")
SELECT gen_random_uuid()::text, p."event_id", q."id", p."order_index"
FROM "questions" q
JOIN "places" p ON p."id" = q."place_id"
ON CONFLICT ("event_id", "question_id") DO NOTHING;

UPDATE "places" p
SET "question_id" = q."id"
FROM "questions" q
WHERE q."place_id" = p."id";

ALTER TABLE "questions" DROP CONSTRAINT IF EXISTS "questions_place_id_fkey";
DROP INDEX IF EXISTS "questions_place_id_key";
ALTER TABLE "questions" DROP COLUMN "place_id";
