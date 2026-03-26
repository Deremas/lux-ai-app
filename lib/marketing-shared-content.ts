import type { AppLanguage } from "@/lib/i18n";
import {
  businessFit as baseBusinessFit,
  consultingSection as baseConsultingSection,
  credibilityPoints as baseCredibilityPoints,
  featureBenefits as baseFeatureBenefits,
  painPoints as basePainPoints,
  platformCards as basePlatformCards,
  processSteps as baseProcessSteps,
  solutionCards as baseSolutionCards,
  teamMembers as baseTeamMembers,
  useCases as baseUseCases,
} from "@/lib/marketing-content";
import type { UseCase } from "@/lib/marketing-content";

type PainPointOverride = {
  title?: string;
  description?: string;
  icon?: string;
};

type SolutionCardOverride = {
  title?: string;
  summary?: string;
  outcome?: string;
  fit?: string;
  icon?: string;
};

type ConsultingSectionOverride = {
  title?: string;
  intro?: string;
  detail?: string;
  offerings?: string[];
  deliverables?: string[];
  cta?: string;
};

type FeatureBenefitOverride = {
  title?: string;
  benefit?: string;
  icon?: string;
};

type UseCaseOverride = Partial<UseCase>;

type ProcessStepOverride = {
  step?: string;
  duration?: string;
  description?: string;
  points?: string[];
  outputs?: string[];
  image?: string;
};

type TeamMemberOverride = {
  key?: string;
  name?: string;
  role?: string;
  bio?: string;
  tags?: string[];
  image?: string;
  linkedin?: string;
  twitter?: string;
  telegram?: string;
  whatsapp?: string;
  facebook?: string;
  email?: string;
};

type PlatformCardOverride = {
  title?: string;
  description?: string;
  icon?: string;
};

type LocaleOverrides = {
  painPoints?: readonly PainPointOverride[];
  solutionCards?: readonly SolutionCardOverride[];
  consultingSection?: ConsultingSectionOverride;
  featureBenefits?: readonly FeatureBenefitOverride[];
  useCases?: readonly UseCaseOverride[];
  processSteps?: readonly ProcessStepOverride[];
  teamMembers?: readonly TeamMemberOverride[];
  platformCards?: readonly PlatformCardOverride[];
  businessFit?: readonly string[];
  credibilityPoints?: readonly string[];
};

const sharedLocaleOverrides: Partial<Record<AppLanguage, LocaleOverrides>> = {
  en: {},
  fr: {
    painPoints: [
      { title: "Travail administratif répétitif", description: "Les validations manuelles, transferts et copier-coller ralentissent les équipes et créent des erreurs évitables." },
      { title: "Réponses client trop lentes", description: "Les leads et demandes de support attendent trop longtemps quand les équipes dépendent d’inbox dispersées." },
      { title: "Systèmes déconnectés", description: "CRM, e-mail, formulaires, outils internes et bases de données ne fonctionnent souvent pas comme un seul système." },
      { title: "Saisie manuelle des données", description: "Les équipes perdent du temps à déplacer des documents et à ressaisir les mêmes informations." },
      { title: "Goulots d’étranglement des workflows", description: "Les processus critiques cassent avec la croissance quand ils ne sont pas repensés autour de la clarté." },
      { title: "Croissance sans structure", description: "Plus de volume ne devrait pas toujours signifier plus de personnes, plus d’inbox et plus de friction." },
    ],
    solutionCards: [
      { title: "Automatisation IA des workflows", summary: "Automatisez les processus répétitifs autour des formulaires, validations, tâches administratives et workflows internes.", outcome: "Moins de travail manuel et des opérations plus rapides.", fit: "Idéal pour les équipes avec des étapes récurrentes et du back-office." },
      { title: "Communication client assistée par IA", summary: "Déployez des assistants IA pour le support, la qualification des leads, les FAQ et l’onboarding.", outcome: "Plus de réactivité et moins de charge de communication.", fit: "Idéal pour les équipes commerciales, support, onboarding et service." },
      { title: "Intégration des systèmes métier", summary: "Connectez CRM, e-mail, formulaires, outils internes, bases de données et API dans des workflows efficaces.", outcome: "Moins de transferts manuels et d’opérations fragmentées.", fit: "Idéal pour les entreprises avec des outils déconnectés ou des flux manuels." },
      { title: "Systèmes internes de connaissance IA", summary: "Donnez aux équipes des assistants IA sécurisés et un accès contrôlé à la connaissance de l’entreprise.", outcome: "Accès plus rapide à l’information et meilleur support à la décision.", fit: "Idéal pour les opérations, le support, les RH et les équipes transverses." },
      { title: "Optimisation des processus", summary: "Analysez et améliorez les workflows avant ou pendant l’automatisation afin que le système corresponde au métier.", outcome: "Des automatisations plus efficaces et durables.", fit: "Idéal pour les PME qui affinent leurs workflows avant d’implémenter." },
    ],
    consultingSection: {
      title: "Un conseil qui transforme les idées d’automatisation en actions",
      intro: "Le conseil soutient l’offre principale : concevoir et mettre en œuvre des systèmes d’automatisation IA qui améliorent les opérations.",
      detail: "Nous l’utilisons pour clarifier les priorités, valider les bons systèmes et préparer un projet d’implémentation ou d’optimisation continue.",
      offerings: ["Audit d’automatisation gratuit", "Évaluation de maturité IA", "Découverte des opportunités d’automatisation", "Revue des workflows et processus", "Conseil en architecture d’intégration", "Feuille de route d’implémentation"],
      deliverables: ["Analyse du processus actuel", "Opportunités d’automatisation", "Recommandations d’outils et d’intégrations", "Architecture de solution", "Plan d’implémentation"],
      cta: "Parlez-nous de votre workflow métier",
    },
    featureBenefits: [
      { title: "Chatbots de site web", benefit: "Capturez des leads et répondez aux questions fréquentes sans alourdir les inbox." },
      { title: "Assistants IA privés", benefit: "Donnez aux équipes un accès plus rapide à des informations internes fiables." },
      { title: "Systèmes de connaissance admin", benefit: "Gardez les réponses IA à jour grâce à une connaissance métier contrôlée." },
      { title: "API et webhooks", benefit: "Faites circuler l’information entre les outils sans transfert manuel ni rupture." },
      { title: "Intégrations CRM", benefit: "Gardez les données client synchronisées et exploitables sur tous les points de contact." },
      { title: "Plateformes d’automatisation", benefit: "Lancez rapidement des workflows utiles puis faites-les évoluer avec la maturité opérationnelle." },
    ],
    useCases: [
      { title: "Assistant IA de support", problem: "Les équipes support perdent du temps à répondre aux mêmes questions sur plusieurs canaux.", solution: "Déployez un assistant IA qui gère les FAQ, le tri du support et l’aide à la réponse avec des règles d’escalade claires.", teaser: "Gérer les FAQ et le tri du support avant qu’un humain ne doive intervenir.", outcome: "Des réponses plus rapides et moins de charge de communication.", industries: "Équipes de service, SaaS, services professionnels, support interne", tools: "Site web, help desk, base de connaissance interne" },
      { title: "Coordination des demandes immobilières et des visites", problem: "Les équipes immobilières perdent du temps à répondre aux questions répétitives et à coordonner les visites.", solution: "Utilisez le chat assisté par IA et le routage des workflows pour répondre, capter les préférences et synchroniser les calendriers.", teaser: "Répondre aux questions immobilières courantes et coordonner les visites sans allers-retours en inbox.", outcome: "Traitement plus rapide des demandes et meilleure coordination des agents.", industries: "Agences immobilières, promoteurs, équipes locatives, relocation", tools: "Chat site web, e-mail, CRM, calendriers, formulaires" },
      { title: "Automatisation de l’onboarding client", problem: "Le passage d’un nouveau client est incohérent et plein d’étapes manuelles répétitives.", solution: "Automatisez la collecte d’informations, les documents, les notifications d’état et les workflows d’onboarding.", teaser: "Automatiser l’intake, les documents et les mises à jour de statut pendant l’onboarding.", outcome: "Un onboarding plus fluide et moins de retards opérationnels.", industries: "Services professionnels, finance, PME à forte charge opérationnelle", tools: "Formulaires, e-mail, CRM, workflows internes" },
      { title: "Automatisation des relances CRM", problem: "Des relances importantes sont oubliées lorsque les mises à jour dépendent d’actions manuelles.", solution: "Déclenchez automatiquement rappels, mises à jour d’étapes et tâches à partir d’événements métier.", teaser: "Déclencher rappels et prochaines actions à partir d’événements métier réels.", outcome: "Une meilleure discipline de suivi et moins de charge administrative.", industries: "Équipes commerciales, services, gestion de comptes", tools: "CRM, e-mail, notifications, tableaux de bord" },
      { title: "Automatisation intelligente des rendez-vous", problem: "La planification manuelle fait perdre du temps et crée des conflits ou une mauvaise répartition de la charge.", solution: "Utilisez le routage assisté par IA, la synchro des calendriers et les validations pour fluidifier la réservation.", teaser: "Fluidifier les réservations avec calendriers, validations et buffers sans planification manuelle.", outcome: "Des rendez-vous planifiés plus vite et une meilleure charge de travail.", industries: "Conseil, cliniques, équipes internes, services", tools: "Calendriers, validations, workflows de réservation" },
      { title: "Traitement des documents et factures", problem: "Les équipes passent trop de temps à extraire des données et déplacer des documents entre systèmes.", solution: "Automatisez la réception, l’extraction, la catégorisation, la validation et l’orientation des documents.", teaser: "Extraire, valider et orienter les documents sans ressaisie manuelle répétée.", outcome: "Moins de traitement manuel et des données plus propres.", industries: "Finance, opérations, logistique, administration", tools: "E-mail, OCR, approbations, ERP ou comptabilité" },
      { title: "Assistant de connaissance interne", problem: "Les collaborateurs perdent du temps à chercher des réponses dans les documents, inbox et connaissances informelles.", solution: "Créez un assistant interne sécurisé connecté à une base de connaissance approuvée et aux processus de l’équipe.", teaser: "Donner aux équipes un accès IA sécurisé à la connaissance interne approuvée.", outcome: "Des décisions plus rapides et un support interne plus cohérent.", industries: "Opérations, RH, support, enablement interne", tools: "Base de connaissance, contrôles d’accès, portails internes" },
      { title: "Notifications et approbations inter-systèmes", problem: "Les boucles d’approbation et les mises à jour de statut se cassent quand les équipes dépendent d’e-mails et de relances manuelles.", solution: "Orchestrez approbations, notifications et règles métier à travers les outils que vos équipes utilisent déjà.", teaser: "Faire avancer approbations et statuts à travers les outils déjà utilisés par l’équipe.", outcome: "Plus de visibilité et moins de workflows bloqués.", industries: "Opérations, finance, RH, delivery projet", tools: "E-mail, chat, CRM, systèmes internes, webhooks" },
    ],
    processSteps: [
      { step: "Évaluer", duration: "3-5 jours", description: "Comprendre le workflow actuel, identifier les blocages et définir les meilleures opportunités d’automatisation.", points: ["Cartographie du workflow", "Revue des outils et données", "Définition du cas d’usage prioritaire", "Liste courte des opportunités"], outputs: ["Carte du workflow", "Shortlist d’automatisation"] },
      { step: "Concevoir", duration: "1-2 semaines", description: "Traduire les besoins métier en une architecture pratique avec les bons systèmes et la bonne logique.", points: ["Architecture de solution", "Choix des outils", "Règles métier et logique de routage", "Plan d’implémentation"], outputs: ["Blueprint de solution", "Plan de delivery"] },
      { step: "Construire", duration: "2-6 semaines", description: "Implémenter les workflows, configurer les systèmes IA et connecter les outils qui doivent fonctionner ensemble.", points: ["Configuration des workflows", "Configuration des assistants IA", "Intégration API et systèmes", "Tests et transfert"], outputs: ["Workflow live", "Systèmes connectés"] },
      { step: "Optimiser", duration: "2-4 semaines", description: "Mesurer la performance, affiner le flux et améliorer les résultats métier une fois le système en production.", points: ["Suivi et feedback", "Amélioration du workflow", "Qualité des réponses", "Reporting opérationnel"], outputs: ["Revue de performance", "Backlog d’amélioration"] },
      { step: "Maintenir", duration: "Mensuel", description: "Assurer un accompagnement continu pour les entreprises qui ont besoin de monitoring, d’améliorations et de nouvelles demandes.", points: ["Maintenance et support", "Nouvelles demandes d’automatisation", "Mises à jour système", "Optimisation continue"], outputs: ["Rythme de monitoring", "File de support"] },
    ],
    teamMembers: [
      { role: "Fondateur & CEO", bio: "Pilote la stratégie de delivery autour de l’automatisation IA, des systèmes métier et de l’architecture d’intégration avec un fort focus sur les résultats concrets.", tags: ["Systèmes IA", "Automatisation des workflows", "MuleSoft Certified Integration Professional", "Conseil"] },
      { role: "Co-fondateur & Ingénieur intégrations", bio: "Conçoit et construit des couches d’intégration fiables, une architecture d’automatisation et des systèmes opérationnels connectés.", tags: ["API", "Intégrations", "Architecture d’automatisation", "Planification système"] },
      { role: "Développeur full-stack & solutions IA", bio: "Construit des applications IA concrètes, des outils internes et des workflows sécurisés et scalables.", tags: ["Applications IA", "Delivery full-stack", "Systèmes cloud", "Outils internes"] },
    ],
    platformCards: [
      { title: "CRM et workflows pipeline", description: "Connectez capture de leads, qualification, relances et routage interne dans un seul flux opérationnel." },
      { title: "Systèmes de communication client", description: "Reliez chat, e-mail, FAQ et transferts support pour une communication plus rapide et cohérente." },
      { title: "Outils internes et bases de données", description: "Déplacez l’information entre tableaux de bord, formulaires, fichiers et systèmes internes sans copier-coller." },
      { title: "Sites web et portails prêts pour l’automatisation", description: "Faites des sites publics et portails clients une partie du workflow métier, pas seulement des pages statiques." },
    ],
    businessFit: [
      "PME avec beaucoup de travail administratif répétitif",
      "Équipes confrontées à des outils métier déconnectés",
      "Entreprises de services avec une communication client en croissance",
      "Responsables opérations qui ont besoin de clarté avant de passer à l’échelle",
    ],
    credibilityPoints: [
      "Basé au Luxembourg avec un focus sur l’implémentation concrète",
      "Delivery automation-first avec du conseil là où il ajoute de la valeur",
      "Construit autour des workflows métier, des intégrations et de prochaines étapes mesurables",
      "Pensé pour des projets d’implémentation et des accompagnements d’optimisation continue",
    ],
  },
  de: {
    painPoints: [
      { title: "Wiederkehrende Admin-Arbeit", description: "Manuelle Freigaben, Übergaben und Copy-Paste-Arbeit verlangsamen Teams und erzeugen vermeidbare Fehler." },
      { title: "Langsame Kundenreaktionen", description: "Leads und Supportanfragen warten zu lange, wenn Teams von Postfächern und fragmentierten Tools abhängen." },
      { title: "Getrennte Systeme", description: "CRM, E-Mail, Formulare, interne Tools und Datenbanken arbeiten oft nicht wie ein einziges Betriebssystem zusammen." },
      { title: "Manuelle Dateneingabe", description: "Teams verschwenden Zeit mit dem Aktualisieren von Datensätzen, dem Verschieben von Dokumenten und der erneuten Eingabe derselben Informationen." },
      { title: "Workflow-Engpässe", description: "Kritische Prozesse brechen unter Wachstum, wenn niemand sie auf Geschwindigkeit und Klarheit neu gestaltet hat." },
      { title: "Wachstum ohne Struktur", description: "Mehr Volumen sollte nicht immer mehr Menschen, mehr Postfächer und mehr operative Reibung bedeuten." },
    ],
    solutionCards: [
      { title: "KI-Workflow-Automatisierung", summary: "Automatisieren Sie wiederkehrende Geschäftsprozesse rund um Formulare, Freigaben, Admin-Aufgaben und interne Abläufe.", outcome: "Weniger manuelle Arbeit und höhere operative Geschwindigkeit.", fit: "Ideal für Teams mit wiederkehrenden Prozessschritten und Backoffice-Arbeit." },
      { title: "KI-gestützte Kundenkommunikation", summary: "Setzen Sie KI-Assistenten für Support, Lead-Qualifizierung, FAQs und Kunden-Onboarding ein.", outcome: "Mehr Reaktionsgeschwindigkeit und weniger Kommunikationslast.", fit: "Ideal für Sales-, Support-, Onboarding- und Service-Teams." },
      { title: "Integration von Geschäftssystemen", summary: "Verbinden Sie CRM, E-Mail, Formulare, interne Tools, Datenbanken und APIs in effizienten Geschäftsworkflows.", outcome: "Weniger manuelle Übergaben und fragmentierte Abläufe.", fit: "Ideal für Unternehmen mit getrennten Tools oder manuellem Datenfluss." },
      { title: "Interne KI-Wissenssysteme", summary: "Stellen Sie Teams sichere KI-Assistenten und kontrollierten Zugriff auf Unternehmenswissen bereit.", outcome: "Schnellerer Informationszugriff und bessere Entscheidungsunterstützung.", fit: "Ideal für Operations, Support, HR und funktionsübergreifende Teams." },
      { title: "Prozessoptimierung", summary: "Analysieren und verbessern Sie Workflows vor oder parallel zur Automatisierung, damit das System wirklich zum Geschäft passt.", outcome: "Wirksamere und nachhaltigere Automatisierungen.", fit: "Ideal für KMU, die Workflows vor der Umsetzung schärfen wollen." },
    ],
    consultingSection: {
      title: "Beratung, die Automatisierungsideen in Umsetzung verwandelt",
      intro: "Beratung unterstützt das Hauptangebot: KI-Automatisierungssysteme zu entwerfen und umzusetzen, die Geschäftsabläufe verbessern.",
      detail: "Wir nutzen Beratung, um Prioritäten zu schärfen, die richtigen Systeme zu validieren und ein Umsetzungs- oder Optimierungsprojekt vorzubereiten.",
      offerings: ["Kostenloses Automatisierungs-Audit", "KI-Readiness-Bewertung", "Erkennung von Automatisierungschancen", "Workflow- und Prozess-Review", "Beratung zur Integrationsarchitektur", "Implementierungs-Roadmap"],
      deliverables: ["Analyse des aktuellen Prozesses", "Automatisierungschancen", "Tool- und Integrationsempfehlungen", "Lösungsarchitektur", "Implementierungsplan"],
      cta: "Sprechen Sie mit uns über Ihren Workflow",
    },
    featureBenefits: [
      { title: "Website-Chatbots", benefit: "Erfassen Sie Leads und beantworten Sie häufige Fragen, ohne zusätzliche Inbox-Last zu erzeugen." },
      { title: "Private KI-Assistenten", benefit: "Geben Sie Teams schnelleren Zugriff auf verlässliche interne Informationen." },
      { title: "Admin-Wissenssysteme", benefit: "Halten Sie KI-Antworten mit kontrolliertem Unternehmenswissen aktuell." },
      { title: "APIs und Webhooks", benefit: "Bewegen Sie Informationen zwischen Tools ohne manuelle Übergaben oder Brüche." },
      { title: "CRM-Integrationen", benefit: "Halten Sie Kundendaten über Touchpoints hinweg synchron und nutzbar." },
      { title: "Automatisierungsplattformen", benefit: "Starten Sie schnell nutzbare Workflows und bauen Sie sie mit der Reife Ihrer Abläufe aus." },
    ],
    useCases: [
      { title: "KI-Support-Assistent", problem: "Support-Teams verlieren Zeit damit, dieselben Fragen über mehrere Kanäle hinweg zu beantworten.", solution: "Setzen Sie einen KI-Assistenten ein, der FAQs, Support-Triage und Antwortführung mit klaren Eskalationsregeln übernimmt.", teaser: "FAQs und Support-Triage abfangen, bevor ein Mensch übernehmen muss.", outcome: "Schnellere Antworten und weniger Kommunikationslast.", industries: "Service-Teams, SaaS, Professional Services, interne Support-Desks", tools: "Website, Help Desk, interne Wissensdatenbank" },
      { title: "Immobilienanfragen und Besichtigungstermine koordinieren", problem: "Immobilien-Teams verlieren Zeit mit wiederkehrenden Fragen, Verfügbarkeiten und der Koordination von Besichtigungen.", solution: "Nutzen Sie KI-gestützten Chat und Workflow-Routing, um Fragen zu beantworten, Präferenzen zu erfassen und Kalender zu synchronisieren.", teaser: "Typische Immobilienfragen beantworten und Besichtigungen ohne Inbox-Pingpong koordinieren.", outcome: "Schnellere Bearbeitung von Anfragen und bessere Koordination.", industries: "Immobilienagenturen, Entwickler, Vermietungsteams, Relocation-Services", tools: "Website-Chat, E-Mail, CRM, Kalender, Formulare" },
      { title: "Automatisiertes Kunden-Onboarding", problem: "Die Übergabe neuer Kunden ist inkonsistent und voller wiederkehrender manueller Schritte.", solution: "Automatisieren Sie Intake, Dokumentensammlung, Statusmeldungen und Onboarding-Workflows entlang der Customer Journey.", teaser: "Intake, Dokumente und Statusmeldungen im Onboarding automatisieren.", outcome: "Reibungsloser Onboarding-Prozess und weniger operative Verzögerungen.", industries: "Professional Services, Finance, operative KMU", tools: "Formulare, E-Mail, CRM, interne Workflows" },
      { title: "Automatisierte CRM-Nachverfolgung", problem: "Wichtige Nachfassaktionen werden verpasst, wenn Aktualisierungen von manuellen Schritten abhängen.", solution: "Lösen Sie Erinnerungen, Stufen-Updates und Aufgaben automatisch aus Geschäftsevents aus.", teaser: "Erinnerungen und nächste Schritte aus echten Geschäftsevents auslösen.", outcome: "Bessere Follow-up-Disziplin und weniger Admin-Aufwand.", industries: "Sales-Teams, Service-Unternehmen, Account Management", tools: "CRM, E-Mail, Benachrichtigungen, Dashboards" },
      { title: "Intelligente Termin-Automatisierung", problem: "Manuelle Terminplanung kostet Zeit und führt zu Konflikten oder unausgeglichener Auslastung.", solution: "Nutzen Sie KI-gestütztes Routing, Kalender-Sync, Freigaben und Puffer für sauberere Buchungsabläufe.", teaser: "Buchungen über Kalender, Freigaben und Puffer sauber steuern.", outcome: "Schnellere Terminplanung und bessere Lastverteilung.", industries: "Beratung, Kliniken, interne Teams, Service-Unternehmen", tools: "Kalender, Freigaben, Buchungsworkflows" },
      { title: "Dokumenten- und Rechnungsverarbeitung", problem: "Teams verbringen zu viel Zeit mit Datenauslese und dem Verschieben von Dokumenten zwischen Systemen.", solution: "Automatisieren Sie Eingang, Extraktion, Kategorisierung, Validierung und Weiterleitung operativer Dokumente.", teaser: "Dokumente ohne manuelle Neueingabe extrahieren, validieren und weiterleiten.", outcome: "Weniger manuelle Bearbeitung und sauberere Datenbestände.", industries: "Finance, Operations, Logistik, Administration", tools: "E-Mail, OCR-Flows, Freigabeschritte, ERP oder Buchhaltung" },
      { title: "Interner Wissensassistent", problem: "Mitarbeitende verlieren Zeit beim Suchen nach Antworten in Dokumenten, Postfächern und informellem Wissen.", solution: "Erstellen Sie einen sicheren internen Assistenten, der mit freigegebenem Betriebswissen und Teamprozessen verbunden ist.", teaser: "Teams sicheren KI-Zugriff auf freigegebenes internes Wissen geben.", outcome: "Schnellere Entscheidungen und konsistentere interne Unterstützung.", industries: "Operations, HR, Support, internes Enablement", tools: "Wissensdatenbank, Zugriffskontrollen, interne Portale" },
      { title: "Systemübergreifende Benachrichtigungen und Freigaben", problem: "Freigabeschleifen und Statusupdates stocken, wenn Teams auf E-Mail-Ketten und manuelles Nachfassen angewiesen sind.", solution: "Orchestrieren Sie Freigaben, Benachrichtigungen und Geschäftsregeln über die Tools, die Ihre Teams bereits nutzen.", teaser: "Freigaben und Statusupdates über verbundene Tools hinweg in Bewegung halten.", outcome: "Mehr Transparenz und weniger blockierte Workflows.", industries: "Operations, Finance, HR, Projekt-Delivery", tools: "E-Mail, Chat, CRM, interne Systeme, Webhooks" },
    ],
    processSteps: [
      { step: "Analysieren", duration: "3-5 Tage", description: "Den aktuellen Workflow verstehen, Engpässe identifizieren und die besten Automatisierungschancen definieren.", points: ["Workflow-Mapping", "Review von Tools und Daten", "Definition des Prioritäts-Use-Case", "Shortlist der Automatisierungschancen"], outputs: ["Workflow-Uebersicht", "Automatisierungs-Shortlist"] },
      { step: "Konzipieren", duration: "1-2 Wochen", description: "Geschäftsanforderungen in eine praktikable Automatisierungsarchitektur übersetzen.", points: ["Lösungsarchitektur", "Tool-Auswahl", "Geschäftsregeln und Routing-Logik", "Implementierungsplan"], outputs: ["Loesungs-Blueprint", "Delivery-Plan"] },
      { step: "Umsetzen", duration: "2-6 Wochen", description: "Workflows implementieren, KI-Systeme konfigurieren und die Tools verbinden, die zusammenarbeiten müssen.", points: ["Workflow-Setup", "Konfiguration des KI-Assistenten", "API- und Systemintegration", "Tests und Übergabe"], outputs: ["Live-Workflow", "Verbundene Systeme"] },
      { step: "Optimieren", duration: "2-4 Wochen", description: "Leistung messen, den Ablauf verfeinern und Geschäftsergebnisse verbessern, sobald das System live läuft.", points: ["Monitoring und Feedback", "Workflow-Verfeinerung", "Verbesserung der Antwortqualität", "Operatives Reporting"], outputs: ["Performance-Review", "Verbesserungs-Backlog"] },
      { step: "Betreuen", duration: "Monatlich", description: "Laufende Unterstützung für Unternehmen, die Monitoring, Verbesserungen und neue Automatisierungswünsche benötigen.", points: ["Wartung und Support", "Neue Automatisierungsanforderungen", "System-Updates", "Kontinuierliche Optimierung"], outputs: ["Monitoring-Rhythmus", "Support-Queue"] },
    ],
    teamMembers: [
      { role: "Founder & CEO", bio: "Leitet die Delivery-Strategie für KI-Automatisierung, Geschäftssysteme und Integrationsarchitektur mit Fokus auf praktische Ergebnisse.", tags: ["KI-Systeme", "Workflow-Automatisierung", "MuleSoft Certified Integration Professional", "Beratung"] },
      { role: "Co-Founder & Integrations Engineer", bio: "Entwirft und baut verlässliche Integrationsschichten, Automatisierungsarchitekturen und vernetzte operative Systeme.", tags: ["APIs", "Integrationen", "Automatisierungsarchitektur", "Systemplanung"] },
      { role: "Full-Stack & AI Solutions Developer", bio: "Entwickelt praxisnahe KI-Anwendungen, interne Tools und Workflow-Systeme für sichere und skalierbare Delivery.", tags: ["KI-Anwendungen", "Full-Stack-Delivery", "Cloud-Systeme", "Interne Tools"] },
    ],
    platformCards: [
      { title: "CRM- und Pipeline-Workflows", description: "Verbinden Sie Lead-Erfassung, Qualifizierung, Follow-up und internes Routing in einem operativen Fluss." },
      { title: "Systeme für Kundenkommunikation", description: "Verknüpfen Sie Chat, E-Mail, FAQs und Support-Übergaben für schnellere und konsistentere Kommunikation." },
      { title: "Interne Tools und Datenbanken", description: "Bewegen Sie Informationen zwischen Dashboards, Formularen, Dateien und internen Systemen ohne Copy-Paste." },
      { title: "Automatisierungsfähige Websites und Portale", description: "Machen Sie öffentliche Websites und Kundenportale zu einem Teil des Geschäftsworkflows statt zu statischen Seiten." },
    ],
    businessFit: [
      "KMU mit viel wiederkehrender Admin-Arbeit",
      "Teams mit getrennten Geschäftstools",
      "Service-Unternehmen mit wachsender Kundenkommunikation",
      "Operations-Verantwortliche, die vor dem Skalieren mehr Workflow-Klarheit brauchen",
    ],
    credibilityPoints: [
      "Luxemburg-basiert und auf praktische Umsetzung fokussiert",
      "Automation-first-Delivery mit Beratung dort, wo sie echten Mehrwert bringt",
      "Aufgebaut rund um Geschäftsworkflows, Integrationen und messbare nächste Schritte",
      "Gedacht für Implementierungsprojekte und laufende Optimierungsretainer",
    ],
  },
  lb: {
    painPoints: [
      { title: "Repetitiv Admin-Aarbecht", description: "Manuell Geneemegungen, Handoffs a Copy-Paste-Aarbecht maachen d'Ekippen méi lues a féieren zu vermeidbare Feeler." },
      { title: "Lues Clientereaktiounen", description: "Leads a Supportufroe waarden ze laang, wann d'Ekippen op Inboxen a fragmentéiert Tools vertrauen." },
      { title: "Net verbonnen Systemer", description: "CRM, E-Mail, Formulairen, intern Tools an Datebanken schaffen dacks net wéi ee gemeinsame Betribssystem." },
      { title: "Manuell Dateagab", description: "Teams verléieren Zäit domat, Dokumenter ze verréckelen an déi selwecht Informatioun nei anzeginn." },
      { title: "Workflow-Engpäss", description: "Kritesch Prozesser briechen ënner Wuesstem, wann se net op Vitesse a Kloerheet nei opgebaut ginn." },
      { title: "Wuessen ouni Struktur", description: "Méi Volumen soll net automatesch méi Leit, méi Inboxen a méi Reiwung bedeiten." },
    ],
    solutionCards: [
      { title: "KI-Workflow-Automatiséierung", summary: "Automatiséiert widderhuelend Business-Prozesser iwwer Formulairen, Geneemegungen an intern Workflows.", outcome: "Manner manuell Aarbecht a méi séier Operatiounen.", fit: "Ideal fir Ekippen mat widderhuelende Schrëtt a Backoffice-Aarbecht." },
      { title: "KI-Clientekommunikatioun", summary: "Setzt KI-Assistenten an fir Support, Lead-Qualifikatioun, FAQen an Client-Onboarding.", outcome: "Méi séier Äntwerten a manner Kommunikatiounslaascht.", fit: "Ideal fir Sales-, Support-, Onboarding- a Service-Ekippen." },
      { title: "Integratioun vu Business-Systemer", summary: "Verbind CRM, E-Mail, Formulairen, intern Tools, Datebanken an APIs an effizienten Workflows.", outcome: "Manner manuell Iwwergaben a manner zerstéckelt Operatiounen.", fit: "Ideal fir Betriber mat net verbonnen Tools oder manuellem Datefloss." },
      { title: "Intern KI-Wëssenssystemer", summary: "Gitt den Teams sécher KI-Assistenten a kontrolléierten Zougang zum Firmenwëssen.", outcome: "Méi séieren Zougang zu Informatioun a besser Entscheedungshëllef.", fit: "Ideal fir Operations, Support, HR an interdisziplinär Teams." },
      { title: "Prozessoptimiséierung", summary: "Analyséiert a verbessert Workflows virun oder nieft der Automatiséierung, sou datt de System wierklech zum Betrib passt.", outcome: "Méi effikass a méi nohalteg Automatiséierungen.", fit: "Ideal fir PMEen, déi hir Workflows virun der Ëmsetzung schäerfe wëllen." },
    ],
    consultingSection: {
      title: "Berodung déi Automatiséierungsiddi an Handlung ëmsetzt",
      intro: "Berodung ënnerstëtzt d'Haaptoffer: KI-Automatiséierungssystemer ze designen an ëmzesetzen, déi d'Operatioune verbesseren.",
      detail: "Mir benotzen Berodung, fir Prioritéiten ze schäerfen, déi richteg Systemer ze validéieren an en Ëmsetzungs- oder Optimisatiounsprojet virzebereeden.",
      offerings: ["Gratis Automatiséierungs-Audit", "KI-Readiness-Bewäertung", "Entdeckung vun Automatiséierungs-Opportunitéiten", "Workflow- a Prozess-Review", "Berodung fir Integratiounsarchitektur", "Ëmsetzungs-Roadmap"],
      deliverables: ["Analys vum aktuelle Prozess", "Automatiséierungs-Opportunitéiten", "Recommandatioune fir Tools an Integratiounen", "Léisungsarchitektur", "Ëmsetzungsplang"],
      cta: "Schwätzt mat eis iwwer Äre Workflow",
    },
    featureBenefits: [
      { title: "Website-Chatbots", benefit: "Fänkt Leads op a beäntwert heefeg Froen ouni zousätzlech Inbox-Laascht." },
      { title: "Privat KI-Assistenten", benefit: "Gitt den Teams méi séieren Zougang zu zouverléissegen internen Informatiounen." },
      { title: "Wëssenssystemer fir Admin", benefit: "Halt KI-Äntwerten aktuell duerch kontrolléiert Betribswëssen." },
      { title: "APIs a Webhooks", benefit: "Beweegt Informatioun tëscht Tools ouni manuell Iwwerdroung oder Brëch." },
      { title: "CRM-Integratiounen", benefit: "Halt Clientedonnéeën synchron a benotzbar iwwer all Touchpoint." },
      { title: "Automatiséierungsplattformen", benefit: "Start séier praktesch Workflows a baut se aus, wann d'Operatiounen méi reif ginn." },
    ],
    useCases: [
      { title: "KI-Support-Assistent", problem: "Support-Ekippe verléieren Zäit domat, ëmmer nees déi selwecht Froen iwwer verschidde Kanäl ze beäntweren.", solution: "Setzt en KI-Assistent an, deen FAQen, Support-Triage an Äntwert-Hëllef mat kloere Eskalatiounsreegele mécht.", teaser: "FAQen a Support-Triage ofhuelen, ier eng Persoun iwwerhuele muss.", outcome: "Méi séier Äntwerten a manner Kommunikatiounslaascht.", industries: "Service-Ekippen, SaaS, professionell Déngschtleeschtungen, intern Helpdesks", tools: "Website, Helpdesk, intern Wissensbasis" },
      { title: "Koordinatioun vu Immobilienufroen a Visitten", problem: "Immobilien-Ekippe verléieren Zäit mat widderhuelende Froen, Disponibilitéiten a Visittekoordinatioun.", solution: "Benotzt KI-gestëtzte Chat- a Workflow-Routing fir Froen ze beäntweren, Preferenzen opzehuelen an Kalenneren ze synchroniséieren.", teaser: "Heefeg Immobilienfroen beäntweren a Visitten ouni Inbox-Hanneraus koordinéieren.", outcome: "Méi séier Beaarbechtung vun Ufroen a besser Koordinatioun.", industries: "Immobilienagencen, Promoteuren, Locatiouns-Ekippen, Relocation-Servicer", tools: "Website-Chat, E-Mail, CRM, Kalenneren, Formulairen" },
      { title: "Automatiséiert Client-Onboarding", problem: "D'Iwwergab vun neie Clienten ass onkonsistent a voller widderhuelender manuelle Schrëtt.", solution: "Automatiséiert Intake, Dokumentsammlung, Statusnotifikatiounen an Onboarding-Workflows iwwer déi ganz Clienterees.", teaser: "Intake, Dokumenter a Statusupdates am Onboarding automatiséieren.", outcome: "Méi glat Onboarding-Prozesser a manner operativ Verspéidungen.", industries: "Professionell Déngschtleeschtungen, Finanzen, operationell PMEen", tools: "Formulairen, E-Mail, CRM, intern Workflows" },
      { title: "Automatiséiert CRM-Nofolleg", problem: "Wichteg Nofolleg-Aktioune ginn iwwersinn, wann Updates vu manuelle Schrëtt ofhänken.", solution: "Léist Erënnerungen, Phase-Updates an Aufgaben automatesch aus Business-Eventer aus.", teaser: "Erënnerungen an nächst Schrëtt aus richtege Business-Eventer ausléisen.", outcome: "Besser Follow-up-Disziplin a manner Administratiounsdrag.", industries: "Sales-Ekippen, Service-Betriber, Account Management", tools: "CRM, E-Mail, Notifikatiounen, Dashboards" },
      { title: "Intelligent Termin- a Buchungsautomatiséierung", problem: "Manuell Terminplanung kascht Zäit a schaaft Konflikter oder ongläich Belaaschtung.", solution: "Benotzt KI-gestëtzte Routing, Kalenner-Sync, Geneemegungen a Bufferen fir méi propper Buchungsabläif.", teaser: "Buchungen iwwer Kalenneren, Geneemegungen a Bufferen ouni manuell Planung steieren.", outcome: "Méi séier Terminplanung a besser Lastverdeelung.", industries: "Berodung, Kliniken, intern Ekippen, Service-Betriber", tools: "Kalenneren, Geneemegungen, Buchungs-Workflows" },
      { title: "Dokument- a Rechnungsveraarbechtung", problem: "Teams verbréngen ze vill Zäit domat, Daten erauszeliesen an Dokumenter tëscht Systemer ze verréckelen.", solution: "Automatiséiert Intake, Extraktioun, Kategoriséierung, Validatioun an d'Weiderleedung vun operationelle Dokumenter.", teaser: "Dokumenter ouni widderhuelend manuell Neiagab extrahéieren, validéieren a weiderleeden.", outcome: "Manner manuell Veraarbechtung a méi propper Dossieren.", industries: "Finanzen, Operations, Logistik, Administratioun", tools: "E-Mail, OCR-Flows, Geneemegungsschrëtt, ERP oder Comptabilitéit" },
      { title: "Interne Wissensassistent", problem: "Mataarbechter verléieren Zäit beim Sich no Äntwerten an Dokumenter, Inboxen an informellem Wëssen.", solution: "Schaaft e sécheren internen Assistent, deen u freigegebenem Betribswëssen an Teamprozesser ugeschloss ass.", teaser: "Den Teams sécheren KI-Zougang zu approuvéierte Wëssen ginn.", outcome: "Méi séier Entscheedungen a méi konsequent intern Ënnerstëtzung.", industries: "Operations, HR, Support, intern Enablement", tools: "Wissensbasis, Zougrëffskontrollen, intern Portaler" },
      { title: "Notifikatiounen a Geneemegungen iwwer Systemer", problem: "Geneemegungs-Schleifen a Statusupdates stockéieren, wann Teams op E-Mail-Ketten a manuell Nofro ugewisen sinn.", solution: "Orchestréiert Geneemegungen, Notifikatiounen a Business-Regelen iwwer d'Tools, déi Är Ekippe schonn benotzen.", teaser: "Geneemegungen a Statusupdates iwwer verbonne Tools am Flux halen.", outcome: "Méi Visibilitéit a manner blockéiert Workflows.", industries: "Operations, Finanzen, HR, Projet-Delivery", tools: "E-Mail, Chat, CRM, intern Systemer, Webhooks" },
    ],
    processSteps: [
      { step: "Analyséieren", duration: "3-5 Deeg", description: "De aktuelle Workflow verstoen, Engpäss erkennen an déi bescht Automatiséierungs-Opportunitéiten definéieren.", points: ["Workflow-Mapping", "Review vu Tools an Donnéeën", "Definitioun vum Prioritéits-Use-Case", "Shortlist vun Opportunitéiten"], outputs: ["Workflow-Iwwersiicht", "Automatiséierungs-Shortlist"] },
      { step: "Entwërfen", duration: "1-2 Wochen", description: "Business-Bedierfnesser an eng praktesch Automatiséierungsarchitektur iwwersetzen.", points: ["Léisungsarchitektur", "Tool-Auswiel", "Business-Regelen a Routing-Logik", "Ëmsetzungsplang"], outputs: ["Léisungs-Blueprint", "Delivery-Plang"] },
      { step: "Bauen", duration: "2-6 Wochen", description: "Workflows ëmsetzen, KI-Systemer konfiguréieren an d'Tools verbannen, déi zesummeschaffe mussen.", points: ["Workflow-Setup", "Konfiguratioun vum KI-Assistent", "API- a Systemintegratioun", "Tester an Iwwergab"], outputs: ["Live-Workflow", "Verbonnen Systemer"] },
      { step: "Optimiséieren", duration: "2-4 Wochen", description: "Leeschtung moossen, de Flow verfeineren an d'Business-Resultater verbesseren, wann de System live ass.", points: ["Monitoring a Feedback", "Workflow-Verfeinerung", "Verbesserung vun der Äntwertqualitéit", "Operative Reporting"], outputs: ["Performance-Review", "Verbesserungs-Backlog"] },
      { step: "Betreien", duration: "Monatlech", description: "Weider Ënnerstëtzung fir Betriber, déi Monitoring, Verbesserungen an nei Ufroe brauchen.", points: ["Maintenance a Support", "Nei Automatiséierungsufroen", "System-Updates", "Kontinuéierlech Optimiséierung"], outputs: ["Monitoring-Rhythmus", "Support-Queue"] },
    ],
    teamMembers: [
      { role: "Grënner & CEO", bio: "Leet d'Delivery-Strategie iwwer KI-Automatiséierung, Business-Systemer an Integratiounsarchitektur mat Fokus op praktesch Resultater.", tags: ["KI-Systemer", "Workflow-Automatiséierung", "MuleSoft Certified Integration Professional", "Berodung"] },
      { role: "Co-Founder & Integratiounsingenieur", bio: "Designt a baut zouverléisseg Integratiounsschichten, Automatiséierungsarchitekturen a verbonne operationell Systemer.", tags: ["APIs", "Integratiounen", "Automatiséierungsarchitektur", "Systemplanung"] },
      { role: "Full-Stack & KI-Léisungsentwéckler", bio: "Baut praktesch KI-Uwendungen, intern Tools a Workflow-Systemer fir sécher a skaléierbar Delivery.", tags: ["KI-Uwendungen", "Full-Stack Delivery", "Cloud-Systemer", "Intern Tools"] },
    ],
    platformCards: [
      { title: "CRM- a Pipeline-Workflows", description: "Verbind Lead-Capture, Qualifikatioun, Follow-up an internt Routing an engem operationelle Flow." },
      { title: "Systemer fir Clientekommunikatioun", description: "Verknëpp Chat, E-Mail, FAQen a Support-Handoffs fir méi séier a méi konsequent Kommunikatioun." },
      { title: "Intern Tools a Datebanken", description: "Beweegt Informatioun tëscht Dashboards, Formulairen, Dateien an internen Systemer ouni Copy-Paste." },
      { title: "Websites a Portaler prett fir Automatiséierung", description: "Maacht aus ëffentleche Websites a Client-Portaler en Deel vum Business-Workflow an net just statesch Säiten." },
    ],
    businessFit: [
      "PMEen mat vill repetitiver Admin-Aarbecht",
      "Ekippen mat net verbonnen Business-Tools",
      "Service-Betriber mat wuessender Clientekommunikatioun",
      "Operations-Leads, déi méi Workflow-Kloerheet brauche virum Skaléieren",
    ],
    credibilityPoints: [
      "Zu Lëtzebuerg baséiert a fokusséiert op praktesch Ëmsetzung",
      "Automation-first Delivery mat Berodung do wou se Wäert bréngt",
      "Opgebaut ronderëm Business-Workflows, Integratiounen a moossbar nächst Schrëtt",
      "Geduecht fir Ëmsetzungsprojeten a weider Optimiséierungsretainer",
    ],
  },
};

function mergeItemsByIndex<T extends object, U extends object>(
  base: readonly T[],
  overrides?: readonly U[],
) {
  return base.map((item, index) => ({
    ...item,
    ...(overrides?.[index] ?? {}),
  })) as Array<T & U>;
}

export function getLocalizedMarketingSharedContent(lang: AppLanguage) {
  const locale = sharedLocaleOverrides[lang] ?? {};

  return {
    painPoints: mergeItemsByIndex(basePainPoints, locale.painPoints),
    solutionCards: mergeItemsByIndex(baseSolutionCards, locale.solutionCards),
    consultingSection: {
      ...baseConsultingSection,
      ...locale.consultingSection,
      offerings:
        locale.consultingSection?.offerings ?? [...baseConsultingSection.offerings],
      deliverables:
        locale.consultingSection?.deliverables ??
        [...baseConsultingSection.deliverables],
    },
    featureBenefits: mergeItemsByIndex(
      baseFeatureBenefits,
      locale.featureBenefits,
    ),
    useCases: mergeItemsByIndex(baseUseCases, locale.useCases),
    processSteps: mergeItemsByIndex(baseProcessSteps, locale.processSteps),
    teamMembers: mergeItemsByIndex(baseTeamMembers, locale.teamMembers),
    platformCards: mergeItemsByIndex(basePlatformCards, locale.platformCards),
    businessFit: locale.businessFit ?? [...baseBusinessFit],
    credibilityPoints: locale.credibilityPoints ?? [...baseCredibilityPoints],
  };
}
