"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

import AnimatedSection from "@/components/AnimatedSection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useLanguage } from "@/components/LanguageProvider";
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
        "Maacht d'Scheduling op, wann Dir de gratis Audit als Rendez-vous oder e Live-Gespréich wëllt.",
      description:
        "Benotzt d'Scheduling, wann Dir bereet sidd direkt eng Zäit ze wielen. Benotzt dëse Kontakt-Formulaire, wann Dir léiwer fir d'éischt de Workflow-Kontext schrëftlech schécke wëllt.",
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

export default function ContactPage() {
  const { lang } = useLanguage();
  const extra = localizedContactExtras[lang] ?? localizedContactExtras.en;
  const copy = {
    submitError: t<string>(lang as any, "contact.modal.errorBody"),
    nameLabel: t<string>(lang as any, "contact.form.fullName"),
    emailLabel: t<string>(lang as any, "contact.form.email"),
    confirmEmailLabel: t<string>(lang as any, "contact.form.confirmEmail"),
    phoneLabel: t<string>(lang as any, "contact.form.phone"),
    companyLabel: t<string>(lang as any, "contact.form.company"),
    submitLabel: t<string>(lang as any, "contact.form.submit"),
    sendingLabel: t<string>(lang as any, "contact.form.sending"),
    namePlaceholder: t<string>(lang as any, "contact.form.placeholders.name"),
    emailPlaceholder: t<string>(lang as any, "contact.form.placeholders.email"),
    confirmEmailPlaceholder: t<string>(
      lang as any,
      "contact.form.placeholders.confirmEmail"
    ),
    companyPlaceholder: t<string>(
      lang as any,
      "contact.form.placeholders.company"
    ),
    phonePlaceholder: t<string>(lang as any, "contact.form.placeholders.phone"),
    emailMismatch: t<string>(lang as any, "contact.form.errors.emailMismatch"),
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
    confirmEmail: "",
    phone: "",
    company: "",
    taskDescription: "",
    website: "",
  });
  const [errors, setErrors] = useState<{
    confirmEmail?: string;
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

    const email = formData.email.trim().toLowerCase();
    const confirmEmail = formData.confirmEmail.trim().toLowerCase();
    if (email !== confirmEmail) {
      next.confirmEmail = copy.emailMismatch;
    }

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
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setFormData({
        name: "",
        email: "",
        confirmEmail: "",
        phone: "",
        company: "",
        taskDescription: "",
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

      <AlertModal
        open={showAlert}
        onClose={() => setShowAlert(false)}
        title={t<string>(lang as any, "contact.modal.title")}
        body={t<string>(lang as any, "contact.modal.body")}
        closeLabel={t<string>(lang as any, "contact.modal.close")}
      />

      <main>
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0e427e_0%,#123f7a_58%,#0f172a_100%)] text-white">
          <div className="absolute inset-0 bg-[url('/images/page-bg.jpg')] bg-cover bg-center opacity-15" />
          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 sm:py-28">
            <AnimatedSection className="mx-auto max-w-4xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">
                {t<string>(lang as any, "common.nav.contact")}
              </p>
              <p className="mt-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-blue-100 backdrop-blur">
                {extra.writeFirstLabel}
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                {extra.intro.title}
              </h1>
              <p className="mt-6 text-lg leading-8 text-blue-100">
                {extra.intro.subtitle}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="#free-audit-form"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary-700 transition-transform duration-200 hover:-translate-y-0.5"
                >
                  {extra.intro.primaryCta}
                </Link>
                <Link
                  href="/scheduling?meetingTypeKey=free-audit"
                  className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/15"
                >
                  {extra.schedulingBridge.primaryCta}
                </Link>
              </div>
              <p className="mt-4 text-sm leading-7 text-blue-100/90">
                {extra.heroHelper}
              </p>
            </AnimatedSection>
          </div>
        </section>

        <section className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
              <AnimatedSection direction="left">
                <div
                  id="free-audit-form"
                  className="scroll-mt-28 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_55px_-38px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-accent-400">
                      {extra.form.eyebrow}
                    </p>
                    <h2 className="mt-4 text-3xl font-black tracking-[-0.04em]">
                      {extra.form.title}
                    </h2>
                    <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
                      {extra.form.description}
                    </p>
                  </div>

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
                          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-accent-400 dark:focus:ring-accent-400/15"
                          placeholder={copy.namePlaceholder}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          {copy.companyLabel}
                        </label>
                        <input
                          type="text"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          required
                          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-accent-400 dark:focus:ring-accent-400/15"
                          placeholder={copy.companyPlaceholder}
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
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
                          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-accent-400 dark:focus:ring-accent-400/15"
                          placeholder={copy.emailPlaceholder}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          {copy.confirmEmailLabel}
                        </label>
                        <input
                          type="email"
                          name="confirmEmail"
                          value={formData.confirmEmail}
                          onChange={handleInputChange}
                          required
                          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-accent-400 dark:focus:ring-accent-400/15"
                          placeholder={copy.confirmEmailPlaceholder}
                        />
                        {errors.confirmEmail && (
                          <p className="mt-2 text-sm text-red-600">
                            {errors.confirmEmail}
                          </p>
                        )}
                      </div>
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
                        containerClassName="rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                        inputContainerClassName="border-0 shadow-none focus-within:ring-0"
                        inputClassName="text-sm text-slate-900 dark:text-white"
                        buttonClassName="text-slate-700 dark:text-slate-200"
                      />
                      {errors.phone && (
                        <p className="mt-2 text-sm text-red-600">
                          {errors.phone}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {extra.form.phoneHint}
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {extra.form.taskLabel}
                      </label>
                      <textarea
                        name="taskDescription"
                        value={formData.taskDescription}
                        onChange={handleInputChange}
                        required
                        rows={7}
                        maxLength={500}
                        className="w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-accent-400 dark:focus:ring-accent-400/15"
                        placeholder={extra.form.taskPlaceholder}
                      />
                      <div className="mt-2 text-right text-xs text-slate-500 dark:text-slate-400">
                        {formData.taskDescription.length}/500
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex w-full items-center justify-center rounded-full bg-primary-600 px-6 py-4 text-base font-semibold text-white transition-all duration-200 hover:-translate-y-1 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                      whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
                    >
                      {isSubmitting ? copy.sendingLabel : extra.form.submit}
                    </motion.button>

                    {submitStatus && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200">
                        {submitStatus}
                      </div>
                    )}
                  </form>
                </div>
              </AnimatedSection>

              <AnimatedSection direction="right" className="space-y-6">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_-38px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-accent-400">
                    {extra.panels.auditIncludes}
                  </p>
                  <ul className="mt-5 space-y-4 text-sm text-slate-700 dark:text-slate-200">
                    {extra.intro.bullets.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <i className="ri-check-line mt-0.5 text-primary-600 dark:text-accent-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_-38px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-accent-400">
                    {extra.panels.nextSteps}
                  </p>
                  <ol className="mt-5 space-y-4 text-sm text-slate-700 dark:text-slate-200">
                    {extra.intro.nextSteps.map((item, index) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_-38px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-accent-400">
                    {extra.schedulingBridge.eyebrow}
                  </p>
                  <h2 className="mt-4 text-2xl font-black tracking-[-0.03em]">
                    {extra.schedulingBridge.title}
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {extra.schedulingBridge.description}
                  </p>
                  <ul className="mt-5 space-y-3 text-sm text-slate-700 dark:text-slate-200">
                    {extra.schedulingBridge.bullets.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <i className="ri-arrow-right-up-line mt-0.5 text-primary-600 dark:text-accent-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/scheduling?meetingTypeKey=free-audit"
                      className="inline-flex items-center justify-center rounded-full bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-700"
                    >
                      {extra.schedulingBridge.primaryCta}
                    </Link>
                    <Link
                      href="#free-audit-form"
                      className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition-colors duration-200 hover:border-primary-300 hover:text-primary-700 dark:border-slate-700 dark:text-slate-100 dark:hover:border-accent-400/40 dark:hover:text-accent-400"
                    >
                      {extra.schedulingBridge.secondaryCta}
                    </Link>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_-38px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-accent-400">
                    {extra.panels.contactDetails}
                  </p>
                  <div className="mt-5 space-y-4">
                    {contactInfo.map((item) => (
                      <div
                        key={item.title}
                        className="flex items-start gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                      >
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
                              className="mt-1 block text-sm font-medium text-primary-600 hover:underline dark:text-accent-400"
                            >
                              {item.content}
                            </a>
                          ) : (
                            <p className="mt-1 text-sm font-medium text-primary-600 dark:text-accent-400">
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
