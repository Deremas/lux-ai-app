"use client";

import { LegalDocumentLayout, LegalSection } from "@/components/marketing/LegalDocumentLayout";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/site-copy";

type RowProps = {
  label: string;
  value: React.ReactNode;
  sub?: string;
};

function Row({ label, value, sub }: RowProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-[220px_1fr]">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </div>
      <div className="text-slate-900 dark:text-slate-100">
        <div className="font-medium">{value}</div>
        {sub ? (
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {sub}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const legalUiCopy = {
  en: {
    subtitle:
      "The main legal and business identity information for Lux AI Automation, including company, contact, and hosting details.",
    summaryTitle: "Summary",
    relatedTitle: "Related legal pages",
  },
  fr: {
    subtitle:
      "Les principales informations legales et d'identite business de Lux AI Automation, y compris l'entreprise, le contact et l'hebergement.",
    summaryTitle: "Resume",
    relatedTitle: "Pages legales liees",
  },
  de: {
    subtitle:
      "Die wichtigsten rechtlichen und geschaeftlichen Identitaetsangaben von Lux AI Automation, einschliesslich Unternehmen, Kontakt und Hosting.",
    summaryTitle: "Kurzueberblick",
    relatedTitle: "Verwandte rechtliche Seiten",
  },
  lb: {
    subtitle:
      "D'Haaptinformatiounen iwwert d'legal a business Identitéit vu Lux AI Automation, inklusiv Firma, Kontakt an Hosting.",
    summaryTitle: "Kuerz Iwwersiicht",
    relatedTitle: "Verbonnen legal Säiten",
  },
} as const;

export default function LegalPage() {
  const { lang } = useLanguage();
  const ui = legalUiCopy[lang] ?? legalUiCopy.en;

  const s = (k: string) => t<string>(lang as any, `legal.imprint.${k}`);
  const list = (k: string) => {
    const value = t<unknown>(lang as any, `legal.imprint.${k}`);
    return Array.isArray(value) ? (value as string[]) : [];
  };

  const labels = {
    authorization: s("labels.authorization"),
    rcs: s("labels.rcs"),
    vat: s("labels.vat"),
    email: s("labels.email"),
    supportEmail: s("labels.supportEmail"),
    officeHours: s("labels.officeHours"),
    hostingProvider: s("labels.hostingProvider"),
    hostingCountry: s("labels.hostingCountry"),
    hostingRegion: s("labels.hostingRegion"),
  };

  const values = {
    company: s("values.company"),
    representative: s("values.representative"),
    address: s("values.address"),
    email: s("values.email"),
    phone: s("values.phone"),
    authorization: s("values.authorization"),
    authorizationNote: s("values.authorizationNote"),
    rcs: s("values.rcs"),
    vat: s("values.vat"),
    supportEmail: s("values.supportEmail"),
    officeHours: s("values.officeHours"),
    hostingProvider: s("values.hostingProvider"),
    hostingCountry: s("values.hostingCountry"),
    hostingRegion: s("values.hostingRegion"),
  };

  const hasValue = (value: string) => value && value.trim().length > 0;

  return (
    <LegalDocumentLayout
      title={s("title")}
      subtitle={ui.subtitle}
      meta={[s("lastUpdatedDate"), values.company]}
      summaryTitle={ui.summaryTitle}
      summaryBody={s("subtitle")}
      relatedTitle={ui.relatedTitle}
      relatedLinks={[
        {
          href: "/privacy-policy",
          label: s("links.privacy"),
        },
        {
          href: "/cookies",
          label: s("links.cookies"),
        },
        {
          href: "/terms",
          label: s("links.terms"),
        },
      ]}
    >
      <LegalSection id="legal-notice" title={s("legalNoticeTitle")}>
        <p className="text-lg font-semibold">{values.company}</p>
        <p className="font-medium">{values.representative}</p>
        <p>{values.address}</p>
        <p>
          <a
            href={`mailto:${values.email}`}
            className="text-primary-600 hover:underline dark:text-accent-400"
          >
            {values.email}
          </a>
        </p>
        <p>{values.phone}</p>
        <p className="font-medium">{values.authorization}</p>
      </LegalSection>

      <LegalSection id="business-identifiers" title={s("businessIdentifiersTitle")}>
        <Row
          label={labels.authorization}
          value={values.authorization}
          sub={values.authorizationNote}
        />
        {hasValue(values.rcs) ? <Row label={labels.rcs} value={values.rcs} /> : null}
        {hasValue(values.vat) ? <Row label={labels.vat} value={values.vat} /> : null}
      </LegalSection>

      <LegalSection id="contact-support" title={s("contactSupportTitle")}>
        <Row
          label={labels.email}
          value={
            <a
              href={`mailto:${values.email}`}
              className="text-primary-600 hover:underline dark:text-accent-400"
            >
              {values.email}
            </a>
          }
          sub={s("contactPrimaryNote")}
        />
        {hasValue(values.supportEmail) ? (
          <Row
            label={labels.supportEmail}
            value={
              <a
                href={`mailto:${values.supportEmail}`}
                className="text-primary-600 hover:underline dark:text-accent-400"
              >
                {values.supportEmail}
              </a>
            }
          />
        ) : null}
        {hasValue(values.officeHours) ? (
          <Row label={labels.officeHours} value={values.officeHours} />
        ) : null}
      </LegalSection>

      {(hasValue(values.hostingProvider) ||
        hasValue(values.hostingCountry) ||
        hasValue(values.hostingRegion)) && (
        <LegalSection id="hosting" title={s("hostingTitle")}>
          {hasValue(values.hostingProvider) ? (
            <Row label={labels.hostingProvider} value={values.hostingProvider} />
          ) : null}
          {hasValue(values.hostingCountry) ? (
            <Row label={labels.hostingCountry} value={values.hostingCountry} />
          ) : null}
          {hasValue(values.hostingRegion) ? (
            <Row label={labels.hostingRegion} value={values.hostingRegion} />
          ) : null}
        </LegalSection>
      )}

      <LegalSection id="scope" title={s("scopeTitle")}>
        <p>{s("scopeBody")}</p>
        <p className="font-semibold text-slate-950 dark:text-white">
          {s("scopeDisclaimer")}
        </p>
      </LegalSection>

      <LegalSection id="disclaimers" title={s("disclaimersTitle")}>
        <ul className="list-disc pl-6">
          {list("disclaimers").map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection id="intellectual-property" title={s("ipTitle")}>
        <ul className="list-disc pl-6">
          {list("ip").map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
