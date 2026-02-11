// app/scheduling/page.tsx
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SchedulingClient from "./SchedulingClient";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import {
  getFirstOrgContext,
  getOrgContextById,
  getUserOrgContext,
} from "@/lib/scheduling/org-context";

const FALLBACK_TZ = "Europe/Luxembourg";

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
    const ctx = await getUserOrgContext(userId);
    if (ctx) return ctx;
  }

  return await getFirstOrgContext();
}

export default async function SchedulingPage({
  searchParams,
}: {
  searchParams?: {
    orgId?: string | string[];
    meetingTypeId?: string | string[];
    tz?: string | string[];
  };
}) {
  const requestedOrgId = pickParam(searchParams?.orgId);
  const orgContext = await resolveOrgId(requestedOrgId);
  const meetingTypeId = pickParam(searchParams?.meetingTypeId);
  const tz = pickParam(searchParams?.tz) || orgContext?.defaultTz || FALLBACK_TZ;

  if (!orgContext?.orgId) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
        <Header />
        <div className="flex-1">
          <div className="mx-auto w-full max-w-4xl px-4 py-12">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
              Missing orgId. Add `?orgId=...` to the URL.
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
      <Header />
      <div className="flex-1">
        <SchedulingClient
          orgId={orgContext.orgId}
          meetingTypeId={meetingTypeId}
          tz={tz}
        />
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
