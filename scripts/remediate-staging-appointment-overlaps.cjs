require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const postgres = require("postgres");

const ACTIVE_STATUSES_SQL = "'pending', 'confirmed', 'completed'";
const KEEP_STATUS_SCORE = {
  completed: 3,
  confirmed: 2,
  pending: 1,
};

function iso(value) {
  return value ? new Date(value).toISOString() : null;
}

function appointmentKey(appointment) {
  return [
    appointment.orgId,
    appointment.resourceKey,
    appointment.startAtUtc,
    appointment.endAtUtc,
  ].join("|");
}

function compareAppointments(a, b) {
  const scoreDiff =
    (KEEP_STATUS_SCORE[b.status] ?? 0) - (KEEP_STATUS_SCORE[a.status] ?? 0);
  if (scoreDiff !== 0) {
    return scoreDiff;
  }

  const createdDiff =
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  if (createdDiff !== 0) {
    return createdDiff;
  }

  return a.id.localeCompare(b.id);
}

function pickWinner(a, b) {
  return compareAppointments(a, b) <= 0 ? a : b;
}

function pickLoser(a, b) {
  return pickWinner(a, b).id === a.id ? b : a;
}

async function loadActiveAppointments(sql) {
  const rows = await sql`
    select
      id::text as id,
      org_id::text as org_id,
      coalesce(staff_user_id::text, 'org_default') as resource_key,
      staff_user_id::text as staff_user_id,
      user_id::text as user_id,
      meeting_type_id::text as meeting_type_id,
      status::text as status,
      start_at_utc,
      end_at_utc,
      created_at,
      updated_at,
      notes
    from appointment
    where status in (${sql.unsafe(ACTIVE_STATUSES_SQL)})
    order by org_id, resource_key, start_at_utc, created_at, id
  `;

  return rows.map((row) => ({
    id: row.id,
    orgId: row.org_id,
    resourceKey: row.resource_key,
    staffUserId: row.staff_user_id,
    userId: row.user_id,
    meetingTypeId: row.meeting_type_id,
    status: row.status,
    startAtUtc: iso(row.start_at_utc),
    endAtUtc: iso(row.end_at_utc),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    notes: row.notes,
  }));
}

function buildExactDuplicatePlan(appointments) {
  const clusters = new Map();

  for (const appointment of appointments) {
    const key = appointmentKey(appointment);
    const existing = clusters.get(key);
    if (existing) {
      existing.push(appointment);
    } else {
      clusters.set(key, [appointment]);
    }
  }

  const removals = new Map();
  const duplicateClusters = [];

  for (const clusterAppointments of clusters.values()) {
    if (clusterAppointments.length < 2) {
      continue;
    }

    const ordered = [...clusterAppointments].sort(compareAppointments);
    const survivor = ordered[0];
    const remove = ordered.slice(1);

    duplicateClusters.push({
      orgId: survivor.orgId,
      resourceKey: survivor.resourceKey,
      startAtUtc: survivor.startAtUtc,
      endAtUtc: survivor.endAtUtc,
      survivor,
      remove,
    });

    for (const appointment of remove) {
      removals.set(appointment.id, {
        appointment,
        reason: "exact_duplicate_slot",
        winnerAppointmentId: survivor.id,
      });
    }
  }

  return { duplicateClusters, removals };
}

function overlaps(left, right) {
  return (
    left.orgId === right.orgId &&
    left.resourceKey === right.resourceKey &&
    left.startAtUtc < right.endAtUtc &&
    right.startAtUtc < left.endAtUtc
  );
}

function buildResidualOverlapPlan(appointments, plannedRemovals) {
  const survivors = appointments
    .filter((appointment) => !plannedRemovals.has(appointment.id))
    .sort((a, b) => {
      if (a.orgId !== b.orgId) {
        return a.orgId.localeCompare(b.orgId);
      }
      if (a.resourceKey !== b.resourceKey) {
        return a.resourceKey.localeCompare(b.resourceKey);
      }
      if (a.startAtUtc !== b.startAtUtc) {
        return a.startAtUtc.localeCompare(b.startAtUtc);
      }
      return compareAppointments(a, b);
    });

  const residualConflicts = [];
  const extraRemovals = new Map();

  for (let index = 0; index < survivors.length; index += 1) {
    const current = survivors[index];

    for (let otherIndex = index + 1; otherIndex < survivors.length; otherIndex += 1) {
      const other = survivors[otherIndex];

      if (current.orgId !== other.orgId || current.resourceKey !== other.resourceKey) {
        break;
      }

      if (other.startAtUtc >= current.endAtUtc) {
        break;
      }

      if (!overlaps(current, other)) {
        continue;
      }

      const winner = pickWinner(current, other);
      const loser = pickLoser(current, other);

      residualConflicts.push({
        winner,
        loser,
        reason:
          winner.status === "completed" && loser.status === "pending"
            ? "pending_overlap_with_completed"
            : winner.status === "confirmed" && loser.status === "pending"
              ? "pending_overlap_with_confirmed"
              : "residual_overlap",
      });

      extraRemovals.set(loser.id, {
        appointment: loser,
        reason:
          winner.status === "completed" && loser.status === "pending"
            ? "pending_overlap_with_completed"
            : winner.status === "confirmed" && loser.status === "pending"
              ? "pending_overlap_with_confirmed"
              : "residual_overlap",
        winnerAppointmentId: winner.id,
      });
    }
  }

  return { residualConflicts, extraRemovals };
}

function buildPlan(appointments) {
  const { duplicateClusters, removals } = buildExactDuplicatePlan(appointments);
  const { residualConflicts, extraRemovals } = buildResidualOverlapPlan(
    appointments,
    removals
  );

  const combinedRemovals = new Map(removals);
  for (const [appointmentId, item] of extraRemovals.entries()) {
    combinedRemovals.set(appointmentId, item);
  }

  const survivors = appointments.filter(
    (appointment) => !combinedRemovals.has(appointment.id)
  );

  const unresolvedConflicts = [];
  for (let index = 0; index < survivors.length; index += 1) {
    const current = survivors[index];
    for (let otherIndex = index + 1; otherIndex < survivors.length; otherIndex += 1) {
      const other = survivors[otherIndex];
      if (current.orgId !== other.orgId || current.resourceKey !== other.resourceKey) {
        break;
      }
      if (other.startAtUtc >= current.endAtUtc) {
        break;
      }
      if (overlaps(current, other)) {
        unresolvedConflicts.push({ current, other });
      }
    }
  }

  return {
    generatedAtUtc: new Date().toISOString(),
    activeAppointmentCount: appointments.length,
    duplicateClusterCount: duplicateClusters.length,
    residualConflictCount: residualConflicts.length,
    removalCount: combinedRemovals.size,
    duplicateClusters,
    residualConflicts,
    removals: [...combinedRemovals.values()].sort((a, b) =>
      compareAppointments(a.appointment, b.appointment)
    ),
    unresolvedConflicts,
  };
}

function writePlanReport(plan) {
  const outputJsonPath = path.resolve(
    process.cwd(),
    "docs",
    "staging-overlap-cleanup-plan-2026-03-31.json"
  );
  const outputMdPath = path.resolve(
    process.cwd(),
    "docs",
    "staging-overlap-cleanup-plan-2026-03-31.md"
  );

  fs.writeFileSync(outputJsonPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");

  const lines = [
    "# Staging Overlap Cleanup Plan - 2026-03-31",
    "",
    `- Generated at: ${plan.generatedAtUtc}`,
    `- Active appointments inspected: ${plan.activeAppointmentCount}`,
    `- Exact duplicate clusters: ${plan.duplicateClusterCount}`,
    `- Residual conflicts after duplicate pass: ${plan.residualConflictCount}`,
    `- Planned removals: ${plan.removalCount}`,
    `- Unresolved conflicts after planning: ${plan.unresolvedConflicts.length}`,
    "",
    "## Planned Removals",
    "",
  ];

  plan.removals.forEach((item, index) => {
    lines.push(`### Removal ${index + 1}`);
    lines.push("");
    lines.push(`- Appointment: ${item.appointment.id}`);
    lines.push(`- Reason: ${item.reason}`);
    lines.push(`- Keep appointment: ${item.winnerAppointmentId}`);
    lines.push(`- Org: ${item.appointment.orgId}`);
    lines.push(`- Resource: ${item.appointment.resourceKey}`);
    lines.push(
      `- Slot: ${item.appointment.startAtUtc} -> ${item.appointment.endAtUtc}`
    );
    lines.push(`- Status: ${item.appointment.status}`);
    lines.push(`- User: ${item.appointment.userId}`);
    lines.push(`- Created at: ${item.appointment.createdAt}`);
    lines.push("");
  });

  if (plan.unresolvedConflicts.length > 0) {
    lines.push("## Unresolved Conflicts");
    lines.push("");
    plan.unresolvedConflicts.forEach((item, index) => {
      lines.push(`### Conflict ${index + 1}`);
      lines.push("");
      lines.push(
        `- Left: ${item.current.id} | ${item.current.startAtUtc} -> ${item.current.endAtUtc} | status=${item.current.status}`
      );
      lines.push(
        `- Right: ${item.other.id} | ${item.other.startAtUtc} -> ${item.other.endAtUtc} | status=${item.other.status}`
      );
      lines.push("");
    });
  }

  fs.writeFileSync(outputMdPath, `${lines.join("\n")}\n`, "utf8");

  return { outputJsonPath, outputMdPath };
}

async function applyPlan(sql, plan) {
  if (plan.unresolvedConflicts.length > 0) {
    throw new Error(
      `Refusing to apply cleanup because ${plan.unresolvedConflicts.length} unresolved conflicts remain in the plan.`
    );
  }

  const idsToRemove = plan.removals.map((item) => item.appointment.id);
  if (idsToRemove.length === 0) {
    return { deletedCount: 0 };
  }

  const validatedIds = idsToRemove.map((id) => {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id
      )
    ) {
      throw new Error(`Refusing to use non-UUID appointment id in cleanup plan: ${id}`);
    }

    return `'${id}'::uuid`;
  });

  const deletedRows = await sql.begin(async (tx) => {
    const rows = await tx`
      delete from appointment
      where id in (${tx.unsafe(validatedIds.join(", "))})
      returning id::text as id
    `;

    return rows.map((row) => row.id);
  });

  if (deletedRows.length !== idsToRemove.length) {
    throw new Error(
      `Expected to remove ${idsToRemove.length} appointments but removed ${deletedRows.length}.`
    );
  }

  return { deletedCount: deletedRows.length };
}

async function countRemainingOverlaps(sql) {
  const result = await sql`
    with appt as (
      select id, org_id, staff_user_id, status, start_at_utc, end_at_utc
      from appointment
      where status in (${sql.unsafe(ACTIVE_STATUSES_SQL)})
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

  return result[0]?.total ?? 0;
}

async function main() {
  const shouldApply = process.argv.includes("--apply");
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
    const appointments = await loadActiveAppointments(sql);
    const plan = buildPlan(appointments);
    const reportPaths = writePlanReport(plan);

    let applyResult = { deletedCount: 0 };
    let remainingOverlapCount = await countRemainingOverlaps(sql);

    if (shouldApply) {
      applyResult = await applyPlan(sql, plan);
      remainingOverlapCount = await countRemainingOverlaps(sql);
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          applied: shouldApply,
          planSummary: {
            duplicateClusterCount: plan.duplicateClusterCount,
            residualConflictCount: plan.residualConflictCount,
            removalCount: plan.removalCount,
            unresolvedConflictCount: plan.unresolvedConflicts.length,
          },
          deletedCount: applyResult.deletedCount,
          remainingOverlapCount,
          reportPaths,
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
  console.error("remediate-staging-appointment-overlaps failed");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
