import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MeetingTypesClient from "./MeetingTypesClient";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import {
  getFirstOrgContext,
  getOrgContextById,
  getUserOrgContext,
} from "@/lib/scheduling/org-context";
import { requireAdminOrStaffForOrg } from "@/lib/scheduling/admin-guard";

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

export default async function SchedulingMeetingTypesPage({
  searchParams,
}: {
  searchParams?: { orgId?: string | string[] };
}) {
  const requestedOrgId = pickParam(searchParams?.orgId);
  const orgContext = await resolveOrgId(requestedOrgId);

  if (orgContext?.orgId) {
    const returnTo = `/admin/scheduling/meeting-types?orgId=${orgContext.orgId}`;
    await requireAdminOrStaffForOrg(orgContext.orgId, returnTo);
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
      <Header />
      <div className="flex-1">
        <MeetingTypesClient orgId={orgContext?.orgId ?? ""} />
      </div>
      <Footer />
    </div>
  );
}
