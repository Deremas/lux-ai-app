import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardClient from "../dashboard/DashboardClient";
import { getServerSession } from "next-auth/next";
import ProductShell from "@/components/scheduling/ProductShell";
import SectionCard from "@/components/scheduling/SectionCard";

import { authOptions } from "@/lib/auth";
import { getFirstOrgContext, getUserOrgContext } from "@/lib/scheduling/org-context";

const FALLBACK_TZ = "Europe/Luxembourg";

function pickParam(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

async function resolveOrgId() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (userId) {
    const ctx = await getUserOrgContext(userId);
    if (ctx) return ctx;
  }

  return await getFirstOrgContext();
}

export default async function SchedulingMyPage({
  searchParams,
}: {
  searchParams?: { tz?: string | string[] };
}) {
  const orgContext = await resolveOrgId();
  const tz = pickParam(searchParams?.tz) || orgContext?.defaultTz || FALLBACK_TZ;
  if (!orgContext?.orgId) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
        <Header />
        <div className="flex-1">
          <ProductShell>
            <SectionCard>
              <div className="text-sm text-amber-900">
                No organization found. Please sign in or contact support.
              </div>
            </SectionCard>
          </ProductShell>
        </div>
        <Footer />
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
      <Header />
      <div className="flex-1">
        <ProductShell>
          <DashboardClient orgId={orgContext.orgId} tz={tz} />
        </ProductShell>
      </div>
      <Footer />
    </div>
  );
}
