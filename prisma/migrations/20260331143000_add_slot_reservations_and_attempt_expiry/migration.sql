ALTER TYPE "booking_attempt_status" ADD VALUE IF NOT EXISTS 'payment_processing';
ALTER TYPE "booking_attempt_status" ADD VALUE IF NOT EXISTS 'expired';
ALTER TYPE "booking_attempt_status" ADD VALUE IF NOT EXISTS 'cancelled';

CREATE TYPE "slot_reservation_status" AS ENUM (
  'active',
  'consumed',
  'expired',
  'released'
);

CREATE TYPE "stripe_event_status" AS ENUM (
  'processing',
  'processed',
  'failed'
);

ALTER TABLE "booking_attempt"
  ADD COLUMN "reserved_until" TIMESTAMPTZ(6),
  ADD COLUMN "failure_reason" TEXT;

ALTER TABLE "payment"
  ADD COLUMN "webhook_confirmed_at" TIMESTAMPTZ(6);

ALTER TABLE "stripe_event"
  ADD COLUMN "status" "stripe_event_status" NOT NULL DEFAULT 'processing',
  ADD COLUMN "last_error" TEXT,
  ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "stripe_event"
SET "status" = CASE
  WHEN "processed_at" IS NOT NULL THEN 'processed'::"stripe_event_status"
  ELSE 'processing'::"stripe_event_status"
END;

DROP INDEX "booking_attempt_checkout_key_unique";

CREATE INDEX "booking_attempt_checkout_key_created_idx"
  ON "booking_attempt" ("checkout_key", "created_at");

CREATE UNIQUE INDEX "payment_booking_attempt_id_unique"
  ON "payment" ("booking_attempt_id");

CREATE TABLE "slot_reservation" (
  "id" UUID NOT NULL,
  "org_id" UUID NOT NULL,
  "booking_attempt_id" UUID NOT NULL,
  "meeting_type_id" UUID NOT NULL,
  "staff_user_id" UUID,
  "start_at_utc" TIMESTAMPTZ(6) NOT NULL,
  "end_at_utc" TIMESTAMPTZ(6) NOT NULL,
  "reserved_until" TIMESTAMPTZ(6) NOT NULL,
  "status" "slot_reservation_status" NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "slot_reservation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "slot_reservation_booking_attempt_id_unique"
  ON "slot_reservation" ("booking_attempt_id");

CREATE INDEX "slot_reservation_org_status_reserved_until_idx"
  ON "slot_reservation" ("org_id", "status", "reserved_until");

CREATE INDEX "slot_reservation_meeting_type_start_idx"
  ON "slot_reservation" ("meeting_type_id", "start_at_utc");

CREATE INDEX "slot_reservation_staff_start_idx"
  ON "slot_reservation" ("staff_user_id", "start_at_utc");

ALTER TABLE "slot_reservation"
  ADD CONSTRAINT "slot_reservation_org_id_org_id_fk"
  FOREIGN KEY ("org_id") REFERENCES "org" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "slot_reservation"
  ADD CONSTRAINT "slot_reservation_booking_attempt_id_booking_attempt_id_fk"
  FOREIGN KEY ("booking_attempt_id") REFERENCES "booking_attempt" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "slot_reservation"
  ADD CONSTRAINT "slot_reservation_meeting_type_id_meeting_type_id_fk"
  FOREIGN KEY ("meeting_type_id") REFERENCES "meeting_type" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "slot_reservation"
  ADD CONSTRAINT "slot_reservation_staff_user_id_app_user_id_fk"
  FOREIGN KEY ("staff_user_id") REFERENCES "app_user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "slot_reservation"
  ADD CONSTRAINT "slot_reservation_no_overlap_staff"
  EXCLUDE USING gist (
    "org_id" WITH =,
    "staff_user_id" WITH =,
    tstzrange("start_at_utc", "end_at_utc", '[)') WITH &&
  )
  WHERE (
    "staff_user_id" IS NOT NULL
    AND "status" = 'active'
  );

ALTER TABLE "slot_reservation"
  ADD CONSTRAINT "slot_reservation_no_overlap_org_default"
  EXCLUDE USING gist (
    "org_id" WITH =,
    tstzrange("start_at_utc", "end_at_utc", '[)') WITH &&
  )
  WHERE (
    "staff_user_id" IS NULL
    AND "status" = 'active'
  );
