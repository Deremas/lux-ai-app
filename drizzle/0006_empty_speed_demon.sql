ALTER TABLE "appointment" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "appointment" ALTER COLUMN "status" SET DEFAULT 'pending'::text;--> statement-breakpoint
DROP TYPE "public"."appointment_status";--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'confirmed', 'declined', 'completed');--> statement-breakpoint
ALTER TABLE "appointment" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."appointment_status";--> statement-breakpoint
ALTER TABLE "appointment" ALTER COLUMN "status" SET DATA TYPE "public"."appointment_status" USING "status"::"public"."appointment_status";--> statement-breakpoint
DROP INDEX "app_user_email_unique";--> statement-breakpoint
ALTER TABLE "meeting_type" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "org_settings" ALTER COLUMN "org_id" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "app_user_name_unique" ON "app_user" USING btree ("name");--> statement-breakpoint
ALTER TABLE "app_user" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "appointment" DROP COLUMN "location_text";