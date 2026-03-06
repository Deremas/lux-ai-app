import StripeIntegrationClient from "./StripeIntegrationClient";
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

export default async function StripeIntegrationPage() {
  const orgContext = await resolveOrgId();

  if (orgContext?.orgId) {
    const returnTo = "/admin/scheduling/integrations/stripe";
    await requireAdminOrStaffForOrg(orgContext.orgId, returnTo);
  }

  return (
    <ProductShell>
      <StripeIntegrationClient orgId={orgContext?.orgId ?? ""} />
    </ProductShell>
  );
}
