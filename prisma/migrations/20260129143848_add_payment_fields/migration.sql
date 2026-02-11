-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('not_required', 'unpaid', 'paid');

-- AlterTable
ALTER TABLE "appointment" ADD COLUMN     "currency" TEXT,
ADD COLUMN     "payment_policy" "payment_policy",
ADD COLUMN     "payment_status" "payment_status",
ADD COLUMN     "price_cents" INTEGER,
ADD COLUMN     "requires_payment" BOOLEAN;
