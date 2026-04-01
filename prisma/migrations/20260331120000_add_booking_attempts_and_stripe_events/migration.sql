CREATE TYPE "booking_attempt_status" AS ENUM (
  'payment_pending',
  'paid',
  'booking_confirmed',
  'booking_failed',
  'payment_failed'
);

CREATE TABLE "booking_attempt" (
  "id" UUID NOT NULL,
  "org_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "staff_user_id" UUID,
  "meeting_type_id" UUID NOT NULL,
  "checkout_key" TEXT NOT NULL,
  "mode" "meeting_mode" NOT NULL,
  "status" "booking_attempt_status" NOT NULL DEFAULT 'payment_pending',
  "payment_status" "payment_status" NOT NULL DEFAULT 'unpaid',
  "payment_required" BOOLEAN NOT NULL DEFAULT TRUE,
  "price_cents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "start_local" TEXT NOT NULL,
  "requested_timezone" TEXT NOT NULL,
  "start_at_utc" TIMESTAMPTZ(6) NOT NULL,
  "end_at_utc" TIMESTAMPTZ(6) NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "booking_attempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment" (
  "id" UUID NOT NULL,
  "org_id" UUID NOT NULL,
  "booking_attempt_id" UUID NOT NULL,
  "provider" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "amount_cents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "stripe_checkout_session_id" TEXT,
  "stripe_payment_intent_id" TEXT,
  "last_stripe_event_id" TEXT,
  "metadata" JSONB,
  "paid_at" TIMESTAMPTZ(6),
  "failed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stripe_event" (
  "id" UUID NOT NULL,
  "org_id" UUID NOT NULL,
  "event_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "livemode" BOOLEAN NOT NULL,
  "payload" JSONB,
  "processed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stripe_event_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "appointment"
  ADD COLUMN "booking_attempt_id" UUID;

CREATE UNIQUE INDEX "appointment_booking_attempt_id_unique"
  ON "appointment" ("booking_attempt_id");

CREATE INDEX "booking_attempt_org_status_start_idx"
  ON "booking_attempt" ("org_id", "status", "start_at_utc");

CREATE INDEX "booking_attempt_user_created_idx"
  ON "booking_attempt" ("user_id", "created_at");

CREATE INDEX "booking_attempt_meeting_type_start_idx"
  ON "booking_attempt" ("meeting_type_id", "start_at_utc");

CREATE UNIQUE INDEX "booking_attempt_checkout_key_unique"
  ON "booking_attempt" ("checkout_key");

CREATE UNIQUE INDEX "payment_stripe_checkout_session_id_unique"
  ON "payment" ("stripe_checkout_session_id");

CREATE UNIQUE INDEX "payment_stripe_payment_intent_id_unique"
  ON "payment" ("stripe_payment_intent_id");

CREATE INDEX "payment_org_created_idx"
  ON "payment" ("org_id", "created_at");

CREATE INDEX "payment_booking_attempt_idx"
  ON "payment" ("booking_attempt_id");

CREATE UNIQUE INDEX "stripe_event_event_id_unique"
  ON "stripe_event" ("event_id");

CREATE INDEX "stripe_event_org_type_created_idx"
  ON "stripe_event" ("org_id", "event_type", "created_at");

ALTER TABLE "booking_attempt"
  ADD CONSTRAINT "booking_attempt_org_id_org_id_fk"
  FOREIGN KEY ("org_id") REFERENCES "org" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "booking_attempt"
  ADD CONSTRAINT "booking_attempt_user_id_app_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "app_user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "booking_attempt"
  ADD CONSTRAINT "booking_attempt_staff_user_id_app_user_id_fk"
  FOREIGN KEY ("staff_user_id") REFERENCES "app_user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "booking_attempt"
  ADD CONSTRAINT "booking_attempt_meeting_type_id_meeting_type_id_fk"
  FOREIGN KEY ("meeting_type_id") REFERENCES "meeting_type" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "payment"
  ADD CONSTRAINT "payment_org_id_org_id_fk"
  FOREIGN KEY ("org_id") REFERENCES "org" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "payment"
  ADD CONSTRAINT "payment_booking_attempt_id_booking_attempt_id_fk"
  FOREIGN KEY ("booking_attempt_id") REFERENCES "booking_attempt" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "stripe_event"
  ADD CONSTRAINT "stripe_event_org_id_org_id_fk"
  FOREIGN KEY ("org_id") REFERENCES "org" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "appointment"
  ADD CONSTRAINT "appointment_booking_attempt_id_booking_attempt_id_fk"
  FOREIGN KEY ("booking_attempt_id") REFERENCES "booking_attempt" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "appointment"
  ADD CONSTRAINT "appointment_no_overlap_staff"
  EXCLUDE USING gist (
    "org_id" WITH =,
    "staff_user_id" WITH =,
    tstzrange("start_at_utc", "end_at_utc", '[)') WITH &&
  )
  WHERE (
    "staff_user_id" IS NOT NULL
    AND "status" IN ('pending', 'confirmed', 'completed')
  );

ALTER TABLE "appointment"
  ADD CONSTRAINT "appointment_no_overlap_org_default"
  EXCLUDE USING gist (
    "org_id" WITH =,
    tstzrange("start_at_utc", "end_at_utc", '[)') WITH &&
  )
  WHERE (
    "staff_user_id" IS NULL
    AND "status" IN ('pending', 'confirmed', 'completed')
  );
