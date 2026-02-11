import "dotenv/config";
import postgres from "postgres";

const url =
  process.env.DATABASE_MIGRATE_URL ||
  process.env.DATABASE_URL ||
  process.env.DATABASE_POOL_URL;

if (!url)
  throw new Error(
    "Missing DATABASE_MIGRATE_URL / DATABASE_URL / DATABASE_POOL_URL"
  );

const dbUrl = url;
const sql = postgres(dbUrl, { prepare: false });

async function main() {
  console.log("Using DB:", dbUrl.replace(/\/\/.*?:.*?@/, "//****:****@"));

  // TRUNCATE in FK-safe order (CASCADE handles deps)
  await sql.unsafe(`
    TRUNCATE TABLE
      notification_log,
      audit_log,
      appointment,
      blocked_time,
      staff_calendar,
      meeting_type_mode,
      meeting_type_translation,
      meeting_type,
      org_member,
      org_settings,
      org
    RESTART IDENTITY CASCADE;
  `);

  console.log("✅ All data cleared (tables kept).");
  await sql.end();
}

main().catch(async (e) => {
  console.error("❌ reset failed:", e);
  await sql.end();
  process.exit(1);
});
