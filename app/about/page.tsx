"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import AnimatedSection from "@/components/AnimatedSection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useLanguage } from "@/components/LanguageProvider";
import TeamMemberCard from "@/components/TeamMemberCard";
import { brand } from "@/lib/marketing-content";
import { getLocalizedMarketingSharedContent } from "@/lib/marketing-shared-content";

const localizedAboutCopy = {
  en: {
    heroTitle: "About LuxAI",
    heroSubtitle: "A business automation partner with consulting expertise",
    description: brand.description,
    expertiseAreas: ["AI systems", "Workflow automation", "APIs and integrations", "Business operations", "Process optimization", "Consulting and implementation"],
    authorityBlocks: [
      { title: "Why LuxAI exists", description: "To help SMEs adopt AI and automation in a practical way that improves operations instead of adding more software clutter.", icon: "ri-lightbulb-flash-line" },
      { title: "What makes the approach different", description: "Automation is treated as an operating system problem, not just as a chatbot or one-off website feature.", icon: "ri-compasses-2-line" },
      { title: "Where the work happens", description: "Luxembourg-based, working with SMEs and growing businesses across Europe that need cleaner workflows and connected systems.", icon: "ri-map-pin-2-line" },
    ],
    expectationsTitle: "What Clients Can Expect",
    expectationsSubtitle: "Trust built through clarity, structure, and implementation",
    teamTitle: "Team and Authority",
    teamSubtitle: "The people behind LuxAI Automation",
    ctaEyebrow: "Ready to Start?",
    ctaTitle: "Move from interest to a practical automation plan",
    ctaBody: "Book the free audit in scheduling when you are ready to talk live. Use contact instead if you prefer to send the workflow context first.",
    ctaPrimary: "Get a Free Audit",
    ctaSecondary: "Use contact instead",
  },
  fr: {
    heroTitle: "À propos de LuxAI", heroSubtitle: "Un partenaire d’automatisation métier avec une expertise de conseil", description: "LuxAI Automation fournit des systèmes d’automatisation IA et du conseil aux PME et entreprises en croissance qui veulent des opérations plus rapides, des workflows plus propres et une meilleure communication client.", expertiseAreas: ["Systèmes IA", "Automatisation des workflows", "API et intégrations", "Opérations métier", "Optimisation des processus", "Conseil et implémentation"], authorityBlocks: [{ title: "Pourquoi LuxAI existe", description: "Aider les PME à adopter l’IA et l’automatisation de manière pratique pour améliorer les opérations au lieu d’ajouter du désordre logiciel.", icon: "ri-lightbulb-flash-line" }, { title: "Ce qui différencie l’approche", description: "L’automatisation est traitée comme un sujet de système opérationnel, pas seulement comme un chatbot ou une fonctionnalité isolée.", icon: "ri-compasses-2-line" }, { title: "Où le travail se fait", description: "Basé au Luxembourg, avec des PME et entreprises en croissance en Europe qui ont besoin de workflows plus propres et de systèmes connectés.", icon: "ri-map-pin-2-line" }], expectationsTitle: "Ce que les clients peuvent attendre", expectationsSubtitle: "Une confiance construite par la clarté, la structure et l’implémentation", teamTitle: "Équipe et crédibilité", teamSubtitle: "Les personnes derrière LuxAI Automation", ctaEyebrow: "Prêt à démarrer ?", ctaTitle: "Passer de l’intérêt à un plan d’automatisation concret", ctaBody: "Réservez l’audit gratuit dans la planification si vous êtes prêt à parler en direct. Utilisez plutôt le contact si vous préférez d’abord envoyer le contexte du workflow.", ctaPrimary: "Obtenir un audit gratuit", ctaSecondary: "Utiliser le contact",
  },
  de: {
    heroTitle: "Über LuxAI", heroSubtitle: "Ein Business-Automation-Partner mit Beratungskompetenz", description: "LuxAI Automation liefert KI-Automatisierungssysteme und Beratung für KMU und wachsende Unternehmen, die schnellere Abläufe, sauberere Workflows und stärkere Kundenkommunikation wollen.", expertiseAreas: ["KI-Systeme", "Workflow-Automatisierung", "APIs und Integrationen", "Geschäftsabläufe", "Prozessoptimierung", "Beratung und Umsetzung"], authorityBlocks: [{ title: "Warum LuxAI existiert", description: "Damit KMU KI und Automatisierung auf eine praktische Weise einsetzen können, die Abläufe verbessert statt nur neue Software-Komplexität zu schaffen.", icon: "ri-lightbulb-flash-line" }, { title: "Was den Ansatz anders macht", description: "Automatisierung wird als Betriebssystem-Thema verstanden, nicht nur als Chatbot oder isolierte Website-Funktion.", icon: "ri-compasses-2-line" }, { title: "Wo die Arbeit stattfindet", description: "In Luxemburg ansässig und mit KMU sowie wachsenden Unternehmen in Europa tätig, die sauberere Workflows und verbundene Systeme brauchen.", icon: "ri-map-pin-2-line" }], expectationsTitle: "Was Kunden erwarten können", expectationsSubtitle: "Vertrauen durch Klarheit, Struktur und Umsetzung", teamTitle: "Team und Autorität", teamSubtitle: "Die Menschen hinter LuxAI Automation", ctaEyebrow: "Bereit zu starten?", ctaTitle: "Vom Interesse zu einem praktischen Automatisierungsplan", ctaBody: "Buchen Sie das kostenlose Audit in der Terminplanung, wenn Sie bereit fur ein Live-Gesprach sind. Nutzen Sie stattdessen Kontakt, wenn Sie zuerst den Workflow-Kontext senden mochten.", ctaPrimary: "Kostenloses Audit anfordern", ctaSecondary: "Kontakt stattdessen nutzen",
  },
  lb: {
    heroTitle: "Iwwer LuxAI", heroSubtitle: "E Business-Automatiséierungspartner mat Berodungsexpertise", description: "LuxAI Automation liwwert KI-Automatiséierungssystemer a Berodung fir PMEen a wuessend Betriber, déi méi séier Operatiounen, méi propper Workflows a besser Clientekommunikatioun wëllen.", expertiseAreas: ["KI-Systemer", "Workflow-Automatiséierung", "APIs an Integratiounen", "Business-Operatiounen", "Prozessoptimiséierung", "Berodung an Ëmsetzung"], authorityBlocks: [{ title: "Firwat LuxAI gëtt et", description: "Fir PMEen ze hëllefen, KI an Automatiséierung praktesch anzeféieren, sou datt d’Operatioune besser ginn amplaz méi Software-Chaos ze schafen.", icon: "ri-lightbulb-flash-line" }, { title: "Wat den Usaz anescht mécht", description: "Automatiséierung gëtt als Betribssystem-Thema behandelt, net just als Chatbot oder eenzel Website-Funktioun.", icon: "ri-compasses-2-line" }, { title: "Wou mir schaffen", description: "Zu Lëtzebuerg baséiert, a mat PMEen a wuessende Betriber an Europa, déi méi propper Workflows a verbonne Systemer brauchen.", icon: "ri-map-pin-2-line" }], expectationsTitle: "Wat Cliente erwaarde kënnen", expectationsSubtitle: "Vertrauen duerch Kloerheet, Struktur an Ëmsetzung", teamTitle: "Team an Autoritéit", teamSubtitle: "D’Leit hannert LuxAI Automation", ctaEyebrow: "Bereet unzefänken?", ctaTitle: "Vum Interessi zu engem prakteschen Automatiséierungsplang", ctaBody: "Bucht de gratis Audit an der Scheduling, wann Dir bereet sidd live ze schwätzen. Benotzt amplaz de Kontakt, wann Dir léiwer fir d'éischt de Workflow-Kontext schécke wëllt.", ctaPrimary: "Gratis Audit ufroen", ctaSecondary: "Kontakt amplaz benotzen",
  },
} as const;

export default function AboutPage() {
  const { lang } = useLanguage();
  const copy = localizedAboutCopy[lang] ?? localizedAboutCopy.en;
  const { credibilityPoints, teamMembers } = getLocalizedMarketingSharedContent(lang);

  return (
    <div className="min-h-screen bg-white text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      <Header />

      <main>
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_42%,#f8fafc_100%)] dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_42%,#111827_100%)]">
          <div className="absolute inset-0 bg-[url('/images/page-bg.jpg')] bg-cover bg-center opacity-[0.08]" />
          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 sm:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
              <AnimatedSection direction="left" className="space-y-7">
                <div>
                  <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                    {copy.heroTitle}
                  </h1>
                  <p className="mt-5 max-w-3xl text-xl font-medium leading-8 tracking-[-0.02em] text-slate-700 dark:text-slate-200 sm:text-2xl">
                    {copy.heroSubtitle}
                  </p>
                  <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                    {copy.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {copy.expertiseAreas.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </AnimatedSection>

              <AnimatedSection direction="right">
                <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-[0_26px_65px_-36px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900">
                  <img
                    src="/images/about.jpg"
                    alt="Lux AI leadership and automation planning"
                    className="h-full w-full rounded-[1.5rem] object-cover"
                  />
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <section className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-3">
              {copy.authorityBlocks.map((item, index) => (
                <AnimatedSection
                  key={item.title}
                  delay={index * 0.06}
                  direction="up"
                >
                  <motion.div
                    className="h-full rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_-38px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900"
                    whileHover={{ y: -6 }}
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600/10 text-primary-600 dark:bg-accent-500/10 dark:text-accent-400">
                      <i className={`${item.icon} text-2xl`} />
                    </span>
                    <h2 className="mt-5 text-2xl font-bold">{item.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {item.description}
                    </p>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <AnimatedSection className="bg-slate-50 py-24 dark:bg-slate-900/60 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
              <AnimatedSection direction="left">
                <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-[0_26px_65px_-36px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950">
                  <img
                    src="/images/build-process.jpg"
                    alt="Automation architecture and workshop process"
                    className="h-full w-full rounded-[1.5rem] object-cover"
                  />
                </div>
              </AnimatedSection>

              <AnimatedSection direction="right">
                <h2 className="lux-display-title">
                  {copy.expectationsTitle}
                </h2>
                <p className="max-w-2xl lux-section-subtitle">
                  {copy.expectationsSubtitle}
                </p>
                <div className="mt-8 space-y-4">
                  {credibilityPoints.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <i className="ri-check-line mt-0.5 text-primary-600 dark:text-accent-400" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </AnimatedSection>
            </div>
          </div>
        </AnimatedSection>

        <section className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="mx-auto max-w-3xl text-center">
              <h2 className="lux-display-title">
                {copy.teamTitle}
              </h2>
              <p className="mx-auto max-w-2xl lux-section-subtitle">
                {copy.teamSubtitle}
              </p>
            </AnimatedSection>

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
        </section>

        <AnimatedSection className="pb-24 sm:pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0e427e_0%,#123f7a_58%,#0f172a_100%)] px-6 py-12 text-white shadow-[0_35px_80px_-40px_rgba(14,66,126,0.7)] sm:px-10 lg:px-14">
              <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
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

                <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
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
        </AnimatedSection>
      </main>

      <Footer />
    </div>
  );
}
