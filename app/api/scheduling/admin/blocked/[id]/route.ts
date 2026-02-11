import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import {
  requireOrgRole,
  requireUserIdFromSession,
} from "@/lib/scheduling/authz";
import { writeAudit } from "@/lib/scheduling/audit";
import { isBodyTooLarge, isValidUuid } from "@/lib/validation";

type Body = {
  orgId?: string;
  staffUserId?: string | null;
  startAtUtc?: string;
  endAtUtc?: string;
  reason?: string | null;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (isBodyTooLarge(req, 8192)) {
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

  const { id } = await ctx.params;
  if (!isValidUuid(id)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orgId = cleanString(body.orgId);
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

  const staffUserId = cleanString(body.staffUserId ?? "");
  if (staffUserId && !isValidUuid(staffUserId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const startAtUtc = cleanString(body.startAtUtc);
  const endAtUtc = cleanString(body.endAtUtc);
  if (!startAtUtc || !endAtUtc) {
    return NextResponse.json({ error: "Missing start/end" }, { status: 400 });
  }

  const start = new Date(startAtUtc);
  const end = new Date(endAtUtc);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (end <= start) {
    return NextResponse.json({ error: "End must be after start" }, { status: 400 });
  }

  const reason = cleanString(body.reason);
  if (reason && reason.length > 200) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const before = await prisma.blockedTime.findFirst({ where: { orgId, id } });
  const updated = await prisma.blockedTime.updateMany({
    where: { orgId, id },
    data: {
      staffUserId: staffUserId || null,
      startAtUtc: start,
      endAtUtc: end,
      reason: reason || null,
    },
  });

  if (!updated.count) {
    return NextResponse.json({ error: "Blocked time not found" }, { status: 404 });
  }

  const item = await prisma.blockedTime.findFirst({ where: { orgId, id } });
  await writeAudit({
    orgId,
    actorUserId: who.userId,
    entityType: "blocked_time",
    entityId: id,
    action: "update",
    before,
    after: item,
  });
  return NextResponse.json({ item });
}

export async function DELETE(
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
  if (!isValidUuid(id)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const url = new URL(req.url);
  const orgId = cleanString(url.searchParams.get("orgId"));
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

  const before = await prisma.blockedTime.findFirst({ where: { orgId, id } });
  const deleted = await prisma.blockedTime.deleteMany({
    where: { orgId, id },
  });

  if (!deleted.count) {
    return NextResponse.json({ error: "Blocked time not found" }, { status: 404 });
  }

  await writeAudit({
    orgId,
    actorUserId: who.userId,
    entityType: "blocked_time",
    entityId: id,
    action: "delete",
    before,
    after: null,
  });
  return NextResponse.json({ ok: true });
}
