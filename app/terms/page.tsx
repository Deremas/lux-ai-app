"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/site-copy";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      <div className="mt-3 text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  const { lang } = useLanguage();
  const s = (k: string) => t<string>(lang as any, `legal.terms.sections.${k}`);

  const domain = s("metaDomain");
  const domainHref = domain.startsWith("http") ? domain : `https://${domain}`;
  const pdfHref = `/api/terms.pdf?lang=${encodeURIComponent(lang)}`;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Header />

      <AnimatedSection className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <header className="mb-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                  {t<string>(lang as any, "legal.terms.title")}
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-400">
                  <span>{s("metaDate")}</span>
                  <span>·</span>
                  <span>{s("metaCompany")}</span>
                  <span>·</span>

                  <a
                    href={domainHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full px-3 py-1
                               border border-gray-200 dark:border-slate-700
                               bg-gray-50 dark:bg-slate-800/60
                               text-gray-900 dark:text-white
                               hover:opacity-80 transition"
                    aria-label={`Open ${domain}`}
                  >
                    {domain}
                  </a>
                </div>
              </div>

              <a
                href={pdfHref}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2
                           border border-gray-200 dark:border-slate-700
                           bg-white/80 dark:bg-slate-900/40
                           text-gray-900 dark:text-white font-semibold
                           hover:bg-white dark:hover:bg-slate-900/60 transition"
              >
                {s("downloadPdf")}
              </a>
            </div>
          </header>

          <div className="space-y-6">
            <Section title={s("s1t")}>
              <p>{s("s1b")}</p>
            </Section>

            <Section title={s("s2t")}>
              <p>{s("s2b")}</p>
            </Section>

            <Section title={s("s3t")}>
              <p>{s("s3b")}</p>
            </Section>

            <Section title={s("s4t")}>
              <p>{s("s4b")}</p>
            </Section>

            <Section title={s("s5t")}>
              <p>{s("s5b")}</p>
            </Section>

            <Section title={s("s6t")}>
              <p>{s("s6b")}</p>
            </Section>

            <Section title={s("s7t")}>
              <p>{s("s7b")}</p>
            </Section>

            <Section title={s("s8t")}>
              <p>{s("s8b")}</p>
            </Section>

            <Section title={s("s9t")}>
              <p>{s("s9b")}</p>
            </Section>

            <Section title={s("s10t")}>
              <p>{s("s10b")}</p>
            </Section>

            <Section title={s("s11t")}>
              <p>{s("s11b")}</p>
            </Section>

            {/* Contact box */}
            <section className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Contact
              </h2>

              <div className="mt-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {s("contactLabel")}
                </p>

                <a
                  href="mailto:molla@luxaiautomation.com"
                  className="mt-2 inline-flex items-center gap-2 rounded-lg px-3 py-2 font-semibold
                             text-slate-900 dark:text-white
                             bg-white/80 dark:bg-slate-900/40
                             border border-gray-200 dark:border-slate-700
                             hover:bg-white dark:hover:bg-slate-900/60
                             hover:underline transition"
                >
                  molla@luxaiautomation.com
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({s("emailCta")})
                  </span>
                </a>
              </div>
            </section>

            <div className="pt-6 mt-6 border-t border-gray-200 dark:border-slate-700">
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                {s("end")}
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <Footer />
    </div>
  );
}
