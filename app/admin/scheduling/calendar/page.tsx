import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AdminCalendar } from "@/components/scheduling/AdminCalendar";
import { getServerSession } from "next-auth/next";
import Link from "next/link";

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

export default async function SchedulingAdminCalendarPage({
  searchParams,
}: {
  searchParams?: { orgId?: string | string[]; tz?: string | string[] };
}) {
  const requestedOrgId = pickParam(searchParams?.orgId);
  const orgContext = await resolveOrgId(requestedOrgId);
  const tz = pickParam(searchParams?.tz) || orgContext?.defaultTz || "Europe/Luxembourg";
  const dashboardHref = orgContext?.orgId
    ? `/admin/scheduling?orgId=${orgContext.orgId}`
    : "/admin/scheduling";

  if (orgContext?.orgId) {
    const returnTo = `/admin/scheduling/calendar?orgId=${orgContext.orgId}`;
    await requireAdminOrStaffForOrg(orgContext.orgId, returnTo);
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
      <Header />
      <div className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex justify-end">
              <Link
                href={dashboardHref}
                className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 hover:underline dark:text-gray-400"
              >
                Back to dashboard
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                Scheduling Admin
              </p>
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
                Calendar
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Org calendar view for availability, blocks, and appointments.
              </p>
            </div>

            <div className="mt-6">
              {orgContext?.orgId ? (
                <AdminCalendar orgId={orgContext.orgId} tz={tz} />
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
                  No org found for this account.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
