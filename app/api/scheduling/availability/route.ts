// app/api/scheduling/availability/route.ts
import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";

import {
  toUtcInterval,
  expandInterval,
  subtractBusySlots,
  mergeIntervals,
  SafeInterval,
} from "@/lib/scheduling/intervals";
import { isValidTimezone, isValidUuid } from "@/lib/validation";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";

const BUSY_STATUSES = ["pending", "confirmed", "completed"] as const;
const MIN_LEAD_MIN = 180;
const AVAIL_CACHE_TTL_MS = 60_000;

type AvailabilityPayload = {
  orgId: string;
  meetingTypeId: string;
  from: string | null;
  to: string | null;
  fromUtc: string | null;
  toUtc: string | null;
  results: Array<{
    staffUserId: string;
    timezone: string;
    slotStepMin: number;
    bufferMin: number;
    durationMin: number;
    slots: Slot[];
  }>;
};

type CacheEntry = {
  expiresAt: number;
  payload: AvailabilityPayload;
};

const availabilityCache = new Map<string, CacheEntry>();

function buildCacheKey(params: {
  orgId: string;
  meetingTypeId: string;
  from: string;
  to: string;
  tz: string;
  staffUserId?: string | null;
}) {
  return [
    params.orgId,
    params.meetingTypeId,
    params.from,
    params.to,
    params.tz,
    params.staffUserId || "",
  ].join("|");
}

function getCachedAvailability(key: string) {
  const entry = availabilityCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    availabilityCache.delete(key);
    return null;
  }
  return entry.payload;
}

function setCachedAvailability(key: string, payload: AvailabilityPayload) {
  availabilityCache.set(key, {
    expiresAt: Date.now() + AVAIL_CACHE_TTL_MS,
    payload,
  });
}

type WorkingHours = {
  timezone?: string;
  week?: Record<
    "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
    Array<{ start: string; end: string }>
  >;
  slotStepMin?: number; // default 60
  bufferMin?: number; // default 0
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

function fallbackWorkingHours(): Required<WorkingHours> {
  return {
    timezone: "Europe/Luxembourg",
    slotStepMin: 60,
    bufferMin: 0,
    week: {
      mon: [{ start: "08:00", end: "17:00" }],
      tue: [{ start: "08:00", end: "17:00" }],
      wed: [{ start: "08:00", end: "17:00" }],
      thu: [{ start: "08:00", end: "17:00" }],
      fri: [{ start: "08:00", end: "17:00" }],
      sat: [],
      sun: [],
    },
  };
}

/**
 * Supports either:
 * - string JSON (from a text column)
 * - object (from JSON/JSONB column)
 */
function parseWorkingHours(raw: unknown): Required<WorkingHours> {
  const fallback = fallbackWorkingHours();
  if (!raw) return fallback;

  try {
    const v =
      typeof raw === "string"
        ? (JSON.parse(raw) as WorkingHours)
        : (raw as WorkingHours);

    return {
      timezone: v.timezone ?? fallback.timezone,
      slotStepMin: v.slotStepMin ?? fallback.slotStepMin,
      bufferMin: v.bufferMin ?? fallback.bufferMin,
      week: { ...fallback.week, ...(v.week ?? {}) },
    };
  } catch {
    return fallback;
  }
}

function toDowKey(dt: DateTime): WorkingHoursKey {
  return DOW[dt.weekday - 1]; // 1=Mon..7=Sun
}

type Slot = {
  startUtc: string;
  endUtc: string;
  startLocal: string;
  endLocal: string;
};

function ceilToStep(dt: DateTime, stepMin: number) {
  if (stepMin <= 1) return dt;
  const startOfDay = dt.startOf("day");
  const minutes = Math.ceil(dt.diff(startOfDay, "minutes").minutes);
  const rounded = Math.ceil(minutes / stepMin) * stepMin;
  return startOfDay.plus({ minutes: rounded });
}

function buildSlotsForDay(args: {
  day: DateTime; // day start in staff tz
  tz: string;
  durationMin: number;
  slotStepMin: number;
  windows: Array<{ start: string; end: string }>;
}): Slot[] {
  const { day, tz, durationMin, slotStepMin, windows } = args;

  const out: Slot[] = [];

  for (const w of windows) {
    const [sh, sm] = w.start.split(":").map(Number);
    const [eh, em] = w.end.split(":").map(Number);

    let cursor = day.set({ hour: sh, minute: sm, second: 0, millisecond: 0 });
    const windowEnd = day.set({
      hour: eh,
      minute: em,
      second: 0,
      millisecond: 0,
    });

    while (cursor.plus({ minutes: durationMin }) <= windowEnd) {
      const end = cursor.plus({ minutes: durationMin });

      out.push({
        startUtc: cursor.toUTC().toISO()!,
        endUtc: end.toUTC().toISO()!,
        startLocal: cursor.setZone(tz).toISO()!,
        endLocal: end.setZone(tz).toISO()!,
      });

      cursor = cursor.plus({ minutes: slotStepMin });
    }
  }

  return out;
}

export async function GET(req: Request) {
  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  const url = new URL(req.url);

  const orgId = url.searchParams.get("orgId");
  const meetingTypeId = url.searchParams.get("meetingTypeId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const tz = url.searchParams.get("tz") || "Europe/Luxembourg";
  const staffUserId = url.searchParams.get("staffUserId"); // optional

  if (!orgId || !meetingTypeId || !from || !to) {
    return NextResponse.json(
      { error: "Missing orgId, meetingTypeId, from, to" },
      { status: 400 }
    );
  }

  if (!isValidUuid(orgId) || !isValidUuid(meetingTypeId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (staffUserId && !isValidUuid(staffUserId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!isValidTimezone(tz)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (from.length > 40 || to.length > 40) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const cacheKey = buildCacheKey({
    orgId,
    meetingTypeId,
    from,
    to,
    tz,
    staffUserId,
  });
  const cached = getCachedAvailability(cacheKey);
  if (cached) {
    const res = NextResponse.json(cached);
    res.headers.set("Cache-Control", "private, max-age=60");
    res.headers.set("X-Availability-Cache", "HIT");
    return res;
  }

  const fromDt = DateTime.fromISO(from, { zone: tz });
  const toDt = DateTime.fromISO(to, { zone: tz });

  if (!fromDt.isValid || !toDt.isValid || toDt <= fromDt) {
    return NextResponse.json(
      { error: "Invalid from/to. Use ISO strings and ensure to > from." },
      { status: 400 }
    );
  }

  const fromUtc = fromDt.toUTC();
  const toUtc = toDt.toUTC();
  const fromUtcJs = fromUtc.toJSDate();
  const toUtcJs = toUtc.toJSDate();

  // 1) Meeting duration
  const mt = await prisma.meetingType.findFirst({
    where: { id: meetingTypeId, orgId },
    select: { durationMin: true },
  });

  if (!mt) {
    return NextResponse.json(
      { error: "meetingType not found" },
      { status: 404 }
    );
  }

  const durationMin = Math.max(15, Math.min(240, mt.durationMin || 60));

  // 2) Staff calendars
  let staffRows = await prisma.staffCalendar.findMany({
    where: {
      orgId,
      isActive: true,
      ...(staffUserId ? { staffUserId } : {}),
    },
    select: {
      staffUserId: true,
      workingHours: true,
    },
  });

  let usingOrgDefaults = false;
  if (staffRows.length === 0) {
    if (staffUserId) {
      return NextResponse.json(
        { error: "No active staff calendars configured yet" },
        { status: 409 }
      );
    }

    const orgDefaults = await prisma.orgSettings.findFirst({
      where: { orgId },
      select: { workingHours: true },
    });

    const defaults = orgDefaults?.workingHours ?? null;
    if (!defaults) {
      return NextResponse.json(
        { error: "No active staff calendars configured yet" },
        { status: 409 }
      );
    }

    usingOrgDefaults = true;
    staffRows = [
      {
        staffUserId: "__org__",
        workingHours: defaults,
      },
    ];
  }

  const staffIds = usingOrgDefaults
    ? []
    : staffRows.map((s) => s.staffUserId);

  // 3) Appointments
  const appts = await prisma.appointment.findMany({
    where: {
      orgId,
      status: { in: [...BUSY_STATUSES] },
      startAtUtc: { lt: toUtcJs },
      endAtUtc: { gte: fromUtcJs },
      ...(staffUserId
        ? { staffUserId }
        : usingOrgDefaults
        ? {}
        : { OR: [{ staffUserId: { in: staffIds } }, { staffUserId: null }] }),
    },
    select: {
      staffUserId: true,
      startAtUtc: true,
      endAtUtc: true,
    },
  });

  // 4) Blocked time
  const blocked = await prisma.blockedTime.findMany({
    where: {
      orgId,
      startAtUtc: { lt: toUtcJs },
      endAtUtc: { gte: fromUtcJs },
      ...(staffUserId
        ? { OR: [{ staffUserId: null }, { staffUserId }] }
        : {}),
    },
    select: {
      staffUserId: true,
      startAtUtc: true,
      endAtUtc: true,
    },
  });

  const busyByStaff = new Map<string, SafeInterval[]>();
  const busyOrgWide: SafeInterval[] = [];

  const addBusy = (sid: string | null, startAtUtc: Date, endAtUtc: Date) => {
    const i = toUtcInterval(startAtUtc, endAtUtc);
    if (!sid) busyOrgWide.push(i);
    else {
      const arr = busyByStaff.get(sid) ?? [];
      arr.push(i);
      busyByStaff.set(sid, arr);
    }
  };

  for (const a of appts) {
    if (usingOrgDefaults) {
      addBusy(null, a.startAtUtc, a.endAtUtc);
      continue;
    }
    if (staffUserId) {
      addBusy(a.staffUserId ?? null, a.startAtUtc, a.endAtUtc);
      continue;
    }
    if (!a.staffUserId) {
      addBusy(null, a.startAtUtc, a.endAtUtc);
      continue;
    }
    addBusy(a.staffUserId, a.startAtUtc, a.endAtUtc);
  }

  for (const b of blocked) {
    addBusy(b.staffUserId ?? null, b.startAtUtc, b.endAtUtc);
  }

  // Day list
  const days: DateTime[] = [];
  let dayCursor = fromDt.startOf("day");
  const endDay = toDt.startOf("day");
  while (dayCursor <= endDay) {
    days.push(dayCursor);
    dayCursor = dayCursor.plus({ days: 1 });
  }

  const results: Array<{
    staffUserId: string;
    timezone: string;
    slotStepMin: number;
    bufferMin: number;
    durationMin: number;
    slots: Slot[];
  }> = [];

  for (const s of staffRows) {
    const wh = parseWorkingHours(s.workingHours);
    const staffTz = wh.timezone || tz;
    const slotStepMin = Math.max(
      durationMin,
      wh.slotStepMin ?? durationMin
    );
    const bufferMin = Math.max(0, wh.bufferMin ?? 0);

    let slots: Slot[] = [];

    for (const d of days) {
      const day = d.setZone(staffTz);
      const key = toDowKey(day);
      const windows = wh.week[key] ?? [];
      if (windows.length === 0) continue;

      slots.push(
        ...buildSlotsForDay({
          day,
          tz: staffTz,
          durationMin,
          slotStepMin,
          windows,
        })
      );
    }

    // Clip to requested window (local in staff tz)
    const fromInStaffTz = fromDt.setZone(staffTz);
    const toInStaffTz = toDt.setZone(staffTz);

    slots = slots.filter((x) => {
      const st = DateTime.fromISO(x.startLocal, { zone: staffTz });
      return st >= fromInStaffTz && st < toInStaffTz;
    });

    // Merge busy + apply buffer
    const rawBusy = [...busyOrgWide, ...(busyByStaff.get(s.staffUserId) ?? [])];
    const bufferedBusy = rawBusy.map((i) => expandInterval(i, bufferMin));
    const mergedBusy = mergeIntervals(bufferedBusy);

    const free = subtractBusySlots(slots, mergedBusy);

    // Enforce minimum lead time globally (rounded to slot step in staff tz)
    const minBookableUtc = DateTime.utc().plus({ minutes: MIN_LEAD_MIN });
    const minBookableLocal = ceilToStep(
      minBookableUtc.setZone(staffTz),
      slotStepMin
    );

    const futureSlots = free.filter((slot) => {
      const startLocal = DateTime.fromISO(slot.startLocal, { zone: staffTz });
      return startLocal >= minBookableLocal;
    });

    results.push({
      staffUserId: s.staffUserId,
      timezone: staffTz,
      slotStepMin,
      bufferMin,
      durationMin,
      slots: futureSlots,
    });
  }

  const payload: AvailabilityPayload = {
    orgId,
    meetingTypeId,
    from: fromDt.toISO(),
    to: toDt.toISO(),
    fromUtc: fromUtc.toISO(),
    toUtc: toUtc.toISO(),
    results,
  };

  setCachedAvailability(cacheKey, payload);
  const res = NextResponse.json(payload);
  res.headers.set("Cache-Control", "private, max-age=60");
  res.headers.set("X-Availability-Cache", "MISS");
  return res;
}
