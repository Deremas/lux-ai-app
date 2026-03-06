import NotificationsTemplatesClient from "./NotificationsTemplatesClient";
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

export default async function SchedulingNotificationTemplatesPage() {
  const orgContext = await resolveOrgId();

  if (orgContext?.orgId) {
    const returnTo = "/admin/scheduling/notifications/templates";
    await requireAdminOrStaffForOrg(orgContext.orgId, returnTo);
  }

  return (
    <ProductShell>
      <NotificationsTemplatesClient orgId={orgContext?.orgId ?? ""} />
    </ProductShell>
  );
}

