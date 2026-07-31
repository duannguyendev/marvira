-- Persist OAuth provider subject ids for stable return logins (esp. Apple Hide My Email).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "provider_user_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_provider_provider_user_id_key"
ON "users"("provider", "provider_user_id");
