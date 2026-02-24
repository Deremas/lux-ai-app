import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AdminCalendar } from "@/components/scheduling/AdminCalendar";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import ProductShell from "@/components/scheduling/ProductShell";
import ProductHero from "@/components/scheduling/ProductHero";
import SectionCard from "@/components/scheduling/SectionCard";

import { authOptions } from "@/lib/auth";
import {
  getFirstOrgContext,
  getUserOrgContext,
} from "@/lib/scheduling/org-context";
import { requireAdminOrStaffForOrg } from "@/lib/scheduling/admin-guard";

function pickParam(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

async function resolveOrgId() {
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
  searchParams?: { tz?: string | string[] };
}) {
  const orgContext = await resolveOrgId();
  const tz = pickParam(searchParams?.tz) || orgContext?.defaultTz || "Europe/Luxembourg";
  const dashboardHref = "/admin/scheduling";

  if (orgContext?.orgId) {
    const returnTo = "/admin/scheduling/calendar";
    await requireAdminOrStaffForOrg(orgContext.orgId, returnTo);
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
      <Header />
      <div className="flex-1">
        <ProductShell>
          <ProductHero
            eyebrow="Scheduling Admin"
            title="Calendar"
            subtitle="Org calendar view for availability, blocks, and appointments."
            actions={
              <Link
                href={dashboardHref}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 dark:hover:bg-slate-800"
              >
                Back to dashboard
              </Link>
            }
          />
          <div className="mt-6">
            {orgContext?.orgId ? (
              <SectionCard className="p-4 md:p-6">
                <AdminCalendar orgId={orgContext.orgId} tz={tz} />
              </SectionCard>
            ) : (
              <SectionCard>
                <div className="text-sm text-amber-900">
                  No org found for this account.
                </div>
              </SectionCard>
            )}
          </div>
        </ProductShell>
      </div>
      <Footer />
    </div>
  );
}
