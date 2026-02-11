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
  staffUserId?: string | null;
  startAtUtc?: string;
  endAtUtc?: string;
  reason?: string | null;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function resolveOrgId(orgIdParam: string, userId: string) {
  if (orgIdParam) return orgIdParam;
  const ctx = await getUserOrgContext(userId, ["admin", "staff"]);
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
    allowed: ["admin", "staff"],
  });
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 });

  const rows = await prisma.blockedTime.findMany({
    where: { orgId },
  });

  return NextResponse.json({ orgId, items: rows });
}

export async function POST(req: Request) {
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

  const inserted = await prisma.blockedTime.create({
    data: {
      id: crypto.randomUUID(),
      orgId,
      staffUserId: staffUserId || null,
      startAtUtc: start,
      endAtUtc: end,
      reason: reason || null,
    },
  });

  await writeAudit({
    orgId,
    actorUserId: who.userId,
    entityType: "blocked_time",
    entityId: inserted.id,
    action: "create",
    before: null,
    after: inserted,
  });

  return NextResponse.json({ item: inserted }, { status: 201 });
}
