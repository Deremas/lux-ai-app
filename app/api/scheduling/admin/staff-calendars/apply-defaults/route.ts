import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

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
  workingHoursJson?: string;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseWorkingHours(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      timezone?: string;
      slotStepMin?: number;
      bufferMin?: number;
      week?: Record<string, Array<{ start: string; end: string }>>;
    };

    if (parsed.timezone && !isValidTimezone(parsed.timezone)) {
      return { error: "Invalid timezone in working hours" };
    }

    if (
      parsed.slotStepMin !== undefined &&
      (parsed.slotStepMin < 5 || parsed.slotStepMin > 60)
    ) {
      return { error: "Invalid slotStepMin" };
    }

    if (
      parsed.bufferMin !== undefined &&
      (parsed.bufferMin < 0 || parsed.bufferMin > 15)
    ) {
      return { error: "Invalid bufferMin" };
    }

    return { value: parsed };
  } catch {
    return { error: "Invalid working hours JSON" };
  }
}

async function resolveOrgId(orgIdParam: string, userId: string) {
  if (orgIdParam) return orgIdParam;
  const ctx = await getUserOrgContext(userId, ["admin"]);
  return ctx?.orgId ?? "";
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

  const workingHoursJson = cleanString(body.workingHoursJson || "");
  const parsed = parseWorkingHours(workingHoursJson || null);
  if (parsed && "error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const updated = await prisma.staffCalendar.updateMany({
    where: { orgId },
    data: {
      workingHours:
        parsed?.value === null
          ? Prisma.DbNull
          : parsed?.value ?? undefined,
    },
  });

  await writeAudit({
    orgId,
    actorUserId: who.userId,
    entityType: "staff_calendar",
    entityId: orgId,
    action: "apply_defaults",
    before: null,
    after: {
      count: updated.count ?? 0,
      workingHours: parsed?.value ?? null,
    },
  });

  return NextResponse.json({ ok: true, count: updated.count ?? 0 });
}
