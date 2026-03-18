"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import AnimatedSection from "@/components/AnimatedSection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useLanguage } from "@/components/LanguageProvider";
import TeamMemberCard from "@/components/TeamMemberCard";
import {
  brand,
  heroContent,
} from "@/lib/marketing-content";
import { getLocalizedMarketingSharedContent } from "@/lib/marketing-shared-content";

const localizedHomeCopy = {
  en: {
    heroEyebrow: heroContent.eyebrow,
    heroHeadline: heroContent.headline,
    heroSubheadline: heroContent.subheadline,
    heroPrimary: heroContent.primaryCta,
    heroSchedule: "Book a Call",
    heroContact: "Contact Us",
    heroSecondary: heroContent.secondaryCta,
    heroAuditHint: "Starts in scheduling with the free audit option.",
    heroScheduleHint: "Best when you already want a live conversation.",
    trustLine: brand.trustLine,
    highlights: heroContent.highlights,
    workflowView: "Workflow View",
    bottlenecksTitle: "Common Business Bottlenecks We Help Solve",
    bottlenecksSubtitle: "Operational friction that holds SME growth back",
    bottlenecksBody:
      "Every section of the site should answer a business question. This one answers whether LuxAI understands the day-to-day operational pain teams are dealing with.",
    solutionsTitle: "AI Automation Solutions for Business Operations",
    solutionsSubtitle: "Core solutions built around business outcomes",
    solutionsBody:
      "Automation is the main identity. Consulting stays visible, but it exists to support better solution design and delivery.",
    solutionsCta: "Explore the solution mix",
    consultingSubtitle: "Strategy is visible, but implementation stays central",
    consultingCovers: "Consulting covers",
    consultingReceive: "Clients receive",
    featuresTitle: "What We Build and Integrate",
    featuresSubtitle: "Feature sets tied directly to operational value",
    useCasesTitle: "Examples of What We Automate",
    useCasesSubtitle: "Use cases that make the offer concrete",
    useCasesBody:
      "Real examples reduce uncertainty. They show what the workflow, automation logic, and outcome can look like inside an SME operating environment.",
    schedulingBridgeEyebrow: "Prefer to talk live first?",
    schedulingBridgeTitle: "Book a call if you already want to discuss timing, fit, or next steps.",
    schedulingBridgeBody:
      "Use scheduling when you want to book the free audit or start a live conversation. Use contact when you prefer to send the workflow context first.",
    schedulingBridgeBullets: [
      "Choose a time that fits your calendar",
      "Start with a live conversation when the need is already clear",
      "Keep the audit form available for broader workflow review",
    ],
    schedulingBridgePrimary: "Open Scheduling",
    schedulingBridgeSecondary: "Use contact instead",
    problemLabel: "Problem",
    outcomeLabel: "Outcome",
    useCasesCta: "See all use cases",
    howTitle: "How We Work",
    howSubtitle: "A delivery flow that lowers buyer uncertainty",
    howCta: "See the full process",
    teamTitle: "The Team Behind LuxAI Automation",
    teamSubtitle: "Authority built through implementation capability",
    teamBody:
      "The site should feel like a business automation partner with consulting expertise, not a generic dev agency. The team section reinforces that.",
    finalEyebrow: "Choose the right next step",
    finalTitle: "Talk to LuxAI in the format that fits your buying stage",
    finalBody:
      "Use the free audit when you want workflow review and scoping. Book a call when you already want to discuss fit, timing, or next steps live.",
    finalBullets: [
      "Free audit for workflow review and scoping",
      "Book a call for fit, timing, and next steps",
      "Move into implementation with a clearer path",
    ],
    finalPrimary: "Get a Free Audit",
    finalSchedule: "Book a Call",
    finalContact: "Contact Us",
    finalSecondary: "Explore solutions",
  },
  fr: {
    heroEyebrow: "Systèmes d’automatisation IA et conseil pour les PME",
    heroHeadline:
      "Automatisez les opérations des PME avec des solutions basées sur l’IA",
    heroSubheadline:
      "Nous concevons, mettons en œuvre et optimisons des solutions qui réduisent le travail manuel, améliorent la communication client et fluidifient les workflows métier.",
    heroPrimary: "Obtenir un audit gratuit",
    heroSchedule: "Réserver un appel",
    heroContact: "Nous contacter",
    heroSecondary: "Voir le fonctionnement",
    heroAuditHint: "Commence dans la planification avec l'option d'audit gratuit.",
    heroScheduleHint: "Idéal si vous voulez déjà échanger en direct.",
    trustLine:
      "Conçu pour les PME et les entreprises en croissance au Luxembourg et en Europe.",
    highlights: [
      "Cartographie des workflows et des opportunités",
      "Systèmes IA, intégrations et mise en œuvre",
      "Optimisation continue pour les équipes en croissance",
    ],
    workflowView: "Vue du workflow",
    bottlenecksTitle: "Les blocages opérationnels que nous aidons à résoudre",
    bottlenecksSubtitle: "Les frictions qui freinent la croissance des PME",
    bottlenecksBody:
      "Chaque section du site doit répondre à une question métier. Celle-ci montre que LuxAI comprend les douleurs opérationnelles du quotidien.",
    solutionsTitle: "Solutions d’automatisation IA pour les opérations métier",
    solutionsSubtitle: "Des solutions cœur construites autour des résultats métier",
    solutionsBody:
      "L’automatisation reste l’identité principale. Le conseil reste visible, mais au service d’une meilleure conception et d’une meilleure delivery.",
    solutionsCta: "Explorer les solutions",
    consultingSubtitle: "La stratégie est visible, mais l’implémentation reste centrale",
    consultingCovers: "Le conseil couvre",
    consultingReceive: "Les clients reçoivent",
    featuresTitle: "Ce que nous construisons et intégrons",
    featuresSubtitle: "Des briques directement reliées à la valeur opérationnelle",
    useCasesTitle: "Exemples de ce que nous automatisons",
    useCasesSubtitle: "Des cas d’usage qui rendent l’offre concrète",
    useCasesBody:
      "Des exemples réels réduisent l’incertitude. Ils montrent à quoi peuvent ressembler le workflow, la logique d’automatisation et le résultat opérationnel.",
    schedulingBridgeEyebrow: "Vous préférez échanger en direct d’abord ?",
    schedulingBridgeTitle: "Réservez un appel si vous voulez parler du timing, du fit ou des prochaines étapes.",
    schedulingBridgeBody:
      "Utilisez la planification si vous voulez reserver l'audit gratuit ou demarrer une conversation en direct. Utilisez le contact si vous preferez envoyer d'abord le contexte du workflow.",
    schedulingBridgeBullets: [
      "Choisir un créneau adapté à votre agenda",
      "Démarrer par une conversation live quand le besoin est déjà clair",
      "Garder le formulaire d’audit pour une revue plus large du workflow",
    ],
    schedulingBridgePrimary: "Ouvrir la planification",
    schedulingBridgeSecondary: "Utiliser le contact",
    problemLabel: "Problème",
    outcomeLabel: "Résultat",
    useCasesCta: "Voir tous les cas d’usage",
    howTitle: "Comment nous travaillons",
    howSubtitle: "Un processus de delivery qui réduit l’incertitude côté acheteur",
    howCta: "Voir le processus complet",
    teamTitle: "L’équipe derrière LuxAI Automation",
    teamSubtitle: "Une autorité construite par la capacité d’implémentation",
    teamBody:
      "Le site doit faire sentir un partenaire d’automatisation métier avec une vraie expertise de conseil, pas une agence générique.",
    finalEyebrow: "Choisissez la bonne prochaine étape",
    finalTitle: "Parlez à LuxAI dans le format qui correspond à votre stade d’achat",
    finalBody:
      "Utilisez l’audit gratuit si vous voulez une revue de workflow et du cadrage. Réservez un appel si vous voulez déjà parler en direct du fit, du timing ou des prochaines étapes.",
    finalBullets: ["Audit gratuit pour revue de workflow et cadrage", "Appel pour parler du fit, du timing et des prochaines étapes", "Avancer vers l’implémentation avec un chemin plus clair"],
    finalPrimary: "Obtenir un audit gratuit",
    finalSchedule: "Réserver un appel",
    finalContact: "Nous contacter",
    finalSecondary: "Explorer les solutions",
  },
  de: {
    heroEyebrow: "KI-Automatisierungssysteme und Beratung für KMU",
    heroHeadline: "Automatisieren Sie Geschäftsabläufe von KMU mit KI",
    heroSubheadline:
      "Wir konzipieren, implementieren und optimieren Lösungen, die manuelle Arbeit reduzieren, die Kundenkommunikation verbessern und Geschäftsworkflows vereinfachen.",
    heroPrimary: "Kostenloses Audit anfordern",
    heroSchedule: "Gespräch buchen",
    heroContact: "Kontakt",
    heroSecondary: "Ablauf ansehen",
    heroAuditHint: "Startet in der Terminplanung mit der kostenlosen Audit-Option.",
    heroScheduleHint: "Am besten, wenn Sie schon live sprechen möchten.",
    trustLine:
      "Entwickelt für KMU und wachsende Unternehmen in Luxemburg und Europa.",
    highlights: [
      "Workflow-Analyse und Chancen-Mapping",
      "KI-Systeme, Integrationen und Umsetzung",
      "Laufende Optimierung für wachsende Teams",
    ],
    workflowView: "Workflow-Ansicht",
    bottlenecksTitle: "Typische Geschäftsengpässe, die wir lösen helfen",
    bottlenecksSubtitle: "Operative Reibung, die das Wachstum von KMU bremst",
    bottlenecksBody:
      "Jeder Abschnitt der Website soll eine Geschäftsfrage beantworten. Dieser Abschnitt zeigt, dass LuxAI die operativen Alltagsschmerzen versteht.",
    solutionsTitle: "KI-Automatisierungslösungen für Geschäftsabläufe",
    solutionsSubtitle: "Kernlösungen mit klarem Bezug zu Geschäftsergebnissen",
    solutionsBody:
      "Automatisierung bleibt die zentrale Identität. Beratung bleibt sichtbar, unterstützt aber bessere Lösungsentwicklung und Delivery.",
    solutionsCta: "Lösungsmix ansehen",
    consultingSubtitle: "Strategie bleibt sichtbar, aber Umsetzung bleibt zentral",
    consultingCovers: "Beratung umfasst",
    consultingReceive: "Kunden erhalten",
    featuresTitle: "Was wir bauen und integrieren",
    featuresSubtitle: "Bausteine mit direktem Bezug zum operativen Nutzen",
    useCasesTitle: "Beispiele dessen, was wir automatisieren",
    useCasesSubtitle: "Use Cases, die das Angebot greifbar machen",
    useCasesBody:
      "Reale Beispiele reduzieren Unsicherheit. Sie zeigen, wie Workflow, Automatisierungslogik und Ergebnis in einer KMU-Umgebung aussehen können.",
    schedulingBridgeEyebrow: "Lieber zuerst live sprechen?",
    schedulingBridgeTitle: "Buchen Sie ein Gespräch, wenn Sie Timing, Fit oder nächste Schritte direkt besprechen möchten.",
    schedulingBridgeBody:
      "Nutzen Sie die Terminplanung, wenn Sie das kostenlose Audit buchen oder direkt live sprechen mochten. Nutzen Sie Kontakt, wenn Sie den Workflow-Kontext lieber zuerst schriftlich senden mochten.",
    schedulingBridgeBullets: [
      "Eine Zeit wählen, die zu Ihrem Kalender passt",
      "Mit einem Live-Gespräch starten, wenn der Bedarf schon klar ist",
      "Das Audit-Formular für eine breitere Workflow-Prüfung offenhalten",
    ],
    schedulingBridgePrimary: "Terminplanung öffnen",
    schedulingBridgeSecondary: "Kontakt stattdessen nutzen",
    problemLabel: "Problem",
    outcomeLabel: "Ergebnis",
    useCasesCta: "Alle Use Cases ansehen",
    howTitle: "So arbeiten wir",
    howSubtitle: "Ein Delivery-Ablauf, der Käuferunsicherheit reduziert",
    howCta: "Gesamten Prozess ansehen",
    teamTitle: "Das Team hinter LuxAI Automation",
    teamSubtitle: "Glaubwürdigkeit durch echte Umsetzungskompetenz",
    teamBody:
      "Die Website soll wie ein Business-Automation-Partner mit Beratungskompetenz wirken, nicht wie eine generische Agentur.",
    finalEyebrow: "Wählen Sie den richtigen nächsten Schritt",
    finalTitle: "Sprechen Sie mit LuxAI in dem Format, das zu Ihrer Kaufphase passt",
    finalBody:
      "Nutzen Sie das kostenlose Audit für Workflow-Review und Scoping. Buchen Sie ein Gespräch, wenn Sie Fit, Timing oder nächste Schritte direkt live besprechen möchten.",
    finalBullets: ["Kostenloses Audit für Workflow-Review und Scoping", "Gespräch für Fit, Timing und nächste Schritte", "Mit klarerem Weg in die Umsetzung gehen"],
    finalPrimary: "Kostenloses Audit anfordern",
    finalSchedule: "Gespräch buchen",
    finalContact: "Kontakt",
    finalSecondary: "Lösungen ansehen",
  },
  lb: {
    heroEyebrow: "KI-Automatiséierungssystemer a Berodung fir PMEen",
    heroHeadline: "Automatiséiert PME-Business-Operatioune mat KI-Léisungen",
    heroSubheadline:
      "Mir designen, bauen an optimiséieren Léisungen, déi manuell Aarbecht reduzéieren, d’Clientekommunikatioun verbesseren an Workflows vereinfachen.",
    heroPrimary: "Gratis Audit ufroen",
    heroSchedule: "En Uruff buchen",
    heroContact: "Kontakt",
    heroSecondary: "Kuckt wéi et geet",
    heroAuditHint: "Start an der Scheduling mat der Gratis-Audit-Optioun.",
    heroScheduleHint: "Ideal wann Dir schonn live schwätze wëllt.",
    trustLine:
      "Opgebaut fir PMEen a wuessend Betriber zu Lëtzebuerg an an Europa.",
    highlights: [
      "Workflow-Analys an Opportunitéits-Mapping",
      "KI-Systemer, Integratiounen an Ëmsetzung",
      "Weider Optimiséierung fir wuessend Ekippen",
    ],
    workflowView: "Workflow-Visioun",
    bottlenecksTitle: "Heefeg Business-Engpäss, déi mir hëllefen ze léisen",
    bottlenecksSubtitle: "Operativ Reiwung, déi de Wuesstem vu PMEen bremst",
    bottlenecksBody:
      "All Sektioun vun der Website soll eng Business-Fro beäntweren. Dës hei weist, datt LuxAI den Alldagsdrock an den operative Schmerz versteet.",
    solutionsTitle: "KI-Automatiséierungsléisunge fir Business-Operatiounen",
    solutionsSubtitle: "Kärléisunge mat direktem Bezuch op Business-Resultater",
    solutionsBody:
      "Automatiséierung bleift déi zentral Identitéit. Berodung bleift siichtbar, mee si ënnerstëtzt besser Design an Delivery.",
    solutionsCta: "Léisungsmix kucken",
    consultingSubtitle: "Strategie bleift siichtbar, mee d’Ëmsetzung bleift zentral",
    consultingCovers: "Berodung ëmfaasst",
    consultingReceive: "Cliente kréien",
    featuresTitle: "Wat mir bauen an integréieren",
    featuresSubtitle: "Feature-Sets, déi direkt un den operative Wäert gebonne sinn",
    useCasesTitle: "Beispiller vun deem wat mir automatiséieren",
    useCasesSubtitle: "Use Cases, déi d’Offer konkret maachen",
    useCasesBody:
      "Reell Beispiller reduzéieren Onsécherheet. Si weisen, wéi Workflow, Automatiséierungslogik an Resultat an engem PME-Ëmfeld kënne ausgesinn.",
    schedulingBridgeEyebrow: "Léifer fir d’éischt live ze schwätzen?",
    schedulingBridgeTitle: "Bucht en Uruff, wann Dir Timing, Fit oder déi nächst Schrëtt direkt wëllt ofklären.",
    schedulingBridgeBody:
      "Benotzt d'Scheduling, wann Dir de Gratis Audit buche wëllt oder direkt live schwätze wëllt. Benotzt de Kontakt, wann Dir léiwer fir d'éischt de Workflow-Kontext schécke wëllt.",
    schedulingBridgeBullets: [
      "Eng Zäit wielen, déi an Äre Kalenner passt",
      "Mat engem Live-Gespréich starten, wann de Besoin scho kloer ass",
      "Den Audit-Formulaire fir eng méi breet Workflow-Review behalen",
    ],
    schedulingBridgePrimary: "Scheduling opmaachen",
    schedulingBridgeSecondary: "Kontakt amplaz benotzen",
    problemLabel: "Problem",
    outcomeLabel: "Resultat",
    useCasesCta: "All Use Cases kucken",
    howTitle: "Wéi mir schaffen",
    howSubtitle: "E Delivery-Flow, deen d’Onsécherheet vum Keefer reduzéiert",
    howCta: "De ganze Prozess kucken",
    teamTitle: "D’Team hannert LuxAI Automation",
    teamSubtitle: "Autoritéit, opgebaut duerch Ëmsetzungskompetenz",
    teamBody:
      "D’Website soll sech wéi e Business-Automatiséierungspartner mat Berodungsexpertise upaken, net wéi eng generesch Agentur.",
    finalEyebrow: "Wielt de richtege nächste Schrëtt",
    finalTitle: "Schwätzt mat LuxAI am Format dat zu Ärer aktueller Phase passt",
    finalBody:
      "Benotzt de gratis Audit fir Workflow-Review a Scoping. Bucht en Uruff, wann Dir Fit, Timing oder déi nächst Schrëtt direkt live wëllt ofklären.",
    finalBullets: ["Gratis Audit fir Workflow-Review a Scoping", "En Uruff fir Fit, Timing an déi nächst Schrëtt", "Mat engem méi kloere Wee an d'Ëmsetzung goen"],
    finalPrimary: "Gratis Audit ufroen",
    finalSchedule: "En Uruff buchen",
    finalContact: "Kontakt",
    finalSecondary: "Léisunge kucken",
  },
} as const;

export default function Home() {
  const { lang } = useLanguage();
  const copy = localizedHomeCopy[lang] ?? localizedHomeCopy.en;
  const businessOutcomeLabel =
    lang === "fr"
      ? "Résultat métier"
      : lang === "de"
        ? "Geschäftsergebnis"
        : lang === "lb"
          ? "Business-Resultat"
          : "Business outcome";
  const {
    painPoints,
    solutionCards,
    consultingSection,
    featureBenefits,
    useCases,
    processSteps,
    teamMembers,
  } = getLocalizedMarketingSharedContent(lang);
  const featuredUseCases = [
    useCases[0],
    useCases[1],
    useCases[4],
    useCases[5],
    useCases[6],
    useCases[7],
  ];

  return (
    <div className="min-h-screen bg-white text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      <Header />

      <main>
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_42%,#f8fafc_100%)] dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_42%,#111827_100%)]">
          <div className="absolute inset-0 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center opacity-[0.09]" />
          <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-accent-500/20 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
            <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
              <AnimatedSection direction="left" className="space-y-8">
                <div className="space-y-5">
                  <h1 className="max-w-3xl text-4xl font-black tracking-[-0.04em] text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
                    {copy.heroHeadline}
                  </h1>
                  <p className="max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300 sm:text-xl">
                    {copy.heroSubheadline}
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/scheduling?meetingTypeKey=free-audit"
                    className="inline-flex items-center justify-center rounded-full bg-primary-600 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-primary-600/20 transition-all duration-200 hover:-translate-y-1 hover:bg-primary-700"
                  >
                    {copy.heroPrimary}
                    <i className="ri-arrow-right-line ml-2 text-lg" />
                  </Link>
                  <Link
                    href="/scheduling"
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/90 px-7 py-4 text-base font-semibold text-slate-800 transition-all duration-200 hover:-translate-y-1 hover:border-primary-500 hover:text-primary-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-accent-400 dark:hover:text-accent-400"
                  >
                    {copy.heroSchedule}
                    <i className="ri-calendar-schedule-line ml-2 text-lg" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-full border border-slate-300/90 bg-transparent px-7 py-4 text-base font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-1 hover:border-primary-500 hover:text-primary-600 dark:border-slate-700 dark:text-slate-100 dark:hover:border-accent-400 dark:hover:text-accent-400"
                  >
                    {copy.heroContact}
                    <i className="ri-mail-line ml-2 text-lg" />
                  </Link>
                </div>

                <div className="grid gap-3 sm:max-w-2xl sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200">
                    <span className="block font-semibold text-slate-950 dark:text-white">
                      {copy.heroPrimary}
                    </span>
                    <span className="mt-1 block text-slate-600 dark:text-slate-300">
                      {copy.heroAuditHint}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200">
                    <span className="block font-semibold text-slate-950 dark:text-white">
                      {copy.heroSchedule}
                    </span>
                    <span className="mt-1 block text-slate-600 dark:text-slate-300">
                      {copy.heroScheduleHint}
                    </span>
                  </div>
                </div>

                <div>
                  <Link
                    href="/how-it-works"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:text-primary-600 dark:text-slate-300 dark:hover:text-accent-400"
                  >
                    <i className="ri-play-circle-line text-lg" />
                    <span>{copy.heroSecondary}</span>
                  </Link>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    {copy.trustLine}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {copy.highlights.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection direction="right">
                <div className="relative">
                  <motion.div
                    className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 p-3 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/70"
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.25 }}
                  >
                    <img
                      src="/images/hero.jpg"
                      alt="Lux AI automation team planning workflow delivery"
                      className="h-full w-full rounded-[1.5rem] object-cover"
                    />
                  </motion.div>

                  <div className="absolute -bottom-8 left-4 right-4 rounded-[1.75rem] border border-white/70 bg-white/92 p-5 shadow-[0_30px_60px_-36px_rgba(15,23,42,0.4)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/92 sm:left-10 sm:right-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-accent-400">
                      {copy.workflowView}
                    </p>
                    <div className="mt-4 flex flex-col gap-3">
                      {heroContent.workflow.map((item, index) => (
                        <div
                          key={item.label}
                          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                        >
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-600/10 text-primary-600 dark:bg-accent-500/10 dark:text-accent-400">
                            <i className={`${item.icon} text-lg`} />
                          </span>
                          <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                            {item.label}
                          </span>
                          {index < heroContent.workflow.length - 1 && (
                            <i className="ri-arrow-down-line text-slate-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <AnimatedSection className="relative z-10 -mt-10 pb-8 sm:-mt-12 sm:pb-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-accent-400">
                  {copy.schedulingBridgeEyebrow}
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl">
                  {copy.schedulingBridgeTitle}
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">
                  {copy.schedulingBridgeBody}
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                <ul className="space-y-4 text-sm leading-7 text-slate-700 dark:text-slate-200">
                  {copy.schedulingBridgeBullets.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <i className="ri-check-line mt-0.5 text-primary-600 dark:text-accent-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/scheduling"
                    className="inline-flex items-center justify-center rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-1 hover:bg-primary-700"
                  >
                    {copy.heroSchedule}
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition-colors duration-200 hover:border-primary-500 hover:text-primary-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-accent-400 dark:hover:text-accent-400"
                  >
                    {copy.schedulingBridgeSecondary}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="lux-display-title">
                {copy.bottlenecksTitle}
              </h2>
              <p className="mx-auto max-w-2xl lux-section-subtitle">
                {copy.bottlenecksSubtitle}
              </p>
              <p className="lux-section-copy">
                {copy.bottlenecksBody}
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {painPoints.map((item, index) => (
                <AnimatedSection
                  key={item.title}
                  delay={index * 0.06}
                  direction="up"
                >
                  <motion.div
                    className="h-full rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_22px_55px_-36px_rgba(15,23,42,0.35)] transition-all duration-200 dark:border-slate-800 dark:bg-slate-900"
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

        <AnimatedSection className="bg-slate-50 py-24 dark:bg-slate-900/60 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="lux-display-title">
                {copy.solutionsTitle}
              </h2>
              <p className="mx-auto max-w-2xl lux-section-subtitle">
                {copy.solutionsSubtitle}
              </p>
              <p className="lux-section-copy">
                {copy.solutionsBody}
              </p>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {solutionCards.map((item, index) => (
                <AnimatedSection
                  key={item.title}
                  delay={index * 0.06}
                  direction="up"
                >
                  <motion.div
                    className="flex h-full flex-col rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_-38px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950"
                    whileHover={{ y: -6 }}
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/20">
                      <i className={`${item.icon} text-2xl`} />
                    </span>
                    <h3 className="mt-5 text-xl font-bold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {item.summary}
                    </p>
                    <p className="mt-4 text-sm font-semibold text-primary-600 dark:text-accent-400">
                      {businessOutcomeLabel}: {item.outcome}
                    </p>
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                      {item.fit}
                    </p>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/services#solutions"
                className="inline-flex items-center justify-center rounded-full border border-primary-600 px-6 py-3 text-sm font-semibold text-primary-600 transition-colors duration-200 hover:bg-primary-600 hover:text-white dark:border-accent-400 dark:text-accent-400 dark:hover:bg-accent-400 dark:hover:text-slate-950"
              >
                {copy.solutionsCta}
              </Link>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="lux-display-title">
                {consultingSection.title}
              </h2>
              <p className="mx-auto max-w-2xl lux-section-subtitle">
                {copy.consultingSubtitle}
              </p>
            </div>

            <div className="mt-14 grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
              <AnimatedSection direction="left">
                <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-[0_26px_65px_-36px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900">
                  <img
                    src="/images/analyze.jpg"
                    alt="Consulting and automation planning session"
                    className="h-full w-full rounded-[1.5rem] object-cover"
                  />
                </div>
              </AnimatedSection>

              <AnimatedSection direction="right" className="space-y-7">
                <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
                  {consultingSection.intro}
                </p>
                <p className="text-base leading-8 text-slate-500 dark:text-slate-400">
                  {consultingSection.detail}
                </p>

                <div className="grid gap-5 md:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        {copy.consultingCovers}
                      </p>
                    <ul className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
                      {consultingSection.offerings.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <i className="ri-check-line mt-0.5 text-primary-600 dark:text-accent-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        {copy.consultingReceive}
                      </p>
                    <ul className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
                      {consultingSection.deliverables.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <i className="ri-arrow-right-line mt-0.5 text-primary-600 dark:text-accent-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <Link
                    href="/services#consulting"
                    className="inline-flex items-center rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-1 hover:bg-primary-700"
                  >
                    {consultingSection.cta}
                  </Link>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="bg-[radial-gradient(circle_at_top,_rgba(14,66,126,0.08),_transparent_48%)] py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="lux-display-title">
                {copy.featuresTitle}
              </h2>
              <p className="mx-auto max-w-2xl lux-section-subtitle">
                {copy.featuresSubtitle}
              </p>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {featureBenefits.map((item, index) => (
                <AnimatedSection
                  key={item.title}
                  delay={index * 0.05}
                  direction="scale"
                >
                  <motion.div
                    className="flex h-full gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_20px_45px_-34px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900"
                    whileHover={{ y: -5 }}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-600/10 text-primary-600 dark:bg-accent-500/10 dark:text-accent-400">
                      <i className={`${item.icon} text-xl`} />
                    </span>
                    <div>
                      <h3 className="text-lg font-bold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {item.benefit}
                      </p>
                    </div>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="lux-display-title">
                {copy.useCasesTitle}
              </h2>
              <p className="mx-auto max-w-2xl lux-section-subtitle">
                {copy.useCasesSubtitle}
              </p>
              <p className="lux-section-copy">
                {copy.useCasesBody}
              </p>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {featuredUseCases.map((item, index) => (
                <AnimatedSection
                  key={item.title}
                  delay={index * 0.05}
                  direction="up"
                >
                  <motion.div
                    className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_24px_55px_-38px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900"
                    whileHover={{ y: -6 }}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-56 w-full object-cover"
                    />
                    <div className="p-6">
                      <h3 className="text-xl font-bold">{item.title}</h3>
                      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        {copy.problemLabel}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {item.problem}
                      </p>
                      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        {copy.outcomeLabel}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-primary-600 dark:text-accent-400">
                        {item.outcome}
                      </p>
                    </div>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/use-cases"
                className="inline-flex items-center rounded-full border border-primary-600 px-6 py-3 text-sm font-semibold text-primary-600 transition-colors duration-200 hover:bg-primary-600 hover:text-white dark:border-accent-400 dark:text-accent-400 dark:hover:bg-accent-400 dark:hover:text-slate-950"
              >
                {copy.useCasesCta}
              </Link>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="bg-slate-50 py-24 dark:bg-slate-900/60 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="lux-display-title">
                {copy.howTitle}
              </h2>
              <p className="mx-auto max-w-2xl lux-section-subtitle">
                {copy.howSubtitle}
              </p>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-5">
              {processSteps.map((item, index) => (
                <AnimatedSection
                  key={item.step}
                  delay={index * 0.05}
                  direction="up"
                >
                  <motion.div
                    className="flex h-full flex-col rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_20px_45px_-36px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-950"
                    whileHover={{ y: -6 }}
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                      0{index + 1}
                    </span>
                    <h3 className="mt-5 text-xl font-bold">{item.step}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {item.description}
                    </p>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/how-it-works"
                className="inline-flex items-center rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-1 hover:bg-primary-700"
              >
                {copy.howCta}
              </Link>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="lux-display-title">
                {copy.teamTitle}
              </h2>
              <p className="mx-auto max-w-2xl lux-section-subtitle">
                {copy.teamSubtitle}
              </p>
              <p className="lux-section-copy">
                {copy.teamBody}
              </p>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {teamMembers.map((member, index) => (
                <AnimatedSection
                  key={member.key}
                  delay={index * 0.07}
                  direction="up"
                >
                  <TeamMemberCard member={member} />
                </AnimatedSection>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="pb-24 sm:pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0e427e_0%,#123f7a_58%,#0f172a_100%)] px-6 py-12 text-white shadow-[0_35px_80px_-40px_rgba(14,66,126,0.7)] sm:px-10 lg:px-14">
              <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">
                    {copy.finalEyebrow}
                  </p>
                  <h2 className="lux-display-title">
                    {copy.finalTitle}
                  </h2>
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100">
                    {copy.finalBody}
                  </p>
                </div>

                <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
                  <ul className="space-y-4 text-sm text-blue-50">
                    {copy.finalBullets.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <i className="ri-check-line mt-0.5 text-accent-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                    <Link
                      href="/scheduling?meetingTypeKey=free-audit"
                      className="inline-flex items-center justify-center rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-all duration-200 hover:-translate-y-1 hover:bg-accent-400"
                    >
                      {copy.finalPrimary}
                    </Link>
                    <Link
                      href="/scheduling"
                      className="inline-flex items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
                    >
                      {copy.finalSchedule}
                    </Link>
                    <Link
                      href="/contact"
                      className="inline-flex items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
                    >
                      {copy.finalContact}
                    </Link>
                  </div>

                  <div className="mt-5">
                    <Link
                      href="/services"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-blue-100 transition-colors duration-200 hover:text-white"
                    >
                      <span>{copy.finalSecondary}</span>
                      <i className="ri-arrow-right-line" />
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
