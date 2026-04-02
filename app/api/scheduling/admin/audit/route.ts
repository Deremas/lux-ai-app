import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { requireUserIdFromSession, requireOrgRole } from "@/lib/scheduling/authz";
import { isPrismaSchemaCompatibilityError } from "@/lib/scheduling/prisma-compat";
import { isValidUuid } from "@/lib/validation";

function cleanString(value: string | null): string {
  return (value ?? "").trim();
}

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

const AUDIT_COMPATIBILITY_WARNING =
  "Audit history is unavailable until the latest database migrations are applied.";

export async function GET(req: Request) {
  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers },
    );
  }

  const url = new URL(req.url);
  const orgId = cleanString(url.searchParams.get("orgId"));
  if (!orgId || !isValidUuid(orgId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const who = await requireUserIdFromSession();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: 401 });

  const allowed = await requireOrgRole({
    orgId,
    userId: who.userId,
    allowed: ["admin", "staff"],
  });
  if (!allowed.ok) {
    return NextResponse.json({ error: allowed.error }, { status: 403 });
  }

  const page = parsePositiveInt(url.searchParams.get("page"), 1);
  const pageSize = Math.min(
    100,
    parsePositiveInt(url.searchParams.get("pageSize"), 25),
  );

  const q = cleanString(url.searchParams.get("q"));
  const entityType = cleanString(url.searchParams.get("entityType"));
  const action = cleanString(url.searchParams.get("action"));
  const actorUserId = cleanString(url.searchParams.get("actorUserId"));
  const from = cleanString(url.searchParams.get("from"));
  const to = cleanString(url.searchParams.get("to"));

  const where: Prisma.AuditLogWhereInput = {
    orgId,
  };

  if (entityType) where.entityType = entityType;
  if (action) where.action = action;
  if (actorUserId && isValidUuid(actorUserId)) {
    where.actorUserId = actorUserId;
  }

  const fromDate = from ? DateTime.fromISO(from, { zone: "utc" }) : null;
  const toDate = to ? DateTime.fromISO(to, { zone: "utc" }) : null;
  if (fromDate?.isValid || toDate?.isValid) {
    where.createdAt = {};
    if (fromDate?.isValid) {
      where.createdAt.gte = fromDate.toJSDate();
    }
    if (toDate?.isValid) {
      where.createdAt.lte = toDate.toJSDate();
    }
  }

  if (q) {
    where.OR = [
      { entityType: { contains: q, mode: "insensitive" } },
      { action: { contains: q, mode: "insensitive" } },
      { entityId: { contains: q, mode: "insensitive" } },
      { actor: { email: { contains: q, mode: "insensitive" } } },
      { actor: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  let total = 0;
  let rows: Awaited<ReturnType<typeof prisma.auditLog.findMany>> = [];
  let warning: string | undefined;

  try {
    [total, rows] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);
  } catch (error) {
    if (isPrismaSchemaCompatibilityError(error)) {
      console.warn(
        "[admin/audit] audit_log is unavailable until database migrations are applied",
        error
      );
      warning = AUDIT_COMPATIBILITY_WARNING;
    } else {
      console.error("[admin/audit] failed to load audit log", error);
      return NextResponse.json(
        {
          error:
            "Audit log unavailable. Please run database migrations and reload.",
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    items: rows,
    total,
    page,
    pageSize,
    warning,
  });
}
