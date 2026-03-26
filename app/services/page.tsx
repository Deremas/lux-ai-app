"use client";

import { motion } from "framer-motion";

import AnimatedSection from "@/components/AnimatedSection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { CtaLinks, SectionHeading, SurfaceCard } from "@/components/marketing/SectionHeading";
import { useLanguage } from "@/components/LanguageProvider";
import { homepageCopy } from "@/lib/homepage-content";
import { getLocalizedMarketingSharedContent } from "@/lib/marketing-shared-content";

const localizedServicesCopy = {
  en: {
    heroTitle: "AI automation systems for calmer, faster SME operations",
    heroBody:
      "Lux AI builds workflow automation, communication systems, and connected dashboards with consulting used only where it clarifies the implementation path.",
    heroPrimary: "Get a Free Audit",
    heroSecondary: "See How It Works",
    fitTitle: "Best fit",
    fitBody:
      "These projects are usually a good fit when teams are dealing with repeated admin work, disconnected systems, and customer communication that no longer scales cleanly.",
    consultingTitle: "Consulting that leads to real delivery",
    consultingBody:
      "Consulting stays practical. The goal is to define the right workflow, architecture, and scope so the build phase is clear and implementation-ready.",
    consultingCovers: "What it covers",
    consultingReceive: "What you receive",
    consultingFormats: "Typical formats",
    platformsTitle: "Systems we connect around the automation layer",
    platformsBody:
      "Most delivery work sits between several systems. We design that connected operating layer instead of adding another isolated tool.",
    conversionTitle: "Start with one clear workflow, then expand from there",
    conversionBody:
      "The first engagement should clarify the right workflow, the systems involved, and the most useful next step for implementation.",
    conversionSteps: [
      "Free automation audit",
      "Workflow scoping and roadmap",
      "Implementation project",
      "Optimization and support",
    ],
    conversionPrimary: "Get a Free Audit",
    conversionSecondary: "Use contact instead",
  },
  fr: {
    heroTitle: "Des systemes d'automatisation IA pour des operations PME plus fluides",
    heroBody:
      "Lux AI construit des workflows automatises, des systemes de communication et des dashboards connectes, avec du conseil uniquement quand il clarifie le chemin d'implementation.",
    heroPrimary: "Obtenir un audit gratuit",
    heroSecondary: "Voir le fonctionnement",
    fitTitle: "Quand c'est le bon fit",
    fitBody:
      "Ces projets conviennent surtout aux equipes qui gerent encore trop d'admin repetitive, des systemes deconnectes et une communication client qui ne scale plus proprement.",
    consultingTitle: "Un conseil qui mene a une vraie implementation",
    consultingBody:
      "Le conseil reste concret. L'objectif est de cadrer le bon workflow, la bonne architecture et le bon scope pour que la phase de build soit claire et prete a etre livree.",
    consultingCovers: "Ce que cela couvre",
    consultingReceive: "Ce que vous recevez",
    consultingFormats: "Formats frequents",
    platformsTitle: "Les systemes que nous connectons autour de l'automatisation",
    platformsBody:
      "La plupart des projets vivent entre plusieurs systemes. Nous concevons cette couche operationnelle connectee au lieu d'ajouter un outil isole de plus.",
    conversionTitle: "Commencer par un workflow clair, puis etendre",
    conversionBody:
      "La premiere mission doit clarifier le bon workflow, les systemes impliques et le meilleur prochain pas pour l'implementation.",
    conversionSteps: [
      "Audit d'automatisation gratuit",
      "Cadrage du workflow et roadmap",
      "Projet d'implementation",
      "Optimisation et support",
    ],
    conversionPrimary: "Obtenir un audit gratuit",
    conversionSecondary: "Utiliser le contact",
  },
  de: {
    heroTitle: "KI-Automatisierungssysteme fuer ruhigere und schnellere KMU-Ablaufe",
    heroBody:
      "Lux AI baut Workflow-Automatisierung, Kommunikationssysteme und verbundene Dashboards. Beratung wird nur dort eingesetzt, wo sie den Umsetzungsweg klarer macht.",
    heroPrimary: "Kostenloses Audit anfordern",
    heroSecondary: "So funktioniert es",
    fitTitle: "Guter Fit",
    fitBody:
      "Diese Projekte passen meist dann, wenn Teams unter wiederkehrender Admin-Arbeit, getrennten Systemen und Kundenkommunikation leiden, die nicht mehr sauber skaliert.",
    consultingTitle: "Beratung, die in echte Delivery fuehrt",
    consultingBody:
      "Beratung bleibt praktisch. Ziel ist es, Workflow, Architektur und Scope so zu klaeren, dass die Build-Phase sauber vorbereitet ist.",
    consultingCovers: "Was es abdeckt",
    consultingReceive: "Was Sie erhalten",
    consultingFormats: "Typische Formate",
    platformsTitle: "Systeme, die wir rund um die Automatisierung verbinden",
    platformsBody:
      "Die meiste Delivery-Arbeit liegt zwischen mehreren Systemen. Wir gestalten diese verbundene operative Ebene statt ein weiteres isoliertes Tool hinzuzufuegen.",
    conversionTitle: "Mit einem klaren Workflow starten und danach ausbauen",
    conversionBody:
      "Das erste Mandat sollte den richtigen Workflow, die beteiligten Systeme und den sinnvollsten naechsten Schritt fuer die Umsetzung klaeren.",
    conversionSteps: [
      "Kostenloses Automatisierungs-Audit",
      "Workflow-Scoping und Roadmap",
      "Implementierungsprojekt",
      "Optimierung und Support",
    ],
    conversionPrimary: "Kostenloses Audit anfordern",
    conversionSecondary: "Kontakt nutzen",
  },
  lb: {
    heroTitle: "KI-Automatiséierungssystemer fir méi roueg a méi séier PME-Operatiounen",
    heroBody:
      "Lux AI baut Workflow-Automatiséierung, Kommunikatiounssystemer a verbonnen Dashboards. Berodung kënnt just do dobäi, wou si den Ëmsetzungswee méi kloer mécht.",
    heroPrimary: "Gratis Audit ufroen",
    heroSecondary: "Kuckt wéi et geet",
    fitTitle: "Gudde Fit",
    fitBody:
      "Dës Projeten passen meeschtens, wann Equippen nach ëmmer vill repetitiv Admin-Aarbecht, net verbonnen Systemer a Clientekommunikatioun hunn, déi net méi propper skaliert.",
    consultingTitle: "Berodung, déi an eng richteg Delivery féiert",
    consultingBody:
      "Berodung bleift praktesch. D'Zil ass Workflow, Architektur a Scope esou ze klären, datt d'Build-Phase propper virbereet ass.",
    consultingCovers: "Wat et ofdeckt",
    consultingReceive: "Wat Dir kritt",
    consultingFormats: "Typesch Formater",
    platformsTitle: "Systemer, déi mir ronderëm d'Automatiséierung verbannen",
    platformsBody:
      "Déi meescht Delivery-Aarbecht leeft tëscht verschiddene Systemer. Mir designen dës verbonne operationell Schicht amplaz nach en isoléiert Tool dobäi ze setzen.",
    conversionTitle: "Mat engem kloere Workflow ufänken an duerno ausbauen",
    conversionBody:
      "Déi éischt Missioun soll de richtege Workflow, déi involvéiert Systemer an de beschten nächste Schrëtt fir d'Ëmsetzung kloer maachen.",
    conversionSteps: [
      "Gratis Automatiséierungs-Audit",
      "Workflow-Scoping a Roadmap",
      "Ëmsetzungsprojet",
      "Optimiséierung a Support",
    ],
    conversionPrimary: "Gratis Audit ufroen",
    conversionSecondary: "Kontakt benotzen",
  },
} as const;

export default function ServicesPage() {
  const { lang } = useLanguage();
  const copy = localizedServicesCopy[lang] ?? localizedServicesCopy.en;
  const homeCopy = homepageCopy[lang] ?? homepageCopy.en;
  const { businessFit, consultingSection, platformCards } =
    getLocalizedMarketingSharedContent(lang);

  return (
    <div className="min-h-screen bg-white text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      <Header />

      <main>
        <section className="bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_58%,#f8fafc_100%)] py-24 dark:bg-[linear-gradient(180deg,#020617_0%,#0b1120_46%,#0f172a_100%)] sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-start gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
              <AnimatedSection direction="left" className="space-y-8">
                <SectionHeading
                  titleAs="h1"
                  title={copy.heroTitle}
                  body={copy.heroBody}
                  titleClassName="text-[2.55rem] sm:text-[3.1rem] lg:text-[3.7rem]"
                />

                <CtaLinks
                  primaryHref="/scheduling?meetingTypeKey=free-audit"
                  primaryLabel={copy.heroPrimary}
                  secondaryHref="/how-it-works"
                  secondaryLabel={copy.heroSecondary}
                />
              </AnimatedSection>

              <AnimatedSection direction="right">
                <SurfaceCard className="gap-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {businessFit.map((item) => (
                      <div
                        key={item}
                        className="rounded-[1.25rem] border border-slate-200/80 bg-slate-50/85 px-4 py-4 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </SurfaceCard>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <section className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              align="center"
              title={homeCopy.services.title}
              body={homeCopy.services.body}
            />

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {homeCopy.services.items.map((item, index) => (
                <AnimatedSection
                  key={item.title}
                  delay={index * 0.05}
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
                        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                          {item.outcome}
                        </p>
                      </div>

                      <div className="rounded-[1.25rem] border border-slate-200/80 bg-slate-50/85 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {copy.fitTitle}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                          {copy.fitBody}
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

                      <div className="rounded-[1.2rem] border border-slate-200/80 bg-slate-50/85 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          {homeCopy.services.exampleLabel}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-200">
                          {item.example}
                        </p>
                      </div>

                      <div className="rounded-[1.2rem] border border-primary-100 bg-primary-50/85 p-4 dark:border-primary-500/20 dark:bg-primary-500/10">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 dark:text-accent-400">
                          {homeCopy.services.resultLabel}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-200">
                          {item.result}
                        </p>
                      </div>

                      <div className="mt-auto">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          {homeCopy.services.deliverablesLabel}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.deliverables.map((deliverable) => (
                            <span key={deliverable} className="lux-pill">
                              {deliverable}
                            </span>
                          ))}
                        </div>
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
            <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
              <AnimatedSection direction="left" className="space-y-6">
                <SectionHeading
                  title={copy.consultingTitle}
                  body={copy.consultingBody}
                />
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {consultingSection.intro}
                </p>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {consultingSection.detail}
                </p>
              </AnimatedSection>

              <AnimatedSection direction="right" className="grid gap-5">
                <SurfaceCard subtle>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {copy.consultingCovers}
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
                    {copy.consultingReceive}
                  </p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {consultingSection.deliverables.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <i className="ri-arrow-right-line mt-1 text-primary-600 dark:text-accent-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {consultingSection.offerings.slice(0, 4).map((item) => (
                      <span key={item} className="lux-pill">
                        {item}
                      </span>
                    ))}
                  </div>
                </SurfaceCard>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <section className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              align="center"
              title={copy.platformsTitle}
              body={copy.platformsBody}
            />

            <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {platformCards.map((item, index) => (
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

        <section className="pb-24 sm:pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="lux-card p-8 sm:p-10 lg:p-12">
              <div className="mx-auto max-w-3xl text-center">
                <SectionHeading
                  align="center"
                  title={copy.conversionTitle}
                  body={copy.conversionBody}
                />

                <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
                  {copy.conversionSteps.map((item, index) => (
                    <div
                      key={item}
                      className="rounded-[1.15rem] border border-slate-200/80 bg-slate-50/85 px-4 py-4 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200"
                    >
                      <span className="mr-2 text-primary-600 dark:text-accent-400">
                        0{index + 1}
                      </span>
                      {item}
                    </div>
                  ))}
                </div>

                <CtaLinks
                  primaryHref="/scheduling?meetingTypeKey=free-audit"
                  primaryLabel={copy.conversionPrimary}
                  secondaryHref="/contact"
                  secondaryLabel={copy.conversionSecondary}
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
