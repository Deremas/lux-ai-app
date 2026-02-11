CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'confirmed', 'declined', 'canceled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."approval_policy" AS ENUM('AUTO_APPROVE', 'REQUIRES_APPROVAL');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('en', 'fr', 'de', 'lb');--> statement-breakpoint
CREATE TYPE "public"."meeting_mode" AS ENUM('google_meet', 'zoom', 'phone', 'in_person');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('email', 'whatsapp', 'calendar');--> statement-breakpoint
CREATE TYPE "public"."payment_policy" AS ENUM('FREE', 'PAY_BEFORE_CONFIRM', 'APPROVE_THEN_PAY');--> statement-breakpoint
CREATE TABLE "app_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"staff_user_id" uuid,
	"meeting_type_id" uuid NOT NULL,
	"status" "appointment_status" DEFAULT 'pending' NOT NULL,
	"mode" "meeting_mode" NOT NULL,
	"location_text" text,
	"join_link" text,
	"start_at_utc" timestamp with time zone NOT NULL,
	"end_at_utc" timestamp with time zone NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"before_json" text,
	"after_json" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocked_time" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"staff_user_id" uuid,
	"start_at_utc" timestamp with time zone NOT NULL,
	"end_at_utc" timestamp with time zone NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"user_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"company" text,
	"company_role" text,
	"timezone" text NOT NULL,
	"notes" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"key" text NOT NULL,
	"duration_min" integer NOT NULL,
	"price_cents" integer,
	"currency" text,
	"requires_payment" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_type_mode" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_type_id" uuid NOT NULL,
	"mode" "meeting_mode" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_type_translation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_type_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"title" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "notification_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"to_address" text,
	"template_key" text,
	"status" text NOT NULL,
	"provider_msg_id" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"approval_policy" "approval_policy" DEFAULT 'REQUIRES_APPROVAL' NOT NULL,
	"payment_policy" "payment_policy" DEFAULT 'FREE' NOT NULL,
	"default_locale" "locale" DEFAULT 'en' NOT NULL,
	"default_tz" text DEFAULT 'Europe/Luxembourg' NOT NULL,
	"notify_emails" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_calendar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"staff_user_id" uuid NOT NULL,
	"google_calendar_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"working_hours_json" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_org_id_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_meeting_type_id_meeting_type_id_fk" FOREIGN KEY ("meeting_type_id") REFERENCES "public"."meeting_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_org_id_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_time" ADD CONSTRAINT "blocked_time_org_id_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_profile" ADD CONSTRAINT "booking_profile_org_id_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_type" ADD CONSTRAINT "meeting_type_org_id_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_type_mode" ADD CONSTRAINT "meeting_type_mode_meeting_type_id_meeting_type_id_fk" FOREIGN KEY ("meeting_type_id") REFERENCES "public"."meeting_type"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_type_translation" ADD CONSTRAINT "meeting_type_translation_meeting_type_id_meeting_type_id_fk" FOREIGN KEY ("meeting_type_id") REFERENCES "public"."meeting_type"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_appointment_id_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member" ADD CONSTRAINT "org_member_org_id_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_settings" ADD CONSTRAINT "org_settings_org_id_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_calendar" ADD CONSTRAINT "staff_calendar_org_id_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "app_user_email_unique" ON "app_user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "appointment_org_start_idx" ON "appointment" USING btree ("org_id","start_at_utc");--> statement-breakpoint
CREATE INDEX "appointment_user_start_idx" ON "appointment" USING btree ("user_id","start_at_utc");--> statement-breakpoint
CREATE INDEX "appointment_staff_start_idx" ON "appointment" USING btree ("staff_user_id","start_at_utc");--> statement-breakpoint
CREATE INDEX "audit_log_org_created_idx" ON "audit_log" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "blocked_time_org_start_idx" ON "blocked_time" USING btree ("org_id","start_at_utc");--> statement-breakpoint
CREATE INDEX "blocked_time_staff_start_idx" ON "blocked_time" USING btree ("staff_user_id","start_at_utc");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_profile_user_unique" ON "booking_profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "booking_profile_user_idx" ON "booking_profile" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "meeting_type_org_key_unique" ON "meeting_type" USING btree ("org_id","key");--> statement-breakpoint
CREATE INDEX "meeting_type_org_idx" ON "meeting_type" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "meeting_type_mode_mt_mode_unique" ON "meeting_type_mode" USING btree ("meeting_type_id","mode");--> statement-breakpoint
CREATE UNIQUE INDEX "meeting_type_translation_mt_locale_unique" ON "meeting_type_translation" USING btree ("meeting_type_id","locale");--> statement-breakpoint
CREATE INDEX "meeting_type_translation_locale_idx" ON "meeting_type_translation" USING btree ("locale");--> statement-breakpoint
CREATE INDEX "notification_log_appt_created_idx" ON "notification_log" USING btree ("appointment_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "org_member_org_user_unique" ON "org_member" USING btree ("org_id","user_id");--> statement-breakpoint
CREATE INDEX "org_member_user_idx" ON "org_member" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_settings_org_id_unique" ON "org_settings" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_token_unique" ON "password_reset" USING btree ("token");--> statement-breakpoint
CREATE INDEX "password_reset_user_idx" ON "password_reset" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_calendar_org_staff_unique" ON "staff_calendar" USING btree ("org_id","staff_user_id");--> statement-breakpoint
CREATE INDEX "staff_calendar_staff_idx" ON "staff_calendar" USING btree ("staff_user_id");