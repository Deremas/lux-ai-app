"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

import AnimatedSection from "@/components/AnimatedSection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useLanguage } from "@/components/LanguageProvider";
import {
  CtaLinks,
  MARKETING_BRAND,
  MarketingHero,
  SectionHeading,
} from "@/components/marketing/SectionHeading";
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
    heroTitle: "Anwendungsfälle", heroSubtitle: "Konkrete Beispiele dessen, was LuxAI automatisiert", heroBody: "Anwendungsfälle machen abstrakte Serviceaussagen zu realen Geschäftsszenarien. Sie zeigen Problem, Automatisierungsansatz und das operative Ergebnis.", chips: ["Kundenkommunikation und Lead-Routing", "Interne Workflows, Freigaben und Dokumentenbearbeitung", "Systemübergreifende Automatisierung für sauberere Abläufe"], problem: "Problem", solution: "Lösung", outcome: "Ergebnis", idealFit: "Ideal für", tools: "Beteiligte Tools", moreDetails: "Fit und Tools anzeigen", lessDetails: "Zusatzdetail ausblenden", workflowCta: "Über diesen Workflow sprechen", schedulingCta: "Termin-Workflow ansehen", ctaEyebrow: "Nächster Schritt", ctaTitle: "Möchten Sie einen dieser Anwendungsfälle auf Ihr Unternehmen übertragen?", ctaBody: "Starten Sie in der Terminplanung mit dem kostenlosen Audit, wenn Sie bereit zum Buchen sind. Nutzen Sie stattdessen Kontakt, wenn Sie zuerst den Workflow-Kontext senden möchten.", ctaBullets: ["Zuerst den wertvollsten Workflow auswählen", "Sehen, welche Systeme verbunden werden müssen", "Praktische nächste Schritte statt generischer Beratung erhalten"], ctaPrimary: "Kostenloses Audit anfordern", ctaSecondary: "Kontakt stattdessen nutzen",
  },
  lb: {
    heroTitle: "Beispiller", heroSubtitle: "Konkret Beispiller vun deem wat LuxAI automatiséiert", heroBody: "Dës Beispiller maachen abstrakt Service-Sprooch zu reelle Betribs-Szenarien. Si weisen de Problem, d’Automatiséierungs-Approche an dat operationellt Resultat.", chips: ["Clientekommunikatioun a Lead-Routing", "Intern Workflows, Geneemegungen an Dokumenteveraarbechtung", "Automatiséierung iwwer Systemer fir méi propper Operatiounen"], problem: "Problem", solution: "Léisung", outcome: "Resultat", idealFit: "Ideal fir", tools: "Bedeelegt Tools", moreDetails: "Detailer a Tools weisen", lessDetails: "Extra Detail verstoppen", workflowCta: "Iwwer dëse Workflow schwätzen", schedulingCta: "Termin-Workflow kucken", ctaEyebrow: "Nächste Schrëtt", ctaTitle: "Wëllt Dir ee vun dëse Beispiller op Äre Betrib ofstëmmen?", ctaBody: "Start an der Terminplanung mam gratis Audit, wann Dir bereet sidd ze buchen. Benotzt amplaz de Kontakt, wann Dir léiwer fir d'éischt de Workflow-Kontext schécke wëllt.", ctaBullets: ["Als éischt de Workflow mat dem héchste Wäert auswielen", "Kucken, wéi eng Systemer verbonne musse ginn", "Praktesch nächst Schrëtt amplaz generescher Berodung kréien"], ctaPrimary: "Gratis Audit ufroen", ctaSecondary: "Kontakt amplaz benotzen",
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
        <MarketingHero>
          <AnimatedSection direction="fade" className="mx-auto max-w-3xl space-y-5 text-center">
            <SectionHeading
              align="center"
              titleAs="h1"
              eyebrow={MARKETING_BRAND}
              title={copy.heroTitle}
              body={copy.heroSubtitle}
              titleClassName="text-[2.55rem] leading-[0.98] tracking-[-0.045em] sm:text-[3.1rem] lg:text-[3.6rem]"
            />
            <p className="mx-auto max-w-[52ch] text-base font-medium leading-7 text-slate-700 dark:text-slate-200 sm:text-lg sm:leading-8">
              {copy.heroBody}
            </p>
          </AnimatedSection>
        </MarketingHero>

        <section className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-16">
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
                    <div className="grid items-center gap-8 border-t border-slate-200 pt-12 dark:border-slate-800 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
                      <div
                        className={[
                          "overflow-hidden rounded-[1.4rem] border border-slate-300 dark:border-slate-700",
                          index % 2 === 1 ? "lg:order-2" : "",
                        ].join(" ")}
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className="aspect-[16/10] w-full object-cover"
                        />
                      </div>

                      <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                        <h2 className="max-w-2xl text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white sm:text-3xl">
                          {item.title}
                        </h2>

                        <div className="mt-7 space-y-5">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                              {copy.problem}
                            </p>
                            <p className="mt-2 text-base leading-8 text-slate-700 dark:text-slate-200">
                              {item.problem}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                              {copy.solution}
                            </p>
                            <p className="mt-2 text-base leading-8 text-slate-700 dark:text-slate-200">
                              {solutionPreview}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                              {copy.outcome}
                            </p>
                            <p className="mt-2 text-base font-semibold leading-8 text-primary-700 dark:text-accent-400">
                              {item.outcome}
                            </p>
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
                            className="text-sm font-semibold text-slate-700 underline-offset-4 transition hover:underline dark:text-slate-200"
                          >
                            {isExpanded ? copy.lessDetails : copy.moreDetails}
                          </button>

                          <Link
                            href={item.cta}
                            className="inline-flex items-center text-sm font-semibold text-primary-700 transition-colors duration-200 hover:text-primary-600 dark:text-accent-400"
                          >
                            {item.cta === "/scheduling"
                              ? copy.schedulingCta
                              : copy.workflowCta}
                            <i className="ri-arrow-right-line ml-1 text-base" />
                          </Link>
                        </div>

                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 space-y-4 border-t border-slate-200 pt-6 dark:border-slate-800"
                          >
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                {copy.solution}
                              </p>
                              <p className="mt-2 text-base leading-8 text-slate-700 dark:text-slate-200">
                                {item.solution}
                              </p>
                            </div>
                            <div>
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
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </section>

        <section className="pb-24 sm:pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="border-t border-slate-200 pt-14 text-center dark:border-slate-800">
              <SectionHeading
                align="center"
                title={copy.ctaTitle}
                body={copy.ctaBody}
              />
              <CtaLinks
                primaryHref="/scheduling?meetingTypeKey=free-audit"
                primaryLabel={copy.ctaPrimary}
                secondaryHref="/contact"
                secondaryLabel={copy.ctaSecondary}
                centered
                quietSecondary
                className="mt-8 justify-center"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
