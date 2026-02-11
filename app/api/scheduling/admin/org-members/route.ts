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
  userId?: string;
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

export async function GET(req: Request) {
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

  const members = await prisma.orgMember.findMany({
    where: { orgId },
    orderBy: { createdAt: "asc" },
  });

  const userIds = Array.from(new Set(members.map((m) => m.userId)));
  const users = userIds.length
    ? await prisma.appUser.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, phone: true, timezone: true },
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const items = members.map((m) => {
    const user = userMap.get(m.userId);
    return {
      id: m.id,
      orgId: m.orgId,
      userId: m.userId,
      role: m.role,
      createdAt: m.createdAt,
      name: user?.name ?? null,
      email: user?.email ?? null,
      phone: user?.phone ?? null,
      timezone: user?.timezone ?? null,
    };
  });

  return NextResponse.json({ orgId, items });
}

export async function POST(req: Request) {
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

  const userId = cleanString(body.userId);
  if (!userId || !isValidUuid(userId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const role = cleanString(body.role).toLowerCase();
  if (!ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const existing = await prisma.orgMember.findFirst({
    where: { orgId, userId },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "User is already in this org" },
      { status: 409 }
    );
  }

  const inserted = await prisma.orgMember.create({
    data: { id: crypto.randomUUID(), orgId, userId, role },
  });

  await writeAudit({
    orgId,
    actorUserId: who.userId,
    entityType: "org_member",
    entityId: inserted.id,
    action: "create",
    before: null,
    after: inserted,
  });

  return NextResponse.json({ item: inserted }, { status: 201 });
}
