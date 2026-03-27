"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import AnimatedSection from "@/components/AnimatedSection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { CtaLinks, SectionHeading, SurfaceCard } from "@/components/marketing/SectionHeading";
import { useLanguage } from "@/components/LanguageProvider";
import { getLocalizedMarketingSharedContent } from "@/lib/marketing-shared-content";

const localizedHowItWorksCopy = {
  en: {
    heroTitle: "A structured path from workflow audit to live automation",
    heroBody:
      "The process is designed to reduce uncertainty. We define the right workflow, build it with clear controls, test it properly, and keep improving it once it is live.",
    diagramTitle: "Delivery flow",
    diagramBody:
      "Each stage has a clear purpose, a realistic timeframe, and concrete outputs before the next step starts.",
    trustTitle: "How delivery stays trustworthy",
    trustBody:
      "The system should be safe to operate, not just impressive in a demo. That means testing, monitoring, and clear control points for the team.",
    trustItems: [
      {
        title: "Controlled scope",
        body: "We start with one workflow and define the operating logic before expanding into more systems.",
        icon: "ri-focus-2-line",
      },
      {
        title: "Testing before launch",
        body: "Rules, routing, edge cases, and notification flows are checked before the live handover.",
        icon: "ri-shield-check-line",
      },
      {
        title: "Monitoring after launch",
        body: "We review how the workflow behaves in production and refine it based on real usage.",
        icon: "ri-line-chart-line",
      },
      {
        title: "Human control",
        body: "Teams keep visibility, exception paths, and escalation points where review still matters.",
        icon: "ri-user-settings-line",
      },
    ],
    faqTitle: "Common questions before you start",
    faqs: [
      {
        question: "What happens in the free automation audit?",
        answer:
          "We review the workflow, identify bottlenecks, examine the systems involved, and outline the most practical first automation step.",
      },
      {
        question: "Do you only advise, or do you also implement?",
        answer:
          "Implementation is central. Consulting is used to sharpen scope, architecture, and rollout decisions so delivery is clearer and lower risk.",
      },
      {
        question: "Can we start small before a larger rollout?",
        answer:
          "Yes. Many engagements begin with one workflow, one communication flow, or one integration path before expanding further.",
      },
    ],
    ctaTitle: "Start with the workflow that creates the most value first",
    ctaBody:
      "Use the free audit to define the right first workflow, then decide what should move into roadmap work or direct implementation.",
    ctaPrimary: "Get a Free Audit",
    ctaSecondary: "Explore Services",
  },
  fr: {
    heroTitle: "Un chemin structure de l'audit workflow a l'automatisation live",
    heroBody:
      "Le processus est fait pour reduire l'incertitude. Nous cadrons le bon workflow, le construisons avec des controles clairs, le testons proprement et l'ameliorons une fois live.",
    diagramTitle: "Flux de delivery",
    diagramBody:
      "Chaque etape a un role clair, un delai realiste et des sorties concretes avant de passer a la suivante.",
    trustTitle: "Pourquoi la delivery reste fiable",
    trustBody:
      "Le systeme doit etre sur a exploiter, pas seulement impressionnant en demo. Cela demande des tests, du monitoring et des points de controle clairs pour l'equipe.",
    trustItems: [
      {
        title: "Scope controle",
        body: "Nous commencons par un workflow clair et nous definissons la logique operationnelle avant d'etendre le systeme.",
        icon: "ri-focus-2-line",
      },
      {
        title: "Tests avant lancement",
        body: "Les regles, le routage, les cas limites et les notifications sont verifies avant la mise en ligne.",
        icon: "ri-shield-check-line",
      },
      {
        title: "Monitoring apres lancement",
        body: "Nous regardons comment le workflow se comporte en production et l'ajustons selon l'usage reel.",
        icon: "ri-line-chart-line",
      },
      {
        title: "Controle humain",
        body: "L'equipe garde la visibilite, les chemins d'exception et les points d'escalade la ou la revue reste necessaire.",
        icon: "ri-user-settings-line",
      },
    ],
    faqTitle: "Questions frequentes avant de commencer",
    faqs: [
      {
        question: "Que se passe-t-il pendant l'audit gratuit ?",
        answer:
          "Nous analysons le workflow, identifions les blocages, regardons les systemes impliques et indiquons la premiere etape d'automatisation la plus utile.",
      },
      {
        question: "Faites-vous seulement du conseil ou aussi l'implementation ?",
        answer:
          "L'implementation est centrale. Le conseil sert a clarifier le scope, l'architecture et le rollout pour reduire le risque de delivery.",
      },
      {
        question: "Peut-on commencer petit avant un deploiement plus large ?",
        answer:
          "Oui. Beaucoup de missions commencent par un workflow, un flux de communication ou une integration avant de s'etendre.",
      },
    ],
    ctaTitle: "Commencez par le workflow qui cree le plus de valeur",
    ctaBody:
      "Utilisez l'audit gratuit pour definir le bon premier workflow, puis decidez ce qui doit passer en roadmap ou en implementation directe.",
    ctaPrimary: "Obtenir un audit gratuit",
    ctaSecondary: "Explorer les services",
  },
  de: {
    heroTitle: "Ein strukturierter Weg vom Workflow-Audit zur live Automatisierung",
    heroBody:
      "Der Prozess soll Unsicherheit reduzieren. Wir definieren den richtigen Workflow, bauen ihn mit klaren Kontrollen, testen sauber und verbessern das System nach dem Go-live weiter.",
    diagramTitle: "Delivery-Ablauf",
    diagramBody:
      "Jede Phase hat einen klaren Zweck, einen realistischen Zeitrahmen und konkrete Outputs, bevor der naechste Schritt beginnt.",
    trustTitle: "Warum die Delivery verlaesslich bleibt",
    trustBody:
      "Das System soll sicher zu betreiben sein, nicht nur in einer Demo beeindrucken. Dafuer braucht es Tests, Monitoring und klare Kontrollpunkte fuer das Team.",
    trustItems: [
      {
        title: "Kontrollierter Scope",
        body: "Wir starten mit einem klaren Workflow und definieren die operative Logik, bevor weitere Systeme hinzukommen.",
        icon: "ri-focus-2-line",
      },
      {
        title: "Tests vor dem Launch",
        body: "Regeln, Routing, Randfaelle und Benachrichtigungen werden vor der Uebergabe geprueft.",
        icon: "ri-shield-check-line",
      },
      {
        title: "Monitoring nach dem Launch",
        body: "Wir beobachten das Verhalten in Produktion und verfeinern den Workflow auf Basis realer Nutzung.",
        icon: "ri-line-chart-line",
      },
      {
        title: "Menschliche Kontrolle",
        body: "Teams behalten Sichtbarkeit, Ausnahmewege und Eskalationspunkte dort, wo Review weiter wichtig bleibt.",
        icon: "ri-user-settings-line",
      },
    ],
    faqTitle: "Haeufige Fragen vor dem Start",
    faqs: [
      {
        question: "Was passiert im kostenlosen Automatisierungs-Audit?",
        answer:
          "Wir pruefen den Workflow, identifizieren Engpaesse, betrachten die beteiligten Systeme und zeigen den sinnvollsten ersten Automatisierungsschritt.",
      },
      {
        question: "Beraten Sie nur oder setzen Sie auch um?",
        answer:
          "Die Umsetzung ist zentral. Beratung schaerft Scope, Architektur und Rollout-Entscheidungen, damit die Delivery klarer und risikoaermer wird.",
      },
      {
        question: "Kann man klein anfangen, bevor groesser ausgerollt wird?",
        answer:
          "Ja. Viele Engagements starten mit einem Workflow, einem Kommunikationsfluss oder einer Integration und wachsen dann weiter.",
      },
    ],
    ctaTitle: "Starten Sie mit dem Workflow, der zuerst den meisten Wert schafft",
    ctaBody:
      "Nutzen Sie das kostenlose Audit, um den richtigen ersten Workflow zu definieren, und entscheiden Sie dann, was in Roadmap oder direkte Umsetzung uebergehen soll.",
    ctaPrimary: "Kostenloses Audit anfordern",
    ctaSecondary: "Services ansehen",
  },
  lb: {
    heroTitle: "E strukturéierte Wee vum Workflow-Audit bis zur live Automatiséierung",
    heroBody:
      "De Prozess soll Onsécherheet reduzéieren. Mir definéieren de richtege Workflow, bauen en mat kloere Kontrollen, testen en propper a verbesseren de System no Go-live weider.",
    diagramTitle: "Delivery-Flow",
    diagramBody:
      "All Etapp huet en kloert Zil, en realisteschen Zäitkader a konkret Outputs, ier de nächste Schrëtt ufänkt.",
    trustTitle: "Firwat d'Delivery zouverlässeg bleift",
    trustBody:
      "De System soll sécher ze bedreiwe sinn, net just an enger Demo impressionéieren. Dat verlaangt Tester, Monitoring a kloer Kontrollpunkte fir d'Equipe.",
    trustItems: [
      {
        title: "Kontrolléierte Scope",
        body: "Mir starte mat engem kloere Workflow a definéieren d'operativ Logik, ier méi Systemer dobäikommen.",
        icon: "ri-focus-2-line",
      },
      {
        title: "Tester virum Launch",
        body: "Reegelen, Routing, Edge Cases an Notifikatiounen ginn iwwerpréift, ier de System live geet.",
        icon: "ri-shield-check-line",
      },
      {
        title: "Monitoring nom Launch",
        body: "Mir kucken, wéi de Workflow an der Produktioun leeft, a verfeineren en op Basis vun der reeller Notzung.",
        icon: "ri-line-chart-line",
      },
      {
        title: "Mënschlech Kontroll",
        body: "Equippen behalen Visibilitéit, Ausnameweeër an Eskalatiounspunkten, wou Review weider wichteg bleift.",
        icon: "ri-user-settings-line",
      },
    ],
    faqTitle: "Heefeg Froen ier Dir ufänkt",
    faqs: [
      {
        question: "Wat geschitt beim gratis Automatiséierungs-Audit?",
        answer:
          "Mir préiwen de Workflow, identifizéieren Engpäss, kucken déi involvéiert Systemer a weisen de sënnvollsten éischten Automatiséierungsschrëtt.",
      },
      {
        question: "Maacht Dir nëmme Berodung oder och Ëmsetzung?",
        answer:
          "D'Ëmsetzung ass zentral. Berodung schäerft Scope, Architektur a Rollout-Decisiounen, sou datt d'Delivery méi kloer a mat manner Risiko leeft.",
      },
      {
        question: "Kënne mir kleng ufänken, ier mir méi grouss ausrollen?",
        answer:
          "Jo. Vill Engagementer starten mat engem Workflow, engem Kommunikatiounsflow oder enger Integratioun a wuessen duerno.",
      },
    ],
    ctaTitle: "Fänkt mam Workflow un, deen als éischt de gréisste Wäert schaaft",
    ctaBody:
      "Benotzt de gratis Audit, fir de richtegen éischte Workflow ze definéieren, an decidéiert duerno, wat an d'Roadmap oder an déi direkt Ëmsetzung soll goen.",
    ctaPrimary: "Gratis Audit ufroen",
    ctaSecondary: "Servicer kucken",
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
        <section className="bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_58%,#f8fafc_100%)] py-24 dark:bg-[linear-gradient(180deg,#020617_0%,#0b1120_46%,#0f172a_100%)] sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              titleAs="h1"
              align="center"
              title={copy.heroTitle}
              body={copy.heroBody}
              titleClassName="text-[2.6rem] sm:text-[3.2rem] lg:text-[3.8rem]"
            />

            <div className="mt-14 grid gap-4 lg:grid-cols-5">
              {processSteps.map((step, index) => (
                <AnimatedSection
                  key={step.step}
                  delay={index * 0.04}
                  direction="up"
                >
                  <div className="lux-card-soft h-full px-4 py-5 text-center">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
                      0{index + 1}
                    </span>
                    <p className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
                      {step.step}
                    </p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {step.duration}
                    </p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              align="center"
              title={copy.diagramTitle}
              body={copy.diagramBody}
            />

            <div className="mt-14 space-y-6">
              {processSteps.map((step, index) => (
                <AnimatedSection
                  key={step.step}
                  delay={index * 0.04}
                  className="grid items-center gap-6 lg:grid-cols-[0.92fr_1.08fr]"
                >
                  <SurfaceCard
                    className={[
                      "overflow-hidden p-4",
                      index % 2 === 1 ? "lg:order-2" : "",
                    ].join(" ")}
                  >
                    <img
                      src={step.image}
                      alt={step.step}
                      className="w-full rounded-[1.4rem] object-cover"
                    />
                  </SurfaceCard>

                  <SurfaceCard
                    subtle
                    className={index % 2 === 1 ? "lg:order-1" : ""}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
                          0{index + 1}
                        </span>
                        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
                          {step.step}
                        </h2>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                        {step.duration}
                      </span>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {step.description}
                    </p>

                    <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_0.9fr]">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Work in this step
                        </p>
                        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                          {step.points.map((point) => (
                            <li
                              key={point}
                              className="rounded-[1.1rem] border border-slate-200/80 bg-white px-4 py-3 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                            >
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Outputs
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(step.outputs ?? []).map((item) => (
                            <span key={item} className="lux-pill">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </SurfaceCard>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50/80 py-24 dark:bg-slate-900/50 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              align="center"
              title={copy.trustTitle}
              body={copy.trustBody}
            />

            <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {copy.trustItems.map((item, index) => (
                <AnimatedSection
                  key={item.title}
                  delay={index * 0.05}
                  direction="up"
                >
                  <motion.div whileHover={{ y: -4 }}>
                    <SurfaceCard subtle className="gap-4">
                      <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-600/10 text-primary-600 dark:bg-accent-500/10 dark:text-accent-400">
                          <i className={`${item.icon} text-xl`} />
                        </span>
                        <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">
                          {item.title}
                        </h2>
                      </div>
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
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <SectionHeading align="center" title={copy.faqTitle} />
            <FaqAccordion items={copy.faqs} />
          </div>
        </section>

        <section className="pb-24 sm:pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="lux-card p-8 text-center sm:p-10 lg:p-12">
              <SectionHeading
                align="center"
                title={copy.ctaTitle}
                body={copy.ctaBody}
              />
              <CtaLinks
                primaryHref="/scheduling?meetingTypeKey=free-audit"
                primaryLabel={copy.ctaPrimary}
                secondaryHref="/services"
                secondaryLabel={copy.ctaSecondary}
                centered
                className="mt-8"
              />
            </div>
          </div>
        </section>
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
    <div className="mt-12 space-y-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <motion.div
            key={item.question}
            className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_20px_40px_-34px_rgba(15,23,42,0.18)] dark:border-slate-800 dark:bg-slate-950"
            whileHover={{ y: -2 }}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-base font-semibold text-slate-950 dark:text-white sm:text-lg">
                {item.question}
              </span>
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
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
