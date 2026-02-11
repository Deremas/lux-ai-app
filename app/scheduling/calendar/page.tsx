import { SchedulingCalendar } from "@/components/scheduling/SchedulingCalendar";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import {
  getFirstOrgContext,
  getOrgContextById,
  getUserOrgContext,
} from "@/lib/scheduling/org-context";

const FALLBACK_TZ = "Europe/Luxembourg";

function pickParam(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

async function resolveOrgId(requestedOrgId: string) {
  if (requestedOrgId) {
    const ctx = await getOrgContextById(requestedOrgId);
    if (ctx) return ctx;
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (userId) {
    const ctx = await getUserOrgContext(userId);
    if (ctx) return ctx;
  }

  return await getFirstOrgContext();
}

export default async function SchedulingCalendarPage({
  searchParams,
}: {
  searchParams?: { orgId?: string | string[]; tz?: string | string[] };
}) {
  const requestedOrgId = pickParam(searchParams?.orgId);
  const orgContext = await resolveOrgId(requestedOrgId);
  const tz = pickParam(searchParams?.tz) || orgContext?.defaultTz || FALLBACK_TZ;
  if (!orgContext?.orgId) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          Missing orgId. Add `?orgId=...` to the URL.
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Scheduling Calendar</h1>

      <SchedulingCalendar
        orgId={orgContext.orgId}
        tz={tz}
        includeBuffer={true}
      />
    </div>
  );
}
