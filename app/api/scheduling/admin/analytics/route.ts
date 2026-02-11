import { NextResponse } from "next/server";
import { DateTime } from "luxon";

import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import {
  requireOrgRole,
  requireUserIdFromSession,
} from "@/lib/scheduling/authz";
import {
  getSchedulingStatistics,
  getStaffPerformanceMetrics,
  getMeetingTypeBreakdown,
  getAnalyticsTimeline,
} from "@/lib/analytics";
import { isValidTimezone, isValidUuid } from "@/lib/validation";

function parseRange(params: URLSearchParams) {
  const fromParam = params.get("from");
  const toParam = params.get("to");
  let from: Date | undefined;
  let to: Date | undefined;

  if (fromParam) {
    const dt = DateTime.fromISO(fromParam);
    if (!dt.isValid) {
      return { error: "Invalid from date" } as const;
    }
    from = dt.toUTC().toJSDate();
  }

  if (toParam) {
    const dt = DateTime.fromISO(toParam);
    if (!dt.isValid) {
      return { error: "Invalid to date" } as const;
    }
    to = dt.toUTC().toJSDate();
  }

  return { from, to } as const;
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
  const orgId = url.searchParams.get("orgId");
  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }
  if (!isValidUuid(orgId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const authz = await requireOrgRole({
    orgId,
    userId: who.userId,
    allowed: ["admin", "staff"],
  });
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 });

  const settings = await prisma.orgSettings.findFirst({
    where: { orgId },
    select: { defaultTz: true, defaultCurrency: true },
  });

  const tzParam = url.searchParams.get("tz") || "";
  const tz = isValidTimezone(tzParam)
    ? tzParam
    : settings?.defaultTz || "Europe/Luxembourg";

  const range = parseRange(url.searchParams);
  if ("error" in range) {
    return NextResponse.json({ error: range.error }, { status: 400 });
  }

  const statusParam = url.searchParams.get("status");
  const statusFilter =
    statusParam && statusParam !== "all" ? statusParam : undefined;

  const [stats, staff, meetingTypes, timeline] = await Promise.all([
    getSchedulingStatistics(orgId, range, statusFilter),
    getStaffPerformanceMetrics(orgId, range, statusFilter),
    getMeetingTypeBreakdown(orgId, range, statusFilter),
    getAnalyticsTimeline({
      orgId,
      range,
      tz,
      baseCurrency: settings?.defaultCurrency ?? null,
      status: statusFilter,
    }),
  ]);

  return NextResponse.json({
    tz,
    baseCurrency: timeline.currency,
    range: {
      from: range.from ? new Date(range.from).toISOString() : null,
      to: range.to ? new Date(range.to).toISOString() : null,
    },
    totals: { appointments: stats.total },
    byStatus: stats.byStatus,
    byMode: stats.byMode,
    revenueByCurrency: stats.revenueByCurrency,
    expectedRevenueByCurrency: stats.expectedRevenueByCurrency ?? [],
    meetingTypes,
    timeline: timeline.items,
    staff,
  });
}
