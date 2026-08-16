"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import AnimatedSection from "@/components/AnimatedSection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useLanguage } from "@/components/LanguageProvider";
import {
  CtaLinks,
  MARKETING_BRAND,
  MarketingHero,
  SectionHeading,
} from "@/components/marketing/SectionHeading";
import SearchablePhoneInput from "@/components/PhoneInputField";
import { brand } from "@/lib/marketing-content";
import { t } from "@/lib/site-copy";

function AlertModal({
  open,
  onClose,
  title,
  body,
  closeLabel,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
  closeLabel: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
      <div className="w-full max-w-md rounded-[1.75rem] bg-white p-8 text-center shadow-2xl dark:bg-slate-900">
        <h2 className="text-2xl font-black">{title}</h2>
        <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
          {body}
        </p>
        <button
          onClick={onClose}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-700"
        >
          {closeLabel}
        </button>
      </div>
    </div>
  );
}

const localizedContactExtras = {
  en: {
    writeFirstLabel: "Prefer to write first?",
    heroHelper:
      "Use this form when you want to send workflow context first. If you are ready to pick a time for the free audit meeting, open scheduling instead.",
    intro: {
      title: "Contact the Lux AI Team",
      subtitle:
        "Use contact when you want to write first instead of booking a call. Share your workflow, challenge, or goal and we will guide the best next step.",
      primaryCta: "Open the Contact Form",
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
    },
    form: {
      eyebrow: "Contact Form",
      title: "Tell us about your workflow or business need",
      description:
        "Keep it practical. Explain what is happening now, where the bottleneck is, and what kind of help or next step you want.",
      taskLabel: "Main workflow challenge",
      taskPlaceholder:
        "Describe the current workflow, the bottleneck, your current tools, and the result you want.",
      phoneHint: "Use a reachable business number with country code.",
      submit: "Send Contact Request",
    },
    panels: {
      auditIncludes: "What to include",
      nextSteps: "What happens next",
      contactDetails: "Contact details",
    },
    schedulingBridge: {
      eyebrow: "Ready to book instead?",
      title:
        "Open scheduling if you want the free audit meeting or a live conversation first.",
      description:
        "Use scheduling when you are ready to choose a time. Use this contact form when you prefer to send the workflow context first and let us review it before a call.",
      bullets: [
        "Choose a time that fits your calendar",
        "Go straight to the free audit meeting after sign-in",
        "Keep the contact form for deeper written workflow context",
      ],
      primaryCta: "Open Scheduling",
      secondaryCta: "Jump to Audit Form",
    },
  },
  fr: {
    writeFirstLabel: "Vous preferez d'abord ecrire ?",
    heroHelper:
      "Utilisez ce formulaire si vous preferez envoyer d'abord le contexte du workflow. Si vous etes pret a choisir un horaire pour l'audit gratuit, ouvrez plutot la planification.",
    intro: {
      title: "Contacter l'equipe Lux AI",
      subtitle:
        "Utilisez le contact si vous preferez ecrire d'abord plutot que reserver un appel. Partagez votre workflow, votre defi ou votre objectif et nous guiderons la meilleure suite.",
      primaryCta: "Ouvrir le formulaire de contact",
      bullets: [
        "Revue du workflow",
        "Opportunites d'automatisation",
        "Prochaines etapes recommandees",
      ],
      nextSteps: [
        "Nous examinons votre workflow actuel et les goulets d'etranglement.",
        "Nous identifions ou l'automatisation IA ou le conseil creeront le plus de valeur.",
        "Nous revenons avec des etapes concretes et, si pertinent, une voie d'implementation.",
      ],
    },
    form: {
      eyebrow: "Formulaire de contact",
      title: "Parlez-nous de votre workflow ou besoin metier",
      description:
        "Restez concret. Expliquez ce qui se passe aujourd'hui, ou se situe le blocage et quel type d'aide ou de prochaine etape vous recherchez.",
      taskLabel: "Defi principal du workflow",
      taskPlaceholder:
        "Decrivez le workflow actuel, le goulet d'etranglement, vos outils actuels et le resultat souhaite.",
      phoneHint:
        "Utilisez un numero professionnel joignable avec indicatif pays.",
      submit: "Envoyer la demande de contact",
    },
    panels: {
      auditIncludes: "Que faut-il inclure",
      nextSteps: "Ce qui se passe ensuite",
      contactDetails: "Coordonnees",
    },
    schedulingBridge: {
      eyebrow: "Pret a reserver plutot ?",
      title:
        "Ouvrez la planification si vous voulez l'audit gratuit en reunion ou un echange en direct.",
      description:
        "Utilisez la planification si vous etes pret a choisir un creneau. Utilisez ce formulaire de contact si vous preferez d'abord envoyer le contexte du workflow pour revue.",
      bullets: [
        "Choisissez un creneau adapte a votre agenda",
        "Accedez directement a l'audit gratuit apres connexion",
        "Gardez le formulaire de contact pour un contexte workflow plus detaille",
      ],
      primaryCta: "Ouvrir la planification",
      secondaryCta: "Aller au formulaire d'audit",
    },
  },
  de: {
    writeFirstLabel: "Mochten Sie zuerst schreiben?",
    heroHelper:
      "Nutzen Sie dieses Formular, wenn Sie den Workflow-Kontext zuerst schriftlich senden mochten. Wenn Sie direkt einen Termin fur das kostenlose Audit wahlen wollen, offnen Sie stattdessen die Terminbuchung.",
    intro: {
      title: "Kontaktieren Sie das Lux-AI-Team",
      subtitle:
        "Nutzen Sie Kontakt, wenn Sie lieber zuerst schreiben statt direkt einen Termin zu buchen. Teilen Sie Workflow, Herausforderung oder Ziel mit, und wir zeigen den besten nachsten Schritt.",
      primaryCta: "Kontaktformular offnen",
      bullets: [
        "Workflow-Review",
        "Automatisierungspotenziale",
        "Empfohlene nachste Schritte",
      ],
      nextSteps: [
        "Wir prufen Ihren aktuellen Workflow und die bestehenden Engpasse.",
        "Wir identifizieren, wo KI-Automatisierung oder Beratung den grossten Wert schaffen.",
        "Wir melden uns mit konkreten nachsten Schritten und bei Bedarf mit einem Umsetzungsweg zuruck.",
      ],
    },
    form: {
      eyebrow: "Kontaktformular",
      title: "Beschreiben Sie Ihren Workflow oder Ihr Anliegen",
      description:
        "Bleiben Sie konkret. Erklaren Sie, was heute passiert, wo der Engpass liegt und welche Hilfe oder welcher nachste Schritt fur Sie relevant ist.",
      taskLabel: "Zentrale Workflow-Herausforderung",
      taskPlaceholder:
        "Beschreiben Sie den aktuellen Workflow, den Engpass, Ihre aktuellen Tools und das gewunschte Ergebnis.",
      phoneHint:
        "Verwenden Sie eine erreichbare geschaftliche Nummer mit Landesvorwahl.",
      submit: "Kontaktanfrage senden",
    },
    panels: {
      auditIncludes: "Was Sie angeben sollten",
      nextSteps: "Wie es danach weitergeht",
      contactDetails: "Kontaktdaten",
    },
    schedulingBridge: {
      eyebrow: "Mochten Sie stattdessen direkt buchen?",
      title:
        "Offnen Sie die Terminbuchung, wenn Sie das kostenlose Audit als Termin oder ein Live-Gesprach wollen.",
      description:
        "Nutzen Sie die Terminbuchung, wenn Sie bereit sind, direkt einen Termin zu wahlen. Nutzen Sie dieses Kontaktformular, wenn Sie zuerst den Workflow-Kontext schriftlich schicken mochten.",
      bullets: [
        "Wahlen Sie einen Termin, der in Ihren Kalender passt",
        "Gehen Sie nach der Anmeldung direkt in das kostenlose Audit",
        "Behalten Sie das Kontaktformular fur detaillierteren Workflow-Kontext",
      ],
      primaryCta: "Terminbuchung offnen",
      secondaryCta: "Zum Audit-Formular",
    },
  },
  lb: {
    writeFirstLabel: "Wëllt Dir fir d'éischt schreiwen?",
    heroHelper:
      "Benotzt dëse Formulaire, wann Dir als éischt de Workflow-Kontext schécke wëllt. Wann Dir direkt eng Zäit fir de gratis Audit wëllt auswielen, maacht amplaz d'Scheduling op.",
    intro: {
      title: "Kontaktéiert d'Lux-AI-Equipe",
      subtitle:
        "Benotzt de Kontakt, wann Dir léiwer fir d'éischt schreift amplaz direkt en Uruff ze buchen. Deelt Äre Workflow, Är Erausfuerderung oder Äert Zil, an da weise mir de beschte nächste Schrëtt.",
      primaryCta: "Kontakt-Formulaire opmaachen",
      bullets: [
        "Workflow-Iwwerpréiwung",
        "Automatiséierungschancen",
        "Empfole nächst Schrëtt",
      ],
      nextSteps: [
        "Mir kucken Äre Workflow an déi aktuell Engpäss duerch.",
        "Mir identifizéieren, wou KI-Automatiséierung oder Berodung de gréisste Wäert schafen.",
        "Mir äntweren mat praktesche nächste Schrëtt an, wann et passt, mat engem Ëmsetzungswee.",
      ],
    },
    form: {
      eyebrow: "Kontakt-Formulaire",
      title: "Erzielt eis vun Ärem Workflow oder Ärem Besoin",
      description:
        "Bleift praktesch. Erkläert, wat elo geschitt, wou den Engpass ass a wéi eng Hëllef oder wéi ee nächste Schrëtt Dir sicht.",
      taskLabel: "Haapt-Workflow-Erausfuerderung",
      taskPlaceholder:
        "Beschreift den aktuelle Workflow, den Engpass, Är aktuell Tools an dat Resultat, dat Dir wëllt.",
      phoneHint:
        "Benotzt eng erreechbar Business-Nummer mat Landesvirwahl.",
      submit: "Kontaktufro schécken",
    },
    panels: {
      auditIncludes: "Wat Dir sollt matginn",
      nextSteps: "Wat duerno geschitt",
      contactDetails: "Kontaktinformatiounen",
    },
    schedulingBridge: {
      eyebrow: "Wëllt Dir amplaz direkt buchen?",
      title:
        "Maacht d'Terminplanung op, wann Dir de gratis Audit als Termin oder e Live-Gespréich wëllt.",
      description:
        "Benotzt d'Terminplanung, wann Dir bereet sidd direkt eng Zäit ze wielen. Benotzt dëse Kontakt-Formulaire, wann Dir léiwer fir d'éischt de Workflow-Kontext schrëftlech schécke wëllt.",
      bullets: [
        "Wielt eng Zäit, déi an Äre Kalenner passt",
        "Gitt no der Umeldung direkt an de gratis Audit",
        "Halt de Kontakt-Formulaire fir méi detailléierte Workflow-Kontext",
      ],
      primaryCta: "Planung opmaachen",
      secondaryCta: "Bei den Audit-Formulaire",
    },
  },
} as const;

const structuredFieldCopy = {
  en: {
    processLabel: "Current process",
    processPlaceholder:
      "Describe the workflow today, where it slows down, and what is still manual.",
    toolsLabel: "Current tools and systems",
    toolsPlaceholder:
      "CRM, email, WhatsApp, ERP, spreadsheets, forms, internal dashboards, or any other systems involved.",
    goalLabel: "Outcome you want",
    goalPlaceholder:
      "What should improve first: response times, fewer handoffs, better visibility, cleaner data flow, faster approvals, or something else?",
    successNextTitle: "What happens next",
    resetLabel: "Send another request",
  },
  fr: {
    processLabel: "Processus actuel",
    processPlaceholder:
      "Decrivez le workflow aujourd'hui, ou il ralentit et ce qui reste manuel.",
    toolsLabel: "Outils et systemes actuels",
    toolsPlaceholder:
      "CRM, email, WhatsApp, ERP, feuilles de calcul, formulaires, dashboards internes ou tout autre systeme implique.",
    goalLabel: "Resultat recherche",
    goalPlaceholder:
      "Qu'est-ce qui doit s'ameliorer en premier : delais de reponse, moins de handoffs, meilleure visibilite, flux de donnees plus propre, validations plus rapides ou autre chose ?",
    successNextTitle: "Ce qui se passe ensuite",
    resetLabel: "Envoyer une autre demande",
  },
  de: {
    processLabel: "Aktueller Prozess",
    processPlaceholder:
      "Beschreiben Sie den Workflow heute, wo er stockt und was noch manuell ist.",
    toolsLabel: "Aktuelle Tools und Systeme",
    toolsPlaceholder:
      "CRM, E-Mail, WhatsApp, ERP, Tabellen, Formulare, interne Dashboards oder andere beteiligte Systeme.",
    goalLabel: "Gewuenschtes Ergebnis",
    goalPlaceholder:
      "Was soll sich zuerst verbessern: Reaktionszeit, weniger Handoffs, bessere Sichtbarkeit, saubererer Datenfluss, schnellere Freigaben oder etwas anderes?",
    successNextTitle: "Wie es weitergeht",
    resetLabel: "Weitere Anfrage senden",
  },
  lb: {
    processLabel: "Aktuelle Prozess",
    processPlaceholder:
      "Beschreift de Workflow haut, wou en stockt a wat nach manuell leeft.",
    toolsLabel: "Aktuell Tools a Systemer",
    toolsPlaceholder:
      "CRM, E-Mail, WhatsApp, ERP, Tabellen, Formulairen, intern Dashboards oder aner involvéiert Systemer.",
    goalLabel: "Gewënscht Resultat",
    goalPlaceholder:
      "Wat soll als éischt besser ginn: Reaktiounszäit, manner Handoffs, besser Visibilitéit, méi propperen Datefloss, méi séier Geneemegungen oder eppes anescht?",
    successNextTitle: "Wat duerno geschitt",
    resetLabel: "Eng aner Ufro schécken",
  },
} as const;

export default function ContactPage() {
  const { lang } = useLanguage();
  const extra = localizedContactExtras[lang] ?? localizedContactExtras.en;
  const structured = structuredFieldCopy[lang] ?? structuredFieldCopy.en;
  const copy = {
    submitError: t<string>(lang as any, "contact.modal.errorBody"),
    nameLabel: t<string>(lang as any, "contact.form.fullName"),
    emailLabel: t<string>(lang as any, "contact.form.email"),
    phoneLabel: t<string>(lang as any, "contact.form.phone"),
    companyLabel: t<string>(lang as any, "contact.form.company"),
    submitLabel: t<string>(lang as any, "contact.form.submit"),
    sendingLabel: t<string>(lang as any, "contact.form.sending"),
    namePlaceholder: t<string>(lang as any, "contact.form.placeholders.name"),
    emailPlaceholder: t<string>(lang as any, "contact.form.placeholders.email"),
    companyPlaceholder: t<string>(
      lang as any,
      "contact.form.placeholders.company"
    ),
    phonePlaceholder: t<string>(lang as any, "contact.form.placeholders.phone"),
    phoneRequired: t<string>(lang as any, "contact.form.errors.phoneRequired"),
    phoneInvalid: t<string>(lang as any, "contact.form.errors.phoneInvalid"),
    info: {
      locationTitle: t<string>(lang as any, "contact.info.location.title"),
      locationDescription: t<string>(
        lang as any,
        "contact.info.location.description"
      ),
      emailTitle: t<string>(lang as any, "contact.info.email.title"),
      emailDescription: t<string>(
        lang as any,
        "contact.info.email.description"
      ),
      phoneTitle: t<string>(lang as any, "contact.info.phone.title"),
      phoneDescription: t<string>(
        lang as any,
        "contact.info.phone.description"
      ),
      authorizationTitle: t<string>(
        lang as any,
        "contact.info.authorization.title"
      ),
      authorizationDescription: t<string>(
        lang as any,
        "contact.info.authorization.description"
      ),
    },
  };
  const contactInfo = [
    {
      title: copy.info.locationTitle,
      content: brand.location,
      description: copy.info.locationDescription,
      icon: "ri-map-pin-line",
    },
    {
      title: copy.info.emailTitle,
      content: brand.email,
      description: copy.info.emailDescription,
      icon: "ri-mail-line",
      href: `mailto:${brand.email}`,
    },
    {
      title: copy.info.phoneTitle,
      content: brand.phone,
      description: copy.info.phoneDescription,
      icon: "ri-phone-line",
      href: "tel:+352691833894",
    },
    {
      title: copy.info.authorizationTitle,
      content: brand.authorization,
      description: copy.info.authorizationDescription,
      icon: "ri-file-list-3-line",
      href: "/legal#business-identifiers",
    },
  ];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    processSummary: "",
    currentTools: "",
    goal: "",
    website: "",
  });
  const [errors, setErrors] = useState<{
    phone?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateClient = () => {
    const next: typeof errors = {};

    const digits = formData.phone.replace(/\D/g, "");
    if (!formData.phone.trim()) {
      next.phone = copy.phoneRequired;
    } else if (!formData.phone.startsWith("+") || digits.length < 7) {
      next.phone = copy.phoneInvalid;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateClient()) return;

    setIsSubmitting(true);
    setSubmitStatus("");

    try {
      const taskDescription = [
        `Current process:\n${formData.processSummary.trim()}`,
        formData.currentTools.trim()
          ? `Current tools:\n${formData.currentTools.trim()}`
          : "",
        `Outcome wanted:\n${formData.goal.trim()}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          taskDescription,
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        processSummary: "",
        currentTools: "",
        goal: "",
        website: "",
      });
      setShowAlert(true);
    } catch {
      setSubmitStatus(copy.submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      <Header />

      <main>
        <MarketingHero>
          <AnimatedSection direction="fade" className="mx-auto max-w-3xl space-y-7 text-center">
            <SectionHeading
              align="center"
              titleAs="h1"
              eyebrow={MARKETING_BRAND}
              title={extra.intro.title}
              body={extra.intro.subtitle}
              titleClassName="text-[2.55rem] leading-[0.98] tracking-[-0.045em] sm:text-[3.1rem] lg:text-[3.6rem]"
            />
            <CtaLinks
              primaryHref="#free-audit-form"
              primaryLabel={extra.intro.primaryCta}
              secondaryHref="/scheduling?meetingTypeKey=free-audit"
              secondaryLabel={extra.schedulingBridge.primaryCta}
              centered
              quietSecondary
              className="justify-center"
            />
            <p className="mx-auto max-w-xl text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
              {extra.heroHelper}
            </p>
          </AnimatedSection>
        </MarketingHero>

        <section className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
              <AnimatedSection direction="fade">
                <div id="free-audit-form" className="scroll-mt-28">
                  <div>
                    <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
                      {extra.form.title}
                    </h2>
                    <p className="mt-4 text-base leading-8 text-slate-700 dark:text-slate-200">
                      {extra.form.description}
                    </p>
                  </div>

                  {showAlert ? (
                    <div className="mt-10 space-y-6 rounded-[1.5rem] border border-emerald-300/80 bg-emerald-50 p-6 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                      <div>
                        <h3 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
                          {t<string>(lang as any, "contact.modal.title")}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
                          {t<string>(lang as any, "contact.modal.body")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {structured.successNextTitle}
                        </p>
                        <ol className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
                          {extra.intro.nextSteps.map((item, index) => (
                            <li key={item} className="flex items-start gap-3">
                              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                                {index + 1}
                              </span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAlert(false)}
                        className="text-sm font-semibold text-slate-700 underline-offset-4 hover:underline dark:text-slate-200"
                      >
                        {structured.resetLabel}
                      </button>
                    </div>
                  ) : (
                  <form onSubmit={handleSubmit} className="mt-10 space-y-8">
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="hidden"
                      tabIndex={-1}
                      autoComplete="off"
                    />
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          {copy.nameLabel}
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="lux-field w-full rounded-2xl border px-5 py-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                          placeholder={copy.namePlaceholder}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          {copy.companyLabel.replace(" *", "")}
                        </label>
                        <input
                          type="text"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          className="lux-field w-full rounded-2xl border px-5 py-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                          placeholder={copy.companyPlaceholder}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {copy.emailLabel}
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="lux-field w-full rounded-2xl border px-5 py-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                        placeholder={copy.emailPlaceholder}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {copy.phoneLabel}
                      </label>
                      <SearchablePhoneInput
                        defaultCountry="lu"
                        value={formData.phone}
                        onChange={(phone) =>
                          setFormData((prev) => ({ ...prev, phone }))
                        }
                        placeholder={copy.phonePlaceholder}
                        containerClassName="lux-field rounded-2xl border px-3 py-2"
                        inputContainerClassName="border-0 shadow-none focus-within:ring-0"
                        inputClassName="text-sm"
                        buttonClassName="text-slate-700 dark:text-slate-200"
                      />
                      {errors.phone && (
                        <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                          {errors.phone}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {extra.form.phoneHint}
                      </p>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {structured.processLabel}
                      </label>
                      <textarea
                        name="processSummary"
                        value={formData.processSummary}
                        onChange={handleInputChange}
                        required
                        rows={5}
                        className="lux-field w-full resize-none rounded-2xl border px-5 py-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                        placeholder={structured.processPlaceholder}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {structured.toolsLabel}
                      </label>
                      <textarea
                        name="currentTools"
                        value={formData.currentTools}
                        onChange={handleInputChange}
                        rows={4}
                        className="lux-field w-full resize-none rounded-2xl border px-5 py-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                        placeholder={structured.toolsPlaceholder}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {structured.goalLabel}
                      </label>
                      <textarea
                        name="goal"
                        value={formData.goal}
                        onChange={handleInputChange}
                        required
                        rows={4}
                        className="lux-field w-full resize-none rounded-2xl border px-5 py-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                        placeholder={structured.goalPlaceholder}
                      />
                    </div>
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      className="lux-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                      whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
                    >
                      {isSubmitting ? copy.sendingLabel : extra.form.submit}
                    </motion.button>
                    {submitStatus && (
                      <div className="lux-alert-danger">{submitStatus}</div>
                    )}
                  </form>
                  )}
                </div>
              </AnimatedSection>

              <AnimatedSection direction="fade" delay={0.06} className="space-y-10">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-700 dark:text-accent-400">
                    {extra.panels.auditIncludes}
                  </p>
                  <ul className="mt-5 space-y-4 text-sm leading-7 text-slate-700 dark:text-slate-200">
                    {extra.intro.bullets.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <i className="ri-check-line mt-0.5 text-primary-600 dark:text-accent-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-slate-200 pt-8 dark:border-slate-800">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-700 dark:text-accent-400">
                    {extra.panels.nextSteps}
                  </p>
                  <ol className="mt-5 space-y-4 text-sm leading-7 text-slate-700 dark:text-slate-200">
                    {extra.intro.nextSteps.map((item, index) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="font-semibold text-primary-700 dark:text-accent-400">
                          0{index + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="border-t border-slate-200 pt-8 dark:border-slate-800">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-700 dark:text-accent-400">
                    {extra.schedulingBridge.eyebrow}
                  </p>
                  <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
                    {extra.schedulingBridge.title}
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-200">
                    {extra.schedulingBridge.description}
                  </p>
                  <CtaLinks
                    primaryHref="/scheduling?meetingTypeKey=free-audit"
                    primaryLabel={extra.schedulingBridge.primaryCta}
                    secondaryHref="#free-audit-form"
                    secondaryLabel={extra.schedulingBridge.secondaryCta}
                    quietSecondary
                    className="mt-6"
                  />
                </div>
                <div className="border-t border-slate-200 pt-8 dark:border-slate-800">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-700 dark:text-accent-400">
                    {extra.panels.contactDetails}
                  </p>
                  <div className="mt-5 space-y-5">
                    {contactInfo.map((item) => (
                      <div key={item.title} className="flex items-start gap-4">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-600/10 text-primary-600 dark:bg-accent-500/10 dark:text-accent-400">
                          <i className={`${item.icon} text-lg`} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {item.title}
                          </p>
                          {item.href ? (
                            <a
                              href={item.href}
                              className="mt-1 block text-sm font-medium text-primary-700 hover:underline dark:text-accent-400"
                            >
                              {item.content}
                            </a>
                          ) : (
                            <p className="mt-1 text-sm font-medium text-primary-700 dark:text-accent-400">
                              {item.content}
                            </p>
                          )}
                          <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
