import { getServerSession } from "next-auth/next";
import ProductShell from "@/components/scheduling/ProductShell";

import { authOptions } from "@/lib/auth";
import { getFirstOrgContext, getUserOrgContext } from "@/lib/scheduling/org-context";
import { requireAdminOrStaffForOrg } from "@/lib/scheduling/admin-guard";
import OpsClient from "./OpsClient";

async function resolveOrgId() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (userId) {
    const ctx = await getUserOrgContext(userId, ["admin", "staff"]);
    if (ctx) return ctx;
  }

  return await getFirstOrgContext();
}

export default async function SchedulingOpsPage() {
  const orgContext = await resolveOrgId();

  const orgId = orgContext?.orgId || "";
  const returnTo = "/admin/scheduling/ops";
  if (orgId) {
    await requireAdminOrStaffForOrg(orgId, returnTo);
  }

  return (
    <ProductShell>
      <OpsClient
        orgId={orgId}
        orgName={orgContext?.orgName ?? null}
        tz={orgContext?.defaultTz ?? "UTC"}
      />
    </ProductShell>
  );
}
