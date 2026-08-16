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
    <div className="min-h-screen overflow-x-clip bg-white text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      <Header />

      <main className="overflow-x-clip">
        <section className="relative overflow-hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <AnimatedSection
              direction="fade"
              className="mx-auto max-w-3xl space-y-7 text-center"
            >
              <p className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-300">
                Lux AI Consultancy &amp; Automation
              </p>

              <SectionHeading
                align="center"
                titleAs="h1"
                title={copy.hero.headline}
                body={copy.hero.subheadline}
                className="space-y-5"
                titleClassName="text-[2.6rem] leading-[0.98] tracking-[-0.045em] sm:text-[3.35rem] lg:text-[3.9rem]"
                bodyClassName="mx-auto max-w-[52ch] text-base leading-7 text-slate-700 dark:text-slate-200 sm:text-lg sm:leading-8"
              />

              <CtaLinks
                primaryHref={PRIMARY_CTA_HREF}
                primaryLabel={copy.hero.primary}
                secondaryHref={heroSecondaryHref}
                secondaryLabel={copy.hero.secondary}
                centered
                quietSecondary
                className="justify-center"
              />

              <p className="mx-auto max-w-xl text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                {copy.hero.urgency}
              </p>
            </AnimatedSection>
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
                      <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
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

                      <ul className="space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
                        {item.bullets.map((bullet) => (
                          <li key={bullet} className="flex items-start gap-3">
                            <i className="ri-check-line mt-1 text-primary-600 dark:text-accent-400" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-auto rounded-[1.2rem] border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-900/75">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
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
                <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
                  {consultingSection.intro}
                </p>
                <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
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
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
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
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
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
                      <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-600/10 text-primary-600 dark:bg-accent-500/10 dark:text-accent-400">
                          <i className={`${item.icon} text-xl`} />
                        </span>
                        <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">
                          {item.title}
                        </h2>
                      </div>
                      <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
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
                      <div className="flex flex-1 flex-col gap-8">
                        <div className="flex items-center gap-4 sm:flex-col sm:items-start sm:gap-6">
                          <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#ffb41f] text-2xl font-semibold text-slate-950">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <h2 className="text-[1.8rem] font-semibold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-[2rem]">
                            {step.step}
                          </h2>
                        </div>

                        <div className="space-y-3">
                          <p className="text-base leading-9 text-slate-700 dark:text-slate-200">
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
                      <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-600/10 text-primary-600 dark:bg-accent-500/10 dark:text-accent-400">
                          <i className={`${item.icon} text-xl`} />
                        </span>
                        <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">
                          {item.title}
                        </h2>
                      </div>
                      <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
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

            <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
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
                <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
                  {sectionMeta.finalBullets.map((item) => (
                    <li key={item} className="flex items-start justify-center gap-3">
                      <i className="ri-check-line mt-1 text-primary-600 dark:text-accent-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
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
