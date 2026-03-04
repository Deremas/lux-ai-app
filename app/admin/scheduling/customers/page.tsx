// app/admin/scheduling/customers/page.tsx
import ProductShell from "@/components/scheduling/ProductShell";

import CustomersClient from "./CustomersClientMRT";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getFirstOrgContext, getUserOrgContext } from "@/lib/scheduling/org-context";
import { requireAdminOrStaffForOrg } from "@/lib/scheduling/admin-guard";

const FALLBACK_TZ = "Europe/Luxembourg";

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

export default async function SchedulingCustomersPage({
  searchParams,
}: {
  searchParams?: { tz?: string | string[] };
}) {
  const orgContext = await resolveOrgId();
  const tz = pickParam(searchParams?.tz) || orgContext?.defaultTz || FALLBACK_TZ;

  if (orgContext?.orgId) {
    const returnTo = "/admin/scheduling/customers";
    await requireAdminOrStaffForOrg(orgContext.orgId, returnTo);
  }

  return (
    <ProductShell>
      <CustomersClient orgId={orgContext?.orgId ?? ""} tz={tz} />
    </ProductShell>
  );
}
