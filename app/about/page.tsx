"use client";

import { motion } from "framer-motion";

import AnimatedSection from "@/components/AnimatedSection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { CtaLinks, SectionHeading, SurfaceCard } from "@/components/marketing/SectionHeading";
import { useLanguage } from "@/components/LanguageProvider";
import TeamMemberCard from "@/components/TeamMemberCard";
import { brand } from "@/lib/marketing-content";
import { getLocalizedMarketingSharedContent } from "@/lib/marketing-shared-content";

const localizedAboutCopy = {
  en: {
    heroTitle: "Lux AI builds business systems that make automation usable",
    heroBody:
      "The work sits at the intersection of workflow design, integrations, and practical AI delivery. The point is not to add more software noise. The point is to give teams a calmer operating system.",
    expertiseAreas: [
      "Workflow automation",
      "Client communication systems",
      "Integrations and APIs",
      "Operational dashboards",
      "Scoping and implementation",
    ],
    timelineTitle: "How the work evolved",
    timelineBody:
      "Lux AI grew out of systems thinking and implementation work, not out of generic marketing language about AI.",
    timeline: [
      {
        title: "Before Lux AI",
        body: "The foundation came from integration architecture, full-stack delivery, and solving messy operational handoffs between business systems.",
      },
      {
        title: "Now",
        body: "Today the focus is building AI-assisted workflows, communication systems, and connected dashboards for SMEs that need structure, speed, and trust.",
      },
      {
        title: "Next",
        body: "The next phase is deeper operational systems: better monitoring, stronger controls, and more reusable automation foundations for growing teams.",
      },
    ],
    workTitle: "What the team works on in practice",
    workBody:
      "Projects usually combine one clear workflow problem with the systems and controls needed to make that workflow reliable in production.",
    workExamples: [
      {
        title: "Workflow redesign",
        body: "Mapping approvals, handoffs, and admin steps before automation is added.",
        icon: "ri-route-line",
      },
      {
        title: "Connected delivery",
        body: "Linking CRM, email, chat, forms, and internal tools into one usable operating flow.",
        icon: "ri-links-line",
      },
      {
        title: "Operational visibility",
        body: "Giving teams dashboards, escalation paths, and clearer ownership once the system is live.",
        icon: "ri-dashboard-3-line",
      },
    ],
    expectationsTitle: "What clients should expect",
    expectationsBody:
      "Trust comes from clear scope, documented logic, and controlled rollout instead of vague promises.",
    teamTitle: "The team behind the delivery",
    ctaTitle: "Start with a workflow that actually matters",
    ctaBody:
      "Use the free audit to identify the best workflow to improve first, then decide what should move into design and implementation.",
    ctaPrimary: "Get a Free Audit",
    ctaSecondary: "Use contact instead",
  },
  fr: {
    heroTitle: "Lux AI construit des systemes metier qui rendent l'automatisation vraiment utilisable",
    heroBody:
      "Le travail se situe entre design de workflow, integrations et delivery IA concret. L'objectif n'est pas d'ajouter plus de bruit logiciel, mais de donner aux equipes un systeme d'exploitation plus calme.",
    expertiseAreas: [
      "Automatisation des workflows",
      "Systemes de communication client",
      "Integrations et API",
      "Dashboards operationnels",
      "Cadrage et implementation",
    ],
    timelineTitle: "Comment le travail a evolue",
    timelineBody:
      "Lux AI vient d'une logique systeme et d'un travail d'implementation, pas d'un langage marketing generique autour de l'IA.",
    timeline: [
      {
        title: "Avant Lux AI",
        body: "La base vient de l'architecture d'integration, du delivery full-stack et de la resolution des handoffs operationnels entre systemes metier.",
      },
      {
        title: "Maintenant",
        body: "Aujourd'hui, le focus est sur des workflows assistes par IA, des systemes de communication et des dashboards connectes pour les PME qui ont besoin de structure, de vitesse et de confiance.",
      },
      {
        title: "Ensuite",
        body: "La prochaine phase va vers des systemes operationnels plus profonds: meilleur monitoring, controles plus forts et bases d'automatisation plus reutilisables.",
      },
    ],
    workTitle: "Ce sur quoi l'equipe travaille concretement",
    workBody:
      "Les projets combinent generalement un vrai probleme de workflow avec les systemes et les controles necessaires pour le rendre fiable en production.",
    workExamples: [
      {
        title: "Redesign du workflow",
        body: "Cartographier validations, handoffs et etapes admin avant d'ajouter l'automatisation.",
        icon: "ri-route-line",
      },
      {
        title: "Delivery connectee",
        body: "Relier CRM, e-mail, chat, formulaires et outils internes dans un meme flux operationnel.",
        icon: "ri-links-line",
      },
      {
        title: "Visibilite operationnelle",
        body: "Donner a l'equipe des dashboards, des chemins d'escalade et une responsabilite plus claire une fois le systeme live.",
        icon: "ri-dashboard-3-line",
      },
    ],
    expectationsTitle: "Ce que les clients doivent attendre",
    expectationsBody:
      "La confiance vient d'un scope clair, d'une logique documentee et d'un deploiement controle, pas de promesses vagues.",
    teamTitle: "L'equipe derriere la delivery",
    ctaTitle: "Commencez par un workflow qui compte vraiment",
    ctaBody:
      "Utilisez l'audit gratuit pour identifier le workflow le plus utile a traiter en premier, puis decider ce qui doit passer en design et en implementation.",
    ctaPrimary: "Obtenir un audit gratuit",
    ctaSecondary: "Utiliser le contact",
  },
  de: {
    heroTitle: "Lux AI baut Geschaeftssysteme, die Automatisierung wirklich nutzbar machen",
    heroBody:
      "Die Arbeit liegt zwischen Workflow-Design, Integrationen und praktischer KI-Delivery. Ziel ist nicht mehr Software-Laerm, sondern ein ruhigeres Betriebssystem fuer Teams.",
    expertiseAreas: [
      "Workflow-Automatisierung",
      "Kundenkommunikationssysteme",
      "Integrationen und APIs",
      "Operative Dashboards",
      "Scoping und Umsetzung",
    ],
    timelineTitle: "Wie sich die Arbeit entwickelt hat",
    timelineBody:
      "Lux AI kommt aus Systemdenken und echter Implementierungsarbeit, nicht aus generischer KI-Marketing-Sprache.",
    timeline: [
      {
        title: "Vor Lux AI",
        body: "Die Grundlage kam aus Integrationsarchitektur, Full-Stack-Delivery und dem Loesen unordentlicher operativer Uebergaben zwischen Geschaeftssystemen.",
      },
      {
        title: "Heute",
        body: "Heute liegt der Fokus auf KI-gestuetzten Workflows, Kommunikationssystemen und verbundenen Dashboards fuer KMU, die Struktur, Geschwindigkeit und Vertrauen brauchen.",
      },
      {
        title: "Als naechstes",
        body: "Die naechste Phase geht tiefer in operative Systeme: besseres Monitoring, staerkere Kontrollen und wiederverwendbare Automatisierungsgrundlagen fuer wachsende Teams.",
      },
    ],
    workTitle: "Woran das Team in der Praxis arbeitet",
    workBody:
      "Projekte verbinden meist ein klares Workflow-Problem mit den Systemen und Kontrollen, die diesen Ablauf in Produktion verlaesslich machen.",
    workExamples: [
      {
        title: "Workflow-Neugestaltung",
        body: "Freigaben, Handoffs und Admin-Schritte abbilden, bevor Automatisierung daruebergelegt wird.",
        icon: "ri-route-line",
      },
      {
        title: "Verbundene Delivery",
        body: "CRM, E-Mail, Chat, Formulare und interne Tools in einen nutzbaren Ablauf verbinden.",
        icon: "ri-links-line",
      },
      {
        title: "Operative Sichtbarkeit",
        body: "Teams Dashboards, Eskalationspfade und klarere Verantwortung geben, sobald das System live ist.",
        icon: "ri-dashboard-3-line",
      },
    ],
    expectationsTitle: "Was Kunden erwarten sollten",
    expectationsBody:
      "Vertrauen entsteht durch klaren Scope, dokumentierte Logik und kontrollierten Rollout statt vager Versprechen.",
    teamTitle: "Das Team hinter der Delivery",
    ctaTitle: "Starten Sie mit einem Workflow, der wirklich zaehlt",
    ctaBody:
      "Nutzen Sie das kostenlose Audit, um den sinnvollsten ersten Workflow zu identifizieren, und entscheiden Sie dann, was in Design und Umsetzung uebergehen soll.",
    ctaPrimary: "Kostenloses Audit anfordern",
    ctaSecondary: "Kontakt nutzen",
  },
  lb: {
    heroTitle: "Lux AI baut Business-Systemer, déi Automatiséierung wierklech benotzbar maachen",
    heroBody:
      "D'Aarbecht läit tëscht Workflow-Design, Integratiounen a praktescher KI-Delivery. D'Zil ass net nach méi Software-Kaméidi, mee e méi rouege Betribssystem fir Equippen.",
    expertiseAreas: [
      "Workflow-Automatiséierung",
      "Clientekommunikatiounssystemer",
      "Integratiounen an APIen",
      "Operativ Dashboards",
      "Scoping an Ëmsetzung",
    ],
    timelineTitle: "Wéi d'Aarbecht evoluéiert ass",
    timelineBody:
      "Lux AI kënnt aus Systemdenken an reeller Implementéierungsaarbecht, net aus generescher KI-Marketing-Sprooch.",
    timeline: [
      {
        title: "Viru Lux AI",
        body: "D'Basis koum aus Integratiounsarchitektur, Full-Stack-Delivery an dem Opléise vun onuerdentleche operationellen Iwwergaben tëscht Business-Systemer.",
      },
      {
        title: "Elo",
        body: "Haut läit de Fokus op KI-gestëtzte Workflows, Kommunikatiounssystemer a verbonnen Dashboards fir PMEen, déi Struktur, Vitesse a Vertrauen brauchen.",
      },
      {
        title: "Als nächst",
        body: "Déi nächst Phase geet méi déif an operationell Systemer: besseres Monitoring, méi staark Kontrollen a méi reusable Automatiséierungsfongen.",
      },
    ],
    workTitle: "Wou d'Equipe praktesch drun schafft",
    workBody:
      "Projeten verbannen normalerweis ee kloert Workflow-Problem mat de Systemer a Kontrollpunkten, déi dëse Flow an der Produktioun zouverlässeg maachen.",
    workExamples: [
      {
        title: "Workflow-Redesign",
        body: "Geneemegungen, Handoffs an Admin-Schrëtt ofbilden, ier Automatiséierung drop kënnt.",
        icon: "ri-route-line",
      },
      {
        title: "Verbonnen Delivery",
        body: "CRM, E-Mail, Chat, Formulairen an intern Tools an engem benotzbare Flow verbannen.",
        icon: "ri-links-line",
      },
      {
        title: "Operativ Visibilitéit",
        body: "Der Equipe Dashboards, Eskalatiounsweeër a méi kloer Verantwortung ginn, soubal de System live ass.",
        icon: "ri-dashboard-3-line",
      },
    ],
    expectationsTitle: "Wat Cliente erwaarde sollen",
    expectationsBody:
      "Vertrauen kënnt duerch kloert Scope, dokumentéiert Logik a kontrolléiert Rollout amplaz vu vague Verspriechen.",
    teamTitle: "D'Equipe hannert der Delivery",
    ctaTitle: "Fänkt mat engem Workflow un, deen wierklech zielt",
    ctaBody:
      "Benotzt de gratis Audit, fir dee wäertvollste éischte Workflow z'identifizéieren, an decidéiert dann, wat an Design an Ëmsetzung iwwergoe soll.",
    ctaPrimary: "Gratis Audit ufroen",
    ctaSecondary: "Kontakt benotzen",
  },
} as const;

export default function AboutPage() {
  const { lang } = useLanguage();
  const copy = localizedAboutCopy[lang] ?? localizedAboutCopy.en;
  const { credibilityPoints, teamMembers } =
    getLocalizedMarketingSharedContent(lang);

  return (
    <div className="min-h-screen bg-white text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      <Header />

      <main>
        <section className="bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_58%,#f8fafc_100%)] py-24 dark:bg-[linear-gradient(180deg,#020617_0%,#0b1120_46%,#0f172a_100%)] sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-start gap-12 lg:grid-cols-[1.02fr_0.98fr]">
              <AnimatedSection direction="left" className="space-y-8">
                <SectionHeading
                  titleAs="h1"
                  title={copy.heroTitle}
                  body={copy.heroBody}
                  titleClassName="text-[2.55rem] sm:text-[3.1rem] lg:text-[3.75rem]"
                />

                <div className="flex flex-wrap gap-3">
                  {copy.expertiseAreas.map((item) => (
                    <span key={item} className="lux-pill">
                      {item}
                    </span>
                  ))}
                </div>

                <p className="max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                  {brand.description}
                </p>
              </AnimatedSection>

              <AnimatedSection direction="right">
                <SurfaceCard className="p-4">
                  <img
                    src="/images/about.jpg"
                    alt="Lux AI leadership and automation planning"
                    className="w-full rounded-[1.45rem] object-cover"
                  />
                </SurfaceCard>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <section className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              align="center"
              title={copy.timelineTitle}
              body={copy.timelineBody}
            />

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {copy.timeline.map((item, index) => (
                <AnimatedSection
                  key={item.title}
                  delay={index * 0.05}
                  direction="up"
                >
                  <motion.div whileHover={{ y: -4 }}>
                    <SurfaceCard className="gap-4">
                      <span className="text-sm font-semibold text-primary-700 dark:text-accent-400">
                        0{index + 1}
                      </span>
                      <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
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

        <section className="bg-slate-50/80 py-24 dark:bg-slate-900/50 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              align="center"
              title={copy.workTitle}
              body={copy.workBody}
            />

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {copy.workExamples.map((item, index) => (
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
            <div className="grid items-start gap-10 lg:grid-cols-[0.95fr_1.05fr]">
              <AnimatedSection direction="left">
                <SurfaceCard className="p-4">
                  <img
                    src="/images/build-process.jpg"
                    alt="Automation architecture and workshop process"
                    className="w-full rounded-[1.45rem] object-cover"
                  />
                </SurfaceCard>
              </AnimatedSection>

              <AnimatedSection direction="right">
                <SectionHeading
                  title={copy.expectationsTitle}
                  body={copy.expectationsBody}
                />
                <div className="mt-8 space-y-4">
                  {credibilityPoints.map((item) => (
                    <div
                      key={item}
                      className="lux-card-soft flex items-start gap-3 px-5 py-4 text-sm text-slate-700 dark:text-slate-200"
                    >
                      <i className="ri-check-line mt-1 text-primary-600 dark:text-accent-400" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <section className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading align="center" title={copy.teamTitle} />

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
                secondaryHref="/contact"
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
