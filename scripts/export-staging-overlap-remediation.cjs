require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const postgres = require("postgres");

function iso(value) {
  return value ? new Date(value).toISOString() : null;
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
    const duplicateSlots = await sql`
      with appt as (
        select
          id,
          org_id,
          staff_user_id,
          meeting_type_id,
          user_id,
          status,
          start_at_utc,
          end_at_utc,
          created_at
        from appointment
        where status in ('pending', 'confirmed', 'completed')
      )
      select
        org_id::text as org_id,
        coalesce(staff_user_id::text, 'org_default') as resource_key,
        start_at_utc,
        end_at_utc,
        count(*)::int as appointment_count,
        ((count(*) * (count(*) - 1)) / 2)::int as pair_conflict_count,
        json_agg(
          json_build_object(
            'appointmentId', id::text,
            'meetingTypeId', meeting_type_id::text,
            'userId', user_id::text,
            'status', status::text,
            'createdAt', created_at
          )
          order by created_at asc, id asc
        ) as appointments
      from appt
      group by org_id, resource_key, start_at_utc, end_at_utc
      having count(*) > 1
      order by org_id, resource_key, start_at_utc
    `;

    const normalized = duplicateSlots.map((row) => {
      const appointments = row.appointments.map((item, index) => ({
        ...item,
        createdAt: iso(item.createdAt),
        cleanupRole: index === 0 ? "keep_candidate" : "remove_candidate",
      }));

      return {
        orgId: row.org_id,
        resourceKey: row.resource_key,
        startAtUtc: iso(row.start_at_utc),
        endAtUtc: iso(row.end_at_utc),
        appointmentCount: row.appointment_count,
        pairConflictCount: row.pair_conflict_count,
        suggestedAction:
          row.appointment_count > 1
            ? "Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot."
            : "Review manually.",
        appointments,
      };
    });

    const totalPairConflicts = normalized.reduce(
      (sum, item) => sum + item.pairConflictCount,
      0
    );

    const report = {
      generatedAtUtc: new Date().toISOString(),
      clusterCount: normalized.length,
      totalPairConflicts,
      clusters: normalized,
    };

    const jsonPath = path.resolve(
      process.cwd(),
      "docs",
      "staging-overlap-remediation-2026-03-31.json"
    );
    const mdPath = path.resolve(
      process.cwd(),
      "docs",
      "staging-overlap-remediation-2026-03-31.md"
    );

    fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    const mdLines = [
      "# Staging Overlap Remediation - 2026-03-31",
      "",
      `- Generated at: ${report.generatedAtUtc}`,
      `- Duplicate slot clusters: ${report.clusterCount}`,
      `- Pair conflicts: ${report.totalPairConflicts}`,
      "",
      "## Recommended Cleanup Rule",
      "",
      "For each exact same-slot duplicate cluster:",
      "- keep the earliest created appointment as the survivor candidate",
      "- cancel, archive, or delete the remaining duplicate rows",
      "- record what changed in an audit log or manual remediation note",
      "",
      "## Clusters",
      "",
    ];

    normalized.forEach((cluster, index) => {
      mdLines.push(`### Cluster ${index + 1}`);
      mdLines.push("");
      mdLines.push(`- Org: ${cluster.orgId}`);
      mdLines.push(`- Resource: ${cluster.resourceKey}`);
      mdLines.push(`- Slot: ${cluster.startAtUtc} -> ${cluster.endAtUtc}`);
      mdLines.push(`- Appointment count: ${cluster.appointmentCount}`);
      mdLines.push(`- Pair conflicts: ${cluster.pairConflictCount}`);
      mdLines.push(`- Suggested action: ${cluster.suggestedAction}`);
      mdLines.push("");
      cluster.appointments.forEach((appt) => {
        mdLines.push(
          `- ${appt.cleanupRole}: ${appt.appointmentId} | status=${appt.status} | createdAt=${appt.createdAt} | userId=${appt.userId}`
        );
      });
      mdLines.push("");
    });

    fs.writeFileSync(mdPath, `${mdLines.join("\n")}\n`, "utf8");

    console.log(
      JSON.stringify(
        {
          ok: true,
          jsonPath,
          mdPath,
          clusterCount: report.clusterCount,
          totalPairConflicts: report.totalPairConflicts,
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
  console.error("export-staging-overlap-remediation failed");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
