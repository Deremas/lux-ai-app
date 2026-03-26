import type { Lang } from "@/lib/i18n-types";

type NavLabels = {
  home: string;
  solutions: string;
  consulting: string;
  useCases: string;
  howItWorks: string;
  scheduling: string;
  about: string;
  contact: string;
  audit: string;
  quickLinks: string;
  legal: string;
  privacy: string;
  terms: string;
  cookies: string;
  social: string;
};

export const brand = {
  short: "Lux",
  mobileName: "Lux AI Automation",
  name: "Lux AI Consultancy & Automation",
  positioning: "AI Automation Systems & Consulting for SMEs",
  trustLine: "Built for SMEs and growing businesses in Luxembourg and Europe.",
  description:
    "LuxAI Automation provides AI automation systems and consulting for SMEs and growing businesses that want faster operations, cleaner workflows, and stronger customer communication.",
  location: "Belvaux, Luxembourg",
  email: "molla@luxaiautomation.com",
  phone: "+352 691 833 894",
  authorization: "Autorisation d’établissement N° 10042992 / 8",
  linkedin: "https://www.linkedin.com/in/molla-sisay-jemere",
} as const;

export const navLabels: Record<Lang, NavLabels> = {
  en: {
    home: "Home",
    solutions: "Solutions",
    consulting: "Consulting",
    useCases: "Use Cases",
    howItWorks: "How It Works",
    scheduling: "Scheduling",
    about: "About",
    contact: "Contact",
    audit: "Get a Free Audit",
    quickLinks: "Quick Links",
    legal: "Legal Information",
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
    cookies: "Cookie Policy",
    social: "Connect with us",
  },
  fr: {
    home: "Accueil",
    solutions: "Solutions",
    consulting: "Conseil",
    useCases: "Cas d’usage",
    howItWorks: "Comment ça marche",
    scheduling: "Planification",
    about: "À propos",
    contact: "Contact",
    audit: "Audit gratuit",
    quickLinks: "Liens rapides",
    legal: "Informations légales",
    privacy: "Confidentialité",
    terms: "Conditions",
    cookies: "Cookies",
    social: "Nous suivre",
  },
  de: {
    home: "Start",
    solutions: "Lösungen",
    consulting: "Beratung",
    useCases: "Anwendungsfälle",
    howItWorks: "So funktioniert’s",
    scheduling: "Terminplanung",
    about: "Über uns",
    contact: "Kontakt",
    audit: "Kostenloses Audit",
    quickLinks: "Schnellzugriff",
    legal: "Rechtliches",
    privacy: "Datenschutz",
    terms: "AGB",
    cookies: "Cookies",
    social: "Verbinden",
  },
  lb: {
    home: "Heem",
    solutions: "Léisungen",
    consulting: "Berodung",
    useCases: "Beispiller",
    howItWorks: "Wéi Et Geet",
    scheduling: "Terminplanung",
    about: "Iwwer Eis",
    contact: "Kontakt",
    audit: "Gratis Audit",
    quickLinks: "Schnelllinken",
    legal: "Rechtleches",
    privacy: "Dateschutz",
    terms: "Konditiounen",
    cookies: "Cookies",
    social: "Connectéieren",
  },
};

export const heroContent = {
  eyebrow: brand.positioning,
  headline: "Automate SME Business Operations with AI-Powered Solutions",
  subheadline:
    "We design, implement, and optimize AI automation systems and consulting solutions that reduce manual work, improve customer communication, and streamline business workflows.",
  primaryCta: "Get a Free Audit",
  secondaryCta: "See How It Works",
  workflow: [
    { label: "Email / Form / Chat", icon: "ri-mail-open-line" },
    { label: "AI Agent", icon: "ri-robot-2-line" },
    { label: "Automation Workflow", icon: "ri-git-merge-line" },
    { label: "CRM / Internal Tool / Database", icon: "ri-database-2-line" },
    { label: "Faster Operations", icon: "ri-flashlight-line" },
  ],
  highlights: [
    "Workflow audits and opportunity mapping",
    "AI systems, integrations, and implementation",
    "Ongoing optimization for growing teams",
  ],
} as const;

export const painPoints = [
  {
    title: "Repetitive admin work",
    description:
      "Manual approvals, handoffs, and copy-paste work slow teams down and create avoidable errors.",
    icon: "ri-file-copy-line",
  },
  {
    title: "Slow customer responses",
    description:
      "Leads and support requests wait too long when teams rely on inboxes and fragmented tools.",
    icon: "ri-customer-service-2-line",
  },
  {
    title: "Disconnected systems",
    description:
      "CRM, email, forms, internal tools, and databases are often not working as one operating system.",
    icon: "ri-links-line",
  },
  {
    title: "Manual data entry",
    description:
      "Teams waste time updating records, moving documents, and re-entering the same information.",
    icon: "ri-keyboard-box-line",
  },
  {
    title: "Workflow bottlenecks",
    description:
      "Critical processes break under growth when no one has redesigned them around speed and clarity.",
    icon: "ri-flow-chart",
  },
  {
    title: "Scaling without structure",
    description:
      "More volume should not always require more people, more inboxes, and more operational friction.",
    icon: "ri-line-chart-line",
  },
] as const;

export const solutionCards = [
  {
    title: "AI Workflow Automation",
    summary:
      "Automate repetitive business processes across forms, approvals, admin tasks, notifications, and internal workflows.",
    outcome: "Reduce manual work and improve operational speed.",
    fit: "Ideal for teams handling recurring operational steps and back-office work.",
    icon: "ri-flow-chart",
  },
  {
    title: "AI Customer Communication",
    summary:
      "Deploy AI assistants for support, lead qualification, FAQs, customer onboarding, and response routing.",
    outcome: "Improve responsiveness and reduce communication load.",
    fit: "Ideal for sales, support, onboarding, and service teams.",
    icon: "ri-message-3-line",
  },
  {
    title: "Business System Integration",
    summary:
      "Connect CRM, email, forms, internal tools, databases, and APIs into efficient business workflows.",
    outcome: "Eliminate manual handoffs and fragmented operations.",
    fit: "Ideal for companies with disconnected tools or manual data movement.",
    icon: "ri-plug-2-line",
  },
  {
    title: "Internal AI Knowledge Systems",
    summary:
      "Provide secure AI assistants for internal teams and controlled access to company knowledge.",
    outcome: "Faster information retrieval and better decision support.",
    fit: "Ideal for operations, support, HR, and cross-functional teams.",
    icon: "ri-shield-check-line",
  },
  {
    title: "Process Optimization",
    summary:
      "Review and improve workflows before or alongside automation so the system design actually fits the business.",
    outcome: "Make automations more effective and sustainable.",
    fit: "Ideal for SMEs refining workflows before implementation or scale.",
    icon: "ri-settings-3-line",
  },
] as const;

export const consultingSection = {
  title: "Consulting That Turns Automation Ideas into Action",
  intro:
    "Consulting stays visible because strategy matters, but it supports the main offer: designing and implementing AI automation systems that improve business operations.",
  detail:
    "We use consulting to help clients define priorities, validate the right systems, and move naturally into implementation projects or ongoing optimization retainers.",
  offerings: [
    "Free Automation Audit",
    "AI Readiness Assessment",
    "Automation Opportunity Discovery",
    "Workflow and Process Review",
    "Integration Architecture Advisory",
    "Implementation Roadmap",
  ],
  deliverables: [
    "Current process analysis",
    "Automation opportunities",
    "Tool and integration recommendations",
    "Solution architecture",
    "Implementation plan",
  ],
  cta: "Talk to Us About Your Business Workflow",
} as const;

export const featureBenefits = [
  {
    title: "Website chatbots",
    benefit: "Capture leads and answer common questions without adding inbox load.",
    icon: "ri-global-line",
  },
  {
    title: "Private AI assistants",
    benefit: "Give teams faster access to trusted internal information.",
    icon: "ri-lock-line",
  },
  {
    title: "Admin knowledge systems",
    benefit: "Keep AI responses current through controlled business knowledge and updates.",
    icon: "ri-book-open-line",
  },
  {
    title: "APIs and webhooks",
    benefit: "Move information between tools without manual transfer or broken handoffs.",
    icon: "ri-code-box-line",
  },
  {
    title: "CRM integrations",
    benefit: "Keep customer data synchronized and actionable across touchpoints.",
    icon: "ri-contacts-book-3-line",
  },
  {
    title: "Automation platforms",
    benefit: "Launch practical workflows quickly and expand them as operations mature.",
    icon: "ri-node-tree",
  },
] as const;

export type UseCase = {
  title: string;
  problem: string;
  solution: string;
  teaser?: string;
  outcome: string;
  industries: string;
  tools: string;
  image: string;
  cta: string;
};

export const useCases = [
  {
    title: "AI Support Assistant",
    problem: "Support teams lose time answering the same questions across channels.",
    solution:
      "Deploy an AI assistant that handles FAQs, support triage, and response guidance with clear escalation rules.",
    teaser: "Handle FAQs and support triage before a human needs to step in.",
    outcome: "Faster responses and lower communication load.",
    industries: "Service teams, SaaS, professional services, internal support desks",
    tools: "Website, help desk, internal knowledge base",
    image: "/images/workflow2.jpg",
    cta: "/contact",
  },
  {
    title: "Property Enquiry and Viewing Coordination",
    problem:
      "Real estate teams lose time answering repetitive property questions, chasing availability, and coordinating viewings across inboxes, chat, and phone.",
    solution:
      "Use AI-assisted chat and workflow routing to answer common property questions, capture buyer or tenant preferences, sync calendars, and trigger viewing follow-up automatically.",
    teaser:
      "Answer common property questions and coordinate viewings without inbox back-and-forth.",
    outcome:
      "Faster enquiry handling, fewer missed viewings, and smoother agent coordination.",
    industries:
      "Real estate agencies, property developers, lettings teams, relocation services",
    tools: "Website chat, email, CRM, calendars, property enquiry forms",
    image: "/images/use-case-property-enquiry-viewing.jpg",
    cta: "/contact",
  },
  {
    title: "Customer Onboarding Automation",
    problem: "New customer handoff is inconsistent and full of repetitive manual steps.",
    solution:
      "Automate intake, document collection, status notifications, and onboarding workflows across the client journey.",
    teaser:
      "Automate intake, documents, and status updates across the onboarding journey.",
    outcome: "Smoother onboarding and fewer operational delays.",
    industries: "Professional services, finance, operations-heavy SMEs",
    tools: "Forms, email, CRM, internal workflows",
    image: "/images/workflow3.jpg",
    cta: "/contact",
  },
  {
    title: "CRM Follow-Up Automation",
    problem: "Important customer follow-ups get missed when updates depend on manual action.",
    solution:
      "Trigger reminders, stage updates, task creation, and outreach flows automatically from business events.",
    teaser:
      "Trigger reminders and next-step outreach automatically from real business events.",
    outcome: "Better follow-up discipline and less administrative drag.",
    industries: "Sales teams, service businesses, account management",
    tools: "CRM, email, notifications, internal dashboards",
    image: "/images/workflow4.jpg",
    cta: "/contact",
  },
  {
    title: "Smart Appointment Automation",
    problem: "Manual scheduling wastes time and causes conflicts or uneven workload distribution.",
    solution:
      "Use AI-assisted routing, calendar sync, approvals, and buffers to turn booking into a smoother business workflow.",
    teaser:
      "Route bookings through calendars, approvals, and buffers without manual scheduling.",
    outcome: "Faster scheduling and better workload balance.",
    industries: "Consulting, clinics, internal teams, service businesses",
    tools: "Calendars, approvals, booking workflows",
    image: "/images/workflow-automation.png",
    cta: "/scheduling",
  },
  {
    title: "Document and Invoice Processing",
    problem: "Teams spend too much time extracting data and moving documents between systems.",
    solution:
      "Automate intake, extraction, categorization, validation, and routing for operational documents.",
    teaser:
      "Extract, validate, and route documents without repeated manual re-entry.",
    outcome: "Less manual processing and cleaner records.",
    industries: "Finance, operations, logistics, administration",
    tools: "Email, OCR flows, approval steps, ERP or accounting tools",
    image: "/images/use-case-document-invoice-processing.jpg",
    cta: "/contact",
  },
  {
    title: "Internal Knowledge Assistant",
    problem: "Employees lose time searching for answers across docs, inboxes, and tribal knowledge.",
    solution:
      "Create a secure internal assistant connected to approved operational knowledge and team processes.",
    teaser: "Give teams secure AI access to approved internal knowledge.",
    outcome: "Faster decisions and more consistent internal support.",
    industries: "Operations, HR, support, internal enablement",
    tools: "Knowledge base, access controls, internal portals",
    image: "/images/use-case-internal-knowledge-assistant.jpg",
    cta: "/contact",
  },
  {
    title: "Cross-System Notifications and Approvals",
    problem: "Approval loops and status updates break when teams rely on email chains and manual chasing.",
    solution:
      "Orchestrate approvals, notifications, and business rules across the tools your teams already use.",
    teaser:
      "Keep approvals and status updates moving across the tools your teams already use.",
    outcome: "More visibility and fewer stalled workflows.",
    industries: "Operations, finance, HR, project delivery",
    tools: "Email, chat, CRM, internal systems, webhooks",
    image: "/images/deploy.jpg",
    cta: "/contact",
  },
] satisfies readonly UseCase[];

export const processSteps = [
  {
    step: "Assess",
    duration: "3-5 days",
    description:
      "Understand the current workflow, identify the bottlenecks, and define the best automation opportunities.",
    points: [
      "Workflow mapping",
      "Tool and data review",
      "Priority use-case definition",
      "Automation opportunity shortlist",
    ],
    outputs: ["Workflow map", "Automation shortlist"],
    image: "/images/analyze.jpg",
  },
  {
    step: "Design",
    duration: "1-2 weeks",
    description:
      "Translate business needs into a practical automation architecture with the right systems and logic.",
    points: [
      "Solution architecture",
      "Tool selection",
      "Business rules and routing logic",
      "Implementation plan",
    ],
    outputs: ["Solution blueprint", "Delivery plan"],
    image: "/images/build-process.jpg",
  },
  {
    step: "Build",
    duration: "2-6 weeks",
    description:
      "Implement workflows, configure AI systems, and connect the tools that need to work together.",
    points: [
      "Workflow setup",
      "AI assistant configuration",
      "API and system integration",
      "Testing and handover",
    ],
    outputs: ["Live workflow", "Connected systems"],
    image: "/images/workflow-automation.png",
  },
  {
    step: "Optimize",
    duration: "2-4 weeks",
    description:
      "Measure performance, refine the flow, and improve business outcomes as the system starts running live.",
    points: [
      "Monitoring and feedback",
      "Workflow refinement",
      "Response quality improvements",
      "Operational reporting",
    ],
    outputs: ["Performance review", "Improvement backlog"],
    image: "/images/analytics.png",
  },
  {
    step: "Maintain",
    duration: "Monthly",
    description:
      "Support ongoing optimization retainers for businesses that need monitoring, improvements, and new automation requests over time.",
    points: [
      "Maintenance and support",
      "New automation requests",
      "System updates",
      "Continuous optimization",
    ],
    outputs: ["Monitoring cadence", "Support queue"],
    image: "/images/monitor.jpg",
  },
] as const;

export type TeamMember = {
  key: string;
  name: string;
  role: string;
  bio: string;
  tags: readonly string[];
  image: string;
  linkedin: string;
  twitter: string;
  telegram: string;
  whatsapp: string;
  facebook: string;
  email: string;
};

export const teamMembers = [
  {
    key: "molla",
    name: "Molla Sisay Jemere",
    role: "Founder & CEO",
    bio:
      "Leads delivery strategy across AI automation, business systems, and integration architecture with a strong focus on practical business outcomes.",
    tags: [
      "AI systems",
      "Workflow automation",
      "MuleSoft Certified Integration Professional",
      "Consulting",
      ],
      image: "/avatars/molla.png",
      linkedin: "https://www.linkedin.com/in/molla-sisay-jemere",
      twitter: "#",
      telegram: "#",
      whatsapp: "https://wa.me/352691833894",
      facebook: "https://www.facebook.com/mollasisayjemere1",
      email: "mailto:molla@luxaiautomation.com",
    },
    {
      key: "fikre",
      name: "Fikremariam Mekonnen",
      role: "Co-Founder & Integrations Engineer",
      bio:
        "Designs and builds reliable integration layers, automation architecture, and connected operational systems for growing businesses.",
      tags: ["APIs", "Integrations", "Automation architecture", "System planning"],
      image: "/avatars/fikre.png",
      linkedin: "https://.linkedin.com/in/fikremariam-mekonnnen",
      twitter: "#",
      telegram: "#",
      whatsapp: "https://wa.me/251913226793",
      facebook: "https://www.facebook.com/fikremariam.mekonnen",
      email: "mailto:fikremariam2012@gmail.com",
    },
    {
      key: "dereje",
      name: "Dereje Masresha",
      role: "Full-Stack & AI Solutions Developer",
      bio:
        "Builds practical AI-enabled applications, internal tools, and workflow systems that support secure and scalable delivery.",
      tags: ["AI applications", "Full-stack delivery", "Cloud systems", "Internal tools"],
      image: "/avatars/dere.png",
      linkedin: "https://linkedin.com/in/DerejeMasresha",
      twitter: "https://x.com/Deremas27",
      telegram: "https://t.me/Dere2224",
      whatsapp: "https://wa.me/251922243038",
      facebook: "https://www.facebook.com/dbazmm3",
      email: "mailto:derejemasresha27@gmail.com",
    },
] as const satisfies readonly TeamMember[];

export const platformCards = [
  {
    title: "CRM and pipeline workflows",
    description:
      "Connect lead capture, qualification, follow-up, and internal task routing into one operating flow.",
    icon: "ri-contacts-book-3-line",
  },
  {
    title: "Customer communication systems",
    description:
      "Link chat, email, FAQs, and support handoffs so customer communication becomes faster and more consistent.",
    icon: "ri-chat-4-line",
  },
  {
    title: "Internal tools and databases",
    description:
      "Move information between dashboards, forms, files, and internal systems without manual copy-paste.",
    icon: "ri-layout-grid-line",
  },
  {
    title: "Automation-ready websites and portals",
    description:
      "Make public websites and client portals work as part of the business workflow, not just as static pages.",
    icon: "ri-window-line",
  },
] as const;

export const businessFit = [
  "SMEs with repetitive admin work",
  "Teams dealing with disconnected business tools",
  "Service businesses handling growing customer communication",
  "Operations leaders who need workflow clarity before scaling",
] as const;

export const credibilityPoints = [
  "Luxembourg-based and focused on practical implementation",
  "Automation-first delivery with consulting support where it adds value",
  "Built around business workflows, integrations, and measurable next steps",
  "Designed for implementation projects and ongoing optimization retainers",
] as const;

export const contactIntro = {
  title: "Get a Free Automation Audit",
  subtitle:
    "Tell us about your business workflow, challenge, or automation goal, and we’ll identify practical next steps.",
  bullets: [
    "Workflow review",
    "Automation opportunities",
    "Recommended next steps",
  ],
  nextSteps: [
    "We review your workflow and current bottlenecks.",
    "We identify where AI automation or consulting will create the most value.",
    "We reply with practical next steps and, if relevant, an implementation path.",
  ],
} as const;

export const contactSchedulingBridge = {
  eyebrow: "Prefer a scheduled conversation?",
  title: "Book a session if you want to talk live with the Lux AI team first.",
  description:
    "Use scheduling when you already want a conversation on timing, fit, or next steps. Use the audit form when you want us to review the workflow in more detail before the call.",
  bullets: [
    "Choose a time that fits your calendar",
    "Move from the contact page straight into booking",
    "Keep the audit form available for broader workflow review",
  ],
  primaryCta: "Open Scheduling",
  secondaryCta: "Jump to Audit Form",
} as const;

export const schedulingContactBridge = {
  eyebrow: "Need a broader workflow audit?",
  title: "Move from booking into a deeper contact and scoping discussion.",
  description:
    "If the challenge spans systems, integrations, or process redesign, send the workflow through contact so we can review the context and recommend the right next step.",
  primaryCta: "Talk About Your Workflow",
  secondaryCta: "Open Free Audit Form",
  guestNote:
    "Not ready to sign in and book yet? Use the contact form first and we can guide you to the right session.",
} as const;

export const footerLinks = [
  { label: "Home", href: "/" },
  { label: "Solutions", href: "/services" },
  { label: "Use Cases", href: "/use-cases" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "About", href: "/about" },
  { label: "Scheduling", href: "/scheduling" },
  { label: "Contact", href: "/contact" },
] as const;
