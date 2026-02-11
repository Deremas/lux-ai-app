import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import {
  getFirstOrgContext,
  getOrgContextById,
  getUserOrgContext,
} from "@/lib/scheduling/org-context";
import { requireAdminOrStaffForOrg } from "@/lib/scheduling/admin-guard";
import AuditLogClient from "./AuditLogClient";

function pickParam(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

async function resolveOrgId(requestedOrgId: string) {
  if (requestedOrgId) {
    const ctx = await getOrgContextById(requestedOrgId);
    if (ctx) return ctx;
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (userId) {
    const ctx = await getUserOrgContext(userId, ["admin", "staff"]);
    if (ctx) return ctx;
  }

  return await getFirstOrgContext();
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams?: { orgId?: string | string[] };
}) {
  const requestedOrgId = pickParam(searchParams?.orgId);
  const orgContext = await resolveOrgId(requestedOrgId);

  const orgId = requestedOrgId || orgContext?.orgId || "";
  const returnTo = orgId ? `/admin/scheduling?orgId=${orgId}` : "/admin/scheduling";
  if (orgId) {
    await requireAdminOrStaffForOrg(orgId, returnTo);
  }

  return (
    <AuditLogClient
      orgId={orgId}
      orgName={orgContext?.orgName ?? null}
      tz={orgContext?.defaultTz ?? "UTC"}
      returnTo={returnTo}
    />
  );
}
