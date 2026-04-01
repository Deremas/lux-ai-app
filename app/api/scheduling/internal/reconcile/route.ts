import { NextResponse } from "next/server";

import { runSchedulingCleanupJobs } from "@/lib/scheduling/reconciliation";

function getConfiguredSecret() {
  return (
    process.env.SCHEDULING_RECONCILE_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    ""
  );
}

function isAuthorized(req: Request) {
  const configuredSecret = getConfiguredSecret();
  if (!configuredSecret) return false;

  const authHeader = req.headers.get("authorization")?.trim() || "";
  return authHeader === `Bearer ${configuredSecret}`;
}

export async function POST(req: Request) {
  const configuredSecret = getConfiguredSecret();
  if (!configuredSecret) {
    return NextResponse.json(
      { error: "Scheduling reconciliation secret is not configured." },
      { status: 503 }
    );
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await runSchedulingCleanupJobs();
  return NextResponse.json({
    ok: true,
    summary,
  });
}
