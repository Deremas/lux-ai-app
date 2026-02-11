// db/check_no_overlap.ts
import "dotenv/config";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_MIGRATE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_MIGRATE_URL or DATABASE_URL");

  const sql = postgres(url, { prepare: false });

  const rows = await sql`
    SELECT conname
    FROM pg_constraint
    WHERE conname = 'appointment_no_overlap'
  `;

  console.log(JSON.stringify({ count: rows.length, rows }, null, 2));
  await sql.end();
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});
