import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeAppointmentPayment } from "@/lib/scheduling/appointment-payment";
import { requireUserIdFromSession } from "@/lib/scheduling/authz";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { getMeetingLink } from "@/lib/scheduling/meeting-link";
import { resolveOrgIdForRequest } from "@/lib/scheduling/org-resolver";

export async function GET(req: Request) {
  const who = await requireUserIdFromSession();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: 401 });

  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  const url = new URL(req.url);
  const orgId = await resolveOrgIdForRequest({
    orgId: url.searchParams.get("orgId"),
    userId: who.userId,
    allowPublic: true,
  });
  const status = url.searchParams.get("status");
  const pageParam = Number(url.searchParams.get("page"));
  const pageSizeParam = Number(url.searchParams.get("pageSize"));
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize =
    Number.isFinite(pageSizeParam) && [10, 25, 50].includes(pageSizeParam)
      ? pageSizeParam
      : 10;
  const offset = (page - 1) * pageSize;

  if (!orgId) {
    return NextResponse.json(
      { error: "No organization found" },
      { status: 400 }
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
      : allowedStatuses;

  const total = await prisma.appointment.count({
    where: {
      orgId,
      userId: who.userId,
      status: { in: [...statusFilter] },
    },
  });

  const [rows, profile] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        orgId,
        userId: who.userId,
        status: { in: [...statusFilter] },
      },
      include: { meetingType: true },
      orderBy: { startAtUtc: "desc" },
      take: pageSize,
      skip: offset,
    }),
    prisma.bookingProfile.findFirst({
      where: { userId: who.userId },
      select: { phone: true },
    }),
  ]);

  const items = rows.map((row) => {
    const payment = normalizeAppointmentPayment({
      paymentPolicy: row.paymentPolicy ?? null,
      paymentStatus: row.paymentStatus ?? null,
      requiresPayment: row.requiresPayment ?? null,
      priceCents: row.priceCents ?? null,
      currency: row.currency ?? null,
    });

    return {
      id: row.id,
      status: row.status,
      startAtUtc: row.startAtUtc,
      endAtUtc: row.endAtUtc,
      meetingTypeId: row.meetingTypeId,
      staffUserId: row.staffUserId,
      meetingTypeKey: row.meetingType?.key ?? null,
      meetingTypeTitle: row.meetingType?.key ?? null,
      durationMin: row.meetingType?.durationMin ?? 60,
      mode: row.mode,
      createdAt: row.createdAt,
      phone: profile?.phone ?? null,
      notes: row.notes ?? null,
      paymentPolicy: payment.paymentPolicy,
      paymentStatus: payment.paymentStatus,
      priceCents: payment.priceCents,
      currency: payment.currency,
      meetingLink:
        row.status === "confirmed"
          ? getMeetingLink({
              appointmentId: row.id,
              mode: row.mode,
            })
          : null,
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
