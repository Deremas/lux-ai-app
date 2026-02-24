import { getServerSession } from "next-auth/next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductShell from "@/components/scheduling/ProductShell";
import SectionCard from "@/components/scheduling/SectionCard";

import { authOptions } from "@/lib/auth";
import { getFirstOrgContext, getUserOrgContext } from "@/lib/scheduling/org-context";
import { requireAdminOrStaffForOrg } from "@/lib/scheduling/admin-guard";
import AuditLogClient from "./AuditLogClient";

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

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams?: {};
}) {
  const orgContext = await resolveOrgId();

  const orgId = orgContext?.orgId || "";
  const returnTo = "/admin/scheduling";
  if (orgId) {
    await requireAdminOrStaffForOrg(orgId, returnTo);
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
      <Header />
      <div className="flex-1">
        <ProductShell>
          {orgId ? (
            <AuditLogClient
              orgId={orgId}
              orgName={orgContext?.orgName ?? null}
              tz={orgContext?.defaultTz ?? "UTC"}
              returnTo={returnTo}
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
