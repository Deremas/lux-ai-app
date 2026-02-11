import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import crypto from "crypto";
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
  staffUserId?: string;
  isActive?: boolean;
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

  const rows = await prisma.staffCalendar.findMany({
    where: { orgId },
  });

  const items = rows.map((row) => ({
    ...row,
    workingHoursJson: row.workingHours
      ? JSON.stringify(row.workingHours, null, 2)
      : null,
  }));

  return NextResponse.json({ orgId, items });
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

  const staffUserId = cleanString(body.staffUserId);
  if (!staffUserId || !isValidUuid(staffUserId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const workingHoursJson = cleanString(body.workingHoursJson || "");
  const parsed = parseWorkingHours(workingHoursJson);
  if (parsed && "error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const inserted = await prisma.staffCalendar.create({
    data: {
      id: crypto.randomUUID(),
      orgId,
      staffUserId,
      isActive: body.isActive ?? true,
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
    entityId: inserted.id,
    action: "create",
    before: null,
    after: inserted,
  });

  return NextResponse.json(
    {
      item: {
        ...inserted,
        workingHoursJson: inserted.workingHours
          ? JSON.stringify(inserted.workingHours, null, 2)
          : null,
      },
    },
    { status: 201 }
  );
}
