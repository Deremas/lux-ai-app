"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

import AnimatedSection from "@/components/AnimatedSection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useLanguage } from "@/components/LanguageProvider";
import type { UseCase } from "@/lib/marketing-content";
import { getLocalizedMarketingSharedContent } from "@/lib/marketing-shared-content";

const localizedUseCasesCopy = {
  en: {
    heroTitle: "Use Cases",
    heroSubtitle: "Concrete examples of what LuxAI automates",
    heroBody:
      "Use cases turn abstract service language into real business scenarios. They show the problem, the automation approach, and the operational result a client can expect.",
    chips: [
      "Customer communication and lead routing",
      "Internal workflows, approvals, and document handling",
      "Cross-system automation for cleaner operations",
    ],
    problem: "Problem",
    solution: "Solution",
    outcome: "Outcome",
    idealFit: "Ideal fit",
    tools: "Tools involved",
    moreDetails: "Show fit and tool details",
    lessDetails: "Hide extra detail",
    workflowCta: "Talk about this workflow",
    schedulingCta: "See scheduling workflow",
    ctaEyebrow: "Next Step",
    ctaTitle: "Want to map one of these use cases to your business?",
    ctaBody:
      "Start with a free audit and we will identify the best-fit workflow, system design, and implementation path.",
    ctaBullets: [
      "Choose the highest-value workflow first",
      "See what systems need to connect",
      "Get practical next steps, not generic advice",
    ],
    ctaPrimary: "Get a Free Audit",
    ctaSecondary: "Use contact instead",
  },
  fr: {
    heroTitle: "Cas d’usage", heroSubtitle: "Des exemples concrets de ce que LuxAI automatise", heroBody: "Les cas d’usage transforment un langage de service abstrait en scénarios métier concrets. Ils montrent le problème, l’approche d’automatisation et le résultat opérationnel attendu.", chips: ["Communication client et routage des leads", "Workflows internes, validations et traitement documentaire", "Automatisation inter-systèmes pour des opérations plus propres"], problem: "Problème", solution: "Solution", outcome: "Résultat", idealFit: "Idéal pour", tools: "Outils impliqués", moreDetails: "Voir le fit et les outils", lessDetails: "Masquer le détail", workflowCta: "Parler de ce workflow", schedulingCta: "Voir le workflow de réservation", ctaEyebrow: "Étape suivante", ctaTitle: "Envie de relier l’un de ces cas d’usage à votre entreprise ?", ctaBody: "Commencez dans la planification avec l’audit gratuit si vous êtes prêt à réserver. Utilisez plutôt le contact si vous préférez d’abord envoyer le contexte du workflow.", ctaBullets: ["Choisir d’abord le workflow à plus forte valeur", "Voir quels systèmes doivent être connectés", "Obtenir des prochaines étapes concrètes, pas des conseils génériques"], ctaPrimary: "Obtenir un audit gratuit", ctaSecondary: "Utiliser le contact",
  },
  de: {
    heroTitle: "Anwendungsfälle", heroSubtitle: "Konkrete Beispiele dessen, was LuxAI automatisiert", heroBody: "Anwendungsfälle machen abstrakte Serviceaussagen zu realen Geschäftsszenarien. Sie zeigen Problem, Automatisierungsansatz und das operative Ergebnis.", chips: ["Kundenkommunikation und Lead-Routing", "Interne Workflows, Freigaben und Dokumentenbearbeitung", "Systemübergreifende Automatisierung für sauberere Abläufe"], problem: "Problem", solution: "Lösung", outcome: "Ergebnis", idealFit: "Ideal für", tools: "Beteiligte Tools", moreDetails: "Fit und Tools anzeigen", lessDetails: "Zusatzdetail ausblenden", workflowCta: "Über diesen Workflow sprechen", schedulingCta: "Termin-Workflow ansehen", ctaEyebrow: "Nächster Schritt", ctaTitle: "Möchten Sie einen dieser Use Cases auf Ihr Unternehmen übertragen?", ctaBody: "Starten Sie in der Terminplanung mit dem kostenlosen Audit, wenn Sie bereit zum Buchen sind. Nutzen Sie stattdessen Kontakt, wenn Sie zuerst den Workflow-Kontext senden möchten.", ctaBullets: ["Zuerst den wertvollsten Workflow auswählen", "Sehen, welche Systeme verbunden werden müssen", "Praktische nächste Schritte statt generischer Beratung erhalten"], ctaPrimary: "Kostenloses Audit anfordern", ctaSecondary: "Kontakt stattdessen nutzen",
  },
  lb: {
    heroTitle: "Use Cases", heroSubtitle: "Konkret Beispiller vun deem wat LuxAI automatiséiert", heroBody: "Use Cases maachen abstrakt Service-Sprooch zu reelle Business-Szenarien. Si weisen de Problem, d’Automatiséierungs-Approche an dat operationellt Resultat.", chips: ["Clientekommunikatioun a Lead-Routing", "Intern Workflows, Geneemegungen an Dokumenteveraarbechtung", "Automatiséierung iwwer Systemer fir méi propper Operatiounen"], problem: "Problem", solution: "Léisung", outcome: "Resultat", idealFit: "Ideal fir", tools: "Beteiligte Tools", moreDetails: "Fit an Tools weisen", lessDetails: "Extra Detail verstoppen", workflowCta: "Iwwer dëse Workflow schwätzen", schedulingCta: "Termin-Workflow kucken", ctaEyebrow: "Nächste Schrëtt", ctaTitle: "Wëllt Dir ee vun dëse Use Cases op Äre Betrib ofstëmmen?", ctaBody: "Start an der Scheduling mam gratis Audit, wann Dir bereet sidd ze buchen. Benotzt amplaz de Kontakt, wann Dir léiwer fir d'éischt de Workflow-Kontext schécke wëllt.", ctaBullets: ["Als éischt de Workflow mat dem héchste Wäert auswielen", "Kucken, wéi eng Systemer verbonne musse ginn", "Praktesch nächst Schrëtt amplaz generescher Berodung kréien"], ctaPrimary: "Gratis Audit ufroen", ctaSecondary: "Kontakt amplaz benotzen",
  },
} as const;

function getPreviewSentence(text: string) {
  const trimmed = text.trim();
  const match = trimmed.match(/^(.{1,180}?[.!?])(?:\s|$)/);
  return match?.[1] ?? trimmed;
}

export default function UseCasesPage() {
  const { lang } = useLanguage();
  const [expandedCases, setExpandedCases] = useState<Record<string, boolean>>(
    {}
  );
  const copy = localizedUseCasesCopy[lang] ?? localizedUseCasesCopy.en;
  const useCases = getLocalizedMarketingSharedContent(lang).useCases as UseCase[];

  return (
    <div className="min-h-screen bg-white text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      <Header />

      <main>
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_42%,#f8fafc_100%)] dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_42%,#111827_100%)]">
          <div className="absolute inset-0 bg-[url('/images/page-bg.jpg')] bg-cover bg-center opacity-[0.08]" />
          <div className="relative mx-auto max-w-[90rem] px-4 py-24 sm:px-6 lg:px-8 sm:py-28">
            <AnimatedSection className="mx-auto max-w-4xl text-center">
              <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                {copy.heroTitle}
              </h1>
              <p className="mx-auto mt-5 max-w-3xl text-xl font-medium leading-8 tracking-[-0.02em] text-slate-700 dark:text-slate-200 sm:text-2xl">
                {copy.heroSubtitle}
              </p>
              <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
                {copy.heroBody}
              </p>
            </AnimatedSection>

            <div className="mt-14 flex flex-wrap justify-center gap-4 lg:gap-5 xl:mt-16">
              {copy.chips.map((item, index) => (
                <AnimatedSection
                  key={item}
                  delay={index * 0.06}
                  direction="up"
                >
                  <div className="w-full max-w-xl rounded-[1.75rem] border border-slate-200 bg-white px-6 py-5 text-sm font-semibold leading-7 text-slate-700 shadow-[0_22px_50px_-36px_rgba(15,23,42,0.3)] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 sm:min-w-[250px] sm:px-7 sm:py-6 sm:text-base lg:max-w-[26rem]">
                    {item}
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 sm:py-28">
          <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
            <div className="space-y-10 xl:space-y-14">
              {useCases.map((item, index) => {
                const isExpanded = Boolean(expandedCases[item.title]);
                const solutionPreview =
                  item.teaser ?? getPreviewSentence(item.solution);

                return (
                  <AnimatedSection
                    key={item.title}
                    delay={index * 0.04}
                    direction="up"
                  >
                    <motion.div
                      className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_55px_-38px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900"
                      whileHover={{ y: -6 }}
                    >
                    <div className="grid gap-0 lg:grid-cols-[1fr_1.08fr]">
                      <div
                        className={
                          index % 2 === 0
                            ? "order-1"
                            : "order-1 lg:order-2"
                        }
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full min-h-[320px] w-full object-cover sm:min-h-[380px] lg:min-h-[460px]"
                        />
                      </div>

                      <div
                        className={
                          index % 2 === 0
                            ? "order-2 p-7 sm:p-9 lg:p-10 xl:p-12"
                            : "order-2 p-7 sm:p-9 lg:order-1 lg:p-10 xl:p-12"
                        }
                      >
                        <h2 className="max-w-2xl text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
                          {item.title}
                        </h2>

                        <div className="mt-7 space-y-5">
                          <div className="space-y-5">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                {copy.problem}
                              </p>
                              <p className="mt-2 text-base leading-8 text-slate-600 dark:text-slate-300">
                                {item.problem}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                {copy.solution}
                              </p>
                              <p className="mt-2 text-base leading-8 text-slate-600 dark:text-slate-300">
                                {solutionPreview}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                {copy.outcome}
                              </p>
                              <p className="mt-2 text-base font-semibold leading-8 text-primary-600 dark:text-accent-400">
                                {item.outcome}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 flex flex-wrap items-center gap-5">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedCases((prev) => ({
                                ...prev,
                                [item.title]: !prev[item.title],
                              }))
                            }
                            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:border-primary-300 hover:text-primary-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-accent-400/40 dark:hover:text-accent-400"
                          >
                            {isExpanded ? copy.lessDetails : copy.moreDetails}
                            <i
                              className={`ml-2 text-base ${
                                isExpanded ? "ri-subtract-line" : "ri-add-line"
                              }`}
                            />
                          </button>

                          <Link
                            href={item.cta}
                            className="inline-flex items-center text-base font-semibold text-primary-600 transition-colors duration-200 hover:text-primary-700 dark:text-accent-400"
                          >
                            {item.cta === "/scheduling"
                              ? copy.schedulingCta
                              : copy.workflowCta}
                            <i className="ri-arrow-right-line ml-1 text-base" />
                          </Link>
                        </div>

                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)] xl:items-start"
                          >
                            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-950">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                {copy.solution}
                              </p>
                              <p className="mt-2 text-base leading-8 text-slate-700 dark:text-slate-200">
                                {item.solution}
                              </p>
                            </div>

                            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-950">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                {copy.idealFit}
                              </p>
                              <p className="mt-2 text-base leading-8 text-slate-700 dark:text-slate-200">
                                {item.industries}
                              </p>
                              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                {copy.tools}
                              </p>
                              <p className="mt-2 text-base leading-8 text-slate-700 dark:text-slate-200">
                                {item.tools}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                    </motion.div>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </section>

        <AnimatedSection className="pb-24 sm:pb-28">
          <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-[2.25rem] bg-[linear-gradient(135deg,#0e427e_0%,#123f7a_58%,#0f172a_100%)] px-7 py-12 text-white shadow-[0_35px_80px_-40px_rgba(14,66,126,0.7)] sm:px-10 lg:px-14 xl:px-16 xl:py-16">
              <div className="grid items-center gap-10 xl:grid-cols-[1.25fr_0.75fr] xl:gap-14">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">
                    {copy.ctaEyebrow}
                  </p>
                  <h2 className="lux-display-title">
                    {copy.ctaTitle}
                  </h2>
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100">
                    {copy.ctaBody}
                  </p>
                </div>

                <div className="rounded-[1.9rem] border border-white/15 bg-white/10 p-6 backdrop-blur sm:p-7 xl:justify-self-end xl:w-full xl:max-w-[27rem]">
                  <ul className="space-y-4 text-sm text-blue-50">
                    {copy.ctaBullets.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <i className="ri-check-line mt-0.5 text-accent-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/scheduling?meetingTypeKey=free-audit"
                      className="inline-flex items-center justify-center rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-all duration-200 hover:-translate-y-1 hover:bg-accent-400"
                    >
                      {copy.ctaPrimary}
                    </Link>
                    <Link
                      href="/contact"
                      className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
                    >
                      {copy.ctaSecondary}
                    </Link>
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
