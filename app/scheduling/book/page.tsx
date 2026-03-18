import SchedulingClient from "../SchedulingClient";
import { getServerSession } from "next-auth/next";
import ProductShell from "@/components/scheduling/ProductShell";
import { cookies } from "next/headers";

import { authOptions } from "@/lib/auth";
import { normalizeLang } from "@/lib/i18n-types";
import { getFirstOrgContext, getUserOrgContext } from "@/lib/scheduling/org-context";
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

export default async function SchedulingBookPage({
  searchParams,
}: {
  searchParams?: { meetingTypeId?: string | string[]; tz?: string | string[] };
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
    console.error("[scheduling/book/page] failed to resolve org context", error);
  }

  const meetingTypeId = pickParam(searchParams?.meetingTypeId);
  const tz = pickParam(searchParams?.tz) || orgContext?.defaultTz || FALLBACK_TZ;

  return (
    <ProductShell>
      <SchedulingClient
        availabilityError={availabilityError}
        orgId={orgContext?.orgId ?? ""}
        meetingTypeId={meetingTypeId}
        tz={tz}
      />
    </ProductShell>
  );
}
