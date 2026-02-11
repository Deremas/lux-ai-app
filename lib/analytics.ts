import { DateTime } from "luxon";

import { prisma } from "@/lib/prisma";

type DateRange = {
  from?: Date | null;
  to?: Date | null;
};

type TimelineItem = {
  date: string;
  appointments: number;
  revenueCents: number;
  pending: number;
  confirmed: number;
  completed: number;
  declined: number;
  canceled: number;
};

export type AnalyticsListType = "all" | "paid" | "expected";

const STATUS_KEYS = [
  "pending",
  "confirmed",
  "completed",
  "declined",
  "canceled",
] as const;

function buildRangeWhere(range?: DateRange) {
  if (!range?.from && !range?.to) return {};
  return {
    startAtUtc: {
      ...(range.from ? { gte: range.from } : {}),
      ...(range.to ? { lte: range.to } : {}),
    },
  };
}

function buildAppointmentWhere(range?: DateRange, status?: string) {
  const where: Record<string, unknown> = {
    ...buildRangeWhere(range),
  };
  if (status) {
    where.status = status;
  }
  return where;
}

export async function getAnalyticsAppointments(params: {
  orgId: string;
  range?: DateRange;
  status?: string;
  type: AnalyticsListType;
  staffUserId?: string;
  limit?: number;
}) {
  const { orgId, range, status, type } = params;
  const limit = params.limit ?? 200;

  const where: Record<string, unknown> = {
    orgId,
    ...buildAppointmentWhere(range, status),
  };
  if (params.staffUserId) {
    where.staffUserId = params.staffUserId;
  }

  if (type === "paid") {
    where.paymentStatus = "paid";
    where.priceCents = { not: null };
    where.currency = { not: null };
  }

  if (type === "expected") {
    where.paymentStatus = { not: "paid" };
    where.priceCents = { not: null };
    where.currency = { not: null };
  }

  const [rows, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: { startAtUtc: "desc" },
      take: limit + 1,
      select: {
        id: true,
        startAtUtc: true,
        endAtUtc: true,
        status: true,
        mode: true,
        priceCents: true,
        currency: true,
        paymentStatus: true,
        meetingType: { select: { key: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  const hasMore = rows.length > limit;
  const items = (hasMore ? rows.slice(0, limit) : rows).map((row) => ({
    id: row.id,
    startAtUtc: row.startAtUtc.toISOString(),
    endAtUtc: row.endAtUtc.toISOString(),
    status: row.status,
    mode: row.mode,
    priceCents: row.priceCents,
    currency: row.currency,
    paymentStatus: row.paymentStatus,
    meetingTypeKey: row.meetingType?.key ?? "Unknown",
    customerName: row.user?.name ?? null,
    customerEmail: row.user?.email ?? null,
  }));

  return { items, total, hasMore };
}

export async function getStaffPerformanceMetrics(
  orgId: string,
  range?: DateRange,
  status?: string
) {
  const staffMembers = await prisma.orgMember.findMany({
    where: {
      orgId,
      role: { in: ["admin", "staff"] },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const staffIds = staffMembers.map((m) => m.userId);
  if (staffIds.length === 0) return [];

  const appts = await prisma.appointment.findMany({
    where: {
      orgId,
      staffUserId: { in: staffIds },
      ...buildAppointmentWhere(range, status),
    },
    select: { staffUserId: true, status: true },
  });

  const counts = new Map<
    string,
    {
      total: number;
      pending: number;
      confirmed: number;
      completed: number;
      declined: number;
      canceled: number;
    }
  >();

  for (const id of staffIds) {
    counts.set(id, {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      declined: 0,
      canceled: 0,
    });
  }

  for (const appt of appts) {
    const id = appt.staffUserId;
    if (!id) continue;
    const bucket =
      counts.get(id) ?? {
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        declined: 0,
        canceled: 0,
      };
    bucket.total += 1;
    if (appt.status === "pending") bucket.pending += 1;
    if (appt.status === "confirmed") bucket.confirmed += 1;
    if (appt.status === "completed") bucket.completed += 1;
    if (appt.status === "declined") bucket.declined += 1;
    if (appt.status === "canceled") bucket.canceled += 1;
    counts.set(id, bucket);
  }

  return staffMembers.map((member) => {
    const metrics = counts.get(member.userId) ?? {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      declined: 0,
      canceled: 0,
    };

    return {
      id: member.userId,
      name: member.user?.name ?? null,
      email: member.user?.email ?? null,
      ...metrics,
    };
  });
}

export async function getUserActivityReport(
  userId: string,
  range?: DateRange
) {
  return prisma.appointment.findMany({
    where: {
      userId,
      ...buildRangeWhere(range),
    },
    orderBy: { startAtUtc: "desc" },
    take: 200,
    select: {
      id: true,
      orgId: true,
      staffUserId: true,
      status: true,
      mode: true,
      startAtUtc: true,
      endAtUtc: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getSchedulingStatistics(
  orgId: string,
  range?: DateRange,
  status?: string
) {
  const where = {
    orgId,
    ...buildAppointmentWhere(range, status),
  };

  const [
    total,
    byStatus,
    byMode,
    revenueByCurrency,
    configuredModes,
    expectedRevenueByCurrency,
  ] =
    await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.groupBy({
        by: ["status"],
        where,
      _count: { _all: true },
    }),
    prisma.appointment.groupBy({
      by: ["mode"],
      where,
      _count: { _all: true },
    }),
      prisma.appointment.groupBy({
        by: ["currency"],
        where: {
          ...where,
          paymentStatus: "paid",
          currency: { not: null },
          priceCents: { not: null },
        },
        _sum: { priceCents: true },
        _count: { _all: true },
      }),
      prisma.meetingTypeMode.findMany({
        where: { meetingType: { orgId } },
        select: { mode: true },
        distinct: ["mode"],
      }),
      prisma.appointment.groupBy({
        by: ["currency"],
        where: {
          ...where,
          paymentStatus: { not: "paid" },
          currency: { not: null },
          priceCents: { not: null },
        },
        _sum: { priceCents: true },
        _count: { _all: true },
      }),
    ]);

  const modeCounts = new Map<string, number>();
  for (const row of byMode) {
    if (!row.mode) continue;
    modeCounts.set(row.mode, row._count._all);
  }
  for (const row of configuredModes) {
    if (!modeCounts.has(row.mode)) {
      modeCounts.set(row.mode, 0);
    }
  }

  return {
    total,
    byStatus: byStatus.map((row) => ({
      status: row.status,
      count: row._count._all,
    })),
    byMode: Array.from(modeCounts.entries())
      .map(([mode, count]) => ({ mode, count }))
      .sort((a, b) => b.count - a.count),
    revenueByCurrency: revenueByCurrency.map((row) => ({
      currency: row.currency,
      count: row._count._all,
      totalCents: row._sum.priceCents ?? 0,
    })),
    expectedRevenueByCurrency: expectedRevenueByCurrency.map((row) => ({
      currency: row.currency,
      count: row._count._all,
      totalCents: row._sum.priceCents ?? 0,
    })),
  };
}

export async function getMeetingTypeBreakdown(
  orgId: string,
  range?: DateRange,
  status?: string
) {
  const rows = await prisma.appointment.groupBy({
    by: ["meetingTypeId"],
    where: {
      orgId,
      ...buildAppointmentWhere(range, status),
    },
    _count: { _all: true },
  });

  if (rows.length === 0) return [];

  const meetingTypeIds = rows.map((row) => row.meetingTypeId);
  const meetingTypes = await prisma.meetingType.findMany({
    where: { id: { in: meetingTypeIds } },
    select: { id: true, key: true },
  });

  const keyMap = new Map(meetingTypes.map((m) => [m.id, m.key]));
  return rows
    .map((row) => ({
      meetingTypeId: row.meetingTypeId,
      meetingTypeKey: keyMap.get(row.meetingTypeId) ?? "Unknown",
      count: row._count._all,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getAnalyticsTimeline(params: {
  orgId: string;
  range?: DateRange;
  tz: string;
  baseCurrency?: string | null;
  status?: string;
}) {
  const { orgId, range, tz } = params;
  const where = {
    orgId,
    ...buildAppointmentWhere(range, params.status),
  };

  const rows = await prisma.appointment.findMany({
    where,
    select: {
      startAtUtc: true,
      status: true,
      paymentStatus: true,
      priceCents: true,
      currency: true,
    },
  });

  const currencySet = new Set(
    rows
      .map((row) => row.currency)
      .filter((value): value is string => Boolean(value))
  );

  const effectiveCurrency =
    params.baseCurrency && currencySet.has(params.baseCurrency)
      ? params.baseCurrency
      : currencySet.size === 1
      ? Array.from(currencySet)[0]
      : null;

  const start = range?.from
    ? DateTime.fromJSDate(range.from).setZone(tz).startOf("day")
    : DateTime.now().setZone(tz).minus({ days: 30 }).startOf("day");
  const end = range?.to
    ? DateTime.fromJSDate(range.to).setZone(tz).startOf("day")
    : DateTime.now().setZone(tz).startOf("day");

  const map = new Map<string, TimelineItem>();
  let cursor = start;
  while (cursor <= end) {
    const key = cursor.toFormat("yyyy-LL-dd");
    map.set(key, {
      date: key,
      appointments: 0,
      revenueCents: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      declined: 0,
      canceled: 0,
    });
    cursor = cursor.plus({ days: 1 });
  }

  for (const row of rows) {
    const day = DateTime.fromJSDate(row.startAtUtc)
      .setZone(tz)
      .toFormat("yyyy-LL-dd");
    const bucket =
      map.get(day) ??
      ({
        date: day,
        appointments: 0,
        revenueCents: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        declined: 0,
        canceled: 0,
      } as TimelineItem);

    bucket.appointments += 1;
    if (STATUS_KEYS.includes(row.status as (typeof STATUS_KEYS)[number])) {
      bucket[row.status as keyof Pick<
        TimelineItem,
        "pending" | "confirmed" | "completed" | "declined" | "canceled"
      >] += 1;
    }

    if (
      row.paymentStatus === "paid" &&
      row.priceCents &&
      effectiveCurrency &&
      row.currency === effectiveCurrency
    ) {
      bucket.revenueCents += row.priceCents;
    }

    map.set(day, bucket);
  }

  return {
    currency: effectiveCurrency,
    items: Array.from(map.values()),
  };
}
