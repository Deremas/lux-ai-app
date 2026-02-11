"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/site-copy";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { lang } = useLanguage();

  return (
    <footer className="bg-primary-500 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-7">
        <div
          className="
    grid grid-cols-1 gap-10
    md:grid-cols-3 md:gap-6
    lg:grid-cols-4 lg:gap-10
    md:[grid-template-columns:1.6fr_0.7fr_1.2fr]
    lg:[grid-template-columns:repeat(4,minmax(0,1fr))]
  "
        >
          {/* Brand + Description */}
          <div className="col-span-1 lg:col-span-2 min-w-0">
            <Link href="/" className="flex items-center space-x-3 mb-4 group">
              <span className="flex items-center justify-center h-10 w-10 rounded-lg border-2 border-primary-500 bg-primary-100 dark:bg-slate-800 dark:border-accent-500 font-bold text-primary-600 dark:text-accent-400 text-lg transition-all duration-200 group-hover:bg-primary-200 group-hover:dark:bg-slate-700">
                {t(lang, "common.footer.brandShort")}
              </span>

              <span className="text-xl font-bold text-accent-500 transition-colors duration-200">
                {t(lang, "common.footer.brandName")}
              </span>
            </Link>

            <p className="text-blue-200 max-w-md leading-relaxed">
              {t(lang, "common.footer.description")}
            </p>

            {/* Social CTA title */}
            <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-blue-300">
              {t(lang, "common.footer.socialTitle")}
            </p>

            <div className="flex space-x-4 mt-3">
              <a
                href="#"
                aria-label="LinkedIn"
                className="text-blue-200 hover:text-accent-500 transition-colors duration-200"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className="ri-linkedin-fill" />
                </div>
              </a>

              <a
                href="#"
                aria-label="Twitter"
                className="text-blue-200 hover:text-accent-500 transition-colors duration-200"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className="ri-twitter-fill" />
                </div>
              </a>

              <a
                href="#"
                aria-label="Facebook"
                className="text-blue-200 hover:text-accent-500 transition-colors duration-200"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className="ri-facebook-fill" />
                </div>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="min-w-0">
            <h3 className="text-lg font-semibold mb-4">
              {t(lang, "common.footer.quickLinks")}
            </h3>

            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-blue-200 hover:text-accent-500 transition-colors duration-200"
                >
                  {t(lang, "common.footer.aboutUs")}
                </Link>
              </li>

              <li>
                <Link
                  href="/services"
                  className="text-blue-200 hover:text-accent-500 transition-colors duration-200"
                >
                  {t(lang, "common.footer.services")}
                </Link>
              </li>

              {/* <li>
                <Link
                  href="/use-cases"
                  className="text-blue-200 hover:text-accent-500 transition-colors duration-200"
                >
                  {t(lang, "common.footer.useCases")}
                </Link>
              </li> */}

              <li>
                <Link
                  href="/how-it-works"
                  className="text-blue-200 hover:text-accent-500 transition-colors duration-200"
                >
                  {t(lang, "common.footer.howItWorks")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="min-w-0">
            <h3 className="text-lg font-semibold mb-4">
              {t(lang, "common.footer.contactInfo")}
            </h3>

            <ul className="space-y-3 text-blue-200">
              {/* Email */}
              <li className="flex items-start gap-2 min-w-0">
                <div className="w-4 h-4 mt-0.5 flex items-center justify-center">
                  <i className="ri-mail-line" />
                </div>
                <a
                  href={`mailto:${t(lang, "common.footer.email")}`}
                  className="hover:text-accent-500 transition-colors duration-200 break-all min-w-0"
                >
                  {t(lang, "common.footer.email")}
                </a>
              </li>

              {/* Phone */}
              <li className="flex items-start space-x-2">
                <div className="w-4 h-4 mt-0.5 flex items-center justify-center">
                  <i className="ri-phone-line" />
                </div>
                <a
                  href={`tel:${t(lang, "common.footer.phoneRaw")}`}
                  className="hover:text-accent-500 transition-colors duration-200"
                >
                  {t(lang, "common.footer.phone")}
                </a>
              </li>

              {/* Location (not clickable) */}
              <li className="flex items-start space-x-2">
                <div className="w-4 h-4 mt-0.5 flex items-center justify-center">
                  <i className="ri-map-pin-line" />
                </div>
                <span>{t(lang, "common.footer.location")}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-600 mt-10 pt-6">
          <div
            className="
      flex flex-col-reverse sm:flex-row
      sm:items-center sm:justify-between
      gap-4 md:pr-[7rem]
      lg:pr-[6rem] sm:pr-0
    "
          >
            <p className="text-blue-200 text-sm text-center sm:text-left break-words">
              © {currentYear} {t(lang, "common.footer.brandName")}.{" "}
              {t(lang, "common.footer.rights")}
            </p>

            <div className="flex flex-wrap justify-center sm:justify-end gap-x-2 gap-y-2">
              <Link
                href="/privacy-policy"
                className="text-blue-200 hover:text-accent-500 transition-colors duration-200 text-sm"
              >
                {t(lang, "common.footer.privacy")}
              </Link>
              <span>|</span>
              <Link
                href="/terms"
                className="text-blue-200 hover:text-accent-500 transition-colors duration-200 text-sm"
              >
                {t(lang, "common.footer.terms")}
              </Link>
              <span >|</span>
              <Link
                href="/cookies"
                className="text-blue-200 hover:text-accent-500 transition-colors duration-200 text-sm"
              >
                {t(lang, "common.footer.cookies")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
