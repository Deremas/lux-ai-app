"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import AnimatedSection from "@/components/AnimatedSection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useLanguage } from "@/components/LanguageProvider";
import { getLocalizedMarketingSharedContent } from "@/lib/marketing-shared-content";

const localizedHowItWorksCopy = {
  en: {
    heroTitle: "How It Works", heroSubtitle: "A practical path from assessment to live automation", heroBody: "The process should remove uncertainty: understand the workflow, design the right system, build it cleanly, and keep improving it once it is live.", flowTitle: "Delivery Flow", flowSubtitle: "Assess, design, build, optimize, and maintain", whyTitle: "Why This Works", whySubtitle: "A process designed to reduce delivery risk", deliveryReasons: [{ title: "Workflow-first scoping", description: "We start with the business process, not with a random tool or a generic AI demo.", icon: "ri-route-line" }, { title: "Implementation-ready design", description: "Architecture, tools, and business logic are mapped before the build starts.", icon: "ri-layout-masonry-line" }, { title: "Built around existing systems", description: "We connect CRM, communication channels, internal tools, and data sources instead of forcing a full rebuild.", icon: "ri-plug-2-line" }, { title: "Optimization after launch", description: "Delivery does not stop at go-live. We monitor, refine, and expand where the business case is real.", icon: "ri-line-chart-line" }], faqTitle: "FAQs", faqSubtitle: "Common questions before you start", faqs: [{ question: "What happens in the free automation audit?", answer: "We review the workflow, identify bottlenecks, look at the systems involved, and outline where automation or consulting can create practical value first." }, { question: "Do you only advise, or do you also implement?", answer: "Implementation is central. Consulting is used to sharpen priorities, architecture, and roadmaps so the delivery work is better scoped and more effective." }, { question: "Can we start small before a bigger rollout?", answer: "Yes. Many projects begin with one workflow, one communication flow, or one integration path before expanding into a broader automation program." }], ctaEyebrow: "Next Step", ctaTitle: "Ready to move from workflow friction to implementation?", ctaBody: "Start with the workflow assessment, get practical next steps, and decide what should move into roadmap work or implementation.", ctaPrimary: "Get a Free Audit", ctaSecondary: "Explore solutions",
  },
  fr: {
    heroTitle: "Comment ça marche", heroSubtitle: "Un chemin pratique, de l’évaluation à l’automatisation en production", heroBody: "Le processus doit supprimer l’incertitude : comprendre le workflow, concevoir le bon système, le construire proprement et l’améliorer une fois en ligne.", flowTitle: "Flux de delivery", flowSubtitle: "Évaluer, concevoir, construire, optimiser et maintenir", whyTitle: "Pourquoi cela fonctionne", whySubtitle: "Un processus conçu pour réduire les risques de delivery", deliveryReasons: [{ title: "Cadrage centré sur le workflow", description: "Nous partons du processus métier, pas d’un outil choisi au hasard ni d’une démo IA générique.", icon: "ri-route-line" }, { title: "Conception prête pour l’implémentation", description: "Architecture, outils et logique métier sont cadrés avant le lancement de la build.", icon: "ri-layout-masonry-line" }, { title: "Construit autour des systèmes existants", description: "Nous connectons CRM, canaux de communication, outils internes et données au lieu d’imposer une reconstruction complète.", icon: "ri-plug-2-line" }, { title: "Optimisation après le lancement", description: "La delivery ne s’arrête pas à la mise en production. Nous surveillons, affinons et étendons là où le business case est réel.", icon: "ri-line-chart-line" }], faqTitle: "FAQ", faqSubtitle: "Questions fréquentes avant de commencer", faqs: [{ question: "Que se passe-t-il pendant l’audit gratuit ?", answer: "Nous examinons le workflow, identifions les goulots d’étranglement, regardons les systèmes impliqués et montrons où l’automatisation ou le conseil peuvent créer de la valeur en premier." }, { question: "Faites-vous seulement du conseil ou aussi l’implémentation ?", answer: "L’implémentation est centrale. Le conseil sert à clarifier les priorités, l’architecture et la roadmap pour rendre la delivery plus efficace." }, { question: "Peut-on commencer petit avant un déploiement plus large ?", answer: "Oui. Beaucoup de projets commencent par un workflow, un flux de communication ou une intégration avant d’évoluer vers un programme plus large." }], ctaEyebrow: "Étape suivante", ctaTitle: "Prêt à passer des frictions de workflow à l’implémentation ?", ctaBody: "Commencez par l’évaluation du workflow, obtenez des prochaines étapes concrètes et décidez ce qui doit passer en roadmap ou en implémentation.", ctaPrimary: "Obtenir un audit gratuit", ctaSecondary: "Explorer les solutions",
  },
  de: {
    heroTitle: "So funktioniert es", heroSubtitle: "Ein praktischer Weg von der Analyse zur produktiven Automatisierung", heroBody: "Der Prozess soll Unsicherheit entfernen: Workflow verstehen, das richtige System entwerfen, sauber umsetzen und nach dem Go-live weiter verbessern.", flowTitle: "Delivery-Ablauf", flowSubtitle: "Analysieren, konzipieren, umsetzen, optimieren und betreuen", whyTitle: "Warum das funktioniert", whySubtitle: "Ein Prozess, der Delivery-Risiken gezielt reduziert", deliveryReasons: [{ title: "Scoping vom Workflow aus", description: "Wir starten mit dem Geschäftsprozess, nicht mit einem zufälligen Tool oder einer generischen KI-Demo.", icon: "ri-route-line" }, { title: "Umsetzungsreifes Design", description: "Architektur, Tools und Geschäftslogik werden vor dem Start der Umsetzung sauber abgebildet.", icon: "ri-layout-masonry-line" }, { title: "Rund um bestehende Systeme gebaut", description: "Wir verbinden CRM, Kommunikationskanäle, interne Tools und Datenquellen statt einen kompletten Neuaufbau zu erzwingen.", icon: "ri-plug-2-line" }, { title: "Optimierung nach dem Launch", description: "Delivery endet nicht beim Go-live. Wir überwachen, verfeinern und erweitern dort, wo der Business Case real ist.", icon: "ri-line-chart-line" }], faqTitle: "FAQs", faqSubtitle: "Häufige Fragen vor dem Start", faqs: [{ question: "Was passiert im kostenlosen Automatisierungs-Audit?", answer: "Wir prüfen den Workflow, identifizieren Engpässe, betrachten die beteiligten Systeme und zeigen, wo Automatisierung oder Beratung zuerst praktischen Wert schaffen." }, { question: "Beraten Sie nur oder setzen Sie auch um?", answer: "Die Umsetzung ist zentral. Beratung schärft Prioritäten, Architektur und Roadmaps, damit die Delivery besser eingegrenzt und wirksamer wird." }, { question: "Kann man klein starten, bevor man größer ausrollt?", answer: "Ja. Viele Projekte beginnen mit einem Workflow, einem Kommunikationsfluss oder einer Integration und wachsen dann zu einem breiteren Programm." }], ctaEyebrow: "Nächster Schritt", ctaTitle: "Bereit, von Workflow-Reibung zur Umsetzung zu wechseln?", ctaBody: "Starten Sie mit der Workflow-Analyse, erhalten Sie praktische nächste Schritte und entscheiden Sie, was in Roadmap oder Umsetzung übergehen soll.", ctaPrimary: "Kostenloses Audit anfordern", ctaSecondary: "Lösungen ansehen",
  },
  lb: {
    heroTitle: "Wéi et geet", heroSubtitle: "E praktesche Wee vun der Analys bis zur live Automatiséierung", heroBody: "De Prozess soll Onsécherheet ewechhuelen: de Workflow verstoen, de richtege System entwërfen, propper bauen an no Go-live weider verbesseren.", flowTitle: "Delivery-Flow", flowSubtitle: "Analyséieren, entwërfen, bauen, optimiséieren a betreien", whyTitle: "Firwat dat funktionéiert", whySubtitle: "E Prozess, deen Delivery-Risike gezielt reduzéiert", deliveryReasons: [{ title: "Scoping vum Workflow aus", description: "Mir starte mam Business-Prozess, net mat engem zoufällege Tool oder enger generescher KI-Demo.", icon: "ri-route-line" }, { title: "Ëmsetzungsbereeten Design", description: "Architektur, Tools a Business-Logik ginn propper definéiert, ier d’Build ufänkt.", icon: "ri-layout-masonry-line" }, { title: "Ronderëm bestehend Systemer gebaut", description: "Mir verbannen CRM, Kommunikatiounskanäl, intern Tools an Datequellen amplaz eng komplett Neibau ze forcéieren.", icon: "ri-plug-2-line" }, { title: "Optimiséierung nom Launch", description: "Delivery hält net beim Go-live op. Mir iwwerwaachen, verfeineren a bauen aus, wou de Business Case reell ass.", icon: "ri-line-chart-line" }], faqTitle: "FAQen", faqSubtitle: "Heefeg Froen ier Dir ufänkt", faqs: [{ question: "Wat geschitt beim gratis Automatiséierungs-Audit?", answer: "Mir kucken de Workflow un, erkennen Engpäss, analyséieren déi involvéiert Systemer a weisen, wou Automatiséierung oder Berodung als éischt praktesche Wäert schafe kann." }, { question: "Maacht Dir nëmme Berodung oder och d’Ëmsetzung?", answer: "D’Ëmsetzung ass zentral. Berodung hëlleft Prioritéiten, Architektur a Roadmaps ze schäerfen, sou datt Delivery besser agedeelt an méi effikass gëtt." }, { question: "Kënne mir kleng ufänken, ier mir méi grouss ausrollen?", answer: "Jo. Vill Projeten starten mat engem Workflow, engem Kommunikatiounsflow oder enger Integratioun a wuessen duerno zu engem méi breede Programm." }], ctaEyebrow: "Nächste Schrëtt", ctaTitle: "Bereet vun Workflow-Reiwung op Ëmsetzung ze goen?", ctaBody: "Start mat der Workflow-Analys, kritt praktesch nächst Schrëtt a decidéiert, wat an d’Roadmap oder d’Ëmsetzung soll goen.", ctaPrimary: "Gratis Audit ufroen", ctaSecondary: "Léisunge kucken",
  },
} as const;

export default function HowItWorksPage() {
  const { lang } = useLanguage();
  const copy = localizedHowItWorksCopy[lang] ?? localizedHowItWorksCopy.en;
  const { processSteps } = getLocalizedMarketingSharedContent(lang);

  return (
    <div className="min-h-screen bg-white text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      <Header />

      <main>
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0e427e_0%,#123f7a_58%,#0f172a_100%)] text-white">
          <div className="absolute inset-0 bg-[url('/images/page-bg.jpg')] bg-cover bg-center opacity-15" />
          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 sm:py-28">
            <AnimatedSection className="mx-auto max-w-4xl text-center">
              <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                {copy.heroTitle}
              </h1>
              <p className="mx-auto mt-5 max-w-3xl text-xl font-medium leading-8 tracking-[-0.02em] text-blue-100 sm:text-2xl">
                {copy.heroSubtitle}
              </p>
              <p className="mt-6 text-lg leading-8 text-blue-100">
                {copy.heroBody}
              </p>
            </AnimatedSection>
          </div>
        </section>

        <section className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="mx-auto max-w-3xl text-center">
              <h2 className="lux-display-title">
                {copy.flowTitle}
              </h2>
              <p className="mx-auto max-w-2xl lux-section-subtitle">
                {copy.flowSubtitle}
              </p>
            </AnimatedSection>

            <div className="mt-16 space-y-12">
              {processSteps.map((step, index) => (
                <AnimatedSection
                  key={step.step}
                  delay={index * 0.05}
                  className="grid items-center gap-8 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_55px_-38px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[0.9fr_1.1fr]"
                >
                  <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                    <img
                      src={step.image}
                      alt={step.step}
                      className="h-full w-full rounded-[1.5rem] object-cover"
                    />
                  </div>

                  <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                    <div className="flex items-center gap-4">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                        0{index + 1}
                      </span>
                      <p className="text-2xl font-black">{step.step}</p>
                    </div>

                    <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">
                      {step.description}
                    </p>

                    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                      {step.points.map((point) => (
                        <li
                          key={point}
                          className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                        >
                          <i className="ri-check-line mt-0.5 text-primary-600 dark:text-accent-400" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <AnimatedSection className="bg-slate-50 py-24 dark:bg-slate-900/60 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="mx-auto max-w-3xl text-center">
              <h2 className="lux-display-title">
                {copy.whyTitle}
              </h2>
              <p className="mx-auto max-w-2xl lux-section-subtitle">
                {copy.whySubtitle}
              </p>
            </AnimatedSection>

            <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {copy.deliveryReasons.map((item, index) => (
                <AnimatedSection
                  key={item.title}
                  delay={index * 0.05}
                  direction="scale"
                >
                  <motion.div
                    className="h-full rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_-38px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950"
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

        <AnimatedSection className="py-24 sm:py-28">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="text-center">
              <h2 className="lux-display-title">
                {copy.faqTitle}
              </h2>
              <p className="mx-auto max-w-2xl lux-section-subtitle">
                {copy.faqSubtitle}
              </p>
            </AnimatedSection>

            <FaqAccordion items={copy.faqs} />
          </div>
        </AnimatedSection>

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
                    href="/services"
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

function FaqAccordion({
  items,
}: {
  items: readonly { question: string; answer: string }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mt-14 space-y-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <motion.div
            key={item.question}
            className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            whileHover={{ y: -3 }}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-base font-semibold sm:text-lg">
                {item.question}
              </span>
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                <i
                  className={`ri-arrow-down-s-line text-xl transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </span>
            </button>

            <motion.div
              initial={false}
              animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden px-6"
            >
              <div className="pb-6 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {item.answer}
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
