// app/api/scheduling/admin/appointments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireUserIdFromSession,
  requireOrgRole,
} from "@/lib/scheduling/authz";
import { isValidUuid } from "@/lib/validation";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orgId = url.searchParams.get("orgId");
  const status = url.searchParams.get("status");
  const q = (url.searchParams.get("q") ?? "").trim();
  const mode = (url.searchParams.get("mode") ?? "").trim();
  const meetingTypeId = (url.searchParams.get("meetingTypeId") ?? "").trim();
  const staffUserId = (url.searchParams.get("staffUserId") ?? "").trim();
  const startDate = (url.searchParams.get("startDate") ?? "").trim();
  const endDate = (url.searchParams.get("endDate") ?? "").trim();
  const pageParam = Number(url.searchParams.get("page"));
  const pageSizeParam = Number(url.searchParams.get("pageSize"));
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize =
    Number.isFinite(pageSizeParam) && [10, 25, 50].includes(pageSizeParam)
      ? pageSizeParam
      : 10;
  const offset = (page - 1) * pageSize;

  if (!orgId)
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  if (!isValidUuid(orgId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const who = await requireUserIdFromSession();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: 401 });

  const authz = await requireOrgRole({
    orgId,
    userId: who.userId,
    allowed: ["admin", "staff"],
  });
  if (!authz.ok)
    return NextResponse.json({ error: authz.error }, { status: 403 });

  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  const allowedStatuses = [
    "pending",
    "confirmed",
    "declined",
    "canceled",
    "completed",
  ] as const;

  const statusFilter =
    status && allowedStatuses.includes(status as any)
      ? [status as any]
      : (["pending", "confirmed"] as const);

  const where: any = {
    orgId,
    status: { in: [...statusFilter] },
  };

  if (mode) where.mode = mode;
  if (meetingTypeId) where.meetingTypeId = meetingTypeId;
  if (staffUserId) where.staffUserId = staffUserId;

  if (startDate) {
    const start = new Date(`${startDate}T00:00:00.000Z`);
    if (!Number.isNaN(start.getTime())) {
      where.startAtUtc = { ...(where.startAtUtc ?? {}), gte: start };
    }
  }

  if (endDate) {
    const end = new Date(`${endDate}T00:00:00.000Z`);
    if (!Number.isNaN(end.getTime())) {
      const endExclusive = new Date(end.getTime() + 24 * 60 * 60 * 1000);
      where.startAtUtc = { ...(where.startAtUtc ?? {}), lt: endExclusive };
    }
  }

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
      new Set([
        ...users.map((u) => u.id),
        ...profiles.map((p) => p.userId),
      ])
    );
    const meetingTypeIds = meetingTypes.map((t) => t.id);

    const or: any[] = [];
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

  const total = await prisma.appointment.count({ where });

  const rows = await prisma.appointment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: pageSize,
    skip: offset,
  });

  const meetingTypeIds = Array.from(
    new Set(rows.map((row) => row.meetingTypeId))
  );
  const userIds = Array.from(new Set(rows.map((row) => row.userId)));

  const [meetingTypes, users, profiles] = await Promise.all([
    meetingTypeIds.length
      ? prisma.meetingType.findMany({
          where: { id: { in: meetingTypeIds } },
          select: { id: true, key: true, durationMin: true },
        })
      : [],
    userIds.length
      ? prisma.appUser.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true, phone: true },
        })
      : [],
    userIds.length
      ? prisma.bookingProfile.findMany({
          where: { userId: { in: userIds } },
          select: { userId: true, fullName: true, phone: true },
        })
      : [],
  ]);

  const mtMap = new Map(meetingTypes.map((m) => [m.id, m]));
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
    totalPages: pageSize ? Math.ceil(total / pageSize) : 1,
  });
}
