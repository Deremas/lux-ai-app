// app/api/scheduling/admin/appointments/[id]/decline/route.ts
import { NextResponse } from "next/server";
import { requireUserIdFromSession, requireOrgRole } from "@/lib/scheduling/authz";
import { updateAppointmentStatus } from "@/lib/scheduling/appointments";
import { isBodyTooLarge, isValidMessage, isValidUuid } from "@/lib/validation";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const url = new URL(req.url);
  const orgId = url.searchParams.get("orgId");
  if (!orgId)
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
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
  if (!authz.ok)
    return NextResponse.json({ error: authz.error }, { status: 403 });

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
  const reason =
    typeof body?.reason === "string" ? body.reason.trim() : undefined;
  if (reason && !isValidMessage(reason, 1, 300)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const res = await updateAppointmentStatus({
    orgId,
    appointmentId: id,
    actorUserId: who.userId,
    nextStatus: "declined",
    allowedCurrent: ["pending"],
    reason,
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 409 });
  return NextResponse.json({
    appointment: res.appointment,
    emailError: res.emailError ?? null,
  });
}
