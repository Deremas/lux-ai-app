/*
  Warnings:

  - You are about to drop the column `after_json` on the `audit_log` table. All the data in the column will be lost.
  - You are about to drop the column `before_json` on the `audit_log` table. All the data in the column will be lost.
  - You are about to drop the column `working_hours_json` on the `org_settings` table. All the data in the column will be lost.
  - The `notify_emails` column on the `org_settings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `working_hours_json` on the `staff_calendar` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[handle]` on the table `app_user` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "app_user_name_unique";

-- AlterTable
ALTER TABLE "app_user" ADD COLUMN     "handle" TEXT;

-- AlterTable
ALTER TABLE "audit_log" DROP COLUMN "after_json",
DROP COLUMN "before_json",
ADD COLUMN     "after" JSONB,
ADD COLUMN     "before" JSONB;

-- AlterTable
ALTER TABLE "org_settings" DROP COLUMN "working_hours_json",
ADD COLUMN     "working_hours" JSONB,
DROP COLUMN "notify_emails",
ADD COLUMN     "notify_emails" TEXT[];

-- AlterTable
ALTER TABLE "staff_calendar" DROP COLUMN "working_hours_json",
ADD COLUMN     "working_hours" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "app_user_handle_unique" ON "app_user"("handle");

-- CreateIndex
CREATE INDEX "appointment_meeting_type_start_idx" ON "appointment"("meeting_type_id", "start_at_utc");

-- CreateIndex
CREATE INDEX "appointment_org_status_start_idx" ON "appointment"("org_id", "status", "start_at_utc");

-- CreateIndex
CREATE INDEX "booking_profile_org_idx" ON "booking_profile"("org_id");

-- CreateIndex
CREATE INDEX "notification_log_channel_created_idx" ON "notification_log"("channel", "created_at");

-- AddForeignKey
ALTER TABLE "org_member" ADD CONSTRAINT "org_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_profile" ADD CONSTRAINT "booking_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset" ADD CONSTRAINT "password_reset_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_calendar" ADD CONSTRAINT "staff_calendar_staff_user_id_fkey" FOREIGN KEY ("staff_user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_time" ADD CONSTRAINT "blocked_time_staff_user_id_fkey" FOREIGN KEY ("staff_user_id") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_staff_user_id_fkey" FOREIGN KEY ("staff_user_id") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
