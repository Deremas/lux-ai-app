// app/api/scheduling/appointments/[id]/cancel/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireUserIdFromSession,
  requireOrgRole,
} from "@/lib/scheduling/authz";
import { updateAppointmentStatus } from "@/lib/scheduling/appointments";
import { isBodyTooLarge, isValidMessage, isValidUuid } from "@/lib/validation";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { resolveOrgIdForRequest } from "@/lib/scheduling/org-resolver";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const url = new URL(req.url);
  if (!isValidUuid(id)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const who = await requireUserIdFromSession();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: 401 });

  const orgId = await resolveOrgIdForRequest({
    orgId: url.searchParams.get("orgId"),
    userId: who.userId,
    allowPublic: true,
  });
  if (!orgId) {
    return NextResponse.json(
      { error: "No organization found" },
      { status: 400 }
    );
  }

  // must be at least a member (customer/staff/admin)
  const authz = await requireOrgRole({
    orgId,
    userId: who.userId,
    allowed: ["customer", "staff", "admin"],
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

  // customers can only cancel their own
  if (authz.role === "customer") {
    const owns = await prisma.appointment.findFirst({
      where: { orgId, id, userId: who.userId },
      select: { id: true },
    });

    if (!owns)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (isBodyTooLarge(req, 1024)) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  const body = await req.json().catch(() => ({}));
  const reason =
    typeof body?.reason === "string" ? body.reason.trim() : undefined;
  if (reason && !isValidMessage(reason, 1, 300)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const res = await updateAppointmentStatus({
    orgId,
    appointmentId: id,
    actorUserId: who.userId,
    nextStatus: "canceled",
    allowedCurrent: ["pending", "confirmed"],
    reason,
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 409 });
  return NextResponse.json({ appointment: res.appointment });
}
