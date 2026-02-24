// app/data/knowledge.ts

export type Lang = "en" | "fr" | "de" | "lb";

export type KBAnswer = {
  intent: string;
  tags?: string[];
  question: Record<Lang, string>;
  answer: Record<Lang, string>;
};

export type KBLocalizedString = Record<Lang, string>;
export type KBLocalizedList = Record<Lang, string[]>;

export type KBService = {
  id: string;
  name: KBLocalizedString;
  outcomes: KBLocalizedList;
  includes: KBLocalizedList;
  notes?: KBLocalizedList;
  keywords: readonly string[];
};

export type KBTeamMember = {
  id: string;
  name: KBLocalizedString;
  role: KBLocalizedString;
  quote: KBLocalizedString;
  keywords?: readonly string[];
};

export type BusinessKB = {
  meta: {
    version: string;
    docId: string;
    supportedLanguages: readonly Lang[];
    defaultLanguage: Lang;
    lastUpdated: string; // ISO date
  };
  company: {
    name: string;
    oneLiner: KBLocalizedString;
    positioning: KBLocalizedString;
  };
  team?: readonly KBTeamMember[];
  services: readonly KBService[];
  industries: { list: KBLocalizedList };
  process: { steps: KBLocalizedList };
  leadQuestions: { list: KBLocalizedList };
  contact: {
    email: string;
    formUrl: string; // relative path is fine
    note: KBLocalizedString;
    cta: KBLocalizedString;
  };
  qa: readonly KBAnswer[];
};

export const BUSINESS_KB: BusinessKB = {
  meta: {
    version: "1.3.2",
    docId: "luxai_kb_v1",
    supportedLanguages: ["en", "fr", "de", "lb"],
    defaultLanguage: "en",
    lastUpdated: "2025-12-26",
  },

  company: {
    name: "Lux AI Consultancy & Automation",
    oneLiner: {
      en: "We help businesses integrate AI and automate workflows across their tools and systems.",
      fr: "Nous aidons les entreprises à intégrer l’IA et à automatiser leurs workflows à travers leurs outils et systèmes.",
      de: "Wir helfen Unternehmen dabei, KI zu integrieren und Workflows über ihre Tools und Systeme hinweg zu automatisieren.",
      lb: "Mir hëllefen Entreprisen, AI z’integréieren an Workflows iwwer hir Tools a Systemer ze automatiséieren.",
    },
    positioning: {
      en: "AI integration + automation for operations, sales, support, and back-office.",
      fr: "Intégration IA + automatisation pour les opérations, les ventes, le support et le back-office.",
      de: "KI-Integration + Automatisierung für Betrieb, Vertrieb, Support und Backoffice.",
      lb: "AI-Integratioun + Automatisatioun fir Operatiounen, Verkaf, Support an Backoffice.",
    },
  },

  team: [
    {
      id: "team.molla",
      name: {
        en: "Molla Sisay Jemere",
        fr: "Molla Sisay Jemere",
        de: "Molla Sisay Jemere",
        lb: "Molla Sisay Jemere",
      },
      role: {
        en: "Founder & CEO · Full-Stack & AI Automation Strategist · MuleSoft Certified Integration Professional",
        fr: "Fondateur & CEO · Stratège Full-Stack & Automatisation IA · Professionnel Certifié d'Intégration MuleSoft",
        de: "Gründer & CEO · Full-Stack- & KI-Automatisierungsstratege · Zertifizierter MuleSoft-Integrationsprofi",
        lb: "Grënner & CEO · Full-Stack & AI-Automatiséierungs-Strateg · MuleSoft Zertifizéierten Integratiounsprofessionnel",
      },
      quote: {
        en: "Leads the company's vision and overall direction, focusing on simplifying complex business processes through intelligent automation, integrations, and scalable AI-driven systems.",
        fr: "Porte la vision et l'orientation générale de l'entreprise, en se concentrant sur la simplification des processus métiers complexes grâce à l'automatisation intelligente, aux intégrations et aux systèmes IA évolutifs.",
        de: "Verantwortet Vision und Gesamtrichtung des Unternehmens mit Fokus auf die Vereinfachung komplexer Geschäftsprozesse durch intelligente Automatisierung, Integrationen und skalierbare KI-gestützte Systeme.",
        lb: "Leet d'Visioun an d'Gesamtrichtung vun der Entreprise, mat Fokus op d'Vereinfachung vu komplexe Business-Prozesser duerch intelligent Automatisatioun, Integratiounen a skaléierbar AI-gedriwwe Systemer.",
      },
      keywords: [
        "ceo",
        "founder",
        "strategy",
        "process automation",
        "ai systems",
        "business optimization",
      ],
    },

    {
      id: "team.fikre",
      name: {
        en: "Fikremariam Mekonnen",
        fr: "Fikremariam Mekonnen",
        de: "Fikremariam Mekonnen",
        lb: "Fikremariam Mekonnen",
      },
      role: {
        en: "Co-Founder · Full-Stack, AI & Integrations Engineer",
        fr: "Co-Fondateur · Ingénieur Full-Stack, IA & Intégrations",
        de: "Co-Founder · Full-Stack-, KI- & Integrationsingenieur",
        lb: "Co-Founder · Full-Stack-, AI- & Integratiounsingenieur",
      },
      quote: {
        en: "Designs and builds robust system integrations and automation architectures that operate reliably in real-world business environments and scale with organizational growth.",
        fr: "Conçoit et développe des intégrations systèmes robustes et des architectures d’automatisation fiables, conçues pour fonctionner dans des environnements métiers réels et évoluer avec la croissance de l’organisation.",
        de: "Entwirft und entwickelt robuste Systemintegrationen und Automatisierungsarchitekturen, die in realen Geschäftsumgebungen zuverlässig funktionieren und mit dem Unternehmenswachstum skalieren.",
        lb: "Entwéckelt robust System-Integratiounen an Automatiséierungs-Architekturen, déi zouverlässeg an realen Business-Ëmfeld funktionéieren a mat dem Wuesstem vun der Organisatioun skaléieren.",
      },
      keywords: [
        "co-founder",
        "integrations",
        "automation architecture",
        "api",
        "systems engineering",
        "scalability",
      ],
    },

    {
      id: "team.dereje",
      name: {
        en: "Dereje Masresha",
        fr: "Dereje Masresha",
        de: "Dereje Masresha",
        lb: "Dereje Masresha",
      },
      role: {
        en: "AWS Cloud Enthusiast · Full-Stack & AI Solutions Developer",
        fr: "Passionné AWS Cloud · Développeur Full-Stack & Solutions IA",
        de: "AWS-Cloud-Enthusiast · Full-Stack- & KI-Lösungsentwickler",
        lb: "AWS Cloud Enthusiast · Full-Stack & AI-Léisungs-Entwéckler",
      },
      quote: {
        en: "Builds full-stack solutions that combine clean user interfaces, scalable cloud-backed systems, and practical AI automation to deliver reliable, user-focused applications.",
        fr: "Développe des solutions full-stack combinant des interfaces claires, des systèmes cloud évolutifs et une automatisation IA pragmatique pour livrer des applications fiables et centrées utilisateur.",
        de: "Entwickelt Full-Stack-Lösungen mit klaren Benutzeroberflächen, skalierbaren Cloud-Systemen und praxisnaher KI-Automatisierung für zuverlässige, nutzerorientierte Anwendungen.",
        lb: "Entwéckelt Full-Stack-Léisungen mat propperen Interfaces, skaléierbare Cloud-Systemer an praktescher AI-Automatisatioun fir zouverlässeg, user-fokusséiert Uwendungen.",
      },
      keywords: [
        "aws",
        "cloud",
        "full-stack",
        "ai solutions",
        "automation",
        "scalable systems",
      ],
    },
  ] as const,

  services: [
    {
      id: "services.chatbots",
      name: {
        en: "AI Chatbots (Website, Portal, WhatsApp)",
        fr: "Chatbots IA (site web, portail, WhatsApp)",
        de: "KI-Chatbots (Website, Portal, WhatsApp)",
        lb: "AI-Chatbots (Websäit, Portal, WhatsApp)",
      },
      outcomes: {
        en: [
          "24/7 lead capture",
          "faster support",
          "better customer experience",
        ],
        fr: [
          "capture de leads 24/7",
          "support plus rapide",
          "meilleure expérience client",
        ],
        de: [
          "Lead-Erfassung rund um die Uhr",
          "schnellerer Support",
          "besseres Kundenerlebnis",
        ],
        lb: [
          "Leads 24/7 erfassen",
          "méi schnelle Support",
          "besser Clientserfarung",
        ],
      },
      includes: {
        en: [
          "Multilingual chat (EN/FR/DE/LB)",
          "FAQ-style answers (RAG-ready)",
          "Lead capture + handoff to humans",
          "Integration with CRM/helpdesk",
          "Public mode (available to any visitor)",
          "Protected mode (only for authenticated users)",
          "Admin tools to update the assistant’s information content consistently",
        ],
        fr: [
          "Chat multilingue (EN/FR/DE/LB)",
          "Réponses type FAQ (prêt pour RAG)",
          "Capture de leads + transfert à un humain",
          "Intégration CRM/helpdesk",
          "Mode public (accessible à tout visiteur)",
          "Mode protégé (utilisateurs authentifiés)",
          "Outils admin pour mettre à jour les informations de l’assistant de façon cohérente",
        ],
        de: [
          "Mehrsprachiger Chat (EN/FR/DE/LB)",
          "FAQ-ähnliche Antworten (RAG-fähig)",
          "Lead-Erfassung + Übergabe an Menschen",
          "Integration mit CRM/Helpdesk",
          "Öffentlicher Modus (für alle Besucher)",
          "Geschützter Modus (nur authentifizierte Nutzer)",
          "Admin-Tools zur konsistenten Pflege der Assistenten-Informationen",
        ],
        lb: [
          "Méisproochege Chat (EN/FR/DE/LB)",
          "FAQ-Äntwerten (RAG-ready)",
          "Lead-Capture + Iwwergab un e Mënsch",
          "Integratioun mat CRM/Helpdesk",
          "Public Modus (fir all Visiteur)",
          "Protected Modus (nëmme fir authentifizéiert Benotzer)",
          "Admin-Tools fir d’Informatioune vum Assistent konsequent ze aktualiséieren",
        ],
      },
      notes: {
        en: [
          "Public vs protected: choose access based on the use case (marketing vs customer portal vs internal ops).",
          "We can add role-based access, audit logs, and admin controls when needed.",
        ],
        fr: [
          "Public vs protégé : choisissez l’accès selon le besoin (marketing vs portail client vs interne).",
          "Nous pouvons ajouter accès par rôles, logs d’audit et contrôles admin si nécessaire.",
        ],
        de: [
          "Öffentlich vs geschützt: Zugriff je nach Use Case (Marketing vs Kundenportal vs intern).",
          "Optional: rollenbasierter Zugriff, Audit-Logs und Admin-Kontrollen.",
        ],
        lb: [
          "Public vs protected: Zougang jee no Use Case (Marketing vs Client-Portal vs intern).",
          "Optional: Role-based Access, Audit-Logs an Admin-Kontrollen.",
        ],
      },
      keywords: [
        "chatbot",
        "website chatbot",
        "public chatbot",
        "protected chatbot",
        "authenticated",
        "roles",
        "rbac",
        "rag",
        "support",
        "lead capture",
        "whatsapp",
      ],
    },

    {
      id: "services.integrations",
      name: {
        en: "AI + System Integration",
        fr: "IA + intégration de systèmes",
        de: "KI + Systemintegration",
        lb: "AI + System-Integratioun",
      },
      outcomes: {
        en: ["connected systems", "less manual work", "clean data flow"],
        fr: [
          "systèmes connectés",
          "moins de travail manuel",
          "flux de données propre",
        ],
        de: [
          "verbundene Systeme",
          "weniger manuelle Arbeit",
          "sauberer Datenfluss",
        ],
        lb: [
          "verbonnen Systemer",
          "manner manuell Aarbecht",
          "propperen Datefloss",
        ],
      },
      includes: {
        en: [
          "CRM/ERP integration (HubSpot/Salesforce/others)",
          "Email + calendar automation",
          "APIs, webhooks, middleware",
          "Automation platforms (n8n/Make/Zapier) + custom code",
          "Notifications (email/WhatsApp), approvals, and sync jobs",
        ],
        fr: [
          "Intégration CRM/ERP (HubSpot/Salesforce/autres)",
          "Automatisation email + calendrier",
          "APIs, webhooks, middleware",
          "Plateformes (n8n/Make/Zapier) + code sur mesure",
          "Notifications (email/WhatsApp), validations, synchronisations",
        ],
        de: [
          "CRM/ERP-Integration (HubSpot/Salesforce/weitere)",
          "E-Mail- + Kalender-Automation",
          "APIs, Webhooks, Middleware",
          "Plattformen (n8n/Make/Zapier) + Custom Code",
          "Benachrichtigungen (E-Mail/WhatsApp), Freigaben, Sync-Jobs",
        ],
        lb: [
          "CRM/ERP-Integratioun (HubSpot/Salesforce/anerer)",
          "E-Mail- a Kalenner-Automatisatioun",
          "APIs, Webhooks, Middleware",
          "Plattformen (n8n/Make/Zapier) + Custom Code",
          "Notifikatiounen (E-Mail/WhatsApp), Approvals a Sync-Jobs",
        ],
      },
      keywords: [
        "integration",
        "crm",
        "erp",
        "api",
        "webhook",
        "n8n",
        "zapier",
        "make",
        "whatsapp",
      ],
    },

    {
      id: "services.workflows",
      name: {
        en: "Workflow Automation",
        fr: "Automatisation des workflows",
        de: "Workflow-Automatisierung",
        lb: "Workflow-Automatisatioun",
      },
      outcomes: {
        en: ["reduced cost", "fewer errors", "faster delivery"],
        fr: ["coûts réduits", "moins d’erreurs", "exécution plus rapide"],
        de: ["geringere Kosten", "weniger Fehler", "schnellere Umsetzung"],
        lb: ["manner Käschten", "manner Feeler", "méi séier Ëmsetzung"],
      },
      includes: {
        en: [
          "Sales ops automation (lead routing, follow-ups)",
          "Support automation (ticket triage, auto-replies)",
          "Document workflows (intake, extraction, approvals)",
          "Monitoring + dashboards",
          "Human-in-the-loop for exceptions (when needed)",
        ],
        fr: [
          "Automatisation sales ops (routage des leads, relances)",
          "Automatisation support (tri des tickets, réponses automatiques)",
          "Workflows documentaires (intake, extraction, validations)",
          "Monitoring + dashboards",
          "Human-in-the-loop pour les exceptions (si nécessaire)",
        ],
        de: [
          "Sales-Ops-Automation (Lead-Routing, Follow-ups)",
          "Support-Automation (Ticket-Triage, Auto-Antworten)",
          "Dokumenten-Workflows (Intake, Extraktion, Freigaben)",
          "Monitoring + Dashboards",
          "Human-in-the-loop für Ausnahmen (bei Bedarf)",
        ],
        lb: [
          "Sales-Ops Automatisatioun (Lead-Routing, Follow-ups)",
          "Support Automatisatioun (Ticket-Triage, Auto-Äntwerten)",
          "Dokument-Workflows (Intake, Extraktioun, Approvals)",
          "Monitoring + Dashboards",
          "Human-in-the-loop fir Ausnamen (wann néideg)",
        ],
      },
      keywords: [
        "workflow",
        "automation",
        "tickets",
        "documents",
        "monitoring",
        "dashboards",
        "approvals",
      ],
    },

    {
      id: "services.business_apps",
      name: {
        en: "Custom Business Web Apps (ERP, E-commerce, Admin Platforms)",
        fr: "Applications web métier sur mesure (ERP, e-commerce, plateformes admin)",
        de: "Individuelle Business-Web-Apps (ERP, E-Commerce, Admin-Plattformen)",
        lb: "Moossgeschneidert Business-Web-Apps (ERP, E-Commerce, Admin-Plattformen)",
      },
      outcomes: {
        en: [
          "centralized operations",
          "admin-controlled workflows",
          "better visibility and reporting",
          "reduced manual effort",
        ],
        fr: [
          "opérations centralisées",
          "workflows contrôlés par admin",
          "meilleure visibilité et reporting",
          "moins de travail manuel",
        ],
        de: [
          "zentralisierte Abläufe",
          "admin-gesteuerte Workflows",
          "mehr Transparenz und Reporting",
          "weniger manuelle Arbeit",
        ],
        lb: [
          "zentral Operatiounen",
          "admin-kontrolléiert Workflows",
          "méi Iwwerbléck a Reporting",
          "manner manuell Aarbecht",
        ],
      },
      includes: {
        en: [
          "ERP-style business apps (operations, back-office, reporting)",
          "E-commerce workflows (catalog, orders, customer processes)",
          "Inventory/stock management (items, stock levels, movements)",
          "Centralized, admin-controlled cafe management app (menu, orders, stock, staff workflows)",
          "Role-based access (admin/manager/staff/customer)",
          "Automation + integrations (payments, CRM, accounting, notifications)",
        ],
        fr: [
          "Apps type ERP (opérations, back-office, reporting)",
          "Workflows e-commerce (catalogue, commandes, parcours client)",
          "Gestion de stock (articles, niveaux, mouvements)",
          "App de gestion de café centralisée contrôlée par admin (menu, commandes, stock, équipe)",
          "Accès par rôles (admin/manager/employé/client)",
          "Automatisation + intégrations (paiements, CRM, compta, notifications)",
        ],
        de: [
          "ERP-ähnliche Business-Apps (Betrieb, Backoffice, Reporting)",
          "E-Commerce-Workflows (Katalog, Bestellungen, Kundenprozesse)",
          "Inventar-/Bestandsmanagement (Artikel, Bestände, Bewegungen)",
          "Zentrale, admin-gesteuerte Café-Management-App (Menü, Bestellungen, Bestand, Team-Workflows)",
          "Rollenbasierter Zugriff (Admin/Manager/Mitarbeiter/Kunde)",
          "Automatisierung + Integrationen (Zahlungen, CRM, Buchhaltung, Benachrichtigungen)",
        ],
        lb: [
          "ERP-ähnlech Business-Apps (Operatiounen, Backoffice, Reporting)",
          "E-Commerce Workflows (Katalog, Bestellungen, Client-Prozesser)",
          "Stock/Inventar-Management (Artikelen, Stock-Stand, Beweegungen)",
          "Zentral, admin-kontrolléiert Café-Management-App (Menu, Bestellungen, Stock, Staff-Workflows)",
          "Role-based Access (Admin/Manager/Staff/Client)",
          "Automatisatioun + Integratiounen (Payments, CRM, Accounting, Notifikatiounen)",
        ],
      },
      notes: {
        en: [
          "Best when you need one centralized system instead of scattered spreadsheets and manual steps.",
          "Can include an admin panel to manage data, content, roles, and the assistant’s information content.",
        ],
        fr: [
          "Utile quand vous avez besoin d’un système central plutôt que des fichiers dispersés et des étapes manuelles.",
          "Peut inclure un panneau admin pour gérer données, contenu, rôles et les informations de l’assistant.",
        ],
        de: [
          "Sinnvoll, wenn Sie ein zentrales System statt verstreuter Tabellen und manueller Schritte benötigen.",
          "Optional mit Admin-Panel für Daten, Inhalte, Rollen und Assistenten-Informationen.",
        ],
        lb: [
          "Sënnvoll, wann Dir e zentral System braucht amplaz verspreete Tabellen a manuell Schrëtt.",
          "Optional mat Admin-Panel fir Daten, Contenu, Rollen an d’Informatioune vum Assistent.",
        ],
      },
      keywords: [
        "erp",
        "business app",
        "web app",
        "ecommerce",
        "inventory",
        "stock management",
        "cafe management",
        "admin panel",
        "roles",
        "rbac",
      ],
    },
  ] as const,

  industries: {
    list: {
      en: [
        "Professional services",
        "E-commerce",
        "Logistics",
        "Healthcare (non-clinical workflows)",
        "Manufacturing",
        "Real estate",
        "Hospitality (operations & back-office)",
      ],
      fr: [
        "Services professionnels",
        "E-commerce",
        "Logistique",
        "Santé (workflows non cliniques)",
        "Industrie / fabrication",
        "Immobilier",
        "Hôtellerie-restauration (opérations & back-office)",
      ],
      de: [
        "Professionelle Dienstleistungen",
        "E-Commerce",
        "Logistik",
        "Gesundheitswesen (nicht-klinische Workflows)",
        "Fertigung",
        "Immobilien",
        "Gastronomie/Hotellerie (Betrieb & Backoffice)",
      ],
      lb: [
        "Professionell Servicer",
        "E-Commerce",
        "Logistik",
        "Gesondheetsberäich (net-klinesch Workflows)",
        "Industrie",
        "Immobiljen",
        "Gastronomie/Hotellerie (Operatiounen & Backoffice)",
      ],
    },
  },

  process: {
    steps: {
      en: [
        "Discovery (goals, tools, pain points)",
        "Solution design (architecture + integrations)",
        "Build & test (automation + assistant)",
        "Deploy (security + monitoring)",
        "Support & iteration",
      ],
      fr: [
        "Découverte (objectifs, outils, points de douleur)",
        "Conception (architecture + intégrations)",
        "Build & test (automatisation + assistant)",
        "Déploiement (sécurité + monitoring)",
        "Support & itération",
      ],
      de: [
        "Discovery (Ziele, Tools, Pain Points)",
        "Lösungsdesign (Architektur + Integrationen)",
        "Build & Test (Automatisierung + Assistent)",
        "Deployment (Sicherheit + Monitoring)",
        "Support & Iteration",
      ],
      lb: [
        "Discovery (Ziler, Tools, Pain Points)",
        "Léisungsdesign (Architektur + Integratiounen)",
        "Build & Test (Automatisatioun + Assistent)",
        "Deploy (Sécherheet + Monitoring)",
        "Support & Iteratioun",
      ],
    },
  },

  leadQuestions: {
    list: {
      en: [
        "What industry are you in?",
        "Which tools do you use (CRM/ERP/helpdesk/email/WhatsApp)?",
        "What do you want to automate first?",
        "Roughly how many users/requests per month?",
      ],
      fr: [
        "Dans quel secteur êtes-vous ?",
        "Quels outils utilisez-vous (CRM/ERP/helpdesk/email/WhatsApp) ?",
        "Que voulez-vous automatiser en premier ?",
        "Environ combien d’utilisateurs/de demandes par mois ?",
      ],
      de: [
        "In welcher Branche sind Sie tätig?",
        "Welche Tools nutzen Sie (CRM/ERP/Helpdesk/E-Mail/WhatsApp)?",
        "Was möchten Sie zuerst automatisieren?",
        "Wie viele Nutzer/Anfragen pro Monat ungefähr?",
      ],
      lb: [
        "A wéi enger Branche sidd Dir?",
        "Wéi eng Tools benotzt Dir (CRM/ERP/Helpdesk/E-Mail/WhatsApp)?",
        "Wat wëllt Dir als éischt automatiséieren?",
        "Ongeféier wéi vill Benotzer/Ufroen pro Mount?",
      ],
    },
  },

  contact: {
    email: "molla@luxaiautomation.com",
    formUrl: "/contact",
    note: {
      en: "Preferred: share details via our contact form or email so we can reply with specifics.",
      fr: "Idéalement : partagez les détails via notre formulaire de contact ou par email afin que nous puissions répondre précisément.",
      de: "Bevorzugt: Teilen Sie Details über unser Kontaktformular oder per E-Mail, damit wir gezielt antworten können.",
      lb: "Am léifsten: schéckt d’Detailer iwwer eise Contact-Formulaire oder per E-Mail, fir datt mir konkret kënne äntweren.",
    },
    cta: {
      en: "Share your goal, tools, and your name/email/company so we can propose a simple plan. Use /contact or email molla@luxaiautomation.com.",
      fr: "Partagez votre objectif, vos outils et votre nom/email/entreprise afin que nous proposions un plan simple. Utilisez /contact ou écrivez à molla@luxaiautomation.com.",
      de: "Teilen Sie Ihr Ziel, Ihre Tools sowie Ihren Namen/E-Mail/Firma, damit wir einen einfachen Plan vorschlagen können. Nutzen Sie /contact oder schreiben Sie an molla@luxaiautomation.com.",
      lb: "Deelt äert Zil, är Tools an ären Numm/E-Mail/Firma, da proposéiere mir e simple Plang. Benotzt /contact oder schreift un molla@luxaiautomation.com.",
    },
  },

  qa: [
    // ---------------------------
    // Services Q&A
    // ---------------------------
    {
      intent: "services.chatbots.public_vs_protected",
      tags: [
        "public chatbot",
        "protected chatbot",
        "auth",
        "login",
        "roles",
        "rbac",
      ],
      question: {
        en: "Do you offer public and protected chatbots?",
        fr: "Proposez-vous des chatbots publics et protégés ?",
        de: "Bietet ihr öffentliche und geschützte Chatbots an?",
        lb: "Bitt dir public an protected Chatbots un?",
      },
      answer: {
        en: "Yes. A public chatbot is available to any visitor (great for FAQs and lead capture). A protected chatbot is for authenticated users (great for customer portals or internal teams). We can also add role-based access and admin controls to keep the assistant’s information content consistent.",
        fr: "Oui. Un chatbot public est accessible à tout visiteur (idéal pour FAQ et leads). Un chatbot protégé est réservé aux utilisateurs authentifiés (idéal pour portails clients ou équipes internes). Nous pouvons aussi ajouter un accès par rôles et des contrôles admin pour garder les informations de l’assistant cohérentes.",
        de: "Ja. Ein öffentlicher Chatbot ist für alle Besucher verfügbar (ideal für FAQs und Leads). Ein geschützter Chatbot ist für authentifizierte Nutzer gedacht (ideal für Kundenportale oder interne Teams). Zusätzlich sind rollenbasierter Zugriff und Admin-Kontrollen möglich, damit die Assistenten-Informationen konsistent bleiben.",
        lb: "Jo. E public Chatbot ass fir all Visiteur (super fir FAQen a Leads). E protected Chatbot ass fir authentifizéiert Benotzer (super fir Client-Portaler oder intern Teams). Mir kënnen och Role-based Access an Admin-Kontrollen derbäi maachen, fir datt d’Informatioune vum Assistent konsequent bleiwen.",
      },
    },

    {
      intent: "services.business_apps.what_you_build",
      tags: [
        "erp",
        "ecommerce",
        "inventory",
        "stock",
        "cafe management",
        "admin panel",
        "web app",
      ],
      question: {
        en: "What kinds of business web apps can you build?",
        fr: "Quels types d’applications web métier pouvez-vous développer ?",
        de: "Welche Arten von Business-Web-Apps könnt ihr bauen?",
        lb: "Wat fir Business-Web-Apps kënnt dir bauen?",
      },
      answer: {
        en: "We build custom business web apps such as ERP-style systems, e-commerce workflows, inventory/stock management tools, and centralized admin-controlled platforms (for example a cafe management app with menu, orders, stock, and staff workflows). We also add integrations and automation so data flows cleanly across tools.",
        fr: "Nous développons des applications web métier sur mesure : systèmes type ERP, workflows e-commerce, outils de gestion de stock, et plateformes centralisées contrôlées par admin (par exemple une app de gestion de café : menu, commandes, stock, équipe). Nous ajoutons aussi des intégrations et de l’automatisation pour que les données circulent proprement entre vos outils.",
        de: "Wir bauen individuelle Business-Web-Apps: ERP-ähnliche Systeme, E-Commerce-Workflows, Inventar-/Bestandsmanagement und zentrale admin-gesteuerte Plattformen (z. B. eine Café-Management-App mit Menü, Bestellungen, Bestand und Team-Workflows). Zusätzlich integrieren und automatisieren wir Tools, damit Daten sauber zwischen Systemen fließen.",
        lb: "Mir bauen moossgeschneidert Business-Web-Apps: ERP-ähnlech Systemer, E-Commerce-Workflows, Stock/Inventar-Management an zentral admin-kontrolléiert Plattformen (z. B. eng Café-Management-App mat Menu, Bestellungen, Stock a Staff-Workflows). Mir maachen och Integratiounen an Automatisatioun, fir datt d’Daten propper tëscht Tools fléissen.",
      },
    },

    // ---------------------------
    // Platforms (from site copy)
    // ---------------------------
    {
      intent: "platforms.we_build",
      tags: [
        "platforms",
        "erp",
        "custom apps",
        "ecommerce",
        "customer portals",
        "dashboards",
      ],
      question: {
        en: "What platforms do you build and modernize?",
        fr: "Quelles plateformes construisez-vous et modernisez-vous ?",
        de: "Welche Plattformen baut und modernisiert ihr?",
        lb: "Wéi eng Plattformen baut a moderniséiert dir?",
      },
      answer: {
        en: [
          "We build and modernize core business systems so data flows cleanly and teams move faster:",
          "• ERP systems (role-based modules, approvals, reporting)",
          "• Custom business apps (internal tools, admin portals, dashboards)",
          "• E-commerce platforms (orders, inventory sync, fulfillment automation)",
          "• Websites & customer portals (authenticated dashboards + chatbots + admin-controlled content)",
        ].join("\n"),
        fr: [
          "Nous construisons et modernisons les systèmes cœur de votre activité pour des données plus propres et des équipes plus rapides :",
          "• ERP (modules par rôles, validations, reporting)",
          "• Applications métiers (outils internes, portails admin, tableaux de bord)",
          "• E-commerce (commandes, synchronisation stock, automatisation logistique)",
          "• Sites web & portails clients (dashboards authentifiés + chatbots + contenu contrôlé par admin)",
        ].join("\n"),
        de: [
          "Wir bauen und modernisieren die Kernsysteme Ihres Unternehmens, damit Daten sauber fließen und Teams schneller arbeiten:",
          "• ERP-Systeme (rollenbasierte Module, Freigaben, Reporting)",
          "• Business-Apps (interne Tools, Admin-Portale, Dashboards)",
          "• E-Commerce-Plattformen (Bestellungen, Inventory-Sync, Fulfillment-Automatisierung)",
          "• Websites & Kundenportale (authentifizierte Dashboards + Chatbots + admin-gesteuerter Content)",
        ].join("\n"),
        lb: [
          "Mir bauen a moderniséiere Kärsystemer, fir datt d’Daten propper fléissen an Teams méi séier virukommen:",
          "• ERP-Systemer (Role-based Moduler, Approvals, Reporting)",
          "• Business-Apps (intern Tools, Admin-Portalen, Dashboards)",
          "• E-Commerce Plattformen (Bestellungen, Inventory-Sync, Fulfillment-Automatisatioun)",
          "• Websäiten & Client-Portalen (authentifizéiert Dashboards + Chatbots + Admin-Contenu)",
        ].join("\n"),
      },
    },

    // ---------------------------
    // Contact expectations
    // ---------------------------
    {
      intent: "contact.reply_time",
      tags: ["contact", "reply", "response time"],
      question: {
        en: "How fast do you reply?",
        fr: "Sous quel délai répondez-vous ?",
        de: "Wie schnell antwortet ihr?",
        lb: "Wéi séier äntwert dir?",
      },
      answer: {
        en: "We typically reply within 1–2 business days. Use /contact or email molla@luxaiautomation.com.",
        fr: "Nous répondons généralement sous 1 à 2 jours ouvrables. Utilisez /contact ou écrivez à molla@luxaiautomation.com.",
        de: "In der Regel antworten wir innerhalb von 1–2 Werktagen. Nutzen Sie /contact oder schreiben Sie an molla@luxaiautomation.com.",
        lb: "Normalerweis äntwere mir bannent 1–2 Aarbechtsdeeg. Benotzt /contact oder schreift un molla@luxaiautomation.com.",
      },
    },

    // ---------------------------
    // Legal summaries
    // ---------------------------
    {
      intent: "legal.cookies.summary",
      tags: ["cookies", "cookie policy", "tracking"],
      question: {
        en: "Do you use cookies and what for?",
        fr: "Utilisez-vous des cookies et à quoi servent-ils ?",
        de: "Nutzt ihr Cookies und wofür?",
        lb: "Benotzt dir Cookies, a fir wat?",
      },
      answer: {
        en: "Cookies are used in a limited, transparent way for core operation and optional preferences (language/theme) only if you accept them. The site remains usable if you reject preference cookies. We don’t use advertising, analytics, or profiling cookies.",
        fr: "Les cookies sont utilisés de manière limitée et transparente pour le fonctionnement de base et des préférences (langue/thème) uniquement si vous les acceptez. Le site reste utilisable si vous refusez les cookies de préférence. Aucun cookie publicitaire, d’analyse ou de profilage.",
        de: "Cookies werden sparsam und transparent für den Basisbetrieb sowie optionale Präferenzen (Sprache/Theme) nur bei Zustimmung verwendet. Die Website bleibt auch ohne Präferenz-Cookies nutzbar. Keine Werbe-, Analytics- oder Profiling-Cookies.",
        lb: "Cookies gi limitéiert an transparent benotzt fir de Basis-Betrib an optional Preferenzen (Sprooch/Theme) nëmme wann Dir se akzeptéiert. D’Websäit bleift och ouni Preferenz-Cookies benotzbar. Keng Reklammen-, Analytics- oder Profiling-Cookies.",
      },
    },

    {
      intent: "legal.privacy.summary",
      tags: ["privacy", "gdpr", "personal data"],
      question: {
        en: "What personal data do you collect?",
        fr: "Quelles données personnelles collectez-vous ?",
        de: "Welche personenbezogenen Daten erfasst ihr?",
        lb: "Wéi eng perséinlech Donnéeë sammelt dir?",
      },
      answer: {
        en: "Personal data is collected only when you contact us (e.g., name, email, message) so we can respond. We don’t sell your data and we don’t use analytics, tracking, or advertising cookies.",
        fr: "Nous collectons des données personnelles uniquement lorsque vous nous contactez (nom, email, message) afin de répondre. Nous ne vendons pas vos données et n’utilisons pas de cookies d’analyse, de suivi ou de publicité.",
        de: "Personenbezogene Daten werden nur erfasst, wenn Sie uns kontaktieren (z. B. Name, E-Mail, Nachricht), um zu antworten. Keine Datenverkäufe und keine Analytics-, Tracking- oder Werbe-Cookies.",
        lb: "Mir sammelen perséinlech Donnéeën nëmme wann Dir eis kontaktéiert (z. B. Numm, E-Mail, Message) fir kënnen ze äntweren. Mir verkafen keng Donnéeën a benotzen keng Analytics-, Tracking- oder Reklammen-Cookies.",
      },
    },

    {
      intent: "legal.terms.summary",
      tags: ["terms", "terms & conditions", "legal"],
      question: {
        en: "What are your Terms & Conditions about?",
        fr: "De quoi parlent vos Conditions générales ?",
        de: "Worum geht es in euren AGB?",
        lb: "Ëm wat geet et an den Notzungsbedingungen?",
      },
      answer: {
        en: "The terms cover ownership and acceptable use of the website, intellectual property, prohibited scraping/abuse, and general disclaimers. For questions, email molla@luxaiautomation.com.",
        fr: "Les conditions couvrent la propriété et l’usage du site, la propriété intellectuelle, l’interdiction du scraping/abus et des clauses de non-responsabilité. Questions : molla@luxaiautomation.com.",
        de: "Die Bedingungen regeln Eigentum und zulässige Nutzung der Website, geistiges Eigentum, Verbot von Scraping/Missbrauch sowie allgemeine Haftungsausschlüsse. Fragen: molla@luxaiautomation.com.",
        lb: "D’Bedéngunge betreffen Besëtz an zulässeg Notzung vun der Websäit, intellektuell Propriétéit, Verbuet vu Scraping/Mëssbrauch an allgemeng Disclaimer. Froen: molla@luxaiautomation.com.",
      },
    },

    // ---------------------------
    // Guardrails (STRONG): block non-service conversations
    // ---------------------------
    {
      // NOTE: keep same intent name (so your router doesn't break)
      intent: "assistant.guardrails.code_requests",
      // Expanded tags so "react code" matches more reliably
      tags: [
        "code",
        "programming",
        "react",
        "nextjs",
        "typescript",
        "javascript",
        "component",
        "bug",
        "error",
        "script",
        "developer",
        "api",
        "prisma",
        "backend",
        "frontend",
      ],
      // IMPORTANT: make the question itself match the real user wording
      question: {
        en: "I need React code / can you write code or build a script for my project?",
        fr: "J’ai besoin de code (React) / pouvez-vous écrire du code ou créer un script pour mon projet ?",
        de: "Ich brauche Code (React) / könnt ihr Code schreiben oder ein Script für mein Projekt erstellen?",
        lb: "Ech brauch Code (React) / kënnt dir Code schreiwen oder e Script fir mäi Projet bauen?",
      },
      // IMPORTANT: firm refusal + redirect to services (no code help)
      answer: {
        en: "I am the LuxAI Assistant for Lux AI Consultancy & Automation. I am here to provide information and explain anything about our company and services. I cannot provide general programming help or write code here. However, I can help with our services: AI chatbots, system integrations, workflow automation, and custom business web apps. If you share your business goal and tools (CRM/ERP/helpdesk/email/WhatsApp), I'll suggest the best service and the next step. For implementation requests, please use /contact or email molla@luxaiautomation.com.",
        fr: "Je suis l'assistant LuxAI pour Lux AI Consultancy & Automation. Je suis ici pour fournir des informations et expliquer tout ce qui concerne notre entreprise et nos services. Je ne peux pas fournir d'aide générale en programmation ni du code ici. Cependant, je peux aider avec nos services : chatbots IA, intégrations systèmes, automatisation de workflows et applications web métier sur mesure. Partagez votre objectif métier et vos outils (CRM/ERP/helpdesk/email/WhatsApp) et je proposerai le service le plus adapté et la prochaine étape. Pour une demande d'implémentation : /contact ou molla@luxaiautomation.com.",
        de: "Ich bin der LuxAI-Assistent für Lux AI Consultancy & Automation. Ich bin hier, um Informationen bereitzustellen und alles über unser Unternehmen und unsere Services zu erklären. Ich kann hier keine allgemeine Programmierhilfe oder Code liefern. Ich kann jedoch bei unseren Services helfen: KI-Chatbots, Systemintegrationen, Workflow-Automatisierung und individuelle Business-Web-Apps. Nennen Sie bitte Ihr Geschäftsziel und Ihre Tools (CRM/ERP/Helpdesk/E-Mail/WhatsApp) — dann schlage ich den passenden Service und den nächsten Schritt vor. Für Implementierungsanfragen: /contact oder molla@luxaiautomation.com.",
        lb: "Ech sinn de LuxAI-Assistent fir Lux AI Consultancy & Automation. Ech sinn hei fir Informatiounen ze ginn an alles iwwer eis Entreprise an eis Servicer ze erklären. Ech kann hei keng allgemeng Programmatiounshëllef oder Code liwweren. Ech kann awer bei eise Servicer hëllefen: AI-Chatbots, System-Integratiounen, Workflow-Automatisatioun a moossgeschneidert Business-Web-Apps. Sot mir w.e.g. Äert Business-Zil an Är Tools (CRM/ERP/Helpdesk/E-Mail/WhatsApp) — da proposéiere ech de passende Service an de nächste Schrëtt. Fir Implementatiounsufroen: /contact oder molla@luxaiautomation.com.",
      },
    },

    {
      intent: "assistant.guardrails.image_requests",
      tags: [
        "image",
        "logo",
        "design",
        "generate image",
        "picture",
        "branding",
      ],
      question: {
        en: "Can you generate an image or logo for me?",
        fr: "Pouvez-vous générer une image ou un logo ?",
        de: "Könnt ihr ein Bild oder Logo generieren?",
        lb: "Kënnt dir en Image oder e Logo generéieren?",
      },
      answer: {
        en: "I am the LuxAI Assistant for Lux AI Consultancy & Automation. I am here to provide information and explain anything about our company and services. I cannot create images or logos here. If you're interested in our services—AI chatbots, system integrations, workflow automation, or custom business web apps—I'd be happy to help. How can I assist you with our services?",
        fr: "Je suis l'assistant LuxAI pour Lux AI Consultancy & Automation. Je suis ici pour fournir des informations et expliquer tout ce qui concerne notre entreprise et nos services. Je ne peux pas créer d'images ou de logos ici. Si vous êtes intéressé par nos services—chatbots IA, intégrations systèmes, automatisation de workflows ou applications web métier sur mesure—je serais ravi de vous aider. Comment puis-je vous aider avec nos services ?",
        de: "Ich bin der LuxAI-Assistent für Lux AI Consultancy & Automation. Ich bin hier, um Informationen bereitzustellen und alles über unser Unternehmen und unsere Services zu erklären. Ich kann hier keine Bilder oder Logos erstellen. Wenn Sie an unseren Services interessiert sind—KI-Chatbots, Systemintegrationen, Workflow-Automatisierung oder individuelle Business-Web-Apps—helfe ich gerne. Wie kann ich Ihnen bei unseren Services helfen?",
        lb: "Ech sinn de LuxAI-Assistent fir Lux AI Consultancy & Automation. Ech sinn hei fir Informatiounen ze ginn an alles iwwer eis Entreprise an eis Servicer ze erklären. Ech kann hei keng Biller oder Logoen erstellen. Wann Dir un eise Servicer interesséiert sidd—AI-Chatbots, System-Integratiounen, Workflow-Automatisatioun oder moossgeschneidert Business-Web-Apps—hëllefen ech gär. Wéi kann ech Iech bei eise Servicer hëllefen?",
      },
    },

    {
      intent: "assistant.guardrails.essay_writing",
      tags: [
        "essay",
        "write essay",
        "write article",
        "write blog",
        "write content",
        "write story",
        "creative writing",
        "write paper",
        "help with homework",
        "academic writing",
      ],
      question: {
        en: "Can you write an essay or article for me?",
        fr: "Pouvez-vous écrire une dissertation ou un article pour moi ?",
        de: "Können Sie einen Aufsatz oder Artikel für mich schreiben?",
        lb: "Kënnt dir eppes schreiwen oder en Artikel fir mech?",
      },
      answer: {
        en: "I am the LuxAI Assistant for Lux AI Consultancy & Automation. I am here to provide information and explain anything about our company and services: AI chatbots, system integrations, workflow automation, and custom business web apps. I cannot write essays, articles, or creative content. How can I help you with our services?",
        fr: "Je suis l'assistant LuxAI pour Lux AI Consultancy & Automation. Je suis ici pour fournir des informations et expliquer tout ce qui concerne notre entreprise et nos services : chatbots IA, intégrations systèmes, automatisation de workflows et applications web métier sur mesure. Je ne peux pas écrire de dissertations, d'articles ou de contenu créatif. Comment puis-je vous aider avec nos services ?",
        de: "Ich bin der LuxAI-Assistent für Lux AI Consultancy & Automation. Ich bin hier, um Informationen bereitzustellen und alles über unser Unternehmen und unsere Services zu erklären: KI-Chatbots, Systemintegrationen, Workflow-Automatisierung und individuelle Business-Web-Apps. Ich kann keine Aufsätze, Artikel oder kreative Inhalte schreiben. Wie kann ich Ihnen bei unseren Services helfen?",
        lb: "Ech sinn de LuxAI-Assistent fir Lux AI Consultancy & Automation. Ech sinn hei fir Informatiounen ze ginn an alles iwwer eis Entreprise an eis Servicer ze erklären: AI-Chatbots, System-Integratiounen, Workflow-Automatisatioun a moossgeschneidert Business-Web-Apps. Ech kann keng Texter, Artikelen oder kreativ Contenu schreiwen. Wéi kann ech Iech bei eise Servicer hëllefen?",
      },
    },

    {
      intent: "assistant.guardrails.fun_entertainment",
      tags: [
        "joke",
        "fun fact",
        "tell me a story",
        "entertainment",
        "game",
        "riddle",
        "trivia",
        "funny",
        "humor",
      ],
      question: {
        en: "Can you tell me a joke or something fun?",
        fr: "Pouvez-vous me raconter une blague ou quelque chose d'amusant ?",
        de: "Können Sie mir einen Witz oder etwas Lustiges erzählen?",
        lb: "Kënnt dir mir e Witz oder eppes Lëschtegt soen?",
      },
      answer: {
        en: "I am the LuxAI Assistant for Lux AI Consultancy & Automation. I am here to provide information and explain anything about our company and services: AI chatbots, system integrations, workflow automation, and custom business web apps. I focus on helping businesses with automation solutions. How can I help you with our services?",
        fr: "Je suis l'assistant LuxAI pour Lux AI Consultancy & Automation. Je suis ici pour fournir des informations et expliquer tout ce qui concerne notre entreprise et nos services : chatbots IA, intégrations systèmes, automatisation de workflows et applications web métier sur mesure. Je me concentre sur l'aide aux entreprises avec des solutions d'automatisation. Comment puis-je vous aider avec nos services ?",
        de: "Ich bin der LuxAI-Assistent für Lux AI Consultancy & Automation. Ich bin hier, um Informationen bereitzustellen und alles über unser Unternehmen und unsere Services zu erklären: KI-Chatbots, Systemintegrationen, Workflow-Automatisierung und individuelle Business-Web-Apps. Ich konzentriere mich darauf, Unternehmen bei Automatisierungslösungen zu helfen. Wie kann ich Ihnen bei unseren Services helfen?",
        lb: "Ech sinn de LuxAI-Assistent fir Lux AI Consultancy & Automation. Ech sinn hei fir Informatiounen ze ginn an alles iwwer eis Entreprise an eis Servicer ze erklären: AI-Chatbots, System-Integratiounen, Workflow-Automatisatioun a moossgeschneidert Business-Web-Apps. Ech konzentréiere mech op d'Hëllef fir Entreprisen mat Automatiséierungs-Léisungen. Wéi kann ech Iech bei eise Servicer hëllefen?",
      },
    },

    {
      intent: "assistant.guardrails.non_business_or_sensitive",
      tags: [
        "medical",
        "legal advice",
        "investment",
        "politics",
        "personal",
        "relationship",
      ],
      question: {
        en: "Can you give medical/legal/financial advice?",
        fr: "Pouvez-vous donner des conseils médicaux/juridiques/financiers ?",
        de: "Könnt ihr medizinische/juristische/finanzielle Beratung geben?",
        lb: "Kënnt dir medezinesch/juristesch/finanziell Berodung ginn?",
      },
      answer: {
        en: "I am the LuxAI Assistant for Lux AI Consultancy & Automation. I am here to provide information and explain anything about our company and services. I cannot provide medical, legal, or financial advice. I can help with our services: AI chatbots, system integrations, workflow automation, and custom business web apps. If your question is about automating business processes, tell me your goal and tools and I'll suggest the next step.",
        fr: "Je suis l'assistant LuxAI pour Lux AI Consultancy & Automation. Je suis ici pour fournir des informations et expliquer tout ce qui concerne notre entreprise et nos services. Je ne peux pas fournir de conseils médicaux, juridiques ou financiers. Je peux aider avec nos services : chatbots IA, intégrations systèmes, automatisation de workflows et applications web métier sur mesure. Si votre question concerne l'automatisation de processus métier, décrivez votre objectif et vos outils et je proposerai la prochaine étape.",
        de: "Ich bin der LuxAI-Assistent für Lux AI Consultancy & Automation. Ich bin hier, um Informationen bereitzustellen und alles über unser Unternehmen und unsere Services zu erklären. Ich kann keine medizinische, rechtliche oder finanzielle Beratung geben. Ich kann bei unseren Services helfen: KI-Chatbots, Systemintegrationen, Workflow-Automatisierung und individuelle Business-Web-Apps. Wenn es um die Automatisierung von Geschäftsprozessen geht, nennen Sie Ziel und Tools — dann schlage ich den nächsten Schritt vor.",
        lb: "Ech sinn de LuxAI-Assistent fir Lux AI Consultancy & Automation. Ech sinn hei fir Informatiounen ze ginn an alles iwwer eis Entreprise an eis Servicer ze erklären. Ech kann keng medezinesch, juristesch oder finanziell Berodung ginn. Ech kann bei eise Servicer hëllefen: AI-Chatbots, System-Integratiounen, Workflow-Automatisatioun a moossgeschneidert Business-Web-Apps. Wann et ëm d'Automatiséierung vu Business-Prozesser geet, sot mir Äert Zil an Är Tools — da proposéiere ech de nächste Schrëtt.",
      },
    },

    // ---------------------------
    // Scope guide: services-only (useful for unknown/out-of-scope)
    // ---------------------------
    {
      intent: "assistant.scope.services_only",
      tags: [
        "scope",
        "services",
        "help",
        "out-of-scope",
        "what can you do",
        "capabilities",
      ],
      question: {
        en: "What can you help with?",
        fr: "Avec quoi pouvez-vous aider ?",
        de: "Wobei können Sie helfen?",
        lb: "Woubäi kënnt dir hëllefen?",
      },
      answer: {
        en: "I am the LuxAI Assistant for Lux AI Consultancy & Automation. I am here to provide information and explain anything about our company and services. I help with Lux AI Consultancy & Automation services only: AI chatbots (website/portal/WhatsApp), AI + system integrations (CRM/ERP/APIs/webhooks), workflow automation (sales/support/documents/approvals), and custom business web apps (ERP, e-commerce, admin platforms). Tell me your industry + tools + what you want to automate, and I'll suggest the best next step. Or use /contact / molla@luxaiautomation.com.",
        fr: "Je suis l'assistant LuxAI pour Lux AI Consultancy & Automation. Je suis ici pour fournir des informations et expliquer tout ce qui concerne notre entreprise et nos services. Je vous aide uniquement sur les services de Lux AI Consultancy & Automation : chatbots IA (site/portail/WhatsApp), IA + intégrations systèmes (CRM/ERP/APIs/webhooks), automatisation de workflows (ventes/support/documents/validations), et applications web métier sur mesure (ERP, e-commerce, plateformes admin). Dites-moi votre secteur + vos outils + ce que vous voulez automatiser et je proposerai la prochaine étape. Ou utilisez /contact / molla@luxaiautomation.com.",
        de: "Ich bin der LuxAI-Assistent für Lux AI Consultancy & Automation. Ich bin hier, um Informationen bereitzustellen und alles über unser Unternehmen und unsere Services zu erklären. Ich helfe ausschließlich zu den Services von Lux AI Consultancy & Automation: KI-Chatbots (Website/Portal/WhatsApp), KI + Systemintegrationen (CRM/ERP/APIs/Webhooks), Workflow-Automatisierung (Vertrieb/Support/Dokumente/Freigaben), und individuelle Business-Web-Apps (ERP, E-Commerce, Admin-Plattformen). Nennen Sie Branche + Tools + den Prozess, den Sie automatisieren möchten — dann schlage ich den nächsten Schritt vor. Oder /contact / molla@luxaiautomation.com.",
        lb: "Ech sinn de LuxAI-Assistent fir Lux AI Consultancy & Automation. Ech sinn hei fir Informatiounen ze ginn an alles iwwer eis Entreprise an eis Servicer ze erklären. Ech hëllefen nëmme bei de Servicer vu Lux AI Consultancy & Automation: AI-Chatbots (Websäit/Portal/WhatsApp), AI + System-Integratiounen (CRM/ERP/APIs/Webhooks), Workflow-Automatisatioun (Verkaf/Support/Dokumenter/Approvals), a moossgeschneidert Business-Web-Apps (ERP, E-Commerce, Admin-Plattformen). Sot mir Är Branche + Är Tools + wat Dir wëllt automatiséieren, da proposéiere ech de nächste Schrëtt. Oder /contact / molla@luxaiautomation.com.",
      },
    },

    // ---------------------------
    // Fallback (IMPORTANT)
    // ---------------------------
    {
      intent: "assistant.fallback.helpful_next_step",
      tags: ["fallback", "unknown", "help", "next step"],
      question: {
        en: "What if the user asks something not covered?",
        fr: "Que faire si l’utilisateur demande quelque chose qui n’est pas couvert ?",
        de: "Was, wenn der Nutzer etwas fragt, das nicht abgedeckt ist?",
        lb: "Wat wann de Benotzer eppes freet wat net ofgedeckt ass?",
      },
      answer: {
        en: "I am the LuxAI Assistant for Lux AI Consultancy & Automation. I am here to provide information and explain anything about our company and services. I can help with: AI chatbots, integrations, workflow automation, and custom business web apps (ERP, e-commerce, admin portals). If you tell me your industry, tools, and the process you want to automate, I can suggest a simple next step. Next step: use /contact or email molla@luxaiautomation.com so we can follow up with specifics.",
        fr: "Je suis l'assistant LuxAI pour Lux AI Consultancy & Automation. Je suis ici pour fournir des informations et expliquer tout ce qui concerne notre entreprise et nos services. Je peux aider avec : chatbots IA, intégrations, automatisation de workflows et apps web métier (ERP, e-commerce, portails/admin). Dites-moi votre secteur, vos outils et le processus à automatiser — je proposerai une prochaine étape simple. Prochaine étape : utilisez /contact ou envoyez un email à molla@luxaiautomation.com.",
        de: "Ich bin der LuxAI-Assistent für Lux AI Consultancy & Automation. Ich bin hier, um Informationen bereitzustellen und alles über unser Unternehmen und unsere Services zu erklären. Ich kann helfen mit: KI-Chatbots, Integrationen, Workflow-Automatisierung und Business-Web-Apps (ERP, E-Commerce, Admin-Portale). Nennen Sie Branche, Tools und den Prozess, den Sie automatisieren möchten — dann schlage ich einen einfachen nächsten Schritt vor. Nächster Schritt: /contact nutzen oder an molla@luxaiautomation.com schreiben, damit wir gezielt nachfassen können.",
        lb: "Ech sinn de LuxAI-Assistent fir Lux AI Consultancy & Automation. Ech sinn hei fir Informatiounen ze ginn an alles iwwer eis Entreprise an eis Servicer ze erklären. Ech kann hëllefen mat: AI-Chatbots, Integratiounen, Workflow-Automatisatioun an Business-Web-Apps (ERP, E-Commerce, Admin-Portalen). Sot mir Är Branche, Är Tools an de Prozess fir ze automatiséieren — da proposéiere ech e simple nächste Schrëtt. Nächste Schrëtt: /contact benotzen oder un molla@luxaiautomation.com schreiwen, fir datt mir konkret kënne follow-up maachen.",
      },
    },
  ] as const satisfies readonly KBAnswer[],
} as const;

// // app/data/knowledge.ts

// export type Lang = "en" | "fr" | "de" | "lb";

// export type KBAnswer = {
//   intent: string;
//   tags?: string[];
//   question: Record<Lang, string>;
//   answer: Record<Lang, string>;
// };

// export type KBLocalizedString = Record<Lang, string>;
// export type KBLocalizedList = Record<Lang, string[]>;

// export type KBService = {
//   id: string;
//   name: KBLocalizedString;
//   outcomes: KBLocalizedList;
//   includes: KBLocalizedList;
//   notes?: KBLocalizedList;
//   keywords: readonly string[];
// };

// export type KBTeamMember = {
//   id: string;
//   name: KBLocalizedString;
//   role: KBLocalizedString;
//   quote: KBLocalizedString;
//   keywords?: readonly string[];
// };

// export type BusinessKB = {
//   meta: {
//     version: string;
//     docId: string;
//     supportedLanguages: readonly Lang[];
//     defaultLanguage: Lang;
//     lastUpdated: string; // ISO date
//   };
//   company: {
//     name: string;
//     oneLiner: KBLocalizedString;
//     positioning: KBLocalizedString;
//   };
//   team?: readonly KBTeamMember[];
//   services: readonly KBService[];
//   industries: { list: KBLocalizedList };
//   process: { steps: KBLocalizedList };
//   leadQuestions: { list: KBLocalizedList };
//   contact: {
//     email: string;
//     formUrl: string; // relative path is fine
//     note: KBLocalizedString;
//     cta: KBLocalizedString;
//   };
//   qa: readonly KBAnswer[];
// };

// export const BUSINESS_KB: BusinessKB = {
//   meta: {
//     version: "1.3.1",
//     docId: "luxai_kb_v1",
//     supportedLanguages: ["en", "fr", "de", "lb"],
//     defaultLanguage: "en",
//     lastUpdated: "2025-12-26",
//   },

//   company: {
//     name: "Lux AI Consultancy & Automation",
//     oneLiner: {
//       en: "We help businesses integrate AI and automate workflows across their tools and systems.",
//       fr: "Nous aidons les entreprises à intégrer l’IA et à automatiser leurs workflows à travers leurs outils et systèmes.",
//       de: "Wir helfen Unternehmen dabei, KI zu integrieren und Workflows über ihre Tools und Systeme hinweg zu automatisieren.",
//       lb: "Mir hëllefen Entreprisen, AI z’integréieren an Workflows iwwer hir Tools a Systemer ze automatiséieren.",
//     },
//     positioning: {
//       en: "AI integration + automation for operations, sales, support, and back-office.",
//       fr: "Intégration IA + automatisation pour les opérations, les ventes, le support et le back-office.",
//       de: "KI-Integration + Automatisierung für Betrieb, Vertrieb, Support und Backoffice.",
//       lb: "AI-Integratioun + Automatisatioun fir Operatiounen, Verkaf, Support an Backoffice.",
//     },
//   },

//   team: [
//     {
//       id: "team.molla",
//       name: {
//         en: "Molla Sisay Jemere",
//         fr: "Molla Sisay Jemere",
//         de: "Molla Sisay Jemere",
//         lb: "Molla Sisay Jemere",
//       },
//       role: {
//         en: "CEO & Founder · Full-Stack & AI Automation Strategist",
//         fr: "CEO & Fondateur · Stratège Full-Stack & Automatisation IA",
//         de: "CEO & Gründer · Full-Stack- & KI-Automatisierungsstratege",
//         lb: "CEO & Grënner · Full-Stack & AI-Automatiséierungs-Strateg",
//       },
//       quote: {
//         en: "Leads the company’s vision and strategy, with a focus on simplifying complex business processes through intelligent automation and scalable AI-driven systems that improve efficiency and reduce operational bottlenecks.",
//         fr: "Porte la vision et la stratégie de l’entreprise, avec un accent sur la simplification des processus métiers complexes grâce à l’automatisation intelligente et à des systèmes IA évolutifs qui améliorent l’efficacité et réduisent les goulots d’étranglement.",
//         de: "Verantwortet Vision und Strategie mit dem Fokus darauf, komplexe Geschäftsprozesse durch intelligente Automatisierung und skalierbare KI-gestützte Systeme zu vereinfachen und operative Engpässe zu reduzieren.",
//         lb: "Leet d’Visioun an d’Strategie vun der Entreprise, mat Fokus op d’Vereinfachung vu komplexe Business-Prozesser duerch intelligent Automatisatioun a skaléierbar AI-gedriwwe Systemer, déi d’Effizienz erhéijen an Engpäss reduzéieren.",
//       },
//       keywords: [
//         "ceo",
//         "founder",
//         "strategy",
//         "process automation",
//         "ai systems",
//         "business optimization",
//       ],
//     },

//     {
//       id: "team.fikre",
//       name: {
//         en: "Fikremariam Mekonnen",
//         fr: "Fikremariam Mekonnen",
//         de: "Fikremariam Mekonnen",
//         lb: "Fikremariam Mekonnen",
//       },
//       role: {
//         en: "Co-Founder · Full-Stack, AI & Integrations Engineer",
//         fr: "Co-Fondateur · Ingénieur Full-Stack, IA & Intégrations",
//         de: "Co-Founder · Full-Stack-, KI- & Integrationsingenieur",
//         lb: "Co-Founder · Full-Stack-, AI- & Integratiounsingenieur",
//       },
//       quote: {
//         en: "Designs and builds robust system integrations and automation architectures that operate reliably in real-world business environments and scale with organizational growth.",
//         fr: "Conçoit et développe des intégrations systèmes robustes et des architectures d’automatisation fiables, conçues pour fonctionner dans des environnements métiers réels et évoluer avec la croissance de l’organisation.",
//         de: "Entwirft und entwickelt robuste Systemintegrationen und Automatisierungsarchitekturen, die in realen Geschäftsumgebungen zuverlässig funktionieren und mit dem Unternehmenswachstum skalieren.",
//         lb: "Entwéckelt robust System-Integratiounen an Automatiséierungs-Architekturen, déi zouverlässeg an realen Business-Ëmfeld funktionéieren a mat dem Wuesstem vun der Organisatioun skaléieren.",
//       },
//       keywords: [
//         "co-founder",
//         "integrations",
//         "automation architecture",
//         "api",
//         "systems engineering",
//         "scalability",
//       ],
//     },

//     {
//       id: "team.dereje",
//       name: {
//         en: "Dereje Masresha",
//         fr: "Dereje Masresha",
//         de: "Dereje Masresha",
//         lb: "Dereje Masresha",
//       },
//       role: {
//         en: "AWS Cloud Enthusiast · Full-Stack & AI Solutions Developer",
//         fr: "Passionné AWS Cloud · Développeur Full-Stack & Solutions IA",
//         de: "AWS-Cloud-Enthusiast · Full-Stack- & KI-Lösungsentwickler",
//         lb: "AWS Cloud Enthusiast · Full-Stack & AI-Léisungs-Entwéckler",
//       },
//       quote: {
//         en: "Builds full-stack solutions that combine clean user interfaces, scalable cloud-backed systems, and practical AI automation to deliver reliable, user-focused applications.",
//         fr: "Développe des solutions full-stack combinant des interfaces claires, des systèmes cloud évolutifs et une automatisation IA pragmatique pour livrer des applications fiables et centrées utilisateur.",
//         de: "Entwickelt Full-Stack-Lösungen mit klaren Benutzeroberflächen, skalierbaren Cloud-Systemen und praxisnaher KI-Automatisierung für zuverlässige, nutzerorientierte Anwendungen.",
//         lb: "Entwéckelt Full-Stack-Léisungen mat propperen Interfaces, skaléierbare Cloud-Systemer an praktescher AI-Automatisatioun fir zouverlässeg, user-fokusséiert Uwendungen.",
//       },
//       keywords: [
//         "aws",
//         "cloud",
//         "full-stack",
//         "ai solutions",
//         "automation",
//         "scalable systems",
//       ],
//     },
//   ] as const,

//   services: [
//     {
//       id: "services.chatbots",
//       name: {
//         en: "AI Chatbots (Website, Portal, WhatsApp)",
//         fr: "Chatbots IA (site web, portail, WhatsApp)",
//         de: "KI-Chatbots (Website, Portal, WhatsApp)",
//         lb: "AI-Chatbots (Websäit, Portal, WhatsApp)",
//       },
//       outcomes: {
//         en: [
//           "24/7 lead capture",
//           "faster support",
//           "better customer experience",
//         ],
//         fr: [
//           "capture de leads 24/7",
//           "support plus rapide",
//           "meilleure expérience client",
//         ],
//         de: [
//           "Lead-Erfassung rund um die Uhr",
//           "schnellerer Support",
//           "besseres Kundenerlebnis",
//         ],
//         lb: [
//           "Leads 24/7 erfassen",
//           "méi schnelle Support",
//           "besser Clientserfarung",
//         ],
//       },
//       includes: {
//         en: [
//           "Multilingual chat (EN/FR/DE/LB)",
//           "FAQ-style answers (RAG-ready)",
//           "Lead capture + handoff to humans",
//           "Integration with CRM/helpdesk",
//           "Public mode (available to any visitor)",
//           "Protected mode (only for authenticated users)",
//           "Admin tools to update the assistant’s information content consistently",
//         ],
//         fr: [
//           "Chat multilingue (EN/FR/DE/LB)",
//           "Réponses type FAQ (prêt pour RAG)",
//           "Capture de leads + transfert à un humain",
//           "Intégration CRM/helpdesk",
//           "Mode public (accessible à tout visiteur)",
//           "Mode protégé (utilisateurs authentifiés)",
//           "Outils admin pour mettre à jour les informations de l’assistant de façon cohérente",
//         ],
//         de: [
//           "Mehrsprachiger Chat (EN/FR/DE/LB)",
//           "FAQ-ähnliche Antworten (RAG-fähig)",
//           "Lead-Erfassung + Übergabe an Menschen",
//           "Integration mit CRM/Helpdesk",
//           "Öffentlicher Modus (für alle Besucher)",
//           "Geschützter Modus (nur authentifizierte Nutzer)",
//           "Admin-Tools zur konsistenten Pflege der Assistenten-Informationen",
//         ],
//         lb: [
//           "Méisproochege Chat (EN/FR/DE/LB)",
//           "FAQ-Äntwerten (RAG-ready)",
//           "Lead-Capture + Iwwergab un e Mënsch",
//           "Integratioun mat CRM/Helpdesk",
//           "Public Modus (fir all Visiteur)",
//           "Protected Modus (nëmme fir authentifizéiert Benotzer)",
//           "Admin-Tools fir d’Informatioune vum Assistent konsequent ze aktualiséieren",
//         ],
//       },
//       notes: {
//         en: [
//           "Public vs protected: choose access based on the use case (marketing vs customer portal vs internal ops).",
//           "We can add role-based access, audit logs, and admin controls when needed.",
//         ],
//         fr: [
//           "Public vs protégé : choisissez l’accès selon le besoin (marketing vs portail client vs interne).",
//           "Nous pouvons ajouter accès par rôles, logs d’audit et contrôles admin si nécessaire.",
//         ],
//         de: [
//           "Öffentlich vs geschützt: Zugriff je nach Use Case (Marketing vs Kundenportal vs intern).",
//           "Optional: rollenbasierter Zugriff, Audit-Logs und Admin-Kontrollen.",
//         ],
//         lb: [
//           "Public vs protected: Zougang jee no Use Case (Marketing vs Client-Portal vs intern).",
//           "Optional: Role-based Access, Audit-Logs an Admin-Kontrollen.",
//         ],
//       },
//       keywords: [
//         "chatbot",
//         "website chatbot",
//         "public chatbot",
//         "protected chatbot",
//         "authenticated",
//         "roles",
//         "rbac",
//         "rag",
//         "support",
//         "lead capture",
//         "whatsapp",
//       ],
//     },

//     {
//       id: "services.integrations",
//       name: {
//         en: "AI + System Integration",
//         fr: "IA + intégration de systèmes",
//         de: "KI + Systemintegration",
//         lb: "AI + System-Integratioun",
//       },
//       outcomes: {
//         en: ["connected systems", "less manual work", "clean data flow"],
//         fr: [
//           "systèmes connectés",
//           "moins de travail manuel",
//           "flux de données propre",
//         ],
//         de: [
//           "verbundene Systeme",
//           "weniger manuelle Arbeit",
//           "sauberer Datenfluss",
//         ],
//         lb: [
//           "verbonnen Systemer",
//           "manner manuell Aarbecht",
//           "propperen Datefloss",
//         ],
//       },
//       includes: {
//         en: [
//           "CRM/ERP integration (HubSpot/Salesforce/others)",
//           "Email + calendar automation",
//           "APIs, webhooks, middleware",
//           "Automation platforms (n8n/Make/Zapier) + custom code",
//           "Notifications (email/WhatsApp), approvals, and sync jobs",
//         ],
//         fr: [
//           "Intégration CRM/ERP (HubSpot/Salesforce/autres)",
//           "Automatisation email + calendrier",
//           "APIs, webhooks, middleware",
//           "Plateformes (n8n/Make/Zapier) + code sur mesure",
//           "Notifications (email/WhatsApp), validations, synchronisations",
//         ],
//         de: [
//           "CRM/ERP-Integration (HubSpot/Salesforce/weitere)",
//           "E-Mail- + Kalender-Automation",
//           "APIs, Webhooks, Middleware",
//           "Plattformen (n8n/Make/Zapier) + Custom Code",
//           "Benachrichtigungen (E-Mail/WhatsApp), Freigaben, Sync-Jobs",
//         ],
//         lb: [
//           "CRM/ERP-Integratioun (HubSpot/Salesforce/anerer)",
//           "E-Mail- a Kalenner-Automatisatioun",
//           "APIs, Webhooks, Middleware",
//           "Plattformen (n8n/Make/Zapier) + Custom Code",
//           "Notifikatiounen (E-Mail/WhatsApp), Approvals a Sync-Jobs",
//         ],
//       },
//       keywords: [
//         "integration",
//         "crm",
//         "erp",
//         "api",
//         "webhook",
//         "n8n",
//         "zapier",
//         "make",
//         "whatsapp",
//       ],
//     },

//     {
//       id: "services.workflows",
//       name: {
//         en: "Workflow Automation",
//         fr: "Automatisation des workflows",
//         de: "Workflow-Automatisierung",
//         lb: "Workflow-Automatisatioun",
//       },
//       outcomes: {
//         en: ["reduced cost", "fewer errors", "faster delivery"],
//         fr: ["coûts réduits", "moins d’erreurs", "exécution plus rapide"],
//         de: ["geringere Kosten", "weniger Fehler", "schnellere Umsetzung"],
//         lb: ["manner Käschten", "manner Feeler", "méi séier Ëmsetzung"],
//       },
//       includes: {
//         en: [
//           "Sales ops automation (lead routing, follow-ups)",
//           "Support automation (ticket triage, auto-replies)",
//           "Document workflows (intake, extraction, approvals)",
//           "Monitoring + dashboards",
//           "Human-in-the-loop for exceptions (when needed)",
//         ],
//         fr: [
//           "Automatisation sales ops (routage des leads, relances)",
//           "Automatisation support (tri des tickets, réponses automatiques)",
//           "Workflows documentaires (intake, extraction, validations)",
//           "Monitoring + dashboards",
//           "Human-in-the-loop pour les exceptions (si nécessaire)",
//         ],
//         de: [
//           "Sales-Ops-Automation (Lead-Routing, Follow-ups)",
//           "Support-Automation (Ticket-Triage, Auto-Antworten)",
//           "Dokumenten-Workflows (Intake, Extraktion, Freigaben)",
//           "Monitoring + Dashboards",
//           "Human-in-the-loop für Ausnahmen (bei Bedarf)",
//         ],
//         lb: [
//           "Sales-Ops Automatisatioun (Lead-Routing, Follow-ups)",
//           "Support Automatisatioun (Ticket-Triage, Auto-Äntwerten)",
//           "Dokument-Workflows (Intake, Extraktioun, Approvals)",
//           "Monitoring + Dashboards",
//           "Human-in-the-loop fir Ausnamen (wann néideg)",
//         ],
//       },
//       keywords: [
//         "workflow",
//         "automation",
//         "tickets",
//         "documents",
//         "monitoring",
//         "dashboards",
//         "approvals",
//       ],
//     },

//     {
//       id: "services.business_apps",
//       name: {
//         en: "Custom Business Web Apps (ERP, E-commerce, Admin Platforms)",
//         fr: "Applications web métier sur mesure (ERP, e-commerce, plateformes admin)",
//         de: "Individuelle Business-Web-Apps (ERP, E-Commerce, Admin-Plattformen)",
//         lb: "Moossgeschneidert Business-Web-Apps (ERP, E-Commerce, Admin-Plattformen)",
//       },
//       outcomes: {
//         en: [
//           "centralized operations",
//           "admin-controlled workflows",
//           "better visibility and reporting",
//           "reduced manual effort",
//         ],
//         fr: [
//           "opérations centralisées",
//           "workflows contrôlés par admin",
//           "meilleure visibilité et reporting",
//           "moins de travail manuel",
//         ],
//         de: [
//           "zentralisierte Abläufe",
//           "admin-gesteuerte Workflows",
//           "mehr Transparenz und Reporting",
//           "weniger manuelle Arbeit",
//         ],
//         lb: [
//           "zentral Operatiounen",
//           "admin-kontrolléiert Workflows",
//           "méi Iwwerbléck a Reporting",
//           "manner manuell Aarbecht",
//         ],
//       },
//       includes: {
//         en: [
//           "ERP-style business apps (operations, back-office, reporting)",
//           "E-commerce workflows (catalog, orders, customer processes)",
//           "Inventory/stock management (items, stock levels, movements)",
//           "Centralized, admin-controlled cafe management app (menu, orders, stock, staff workflows)",
//           "Role-based access (admin/manager/staff/customer)",
//           "Automation + integrations (payments, CRM, accounting, notifications)",
//         ],
//         fr: [
//           "Apps type ERP (opérations, back-office, reporting)",
//           "Workflows e-commerce (catalogue, commandes, parcours client)",
//           "Gestion de stock (articles, niveaux, mouvements)",
//           "App de gestion de café centralisée contrôlée par admin (menu, commandes, stock, équipe)",
//           "Accès par rôles (admin/manager/employé/client)",
//           "Automatisation + intégrations (paiements, CRM, compta, notifications)",
//         ],
//         de: [
//           "ERP-ähnliche Business-Apps (Betrieb, Backoffice, Reporting)",
//           "E-Commerce-Workflows (Katalog, Bestellungen, Kundenprozesse)",
//           "Inventar-/Bestandsmanagement (Artikel, Bestände, Bewegungen)",
//           "Zentrale, admin-gesteuerte Café-Management-App (Menü, Bestellungen, Bestand, Team-Workflows)",
//           "Rollenbasierter Zugriff (Admin/Manager/Mitarbeiter/Kunde)",
//           "Automatisierung + Integrationen (Zahlungen, CRM, Buchhaltung, Benachrichtigungen)",
//         ],
//         lb: [
//           "ERP-ähnlech Business-Apps (Operatiounen, Backoffice, Reporting)",
//           "E-Commerce Workflows (Katalog, Bestellungen, Client-Prozesser)",
//           "Stock/Inventar-Management (Artikelen, Stock-Stand, Beweegungen)",
//           "Zentral, admin-kontrolléiert Café-Management-App (Menu, Bestellungen, Stock, Staff-Workflows)",
//           "Role-based Access (Admin/Manager/Staff/Client)",
//           "Automatisatioun + Integratiounen (Payments, CRM, Accounting, Notifikatiounen)",
//         ],
//       },
//       notes: {
//         en: [
//           "Best when you need one centralized system instead of scattered spreadsheets and manual steps.",
//           "Can include an admin panel to manage data, content, roles, and the assistant’s information content.",
//         ],
//         fr: [
//           "Utile quand vous avez besoin d’un système central plutôt que des fichiers dispersés et des étapes manuelles.",
//           "Peut inclure un panneau admin pour gérer données, contenu, rôles et les informations de l’assistant.",
//         ],
//         de: [
//           "Sinnvoll, wenn Sie ein zentrales System statt verstreuter Tabellen und manueller Schritte benötigen.",
//           "Optional mit Admin-Panel für Daten, Inhalte, Rollen und Assistenten-Informationen.",
//         ],
//         lb: [
//           "Sënnvoll, wann Dir e zentral System braucht amplaz verspreete Tabellen a manuell Schrëtt.",
//           "Optional mat Admin-Panel fir Daten, Contenu, Rollen an d’Informatioune vum Assistent.",
//         ],
//       },
//       keywords: [
//         "erp",
//         "business app",
//         "web app",
//         "ecommerce",
//         "inventory",
//         "stock management",
//         "cafe management",
//         "admin panel",
//         "roles",
//         "rbac",
//       ],
//     },
//   ] as const,

//   industries: {
//     list: {
//       en: [
//         "Professional services",
//         "E-commerce",
//         "Logistics",
//         "Healthcare (non-clinical workflows)",
//         "Manufacturing",
//         "Real estate",
//         "Hospitality (operations & back-office)",
//       ],
//       fr: [
//         "Services professionnels",
//         "E-commerce",
//         "Logistique",
//         "Santé (workflows non cliniques)",
//         "Industrie / fabrication",
//         "Immobilier",
//         "Hôtellerie-restauration (opérations & back-office)",
//       ],
//       de: [
//         "Professionelle Dienstleistungen",
//         "E-Commerce",
//         "Logistik",
//         "Gesundheitswesen (nicht-klinische Workflows)",
//         "Fertigung",
//         "Immobilien",
//         "Gastronomie/Hotellerie (Betrieb & Backoffice)",
//       ],
//       lb: [
//         "Professionell Servicer",
//         "E-Commerce",
//         "Logistik",
//         "Gesondheetsberäich (net-klinesch Workflows)",
//         "Industrie",
//         "Immobiljen",
//         "Gastronomie/Hotellerie (Operatiounen & Backoffice)",
//       ],
//     },
//   },

//   process: {
//     steps: {
//       en: [
//         "Discovery (goals, tools, pain points)",
//         "Solution design (architecture + integrations)",
//         "Build & test (automation + assistant)",
//         "Deploy (security + monitoring)",
//         "Support & iteration",
//       ],
//       fr: [
//         "Découverte (objectifs, outils, points de douleur)",
//         "Conception (architecture + intégrations)",
//         "Build & test (automatisation + assistant)",
//         "Déploiement (sécurité + monitoring)",
//         "Support & itération",
//       ],
//       de: [
//         "Discovery (Ziele, Tools, Pain Points)",
//         "Lösungsdesign (Architektur + Integrationen)",
//         "Build & Test (Automatisierung + Assistent)",
//         "Deployment (Sicherheit + Monitoring)",
//         "Support & Iteration",
//       ],
//       lb: [
//         "Discovery (Ziler, Tools, Pain Points)",
//         "Léisungsdesign (Architektur + Integratiounen)",
//         "Build & Test (Automatisatioun + Assistent)",
//         "Deploy (Sécherheet + Monitoring)",
//         "Support & Iteratioun",
//       ],
//     },
//   },

//   leadQuestions: {
//     list: {
//       en: [
//         "What industry are you in?",
//         "Which tools do you use (CRM/ERP/helpdesk/email/WhatsApp)?",
//         "What do you want to automate first?",
//         "Roughly how many users/requests per month?",
//       ],
//       fr: [
//         "Dans quel secteur êtes-vous ?",
//         "Quels outils utilisez-vous (CRM/ERP/helpdesk/email/WhatsApp) ?",
//         "Que voulez-vous automatiser en premier ?",
//         "Environ combien d’utilisateurs/de demandes par mois ?",
//       ],
//       de: [
//         "In welcher Branche sind Sie tätig?",
//         "Welche Tools nutzen Sie (CRM/ERP/Helpdesk/E-Mail/WhatsApp)?",
//         "Was möchten Sie zuerst automatisieren?",
//         "Wie viele Nutzer/Anfragen pro Monat ungefähr?",
//       ],
//       lb: [
//         "A wéi enger Branche sidd Dir?",
//         "Wéi eng Tools benotzt Dir (CRM/ERP/Helpdesk/E-Mail/WhatsApp)?",
//         "Wat wëllt Dir als éischt automatiséieren?",
//         "Ongeféier wéi vill Benotzer/Ufroen pro Mount?",
//       ],
//     },
//   },

//   contact: {
//     email: "molla@luxaiautomation.com",
//     formUrl: "/contact",
//     note: {
//       en: "Preferred: share details via our contact form or email so we can reply with specifics.",
//       fr: "Idéalement : partagez les détails via notre formulaire de contact ou par email afin que nous puissions répondre précisément.",
//       de: "Bevorzugt: Teilen Sie Details über unser Kontaktformular oder per E-Mail, damit wir gezielt antworten können.",
//       lb: "Am léifsten: schéckt d’Detailer iwwer eise Contact-Formulaire oder per E-Mail, fir datt mir konkret kënne äntweren.",
//     },
//     cta: {
//       en: "Share your goal, tools, and your name/email/company so we can propose a simple plan. Use /contact or email molla@luxaiautomation.com.",
//       fr: "Partagez votre objectif, vos outils et votre nom/email/entreprise afin que nous proposions un plan simple. Utilisez /contact ou écrivez à molla@luxaiautomation.com.",
//       de: "Teilen Sie Ihr Ziel, Ihre Tools sowie Ihren Namen/E-Mail/Firma, damit wir einen einfachen Plan vorschlagen können. Nutzen Sie /contact oder schreiben Sie an molla@luxaiautomation.com.",
//       lb: "Deelt äert Zil, är Tools an ären Numm/E-Mail/Firma, da proposéiere mir e simple Plang. Benotzt /contact oder schreift un molla@luxaiautomation.com.",
//     },
//   },

//   qa: [
//     // ---------------------------
//     // Services Q&A
//     // ---------------------------
//     {
//       intent: "services.chatbots.public_vs_protected",
//       tags: ["public chatbot", "protected chatbot", "auth", "login", "roles"],
//       question: {
//         en: "Do you offer public and protected chatbots?",
//         fr: "Proposez-vous des chatbots publics et protégés ?",
//         de: "Bietet ihr öffentliche und geschützte Chatbots an?",
//         lb: "Bitt dir public an protected Chatbots un?",
//       },
//       answer: {
//         en: "Yes. A public chatbot is available to any visitor (great for FAQs and lead capture). A protected chatbot is for authenticated users (great for customer portals or internal teams). We can also add role-based access and admin controls to keep the assistant’s information content consistent.",
//         fr: "Oui. Un chatbot public est accessible à tout visiteur (idéal pour FAQ et leads). Un chatbot protégé est réservé aux utilisateurs authentifiés (idéal pour portails clients ou équipes internes). Nous pouvons aussi ajouter un accès par rôles et des contrôles admin pour garder les informations de l’assistant cohérentes.",
//         de: "Ja. Ein öffentlicher Chatbot ist für alle Besucher verfügbar (ideal für FAQs und Leads). Ein geschützter Chatbot ist für authentifizierte Nutzer gedacht (ideal für Kundenportale oder interne Teams). Zusätzlich sind rollenbasierter Zugriff und Admin-Kontrollen möglich, damit die Assistenten-Informationen konsistent bleiben.",
//         lb: "Jo. E public Chatbot ass fir all Visiteur (super fir FAQen a Leads). E protected Chatbot ass fir authentifizéiert Benotzer (super fir Client-Portaler oder intern Teams). Mir kënnen och Role-based Access an Admin-Kontrollen derbäi maachen, fir datt d’Informatioune vum Assistent konsequent bleiwen.",
//       },
//     },
//     {
//       intent: "services.business_apps.what_you_build",
//       tags: [
//         "erp",
//         "ecommerce",
//         "inventory",
//         "stock",
//         "cafe management",
//         "admin panel",
//         "web app",
//       ],
//       question: {
//         en: "What kinds of business web apps can you build?",
//         fr: "Quels types d’applications web métier pouvez-vous développer ?",
//         de: "Welche Arten von Business-Web-Apps könnt ihr bauen?",
//         lb: "Wat fir Business-Web-Apps kënnt dir bauen?",
//       },
//       answer: {
//         en: "We build custom business web apps such as ERP-style systems, e-commerce workflows, inventory/stock management tools, and centralized admin-controlled platforms (for example a cafe management app with menu, orders, stock, and staff workflows). We also add integrations and automation so data flows cleanly across tools.",
//         fr: "Nous développons des applications web métier sur mesure : systèmes type ERP, workflows e-commerce, outils de gestion de stock, et plateformes centralisées contrôlées par admin (par exemple une app de gestion de café : menu, commandes, stock, équipe). Nous ajoutons aussi des intégrations et de l’automatisation pour que les données circulent proprement entre vos outils.",
//         de: "Wir bauen individuelle Business-Web-Apps: ERP-ähnliche Systeme, E-Commerce-Workflows, Inventar-/Bestandsmanagement und zentrale admin-gesteuerte Plattformen (z. B. eine Café-Management-App mit Menü, Bestellungen, Bestand und Team-Workflows). Zusätzlich integrieren und automatisieren wir Tools, damit Daten sauber zwischen Systemen fließen.",
//         lb: "Mir bauen moossgeschneidert Business-Web-Apps: ERP-ähnlech Systemer, E-Commerce-Workflows, Stock/Inventar-Management an zentral admin-kontrolléiert Plattformen (z. B. eng Café-Management-App mat Menu, Bestellungen, Stock a Staff-Workflows). Mir maachen och Integratiounen an Automatisatioun, fir datt d’Daten propper tëscht Tools fléissen.",
//       },
//     },

//     // ---------------------------
//     // Platforms (from site copy)
//     // ---------------------------
//     {
//       intent: "platforms.we_build",
//       tags: [
//         "platforms",
//         "erp",
//         "custom apps",
//         "ecommerce",
//         "customer portals",
//         "dashboards",
//       ],
//       question: {
//         en: "What platforms do you build and modernize?",
//         fr: "Quelles plateformes construisez-vous et modernisez-vous ?",
//         de: "Welche Plattformen baut und modernisiert ihr?",
//         lb: "Wéi eng Plattformen baut a moderniséiert dir?",
//       },
//       answer: {
//         en: [
//           "From my information, we build and modernize core business systems so data flows cleanly and teams move faster:",
//           "• ERP systems (role-based modules, approvals, reporting)",
//           "• Custom business apps (internal tools, admin portals, dashboards)",
//           "• E-commerce platforms (orders, inventory sync, fulfillment automation)",
//           "• Websites & customer portals (authenticated dashboards + chatbots + admin-controlled content)",
//         ].join("\n"),
//         fr: [
//           "D’après mes informations, nous construisons et modernisons les systèmes cœur de votre activité pour des données plus propres et des équipes plus rapides :",
//           "• ERP (modules par rôles, validations, reporting)",
//           "• Applications métiers (outils internes, portails admin, tableaux de bord)",
//           "• E-commerce (commandes, synchronisation stock, automatisation logistique)",
//           "• Sites web & portails clients (dashboards authentifiés + chatbots + contenu contrôlé par admin)",
//         ].join("\n"),
//         de: [
//           "Nach meinen Informationen bauen und modernisieren wir die Kernsysteme Ihres Unternehmens, damit Daten sauber fließen und Teams schneller arbeiten:",
//           "• ERP-Systeme (rollenbasierte Module, Freigaben, Reporting)",
//           "• Business-Apps (interne Tools, Admin-Portale, Dashboards)",
//           "• E-Commerce-Plattformen (Bestellungen, Inventory-Sync, Fulfillment-Automatisierung)",
//           "• Websites & Kundenportale (authentifizierte Dashboards + Chatbots + admin-gesteuerter Content)",
//         ].join("\n"),
//         lb: [
//           "No mengen Informatiounen bauen a moderniséiere mir Kärsystemer, fir datt d’Daten propper fléissen an Teams méi séier virukommen:",
//           "• ERP-Systemer (Role-based Moduler, Approvals, Reporting)",
//           "• Business-Apps (intern Tools, Admin-Portalen, Dashboards)",
//           "• E-Commerce Plattformen (Bestellungen, Inventory-Sync, Fulfillment-Automatisatioun)",
//           "• Websäiten & Client-Portalen (authentifizéiert Dashboards + Chatbots + Admin-Contenu)",
//         ].join("\n"),
//       },
//     },

//     // ---------------------------
//     // Contact expectations
//     // ---------------------------
//     {
//       intent: "contact.reply_time",
//       tags: ["contact", "reply", "response time"],
//       question: {
//         en: "How fast do you reply?",
//         fr: "Sous quel délai répondez-vous ?",
//         de: "Wie schnell antwortet ihr?",
//         lb: "Wéi séier äntwert dir?",
//       },
//       answer: {
//         en: "We typically reply within 1–2 business days. Use /contact or email molla@luxaiautomation.com.",
//         fr: "Nous répondons généralement sous 1 à 2 jours ouvrables. Utilisez /contact ou écrivez à molla@luxaiautomation.com.",
//         de: "In der Regel antworten wir innerhalb von 1–2 Werktagen. Nutzen Sie /contact oder schreiben Sie an molla@luxaiautomation.com.",
//         lb: "Normalerweis äntwere mir bannent 1–2 Aarbechtsdeeg. Benotzt /contact oder schreift un molla@luxaiautomation.com.",
//       },
//     },

//     // ---------------------------
//     // Legal summaries
//     // ---------------------------
//     {
//       intent: "legal.cookies.summary",
//       tags: ["cookies", "cookie policy", "tracking"],
//       question: {
//         en: "Do you use cookies and what for?",
//         fr: "Utilisez-vous des cookies et à quoi servent-ils ?",
//         de: "Nutzt ihr Cookies und wofür?",
//         lb: "Benotzt dir Cookies, a fir wat?",
//       },
//       answer: {
//         en: "From my information: cookies are used in a limited, transparent way for core operation and optional preferences (language/theme) only if you accept them. The site remains usable if you reject preference cookies. We don’t use advertising, analytics, or profiling cookies.",
//         fr: "D’après mes informations : les cookies sont utilisés de manière limitée et transparente pour le fonctionnement de base et des préférences (langue/thème) uniquement si vous les acceptez. Le site reste utilisable si vous refusez les cookies de préférence. Aucun cookie publicitaire, d’analyse ou de profilage.",
//         de: "Nach meinen Informationen: Cookies werden sparsam und transparent für den Basisbetrieb sowie optionale Präferenzen (Sprache/Theme) nur bei Zustimmung verwendet. Die Website bleibt auch ohne Präferenz-Cookies nutzbar. Keine Werbe-, Analytics- oder Profiling-Cookies.",
//         lb: "No mengen Informatiounen: Cookies gi limitéiert an transparent benotzt fir de Basis-Betrib an optional Preferenzen (Sprooch/Theme) nëmme wann Dir se akzeptéiert. D’Websäit bleift och ouni Preferenz-Cookies benotzbar. Keng Reklammen-, Analytics- oder Profiling-Cookies.",
//       },
//     },
//     {
//       intent: "legal.privacy.summary",
//       tags: ["privacy", "gdpr", "personal data"],
//       question: {
//         en: "What personal data do you collect?",
//         fr: "Quelles données personnelles collectez-vous ?",
//         de: "Welche personenbezogenen Daten erfasst ihr?",
//         lb: "Wéi eng perséinlech Donnéeë sammelt dir?",
//       },
//       answer: {
//         en: "From my information: personal data is collected only when you contact us (e.g., name, email, message) so we can respond. We don’t sell your data and we don’t use analytics, tracking, or advertising cookies.",
//         fr: "D’après mes informations : nous collectons des données personnelles uniquement lorsque vous nous contactez (nom, email, message) afin de répondre. Nous ne vendons pas vos données et n’utilisons pas de cookies d’analyse, de suivi ou de publicité.",
//         de: "Nach meinen Informationen: Personenbezogene Daten werden nur erfasst, wenn Sie uns kontaktieren (z. B. Name, E-Mail, Nachricht), um zu antworten. Keine Datenverkäufe und keine Analytics-, Tracking- oder Werbe-Cookies.",
//         lb: "No mengen Informatiounen: Mir sammelen perséinlech Donnéeën nëmme wann Dir eis kontaktéiert (z. B. Numm, E-Mail, Message) fir kënnen ze äntweren. Mir verkafen keng Donnéeën a benotzen keng Analytics-, Tracking- oder Reklammen-Cookies.",
//       },
//     },
//     {
//       intent: "legal.terms.summary",
//       tags: ["terms", "terms & conditions", "legal"],
//       question: {
//         en: "What are your Terms & Conditions about?",
//         fr: "De quoi parlent vos Conditions générales ?",
//         de: "Worum geht es in euren AGB?",
//         lb: "Ëm wat geet et an den Notzungsbedingungen?",
//       },
//       answer: {
//         en: "From my information: the terms cover ownership and acceptable use of the website, intellectual property, prohibited scraping/abuse, and general disclaimers. For questions, email molla@luxaiautomation.com.",
//         fr: "D’après mes informations : les conditions couvrent la propriété et l’usage du site, la propriété intellectuelle, l’interdiction du scraping/abus et des clauses de non-responsabilité. Questions : molla@luxaiautomation.com.",
//         de: "Nach meinen Informationen: Die Bedingungen regeln Eigentum und zulässige Nutzung der Website, geistiges Eigentum, Verbot von Scraping/Missbrauch sowie allgemeine Haftungsausschlüsse. Fragen: molla@luxaiautomation.com.",
//         lb: "No mengen Informatiounen: D’Bedéngunge betreffen Besëtz an zulässeg Notzung vun der Websäit, intellektuell Propriétéit, Verbuet vu Scraping/Mëssbrauch an allgemeng Disclaimer. Froen: molla@luxaiautomation.com.",
//       },
//     },

//     // ---------------------------
//     // Guardrails: requests outside business info
//     // ---------------------------
//     {
//       intent: "assistant.guardrails.code_requests",
//       tags: ["code", "programming", "script", "developer", "api"],
//       question: {
//         en: "Can you give me code or build a script for my project?",
//         fr: "Pouvez-vous me donner du code ou créer un script pour mon projet ?",
//         de: "Könnt ihr mir Code geben oder ein Script für mein Projekt erstellen?",
//         lb: "Kënnt dir mir Code ginn oder e Script fir mäi Projet bauen?",
//       },
//       answer: {
//         en: "I can share information about our services and how we approach automation projects. For implementation details, please use /contact or email molla@luxaiautomation.com with your goal and tools, and we’ll follow up.",
//         fr: "Je peux partager des informations sur nos services et notre approche. Pour des détails d’implémentation, utilisez /contact ou écrivez à molla@luxaiautomation.com avec votre objectif et vos outils, et nous reviendrons vers vous.",
//         de: "Ich kann Informationen zu unseren Services und unserer Vorgehensweise teilen. Für Implementierungsdetails nutzen Sie bitte /contact oder schreiben Sie an molla@luxaiautomation.com mit Ziel und Tools — wir melden uns.",
//         lb: "Ech kann Informatiounen iwwer eis Servicer an eis Approche deelen. Fir Implementatiounsdetailer benotzt w.e.g. /contact oder schreift un molla@luxaiautomation.com mat ärem Zil an ären Tools, da komme mir op Iech zréck.",
//       },
//     },
//     {
//       intent: "assistant.guardrails.image_requests",
//       tags: ["image", "logo", "design", "generate image", "picture"],
//       question: {
//         en: "Can you generate an image or logo for me?",
//         fr: "Pouvez-vous générer une image ou un logo ?",
//         de: "Könnt ihr ein Bild oder Logo generieren?",
//         lb: "Kënnt dir en Image oder e Logo generéieren?",
//       },
//       answer: {
//         en: "I can explain what we offer and how we deliver projects, but I can’t create images directly here. If you share what you need (style, purpose, where it will be used), please use /contact or email molla@luxaiautomation.com and we’ll follow up.",
//         fr: "Je peux expliquer ce que nous proposons et notre méthode, mais je ne peux pas créer d’images directement ici. Décrivez votre besoin (style, objectif, usage) via /contact ou par email à molla@luxaiautomation.com et nous reviendrons vers vous.",
//         de: "Ich kann erklären, was wir anbieten und wie wir Projekte umsetzen, aber ich kann hier keine Bilder direkt erstellen. Beschreiben Sie bitte Ihren Bedarf (Stil, Zweck, Einsatz) über /contact oder per E-Mail an molla@luxaiautomation.com — wir melden uns.",
//         lb: "Ech kann erklären wat mir ubidden a wéi mir Projeten ëmsetzen, mee ech kann hei keng Biller direkt erstellen. Beschreift w.e.g. äre Besoin (Stil, Zweck, Asaz) iwwer /contact oder per E-Mail un molla@luxaiautomation.com, da komme mir op Iech zréck.",
//       },
//     },
//     {
//       intent: "assistant.guardrails.non_business_or_sensitive",
//       tags: ["medical", "legal advice", "investment", "politics", "personal"],
//       question: {
//         en: "Can you give medical/legal/financial advice?",
//         fr: "Pouvez-vous donner des conseils médicaux/juridiques/financiers ?",
//         de: "Könnt ihr medizinische/juristische/finanzielle Beratung geben?",
//         lb: "Kënnt dir medezinesch/juristesch/finanziell Berodung ginn?",
//       },
//       answer: {
//         en: "I can share information about our services and general project approach. For medical, legal, or financial advice, please consult a qualified professional. If your question is about automating business processes, tell me your goal and tools and I’ll suggest the next step.",
//         fr: "Je peux partager des informations sur nos services et notre approche. Pour des conseils médicaux, juridiques ou financiers, consultez un professionnel qualifié. Si votre question concerne l’automatisation de processus métier, décrivez votre objectif et vos outils et je proposerai la prochaine étape.",
//         de: "Ich kann Informationen zu unseren Services und zur Vorgehensweise teilen. Für medizinische, rechtliche oder finanzielle Beratung wenden Sie sich bitte an Fachleute. Wenn es um die Automatisierung von Geschäftsprozessen geht, nennen Sie Ziel und Tools — dann schlage ich den nächsten Schritt vor.",
//         lb: "Ech kann Informatiounen iwwer eis Servicer an eis Approche deelen. Fir medezinesch, juristesch oder finanziell Berodung consultéiert w.e.g. e qualifizéierte Profi. Wann et ëm d’Automatiséierung vu Business-Prozesser geet, sot mir Äert Zil an Är Tools — da proposéiere ech de nächste Schrëtt.",
//       },
//     },

//     // Guide for Out of scope
//     {
//       intent: "assistant.scope.services_only",
//       tags: ["scope", "services", "help", "out-of-scope"],
//       question: {
//         en: "What can you help with?",
//         fr: "Avec quoi pouvez-vous aider ?",
//         de: "Wobei können Sie helfen?",
//         lb: "Woubäi kënnt dir hëllefen?",
//       },
//       answer: {
//         en: "I can help with Lux AI Consultancy & Automation services: AI integration, automation, workflows, system integrations, and project scoping. If you share your goal and tools, I’ll suggest the best next step. For implementation requests, please use /contact or email molla@luxaiautomation.com.",
//         fr: "Je peux aider avec les services de Lux AI Consultancy & Automation : intégration IA, automatisation, workflows, intégrations systèmes et cadrage de projet. Partagez votre objectif et vos outils, et je proposerai la prochaine étape. Pour les demandes d’implémentation, utilisez /contact ou écrivez à molla@luxaiautomation.com.",
//         de: "Ich helfe bei den Services von Lux AI Consultancy & Automation: KI-Integration, Automatisierung, Workflows, Systemintegrationen und Projekt-Scoping. Nennen Sie Ziel und Tools, dann schlage ich den nächsten Schritt vor. Für Implementierung nutzen Sie bitte /contact oder schreiben Sie an molla@luxaiautomation.com.",
//         lb: "Ech hëllefen bei de Servicer vu Lux AI Consultancy & Automation: AI-Integratioun, Automatisatioun, Workflows, System-Integratiounen an Projet-Scoping. Sot mir äert Zil an är Tools, da proposéiere ech de nächste Schrëtt. Fir Implementatiounsufroen: /contact oder molla@luxaiautomation.com.",
//       },
//     },

//     // ---------------------------
//     // Fallback (IMPORTANT)
//     // ---------------------------
//     {
//       intent: "assistant.fallback.helpful_next_step",
//       tags: ["fallback", "unknown", "help"],
//       question: {
//         en: "What if the user asks something not covered?",
//         fr: "Que faire si l’utilisateur demande quelque chose qui n’est pas couvert ?",
//         de: "Was, wenn der Nutzer etwas fragt, das nicht abgedeckt ist?",
//         lb: "Wat wann de Benotzer eppes freet wat net ofgedeckt ass?",
//       },
//       answer: {
//         en: [
//           "From my information, here’s what I can share:",
//           "• We build AI chatbots, integrations, workflow automation, and custom business web apps (ERP, e-commerce, admin portals).",
//           "• If you tell us your industry, tools, and the process you want to automate, we can propose a simple plan.",
//           "Next step: use /contact or email molla@luxaiautomation.com so we can follow up with specifics.",
//         ].join("\n"),
//         fr: [
//           "D’après mes informations, voici ce que je peux partager :",
//           "• Chatbots IA, intégrations, automatisation de workflows et apps web métier (ERP, e-commerce, portails/admin).",
//           "• Dites-nous votre secteur, vos outils et le processus à automatiser — nous proposerons un plan simple.",
//           "Prochaine étape : utilisez /contact ou envoyez un email à molla@luxaiautomation.com.",
//         ].join("\n"),
//         de: [
//           "Nach meinen Informationen kann ich Folgendes sagen:",
//           "• KI-Chatbots, Integrationen, Workflow-Automatisierung und Business-Web-Apps (ERP, E-Commerce, Admin-Portale).",
//           "• Nennen Sie Branche, Tools und den Prozess, den Sie automatisieren möchten — dann schlagen wir einen einfachen Plan vor.",
//           "Nächster Schritt: /contact nutzen oder an molla@luxaiautomation.com schreiben, damit wir gezielt nachfassen können.",
//         ].join("\n"),
//         lb: [
//           "No mengen Informatiounen kann ech Folgendes soen:",
//           "• AI-Chatbots, Integratiounen, Workflow-Automatisatioun an Business-Web-Apps (ERP, E-Commerce, Admin-Portalen).",
//           "• Sot eis Är Branche, Är Tools an de Prozess fir ze automatiséieren — mir proposéiere e simple Plang.",
//           "Nächste Schrëtt: /contact benotzen oder un molla@luxaiautomation.com schreiwen, fir datt mir konkret kënne follow-up maachen.",
//         ].join("\n"),
//       },
//     },
//   ] as const satisfies readonly KBAnswer[],
// } as const;
