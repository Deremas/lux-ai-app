import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import {
  requireOrgRole,
  requireUserIdFromSession,
} from "@/lib/scheduling/authz";
import { getUserOrgContext } from "@/lib/scheduling/org-context";
import { writeAudit } from "@/lib/scheduling/audit";
import { isBodyTooLarge, isValidTimezone, isValidUuid } from "@/lib/validation";

type Body = {
  orgId?: string;
  name?: string;
  email?: string;
  phone?: string;
  timezone?: string;
  role?: string;
};

const ALLOWED_ROLES = ["admin", "staff", "customer"] as const;

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function shapeAuditUser(
  user: { id: string; email: string | null; name: string | null; phone: string | null; timezone: string | null } | null,
  role: string | null
) {
  return {
    user: user
      ? {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          timezone: user.timezone,
        }
      : null,
    role,
  };
}

async function resolveOrgId(orgIdParam: string, userId: string) {
  if (orgIdParam) return orgIdParam;
  const ctx = await getUserOrgContext(userId, ["admin"]);
  return ctx?.orgId ?? "";
}

export async function PUT(
  req: Request,
  { params }: { params: { userId: string } }
) {
  if (isBodyTooLarge(req, 4096)) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  const who = await requireUserIdFromSession();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orgIdParam = cleanString(body.orgId);
  const orgId = await resolveOrgId(orgIdParam, who.userId);
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  if (!isValidUuid(orgId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const authz = await requireOrgRole({
    orgId,
    userId: who.userId,
    allowed: ["admin"],
  });
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 });

  const targetUserId = cleanString(params.userId);
  if (!targetUserId || !isValidUuid(targetUserId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const email = cleanString(body.email).toLowerCase();
  const name = cleanString(body.name);
  const phone = cleanString(body.phone);
  const timezone = cleanString(body.timezone);
  const role = cleanString(body.role).toLowerCase();

  if (timezone && !isValidTimezone(timezone)) {
    return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
  }

  if (role && !ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (email) {
    const conflict = await prisma.appUser.findFirst({
      where: { email },
      select: { id: true },
    });
    if (conflict && conflict.id !== targetUserId) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }
  }

  const [beforeUser, beforeMember] = await Promise.all([
    prisma.appUser.findFirst({
      where: { id: targetUserId },
      select: { id: true, email: true, name: true, phone: true, timezone: true },
    }),
    prisma.orgMember.findFirst({
      where: { orgId, userId: targetUserId },
      select: { role: true },
    }),
  ]);

  const updated = await prisma.appUser.update({
    where: { id: targetUserId },
    data: {
      email: email || undefined,
      name: name || undefined,
      phone: phone || undefined,
      timezone: timezone || undefined,
    },
  });

  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (role) {
    await prisma.orgMember.updateMany({
      where: { orgId, userId: targetUserId },
      data: { role },
    });
  }

  const [afterUser, afterMember] = await Promise.all([
    prisma.appUser.findFirst({
      where: { id: targetUserId },
      select: { id: true, email: true, name: true, phone: true, timezone: true },
    }),
    prisma.orgMember.findFirst({
      where: { orgId, userId: targetUserId },
      select: { role: true },
    }),
  ]);

  await writeAudit({
    orgId,
    actorUserId: who.userId,
    entityType: "user",
    entityId: targetUserId,
    action: "update",
    before: shapeAuditUser(beforeUser, beforeMember?.role ?? null),
    after: shapeAuditUser(afterUser, afterMember?.role ?? null),
  });

  return NextResponse.json({ item: updated });
}

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
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

  const url = new URL(req.url);
  const orgIdParam = cleanString(url.searchParams.get("orgId"));
  const orgId = await resolveOrgId(orgIdParam, who.userId);
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  if (!isValidUuid(orgId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const authz = await requireOrgRole({
    orgId,
    userId: who.userId,
    allowed: ["admin"],
  });
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 });

  const targetUserId = cleanString(params.userId);
  if (!targetUserId || !isValidUuid(targetUserId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const [member, user, profile, appointments] = await Promise.all([
    prisma.orgMember.findFirst({
      where: { orgId, userId: targetUserId },
      select: { role: true },
    }),
    prisma.appUser.findFirst({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        timezone: true,
        createdAt: true,
      },
    }),
    prisma.bookingProfile.findFirst({
      where: { userId: targetUserId },
      select: {
        fullName: true,
        phone: true,
        timezone: true,
        company: true,
        companyRole: true,
        notes: true,
      },
    }),
    prisma.appointment.findMany({
      where: { orgId, userId: targetUserId },
      include: { meetingType: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!user || !member) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    orgId,
    user: {
      id: user.id,
      email: user.email,
      name: profile?.fullName || user.name,
      phone: profile?.phone || user.phone,
      timezone: profile?.timezone || user.timezone,
      role: member.role,
      createdAt: user.createdAt,
      company: profile?.company ?? null,
      companyRole: profile?.companyRole ?? null,
      notes: profile?.notes ?? null,
    },
    bookings: appointments.map((appt) => ({
      id: appt.id,
      status: appt.status,
      startAtUtc: appt.startAtUtc,
      endAtUtc: appt.endAtUtc,
      meetingTypeKey: appt.meetingType?.key ?? null,
      durationMin: appt.meetingType?.durationMin ?? null,
      mode: appt.mode,
      createdAt: appt.createdAt,
    })),
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: { userId: string } }
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

  const url = new URL(req.url);
  const orgIdParam = cleanString(url.searchParams.get("orgId"));
  const orgId = await resolveOrgId(orgIdParam, who.userId);
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  if (!isValidUuid(orgId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const authz = await requireOrgRole({
    orgId,
    userId: who.userId,
    allowed: ["admin"],
  });
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 });

  const targetUserId = cleanString(params.userId);
  if (!targetUserId || !isValidUuid(targetUserId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (targetUserId === who.userId) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 }
    );
  }

  const [beforeUser, beforeMember] = await Promise.all([
    prisma.appUser.findFirst({
      where: { id: targetUserId },
      select: { id: true, email: true, name: true, phone: true, timezone: true },
    }),
    prisma.orgMember.findFirst({
      where: { orgId, userId: targetUserId },
      select: { role: true },
    }),
  ]);

  await prisma.orgMember.deleteMany({
    where: { orgId, userId: targetUserId },
  });

  const deleted = await prisma.appUser.deleteMany({
    where: { id: targetUserId },
  });

  if (!deleted.count) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await writeAudit({
    orgId,
    actorUserId: who.userId,
    entityType: "user",
    entityId: targetUserId,
    action: "delete",
    before: shapeAuditUser(beforeUser, beforeMember?.role ?? null),
    after: null,
  });

  return NextResponse.json({ ok: true });
}
