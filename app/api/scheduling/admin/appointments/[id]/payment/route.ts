// app/api/scheduling/admin/appointments/[id]/payment/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/scheduling/audit";
import { requireUserIdFromSession, requireOrgRole } from "@/lib/scheduling/authz";
import { isBodyTooLarge, isValidUuid } from "@/lib/validation";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";

type PaymentStatus = "paid" | "unpaid";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const orgId = url.searchParams.get("orgId");

  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }
  if (!isValidUuid(orgId) || !isValidUuid(id)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const who = await requireUserIdFromSession();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: 401 });

  const authz = await requireOrgRole({
    orgId,
    userId: who.userId,
    allowed: ["admin", "staff"],
  });
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: 403 });
  }

  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  if (isBodyTooLarge(req, 1024)) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  const body = await req.json().catch(() => ({}));
  const nextStatus = body?.status;
  if (nextStatus !== "paid" && nextStatus !== "unpaid") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const [appt, settings] = await Promise.all([
    prisma.appointment.findFirst({
      where: { orgId, id },
      select: {
        id: true,
        paymentPolicy: true,
        paymentStatus: true,
        requiresPayment: true,
        priceCents: true,
        currency: true,
        meetingTypeId: true,
      },
    }),
    prisma.orgSettings.findFirst({
      where: { orgId },
      select: { paymentPolicy: true },
    }),
  ]);

  if (!appt) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  const meetingType = await prisma.meetingType.findFirst({
    where: { id: appt.meetingTypeId, orgId },
    select: { requiresPayment: true, priceCents: true, currency: true },
  });

  const policy = appt.paymentPolicy ?? settings?.paymentPolicy ?? "FREE";
  if (policy === "FREE") {
    return NextResponse.json(
      { error: "Payments are disabled for this org." },
      { status: 409 }
    );
  }

  const requiresPayment =
    appt.requiresPayment ?? meetingType?.requiresPayment ?? false;
  if (!requiresPayment) {
    return NextResponse.json(
      { error: "This meeting type does not require payment." },
      { status: 409 }
    );
  }

  const updated = await prisma.appointment.update({
    where: { id: appt.id },
    data: { paymentStatus: nextStatus },
  });

  await writeAudit({
    orgId,
    actorUserId: who.userId,
    entityType: "appointment",
    entityId: updated.id,
    action: "payment_status_update",
    before: appt,
    after: updated,
  });

  return NextResponse.json({
    appointment: updated,
    payment: {
      status: updated.paymentStatus ?? nextStatus,
      priceCents: updated.priceCents ?? appt.priceCents ?? meetingType?.priceCents ?? null,
      currency: updated.currency ?? appt.currency ?? meetingType?.currency ?? null,
    },
  });
}
