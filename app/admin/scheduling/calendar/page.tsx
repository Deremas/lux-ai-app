import { AdminCalendar } from "@/components/scheduling/AdminCalendar";
import { getServerSession } from "next-auth/next";
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

  if (orgContext?.orgId) {
    const returnTo = "/admin/scheduling/calendar";
    await requireAdminOrStaffForOrg(orgContext.orgId, returnTo);
  }

  return (
    <ProductShell>
      <ProductHero
        eyebrow="Scheduling Admin"
        title="Calendar"
        subtitle="Org calendar view for availability, blocks, and appointments."
      />
      <div className="mt-6">
        <SectionCard className="p-4 md:p-6">
          <AdminCalendar orgId={orgContext?.orgId ?? ""} tz={tz} />
        </SectionCard>
      </div>
    </ProductShell>
  );
}
