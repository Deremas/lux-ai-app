import PaymentsSettingsClient from "../PaymentsSettingsClient";
import { getServerSession } from "next-auth/next";
import ProductShell from "@/components/scheduling/ProductShell";

import { authOptions } from "@/lib/auth";
import {
  getFirstOrgContext,
  getUserOrgContext,
} from "@/lib/scheduling/org-context";
import { requireAdminOrStaffForOrg } from "@/lib/scheduling/admin-guard";

async function resolveOrgId() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (userId) {
    const ctx = await getUserOrgContext(userId, ["admin"]);
    if (ctx) return ctx;
  }

  return await getFirstOrgContext();
}

export default async function PaymentsSettingsPage() {
  const orgContext = await resolveOrgId();

  if (orgContext?.orgId) {
    const returnTo = "/admin/scheduling/settings/payments";
    await requireAdminOrStaffForOrg(orgContext.orgId, returnTo);
  }

  return (
    <ProductShell>
      <PaymentsSettingsClient orgId={orgContext?.orgId ?? ""} />
    </ProductShell>
  );
}
