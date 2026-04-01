require("dotenv").config();

const path = require("node:path");
const postgres = require("postgres");

const REQUIRED_COLUMNS = [
  ["booking_attempt", "reserved_until"],
  ["booking_attempt", "failure_reason"],
  ["stripe_event", "status"],
  ["stripe_event", "last_error"],
];

const REQUIRED_UNIQUES = [
  { table: "payment", name: "payment_booking_attempt_id_unique" },
  { table: "payment", name: "payment_stripe_payment_intent_id_unique" },
  { table: "payment", name: "payment_stripe_checkout_session_id_unique" },
  { table: "stripe_event", name: "stripe_event_event_id_unique" },
  { table: "appointment", name: "appointment_booking_attempt_id_unique" },
  { table: "slot_reservation", name: "slot_reservation_booking_attempt_id_unique" },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  const sql = postgres(connectionString, {
    max: 1,
    ssl: "require",
    prepare: false,
    idle_timeout: 5,
    connect_timeout: 15,
  });

  try {
    const migrations = await sql`
      select migration_name, finished_at
      from "_prisma_migrations"
      order by finished_at desc nulls last, migration_name desc
      limit 20
    `;

    const migrationColumns = await sql`
      select column_name, data_type
      from information_schema.columns
      where table_schema = 'public'
        and table_name = '_prisma_migrations'
      order by ordinal_position asc
    `;

    const tables = await sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('booking_attempt', 'slot_reservation', 'payment', 'stripe_event', 'appointment')
      order by table_name asc
    `;

    const columns = await sql`
      select table_name, column_name
      from information_schema.columns
      where table_schema = 'public'
        and (table_name, column_name) in (
          ('booking_attempt', 'reserved_until'),
          ('booking_attempt', 'failure_reason'),
          ('stripe_event', 'status'),
          ('stripe_event', 'last_error')
        )
      order by table_name asc, column_name asc
    `;

    const uniqueConstraints = await sql`
      select
        tc.table_name,
        tc.constraint_name,
        string_agg(kcu.column_name, ', ' order by kcu.ordinal_position) as columns
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu
        on tc.constraint_schema = kcu.constraint_schema
       and tc.constraint_name = kcu.constraint_name
      where tc.table_schema = 'public'
        and tc.constraint_type = 'UNIQUE'
        and tc.table_name in ('payment', 'stripe_event', 'appointment', 'slot_reservation')
      group by tc.table_name, tc.constraint_name
      order by tc.table_name asc, tc.constraint_name asc
    `;

    const indexes = await sql`
      select tablename, indexname, indexdef
      from pg_indexes
      where schemaname = 'public'
        and tablename in ('booking_attempt', 'slot_reservation', 'payment', 'stripe_event', 'appointment')
      order by tablename asc, indexname asc
    `;

    const exclusionConstraints = await sql`
      select conrelid::regclass::text as table_name, conname as constraint_name
      from pg_constraint
      where contype = 'x'
        and connamespace = 'public'::regnamespace
        and conrelid::regclass::text in ('appointment', 'slot_reservation')
      order by table_name asc, constraint_name asc
    `;

    const appointmentOverlaps = await sql`
      with appt as (
        select id, org_id, staff_user_id, status, start_at_utc, end_at_utc
        from appointment
        where status in ('pending', 'confirmed', 'completed')
      )
      select
        a.org_id::text as org_id,
        coalesce(a.staff_user_id::text, 'org_default') as resource_key,
        a.id::text as left_appointment_id,
        b.id::text as right_appointment_id,
        a.start_at_utc as left_start_at_utc,
        a.end_at_utc as left_end_at_utc,
        b.start_at_utc as right_start_at_utc,
        b.end_at_utc as right_end_at_utc
      from appt a
      join appt b
        on a.id < b.id
       and a.org_id = b.org_id
       and (
         (a.staff_user_id is null and b.staff_user_id is null)
         or a.staff_user_id = b.staff_user_id
       )
       and tstzrange(a.start_at_utc, a.end_at_utc, '[)')
         && tstzrange(b.start_at_utc, b.end_at_utc, '[)')
      order by a.org_id, resource_key, a.start_at_utc
      limit 20
    `;

    const appointmentOverlapCount = await sql`
      with appt as (
        select id, org_id, staff_user_id, status, start_at_utc, end_at_utc
        from appointment
        where status in ('pending', 'confirmed', 'completed')
      )
      select count(*)::int as total
      from appt a
      join appt b
        on a.id < b.id
       and a.org_id = b.org_id
       and (
         (a.staff_user_id is null and b.staff_user_id is null)
         or a.staff_user_id = b.staff_user_id
       )
       and tstzrange(a.start_at_utc, a.end_at_utc, '[)')
         && tstzrange(b.start_at_utc, b.end_at_utc, '[)')
    `;

    const columnSet = new Set(columns.map((row) => `${row.table_name}.${row.column_name}`));
    const uniqueSet = new Set([
      ...uniqueConstraints.map((row) => `${row.table_name}.${row.constraint_name}`),
      ...indexes
        .filter((row) => row.indexdef.startsWith("CREATE UNIQUE INDEX"))
        .map((row) => `${row.tablename}.${row.indexname}`),
    ]);

    const result = {
      checkedAtUtc: new Date().toISOString(),
      cwd: process.cwd(),
      script: path.relative(process.cwd(), __filename),
      prismaMigrations: migrations.map((row) => ({
        migrationName: row.migration_name,
        finishedAt: row.finished_at ? new Date(row.finished_at).toISOString() : null,
      })),
      prismaMigrationColumns: migrationColumns,
      tablesPresent: tables.map((row) => row.table_name),
      requiredColumns: REQUIRED_COLUMNS.map(([tableName, columnName]) => ({
        tableName,
        columnName,
        exists: columnSet.has(`${tableName}.${columnName}`),
      })),
      uniqueConstraints: REQUIRED_UNIQUES.map((item) => ({
        tableName: item.table,
        constraintName: item.name,
        exists: uniqueSet.has(`${item.table}.${item.name}`),
      })),
      allUniqueConstraints: uniqueConstraints,
      indexes: indexes.map((row) => ({
        tableName: row.tablename,
        indexName: row.indexname,
        definition: row.indexdef,
      })),
      exclusionConstraints,
      appointmentOverlapConflictCount: appointmentOverlapCount[0]?.total ?? 0,
      appointmentOverlapConflicts: appointmentOverlaps.map((row) => ({
        orgId: row.org_id,
        resourceKey: row.resource_key,
        leftAppointmentId: row.left_appointment_id,
        rightAppointmentId: row.right_appointment_id,
        leftStartAtUtc: new Date(row.left_start_at_utc).toISOString(),
        leftEndAtUtc: new Date(row.left_end_at_utc).toISOString(),
        rightStartAtUtc: new Date(row.right_start_at_utc).toISOString(),
        rightEndAtUtc: new Date(row.right_end_at_utc).toISOString(),
      })),
    };

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error("inspect-staging-scheduling-db failed");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
