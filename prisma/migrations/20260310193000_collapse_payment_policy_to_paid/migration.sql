ALTER TYPE "payment_policy" RENAME TO "payment_policy_old";

CREATE TYPE "payment_policy" AS ENUM ('FREE', 'PAID');

ALTER TABLE "org_settings"
  ALTER COLUMN "payment_policy" DROP DEFAULT;

ALTER TABLE "org_settings"
  ALTER COLUMN "payment_policy" TYPE "payment_policy"
  USING (
    CASE
      WHEN "payment_policy"::text = 'FREE' THEN 'FREE'
      ELSE 'PAID'
    END
  )::"payment_policy";

ALTER TABLE "meeting_type"
  ALTER COLUMN "payment_policy" TYPE "payment_policy"
  USING (
    CASE
      WHEN "payment_policy" IS NULL THEN NULL
      WHEN "payment_policy"::text = 'FREE' THEN 'FREE'
      ELSE 'PAID'
    END
  )::"payment_policy";

ALTER TABLE "appointment"
  ALTER COLUMN "payment_policy" TYPE "payment_policy"
  USING (
    CASE
      WHEN "payment_policy" IS NULL THEN NULL
      WHEN "payment_policy"::text = 'FREE' THEN 'FREE'
      ELSE 'PAID'
    END
  )::"payment_policy";

UPDATE "meeting_type"
SET "requires_payment" = CASE
  WHEN "payment_policy" IS NULL THEN "requires_payment"
  WHEN "payment_policy"::text = 'PAID' THEN TRUE
  ELSE FALSE
END;

UPDATE "appointment"
SET "requires_payment" = CASE
  WHEN "payment_policy" IS NULL THEN "requires_payment"
  WHEN "payment_policy"::text = 'PAID' THEN TRUE
  ELSE FALSE
END;

ALTER TABLE "org_settings"
  ALTER COLUMN "payment_policy" SET DEFAULT 'FREE';

DROP TYPE "payment_policy_old";
