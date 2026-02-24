// app/api/scheduling/admin/appointments/route.ts
import { NextResponse } from "next/server";
import { Prisma, AppointmentStatus, MeetingMode } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUserIdFromSession, requireOrgRole } from "@/lib/scheduling/authz";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { resolveOrgIdForRequest } from "@/lib/scheduling/org-resolver";

const PAGE_SIZES = [10, 25, 50] as const;

const ALLOWED_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "declined",
  "canceled",
  "completed",
];

const ALLOWED_MODES: MeetingMode[] = [
  "google_meet",
  "zoom",
  "phone",
  "in_person",
];

const SORTABLE_FIELDS = new Set<keyof Prisma.AppointmentOrderByWithRelationInput>([
  "createdAt",
  "startAtUtc",
  "endAtUtc",
  "status",
  "mode",
]);

function parsePage(v: string | null): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

function parsePageSize(v: string | null): (typeof PAGE_SIZES)[number] {
  const n = Number(v);
  return (PAGE_SIZES as readonly number[]).includes(n) ? (n as any) : 10;
}

function safeSort(sortByRaw: string, sortDirRaw: string): Prisma.AppointmentOrderByWithRelationInput {
  const sortBy = SORTABLE_FIELDS.has(sortByRaw as any)
    ? (sortByRaw as keyof Prisma.AppointmentOrderByWithRelationInput)
    : "createdAt";

  const sortDir: Prisma.SortOrder = sortDirRaw === "asc" ? "asc" : "desc";

  return { [sortBy]: sortDir };
}

function parseUtcDayStart(dateStr: string): Date | null {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const statusRaw = (url.searchParams.get("status") ?? "").trim();
  const q = (url.searchParams.get("q") ?? "").trim();

  const modeRaw = (url.searchParams.get("mode") ?? "").trim();
  const meetingTypeId = (url.searchParams.get("meetingTypeId") ?? "").trim();
  const staffUserId = (url.searchParams.get("staffUserId") ?? "").trim();

  const startDate = (url.searchParams.get("startDate") ?? "").trim();
  const endDate = (url.searchParams.get("endDate") ?? "").trim();

  const sortByRaw = (url.searchParams.get("sortBy") ?? "").trim();
  const sortDirRaw = (url.searchParams.get("sortDir") ?? "").trim().toLowerCase();

  const page = parsePage(url.searchParams.get("page"));
  const pageSize = parsePageSize(url.searchParams.get("pageSize"));
  const offset = (page - 1) * pageSize;

  const who = await requireUserIdFromSession();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: 401 });

  const orgId = await resolveOrgIdForRequest({
    orgId: url.searchParams.get("orgId"),
    userId: who.userId,
    allowedRoles: ["admin", "staff"],
  });
  if (!orgId) {
    return NextResponse.json({ error: "No organization found" }, { status: 400 });
  }

  const authz = await requireOrgRole({
    orgId,
    userId: who.userId,
    allowed: ["admin", "staff"],
  });
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 });

  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  const statusFilter: AppointmentStatus[] =
    statusRaw && ALLOWED_STATUSES.includes(statusRaw as AppointmentStatus)
      ? [statusRaw as AppointmentStatus]
      : (["pending", "confirmed"] as AppointmentStatus[]);

  const where: Prisma.AppointmentWhereInput = {
    orgId,
    status: { in: statusFilter },
  };

  // mode must be enum-safe
  if (modeRaw && ALLOWED_MODES.includes(modeRaw as MeetingMode)) {
    where.mode = modeRaw as MeetingMode;
  }

  if (meetingTypeId) where.meetingTypeId = meetingTypeId;
  if (staffUserId) where.staffUserId = staffUserId;

  // Build startAtUtc filter without spreading union types
  let startAtUtcFilter: Prisma.DateTimeFilter<"Appointment"> | undefined;

  if (startDate) {
    const start = parseUtcDayStart(startDate);
    if (start) startAtUtcFilter = { ...(startAtUtcFilter ?? {}), gte: start };
  }

  if (endDate) {
    const end = parseUtcDayStart(endDate);
    if (end) {
      const endExclusive = new Date(end.getTime() + 24 * 60 * 60 * 1000);
      startAtUtcFilter = { ...(startAtUtcFilter ?? {}), lt: endExclusive };
    }
  }

  if (startAtUtcFilter) where.startAtUtc = startAtUtcFilter;

  if (q) {
    const [users, profiles, meetingTypes] = await Promise.all([
      prisma.appUser.findMany({
        where: {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      }),
      prisma.bookingProfile.findMany({
        where: {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { userId: true },
      }),
      prisma.meetingType.findMany({
        where: { key: { contains: q, mode: "insensitive" } },
        select: { id: true },
      }),
    ]);

    const userIds = Array.from(
      new Set<string>([...users.map((u) => u.id), ...profiles.map((p) => p.userId)])
    );
    const meetingTypeIds = meetingTypes.map((t) => t.id);

    const or: Prisma.AppointmentWhereInput[] = [];
    if (userIds.length) or.push({ userId: { in: userIds } });
    if (meetingTypeIds.length) or.push({ meetingTypeId: { in: meetingTypeIds } });

    if (or.length === 0) {
      return NextResponse.json({
        orgId,
        items: [],
        page,
        pageSize,
        total: 0,
        totalPages: 1,
      });
    }

    where.OR = or;
  }

  const orderBy = safeSort(sortByRaw, sortDirRaw);

  const total = await prisma.appointment.count({ where });

  const rows = await prisma.appointment.findMany({
    where,
    orderBy,
    take: pageSize,
    skip: offset,
  });

  const meetingTypeIds = Array.from(new Set(rows.map((r) => r.meetingTypeId)));
  const userIds = Array.from(new Set(rows.map((r) => r.userId)));

  const [mts, users, profiles] = await Promise.all([
    meetingTypeIds.length
      ? prisma.meetingType.findMany({
        where: { id: { in: meetingTypeIds } },
        select: { id: true, key: true, durationMin: true },
      })
      : Promise.resolve([]),
    userIds.length
      ? prisma.appUser.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, phone: true },
      })
      : Promise.resolve([]),
    userIds.length
      ? prisma.bookingProfile.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, fullName: true, phone: true },
      })
      : Promise.resolve([]),
  ]);

  const mtMap = new Map(mts.map((m) => [m.id, m]));
  const userMap = new Map(users.map((u) => [u.id, u]));
  const profileMap = new Map(profiles.map((p) => [p.userId, p]));

  const items = rows.map((row) => {
    const mt = mtMap.get(row.meetingTypeId);
    const user = userMap.get(row.userId);
    const profile = profileMap.get(row.userId);

    return {
      id: row.id,
      orgId: row.orgId,
      userId: row.userId,
      staffUserId: row.staffUserId,

      meetingTypeId: row.meetingTypeId,
      meetingTypeKey: mt?.key ?? null,
      durationMin: mt?.durationMin ?? 60,

      status: row.status,
      mode: row.mode,

      paymentPolicy: row.paymentPolicy ?? null,
      paymentStatus: row.paymentStatus ?? null,
      requiresPayment: row.requiresPayment ?? null,
      priceCents: row.priceCents ?? null,
      currency: row.currency ?? null,

      startAtUtc: row.startAtUtc,
      endAtUtc: row.endAtUtc,
      notes: row.notes,

      createdAt: row.createdAt,
      updatedAt: row.updatedAt,

      userName: user?.name ?? null,
      userEmail: user?.email ?? null,
      userPhone: profile?.phone ?? user?.phone ?? null,
      userFullName: profile?.fullName ?? null,
    };
  });

  return NextResponse.json({
    orgId,
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}
