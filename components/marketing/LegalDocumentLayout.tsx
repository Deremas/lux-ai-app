"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";

type LegalDocumentLayoutProps = {
  title: string;
  subtitle: string;
  meta: string[];
  downloadHref?: string;
  downloadLabel?: string;
  summaryTitle: string;
  summaryBody: string;
  relatedTitle: string;
  relatedLinks: Array<{ href: string; label: string }>;
  children: ReactNode;
};

export function LegalDocumentLayout({
  title,
  subtitle,
  meta,
  downloadHref,
  downloadLabel,
  summaryTitle,
  summaryBody,
  relatedTitle,
  relatedLinks,
  children,
}: LegalDocumentLayoutProps) {
  return (
    <div className="min-h-screen bg-white text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      <Header />

      <main className="py-24 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_30px_70px_-46px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-950 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <h1 className="text-balance text-[2.3rem] font-semibold leading-[1.04] tracking-[-0.04em] text-slate-950 dark:text-white sm:text-[2.9rem]">
                  {title}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600/90 dark:text-slate-300/85 sm:text-lg">
                  {subtitle}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {meta.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900/70"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {downloadHref && downloadLabel ? (
                <Link href={downloadHref} className="lux-button-secondary">
                  {downloadLabel}
                </Link>
              ) : null}
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/85 p-5 dark:border-slate-800 dark:bg-slate-900/70 sm:p-6">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {summaryTitle}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {summaryBody}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {relatedTitle}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {relatedLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:border-primary-300 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-accent-400/40 dark:hover:text-accent-400"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-6">{children}</div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

type LegalSectionProps = {
  title: string;
  children: ReactNode;
  id?: string;
  className?: string;
};

export function LegalSection({
  title,
  children,
  id,
  className,
}: LegalSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-[1.65rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_44px_-36px_rgba(15,23,42,0.22)] dark:border-slate-800 dark:bg-slate-950 sm:p-7",
        className,
      )}
    >
      <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-base leading-8 text-slate-600 dark:text-slate-300">
        {children}
      </div>
    </section>
  );
}
