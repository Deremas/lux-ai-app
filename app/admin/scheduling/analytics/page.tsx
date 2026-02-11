import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnalyticsClient from "./AnalyticsClient";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import {
  getFirstOrgContext,
  getOrgContextById,
  getUserOrgContext,
} from "@/lib/scheduling/org-context";
import { requireAdminOrStaffForOrg } from "@/lib/scheduling/admin-guard";

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
    const ctx = await getUserOrgContext(userId, ["admin", "staff"]);
    if (ctx) return ctx;
  }

  return await getFirstOrgContext();
}

export default async function SchedulingAnalyticsPage({
  searchParams,
}: {
  searchParams?: { orgId?: string | string[]; tz?: string | string[] };
}) {
  const requestedOrgId = pickParam(searchParams?.orgId);
  const orgContext = await resolveOrgId(requestedOrgId);
  const tz = pickParam(searchParams?.tz) || orgContext?.defaultTz || "Europe/Luxembourg";

  if (orgContext?.orgId) {
    const returnTo = `/admin/scheduling/analytics?orgId=${orgContext.orgId}`;
    await requireAdminOrStaffForOrg(orgContext.orgId, returnTo);
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
      <Header />
      <div className="flex-1">
        {orgContext?.orgId ? (
          <AnalyticsClient orgId={orgContext.orgId} tz={tz} />
        ) : (
          <div className="mx-auto w-full max-w-6xl px-6 py-12">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
              No org found for this account.
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
