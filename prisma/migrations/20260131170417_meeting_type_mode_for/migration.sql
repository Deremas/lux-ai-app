-- AlterTable
ALTER TABLE "meeting_type" ADD COLUMN     "payment_policy" "payment_policy";

-- AlterTable
ALTER TABLE "meeting_type_mode" ADD COLUMN     "details" JSONB;

-- AlterTable
ALTER TABLE "meeting_type_translation" ADD COLUMN     "subtitle" TEXT;
