require("dotenv").config();

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const postgres = require("postgres");

function iso(value) {
  return value ? new Date(value).toISOString() : null;
}

function runPrismaStatus() {
  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(command, ["prisma", "migrate", "status"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      DEBUG: "prisma:*",
      PRISMA_LOG_LEVEL: "debug",
      RUST_BACKTRACE: "1",
    },
  });

  return {
    status: result.status,
    signal: result.signal,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error ? String(result.error.message || result.error) : null,
  };
}

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
    const identity = await sql`
      select
        current_database() as database_name,
        current_user as current_user,
        version() as server_version
    `;

    const privileges = await sql`
      select
        has_database_privilege(current_user, current_database(), 'CREATE') as can_create_in_database,
        has_database_privilege(current_user, current_database(), 'TEMP') as can_create_temp_tables,
        has_schema_privilege(current_user, 'public', 'USAGE') as can_use_public_schema,
        has_schema_privilege(current_user, 'public', 'CREATE') as can_create_in_public_schema
    `;

    const ownership = await sql`
      select schemaname, tablename, tableowner
      from pg_tables
      where schemaname = 'public'
        and tablename in ('appointment', '_prisma_migrations')
      order by tablename asc
    `;

    const extensions = await sql`
      select
        a.name,
        a.default_version,
        e.extversion as installed_version
      from pg_available_extensions a
      left join pg_extension e on e.extname = a.name
      where a.name = 'btree_gist'
    `;

    let ddlProbe = { ok: true, error: null };
    try {
      await sql.begin(async (tx) => {
        await tx`
          create table if not exists public.__codex_schema_probe (
            id integer primary key,
            note text
          )
        `;
        await tx`
          alter table public.__codex_schema_probe
          add column if not exists touched_at timestamptz
        `;
        await tx`
          create index if not exists __codex_schema_probe_note_idx
          on public.__codex_schema_probe (note)
        `;
        await tx`drop table public.__codex_schema_probe`;
        throw new Error("__ROLLBACK_PROBE__");
      });
    } catch (error) {
      if (error instanceof Error && error.message === "__ROLLBACK_PROBE__") {
        ddlProbe = { ok: true, error: null };
      } else {
        ddlProbe = {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    const pendingMigrations = await sql`
      select migration_name
      from "_prisma_migrations"
      where migration_name in (
        '20260331120000_add_booking_attempts_and_stripe_events',
        '20260331143000_add_slot_reservations_and_attempt_expiry'
      )
      order by migration_name asc
    `;

    const prismaStatus = runPrismaStatus();

    const report = {
      generatedAtUtc: new Date().toISOString(),
      identity: {
        databaseName: identity[0]?.database_name ?? null,
        currentUser: identity[0]?.current_user ?? null,
        serverVersion: identity[0]?.server_version ?? null,
      },
      privileges: privileges[0] ?? null,
      ownership,
      extensions,
      ddlProbe,
      pendingMarch31MigrationsPresentInHistory: pendingMigrations.map(
        (row) => row.migration_name
      ),
      prismaMigrateStatus: prismaStatus,
    };

    const reportPath = path.resolve(
      process.cwd(),
      "docs",
      "staging-migration-readiness-2026-03-31.json"
    );
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    console.log(
      JSON.stringify(
        {
          ok: true,
          reportPath,
          ddlProbeOk: ddlProbe.ok,
          prismaStatusExitCode: prismaStatus.status,
        },
        null,
        2
      )
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error("debug-staging-migration-readiness failed");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
