-- CreateEnum
CREATE TYPE "locale" AS ENUM ('en', 'fr', 'de', 'lb');

-- CreateEnum
CREATE TYPE "appointment_status" AS ENUM ('pending', 'confirmed', 'declined', 'completed');

-- CreateEnum
CREATE TYPE "approval_policy" AS ENUM ('AUTO_APPROVE', 'REQUIRES_APPROVAL');

-- CreateEnum
CREATE TYPE "payment_policy" AS ENUM ('FREE', 'PAY_BEFORE_CONFIRM', 'APPROVE_THEN_PAY');

-- CreateEnum
CREATE TYPE "meeting_mode" AS ENUM ('google_meet', 'zoom', 'phone', 'in_person');

-- CreateEnum
CREATE TYPE "notification_channel" AS ENUM ('email', 'whatsapp', 'calendar');

-- CreateTable
CREATE TABLE "app_user" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "timezone" TEXT,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "org_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_settings" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "approval_policy" "approval_policy" NOT NULL DEFAULT 'REQUIRES_APPROVAL',
    "payment_policy" "payment_policy" NOT NULL DEFAULT 'FREE',
    "default_locale" "locale" NOT NULL DEFAULT 'en',
    "default_tz" TEXT NOT NULL DEFAULT 'Europe/Luxembourg',
    "notify_emails" TEXT,
    "working_hours_json" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "org_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_member" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_profile" (
    "id" UUID NOT NULL,
    "org_id" UUID,
    "user_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "company" TEXT,
    "company_role" TEXT,
    "timezone" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "booking_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password_hash" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_type" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "duration_min" INTEGER NOT NULL,
    "price_cents" INTEGER,
    "currency" TEXT,
    "requires_payment" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "meeting_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_type_translation" (
    "id" UUID NOT NULL,
    "meeting_type_id" UUID NOT NULL,
    "locale" "locale" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "meeting_type_translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_type_mode" (
    "id" UUID NOT NULL,
    "meeting_type_id" UUID NOT NULL,
    "mode" "meeting_mode" NOT NULL,

    CONSTRAINT "meeting_type_mode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_calendar" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "staff_user_id" UUID NOT NULL,
    "google_calendar_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "working_hours_json" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "staff_calendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_time" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "staff_user_id" UUID,
    "start_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "end_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_time_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "staff_user_id" UUID,
    "meeting_type_id" UUID NOT NULL,
    "status" "appointment_status" NOT NULL DEFAULT 'pending',
    "mode" "meeting_mode" NOT NULL,
    "join_link" TEXT,
    "start_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "end_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_log" (
    "id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "channel" "notification_channel" NOT NULL,
    "to_address" TEXT,
    "template_key" TEXT,
    "status" TEXT NOT NULL,
    "provider_msg_id" TEXT,
    "error" TEXT,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before_json" TEXT,
    "after_json" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" REAL[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_user_name_unique" ON "app_user"("name");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_email_unique" ON "app_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "org_settings_org_id_unique" ON "org_settings"("org_id");

-- CreateIndex
CREATE INDEX "org_member_user_idx" ON "org_member"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "org_member_org_user_unique" ON "org_member"("org_id", "user_id");

-- CreateIndex
CREATE INDEX "booking_profile_user_idx" ON "booking_profile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_profile_user_unique" ON "booking_profile"("user_id");

-- CreateIndex
CREATE INDEX "password_reset_user_idx" ON "password_reset"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_token_unique" ON "password_reset"("token");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_email_unique" ON "email_verification"("email");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_token_unique" ON "email_verification"("token");

-- CreateIndex
CREATE INDEX "meeting_type_org_idx" ON "meeting_type"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_type_org_key_unique" ON "meeting_type"("org_id", "key");

-- CreateIndex
CREATE INDEX "meeting_type_translation_locale_idx" ON "meeting_type_translation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_type_translation_mt_locale_unique" ON "meeting_type_translation"("meeting_type_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_type_mode_mt_mode_unique" ON "meeting_type_mode"("meeting_type_id", "mode");

-- CreateIndex
CREATE INDEX "staff_calendar_staff_idx" ON "staff_calendar"("staff_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_calendar_org_staff_unique" ON "staff_calendar"("org_id", "staff_user_id");

-- CreateIndex
CREATE INDEX "blocked_time_org_start_idx" ON "blocked_time"("org_id", "start_at_utc");

-- CreateIndex
CREATE INDEX "blocked_time_staff_start_idx" ON "blocked_time"("staff_user_id", "start_at_utc");

-- CreateIndex
CREATE INDEX "appointment_org_start_idx" ON "appointment"("org_id", "start_at_utc");

-- CreateIndex
CREATE INDEX "appointment_user_start_idx" ON "appointment"("user_id", "start_at_utc");

-- CreateIndex
CREATE INDEX "appointment_staff_start_idx" ON "appointment"("staff_user_id", "start_at_utc");

-- CreateIndex
CREATE INDEX "notification_log_appt_created_idx" ON "notification_log"("appointment_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_org_created_idx" ON "audit_log"("org_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_entity_idx" ON "audit_log"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "documents_created_at_idx" ON "documents"("created_at");

-- AddForeignKey
ALTER TABLE "org_settings" ADD CONSTRAINT "org_settings_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_member" ADD CONSTRAINT "org_member_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_profile" ADD CONSTRAINT "booking_profile_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "org"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_type" ADD CONSTRAINT "meeting_type_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_type_translation" ADD CONSTRAINT "meeting_type_translation_meeting_type_id_fkey" FOREIGN KEY ("meeting_type_id") REFERENCES "meeting_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_type_mode" ADD CONSTRAINT "meeting_type_mode_meeting_type_id_fkey" FOREIGN KEY ("meeting_type_id") REFERENCES "meeting_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_calendar" ADD CONSTRAINT "staff_calendar_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_time" ADD CONSTRAINT "blocked_time_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_meeting_type_id_fkey" FOREIGN KEY ("meeting_type_id") REFERENCES "meeting_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "org"("id") ON DELETE CASCADE ON UPDATE CASCADE;
