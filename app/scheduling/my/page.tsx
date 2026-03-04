import DashboardClient from "../dashboard/DashboardClient";
import { getServerSession } from "next-auth/next";
import ProductShell from "@/components/scheduling/ProductShell";

import { authOptions } from "@/lib/auth";
import { getFirstOrgContext, getUserOrgContext } from "@/lib/scheduling/org-context";

const FALLBACK_TZ = "Europe/Luxembourg";

function pickParam(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

async function resolveOrgId() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (userId) {
    const ctx = await getUserOrgContext(userId);
    if (ctx) return ctx;
  }

  return await getFirstOrgContext();
}

export default async function SchedulingMyPage({
  searchParams,
}: {
  searchParams?: { tz?: string | string[] };
}) {
  const orgContext = await resolveOrgId();
  const tz = pickParam(searchParams?.tz) || orgContext?.defaultTz || FALLBACK_TZ;
  return (
    <ProductShell>
      <DashboardClient orgId={orgContext?.orgId ?? ""} tz={tz} />
    </ProductShell>
  );
}
