import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import {
  requireOrgRole,
  requireUserIdFromSession,
} from "@/lib/scheduling/authz";
import { pickStaffForSlot } from "@/lib/scheduling/auto-assignment";
import { writeAudit } from "@/lib/scheduling/audit";
import { isValidUuid } from "@/lib/validation";
import { resolveOrgIdForRequest } from "@/lib/scheduling/org-resolver";

const FALLBACK_TZ = "Europe/Luxembourg";

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(
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
    select: { id: true, staffUserId: true, startAtUtc: true, endAtUtc: true },
  });

  if (!appt) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  if (appt.staffUserId) {
    return NextResponse.json(
      { error: "Appointment already has staff assigned." },
      { status: 409 }
    );
  }

  const settings = await prisma.orgSettings.findFirst({
    where: { orgId },
    select: { defaultTz: true },
  });

  const auto = await pickStaffForSlot({
    orgId,
    startUtc: appt.startAtUtc,
    endUtc: appt.endAtUtc,
    bookingTz: settings?.defaultTz || FALLBACK_TZ,
  });

  if (!auto.staffUserId) {
    const message = auto.noStaffAvailable
      ? "No available staff for this appointment."
      : "No staff calendars configured.";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  const updated = await prisma.appointment.update({
    where: { id: appt.id },
    data: {
      staffUserId: auto.staffUserId,
      updatedAt: new Date(),
    },
  });

  await writeAudit({
    orgId,
    actorUserId: who.userId,
    entityType: "appointment",
    entityId: appt.id,
    action: "staff:auto-assign",
    before: { staffUserId: appt.staffUserId ?? null },
    after: { staffUserId: updated.staffUserId ?? null },
  });

  const staff = await prisma.appUser.findFirst({
    where: { id: auto.staffUserId },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json({
    appointment: { id: updated.id, staffUserId: updated.staffUserId },
    staff,
  });
}
