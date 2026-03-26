"use client";

import { LegalDocumentLayout, LegalSection } from "@/components/marketing/LegalDocumentLayout";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/site-copy";
import type { AppLanguage } from "@/lib/i18n";

type CookieSection =
  | { title: string; body: string; bodyList?: never }
  | { title: string; bodyList: string[]; body?: never };

type CookieDoc = {
  title: string;
  meta: {
    effectiveDate: string;
    company: string;
    domain: string;
    downloadPdf: string;
  };
  sections: CookieSection[];
  footer: string;
};

const cookiesUiCopy = {
  en: {
    subtitle:
      "How Lux AI uses cookies and related technologies to support essential site functions and consent choices.",
    summaryTitle: "Summary",
    relatedTitle: "Related legal pages",
  },
  fr: {
    subtitle:
      "Comment Lux AI utilise les cookies et technologies associees pour les fonctions essentielles du site et les choix de consentement.",
    summaryTitle: "Resume",
    relatedTitle: "Pages legales liees",
  },
  de: {
    subtitle:
      "Wie Lux AI Cookies und aehnliche Technologien fuer wesentliche Website-Funktionen und Einwilligungsentscheidungen nutzt.",
    summaryTitle: "Kurzueberblick",
    relatedTitle: "Verwandte rechtliche Seiten",
  },
  lb: {
    subtitle:
      "Wéi Lux AI Cookies an ähnlech Technologien fir essentiell Website-Funktiounen an Zoustëmmungsentscheedungen benotzt.",
    summaryTitle: "Kuerz Iwwersiicht",
    relatedTitle: "Verbonnen legal Säiten",
  },
} as const;

export default function CookiesPage() {
  const { lang } = useLanguage();
  const ui = cookiesUiCopy[lang] ?? cookiesUiCopy.en;
  const doc = t<CookieDoc>(lang as AppLanguage, "legal.cookies");
  const pdfHref = `/api/cookies.pdf?lang=${encodeURIComponent(lang)}`;

  return (
    <LegalDocumentLayout
      title={doc.title}
      subtitle={ui.subtitle}
      meta={[doc.meta.effectiveDate, doc.meta.company, doc.meta.domain]}
      downloadHref={pdfHref}
      downloadLabel={doc.meta.downloadPdf}
      summaryTitle={ui.summaryTitle}
      summaryBody={
        "body" in doc.sections[0] && doc.sections[0].body
          ? doc.sections[0].body
          : doc.sections[0]?.bodyList?.[0] ?? ""
      }
      relatedTitle={ui.relatedTitle}
      relatedLinks={[
        {
          href: "/legal",
          label: t<string>(lang as any, "legal.imprint.title"),
        },
        {
          href: "/privacy-policy",
          label: t<string>(lang as any, "legal.imprint.links.privacy"),
        },
        {
          href: "/terms",
          label: t<string>(lang as any, "legal.imprint.links.terms"),
        },
      ]}
    >
      {doc.sections.map((section) => (
        <LegalSection key={section.title} title={section.title}>
          {"bodyList" in section && section.bodyList ? (
            <ul className="list-disc pl-6">
              {section.bodyList.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p>{section.body}</p>
          )}
        </LegalSection>
      ))}

      <div className="border-t border-slate-200 pt-6 text-sm font-medium text-slate-600 dark:border-slate-800 dark:text-slate-300">
        {doc.footer}
      </div>
    </LegalDocumentLayout>
  );
}
