// app/scheduling/page.tsx
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SchedulingClient from "./SchedulingClient";
import ProductShell from "@/components/scheduling/ProductShell";
import SectionCard from "@/components/scheduling/SectionCard";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import {
  getFirstOrgContext,
  getUserOrgContext,
} from "@/lib/scheduling/org-context";

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

export default async function SchedulingPage({
  searchParams,
}: {
  searchParams?: {
    meetingTypeId?: string | string[];
    tz?: string | string[];
  };
}) {
  const orgContext = await resolveOrgId();
  const meetingTypeId = pickParam(searchParams?.meetingTypeId);
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
          <SchedulingClient
            orgId={orgContext.orgId}
            meetingTypeId={meetingTypeId}
            tz={tz}
          />
        </ProductShell>
      </div>
      <Footer />
    </div>
  );
}

// import dynamic from "next/dynamic";
// import Header from "@/components/Header";
// import Footer from "@/components/Footer";

// const SchedulingClient = dynamic(() => import("./SchedulingClient"), {
//   ssr: false,
// });

// export default function SchedulingPage() {
//   return (
//     <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
//       <Header />
//       <SchedulingClient
//         orgId="2e6c5265-911f-44b8-afad-45159952c02a"
//         meetingTypeId="5c7e86ff-bb6c-4bae-8f4d-5bd7ad0c971f"
//         tz="Europe/Luxembourg"
//       />
//       <Footer />
//     </div>
//   );
// }
