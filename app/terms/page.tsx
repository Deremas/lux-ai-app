"use client";

import { LegalDocumentLayout, LegalSection } from "@/components/marketing/LegalDocumentLayout";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/site-copy";

const termsUiCopy = {
  en: {
    subtitle:
      "The terms that govern the use of the Lux AI website, contact channels, and related digital services.",
    summaryTitle: "Summary",
    relatedTitle: "Related legal pages",
  },
  fr: {
    subtitle:
      "Les conditions qui regissent l'utilisation du site Lux AI, des canaux de contact et des services numeriques associes.",
    summaryTitle: "Resume",
    relatedTitle: "Pages legales liees",
  },
  de: {
    subtitle:
      "Die Bedingungen fuer die Nutzung der Lux-AI-Website, der Kontaktkanaele und der zugehoerigen digitalen Services.",
    summaryTitle: "Kurzueberblick",
    relatedTitle: "Verwandte rechtliche Seiten",
  },
  lb: {
    subtitle:
      "D'Konditiounen, déi d'Benotzung vun der Lux-AI-Website, de Kontaktkanäl an den zougehéieregen digitale Servicer regelen.",
    summaryTitle: "Kuerz Iwwersiicht",
    relatedTitle: "Verbonnen legal Säiten",
  },
} as const;

export default function TermsPage() {
  const { lang } = useLanguage();
  const ui = termsUiCopy[lang] ?? termsUiCopy.en;
  const s = (k: string) => t<string>(lang as any, `legal.terms.sections.${k}`);
  const pdfHref = `/api/terms.pdf?lang=${encodeURIComponent(lang)}`;

  return (
    <LegalDocumentLayout
      title={t<string>(lang as any, "legal.terms.title")}
      subtitle={ui.subtitle}
      meta={[s("metaDate"), s("metaCompany"), s("metaDomain")]}
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
          href: "/privacy-policy",
          label: t<string>(lang as any, "legal.imprint.links.privacy"),
        },
        {
          href: "/cookies",
          label: t<string>(lang as any, "legal.imprint.links.cookies"),
        },
      ]}
    >
      {["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11"].map(
        (key) => (
          <LegalSection key={key} title={s(`${key}t`)}>
            <p>{s(`${key}b`)}</p>
          </LegalSection>
        ),
      )}

      <LegalSection title={s("contactLabel")}>
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
