"use client";

import { LegalDocumentLayout, LegalSection } from "@/components/marketing/LegalDocumentLayout";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/site-copy";

const privacyUiCopy = {
  en: {
    subtitle:
      "How Lux AI handles personal data connected to contact requests, website interactions, and service delivery.",
    summaryTitle: "Summary",
    relatedTitle: "Related legal pages",
  },
  fr: {
    subtitle:
      "Comment Lux AI traite les donnees personnelles liees aux demandes de contact, aux interactions sur le site et a la delivery de service.",
    summaryTitle: "Resume",
    relatedTitle: "Pages legales liees",
  },
  de: {
    subtitle:
      "Wie Lux AI personenbezogene Daten im Zusammenhang mit Kontaktanfragen, Website-Interaktionen und Service-Delivery verarbeitet.",
    summaryTitle: "Kurzueberblick",
    relatedTitle: "Verwandte rechtliche Seiten",
  },
  lb: {
    subtitle:
      "Wéi Lux AI perséinlech Donnéeën am Zesummenhang mat Kontaktufroen, Website-Interaktiounen a Service-Delivery behandelt.",
    summaryTitle: "Kuerz Iwwersiicht",
    relatedTitle: "Verbonnen legal Säiten",
  },
} as const;

export default function PrivacyPolicyPage() {
  const { lang } = useLanguage();
  const ui = privacyUiCopy[lang] ?? privacyUiCopy.en;
  const s = (k: string) =>
    t<string>(lang as any, `legal.privacy.sections.${k}`);

  const domain = s("metaDomain");
  const pdfHref = `/api/privacy-policy.pdf?lang=${encodeURIComponent(lang)}`;

  return (
    <LegalDocumentLayout
      title={t<string>(lang as any, "legal.privacy.title")}
      subtitle={ui.subtitle}
      meta={[s("metaDate"), s("metaCompany"), domain]}
      downloadHref={pdfHref}
      downloadLabel={s("downloadPdf")}
      summaryTitle={ui.summaryTitle}
      summaryBody={s("s1b")}
      relatedTitle={ui.relatedTitle}
      relatedLinks={[
        {
          href: "/legal",
          label: t<string>(lang as any, "legal.imprint.title"),
        },
        {
          href: "/cookies",
          label: t<string>(lang as any, "legal.imprint.links.cookies"),
        },
        {
          href: "/terms",
          label: t<string>(lang as any, "legal.imprint.links.terms"),
        },
      ]}
    >
      <LegalSection title={s("s1t")}>
        <p>{s("s1b")}</p>
      </LegalSection>

      <LegalSection title={s("s2t")}>
        <p>{s("s2b1")}</p>
        <p>{s("s2b2")}</p>
      </LegalSection>

      <LegalSection title={s("s3t")}>
        <p>{s("s3b")}</p>
      </LegalSection>

      <LegalSection title={s("s4t")}>
        <p>{s("s4b")}</p>
      </LegalSection>

      <LegalSection title={s("s5t")}>
        <p>{s("s5b")}</p>
      </LegalSection>

      <LegalSection title={s("s6t")}>
        <p>{s("s6b")}</p>
      </LegalSection>

      <LegalSection title={s("s7t")}>
        <p>{s("s7b")}</p>
      </LegalSection>

      <LegalSection title={s("s8t")}>
        <p>{s("s8b")}</p>
        <a
          href="mailto:molla@luxaiautomation.com"
          className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:border-primary-300 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-accent-400/40 dark:hover:text-accent-400"
        >
          molla@luxaiautomation.com
        </a>
      </LegalSection>

      <div className="border-t border-slate-200 pt-6 text-sm font-medium text-slate-600 dark:border-slate-800 dark:text-slate-300">
        {s("end")}
      </div>
    </LegalDocumentLayout>
  );
}
