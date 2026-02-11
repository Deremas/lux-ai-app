import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import {
  requireOrgRole,
  requireUserIdFromSession,
} from "@/lib/scheduling/authz";
import { getUserOrgContext } from "@/lib/scheduling/org-context";
import { writeAudit } from "@/lib/scheduling/audit";
import { isBodyTooLarge, isValidUuid } from "@/lib/validation";

type Body = {
  orgId?: string;
  role?: string;
};

const ALLOWED_ROLES = ["admin", "staff", "customer"] as const;

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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
  if (isBodyTooLarge(req, 2048)) {
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

  const role = cleanString(body.role).toLowerCase();
  if (!ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const before = await prisma.orgMember.findFirst({
    where: { orgId, userId: targetUserId },
  });
  const updated = await prisma.orgMember.updateMany({
    where: { orgId, userId: targetUserId },
    data: { role },
  });

  if (!updated.count) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const item = await prisma.orgMember.findFirst({
    where: { orgId, userId: targetUserId },
  });
  await writeAudit({
    orgId,
    actorUserId: who.userId,
    entityType: "org_member",
    entityId: item?.id ?? targetUserId,
    action: "update",
    before,
    after: item,
  });
  return NextResponse.json({ item });
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
      { error: "Cannot remove your own org membership" },
      { status: 400 }
    );
  }

  const before = await prisma.orgMember.findFirst({
    where: { orgId, userId: targetUserId },
  });
  const deleted = await prisma.orgMember.deleteMany({
    where: { orgId, userId: targetUserId },
  });

  if (!deleted.count) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  await writeAudit({
    orgId,
    actorUserId: who.userId,
    entityType: "org_member",
    entityId: before?.id ?? targetUserId,
    action: "delete",
    before,
    after: null,
  });
  return NextResponse.json({ ok: true });
}
