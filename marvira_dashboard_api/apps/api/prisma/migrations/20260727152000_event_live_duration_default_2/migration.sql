-- Default live duration: 2 days (hunts are short-lived; staff can raise in Settings)
UPDATE "app_settings"
SET "value" = '2', "updated_at" = NOW()
WHERE "key" = 'event_live_duration_days'
  AND "value" = '30';
