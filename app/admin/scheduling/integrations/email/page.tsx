import { getServerSession } from "next-auth/next";
import ProductShell from "@/components/scheduling/ProductShell";
import SectionCard from "@/components/scheduling/SectionCard";

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

export default async function EmailIntegrationPage() {
  const orgContext = await resolveOrgId();

  if (orgContext?.orgId) {
    const returnTo = "/admin/scheduling/integrations/email";
    await requireAdminOrStaffForOrg(orgContext.orgId, returnTo);
  }

  return (
    <ProductShell>
      <div className="space-y-8">
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
            Scheduling Admin
          </p>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Email integration
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Connect an email provider for scheduling notifications.
          </p>
        </div>

        <SectionCard>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
              Coming soon
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              SMTP, SendGrid, and other providers will be configured here.
            </p>
          </div>
        </SectionCard>
      </div>
    </ProductShell>
  );
}
