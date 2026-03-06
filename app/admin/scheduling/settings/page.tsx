import GeneralSettingsClient from "./GeneralSettingsClient";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import ProductShell from "@/components/scheduling/ProductShell";

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

function normalizeTab(raw: string) {
  return raw.toLowerCase().replace(/[^a-z]/g, "");
}

async function resolveOrgId() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (userId) {
    const ctx = await getUserOrgContext(userId, ["admin"]);
    if (ctx) return ctx;
  }

  return await getFirstOrgContext();
}

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function SchedulingSettingsPage({ searchParams }: PageProps) {
  const tabRaw =
    pickParam(searchParams?.tab) ||
    pickParam(searchParams?.section) ||
    pickParam(searchParams?.view);
  const tab = normalizeTab(tabRaw);
  const redirects: Record<string, string> = {
    booking: "/admin/scheduling/settings/booking",
    bookingpolicies: "/admin/scheduling/settings/booking",
    payments: "/admin/scheduling/settings/payments",
    payment: "/admin/scheduling/settings/payments",
    notifications: "/admin/scheduling/notifications",
    notification: "/admin/scheduling/notifications",
    integrations: "/admin/scheduling/integrations",
    integration: "/admin/scheduling/integrations",
    workinghours: "/admin/scheduling/settings#working-hours",
    workinghour: "/admin/scheduling/settings#working-hours",
    hours: "/admin/scheduling/settings#working-hours",
  };
  if (tab && redirects[tab]) {
    redirect(redirects[tab]);
  }
  const orgContext = await resolveOrgId();

  if (orgContext?.orgId) {
    const returnTo = "/admin/scheduling/settings";
    await requireAdminOrStaffForOrg(orgContext.orgId, returnTo);
  }

  return (
    <ProductShell>
      <GeneralSettingsClient orgId={orgContext?.orgId ?? ""} />
    </ProductShell>
  );
}
