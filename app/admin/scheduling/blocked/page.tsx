import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlockedTimeClient from "./BlockedTimeClient";
import { getServerSession } from "next-auth/next";
import ProductShell from "@/components/scheduling/ProductShell";
import SectionCard from "@/components/scheduling/SectionCard";

import { authOptions } from "@/lib/auth";
import { getFirstOrgContext, getUserOrgContext } from "@/lib/scheduling/org-context";
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

export default async function SchedulingBlockedPage({
  searchParams,
}: {
  searchParams?: {};
}) {
  const orgContext = await resolveOrgId();

  if (orgContext?.orgId) {
    const returnTo = "/admin/scheduling/blocked";
    await requireAdminOrStaffForOrg(orgContext.orgId, returnTo);
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
      <Header />
      <div className="flex-1">
        <ProductShell>
          {orgContext?.orgId ? (
            <BlockedTimeClient
              orgId={orgContext?.orgId ?? ""}
              defaultTz={orgContext?.defaultTz || "Europe/Luxembourg"}
            />
          ) : (
            <SectionCard>
              <div className="text-sm text-amber-900">
                No org found for this account.
              </div>
            </SectionCard>
          )}
        </ProductShell>
      </div>
      <Footer />
    </div>
  );
}
