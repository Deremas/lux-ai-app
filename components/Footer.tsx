"use client";

import Link from "next/link";
import Image from "next/image";

import { useLanguage } from "@/components/LanguageProvider";
import { brand, footerLinks, navLabels } from "@/lib/marketing-content";

const localizedFooterCopy = {
  en: {
    description: brand.description,
    trustLine: brand.trustLine,
    contactTitle: "Contact",
    rights: "All rights reserved.",
  },
  fr: {
    description:
      "LuxAI Automation fournit des systèmes d’automatisation IA et du conseil aux PME et entreprises en croissance qui veulent des opérations plus rapides, des workflows plus propres et une meilleure communication client.",
    trustLine:
      "Conçu pour les PME et les entreprises en croissance au Luxembourg et en Europe.",
    contactTitle: "Contact",
    rights: "Tous droits réservés.",
  },
  de: {
    description:
      "LuxAI Automation liefert KI-Automatisierungssysteme und Beratung für KMU und wachsende Unternehmen, die schnellere Abläufe, sauberere Workflows und stärkere Kundenkommunikation wollen.",
    trustLine:
      "Entwickelt für KMU und wachsende Unternehmen in Luxemburg und Europa.",
    contactTitle: "Kontakt",
    rights: "Alle Rechte vorbehalten.",
  },
  lb: {
    description:
      "LuxAI Automation liwwert KI-Automatiséierungssystemer a Berodung fir PMEen a wuessend Betriber, déi méi séier Operatiounen, méi propper Workflows a besser Clientekommunikatioun wëllen.",
    trustLine:
      "Opgebaut fir PMEen a wuessend Betriber zu Lëtzebuerg an an Europa.",
    contactTitle: "Kontakt",
    rights: "All Rechter virbehalen.",
  },
} as const;

function localizedFooterLabel(label: string, lang: keyof typeof navLabels) {
  const labels = navLabels[lang];
  const lookup: Record<string, string> = {
    Home: labels.home,
    Solutions: labels.solutions,
    Consulting: labels.consulting,
    "Use Cases": labels.useCases,
    "How It Works": labels.howItWorks,
    Scheduling: labels.scheduling,
    About: labels.about,
    Contact: labels.contact,
  };

  return lookup[label] ?? label;
}

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { lang } = useLanguage();
  const labels = navLabels[lang];
  const copy = localizedFooterCopy[lang] ?? localizedFooterCopy.en;
  const footerSocials = [
    { label: "LinkedIn", icon: "ri-linkedin-fill", href: "#" },
    { label: "X", icon: "ri-twitter-x-fill", href: "#" },
    { label: "Facebook", icon: "ri-facebook-fill", href: "#" },
    { label: "YouTube", icon: "ri-youtube-fill", href: "#" },
    { label: "Instagram", icon: "ri-instagram-line", href: "#" },
    { label: "Email", icon: "ri-mail-line", href: `mailto:${brand.email}` },
  ] as const;

  return (
    <footer className="relative mt-auto overflow-hidden bg-primary-500 text-white">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-28 bg-primary-600/30" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_0.9fr_1fr]">
          <div>
            <Link href="/" className="group flex items-center gap-3">
              <Image
                src="/lux-logo.png"
                alt={brand.name}
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 object-contain"
              />

              <span>
                <span className="block text-lg font-bold text-accent-500 transition-colors duration-200 group-hover:text-accent-400">
                  {brand.name}
                </span>
              </span>
            </Link>

            <p className="mt-5 max-w-xl text-sm leading-7 text-blue-100">
              {copy.description}
            </p>

            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.22em] text-blue-200">
              {copy.trustLine}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-5">
              {footerSocials.map((item) => {
                if (item.href === "#") {
                  return (
                    <span
                      key={item.label}
                      aria-label={`${item.label} link coming soon`}
                      title={`${item.label} link coming soon`}
                      className="inline-flex h-6 w-6 cursor-not-allowed items-center justify-center text-blue-200/45"
                    >
                      <i className={`${item.icon} text-xl`} />
                    </span>
                  );
                }

                return (
                  <a
                    key={item.label}
                    href={item.href}
                    aria-label={item.label}
                    className="inline-flex h-6 w-6 items-center justify-center text-blue-200 transition-colors duration-200 hover:text-accent-500"
                  >
                    <i className={`${item.icon} text-xl`} />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">
              {labels.quickLinks}
            </h3>

            <ul className="mt-5 space-y-3 text-sm text-blue-200">
              {footerLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="transition-colors duration-200 hover:text-accent-500"
                  >
                    {localizedFooterLabel(item.label, lang)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">
              {copy.contactTitle}
            </h3>

            <ul className="mt-5 space-y-4 text-sm text-blue-200">
              <li className="flex items-start gap-3">
                <i className="ri-map-pin-line mt-0.5 text-blue-200" />
                <span>{brand.location}</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="ri-mail-line mt-0.5 text-blue-200" />
                <a
                  href={`mailto:${brand.email}`}
                  className="transition-colors duration-200 hover:text-accent-500"
                >
                  {brand.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <i className="ri-phone-line mt-0.5 text-blue-200" />
                <a
                  href="tel:+352691833894"
                  className="transition-colors duration-200 hover:text-accent-500"
                >
                  {brand.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <i className="ri-file-list-3-line mt-0.5 text-blue-200" />
                <Link
                  href="/legal#business-identifiers"
                  className="transition-colors duration-200 hover:text-accent-500"
                >
                  {brand.authorization}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-blue-600 pt-6 text-sm text-blue-200 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} {brand.name}. {copy.rights}
          </p>

          <div className="flex flex-wrap gap-x-3 gap-y-2">
            <Link
              href="/legal"
              className="transition-colors duration-200 hover:text-accent-500"
            >
              {labels.legal}
            </Link>
            <span className="text-blue-300">|</span>
            <Link
              href="/privacy-policy"
              className="transition-colors duration-200 hover:text-accent-500"
            >
              {labels.privacy}
            </Link>
            <span className="text-blue-300">|</span>
            <Link
              href="/terms"
              className="transition-colors duration-200 hover:text-accent-500"
            >
              {labels.terms}
            </Link>
            <span className="text-blue-300">|</span>
            <Link
              href="/cookies"
              className="transition-colors duration-200 hover:text-accent-500"
            >
              {labels.cookies}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
