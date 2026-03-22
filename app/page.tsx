import { cookies } from "next/headers";

import HomePageClient from "@/components/HomePageClient";
import { normalizeLang } from "@/lib/i18n-types";

export default function Home() {
  const initialLang = normalizeLang(cookies().get("lang")?.value);

  return <HomePageClient initialLang={initialLang} />;
}
