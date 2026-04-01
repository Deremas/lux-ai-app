import { DateTime } from "luxon";

import { prisma } from "@/lib/prisma";
import { isValidTimezone } from "@/lib/validation";

const BUSY_STATUSES = ["pending", "confirmed", "completed"] as const;
const DEFAULT_TZ = "Europe/Luxembourg";

type WorkingHours = {
  timezone?: string;
  week?: Record<
    "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
    Array<{ start: string; end: string }>
  >;
  slotStepMin?: number;
  bufferMin?: number;
};

type WorkingHoursKey = keyof NonNullable<WorkingHours["week"]>;
const DOW: WorkingHoursKey[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

function fallbackWeek() {
  return {
    mon: [{ start: "08:00", end: "17:00" }],
    tue: [{ start: "08:00", end: "17:00" }],
    wed: [{ start: "08:00", end: "17:00" }],
    thu: [{ start: "08:00", end: "17:00" }],
    fri: [{ start: "08:00", end: "17:00" }],
    sat: [],
    sun: [],
  };
}

function parseWorkingHours(
  raw: unknown,
  fallbackTz: string
): Required<WorkingHours> {
  const fallback = {
    timezone: fallbackTz,
    slotStepMin: 60,
    bufferMin: 0,
    week: fallbackWeek(),
  };

  if (!raw) return fallback;

  try {
    const value: WorkingHours =
      typeof raw === "string" ? (JSON.parse(raw) as WorkingHours) : (raw as WorkingHours);

    return {
      timezone: value?.timezone ?? fallback.timezone,
      slotStepMin: value?.slotStepMin ?? fallback.slotStepMin,
      bufferMin: value?.bufferMin ?? fallback.bufferMin,
      week: { ...fallback.week, ...(value?.week ?? {}) },
    };
  } catch {
    return fallback;
  }
}

function toDowKey(dt: DateTime): WorkingHoursKey {
  return DOW[dt.weekday - 1];
}

function isSlotWithinWorkingHours(
  startUtc: DateTime,
  endUtc: DateTime,
  wh: Required<WorkingHours>
) {
  const startLocal = startUtc.setZone(wh.timezone);
  const endLocal = endUtc.setZone(wh.timezone);
  if (!startLocal.isValid || !endLocal.isValid) return false;

  if (startLocal.toISODate() !== endLocal.toISODate()) return false;

  const dayKey = toDowKey(startLocal);
  const windows = wh.week[dayKey] ?? [];
  if (windows.length === 0) return false;

  return windows.some((w) => {
    const [sh, sm] = w.start.split(":").map(Number);
    const [eh, em] = w.end.split(":").map(Number);
    if (!Number.isFinite(sh) || !Number.isFinite(sm)) return false;
    if (!Number.isFinite(eh) || !Number.isFinite(em)) return false;

    const dayStart = startLocal.startOf("day");
    const windowStart = dayStart.set({
      hour: sh,
      minute: sm,
      second: 0,
      millisecond: 0,
    });
    const windowEnd = dayStart.set({
      hour: eh,
      minute: em,
      second: 0,
      millisecond: 0,
    });

    return startLocal >= windowStart && endLocal <= windowEnd;
  });
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && aEnd > bStart;
}

type IntervalMs = { startMs: number; endMs: number };

function hasOverlap(intervals: IntervalMs[], startMs: number, endMs: number) {
  return intervals.some((i) => overlaps(i.startMs, i.endMs, startMs, endMs));
}

export type AutoAssignResult = {
  staffUserId: string | null;
  workingHours: unknown | null;
  usingOrgDefaults: boolean;
  noStaffAvailable?: boolean;
  noStaffCalendars?: boolean;
};

export async function pickStaffForSlot(params: {
  orgId: string;
  startUtc: Date;
  endUtc: Date;
  bookingTz: string;
}): Promise<AutoAssignResult> {
  const fallbackTz =
    isValidTimezone(params.bookingTz) ? params.bookingTz : DEFAULT_TZ;
  const startUtc = DateTime.fromJSDate(params.startUtc).toUTC();
  const endUtc = DateTime.fromJSDate(params.endUtc).toUTC();

  const staffRows = await prisma.staffCalendar.findMany({
    where: { orgId: params.orgId, isActive: true },
    select: { staffUserId: true, workingHours: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  if (staffRows.length === 0) {
    const orgDefaults = await prisma.orgSettings.findFirst({
      where: { orgId: params.orgId },
      select: { workingHours: true },
    });
    if (orgDefaults?.workingHours) {
      return {
        staffUserId: null,
        workingHours: orgDefaults.workingHours,
        usingOrgDefaults: true,
      };
    }
    return {
      staffUserId: null,
      workingHours: null,
      usingOrgDefaults: false,
      noStaffCalendars: true,
    };
  }

  const staffIds = staffRows.map((s) => s.staffUserId);
  const startUtcJs = startUtc.toJSDate();
  const endUtcJs = endUtc.toJSDate();

  const dayStartUtc = startUtc.setZone(fallbackTz).startOf("day").toUTC();
  const dayEndUtc = startUtc.setZone(fallbackTz).endOf("day").toUTC();

  const [blocked, apptsOverlap, activeReservations, dayAppts] = await Promise.all([
    prisma.blockedTime.findMany({
      where: {
        orgId: params.orgId,
        startAtUtc: { lt: endUtcJs },
        endAtUtc: { gt: startUtcJs },
        OR: [{ staffUserId: null }, { staffUserId: { in: staffIds } }],
      },
      select: { staffUserId: true, startAtUtc: true, endAtUtc: true },
    }),
    prisma.slotReservation.findMany({
      where: {
        orgId: params.orgId,
        status: "active",
        reservedUntil: { gt: new Date() },
        startAtUtc: { lt: endUtcJs },
        endAtUtc: { gt: startUtcJs },
        OR: [{ staffUserId: { in: staffIds } }, { staffUserId: null }],
      },
      select: { staffUserId: true, startAtUtc: true, endAtUtc: true },
    }),
    prisma.appointment.findMany({
      where: {
        orgId: params.orgId,
        status: { in: [...BUSY_STATUSES] },
        startAtUtc: { lt: endUtcJs },
        endAtUtc: { gt: startUtcJs },
        OR: [{ staffUserId: { in: staffIds } }, { staffUserId: null }],
      },
      select: { staffUserId: true, startAtUtc: true, endAtUtc: true },
    }),
    prisma.appointment.findMany({
      where: {
        orgId: params.orgId,
        status: { in: [...BUSY_STATUSES] },
        staffUserId: { in: staffIds },
        startAtUtc: {
          gte: dayStartUtc.toJSDate(),
          lte: dayEndUtc.toJSDate(),
        },
      },
      select: { staffUserId: true },
    }),
  ]);

  const blockedOrg: IntervalMs[] = [];
  const blockedByStaff = new Map<string, IntervalMs[]>();
  for (const b of blocked) {
    const entry = {
      startMs: DateTime.fromJSDate(b.startAtUtc).toUTC().toMillis(),
      endMs: DateTime.fromJSDate(b.endAtUtc).toUTC().toMillis(),
    };
    if (!b.staffUserId) {
      blockedOrg.push(entry);
    } else {
      const arr = blockedByStaff.get(b.staffUserId) ?? [];
      arr.push(entry);
      blockedByStaff.set(b.staffUserId, arr);
    }
  }

  const apptOrg: IntervalMs[] = [];
  const apptByStaff = new Map<string, IntervalMs[]>();
  for (const a of apptsOverlap) {
    const entry = {
      startMs: DateTime.fromJSDate(a.startAtUtc).toUTC().toMillis(),
      endMs: DateTime.fromJSDate(a.endAtUtc).toUTC().toMillis(),
    };
    if (!a.staffUserId) {
      apptOrg.push(entry);
    } else {
      const arr = apptByStaff.get(a.staffUserId) ?? [];
      arr.push(entry);
      apptByStaff.set(a.staffUserId, arr);
    }
  }

  for (const r of activeReservations) {
    const entry = {
      startMs: DateTime.fromJSDate(r.startAtUtc).toUTC().toMillis(),
      endMs: DateTime.fromJSDate(r.endAtUtc).toUTC().toMillis(),
    };
    if (!r.staffUserId) {
      apptOrg.push(entry);
    } else {
      const arr = apptByStaff.get(r.staffUserId) ?? [];
      arr.push(entry);
      apptByStaff.set(r.staffUserId, arr);
    }
  }

  const counts = new Map<string, number>();
  for (const a of dayAppts) {
    if (!a.staffUserId) continue;
    counts.set(a.staffUserId, (counts.get(a.staffUserId) ?? 0) + 1);
  }

  const candidates: Array<{
    staffUserId: string;
    workingHours: unknown | null;
    order: number;
    dayCount: number;
  }> = [];

  staffRows.forEach((row, index) => {
    const wh = parseWorkingHours(row.workingHours, fallbackTz);
    if (!isSlotWithinWorkingHours(startUtc, endUtc, wh)) return;

    const bufferMin = Math.max(0, wh.bufferMin ?? 0);
    const startWithBufferMs = startUtc
      .minus({ minutes: bufferMin })
      .toMillis();
    const endWithBufferMs = endUtc.plus({ minutes: bufferMin }).toMillis();

    if (hasOverlap(blockedOrg, startWithBufferMs, endWithBufferMs)) return;
    if (
      hasOverlap(
        blockedByStaff.get(row.staffUserId) ?? [],
        startWithBufferMs,
        endWithBufferMs
      )
    )
      return;
    if (hasOverlap(apptOrg, startWithBufferMs, endWithBufferMs)) return;
    if (
      hasOverlap(
        apptByStaff.get(row.staffUserId) ?? [],
        startWithBufferMs,
        endWithBufferMs
      )
    )
      return;

    candidates.push({
      staffUserId: row.staffUserId,
      workingHours: row.workingHours ?? null,
      order: index,
      dayCount: counts.get(row.staffUserId) ?? 0,
    });
  });

  if (candidates.length === 0) {
    return {
      staffUserId: null,
      workingHours: null,
      usingOrgDefaults: false,
      noStaffAvailable: true,
    };
  }

  candidates.sort((a, b) => a.dayCount - b.dayCount || a.order - b.order);
  const picked = candidates[0];

  return {
    staffUserId: picked.staffUserId,
    workingHours: picked.workingHours,
    usingOrgDefaults: false,
  };
}
