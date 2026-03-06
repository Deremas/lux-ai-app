-- AlterTable
ALTER TABLE "org_secret" ADD COLUMN     "stripe_publishable_key_enc" TEXT,
ADD COLUMN     "stripe_secret_key_enc" TEXT,
ADD COLUMN     "stripe_webhook_secret_enc" TEXT;

-- AlterTable
ALTER TABLE "org_settings" ALTER COLUMN "notify_emails" DROP DEFAULT,
ALTER COLUMN "allowed_currencies" DROP DEFAULT,
ALTER COLUMN "notify_whatsapp" DROP DEFAULT;
