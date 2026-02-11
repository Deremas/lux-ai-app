// db/migrate_appointment_no_overlap.ts
import "dotenv/config";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_MIGRATE_URL ?? process.env.DATABASE_URL;

  if (!url) {
    console.error("❌ Missing DATABASE_MIGRATE_URL or DATABASE_URL");
    process.exit(1);
  }

  console.log(
    "Using DB URL:",
    url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:****@")
  );

  const sql = postgres(url, { prepare: false });

  try {
    // required for EXCLUDE constraint with "=" on uuid/text
    await sql`CREATE EXTENSION IF NOT EXISTS btree_gist`;

    // add constraint (idempotent-ish)
    await sql.unsafe(`
      ALTER TABLE appointment
      ADD CONSTRAINT appointment_no_overlap
      EXCLUDE USING gist (
        org_id WITH =,
        staff_user_id WITH =,
        tstzrange(start_at_utc, end_at_utc, '[)') WITH &&
      )
      WHERE (staff_user_id IS NOT NULL)
    `);

    console.log("✅ appointment_no_overlap added");
  } catch (err: any) {
    const msg = String(err?.message ?? err);

    // If it's already there, we treat as success
    if (msg.toLowerCase().includes("already exists")) {
      console.log("ℹ️ appointment_no_overlap already exists (ok)");
    } else {
      console.error("❌ Migration failed:", msg);
      throw err;
    }
  } finally {
    await sql.end();
  }
}

main().catch(() => process.exit(1));
