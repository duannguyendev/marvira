-- AlterTable
ALTER TABLE "events" ADD COLUMN "join_password_hash" TEXT;

-- CreateTable
CREATE TABLE "user_event_access" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_event_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_event_access_user_id_idx" ON "user_event_access"("user_id");

-- CreateIndex
CREATE INDEX "user_event_access_event_id_idx" ON "user_event_access"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_event_access_user_id_event_id_key" ON "user_event_access"("user_id", "event_id");

-- AddForeignKey
ALTER TABLE "user_event_access" ADD CONSTRAINT "user_event_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_event_access" ADD CONSTRAINT "user_event_access_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
