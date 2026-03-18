"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import AnimatedSection from "@/components/AnimatedSection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useLanguage } from "@/components/LanguageProvider";
import {
} from "@/lib/marketing-content";
import { getLocalizedMarketingSharedContent } from "@/lib/marketing-shared-content";

const localizedServicesCopy = {
  en: {
    heroEyebrow: "Solutions & Consulting",
    heroTitle: "AI automation solutions for SME operations",
    heroBody:
      "AI automation systems and consulting means automation systems first, with consulting used to sharpen priorities, architecture, and implementation plans.",
    heroPrimary: "Get a Free Audit",
    heroSecondary: "See consulting detail",
    businessOutcome: "Business outcome",
    solutionsTitle: "Core Solutions",
    solutionsSubtitle: "What LuxAI builds for businesses",
    solutionsBody:
      "The page should make the deliverables easy to understand: solution type, what it does, what business result it creates, and who it fits.",
    consultingTitle: "Consulting Detail",
    consultingSubtitle: "Consulting that feeds implementation, not vague advisory",
    consultingCovers: "What consulting covers",
    consultingReceive: "What clients receive",
    consultingFormats: "Best engagement formats",
    consultingFormatItems: ["Automation Audit", "AI Strategy Session", "Workflow Review", "Implementation Roadmap"],
    platformsTitle: "Business Systems and Integrations",
    platformsSubtitle: "The surrounding systems that make automation work",
    conversionEyebrow: "Conversion Path",
    conversionTitle: "Start with the audit, then scope, build, and optimize",
    conversionBody:
      "Use scheduling when you are ready to book the free audit. Use contact when you prefer to send workflow context first before the conversation.",
    conversionSteps: ["Free Automation Audit", "Consulting, roadmap, or scoping engagement", "Implementation project", "Monthly optimization retainer"],
    conversionPrimary: "Get a Free Audit",
    conversionSecondary: "Use contact instead",
  },
  fr: {
    heroEyebrow: "Solutions & conseil", heroTitle: "Des solutions d’automatisation IA pour les opérations des PME", heroBody: "Les systèmes d’automatisation IA et le conseil signifient que l’automatisation passe d’abord, et que le conseil sert à préciser les priorités, l’architecture et les plans d’implémentation.", heroPrimary: "Obtenir un audit gratuit", heroSecondary: "Voir le détail du conseil", businessOutcome: "Résultat métier", solutionsTitle: "Solutions cœur", solutionsSubtitle: "Ce que LuxAI construit pour les entreprises", solutionsBody: "La page doit rendre les livrables faciles à comprendre : type de solution, rôle, résultat métier et profil idéal.", consultingTitle: "Détail du conseil", consultingSubtitle: "Un conseil qui nourrit l’implémentation, pas un accompagnement vague", consultingCovers: "Ce que couvre le conseil", consultingReceive: "Ce que les clients reçoivent", consultingFormats: "Formats d’intervention recommandés", consultingFormatItems: ["Audit d’automatisation", "Session de stratégie IA", "Revue de workflow", "Feuille de route d’implémentation"], platformsTitle: "Systèmes métier et intégrations", platformsSubtitle: "Les systèmes environnants qui rendent l’automatisation efficace", conversionEyebrow: "Parcours de conversion", conversionTitle: "Commencer par l’audit, puis cadrer, construire et optimiser", conversionBody: "Utilisez la planification quand vous êtes prêt à réserver l’audit gratuit. Utilisez le contact si vous préférez d’abord envoyer le contexte du workflow avant l’échange.", conversionSteps: ["Audit d’automatisation gratuit", "Mission de conseil, feuille de route ou cadrage", "Projet d’implémentation", "Contrat mensuel d’optimisation"], conversionPrimary: "Obtenir un audit gratuit", conversionSecondary: "Utiliser le contact",
  },
  de: {
    heroEyebrow: "Lösungen & Beratung", heroTitle: "KI-Automatisierungslösungen für die Abläufe von KMU", heroBody: "KI-Automatisierungssysteme und Beratung bedeuten, dass Automatisierung zuerst kommt und Beratung Prioritäten, Architektur und Implementierungspläne schärft.", heroPrimary: "Kostenloses Audit anfordern", heroSecondary: "Beratungsdetails ansehen", businessOutcome: "Geschäftsergebnis", solutionsTitle: "Kernlösungen", solutionsSubtitle: "Was LuxAI für Unternehmen baut", solutionsBody: "Die Seite soll die Leistungen leicht verständlich machen: Lösungstyp, Nutzen, Geschäftsergebnis und Passung.", consultingTitle: "Beratungsdetails", consultingSubtitle: "Beratung, die Umsetzung unterstützt, statt vage zu bleiben", consultingCovers: "Was die Beratung abdeckt", consultingReceive: "Was Kunden erhalten", consultingFormats: "Empfohlene Formate", consultingFormatItems: ["Automatisierungs-Audit", "KI-Strategie-Session", "Workflow-Review", "Implementierungs-Roadmap"], platformsTitle: "Geschäftssysteme und Integrationen", platformsSubtitle: "Die umliegenden Systeme, die Automatisierung möglich machen", conversionEyebrow: "Conversion-Pfad", conversionTitle: "Mit Audit starten, dann scopen, bauen und optimieren", conversionBody: "Nutzen Sie die Terminbuchung, wenn Sie das kostenlose Audit direkt buchen möchten. Nutzen Sie Kontakt, wenn Sie zuerst den Workflow-Kontext schicken möchten.", conversionSteps: ["Kostenloses Automatisierungs-Audit", "Beratung, Roadmap oder Scoping-Mandat", "Implementierungsprojekt", "Monatlicher Optimierungsretainer"], conversionPrimary: "Kostenloses Audit anfordern", conversionSecondary: "Kontakt stattdessen nutzen",
  },
  lb: {
    heroEyebrow: "Léisungen & Berodung", heroTitle: "KI-Automatiséierungsléisunge fir d’Operatioune vu PMEen", heroBody: "KI-Automatiséierungssystemer a Berodung bedeiten, datt Automatiséierung als éischt kënnt, an datt Berodung Prioritéiten, Architektur an Ëmsetzungspläng schäerft.", heroPrimary: "Gratis Audit ufroen", heroSecondary: "Berodungsdetail kucken", businessOutcome: "Business-Resultat", solutionsTitle: "Kärléisungen", solutionsSubtitle: "Wat LuxAI fir Betriber baut", solutionsBody: "D’Säit soll d’Liwwerobjekter einfach verständlech maachen: Léisungstyp, Wierkung, Business-Resultat a Passung.", consultingTitle: "Berodungsdetail", consultingSubtitle: "Berodung, déi d’Ëmsetzung fërdert an net vague bleift", consultingCovers: "Wat d’Berodung ofdeckt", consultingReceive: "Wat Cliente kréien", consultingFormats: "Empfole Formater", consultingFormatItems: ["Automatiséierungs-Audit", "KI-Strategie-Session", "Workflow-Review", "Ëmsetzungs-Roadmap"], platformsTitle: "Business-Systemer an Integratiounen", platformsSubtitle: "D’Ëmfeld-Systemer, déi Automatiséierung méiglech maachen", conversionEyebrow: "Conversion-Path", conversionTitle: "Mat Audit ufänken, da scopen, bauen an optimiséieren", conversionBody: "Benotzt d'Scheduling, wann Dir de gratis Audit direkt buche wëllt. Benotzt de Kontakt, wann Dir léiwer fir d'éischt de Workflow-Kontext schécke wëllt.", conversionSteps: ["Gratis Automatiséierungs-Audit", "Berodung, Roadmap oder Scoping-Mandat", "Ëmsetzungsprojet", "Monatleche Optimiséierungsretainer"], conversionPrimary: "Gratis Audit ufroen", conversionSecondary: "Kontakt amplaz benotzen",
  },
} as const;

export default function ServicesPage() {
  const { lang } = useLanguage();
  const copy = localizedServicesCopy[lang] ?? localizedServicesCopy.en;
  const {
    solutionCards,
    businessFit,
    consultingSection,
    platformCards,
  } = getLocalizedMarketingSharedContent(lang);

  return (
    <div className="min-h-screen bg-white text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      <Header />

      <main>
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0e427e_0%,#123f7a_58%,#0f172a_100%)] text-white">
          <div className="absolute inset-0 bg-[url('/images/page-bg.jpg')] bg-cover bg-center opacity-15" />
          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 sm:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
              <AnimatedSection direction="left" className="space-y-7">
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-blue-100 backdrop-blur">
                  {copy.heroEyebrow}
                </span>
                <div>
                  <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                    {copy.heroTitle}
                  </h1>
                  <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-100">
                    {copy.heroBody}
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/scheduling?meetingTypeKey=free-audit"
                    className="inline-flex items-center justify-center rounded-full bg-accent-500 px-7 py-4 text-base font-semibold text-slate-950 transition-all duration-200 hover:-translate-y-1 hover:bg-accent-400"
                  >
                    {copy.heroPrimary}
                  </Link>
                  <Link
                    href="#consulting"
                    className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-4 text-base font-semibold text-white transition-colors duration-200 hover:bg-white/10"
                  >
                    {copy.heroSecondary}
                  </Link>
                </div>
              </AnimatedSection>

              <AnimatedSection direction="right">
                <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 p-3 backdrop-blur">
                  <img
                    src="/images/deploy.jpg"
                    alt="Automation system deployment planning"
                    className="h-full w-full rounded-[1.5rem] object-cover"
                  />
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <section id="solutions" className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="mx-auto max-w-3xl text-center">
              <h2 className="lux-display-title">
                {copy.solutionsTitle}
              </h2>
              <p className="mx-auto max-w-2xl lux-section-subtitle">
                {copy.solutionsSubtitle}
              </p>
              <p className="lux-section-copy">
                {copy.solutionsBody}
              </p>
            </AnimatedSection>

            <div className="mt-14 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {solutionCards.map((item, index) => (
                <AnimatedSection
                  key={item.title}
                  delay={index * 0.06}
                  direction="up"
                >
                  <motion.div
                    className="flex h-full flex-col rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_-38px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900"
                    whileHover={{ y: -6 }}
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/20">
                      <i className={`${item.icon} text-2xl`} />
                    </span>

                    <h3 className="mt-5 text-xl font-bold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {item.summary}
                    </p>

                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        {copy.businessOutcome}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-primary-600 dark:text-accent-400">
                        {item.outcome}
                      </p>
                    </div>

                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                      {item.fit}
                    </p>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <AnimatedSection className="bg-slate-50 py-24 dark:bg-slate-900/60 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-4">
              {businessFit.map((item, index) => (
                <AnimatedSection
                  key={item}
                  delay={index * 0.05}
                  direction="up"
                >
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_20px_45px_-34px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-sm font-semibold leading-7 text-slate-700 dark:text-slate-200">
                      {item}
                    </p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <section id="consulting" className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-start gap-12 lg:grid-cols-[1.05fr_0.95fr]">
              <AnimatedSection direction="left" className="space-y-6">
                <div>
                  <h2 className="lux-display-title">
                    {copy.consultingTitle}
                  </h2>
                  <p className="max-w-2xl lux-section-subtitle">
                    {copy.consultingSubtitle}
                  </p>
                </div>

                <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
                  {consultingSection.intro}
                </p>
                <p className="text-base leading-8 text-slate-500 dark:text-slate-400">
                  {consultingSection.detail}
                </p>

                <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.3)] dark:border-slate-800 dark:bg-slate-900">
                  <img
                    src="/images/build-process.jpg"
                    alt="Consulting and architecture workshop"
                    className="h-full w-full rounded-[1.5rem] object-cover"
                  />
                </div>
              </AnimatedSection>

              <AnimatedSection direction="right" className="space-y-6">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_-38px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    {copy.consultingCovers}
                  </p>
                  <ul className="mt-5 space-y-3 text-sm text-slate-700 dark:text-slate-200">
                    {consultingSection.offerings.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <i className="ri-check-line mt-0.5 text-primary-600 dark:text-accent-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_-38px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    {copy.consultingReceive}
                  </p>
                  <ul className="mt-5 space-y-3 text-sm text-slate-700 dark:text-slate-200">
                    {consultingSection.deliverables.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <i className="ri-arrow-right-line mt-0.5 text-primary-600 dark:text-accent-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[1.75rem] border border-primary-100 bg-primary-50 p-7 dark:border-accent-500/20 dark:bg-accent-500/10">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-accent-400">
                    {copy.consultingFormats}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {copy.consultingFormatItems.map((item) => (
                      <span key={item} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <AnimatedSection className="bg-[radial-gradient(circle_at_top,_rgba(14,66,126,0.08),_transparent_48%)] py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="lux-display-title">
                {copy.platformsTitle}
              </h2>
              <p className="mx-auto max-w-2xl lux-section-subtitle">
                {copy.platformsSubtitle}
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {platformCards.map((item, index) => (
                <AnimatedSection
                  key={item.title}
                  delay={index * 0.06}
                  direction="scale"
                >
                  <motion.div
                    className="h-full rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_-38px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900"
                    whileHover={{ y: -6 }}
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600/10 text-primary-600 dark:bg-accent-500/10 dark:text-accent-400">
                      <i className={`${item.icon} text-2xl`} />
                    </span>
                    <h3 className="mt-5 text-xl font-bold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {item.description}
                    </p>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="pb-24 sm:pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0e427e_0%,#123f7a_58%,#0f172a_100%)] px-6 py-12 text-white shadow-[0_35px_80px_-40px_rgba(14,66,126,0.7)] sm:px-10 lg:px-14">
              <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">
                    {copy.conversionEyebrow}
                  </p>
                  <h2 className="lux-display-title">
                    {copy.conversionTitle}
                  </h2>
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100">
                    {copy.conversionBody}
                  </p>
                </div>

                <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
                  <ol className="space-y-4 text-sm text-blue-50">
                    {copy.conversionSteps.map((item, index) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-bold">
                          {index + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-8">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Link
                        href="/scheduling?meetingTypeKey=free-audit"
                        className="inline-flex items-center justify-center rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-all duration-200 hover:-translate-y-1 hover:bg-accent-400"
                      >
                        {copy.conversionPrimary}
                      </Link>
                      <Link
                        href="/contact"
                        className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
                      >
                        {copy.conversionSecondary}
                      </Link>
                    </div>
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
