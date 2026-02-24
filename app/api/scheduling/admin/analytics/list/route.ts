import { NextResponse } from "next/server";
import { DateTime } from "luxon";

import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import {
  requireOrgRole,
  requireUserIdFromSession,
} from "@/lib/scheduling/authz";
import { getAnalyticsAppointments, type AnalyticsListType } from "@/lib/analytics";
import { isValidUuid } from "@/lib/validation";
import { resolveOrgIdForRequest } from "@/lib/scheduling/org-resolver";

const LIST_TYPES = new Set<AnalyticsListType>(["all", "paid", "expected"]);

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

  const range = parseRange(url.searchParams);
  if ("error" in range) {
    return NextResponse.json({ error: range.error }, { status: 400 });
  }

  const statusParam = url.searchParams.get("status");
  const statusFilter =
    statusParam && statusParam !== "all" ? statusParam : undefined;

  const typeParam = url.searchParams.get("type") || "all";
  if (!LIST_TYPES.has(typeParam as AnalyticsListType)) {
    return NextResponse.json({ error: "Invalid list type" }, { status: 400 });
  }

  const staffUserIdParam = url.searchParams.get("staffUserId");
  if (staffUserIdParam && !isValidUuid(staffUserIdParam)) {
    return NextResponse.json({ error: "Invalid staff user" }, { status: 400 });
  }

  const result = await getAnalyticsAppointments({
    orgId,
    range,
    status: statusFilter,
    type: typeParam as AnalyticsListType,
    staffUserId: staffUserIdParam || undefined,
  });

  return NextResponse.json(result);
}
