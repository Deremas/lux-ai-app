// app/scheduling/page.tsx
import SchedulingClient from "./SchedulingClient";
import ProductShell from "@/components/scheduling/ProductShell";
import { getServerSession } from "next-auth/next";
import { cookies } from "next/headers";

import { authOptions } from "@/lib/auth";
import { normalizeLang } from "@/lib/i18n-types";
import {
  getFirstOrgContext,
  getUserOrgContext,
} from "@/lib/scheduling/org-context";
import { getSchedulingRuntimeErrorMessage } from "@/lib/scheduling/runtime-errors";

const FALLBACK_TZ = "Europe/Luxembourg";
const SCHEDULING_FALLBACK_BY_LANG = {
  en: "Scheduling is temporarily unavailable right now. Please try again later or use the contact form.",
  fr: "La planification est temporairement indisponible. Reessayez plus tard ou utilisez le formulaire de contact.",
  de: "Die Terminbuchung ist derzeit nicht verfugbar. Bitte versuchen Sie es spater erneut oder nutzen Sie das Kontaktformular.",
  lb: "D'Planung ass aktuell temporar net verfügbar. Probéiert et méi spéit nach eng Kéier oder benotzt de Kontakt-Formulaire.",
} as const;

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
    meetingTypeKey?: string | string[];
    tz?: string | string[];
  };
}) {
  const lang = normalizeLang(cookies().get("lang")?.value);
  let orgContext = null;
  let availabilityError = "";

  try {
    orgContext = await resolveOrgId();
  } catch (error) {
    availabilityError =
      getSchedulingRuntimeErrorMessage(error) ||
      SCHEDULING_FALLBACK_BY_LANG[lang];
    console.error("[scheduling/page] failed to resolve org context", error);
  }

  const meetingTypeId = pickParam(searchParams?.meetingTypeId);
  const meetingTypeKey = pickParam(searchParams?.meetingTypeKey);
  const tz = pickParam(searchParams?.tz) || orgContext?.defaultTz || FALLBACK_TZ;

  return (
    <ProductShell>
      <SchedulingClient
        availabilityError={availabilityError}
        orgId={orgContext?.orgId ?? ""}
        meetingTypeId={meetingTypeId}
        meetingTypeKey={meetingTypeKey}
        tz={tz}
      />
    </ProductShell>
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
