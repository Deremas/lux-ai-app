"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/site-copy";

import SearchablePhoneInput from "@/components/PhoneInputField";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 max-w-sm w-full text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="mb-6 text-gray-700 dark:text-gray-300">{body}</p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all duration-200 font-medium"
        >
          {closeLabel}
        </button>
      </div>
    </div>
  );
}

export default function ContactPage() {
  const { lang } = useLanguage();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    confirmEmail: "",
    phone: "",
    company: "",
    taskDescription: "",
    website: "", // honeypot
  });

  const [errors, setErrors] = useState<{
    confirmEmail?: string;
    phone?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const { ref: heroRef, inView: heroInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateClient = () => {
    const next: typeof errors = {};

    const email = formData.email.trim().toLowerCase();
    const confirmEmail = formData.confirmEmail.trim().toLowerCase();
    if (email !== confirmEmail) {
      next.confirmEmail = t(lang, "contact.form.errors.emailMismatch");
    }

    // lightweight phone check (server will do the real validation)
    const digits = formData.phone.replace(/\D/g, "");
    if (!formData.phone.trim()) {
      next.phone = t(lang, "contact.form.errors.phoneRequired");
    } else if (!formData.phone.startsWith("+") || digits.length < 7) {
      next.phone = t(lang, "contact.form.errors.phoneInvalid");
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateClient()) return;

    setIsSubmitting(true);
    setSubmitStatus("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Request failed");

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
      setSubmitStatus(t(lang, "contact.modal.errorBody"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = ["person", "location", "email", "phone", "authorization"].map(
    (k) => {
      const linkLabel = t(lang, `contact.info.${k}.linkLabel`);
      return {
        key: k,
        icon: t(lang, `contact.info.${k}.icon`),
        title: t(lang, `contact.info.${k}.title`),
        content: t(lang, `contact.info.${k}.content`),
        description: t(lang, `contact.info.${k}.description`),
        linkLabel:
          linkLabel === `contact.info.${k}.linkLabel` ? "" : linkLabel,
        isEmail: k === "email",
        isAuthorization: k === "authorization",
      };
    }
  );

  const whyChooseUs = ["i1", "i2", "i3", "i4"].map((k) =>
    t(lang, `contact.why.${k}`)
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
      <Header />

      <AlertModal
        open={showAlert}
        onClose={() => setShowAlert(false)}
        title={t(lang, "contact.modal.title")}
        body={t(lang, "contact.modal.body")}
        closeLabel={t(lang, "contact.modal.close")}
      />

      <motion.div
        ref={heroRef}
        className="relative py-32 bg-gradient-to-br from-[#0e427e] to-[#0f437f] overflow-hidden"
        style={{
          backgroundImage: `url('./images/page-bg.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[#0e427e]/80"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 100 }}
            transition={{ duration: 1.2 }}
          >
            <motion.h1
              className="text-5xl md:text-7xl font-bold text-white mb-8"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={
                heroInView
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 0, scale: 0.5 }
              }
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {t(lang, "contact.hero.title")}
            </motion.h1>

            <motion.p
              className="text-xl text-white/90 dark:text-white/80 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 50 }}
              animate={
                heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }
              }
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {t(lang, "contact.hero.subtitle")}
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      <AnimatedSection className="py-32 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2">
              <AnimatedSection>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-10">
                  {t(lang, "contact.form.title")}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* honeypot */}
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  <div className="grid md:grid-cols-2 gap-8">
                    <AnimatedSection delay={0.1}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t(lang, "contact.form.fullName")}
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-accent-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm"
                        placeholder={t(lang, "contact.form.placeholders.name")}
                      />
                    </AnimatedSection>

                    <AnimatedSection delay={0.2}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t(lang, "contact.form.email")}
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-accent-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm"
                        placeholder={t(lang, "contact.form.placeholders.email")}
                      />
                    </AnimatedSection>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <AnimatedSection delay={0.25}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t(lang, "contact.form.confirmEmail")}
                      </label>
                      <input
                        type="email"
                        name="confirmEmail"
                        value={formData.confirmEmail}
                        onChange={handleInputChange}
                        required
                        className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-accent-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm"
                        placeholder={t(
                          lang,
                          "contact.form.placeholders.confirmEmail"
                        )}
                      />
                      {errors.confirmEmail && (
                        <p className="mt-2 text-sm text-red-600">
                          {errors.confirmEmail}
                        </p>
                      )}
                    </AnimatedSection>

                    <AnimatedSection delay={0.28}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t(lang, "contact.form.phone")}
                      </label>

                      <SearchablePhoneInput
                        defaultCountry="lu"
                        value={formData.phone}
                        onChange={(phone) =>
                          setFormData((p) => ({ ...p, phone }))
                        }
                        placeholder={t(lang, "contact.form.placeholders.phone")}
                        containerClassName="rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 px-3 py-2"
                        inputContainerClassName="border-0 shadow-none focus-within:ring-0"
                        inputClassName="text-sm text-gray-900 dark:text-white"
                        buttonClassName="text-gray-700 dark:text-gray-200"
                      />

                      {errors.phone && (
                        <p className="mt-2 text-sm text-red-600">
                          {errors.phone}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {t(lang, "contact.form.phoneHint")}
                      </p>
                    </AnimatedSection>
                  </div>

                  <AnimatedSection delay={0.3}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t(lang, "contact.form.company")}
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      required
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-accent-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm"
                      placeholder={t(lang, "contact.form.placeholders.company")}
                    />
                  </AnimatedSection>

                  <AnimatedSection delay={0.4}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t(lang, "contact.form.task")}
                    </label>
                    <textarea
                      name="taskDescription"
                      value={formData.taskDescription}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      maxLength={500}
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-accent-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm resize-none"
                      placeholder={t(lang, "contact.form.placeholders.task")}
                    />
                    <div className="text-right text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {formData.taskDescription.length}/500
                    </div>
                  </AnimatedSection>

                  <AnimatedSection delay={0.5}>
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#0e427e] text-white py-4 px-8 rounded-lg hover:bg-[#0f437f] transition-all duration-200 font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isSubmitting
                        ? t(lang, "contact.form.sending")
                        : t(lang, "contact.form.submit")}
                    </motion.button>
                  </AnimatedSection>

                  {submitStatus && (
                    <AnimatedSection>
                      <div className="p-4 rounded-lg text-center font-medium text-red-600">
                        {submitStatus}
                      </div>
                    </AnimatedSection>
                  )}
                </form>
              </AnimatedSection>
            </div>

            <div className="space-y-10">
              <AnimatedSection delay={0.2}>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                  {t(lang, "contact.sidebar.title")}
                </h3>

                <div className="space-y-6">
                  {contactInfo.map((info, index) => (
                    <AnimatedSection key={index} delay={index * 0.1}>
                      <motion.div
                        className="flex items-start space-x-4 p-6 bg-gray-50 dark:bg-slate-800 rounded-lg"
                        whileHover={{ scale: 1.02, y: -5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div
                          className="w-12 h-12 bg-[#0e427e] dark:bg-[#f9b019] rounded-full flex items-center justify-center"
                          animate={{ rotate: [0, 360] }}
                          transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <i className={`${info.icon} text-white text-xl`}></i>
                        </motion.div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {info.title}
                          </h4>

                          {info.isEmail ? (
                            <a
                              href={`mailto:${info.content}`}
                              className="text-primary-600 dark:text-accent-500 font-medium mb-1 hover:underline"
                            >
                              {info.content}
                            </a>
                          ) : (
                            <p className="text-primary-600 dark:text-accent-500 font-medium mb-1">
                              {info.content}
                            </p>
                          )}

                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {info.description}
                          </p>

                          {info.isAuthorization && info.linkLabel && (
                            <a
                              href="/legal#business-identifiers"
                              className="mt-2 inline-flex text-sm font-semibold text-primary-600 dark:text-accent-500 hover:underline"
                            >
                              {info.linkLabel}
                            </a>
                          )}
                        </div>
                      </motion.div>
                    </AnimatedSection>
                  ))}
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.4}>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {t(lang, "contact.whyTitle")}
                </h3>

                <div className="space-y-4">
                  {whyChooseUs.map((item, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center text-gray-600 dark:text-gray-300"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <div className="w-5 h-5 flex items-center justify-center mr-3">
                        <i className="ri-check-line text-primary-600 dark:text-accent-500"></i>
                      </div>
                      {item}
                    </motion.div>
                  ))}
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <Footer />
    </div>
  );
}
