-- Create notification templates table
CREATE TABLE "notification_template" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "channel" "notification_channel" NOT NULL,
    "key" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notification_template_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "notification_template_org_channel_key_unique"
ON "notification_template"("org_id", "channel", "key");

CREATE INDEX "notification_template_org_channel_idx"
ON "notification_template"("org_id", "channel");

-- Foreign keys
ALTER TABLE "notification_template"
ADD CONSTRAINT "notification_template_org_id_fkey"
FOREIGN KEY ("org_id") REFERENCES "org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill org_settings arrays to avoid nulls
UPDATE "org_settings" SET "notify_emails" = '{}' WHERE "notify_emails" IS NULL;
UPDATE "org_settings" SET "notify_whatsapp" = '{}' WHERE "notify_whatsapp" IS NULL;
UPDATE "org_settings" SET "allowed_currencies" = '{}' WHERE "allowed_currencies" IS NULL;

-- Enforce defaults + non-null for org_settings arrays
ALTER TABLE "org_settings"
  ALTER COLUMN "notify_emails" SET DEFAULT '{}'::text[],
  ALTER COLUMN "notify_emails" SET NOT NULL,
  ALTER COLUMN "notify_whatsapp" SET DEFAULT '{}'::text[],
  ALTER COLUMN "notify_whatsapp" SET NOT NULL,
  ALTER COLUMN "allowed_currencies" SET DEFAULT '{}'::text[],
  ALTER COLUMN "allowed_currencies" SET NOT NULL;
