import type { AppLanguage } from "@/lib/i18n";

export type ServiceCard = {
  icon: string;
  title: string;
  outcome: string;
  bullets: [string, string, string];
  example: string;
  result: string;
  deliverables: string[];
};

export type InfoCard = {
  icon: string;
  title: string;
  body: string;
};

export type ProcessSummaryStep = {
  title: string;
  duration: string;
  body: string;
  outputs: [string, string];
};

export type HomePageCopy = {
  hero: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    proofLine: [string, string, string, string];
    urgency: string;
    primary: string;
    secondary: string;
    visualBadge: string;
    visualTitle: string;
    visualAlt: string;
    visualFlow: string[];
    visualMetricLabel: string;
    visualMetricValue: string;
    visualStatus: string;
    visualOverlay: string;
  };
  proof: {
    eyebrow: string;
    title: string;
    body: string;
    cards: [InfoCard, InfoCard, InfoCard];
  };
  services: {
    eyebrow: string;
    title: string;
    body: string;
    deliverablesLabel: string;
    exampleLabel: string;
    resultLabel: string;
    items: [ServiceCard, ServiceCard, ServiceCard];
  };
  why: {
    eyebrow: string;
    title: string;
    body: string;
    items: [InfoCard, InfoCard, InfoCard, InfoCard];
  };
  deliverables: {
    eyebrow: string;
    title: string;
    body: string;
    items: [InfoCard, InfoCard, InfoCard, InfoCard, InfoCard];
  };
  example: {
    eyebrow: string;
    title: string;
    body: string;
    tag: string;
    imageAlt: string;
    imagePill: string;
    bullets: [string, string, string, string];
    note: string;
  };
  process: {
    title: string;
    body: string;
    steps: [ProcessSummaryStep, ProcessSummaryStep, ProcessSummaryStep];
    primary: string;
    secondary: string;
  };
  final: {
    eyebrow: string;
    title: string;
    body: string;
    urgency: string;
    primary: string;
    secondary: string;
  };
};

const englishCopy: HomePageCopy = {
  hero: {
    eyebrow: "AI Automation Systems & Consulting for SMEs",
    headline:
      "Automate SME operations with AI-powered workflows.",
    subheadline:
      "We design and implement AI systems that streamline client communication, connect business tools, and bring operational clarity through intelligent automation.",
    proofLine: [
      "GDPR-first",
      "Integration-focused",
      "Custom systems",
      "No vendor lock-in",
    ],
    urgency: "Built for SMEs and growing businesses in Luxembourg and Europe.",
    primary: "Get a Free Audit",
    secondary: "Explore Solutions",
    visualBadge: "Live system view",
    visualTitle:
      "Workflow routing, AI decision logic, and dashboard visibility in one operating system.",
    visualAlt: "Workflow automation dashboard preview",
    visualFlow: [
      "Website form or chatbot captures the request",
      "AI qualifies, tags, and routes the next step",
      "Automation updates CRM, inbox, or internal tool",
      "Dashboard keeps the team aligned on status",
    ],
    visualMetricLabel: "Connected stack",
    visualMetricValue: "CRM + Email + WhatsApp + Dashboard",
    visualStatus: "AI routing active",
    visualOverlay:
      "The system can qualify, route, update records, and keep the team aligned in one operating view.",
  },
  proof: {
    eyebrow: "Example system result",
    title: "One connected flow from request to next action.",
    body:
      "A typical Lux AI delivery can capture a lead or support request, let AI triage it, trigger the right workflow, update the CRM, and surface status in a dashboard without inbox ping-pong.",
    cards: [
      {
        icon: "ri-inbox-archive-line",
        title: "Request captured",
        body: "Chatbot, form, or inbox entry starts the workflow cleanly.",
      },
      {
        icon: "ri-robot-2-line",
        title: "AI decides next step",
        body: "Qualification, routing, and handoff happen automatically.",
      },
      {
        icon: "ri-bar-chart-grouped-line",
        title: "Team sees status",
        body: "Dashboard, owner, and follow-up stay visible to operations.",
      },
    ],
  },
  services: {
    eyebrow: "Services",
    title: "What we actually deliver",
    body:
      "Practical AI systems that automate operations and improve business workflows.",
    deliverablesLabel: "Deliverables",
    exampleLabel: "Example",
    resultLabel: "Result",
    items: [
      {
        icon: "ri-flow-chart",
        title: "AI Workflow Automation",
        outcome:
          "Fewer manual steps across approvals, admin work, and follow-up.",
        bullets: [
          "Map the current flow and remove avoidable bottlenecks",
          "Automate rules, reminders, approvals, and handoffs",
          "Keep human review where exceptions really matter",
        ],
        example: "Invoice approvals, onboarding flows, or internal requests",
        result:
          "Teams move faster with less copy-paste and fewer missed steps.",
        deliverables: [
          "Workflow map",
          "Automation logic",
          "Approval rules",
          "Exception paths",
        ],
      },
      {
        icon: "ri-message-3-line",
        title: "AI Client Communication Systems",
        outcome: "Faster response times without adding inbox load.",
        bullets: [
          "Website or portal chatbot for FAQs and lead capture",
          "AI-assisted triage for support and inbound enquiries",
          "Escalation rules into email, CRM, or human follow-up",
        ],
        example: "Lead qualification, support intake, or multilingual FAQs",
        result:
          "Communication becomes more consistent and the next action is clearer.",
        deliverables: [
          "Chat flows",
          "Knowledge setup",
          "Routing rules",
          "Conversation analytics",
        ],
      },
      {
        icon: "ri-database-2-line",
        title: "Integrations & Operational Dashboards",
        outcome: "Cleaner data flow and better visibility across tools.",
        bullets: [
          "Connect CRM, email, WhatsApp, ERP, forms, and APIs",
          "Eliminate manual re-entry between disconnected systems",
          "Give teams dashboards for status, workload, and exceptions",
        ],
        example: "CRM updates from chatbot conversations or booking workflows",
        result:
          "You get one operating picture instead of fragmented tools.",
        deliverables: [
          "System integrations",
          "Data sync rules",
          "Dashboard views",
          "Operational reporting",
        ],
      },
    ],
  },
  why: {
    eyebrow: "Why Lux AI",
    title: "Built for real business operations",
    body:
      "Practical automation should improve clarity, reliability, and everyday execution across the business.",
    items: [
      {
        icon: "ri-layout-grid-line",
        title: "Usable systems",
        body: "Built for real workflows and day-to-day execution, not just demos.",
      },
      {
        icon: "ri-line-chart-line",
        title: "Scalable automation",
        body: "Designed to support growth without adding more manual coordination.",
      },
      {
        icon: "ri-dashboard-3-line",
        title: "Clear visibility",
        body: "Dashboards and structured flows make status and next actions easier to manage.",
      },
      {
        icon: "ri-links-line",
        title: "Reliable integrations",
        body: "Stable system connections reduce friction, re-entry, and missed handoffs.",
      },
    ],
  },
  deliverables: {
    eyebrow: "What you get",
    title: "A usable automation system, not just advice",
    body:
      "We combine validation, design, implementation, and support to turn automation ideas into working business systems.",
    items: [
      {
        icon: "ri-search-eye-line",
        title: "Validation",
        body: "We identify practical automation opportunities worth solving first.",
      },
      {
        icon: "ri-draft-line",
        title: "Design",
        body: "We define workflow logic, structure, and the right system architecture.",
      },
      {
        icon: "ri-tools-line",
        title: "Implementation",
        body: "We build and connect the automation systems your business actually needs.",
      },
      {
        icon: "ri-loop-right-line",
        title: "Evolution",
        body: "We improve workflows over time as your needs and volume grow.",
      },
      {
        icon: "ri-customer-service-2-line",
        title: "Support",
        body: "We maintain and optimize systems after launch so they stay useful.",
      },
    ],
  },
  example: {
    eyebrow: "Example system",
    title:
      "Example: Smart appointment automation",
    body:
      "We design systems that automatically schedule, match, and manage appointments using business rules and workflow logic.",
    tag: "Example workflow block",
    imageAlt: "Scheduling workflow example interface",
    imagePill: "Live example",
    bullets: [
      "Calendar synchronization",
      "Intelligent matching",
      "Load balancing",
      "Approval workflows",
    ],
    note:
      "This is one workflow example inside a broader automation offer covering systems, communication, dashboards, and consulting.",
  },
  process: {
    title: "A clear path from audit to working system",
    body:
      "Start with the free audit, confirm the right workflow, then move into design, build, and optimization with a defined next step.",
    steps: [
      {
        title: "Assess",
        duration: "3-5 days",
        body: "We review the workflow, map friction points, and define the best automation entry point first.",
        outputs: ["Workflow map", "Priority shortlist"],
      },
      {
        title: "Design and build",
        duration: "2-6 weeks",
        body: "We design the operating flow, connect the tools, and build the automation logic into a usable system.",
        outputs: ["System blueprint", "Connected workflow"],
      },
      {
        title: "Launch and improve",
        duration: "Ongoing",
        body: "We test, monitor, and refine the live system so the team keeps control as the workflow matures.",
        outputs: ["Live handover", "Optimization plan"],
      },
    ],
    primary: "Get a Free Audit",
    secondary: "See How It Works",
  },
  final: {
    eyebrow: "Next step",
    title: "Start with a free automation audit",
    body:
      "We analyze your workflows and identify practical AI automation opportunities for your business.",
    urgency:
      "You leave with a clearer workflow priority and practical next steps.",
    primary: "Get a Free Audit",
    secondary: "Explore Solutions",
  },
};

const frenchCopy: HomePageCopy = {
  hero: {
    eyebrow: "Systemes d'automatisation IA pour PME",
    headline:
      "Automatisation IA pour des operations PME plus fluides.",
    subheadline:
      "Nous concevons, construisons et integrons des systemes IA dans vos outils existants pour reduire le travail manuel, accelerer les reponses et donner une vraie visibilite operationnelle a l'equipe.",
    proofLine: [
      "Conforme au RGPD",
      "Oriente integration",
      "Systemes sur mesure",
      "Sans verrouillage fournisseur",
    ],
    urgency: "Nombre de creneaux d'onboarding limite ce mois-ci.",
    primary: "Obtenir un audit d'automatisation",
    secondary: "Voir le fonctionnement",
    visualBadge: "Vue systeme en direct",
    visualTitle:
      "Routage workflow, logique IA et visibilite dashboard dans un seul systeme.",
    visualAlt: "Apercu d'un dashboard d'automatisation",
    visualFlow: [
      "Le formulaire ou chatbot capture la demande",
      "L'IA qualifie et route la bonne suite",
      "L'automatisation met a jour CRM, inbox ou outil interne",
      "Le dashboard garde l'equipe alignee sur le statut",
    ],
    visualMetricLabel: "Stack connecte",
    visualMetricValue: "CRM + Email + WhatsApp + Dashboard",
    visualStatus: "Routage IA actif",
    visualOverlay:
      "Le systeme peut qualifier, router, mettre a jour les donnees et garder l'equipe alignee dans une seule vue operationnelle.",
  },
  proof: {
    eyebrow: "Resultat d'un systeme exemple",
    title: "Un seul flux connecte, de la demande a l'action suivante.",
    body:
      "Une implementation type Lux AI peut capter un lead ou une demande support, laisser l'IA trier, declencher le bon workflow, mettre a jour le CRM et afficher le statut dans un dashboard sans aller-retour inutile par inbox.",
    cards: [
      {
        icon: "ri-inbox-archive-line",
        title: "Demande captee",
        body: "Le chatbot, le formulaire ou l'inbox demarre le workflow proprement.",
      },
      {
        icon: "ri-robot-2-line",
        title: "L'IA decide la suite",
        body: "Qualification, routage et handoff se font automatiquement.",
      },
      {
        icon: "ri-bar-chart-grouped-line",
        title: "L'equipe voit le statut",
        body: "Dashboard, responsable et suivi restent visibles pour les operations.",
      },
    ],
  },
  services: {
    eyebrow: "Services",
    title: "Ce que nous livrons concretement",
    body:
      "Trois couches couvrent l'essentiel des besoins d'automatisation des PME : workflows, communication et operations connectees.",
    deliverablesLabel: "Livrables",
    exampleLabel: "Exemple",
    resultLabel: "Resultat",
    items: [
      {
        icon: "ri-flow-chart",
        title: "Automatisation IA des workflows",
        outcome:
          "Moins d'etapes manuelles dans les validations, l'admin et les relances.",
        bullets: [
          "Cartographier le flux actuel et retirer les blocages evitables",
          "Automatiser regles, rappels, validations et handoffs",
          "Garder une revue humaine la ou les exceptions comptent",
        ],
        example:
          "Validation de factures, onboarding client ou demandes internes",
        result:
          "Les equipes avancent plus vite avec moins de copier-coller et moins d'etapes oubliees.",
        deliverables: [
          "Carte du workflow",
          "Logique d'automatisation",
          "Regles de validation",
          "Parcours d'exception",
        ],
      },
      {
        icon: "ri-message-3-line",
        title: "Systemes IA de communication client",
        outcome:
          "Des reponses plus rapides sans charger davantage les inbox.",
        bullets: [
          "Chatbot site ou portail pour FAQ et capture de leads",
          "Triage assiste par IA pour support et demandes entrantes",
          "Escalade vers email, CRM ou suivi humain quand necessaire",
        ],
        example:
          "Qualification de leads, intake support ou FAQ multilingues",
        result:
          "La communication devient plus coherente et la prochaine action est plus claire.",
        deliverables: [
          "Flows conversationnels",
          "Base de connaissance",
          "Regles de routage",
          "Analytics conversationnels",
        ],
      },
      {
        icon: "ri-database-2-line",
        title: "Integrations & dashboards operationnels",
        outcome:
          "Des donnees plus propres et une meilleure visibilite entre les outils.",
        bullets: [
          "Connecter CRM, email, WhatsApp, ERP, formulaires et APIs",
          "Eliminer la ressaisie entre systemes deconnectes",
          "Donner a l'equipe une vue sur le statut, la charge et les exceptions",
        ],
        example:
          "Mises a jour CRM depuis des conversations chatbot ou des workflows de reservation",
        result:
          "Vous obtenez une vue operationnelle unique au lieu d'outils fragmentes.",
        deliverables: [
          "Integrations systemes",
          "Regles de synchronisation",
          "Vues dashboard",
          "Reporting operationnel",
        ],
      },
    ],
  },
  why: {
    eyebrow: "Pourquoi Lux AI",
    title: "Pense pour la clarte operationnelle, pas pour les demos flashy",
    body:
      "Le but est d'ameliorer le fonctionnement du business, pas d'ajouter une couche IA generique sur des processus casses.",
    items: [
      {
        icon: "ri-shield-check-line",
        title: "Conforme au RGPD",
        body: "Contexte business UE, controle d'acces et gestion plus propre des donnees operationnelles des le depart.",
      },
      {
        icon: "ri-links-line",
        title: "Oriente integration",
        body: "Nous connectons vos outils existants au lieu d'imposer des reconstructions inutiles.",
      },
      {
        icon: "ri-layout-grid-line",
        title: "Systemes sur mesure",
        body: "Les solutions sont concues autour de votre workflow, pas autour d'une bibliotheque de templates.",
      },
      {
        icon: "ri-door-lock-line",
        title: "Sans verrouillage fournisseur",
        body: "Vous recevez des livrables clairs, une logique documentee et un systeme que l'equipe peut comprendre et continuer a utiliser.",
      },
    ],
  },
  deliverables: {
    eyebrow: "Ce que vous obtenez",
    title: "Un systeme d'automatisation utilisable, pas seulement du conseil",
    body:
      "Chaque mission doit aboutir a un systeme metier fonctionnel que votre equipe peut reellement exploiter.",
    items: [
      {
        icon: "ri-flow-chart",
        title: "Flux de travail",
        body: "Des flux cartographies et redesignes avec une logique d'automatisation sur les etapes qui ne devraient plus etre manuelles.",
      },
      {
        icon: "ri-chat-1-line",
        title: "Assistant conversationnel",
        body: "Une experience IA cote client ou interne, connectee a une connaissance metier approuvee.",
      },
      {
        icon: "ri-plug-2-line",
        title: "Integrations",
        body: "Des connexions entre CRM, email, WhatsApp, ERP, formulaires, APIs ou systemes internes.",
      },
      {
        icon: "ri-dashboard-3-line",
        title: "Tableau de bord",
        body: "Une visibilite sur le statut, la charge, les exceptions et la prochaine action pour l'equipe.",
      },
      {
        icon: "ri-customer-service-2-line",
        title: "Accompagnement",
        body: "Handover, amelioration continue et support operationnel une fois le premier systeme live.",
      },
    ],
  },
  example: {
    eyebrow: "Systeme exemple",
    title:
      "La planification et l'automatisation des rendez-vous sont un exemple de workflow, pas l'offre entiere",
    body:
      "Si vous avez besoin de reservation, rappels, validations, paiements ou routage calendrier, nous pouvons l'integrer dans un systeme plus large. L'offre centrale reste l'automatisation sur mesure de votre activite.",
    tag: "Bloc workflow exemple",
    imageAlt: "Exemple d'interface de workflow de planification",
    imagePill: "Exemple en direct",
    bullets: [
      "Regles de disponibilite et de routage",
      "Automatisation des rappels et du suivi",
      "Mises a jour CRM ou dashboard",
      "Logique de validation ou de paiement si necessaire",
    ],
    note:
      "Prenez-le comme un exemple concret de la facon dont Lux AI construit des systemes connectes autour d'un vrai flux operationnel.",
  },
  process: {
    title: "Un chemin clair de l'audit au systeme live",
    body:
      "Commencez par l'audit gratuit, validez le bon workflow, puis passez a la conception, a l'implementation et a l'optimisation avec une prochaine etape definie.",
    steps: [
      {
        title: "Evaluer",
        duration: "3-5 jours",
        body: "Nous passons le workflow en revue, cartographions les blocages et definissons le meilleur point d'entree pour l'automatisation.",
        outputs: ["Carte du workflow", "Priorites utiles"],
      },
      {
        title: "Concevoir et construire",
        duration: "2-6 semaines",
        body: "Nous definissons le flux cible, connectons les outils et construisons une logique d'automatisation exploitable.",
        outputs: ["Blueprint du systeme", "Workflow connecte"],
      },
      {
        title: "Lancer et ameliorer",
        duration: "En continu",
        body: "Nous testons, surveillons et affinons le systeme live pour garder de la visibilite et du controle.",
        outputs: ["Mise en service", "Plan d'optimisation"],
      },
    ],
    primary: "Obtenir un audit d'automatisation",
    secondary: "Voir le fonctionnement",
  },
  final: {
    eyebrow: "Prochaine etape",
    title: "Commencez par un audit d'automatisation gratuit",
    body:
      "Nous passons en revue votre workflow actuel, identifions le meilleur point d'entree pour l'automatisation et cadrons ce que le premier systeme utile doit inclure.",
    urgency:
      "La disponibilite actuelle est limitee a un petit nombre de nouveaux onboardings.",
    primary: "Obtenir un audit d'automatisation",
    secondary: "Voir le fonctionnement",
  },
};

const germanCopy: HomePageCopy = {
  hero: {
    eyebrow: "KI-Automatisierungssysteme fuer KMU",
    headline:
      "KI-Automatisierung fuer reibungslosere KMU-Ablaeufe.",
    subheadline:
      "Wir konzipieren, bauen und integrieren KI-Systeme in Ihre bestehenden Tools, damit manuelle Arbeit sinkt, Reaktionszeiten besser werden und Teams klare operative Sicht bekommen.",
    proofLine: [
      "Datenschutz zuerst",
      "Integrationsfokus",
      "Massgeschneiderte Systeme",
      "Keine Anbieterbindung",
    ],
    urgency: "Die Onboarding-Kapazitaet ist diesen Monat begrenzt.",
    primary: "Kostenloses Automatisierungs-Audit",
    secondary: "So funktioniert's",
    visualBadge: "Live-Systemansicht",
    visualTitle:
      "Workflow-Routing, KI-Logik und Dashboard-Sichtbarkeit in einem Betriebssystem.",
    visualAlt: "Vorschau auf ein Workflow-Automatisierungs-Dashboard",
    visualFlow: [
      "Website-Formular oder Chatbot erfasst die Anfrage",
      "Die KI qualifiziert und routet den naechsten Schritt",
      "Die Automatisierung aktualisiert CRM, Postfach oder internes Tool",
      "Das Dashboard haelt das Team beim Status synchron",
    ],
    visualMetricLabel: "Verbundener Stack",
    visualMetricValue: "CRM + E-Mail + WhatsApp + Dashboard",
    visualStatus: "KI-Routing aktiv",
    visualOverlay:
      "Das System kann qualifizieren, routen, Datensaetze aktualisieren und das Team in einer gemeinsamen Sicht ausrichten.",
  },
  proof: {
    eyebrow: "Beispiel fuer ein Systemergebnis",
    title: "Ein verbundener Flow von der Anfrage bis zur naechsten Aktion.",
    body:
      "Eine typische Lux-AI-Delivery kann Lead- oder Supportanfragen erfassen, per KI triagieren, den passenden Workflow ausloesen, das CRM aktualisieren und den Status in einem Dashboard sichtbar machen.",
    cards: [
      {
        icon: "ri-inbox-archive-line",
        title: "Anfrage erfasst",
        body: "Chatbot, Formular oder Postfach startet den Workflow sauber.",
      },
      {
        icon: "ri-robot-2-line",
        title: "KI entscheidet den naechsten Schritt",
        body: "Qualifizierung, Routing und Handoff laufen automatisch.",
      },
      {
        icon: "ri-bar-chart-grouped-line",
        title: "Das Team sieht den Status",
        body: "Dashboard, Verantwortlicher und Nachverfolgung bleiben fuer Operations sichtbar.",
      },
    ],
  },
  services: {
    eyebrow: "Leistungen",
    title: "Was wir tatsaechlich liefern",
    body:
      "Drei Systemschichten decken die meisten Automatisierungsbeduerfnisse von KMU ab: Workflows, Kommunikation und verbundene Ablaeufe.",
    deliverablesLabel: "Lieferumfang",
    exampleLabel: "Beispiel",
    resultLabel: "Ergebnis",
    items: [
      {
        icon: "ri-flow-chart",
        title: "KI-Workflow-Automatisierung",
        outcome:
          "Weniger manuelle Schritte bei Freigaben, Admin-Arbeit und Follow-up.",
        bullets: [
          "Bestehenden Ablauf erfassen und vermeidbare Engpaesse entfernen",
          "Regeln, Erinnerungen, Freigaben und Handoffs automatisieren",
          "Menschliche Pruefung dort lassen, wo Ausnahmen wichtig sind",
        ],
        example:
          "Rechnungsfreigaben, Kunden-Onboarding oder interne Anfragen",
        result:
          "Teams arbeiten schneller mit weniger Copy-Paste und weniger ausgelassenen Schritten.",
        deliverables: [
          "Workflow-Uebersicht",
          "Automatisierungslogik",
          "Freigaberegeln",
          "Ausnahmepfade",
        ],
      },
      {
        icon: "ri-message-3-line",
        title: "KI-Systeme fuer Kundenkommunikation",
        outcome:
          "Schnellere Reaktionszeiten ohne zusaetzliche Inbox-Last.",
        bullets: [
          "Website- oder Portal-Chatbot fuer FAQs und Lead-Erfassung",
          "KI-gestuetzte Triage fuer Support und eingehende Anfragen",
          "Eskalationsregeln in E-Mail, CRM oder menschliches Follow-up",
        ],
        example:
          "Lead-Qualifizierung, Support-Intake oder mehrsprachige FAQs",
        result:
          "Kommunikation wird konsistenter und die naechste Aktion klarer.",
        deliverables: [
          "Chat-Ablaufe",
          "Wissensaufbau",
          "Routing-Regeln",
          "Gespraechsanalysen",
        ],
      },
      {
        icon: "ri-database-2-line",
        title: "Integrationen & operative Dashboards",
        outcome:
          "Sauberer Datenfluss und bessere Sichtbarkeit zwischen Ihren Tools.",
        bullets: [
          "CRM, E-Mail, WhatsApp, ERP, Formulare und APIs verbinden",
          "Manuelle Neueingaben zwischen getrennten Systemen eliminieren",
          "Dashboards fuer Status, Auslastung und Ausnahmen bereitstellen",
        ],
        example:
          "CRM-Updates aus Chatbot-Gespraechen oder Buchungs-Workflows",
        result:
          "Sie erhalten ein Gesamtbild statt fragmentierter Einzeltools.",
        deliverables: [
          "Systemintegrationen",
          "Sync-Regeln",
          "Dashboard-Ansichten",
          "Operatives Reporting",
        ],
      },
    ],
  },
  why: {
    eyebrow: "Warum Lux AI",
    title: "Gebaut fuer operative Klarheit, nicht fuer Show-Demos",
    body:
      "Es geht darum, das Geschaeft besser funktionieren zu lassen, nicht nur eine generische KI-Schicht auf fehlerhafte Prozesse zu setzen.",
    items: [
      {
        icon: "ri-shield-check-line",
        title: "Datenschutz zuerst",
        body: "EU-Business-Kontext, Zugriffskontrolle und sauberer Umgang mit operativen Daten von Anfang an.",
      },
      {
        icon: "ri-links-line",
        title: "Integrationsfokus",
        body: "Wir verbinden bestehende Systeme statt unnoetige Neuaufbauten zu erzwingen.",
      },
      {
        icon: "ri-layout-grid-line",
        title: "Massgeschneiderte Systeme",
        body: "Die Loesung wird um Ihren Workflow herum gebaut, nicht um eine Template-Bibliothek.",
      },
      {
        icon: "ri-door-lock-line",
        title: "Keine Anbieterbindung",
        body: "Sie erhalten klaren Lieferumfang, dokumentierte Logik und Systeme, die Ihr Team weiter nutzen kann.",
      },
    ],
  },
  deliverables: {
    eyebrow: "Was Sie bekommen",
    title: "Ein nutzbares Automatisierungssystem, nicht nur Beratung",
    body:
      "Jede Zusammenarbeit soll in einem funktionierenden Geschaeftssystem enden, das Ihr Team wirklich einsetzen kann.",
    items: [
      {
        icon: "ri-flow-chart",
        title: "Ablaeufe",
        body: "Abgebildete und neu gestaltete Ablaeufe mit Automatisierungslogik fuer die Schritte, die nicht mehr manuell sein sollten.",
      },
      {
        icon: "ri-chat-1-line",
        title: "Chat-Assistent",
        body: "Kunden- oder interne KI-Chats, verbunden mit freigegebenem Geschaeftswissen.",
      },
      {
        icon: "ri-plug-2-line",
        title: "Integrationen",
        body: "Verbindungen ueber CRM, E-Mail, WhatsApp, ERP, Formulare, APIs oder interne Systeme hinweg.",
      },
      {
        icon: "ri-dashboard-3-line",
        title: "Uebersicht",
        body: "Sichtbarkeit fuer Status, Last, Ausnahmen und die naechste Aktion im Team.",
      },
      {
        icon: "ri-customer-service-2-line",
        title: "Begleitung",
        body: "Handover, Verfeinerung und operative Unterstuetzung, sobald das erste System live ist.",
      },
    ],
  },
  example: {
    eyebrow: "Beispielsystem",
    title:
      "Termin- und Buchungsautomatisierung ist ein Workflow-Beispiel, nicht das gesamte Angebot",
    body:
      "Wenn Sie Buchung, Erinnerungen, Freigaben, Zahlungen oder Kalender-Routing brauchen, bauen wir das in ein breiteres Betriebssystem ein. Das Kernangebot bleibt individuelle Automatisierung fuer Ihr Business.",
    tag: "Beispiel-Workflow-Block",
    imageAlt: "Beispiel einer Scheduling-Workflow-Oberflaeche",
    imagePill: "Live-Beispiel",
    bullets: [
      "Verfuegbarkeits- und Routing-Regeln",
      "Erinnerungs- und Nachverfolgungs-Automatisierung",
      "CRM- oder Dashboard-Updates",
      "Freigabe- oder Zahlungslogik bei Bedarf",
    ],
    note:
      "Sehen Sie es als ein konkretes Beispiel dafuer, wie Lux AI vernetzte Systeme um einen echten operativen Ablauf baut.",
  },
  process: {
    title: "Ein klarer Weg vom Audit zum live arbeitenden System",
    body:
      "Starten Sie mit dem kostenlosen Audit, bestaetigen Sie den richtigen Workflow und gehen Sie dann in Design, Umsetzung und Optimierung mit klar definiertem naechsten Schritt.",
    steps: [
      {
        title: "Analysieren",
        duration: "3-5 Tage",
        body: "Wir prüfen den Workflow, machen Reibung sichtbar und bestimmen den besten Einstieg in die Automatisierung.",
        outputs: ["Workflow-Uebersicht", "Prioritaetenliste"],
      },
      {
        title: "Konzipieren und umsetzen",
        duration: "2-6 Wochen",
        body: "Wir entwerfen den Zielablauf, verbinden die Systeme und bauen die Automatisierungslogik in einen nutzbaren Flow.",
        outputs: ["Systemkonzept", "Vernetzter Ablauf"],
      },
      {
        title: "Starten und verbessern",
        duration: "Laufend",
        body: "Wir testen, überwachen und verfeinern das Live-System, damit das Team Kontrolle und Sichtbarkeit behaelt.",
        outputs: ["Go-live-Uebergabe", "Optimierungsplan"],
      },
    ],
    primary: "Kostenloses Automatisierungs-Audit",
    secondary: "So funktioniert's",
  },
  final: {
    eyebrow: "Naechster Schritt",
    title: "Starten Sie mit einem kostenlosen Automatisierungs-Audit",
    body:
      "Wir pruefen Ihren aktuellen Workflow, identifizieren den besten Einstiegspunkt fuer Automatisierung und definieren, was das erste nuetzliche System enthalten sollte.",
    urgency:
      "Aktuell sind nur wenige Onboarding-Slots fuer neue Projekte verfuegbar.",
    primary: "Kostenloses Automatisierungs-Audit",
    secondary: "So funktioniert's",
  },
};

const luxembourgishCopy: HomePageCopy = {
  hero: {
    eyebrow: "KI-Automatiseierungssystemer fir PMEen",
    headline:
      "KI-Automatiséierung fir méi glat PME-Operatiounen.",
    subheadline:
      "Mir designen, bauen an integréieren KI-Systemer an Är bestoend Tools, fir datt manuell Aarbecht erofgeet, Reaktiounszäiten besser ginn an d'Ekipp kloer operativ Visibilitéit kritt.",
    proofLine: [
      "GDPR-konform",
      "Integratiounsfokus",
      "Moossgeschneidert Systemer",
      "Keng Ubidder-Bindung",
    ],
    urgency: "D'Onboarding-Kapazitéit ass dëse Mount limitéiert.",
    primary: "Gratis Automatiséierungs-Audit",
    secondary: "Kuckt wéi et geet",
    visualBadge: "Live Systemvisioun",
    visualTitle:
      "Workflow-Routing, KI-Logik an Dashboard-Visibilitéit an engem Betribssystem.",
    visualAlt: "Virschau vun engem Workflow-Automatiséierungs-Dashboard",
    visualFlow: [
      "Website-Formulaire oder Chatbot hëlt d'Ufro op",
      "D'KI qualifizéiert a rout de nächste Schrëtt",
      "D'Automatiséierung aktualiséiert CRM, Inbox oder intern Tool",
      "Den Dashboard hält d'Ekipp beim Status synchron",
    ],
    visualMetricLabel: "Verbonnene Stack",
    visualMetricValue: "CRM + E-Mail + WhatsApp + Dashboard",
    visualStatus: "KI-Routing aktiv",
    visualOverlay:
      "De System kann qualifizéieren, routen, Donnéeën aktualiséieren an d'Ekipp an enger gemeinsamer Vue ausriichten.",
  },
  proof: {
    eyebrow: "Resultat vun engem Beispillsystem",
    title: "Ee verbonnene Flow vun der Ufro bis bei déi nächst Aktioun.",
    body:
      "Eng typesch Lux-AI-Delivery kann Leads oder Supportufroen ophuelen, se mat KI triagéieren, de richtege Workflow ausléisen, de CRM aktualiséieren an de Status am Dashboard sichtbar maachen.",
    cards: [
      {
        icon: "ri-inbox-archive-line",
        title: "Ufro opgeholl",
        body: "Chatbot, Formulaire oder Inbox start de Workflow propper.",
      },
      {
        icon: "ri-robot-2-line",
        title: "D'KI decidéiert de nächste Schrëtt",
        body: "Qualifikatioun, Routing an Handoff lafen automatesch.",
      },
      {
        icon: "ri-bar-chart-grouped-line",
        title: "D'Ekipp gesäit de Status",
        body: "Dashboard, Responsabelen a Nofolleg bleiwen fir Operations sichtbar.",
      },
    ],
  },
  services: {
    eyebrow: "Servicer",
    title: "Wat mir effektiv liwweren",
    body:
      "Dräi Systemschichten decken déi meescht Automatiséierungsbedierfnesser vu PMEen of: Workflows, Kommunikatioun a verbonnen Operatiounen.",
    deliverablesLabel: "Liwwerungen",
    exampleLabel: "Beispill",
    resultLabel: "Resultat",
    items: [
      {
        icon: "ri-flow-chart",
        title: "KI-Workflow-Automatiséierung",
        outcome:
          "Manner manuell Schrëtt bei Geneemegungen, Admin-Aarbecht a Follow-up.",
        bullets: [
          "De bestoende Flow ofbilden an vermeidbar Engpäss ewechhuelen",
          "Reegelen, Erënnerungen, Geneemegungen an Handoffs automatiséieren",
          "Mënschlech Kontroll do behalen, wou Ausnamen wichteg sinn",
        ],
        example:
          "Rechnungs-Geneemegungen, Client-Onboarding oder intern Ufroen",
        result:
          "D'Ekippe schaffen méi séier mat manner Copy-Paste a manner vergiessene Schrëtt.",
        deliverables: [
          "Workflow-Iwwersiicht",
          "Automatiséierungslogik",
          "Geneemegungsreegelen",
          "Ausnahmepfade",
        ],
      },
      {
        icon: "ri-message-3-line",
        title: "KI-Systemer fir Clientekommunikatioun",
        outcome:
          "Méi séier Reaktiounszäiten ouni méi Inbox-Belaaschtung.",
        bullets: [
          "Website- oder Portal-Chatbot fir FAQen a Lead-Erfaassung",
          "KI-gestëtzte Triage fir Support an erakommend Ufroen",
          "Eskalatioun op E-Mail, CRM oder mënschlecht Follow-up",
        ],
        example:
          "Lead-Qualifikatioun, Support-Intake oder méisproocheg FAQen",
        result:
          "D'Kommunikatioun gëtt méi konsequent an déi nächst Aktioun méi kloer.",
        deliverables: [
          "Chat-Ablaf",
          "Wëssensopbau",
          "Routing-Reegelen",
          "Gespréichsanalysen",
        ],
      },
      {
        icon: "ri-database-2-line",
        title: "Integratiounen & operativ Dashboards",
        outcome:
          "Méi propperen Datefloss a besser Visibilitéit tëscht Ären Tools.",
        bullets: [
          "CRM, E-Mail, WhatsApp, ERP, Formulairen an APIs verbannen",
          "Manuell Neiagaben tëscht getrennte Systemer eliminéieren",
          "Dashboards fir Status, Belaaschtung an Ausname fir d'Ekipp bauen",
        ],
        example:
          "CRM-Updates aus Chatbot-Gespréicher oder Buchungs-Workflows",
        result:
          "Dir kritt ee kloert Operatiounsbild amplaz vu fragmentéierten Tools.",
        deliverables: [
          "Systemintegratiounen",
          "Sync-Reegelen",
          "Dashboard-Visiounen",
          "Operativ Reporting",
        ],
      },
    ],
  },
  why: {
    eyebrow: "Firwat Lux AI",
    title: "Gebaut fir operativ Kloerheet, net fir flashy Demoen",
    body:
      "Et geet drëm, de Betrib besser funktionéieren ze loossen, net nëmmen eng generesch KI-Schicht op gebrach Prozesser ze setzen.",
    items: [
      {
        icon: "ri-shield-check-line",
        title: "GDPR-konform",
        body: "EU-Business-Kontext, Zougrëffskontroll a méi propperen Ëmgang mat operationellen Donnéeën vun Ufank un.",
      },
      {
        icon: "ri-links-line",
        title: "Integratiounsfokus",
        body: "Mir verbannen Är bestoend Systemer amplaz onnéideg Rebuilds ze forcéieren.",
      },
      {
        icon: "ri-layout-grid-line",
        title: "Moossgeschneidert Systemer",
        body: "D'Léisung gëtt ronderëm Äre Workflow gebaut, net ronderëm eng Template-Bibliothéik.",
      },
      {
        icon: "ri-door-lock-line",
        title: "Keng Ubidder-Bindung",
        body: "Dir kritt kloer Liwwerungen, dokumentéiert Logik a Systemer, déi Är Ekipp weider benotze kann.",
      },
    ],
  },
  deliverables: {
    eyebrow: "Wat Dir kritt",
    title: "E benotzbaart Automatiséierungssystem, net nëmme Berodung",
    body:
      "All Zesummenaarbecht soll an engem funktionéierende Business-System ophalen, dat Är Ekipp wierklech benotze kann.",
    items: [
      {
        icon: "ri-flow-chart",
        title: "Ablaf",
        body: "Ofgebilte a nei designt Abläif mat Automatiséierungslogik fir déi Schrëtt, déi net méi manuell solle sinn.",
      },
      {
        icon: "ri-chat-1-line",
        title: "Chat-Assistent",
        body: "Client- oder intern KI-Chats, verbonnen un approuvéierte Business-Wëssen.",
      },
      {
        icon: "ri-plug-2-line",
        title: "Integratiounen",
        body: "Verbindungen tëscht CRM, E-Mail, WhatsApp, ERP, Formulairen, APIs oder internen Systemer.",
      },
      {
        icon: "ri-dashboard-3-line",
        title: "Iwwersiicht",
        body: "Visibilitéit op Status, Last, Ausnamen an déi nächst Aktioun fir d'Ekipp.",
      },
      {
        icon: "ri-customer-service-2-line",
        title: "Begleedung",
        body: "Handover, Verbesserung an operativ Ënnerstëtzung, soubal dat éischt System live ass.",
      },
    ],
  },
  example: {
    eyebrow: "Beispillsystem",
    title:
      "Termin- a Buchungsautomatiséierung ass ee Workflow-Beispill, net déi ganz Offer",
    body:
      "Wann Dir Buchung, Erënnerungen, Geneemegungen, Bezuelungen oder Kalenner-Routing braucht, baue mir dat an e méi breede Betribssystem an. D'Käroffer bleift moossgeschneidert Automatiséierung fir Äre Betrib.",
    tag: "Beispill-Workflow-Block",
    imageAlt: "Beispill vun enger Scheduling-Workflow-Interface",
    imagePill: "Live-Beispill",
    bullets: [
      "Disponibilitéits- a Routing-Reegelen",
      "Erënnerungs- a Nofolleg-Automatiséierung",
      "CRM- oder Dashboard-Updates",
      "Geneemegungs- oder Bezuelungslogik wann néideg",
    ],
    note:
      "Huelt et als e konkrete Beispill, wéi Lux AI verbonnene Systemer ronderëm e richtegen operativen Flow baut.",
  },
  process: {
    title: "E kloere Wee vum Audit bis zum live laafende System",
    body:
      "Fänkt mam gratis Audit un, confirméiert de richtege Workflow a gitt duerno a Design, Ëmsetzung an Optimiséierung mat engem definéierte nächste Schrëtt.",
    steps: [
      {
        title: "Analyséieren",
        duration: "3-5 Deeg",
        body: "Mir kucken de Workflow duerch, maachen Reiwung sichtbar a definéieren dee beschten Entrée an d'Automatiséierung.",
        outputs: ["Workflow-Iwwersiicht", "Prioritéitslëscht"],
      },
      {
        title: "Entwërfen a bauen",
        duration: "2-6 Wochen",
        body: "Mir designen den Zil-Flow, verbannen d'Tools a bauen d'Automatiséierungslogik an e benotzbaart System.",
        outputs: ["System-Blueprint", "Verbonnene Flow"],
      },
      {
        title: "Lancéieren a verbesseren",
        duration: "Permanent",
        body: "Mir testen, iwwerwaachen a verfeineren de Live-System, sou datt d'Equipe Kontroll a Visibilitéit behält.",
        outputs: ["Live-Handover", "Optimiséierungsplang"],
      },
    ],
    primary: "Gratis Automatiséierungs-Audit",
    secondary: "Kuckt wéi et geet",
  },
  final: {
    eyebrow: "Nächste Schrëtt",
    title: "Fänkt mat engem gratis Automatiséierungs-Audit un",
    body:
      "Mir kucken Äre aktuelle Workflow, identifizéieren de beschten Entrée fir Automatiséierung a definéieren, wat dat éischt nëtzlecht System soll enthalen.",
    urgency:
      "Aktuell si just e puer Onboarding-Slots fir nei Projeten disponibel.",
    primary: "Gratis Automatiséierungs-Audit",
    secondary: "Kuckt wéi et geet",
  },
};

export const homepageCopy: Record<AppLanguage, HomePageCopy> = {
  en: englishCopy,
  fr: frenchCopy,
  de: germanCopy,
  lb: luxembourgishCopy,
};
