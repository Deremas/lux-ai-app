// app/api/scheduling/calendar/route.ts
import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { isValidTimezone, isValidUuid } from "@/lib/validation";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { getMeetingLink } from "@/lib/scheduling/meeting-link";

const BUSY_STATUSES = ["pending", "confirmed", "completed"] as const;

type WorkingHours = {
  bufferMin?: number;
  timezone?: string;
};

function parseWorkingHours(raw: unknown): WorkingHours {
  if (!raw) return {};
  try {
    return typeof raw === "string"
      ? (JSON.parse(raw) as WorkingHours)
      : (raw as WorkingHours);
  } catch {
    return {};
  }
}

function clampBuffer(n: number) {
  const MAX = 0;
  return Math.min(MAX, Math.max(0, n));
}

type CalendarEvent =
  | {
      id: string;
      type: "appointment";
      staffUserId: string | null;
      title: string;
      startUtc: string;
      endUtc: string;
      startLocal: string;
      endLocal: string;
      appointmentId: string;
      status: string;
      meetingTypeKey: string | null;
      mode: string;
      userName: string | null;
      userEmail: string | null;
      userPhone: string | null;
      userCompany: string | null;
      userCompanyRole: string | null;
      userNotes: string | null;
      userTimezone: string | null;
      meetingLink: string | null;
    }
  | {
      id: string;
      type: "blocked";
      staffUserId: string | null; // null => org-wide
      title: string;
      startUtc: string;
      endUtc: string;
      startLocal: string;
      endLocal: string;
      reason: string | null;
      blockedTimeId: string;
    }
  | {
      id: string;
      type: "buffer";
      staffUserId: string | null;
      title: string;
      startUtc: string;
      endUtc: string;
      startLocal: string;
      endLocal: string;
      appointmentId: string;
    };

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
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const tz = url.searchParams.get("tz") || "Europe/Luxembourg";
  const staffUserId = url.searchParams.get("staffUserId"); // optional
  const includeBuffer = url.searchParams.get("includeBuffer") === "1";

  if (!orgId || !from || !to) {
    return NextResponse.json(
      { error: "Missing orgId, from, to" },
      { status: 400 }
    );
  }

  if (!isValidUuid(orgId)) {
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

  // Buffer comes from staffCalendar.workingHours (same source as availability)
  let bufferMin = 0;
  if (includeBuffer) {
    const staffRow = staffUserId
      ? await prisma.staffCalendar.findFirst({
          where: { orgId, staffUserId, isActive: true },
          select: { workingHours: true },
        })
      : await prisma.staffCalendar.findFirst({
          where: { orgId, isActive: true },
          select: { workingHours: true },
        });

    let workingHours = staffRow?.workingHours ?? null;
    if (!workingHours) {
      const orgDefaults = await prisma.orgSettings.findFirst({
        where: { orgId },
        select: { workingHours: true },
      });
      workingHours = orgDefaults?.workingHours ?? null;
    }

    const wh = parseWorkingHours(workingHours ?? null);
    bufferMin = clampBuffer(wh.bufferMin ?? 0);
  }

  // Appointments in range (overlap)
  const appts = await prisma.appointment.findMany({
    where: {
      orgId,
      status: { in: [...BUSY_STATUSES] },
      startAtUtc: { lt: toUtcJs },
      endAtUtc: { gte: fromUtcJs },
      ...(staffUserId ? { staffUserId } : {}),
    },
    include: { meetingType: true },
  });

  const userIds = Array.from(new Set(appts.map((a) => a.userId)));
  const [users, profiles] = await Promise.all([
    userIds.length
      ? prisma.appUser.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true, phone: true, timezone: true },
        })
      : [],
    userIds.length
      ? prisma.bookingProfile.findMany({
          where: { userId: { in: userIds } },
          select: {
            userId: true,
            phone: true,
            company: true,
            companyRole: true,
            notes: true,
            timezone: true,
          },
        })
      : [],
  ]);
  const userMap = new Map(users.map((u) => [u.id, u]));
  const profileMap = new Map(profiles.map((p) => [p.userId, p]));

  // Blocked times (org-wide + optional staff)
  const blocks = await prisma.blockedTime.findMany({
    where: {
      orgId,
      startAtUtc: { lt: toUtcJs },
      endAtUtc: { gte: fromUtcJs },
      ...(staffUserId
        ? { OR: [{ staffUserId: null }, { staffUserId }] }
        : {}),
    },
  });

  const events: CalendarEvent[] = [];

  for (const a of appts) {
    const user = userMap.get(a.userId);
    const profile = profileMap.get(a.userId);
    const stUtc = DateTime.fromJSDate(a.startAtUtc).toUTC();
    const enUtc = DateTime.fromJSDate(a.endAtUtc).toUTC();

    events.push({
      id: `appt:${a.id}`,
      type: "appointment",
      staffUserId: a.staffUserId ?? null,
      title: a.meetingType?.key
        ? `${a.meetingType?.key} · ${a.mode}`
        : `Appointment (${a.status})`,
      startUtc: stUtc.toISO()!,
      endUtc: enUtc.toISO()!,
      startLocal: stUtc.setZone(tz).toISO()!,
      endLocal: enUtc.setZone(tz).toISO()!,
      appointmentId: a.id,
      status: a.status,
      meetingTypeKey: a.meetingType?.key ?? null,
      mode: a.mode,
      userName: user?.name ?? null,
      userEmail: user?.email ?? null,
      userPhone: profile?.phone ?? user?.phone ?? null,
      userCompany: profile?.company ?? null,
      userCompanyRole: profile?.companyRole ?? null,
      userNotes: profile?.notes ?? null,
      userTimezone: profile?.timezone ?? user?.timezone ?? null,
      meetingLink:
        a.status === "confirmed"
          ? getMeetingLink({
              appointmentId: a.id,
              mode: a.mode,
            })
          : null,
    });

    if (includeBuffer && bufferMin > 0) {
      const stB = stUtc.minus({ minutes: bufferMin });
      const enB = enUtc.plus({ minutes: bufferMin });

      events.push({
        id: `buf:${a.id}`,
        type: "buffer",
        staffUserId: a.staffUserId ?? null,
        title: `Buffer (${bufferMin}m)`,
        startUtc: stB.toISO()!,
        endUtc: enB.toISO()!,
        startLocal: stB.setZone(tz).toISO()!,
        endLocal: enB.setZone(tz).toISO()!,
        appointmentId: a.id,
      });
    }
  }

  for (const b of blocks) {
    const stUtc = DateTime.fromJSDate(b.startAtUtc).toUTC();
    const enUtc = DateTime.fromJSDate(b.endAtUtc).toUTC();

    events.push({
      id: `blk:${b.id}`,
      type: "blocked",
      staffUserId: b.staffUserId ?? null,
      title: b.reason ? `Blocked: ${b.reason}` : "Blocked time",
      startUtc: stUtc.toISO()!,
      endUtc: enUtc.toISO()!,
      startLocal: stUtc.setZone(tz).toISO()!,
      endLocal: enUtc.setZone(tz).toISO()!,
      reason: b.reason ?? null,
      blockedTimeId: b.id,
    });
  }

  return NextResponse.json({
    orgId,
    from: fromDt.toISO(),
    to: toDt.toISO(),
    fromUtc: fromUtc.toISO(),
    toUtc: toUtc.toISO(),
    tz,
    includeBuffer,
    bufferMin,
    events,
  });
}
