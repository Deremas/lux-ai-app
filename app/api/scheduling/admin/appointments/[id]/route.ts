import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeAppointmentPayment } from "@/lib/scheduling/appointment-payment";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import {
  requireOrgRole,
  requireUserIdFromSession,
} from "@/lib/scheduling/authz";
import { isValidUuid } from "@/lib/validation";
import { resolveOrgIdForRequest } from "@/lib/scheduling/org-resolver";

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  const who = await requireUserIdFromSession();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: 401 });

  const { id } = await ctx.params;
  const url = new URL(req.url);
  if (!isValidUuid(id)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const orgId = await resolveOrgIdForRequest({
    orgId: url.searchParams.get("orgId"),
    userId: who.userId,
    allowedRoles: ["admin", "staff"],
  });
  if (!orgId) {
    return NextResponse.json(
      { error: "No organization found" },
      { status: 400 }
    );
  }

  const authz = await requireOrgRole({
    orgId,
    userId: who.userId,
    allowed: ["admin", "staff"],
  });
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 });

  const appt = await prisma.appointment.findFirst({
    where: { orgId, id },
    include: {
      meetingType: true,
    },
  });

  if (!appt) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  const [user, profile, auditRows] = await Promise.all([
    prisma.appUser.findFirst({
      where: { id: appt.userId },
      select: { id: true, name: true, email: true, phone: true },
    }),
    prisma.bookingProfile.findFirst({
      where: { userId: appt.userId },
      select: {
        fullName: true,
        phone: true,
        company: true,
        companyRole: true,
      },
    }),
    prisma.auditLog.findMany({
      where: {
        orgId,
        entityId: id,
        entityType: "appointment",
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const actorIds = auditRows
    .map((row) => row.actorUserId)
    .filter((value): value is string => Boolean(value));
  const actors = actorIds.length
    ? await prisma.appUser.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const actorMap = new Map(actors.map((a) => [a.id, a]));

  const audit = auditRows.map((row) => ({
    id: row.id,
    actorUserId: row.actorUserId,
    action: row.action,
    createdAt: row.createdAt,
    actorName: row.actorUserId ? actorMap.get(row.actorUserId)?.name ?? null : null,
    actorEmail: row.actorUserId ? actorMap.get(row.actorUserId)?.email ?? null : null,
  }));
  const payment = normalizeAppointmentPayment({
    paymentPolicy: appt.paymentPolicy ?? null,
    paymentStatus: appt.paymentStatus ?? null,
    requiresPayment: appt.requiresPayment ?? null,
    priceCents: appt.priceCents ?? null,
    currency: appt.currency ?? null,
  });

  return NextResponse.json({
    appointment: {
      id: appt.id,
      orgId: appt.orgId,
      userId: appt.userId,
      staffUserId: appt.staffUserId,
      meetingTypeId: appt.meetingTypeId,
      meetingTypeKey: appt.meetingType?.key ?? null,
      durationMin: appt.meetingType?.durationMin ?? 60,
      status: appt.status,
      mode: appt.mode,
      paymentPolicy: payment.paymentPolicy,
      paymentStatus: payment.paymentStatus,
      requiresPayment: payment.requiresPayment,
      priceCents: payment.priceCents,
      currency: payment.currency,
      startAtUtc: appt.startAtUtc,
      endAtUtc: appt.endAtUtc,
      notes: appt.notes,
      createdAt: appt.createdAt,
      updatedAt: appt.updatedAt,
      userName: user?.name ?? null,
      userEmail: user?.email ?? null,
      userPhone: profile?.phone ?? user?.phone ?? null,
      userFullName: profile?.fullName ?? null,
      userCompany: profile?.company ?? null,
      userCompanyRole: profile?.companyRole ?? null,
    },
    history: audit,
  });
}
