import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminDashboardClient from "./AdminDashboardClient";
import { getServerSession } from "next-auth/next";
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

async function resolveOrgId() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (userId) {
    const ctx = await getUserOrgContext(userId, ["admin", "staff"]);
    if (ctx) return ctx;
  }

  return await getFirstOrgContext();
}

export default async function SchedulingAdminPage({
  searchParams,
}: {
  searchParams?: {};
}) {
  const orgContext = await resolveOrgId();

  if (orgContext?.orgId) {
    const returnTo = "/admin/scheduling";
    await requireAdminOrStaffForOrg(orgContext.orgId, returnTo);
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
      <Header />
      <div className="flex-1">
        <ProductShell>
          <AdminDashboardClient
            orgId={orgContext?.orgId ?? ""}
            orgName={orgContext?.orgName ?? null}
            tz={orgContext?.defaultTz ?? "Europe/Luxembourg"}
          />
        </ProductShell>
      </div>
      <Footer />
    </div>
  );
}
