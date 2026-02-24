"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
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
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
        {label}
      </div>
      <div className="text-gray-900 dark:text-gray-100">
        <div className="font-medium">{value}</div>
        {sub ? (
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {sub}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 shadow-sm p-6"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-gray-700 dark:text-gray-300">
        {children}
      </div>
    </section>
  );
}

export default function LegalPage() {
  const { lang } = useLanguage();

  const s = (k: string) => t<string>(lang as any, `legal.imprint.${k}`);
  const list = (k: string) => {
    const value = t<unknown>(lang as any, `legal.imprint.${k}`);
    return Array.isArray(value) ? (value as string[]) : [];
  };

  const labels = {
    company: s("labels.company"),
    representative: s("labels.representative"),
    address: s("labels.address"),
    email: s("labels.email"),
    phone: s("labels.phone"),
    authorization: s("labels.authorization"),
    rcs: s("labels.rcs"),
    vat: s("labels.vat"),
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

  const hasValue = (v: string) => v && v.trim().length > 0;
  const hasHosting =
    hasValue(values.hostingProvider) ||
    hasValue(values.hostingCountry) ||
    hasValue(values.hostingRegion);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Header />

      <AnimatedSection className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <header className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              {s("title")}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              {s("subtitle")}
            </p>
          </header>

          <div className="space-y-6">
            <Section id="legal-notice" title={s("legalNoticeTitle")}>
              <div className="space-y-2 text-gray-900 dark:text-gray-100">
                <p className="text-lg font-semibold">{values.company}</p>
                <p className="font-medium">{values.representative}</p>
                <p>{values.address}</p>
                <p>
                  <a
                    href={`mailto:${values.email}`}
                    className="text-primary-600 dark:text-accent-500 hover:underline"
                  >
                    {values.email}
                  </a>
                </p>
                <p>{values.phone}</p>
                <p className="font-medium">{values.authorization}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {s("lastUpdatedLabel")}: {s("lastUpdatedDate")}
                </p>
              </div>
            </Section>

            <Section
              id="business-identifiers"
              title={s("businessIdentifiersTitle")}
            >
              <Row
                label={labels.authorization}
                value={values.authorization}
                sub={values.authorizationNote}
              />
              {hasValue(values.rcs) && (
                <Row label={labels.rcs} value={values.rcs} />
              )}
              {hasValue(values.vat) && (
                <Row label={labels.vat} value={values.vat} />
              )}
            </Section>

            <Section id="contact-support" title={s("contactSupportTitle")}>
              <Row
                label={labels.email}
                value={
                  <a
                    href={`mailto:${values.email}`}
                    className="text-primary-600 dark:text-accent-500 hover:underline"
                  >
                    {values.email}
                  </a>
                }
                sub={s("contactPrimaryNote")}
              />
              {hasValue(values.supportEmail) && (
                <Row
                  label={labels.supportEmail}
                  value={
                    <a
                      href={`mailto:${values.supportEmail}`}
                      className="text-primary-600 dark:text-accent-500 hover:underline"
                    >
                      {values.supportEmail}
                    </a>
                  }
                />
              )}
              {hasValue(values.officeHours) && (
                <Row label={labels.officeHours} value={values.officeHours} />
              )}
            </Section>

            {hasHosting && (
              <Section id="hosting" title={s("hostingTitle")}>
                {hasValue(values.hostingProvider) && (
                  <Row
                    label={labels.hostingProvider}
                    value={values.hostingProvider}
                  />
                )}
                {hasValue(values.hostingCountry) && (
                  <Row
                    label={labels.hostingCountry}
                    value={values.hostingCountry}
                  />
                )}
                {hasValue(values.hostingRegion) && (
                  <Row
                    label={labels.hostingRegion}
                    value={values.hostingRegion}
                  />
                )}
              </Section>
            )}

            <Section id="scope" title={s("scopeTitle")}>
              <p>{s("scopeBody")}</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {s("scopeDisclaimer")}
              </p>
            </Section>

            <Section id="disclaimers" title={s("disclaimersTitle")}>
              <ul className="list-disc pl-6 space-y-2">
                {list("disclaimers").map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Section>

            <Section id="intellectual-property" title={s("ipTitle")}>
              <ul className="list-disc pl-6 space-y-2">
                {list("ip").map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Section>

            <Section id="privacy-cookies" title={s("privacyTitle")}>
              <p>{s("privacyNote")}</p>
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href="/privacy-policy"
                  className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold
                             border border-gray-200 dark:border-slate-700
                             bg-gray-50 dark:bg-slate-800/60
                             text-gray-900 dark:text-white
                             hover:opacity-80 transition"
                >
                  {s("links.privacy")}
                </a>
                <a
                  href="/cookies"
                  className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold
                             border border-gray-200 dark:border-slate-700
                             bg-gray-50 dark:bg-slate-800/60
                             text-gray-900 dark:text-white
                             hover:opacity-80 transition"
                >
                  {s("links.cookies")}
                </a>
                <a
                  href="/terms"
                  className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold
                             border border-gray-200 dark:border-slate-700
                             bg-gray-50 dark:bg-slate-800/60
                             text-gray-900 dark:text-white
                             hover:opacity-80 transition"
                >
                  {s("links.terms")}
                </a>
              </div>
            </Section>
          </div>
        </div>
      </AnimatedSection>

      <Footer />
    </div>
  );
}
