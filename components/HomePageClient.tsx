"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import AnimatedSection from "@/components/AnimatedSection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useLanguage } from "@/components/LanguageProvider";
import { homepageCopy } from "@/lib/homepage-content";
import type { AppLanguage } from "@/lib/i18n";
import { getLocalizedMarketingSharedContent } from "@/lib/marketing-shared-content";

const PRIMARY_CTA_HREF = "/scheduling?meetingTypeKey=free-audit";
const SECONDARY_CTA_HREF = "/how-it-works";

function SectionIntro({
  eyebrow,
  title,
  body,
  center = true,
}: {
  eyebrow: string;
  title: string;
  body: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="lux-section-eyebrow">{eyebrow}</p>
      <h2 className="lux-display-title">{title}</h2>
      <p className="lux-section-copy">{body}</p>
    </div>
  );
}

function CtaGroup({
  primary,
  secondary,
  centered = false,
  dark = false,
}: {
  primary: string;
  secondary: string;
  centered?: boolean;
  dark?: boolean;
}) {
  return (
    <div
      className={[
        "flex flex-col gap-4 sm:flex-row sm:flex-wrap",
        centered ? "justify-center" : "",
      ].join(" ")}
    >
      <Link
        href={PRIMARY_CTA_HREF}
        className={[
          "inline-flex items-center justify-center rounded-full px-7 py-4 text-base font-semibold transition-all duration-200 hover:-translate-y-1",
          dark
            ? "bg-accent-500 text-slate-950 shadow-lg shadow-accent-500/20 hover:bg-accent-400"
            : "bg-primary-600 text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700",
        ].join(" ")}
      >
        {primary}
        <i className="ri-arrow-right-line ml-2 text-lg" />
      </Link>
      <Link
        href={SECONDARY_CTA_HREF}
        className={[
          "inline-flex items-center justify-center rounded-full border px-7 py-4 text-base font-semibold transition-all duration-200 hover:-translate-y-1",
          dark
            ? "border-white/20 bg-white/5 text-white hover:bg-white/10"
            : "border-slate-300 bg-white/90 text-slate-800 hover:border-primary-500 hover:text-primary-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-accent-400 dark:hover:text-accent-400",
        ].join(" ")}
      >
        {secondary}
        <i className="ri-play-circle-line ml-2 text-lg" />
      </Link>
    </div>
  );
}

export default function HomePageClient({
  initialLang,
}: {
  initialLang: AppLanguage;
}) {
  const { lang } = useLanguage();
  const [resolvedLang, setResolvedLang] = useState<AppLanguage>(initialLang);

  useEffect(() => {
    setResolvedLang(lang);
  }, [lang]);

  const copy = homepageCopy[resolvedLang] ?? homepageCopy.en;
  const { processSteps } = getLocalizedMarketingSharedContent(resolvedLang);

  return (
    <div className="min-h-screen bg-white text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      <Header />

      <main>
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_32%),linear-gradient(135deg,#eff6ff_0%,#ffffff_45%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_28%),linear-gradient(135deg,#020617_0%,#0f172a_42%,#111827_100%)]">
          <div className="absolute inset-0 bg-[url('/images/page-bg.jpg')] bg-cover bg-center opacity-[0.05]" />
          <div className="absolute -top-16 right-0 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-primary-500/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-20 sm:px-6 lg:px-8 lg:pb-32 lg:pt-24">
            <div className="grid items-center gap-16 lg:grid-cols-[1fr_0.98fr]">
              <AnimatedSection direction="left" className="space-y-8">
                <div className="space-y-6">
                  <span className="inline-flex rounded-full border border-primary-500/15 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 shadow-sm dark:border-accent-500/20 dark:bg-slate-900/75 dark:text-accent-400">
                    {copy.hero.eyebrow}
                  </span>

                  <div className="space-y-5">
                    <h1 className="max-w-4xl text-4xl font-black tracking-[-0.05em] text-slate-950 dark:text-white sm:text-5xl lg:text-[4.15rem] lg:leading-[0.92]">
                      {copy.hero.headline}
                    </h1>
                    <p className="max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300 sm:text-xl">
                      {copy.hero.subheadline}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {copy.hero.proofLine.map((item) => (
                    <span
                      key={item}
                      className="inline-flex rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <CtaGroup
                  primary={copy.hero.primary}
                  secondary={copy.hero.secondary}
                />

                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {copy.hero.urgency}
                </p>
              </AnimatedSection>

              <AnimatedSection direction="right">
                <div className="relative">
                  <div className="absolute -inset-6 rounded-[2.5rem] bg-[linear-gradient(135deg,rgba(14,66,126,0.18),rgba(245,158,11,0.12))] blur-2xl" />

                  <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/88 p-4 shadow-[0_40px_90px_-45px_rgba(15,23,42,0.5)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-accent-400">
                            {copy.hero.visualBadge}
                          </p>
                          <h2 className="mt-2 max-w-md text-xl font-bold text-slate-950 dark:text-white">
                            {copy.hero.visualTitle}
                          </h2>
                        </div>
                        <div className="rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-right dark:border-primary-500/20 dark:bg-primary-500/10">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-accent-400">
                            {copy.hero.visualMetricLabel}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                            {copy.hero.visualMetricValue}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
                        <div className="space-y-3">
                          {copy.hero.visualFlow.map((item, index) => (
                            <motion.div
                              key={item}
                              whileHover={{ x: 4 }}
                              className="flex items-start gap-3 rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                            >
                              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                                0{index + 1}
                              </span>
                              <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
                                {item}
                              </p>
                            </motion.div>
                          ))}
                        </div>

                        <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_26px_55px_-38px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950">
                          <Image
                            src="/images/analytics.png"
                            alt={copy.hero.visualAlt}
                            width={1400}
                            height={1080}
                            className="h-full w-full object-cover"
                            priority
                          />
                          <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/50 bg-slate-950/80 px-4 py-3 text-sm text-white shadow-lg backdrop-blur">
                            <div className="flex items-center gap-2 text-accent-400">
                              <i className="ri-sparkling-2-line text-base" />
                              <span className="font-semibold">
                                {copy.hero.visualStatus}
                              </span>
                            </div>
                            <p className="mt-1 text-blue-100">
                              {copy.hero.visualOverlay}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <AnimatedSection className="py-28 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0f172a_0%,#102a43_46%,#0e427e_100%)] px-6 py-10 text-white shadow-[0_38px_90px_-45px_rgba(15,23,42,0.7)] sm:px-10 lg:px-12">
              <SectionIntro
                eyebrow={copy.proof.eyebrow}
                title={copy.proof.title}
                body={copy.proof.body}
                center={false}
              />

              <div className="mt-10 grid gap-5 lg:grid-cols-3">
                {copy.proof.cards.map((item, index) => (
                  <AnimatedSection
                    key={item.title}
                    delay={index * 0.06}
                    direction="up"
                  >
                    <motion.div
                      whileHover={{ y: -6 }}
                      className="h-full rounded-[1.6rem] border border-white/12 bg-white/8 p-6 backdrop-blur"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-accent-400">
                        <i className={`${item.icon} text-2xl`} />
                      </span>
                      <h3 className="mt-5 text-xl font-bold text-white">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-blue-100">
                        {item.body}
                      </p>
                    </motion.div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="bg-slate-50 py-28 dark:bg-slate-900/60 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionIntro
              eyebrow={copy.services.eyebrow}
              title={copy.services.title}
              body={copy.services.body}
            />

            <div className="mt-16 grid gap-6 xl:grid-cols-3">
              {copy.services.items.map((item, index) => (
                <AnimatedSection
                  key={item.title}
                  delay={index * 0.06}
                  direction="up"
                >
                  <motion.div
                    whileHover={{ y: -8 }}
                    className="flex h-full flex-col rounded-[1.8rem] border border-slate-200 bg-white p-7 shadow-[0_28px_65px_-42px_rgba(15,23,42,0.36)] dark:border-slate-800 dark:bg-slate-950"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/20">
                      <i className={`${item.icon} text-2xl`} />
                    </span>

                    <h3 className="mt-6 text-2xl font-bold tracking-[-0.03em]">
                      {item.title}
                    </h3>

                    <p className="mt-4 rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-700 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-accent-400">
                      {item.outcome}
                    </p>

                    <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
                      {item.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3">
                          <i className="ri-check-line mt-1 text-primary-600 dark:text-accent-400" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6 rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/70">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                        {copy.services.exampleLabel}
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                        {item.example}
                      </p>
                    </div>

                    <div className="mt-4 rounded-[1.35rem] border border-accent-200 bg-accent-50/80 px-4 py-4 dark:border-accent-500/20 dark:bg-accent-500/10">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-accent-400">
                        {copy.services.resultLabel}
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-800 dark:text-white">
                        {item.result}
                      </p>
                    </div>

                    <div className="mt-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                        {copy.services.deliverablesLabel}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.deliverables.map((deliverable) => (
                          <span
                            key={deliverable}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                          >
                            {deliverable}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="py-28 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionIntro
              eyebrow={copy.why.eyebrow}
              title={copy.why.title}
              body={copy.why.body}
            />

            <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {copy.why.items.map((item, index) => (
                <AnimatedSection
                  key={item.title}
                  delay={index * 0.05}
                  direction="up"
                >
                  <motion.div
                    whileHover={{ y: -6 }}
                    className="h-full rounded-[1.65rem] border border-slate-200 bg-white p-6 shadow-[0_22px_55px_-38px_rgba(15,23,42,0.26)] dark:border-slate-800 dark:bg-slate-900"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600/10 text-primary-600 dark:bg-accent-500/10 dark:text-accent-400">
                      <i className={`${item.icon} text-2xl`} />
                    </span>
                    <h3 className="mt-5 text-xl font-bold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {item.body}
                    </p>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="bg-[radial-gradient(circle_at_top,rgba(14,66,126,0.08),transparent_48%)] py-28 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionIntro
              eyebrow={copy.deliverables.eyebrow}
              title={copy.deliverables.title}
              body={copy.deliverables.body}
            />

            <div className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              {copy.deliverables.items.map((item, index) => (
                <AnimatedSection
                  key={item.title}
                  delay={index * 0.05}
                  direction="scale"
                >
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="flex h-full flex-col rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_20px_45px_-34px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600/10 text-primary-600 dark:bg-accent-500/10 dark:text-accent-400">
                      <i className={`${item.icon} text-xl`} />
                    </span>
                    <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {item.body}
                    </p>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="py-28 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
              <AnimatedSection direction="left">
                <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900">
                  <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                    <div className="flex items-center justify-between gap-3 pb-4">
                      <span className="inline-flex rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary-600 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-accent-400">
                        {copy.example.tag}
                      </span>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                        {copy.example.imagePill}
                      </span>
                    </div>

                    <div className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <Image
                        src="/images/workflow-automation.png"
                        alt={copy.example.imageAlt}
                        width={1400}
                        height={1080}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection direction="right" className="space-y-7">
                <SectionIntro
                  eyebrow={copy.example.eyebrow}
                  title={copy.example.title}
                  body={copy.example.body}
                  center={false}
                />

                <ul className="grid gap-4 sm:grid-cols-2">
                  {copy.example.bullets.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200"
                    >
                      <i className="ri-check-line mt-0.5 text-primary-600 dark:text-accent-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="rounded-[1.5rem] border border-accent-200 bg-accent-50/80 px-5 py-5 text-sm leading-7 text-slate-700 dark:border-accent-500/20 dark:bg-accent-500/10 dark:text-slate-200">
                  {copy.example.note}
                </div>
              </AnimatedSection>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="bg-slate-950 py-28 text-white dark:bg-[#020617] sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionIntro
              eyebrow={copy.process.eyebrow}
              title={copy.process.title}
              body={copy.process.body}
            />

            <div className="mt-16 grid gap-5 lg:grid-cols-5">
              {processSteps.map((item, index) => (
                <AnimatedSection
                  key={item.step}
                  delay={index * 0.05}
                  direction="up"
                >
                  <motion.div
                    whileHover={{ y: -6 }}
                    className="flex h-full flex-col rounded-[1.65rem] border border-white/10 bg-white/5 p-6 backdrop-blur"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent-500 text-sm font-bold text-slate-950">
                      0{index + 1}
                    </span>
                    <h3 className="mt-5 text-xl font-bold">{item.step}</h3>
                    <p className="mt-3 text-sm leading-7 text-blue-100">
                      {item.description}
                    </p>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>

            <div className="mt-12">
              <CtaGroup
                primary={copy.process.primary}
                secondary={copy.process.secondary}
                centered
                dark
              />
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="pb-28 pt-24 sm:pb-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0e427e_0%,#123f7a_54%,#0f172a_100%)] px-6 py-12 text-white shadow-[0_35px_80px_-40px_rgba(14,66,126,0.7)] sm:px-10 lg:px-14">
              <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">
                    {copy.final.eyebrow}
                  </p>
                  <h2 className="lux-display-title">{copy.final.title}</h2>
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100">
                    {copy.final.body}
                  </p>
                </div>

                <div className="rounded-[1.8rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
                  <p className="text-sm leading-7 text-blue-100">
                    {copy.final.urgency}
                  </p>

                  <div className="mt-8">
                    <CtaGroup
                      primary={copy.final.primary}
                      secondary={copy.final.secondary}
                      dark
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </main>

      <Footer />
    </div>
  );
}
