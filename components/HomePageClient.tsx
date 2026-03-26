"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

import AnimatedSection from "@/components/AnimatedSection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import TeamMemberCard from "@/components/TeamMemberCard";
import { CtaLinks, SectionHeading, SurfaceCard } from "@/components/marketing/SectionHeading";
import { useLanguage } from "@/components/LanguageProvider";
import { homepageCopy } from "@/lib/homepage-content";
import type { AppLanguage } from "@/lib/i18n";
import { getLocalizedMarketingSharedContent } from "@/lib/marketing-shared-content";

const PRIMARY_CTA_HREF = "/scheduling?meetingTypeKey=free-audit";
const SECONDARY_CTA_HREF = "/how-it-works";

const homeSectionMeta = {
  en: {
    painPointsTitle: "Common business bottlenecks we help solve",
    painPointsBody:
      "Practical automation starts by identifying where time, clarity, and consistency are lost.",
    consultingTitle: "Consulting that turns automation ideas into action",
    consultingBody:
      "We help businesses identify automation opportunities, design the right systems, and create a practical roadmap for implementation.",
    consultingCovers: "What consulting covers",
    consultingReceive: "What you receive",
    teamTitle: "The team behind LuxAI Automation",
    teamBody:
      "A small delivery team focused on automation systems, integrations, and practical business outcomes.",
    teamLink: "See the full team",
    finalBullets: [
      "Workflow review",
      "Automation opportunities",
      "Recommended next steps",
    ],
  },
  fr: {
    painPointsTitle: "Blocages metier frequents que nous aidons a resoudre",
    painPointsBody:
      "La plupart des projets d'automatisation commencent par un workflow qui cree deja des frictions, des retards ou des reprises manuelles.",
    consultingTitle: "Un conseil qui transforme les idees d'automatisation en actions",
    consultingBody:
      "L'automatisation reste l'offre principale. Le conseil aide a clarifier les priorites, valider le bon systeme et preparer un chemin d'implementation concret.",
    consultingCovers: "Ce que couvre le conseil",
    consultingReceive: "Ce que vous recevez",
    teamTitle: "L'equipe derriere LuxAI Automation",
    teamBody:
      "Une petite equipe de delivery concentree sur les systemes d'automatisation, les integrations et les resultats metier concrets.",
    teamLink: "Voir toute l'equipe",
    finalBullets: [
      "Revue du workflow",
      "Opportunites d'automatisation",
      "Prochaines etapes recommandees",
    ],
  },
  de: {
    painPointsTitle: "Typische Geschaeftsengpaesse, die wir loesen helfen",
    painPointsBody:
      "Die meisten Automatisierungsprojekte beginnen mit einem Workflow, der bereits Reibung, Verzoegerung oder manuelle Nacharbeit erzeugt.",
    consultingTitle: "Beratung, die Automatisierungsideen in Handlung uebersetzt",
    consultingBody:
      "Automatisierung bleibt das Hauptangebot. Beratung hilft dabei, Prioritaeten zu schaerfen, das richtige System zu bestaetigen und einen praktikablen Umsetzungsweg festzulegen.",
    consultingCovers: "Was die Beratung abdeckt",
    consultingReceive: "Was Sie erhalten",
    teamTitle: "Das Team hinter LuxAI Automation",
    teamBody:
      "Ein kleines Delivery-Team mit Fokus auf Automatisierungssysteme, Integrationen und praktische Geschaeftsergebnisse.",
    teamLink: "Gesamtes Team ansehen",
    finalBullets: [
      "Workflow-Review",
      "Automatisierungschancen",
      "Empfohlene naechste Schritte",
    ],
  },
  lb: {
    painPointsTitle: "Heefeg Business-Engpaess, déi mir hëllefen ze léisen",
    painPointsBody:
      "Déi meescht Automatiséierungsprojeten fänken mat engem Workflow un, deen schonn Reiwung, Verspéidung oder manuell Nofolleg verursaacht.",
    consultingTitle: "Berodung, déi Automatiséierungsiddi an Handlung iwwersetzt",
    consultingBody:
      "Automatiséierung bleift d'Haaptoffer. Berodung hëlleft Prioritéiten ze schäerfen, dat richtegt System ze bestätegen an e prakteschen Ëmsetzungswee ze definéieren.",
    consultingCovers: "Wat d'Berodung ofdeckt",
    consultingReceive: "Wat Dir kritt",
    teamTitle: "D'Equipe hannert LuxAI Automation",
    teamBody:
      "Eng kleng Delivery-Equipe mat Fokus op Automatiséierungssystemer, Integratiounen a praktesch Business-Resultater.",
    teamLink: "Ganz Equipe kucken",
    finalBullets: [
      "Workflow-Iwwerpréiwung",
      "Automatiséierungs-Chancen",
      "Recommandéiert nächst Schrëtt",
    ],
  },
} as const;

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
  const sectionMeta = homeSectionMeta[resolvedLang] ?? homeSectionMeta.en;
  const heroSecondaryHref = resolvedLang === "en" ? "/services" : SECONDARY_CTA_HREF;
  const finalSecondaryHref = resolvedLang === "en" ? "/services" : SECONDARY_CTA_HREF;
  const {
    painPoints,
    consultingSection,
    processSteps,
    teamMembers,
    credibilityPoints,
  } = getLocalizedMarketingSharedContent(resolvedLang);

  return (
    <div className="min-h-screen bg-white text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      <Header />

      <main>
        <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_62%,#f8fafc_100%)] dark:bg-[linear-gradient(180deg,#020617_0%,#0b1120_48%,#0f172a_100%)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,66,126,0.06),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.05),transparent_24%)]" />

          <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pb-24">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
              <AnimatedSection direction="left" className="space-y-8">
                <SectionHeading
                  titleAs="h1"
                  title={copy.hero.headline}
                  body={copy.hero.subheadline}
                  className="max-w-[42rem] space-y-5"
                  titleClassName="max-w-[13ch] text-[2.75rem] leading-[0.98] sm:text-[3.35rem] lg:text-[4rem]"
                  bodyClassName="max-w-[60ch] text-base leading-7 sm:text-lg sm:leading-8"
                />

                <div className="flex flex-wrap gap-3">
                  {copy.hero.proofLine.map((item) => (
                    <span key={item} className="lux-pill">
                      {item}
                    </span>
                  ))}
                </div>

                <CtaLinks
                  primaryHref={PRIMARY_CTA_HREF}
                  primaryLabel={copy.hero.primary}
                  secondaryHref={heroSecondaryHref}
                  secondaryLabel={copy.hero.secondary}
                />

                <p className="max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                  {copy.hero.urgency}
                </p>
              </AnimatedSection>

              <AnimatedSection direction="right">
                <div className="overflow-hidden rounded-[1.8rem] border border-slate-200/80 bg-white p-5 shadow-[0_28px_70px_-48px_rgba(15,23,42,0.25)] dark:border-slate-800 dark:bg-slate-950 sm:p-6">
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-wrap gap-3">
                        <span className="lux-pill">{copy.hero.visualBadge}</span>
                        <span className="lux-pill">{copy.hero.visualStatus}</span>
                      </div>

                      <div className="rounded-[1rem] border border-primary-100 bg-primary-50/80 px-4 py-3 dark:border-primary-500/20 dark:bg-primary-500/10">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary-700 dark:text-accent-400">
                          {copy.hero.visualMetricLabel}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                          {copy.hero.visualMetricValue}
                        </p>
                      </div>
                    </div>

                    <div className="max-w-xl space-y-3">
                      <p className="text-xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white sm:text-[1.65rem]">
                        {copy.hero.visualTitle}
                      </p>
                      <p className="text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                        {copy.hero.visualOverlay}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {copy.hero.visualFlow.map((item, index) => (
                        <div
                          key={item}
                          className="rounded-[1.2rem] border border-slate-200/80 bg-slate-50/70 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/70"
                        >
                          <div className="flex items-start gap-3">
                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-600 text-[0.7rem] font-semibold text-white">
                              0{index + 1}
                            </span>
                            <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
                              {item}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="overflow-hidden rounded-[1.45rem] border border-slate-200 bg-slate-50 shadow-[0_24px_50px_-38px_rgba(15,23,42,0.2)] dark:border-slate-800 dark:bg-slate-900">
                      <Image
                        src="/images/analytics.png"
                        alt={copy.hero.visualAlt}
                        width={1400}
                        height={1080}
                        className="aspect-[4/3] w-full object-cover object-top"
                        priority
                      />
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <section className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              align="center"
              title={sectionMeta.painPointsTitle}
              body={sectionMeta.painPointsBody}
            />

            <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {painPoints.map((item, index) => (
                <AnimatedSection
                  key={item.title}
                  delay={index * 0.05}
                  direction="up"
                >
                  <motion.div whileHover={{ y: -4 }}>
                    <SurfaceCard subtle className="gap-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-600/10 text-primary-600 dark:bg-accent-500/10 dark:text-accent-400">
                        <i className={`${item.icon} text-xl`} />
                      </span>
                      <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">
                        {item.title}
                      </h2>
                      <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {item.description}
                      </p>
                    </SurfaceCard>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200/70 bg-slate-50/60 py-24 dark:border-slate-800 dark:bg-slate-900/40 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              align="center"
              title={copy.services.title}
              body={copy.services.body}
            />

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {copy.services.items.map((item, index) => (
                <AnimatedSection
                  key={item.title}
                  delay={index * 0.06}
                  direction="up"
                >
                  <motion.div whileHover={{ y: -4 }}>
                    <SurfaceCard className="gap-5">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600/10 text-primary-600 dark:bg-accent-500/10 dark:text-accent-400">
                        <i className={`${item.icon} text-2xl`} />
                      </span>

                      <div className="space-y-3">
                        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
                          {item.title}
                        </h2>
                        <p className="text-sm font-semibold text-primary-700 dark:text-accent-400">
                          {item.outcome}
                        </p>
                      </div>

                      <ul className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {item.bullets.map((bullet) => (
                          <li key={bullet} className="flex items-start gap-3">
                            <i className="ri-check-line mt-1 text-primary-600 dark:text-accent-400" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-auto rounded-[1.2rem] border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-900/75">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          {copy.services.exampleLabel}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-200">
                          {item.example}
                        </p>
                      </div>
                    </SurfaceCard>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50/80 py-24 dark:bg-slate-900/50 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <AnimatedSection direction="left" className="space-y-6">
                <SectionHeading
                  title={sectionMeta.consultingTitle}
                  body={sectionMeta.consultingBody}
                />
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {consultingSection.intro}
                </p>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {consultingSection.detail}
                </p>
                <Link href="/contact" className="lux-button-secondary w-fit">
                  {consultingSection.cta}
                </Link>
              </AnimatedSection>

              <AnimatedSection direction="right" className="grid gap-5 md:grid-cols-2">
                <SurfaceCard subtle>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {sectionMeta.consultingCovers}
                  </p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {consultingSection.offerings.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <i className="ri-check-line mt-1 text-primary-600 dark:text-accent-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </SurfaceCard>

                <SurfaceCard subtle>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {sectionMeta.consultingReceive}
                  </p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {consultingSection.deliverables.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <i className="ri-arrow-right-line mt-1 text-primary-600 dark:text-accent-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </SurfaceCard>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <section className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              align="center"
              title={copy.deliverables.title}
              body={copy.deliverables.body}
            />

            <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              {copy.deliverables.items.map((item, index) => (
                <AnimatedSection
                  key={item.title}
                  delay={index * 0.05}
                  direction="scale"
                >
                  <motion.div whileHover={{ y: -4 }}>
                    <SurfaceCard subtle className="gap-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-600/10 text-primary-600 dark:bg-accent-500/10 dark:text-accent-400">
                        <i className={`${item.icon} text-xl`} />
                      </span>
                      <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">
                        {item.title}
                      </h2>
                      <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {item.body}
                      </p>
                    </SurfaceCard>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              align="center"
              title={copy.example.title}
              body={copy.example.body}
            />

            <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
              <AnimatedSection direction="left">
                <div className="lux-card overflow-hidden p-4">
                  <div className="overflow-hidden rounded-[1.45rem] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                    <Image
                      src="/images/workflow-automation.png"
                      alt={copy.example.imageAlt}
                      width={1400}
                      height={1080}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection direction="right" className="space-y-7">
                <div className="flex flex-wrap gap-3">
                  <span className="lux-pill">{copy.example.tag}</span>
                  <span className="lux-pill">{copy.example.imagePill}</span>
                </div>

                <ul className="grid gap-4 sm:grid-cols-2">
                  {copy.example.bullets.map((item) => (
                    <li
                      key={item}
                      className="lux-card-soft flex items-start gap-3 px-4 py-4 text-sm text-slate-700 dark:text-slate-200"
                    >
                      <i className="ri-check-line mt-0.5 text-primary-600 dark:text-accent-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="rounded-[1.4rem] border border-primary-100 bg-primary-50/85 px-5 py-4 text-sm leading-7 text-slate-700 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-slate-200">
                  {copy.example.note}
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <section className="bg-slate-50/80 py-24 dark:bg-slate-900/50 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              align="center"
              title={copy.process.title}
              body={copy.process.body}
            />

            <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
              {processSteps.map((step, index) => (
                <AnimatedSection
                  key={step.step}
                  delay={index * 0.06}
                  direction="up"
                >
                  <motion.div whileHover={{ y: -4 }}>
                    <div className="flex h-full flex-col rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.22)] dark:border-slate-800 dark:bg-slate-950">
                      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#ffb41f] text-2xl font-semibold text-slate-950">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div className="mt-10 flex flex-1 flex-col">
                        <div className="space-y-3">
                          <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
                            {step.step}
                          </h2>
                          <p className="text-base leading-9 text-slate-600 dark:text-slate-300">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>

            <CtaLinks
              primaryHref={PRIMARY_CTA_HREF}
              primaryLabel={copy.process.primary}
              secondaryHref={SECONDARY_CTA_HREF}
              secondaryLabel={copy.process.secondary}
              centered
              className="mt-10"
            />
          </div>
        </section>

        <section className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              align="center"
              title={copy.why.title}
              body={copy.why.body}
            />

            <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {copy.why.items.map((item, index) => (
                <AnimatedSection
                  key={item.title}
                  delay={index * 0.05}
                  direction="up"
                >
                  <motion.div whileHover={{ y: -4 }}>
                    <SurfaceCard className="gap-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-600/10 text-primary-600 dark:bg-accent-500/10 dark:text-accent-400">
                        <i className={`${item.icon} text-xl`} />
                      </span>
                      <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">
                        {item.title}
                      </h2>
                      <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {item.body}
                      </p>
                    </SurfaceCard>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50/70 py-24 dark:bg-slate-900/40 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              align="center"
              title={sectionMeta.teamTitle}
              body={sectionMeta.teamBody}
            />

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {credibilityPoints.map((item, index) => (
                <AnimatedSection
                  key={item}
                  delay={index * 0.04}
                  direction="up"
                >
                  <div className="lux-card-soft flex h-full items-start gap-3 px-4 py-4 text-sm leading-7 text-slate-700 dark:text-slate-200">
                    <i className="ri-shield-check-line mt-1 text-primary-600 dark:text-accent-400" />
                    <span>{item}</span>
                  </div>
                </AnimatedSection>
              ))}
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {teamMembers.map((member, index) => (
                <AnimatedSection
                  key={member.key}
                  delay={index * 0.06}
                  direction="up"
                >
                  <TeamMemberCard member={member} />
                </AnimatedSection>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Link href="/about" className="lux-button-secondary">
                {sectionMeta.teamLink}
              </Link>
            </div>
          </div>
        </section>

        <section className="pb-24 sm:pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="lux-card overflow-hidden p-8 sm:p-10 lg:p-12">
              <div className="mx-auto max-w-3xl text-center">
                <SectionHeading
                  align="center"
                  title={copy.final.title}
                  body={copy.final.body}
                />
                <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {sectionMeta.finalBullets.map((item) => (
                    <li key={item} className="flex items-start justify-center gap-3">
                      <i className="ri-check-line mt-1 text-primary-600 dark:text-accent-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-sm leading-7 text-slate-500 dark:text-slate-400">
                  {copy.final.urgency}
                </p>
                <CtaLinks
                  primaryHref={PRIMARY_CTA_HREF}
                  primaryLabel={copy.final.primary}
                  secondaryHref={finalSecondaryHref}
                  secondaryLabel={copy.final.secondary}
                  centered
                  className="mt-8"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
