"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Boxes, LayoutGrid, ShoppingCart, Monitor } from "lucide-react";

import { useLanguage } from "@/components/LanguageProvider";

import { t } from "@/lib/site-copy";
import type { Lang } from "@/lib/i18n-types";
import { useMemo, useState } from "react";
// or import { normalizeLang } too if you need it

// Hide missing translations (when t() returns the key itself)
function safeText(lang: Lang, key: string) {
  const v = t<string>(lang, key);
  if (!v) return "";
  if (v === key) return "";
  if (v.startsWith("home.") || v.startsWith("services.")) return "";
  return v;
}

export default function Home() {
  const { lang } = useLanguage();

  // rotation state (hover in + hover out)
  const [capRot, setCapRot] = useState<Record<string, number>>({});
  const [svcRot, setSvcRot] = useState<Record<string, number>>({});

  const { ref: heroRef, inView: heroInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const { ref: statsRef, inView: statsInView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  const stats = [
    {
      icon: "ri-robot-line",
      number: "10+",
      label: t(lang, "home.stats.businessesAutomated"),
      color: "bg-primary-500",
    },
    {
      icon: "ri-flashlight-line",
      number: "95%",
      label: t(lang, "home.stats.workflowAccuracy"),
      color: "bg-accent-500",
    },
    {
      icon: "ri-time-line",
      number: "24/7",
      label: t(lang, "home.stats.automatedOperations"),
      color: "bg-primary-500",
    },
  ];

  // ✅ Removed erpApps + ecommerceInventory (you said you don't want these)
  const capabilityTiles = [
    { key: "publicChatbots", logo: "ri-message-3-line" },
    { key: "protectedChatbots", logo: "ri-shield-check-line" },
    { key: "adminKb", logo: "ri-admin-line" },
    { key: "integrationAutomation", logo: "ri-git-merge-line" },
  ].map((item) => ({
    name: t(lang, `home.capabilities.${item.key}.name`),
    desc: t(lang, `home.capabilities.${item.key}.desc`),
    logo: item.logo,
  }));

  const servicesRaw = [
    {
      key: "digitalStrategy",
      icon: "ri-road-map-line",
      color: "bg-primary-500",
      badgeKey: "services.recommendedStartingPoint",
    },
    { key: "workflowAutomation", icon: "ri-flow-chart", color: "bg-blue-500" },
    { key: "chatbots", icon: "ri-robot-line", color: "bg-yellow-500" },
    {
      key: "processOptimization",
      icon: "ri-settings-3-line",
      color: "bg-green-500",
    },
    {
      key: "predictiveAnalytics",
      icon: "ri-bar-chart-line",
      color: "bg-purple-500",
    },
  ] as const;

  const services = servicesRaw.map((s) => ({
    key: s.key,
    title: t(lang, `home.services.${s.key}.title`),
    description: t(lang, `home.services.${s.key}.description`),
    detail: t(lang, `home.services.${s.key}.detail`),
    bestFor: t(lang, `home.services.${s.key}.bestFor`),
    icon: s.icon,
    color: s.color,
    badge: "badgeKey" in s ? t(lang, s.badgeKey as string) : "",
  }));

  const platformDefs = [
    { key: "erp", Icon: Boxes },
    { key: "customApps", Icon: LayoutGrid },
    { key: "ecommerce", Icon: ShoppingCart },
    { key: "websites", Icon: Monitor },
  ] as const;

  // Colored icon blocks (like screenshot 3), unique per platform
  const platformStyle: Record<
    (typeof platformDefs)[number]["key"],
    { iconBg: string; iconFg: string; hoverRing: string; hoverIcon: any }
  > = {
    erp: {
      iconBg: "bg-blue-600",
      iconFg: "text-white",
      hoverRing: "hover:ring-blue-200 dark:hover:ring-blue-900/40",
      hoverIcon: { rotate: 6, scale: 1.07 },
    },
    customApps: {
      iconBg: "bg-indigo-600",
      iconFg: "text-white",
      hoverRing: "hover:ring-indigo-200 dark:hover:ring-indigo-900/40",
      hoverIcon: { y: -2, scale: 1.07 },
    },
    ecommerce: {
      iconBg: "bg-amber-500",
      iconFg: "text-white",
      hoverRing: "hover:ring-amber-200 dark:hover:ring-amber-900/40",
      hoverIcon: { rotate: -8, scale: 1.07 },
    },
    websites: {
      iconBg: "bg-emerald-600",
      iconFg: "text-white",
      hoverRing: "hover:ring-emerald-200 dark:hover:ring-emerald-900/40",
      hoverIcon: { scale: 1.08, y: -1 },
    },
  };

  const platforms = platformDefs.map((p) => ({
    key: p.key,
    title: t(lang, `home.platforms.${p.key}.title`),
    desc: t(lang, `home.platforms.${p.key}.desc`),
    Icon: p.Icon,
    style: platformStyle[p.key],
  }));

  const team = [
    {
      key: "molla",
      image: "/avatars/molla.png",
      linkedin: "https://www.linkedin.com/in/molla-sisay-jemere",
      twitter: "#",
      whatsapp: "https://wa.me/352691833894",
      facebook: "https://www.facebook.com/mollasisayjemere1",
      email: "mailto:mollasisayjemere@gmaill.com",
    },
    {
      key: "fikre",
      image: "/avatars/fikre.png",
      linkedin: "https://.linkedin.com/in/fikremariam-mekonnnen",
      twitter: "#",
      whatsapp: "https://wa.me/251913226793",
      facebook: "https://www.facebook.com/fikremariam.mekonnen",
      email: "mailto:fikremariam2012@gmail.com",
    },
    {
      key: "dereje",
      image: "/avatars/dere.png",
      linkedin: "https://linkedin.com/in/DerejeMasresha",
      twitter: "https://x.com/Deremas27",
      whatsapp: "https://wa.me/251922243038",
      facebook: "https://www.facebook.com/dbazmm3",
      email: "mailto:derejemasresha27@gmail.com",
    },
  ].map((m) => ({
    name: t(lang, `home.team.${m.key}.name`),
    role: t(lang, `home.team.${m.key}.role`),
    quote: t(lang, `home.team.${m.key}.quote`),
    image: m.image,
    linkedin: m.linkedin,
    twitter: m.twitter,
    whatsapp: m.whatsapp,
    facebook: m.facebook,
    email: m.email,
  }));

  const testimonials = ["t1", "t2", "t3"].map((k, idx) => ({
    quote: t(lang, `home.testimonials.${k}.quote`),
    author: t(lang, `home.testimonials.${k}.author`),
    role: t(lang, `home.testimonials.${k}.role`),
    image: [
      "/avatars/avataaars.svg",
      "/avatars/avataaars-3.svg",
      "/avatars/avataaars-2.svg",
    ][idx],
  }));

  // ✅ Trusted bullets (auto-hide missing translations)
  const trustedBullets = useMemo(
    () =>
      [
        {
          icon: "ri-timer-flash-line",
          text: safeText(lang, "home.trusted.bullets.b1"),
        },
        {
          icon: "ri-shield-check-line",
          text: safeText(lang, "home.trusted.bullets.b2"),
        },
        {
          icon: "ri-line-chart-line",
          text: safeText(lang, "home.trusted.bullets.b3"),
        },
      ].filter((b) => knowingText(b.text)),
    [lang]
  );

  // ✅ Platforms bullets (auto-hide missing translations)
  const platformBullets = useMemo(
    () =>
      [
        {
          icon: "ri-plug-2-line",
          text: safeText(lang, "home.platformsBlock.bullets.b1"),
        },
        {
          icon: "ri-lock-2-line",
          text: safeText(lang, "home.platformsBlock.bullets.b2"),
        },
        {
          icon: "ri-node-tree",
          text: safeText(lang, "home.platformsBlock.bullets.b3"),
        },
      ].filter((b) => knowingText(b.text)),
    [lang]
  );

  const scheduling = useMemo(() => {
    const copy: Record<
      Lang,
      {
        eyebrow: string;
        title: string;
        subtitle: string;
        cta: string;
        bullets: string[];
        cards: Array<{ title: string; desc: string }>;
      }
    > = {
      en: {
        eyebrow: "Scheduling",
        title: "Sync calendars, match the right expert, balance demand.",
        subtitle:
          "Turn interest into confirmed meetings with smart availability, staff matching, and buffer-aware booking flows.",
        cta: "View availability",
        bullets: [
          "Unified availability across staff calendars",
          "Automatic buffers to prevent back-to-back overload",
          "Role-aware approvals for higher value sessions",
        ],
        cards: [
          {
            title: "Sync",
            desc: "Connect team calendars and expose real-time open slots.",
          },
          {
            title: "Match",
            desc: "Assign the best-fit specialist based on meeting type.",
          },
          {
            title: "Balance",
            desc: "Distribute bookings evenly with smart rules and buffers.",
          },
        ],
      },
      fr: {
        eyebrow: "Planification",
        title: "Synchronisez, associez les bons experts, équilibrez la demande.",
        subtitle:
          "Transformez l’intérêt en rendez-vous confirmés avec une disponibilité intelligente et des buffers automatiques.",
        cta: "Voir les disponibilités",
        bullets: [
          "Disponibilités unifiées des équipes",
          "Buffers automatiques pour éviter la surcharge",
          "Approbations adaptées aux rendez-vous clés",
        ],
        cards: [
          {
            title: "Synchroniser",
            desc: "Reliez les agendas et exposez les créneaux en temps réel.",
          },
          {
            title: "Associer",
            desc: "Attribuez le spécialiste idéal selon le type de réunion.",
          },
          {
            title: "Équilibrer",
            desc: "Répartissez les réservations avec des règles intelligentes.",
          },
        ],
      },
      de: {
        eyebrow: "Terminplanung",
        title: "Synchronisieren, passende Experten zuweisen, Nachfrage ausgleichen.",
        subtitle:
          "Machen Sie aus Interesse bestätigte Termine mit smarter Verfügbarkeit und Puffer-Regeln.",
        cta: "Verfügbarkeit ansehen",
        bullets: [
          "Gemeinsame Verfügbarkeit im Team",
          "Automatische Puffer gegen Überlastung",
          "Freigaben für wertvolle Termine",
        ],
        cards: [
          {
            title: "Sync",
            desc: "Kalender verbinden und freie Slots in Echtzeit zeigen.",
          },
          {
            title: "Match",
            desc: "Den passenden Spezialisten pro Meeting-Typ zuweisen.",
          },
          {
            title: "Balance",
            desc: "Buchungen mit Regeln und Puffern sauber verteilen.",
          },
        ],
      },
      lb: {
        eyebrow: "Rendez-vous",
        title: "Synchroniséiert, passt Experten, gläicht d’Nofro aus.",
        subtitle:
          "Maacht aus Interesse confirméiert Rendez-vous mat smarter Verfügbarkeet a Bufferen.",
        cta: "Disponibilitéit kucken",
        bullets: [
          "Verfügbarkeet iwwer d’Team hinweg",
          "Automatesch Bufferen géint Iwwerlaaschtung",
          "Passend Geneemegunge fir wichteg Sessiounen",
        ],
        cards: [
          {
            title: "Sync",
            desc: "Kalennere verbannen a fräi Slots live weisen.",
          },
          {
            title: "Match",
            desc: "De richtegen Expert fir all Meeting-Typ zouweisen.",
          },
          {
            title: "Balance",
            desc: "Buchungen intelligent verdeelen mat Buffer-Regelen.",
          },
        ],
      },
    };

    return copy[lang];
  }, [lang]);

  function knowingText(v: string) {
    return typeof v === "string" && v.trim().length > 0;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
      <Header />

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800"
      >
        <div className="absolute inset-0 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center opacity-10"></div>

        <motion.div
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
          initial={{ opacity: 0 }}
          animate={heroInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ">
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: -100 }}
              animate={
                heroInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -100 }
              }
              transition={{ duration: 1, delay: 0.2 }}
            >
              <motion.h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight"
                initial={{ opacity: 0, y: 50 }}
                animate={
                  heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }
                }
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <motion.span
                  className="block"
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                  }
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  {t(lang, "home.hero.line1")}
                </motion.span>

                <motion.span
                  className="block text-primary-500 dark:text-accent-500"
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                  }
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  {t(lang, "home.hero.line2")}
                </motion.span>

                <motion.span
                  className="block"
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                  }
                  transition={{ duration: 0.6, delay: 1.0 }}
                >
                  {t(lang, "home.hero.line3")}
                </motion.span>
              </motion.h1>

              <motion.p
                className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl"
                initial={{ opacity: 0, y: 30 }}
                animate={
                  heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                }
                transition={{ duration: 0.8, delay: 1.2 }}
              >
                {t(lang, "home.hero.subtitle")}
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row sm:flex-wrap gap-4"
                initial={{ opacity: 0, y: 30 }}
                animate={
                  heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                }
                transition={{ duration: 0.8, delay: 1.4 }}
              >
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 whitespace-normal text-center w-full sm:w-auto max-w-full group"
                >
                  {t(lang, "home.hero.ctaAudit")}
                  <div className="w-5 h-5 ml-2 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1">
                    <i className="ri-arrow-right-line"></i>
                  </div>
                </Link>

                <Link
                  href="/how-it-works"
                  className="inline-flex items-center justify-center px-8 py-4 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 whitespace-nowrap group"
                >
                  {t(lang, "home.hero.ctaHow")}
                  <div className="w-5 h-5 ml-2 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <i className="ri-play-circle-line"></i>
                  </div>
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative min-w-0 w-full max-w-full"
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={
                heroInView
                  ? { opacity: 1, x: 0, scale: 1 }
                  : { opacity: 0, x: 100, scale: 0.8 }
              }
              transition={{ duration: 1.2, delay: 0.6 }}
            >
              <motion.img
                src="/images/hero.jpg"
                alt={t(lang, "home.hero.imageAlt")}
                className="block w-full max-w-full h-auto mx-auto rounded-2xl shadow-2xl object-cover"
                animate={{ y: [0, -20, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute -top-4 -left-4 w-72 h-72 bg-primary-500 rounded-full opacity-10"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute -bottom-4 -right-4 w-96 h-96 bg-accent-500 rounded-full opacity-10"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 text-center">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="space-y-6"
                initial={{ opacity: 0, y: 100 }}
                animate={
                  statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 100 }
                }
                transition={{
                  duration: 0.8,
                  delay: index * 0.2,
                  ease: [0.25, 0.4, 0.25, 1],
                }}
              >
                <motion.div
                  className={`w-20 h-20 ${stat.color} rounded-full flex items-center justify-center mx-auto`}
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.3 }}
                >
                  <i className={`${stat.icon} text-white text-3xl`}></i>
                </motion.div>

                <motion.h3
                  className="text-4xl font-bold text-primary-500 dark:text-accent-500"
                  initial={{ scale: 0 }}
                  animate={statsInView ? { scale: 1 } : { scale: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 + 0.3 }}
                >
                  {stat.number}
                </motion.h3>

                <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By / What We Deliver Section */}
      <AnimatedSection className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-800 dark:to-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-14" delay={0.2}>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {t(lang, "home.trusted.title")}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t(lang, "home.trusted.subtitle")}
            </p>
          </AnimatedSection>

          {trustedBullets.length > 0 && (
            <div className="max-w-5xl mx-auto mb-12">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {trustedBullets.map((b, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-center gap-3 bg-white/70 dark:bg-slate-900/40 border border-gray-200 dark:border-slate-700 rounded-xl p-4"
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-slate-700 flex items-center justify-center shrink-0">
                      <i
                        className={`${b.icon} text-primary-600 dark:text-white text-lg`}
                      />
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                      {b.text}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {capabilityTiles.map((item, index) => (
              <AnimatedSection
                key={item.name}
                delay={index * 0.08}
                direction="up"
              >
                <motion.div className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 h-full">
                  <motion.div
                    className="relative w-14 h-14 rounded-2xl bg-primary-50 dark:bg-slate-700 flex items-center justify-center mb-4"
                    animate={{ rotate: capRot[item.name] || 0 }}
                    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    onHoverStart={() =>
                      setCapRot((r) => ({
                        ...r,
                        [item.name]: (r[item.name] || 0) + 360,
                      }))
                    }
                    onHoverEnd={() =>
                      setCapRot((r) => ({
                        ...r,
                        [item.name]: (r[item.name] || 0) + 360,
                      }))
                    }
                    whileHover={{
                      scale: 1.12,
                      y: -6,
                      boxShadow: "0 18px 40px -18px rgba(37,99,235,0.55)",
                    }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-2xl"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.25 }}
                      style={{ boxShadow: "0 0 0 6px rgba(37,99,235,0.15)" }}
                    />
                    <motion.i
                      className={`${item.logo} text-primary-600 dark:text-white text-2xl relative z-10`}
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.2 }}
                    />
                  </motion.div>

                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.name}
                  </p>
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 leading-snug">
                    {item.desc}
                  </p>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection className="mt-10 text-center" delay={0.4}>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t(lang, "home.trusted.outcomes")}
            </p>
          </AnimatedSection>
        </div>
      </AnimatedSection>

      {/* Services Preview */}
      <AnimatedSection className="py-32 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {t(lang, "home.servicesBlock.title")}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t(lang, "home.servicesBlock.subtitle")}
            </p>
          </AnimatedSection>

          {/* ✅ REFINED: responsive header (md side-by-side, lg+ stacked) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            {services.map((service, index) => {
              const iconHover =
                service.key === "digitalStrategy"
                  ? { rotate: 10, scale: 1.08 }
                  : service.key === "workflowAutomation"
                  ? { y: -3, scale: 1.08 }
                  : service.key === "chatbots"
                  ? { rotate: -10, scale: 1.08 }
                  : service.key === "processOptimization"
                  ? { rotate: 12, scale: 1.08 }
                  : { y: -2, scale: 1.08 };

              return (
                <AnimatedSection
                  key={index}
                  delay={index * 0.08}
                  direction="up"
                >
                  <motion.div
                    className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-8 shadow-lg transition-all duration-300 h-full flex flex-col"
                    whileHover={{
                      y: -10,
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.22)",
                    }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* ✅ This wrapper fixes all views */}
                    <div
                      className="
                        flex items-start gap-5 mb-5
                        md:flex-row md:items-center
                        lg:flex-col lg:items-start
                      "
                    >
                      <motion.div
                        className={`w-16 h-16 ${service.color} rounded-2xl flex items-center justify-center shadow-sm shrink-0`}
                        animate={{ rotate: svcRot[service.key] || 0 }}
                        transition={{
                          duration: 0.65,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        onHoverStart={() =>
                          setSvcRot((r) => ({
                            ...r,
                            [service.key]: (r[service.key] || 0) + 360,
                          }))
                        }
                        onHoverEnd={() =>
                          setSvcRot((r) => ({
                            ...r,
                            [service.key]: (r[service.key] || 0) + 360,
                          }))
                        }
                        whileHover={{ ...iconHover }}
                      >
                        <i className={`${service.icon} text-white text-2xl`} />
                      </motion.div>

                      {/* Title + badge block */}
                      <div className="min-w-0">
                        {service.key === "digitalStrategy" && (
                          <div
                            className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full
                                       text-xs font-semibold bg-yellow-50 text-yellow-800 ring-1 ring-yellow-200
                                       dark:bg-yellow-900/25 dark:text-yellow-200 dark:ring-yellow-900/40
                                       w-fit whitespace-nowrap select-none"
                          >
                            <motion.i
                              className="ri-star-fill text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,1)] shrink-0"
                              animate={{ scale: [1, 1.15, 1] }}
                              transition={{
                                duration: 1.6,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            />
                            {service.badge || "Recommended starting point"}
                          </div>
                        )}

                        <h3
                          className="
                            text-xl font-semibold text-gray-900 dark:text-white
                            leading-snug break-words hyphens-auto
                          "
                        >
                          {service.title}
                        </h3>
                      </div>
                    </div>

                    {!!service.detail && (
                      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {service.detail}
                      </p>
                    )}

                    {!!service.bestFor && (
                      <p className="mt-3 text-xs font-semibold text-gray-700 dark:text-gray-200">
                        {service.bestFor}
                      </p>
                    )}
                  </motion.div>
                </AnimatedSection>
              );
            })}
          </div>

          {/* Platforms We Build */}
          <AnimatedSection className="mt-16" delay={0.2}>
            <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700">
              <div className="text-center mb-10">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t(lang, "home.platformsBlock.title")}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  {t(lang, "home.platformsBlock.subtitle")}
                </p>
              </div>

              {platformBullets.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                  {platformBullets.map((b, idx) => (
                    <motion.div
                      key={idx}
                      className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-5"
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        className="w-11 h-11 rounded-2xl bg-primary-50 dark:bg-slate-800 ring-1 ring-primary-100 dark:ring-slate-700 flex items-center justify-center"
                        whileHover={
                          idx === 0
                            ? { rotate: -8, scale: 1.06 }
                            : idx === 1
                            ? { scale: 1.08 }
                            : { y: -2, scale: 1.06 }
                        }
                        transition={{
                          type: "spring",
                          stiffness: 240,
                          damping: 14,
                        }}
                      >
                        <i
                          className={`${b.icon} text-primary-600 dark:text-white text-lg`}
                        />
                      </motion.div>

                      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                        {b.text}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {platforms.map((p, idx) => (
                  <motion.div
                    key={p.key}
                    className={[
                      "group bg-white dark:bg-slate-900 rounded-2xl p-7 shadow-sm border border-gray-200 dark:border-slate-700",
                      "ring-0 ring-offset-0 ring-offset-transparent",
                      "transition-all duration-200 hover:shadow-md hover:ring-4",
                      p.style.hoverRing,
                    ].join(" ")}
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.22 }}
                  >
                    <motion.div
                      className={[
                        "w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-sm",
                        p.style.iconBg,
                      ].join(" ")}
                      whileHover={p.style.hoverIcon}
                      transition={{
                        type: "spring",
                        stiffness: 240,
                        damping: 14,
                      }}
                    >
                      <p.Icon
                        className={["w-7 h-7", p.style.iconFg].join(" ")}
                      />
                    </motion.div>

                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {p.title}
                    </p>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {p.desc}
                    </p>

                    <div
                      className={[
                        "mt-5 h-1 w-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
                        idx % 2 === 0
                          ? "bg-primary-500/60"
                          : "bg-accent-500/60",
                      ].join(" ")}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection className="text-center mt-16" delay={0.6}>
            <Link
              href="/services"
              className="inline-flex items-center px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 whitespace-nowrap group"
            >
              {t(lang, "home.servicesBlock.cta")}
              <div className="w-5 h-5 ml-2 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1">
                <i className="ri-arrow-right-line"></i>
              </div>
            </Link>
          </AnimatedSection>
        </div>
      </AnimatedSection>

      {/* Scheduling Section */}
      <AnimatedSection className="py-28 bg-[radial-gradient(circle_at_top,_#e0f2fe_0%,_#f8fafc_35%,_#ffffff_70%)] dark:bg-[radial-gradient(circle_at_top,_#1e293b_0%,_#0f172a_55%,_#0b1120_100%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full border border-primary-200/60 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary-600 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200">
                {scheduling.eyebrow}
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                {scheduling.title}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                {scheduling.subtitle}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {scheduling.bullets.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/80 p-4 text-sm text-gray-700 shadow-[0_18px_30px_-24px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-gray-200"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/10 text-primary-600 dark:bg-slate-800 dark:text-slate-200">
                      <i className="ri-check-line text-lg" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/scheduling"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 via-blue-600 to-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {scheduling.cta}
                <i className="ri-calendar-check-line text-lg" />
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              {scheduling.cards.map((card, index) => (
                <motion.div
                  key={card.title}
                  className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.5)] backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/70"
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">
                      {card.title}
                    </p>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      0{index + 1}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {card.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Team Section */}
      <AnimatedSection className="py-32 bg-gray-100 dark:bg-slate-700 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {t(lang, "home.teamBlock.title")}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t(lang, "home.teamBlock.subtitle")}
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <AnimatedSection key={index} delay={index * 0.2} direction="up">
                <motion.div
                  className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-xl border border-gray-200 dark:border-slate-700 h-full flex flex-col"
                  whileHover={{
                    scale: 1.05,
                    y: -10,
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center mb-6">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-16 h-16 rounded-full object-cover mr-4"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {member.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 mb-6 italic">
                    "{member.quote}"
                  </p>

                  <div className="mt-auto flex items-center gap-4">
                    <a
                      href={member.linkedin}
                      target="_blank"
                      className="text-gray-600 dark:text-gray-300 hover:text-accent-500 dark:hover:text-accent-400 text-lg transition"
                      rel="noreferrer"
                    >
                      <i className="ri-linkedin-box-fill"></i>
                    </a>

                    <a
                      href={member.twitter}
                      target="_blank"
                      className="text-gray-600 dark:text-gray-300 hover:text-accent-500 dark:hover:text-accent-400 text-lg transition"
                      rel="noreferrer"
                    >
                      <i className="ri-twitter-x-fill"></i>
                    </a>
                    <a
                      href={member.whatsapp}
                      target="_blank"
                      className="text-gray-600 dark:text-gray-300 hover:text-accent-500 dark:hover:text-accent-400 text-lg transition"
                      rel="noreferrer"
                    >
                      <i className="ri-whatsapp-fill"></i>
                    </a>

                    <a
                      href={member.facebook}
                      className="text-gray-600 dark:text-gray-300 hover:text-accent-500 dark:hover:text-accent-400 text-lg transition"
                    >
                      <i className="ri-facebook-fill"></i>
                    </a>

                    <a
                      href={member.email}
                      className="text-gray-600 dark:text-gray-300 hover:text-accent-500 dark:hover:text-accent-400 text-lg transition"
                    >
                      <i className="ri-mail-fill"></i>
                    </a>
                  </div>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection className="py-32 bg-gradient-to-r from-[#0e427e] to-[#0f437f] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection direction="scale">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              {t(lang, "home.finalCta.title")}
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
              {t(lang, "home.finalCta.subtitle")}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center px-10 py-5 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 whitespace-normal text-center w-full sm:w-auto max-w-full group"
            >
              {t(lang, "home.finalCta.button")}
              <div className="w-5 h-5 ml-2 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <i className="ri-rocket-line"></i>
              </div>
            </Link>
          </AnimatedSection>
        </div>
      </AnimatedSection>
      <Footer />
    </div>
  );
}
