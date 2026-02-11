-- AlterTable
ALTER TABLE "org_settings" ADD COLUMN     "allowed_currencies" TEXT[],
ADD COLUMN     "notify_calendar_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notify_email_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notify_whatsapp" TEXT[],
ADD COLUMN     "notify_whatsapp_enabled" BOOLEAN NOT NULL DEFAULT false;
