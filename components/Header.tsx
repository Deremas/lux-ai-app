"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { useLanguage } from "@/components/LanguageProvider";
import { APP_LANGUAGES, type AppLanguage } from "@/lib/i18n";
import { getCookie, setPrefCookie, THEME_COOKIE } from "@/lib/prefsCookies";
import { brand, navLabels } from "@/lib/marketing-content";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function Header() {
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { lang, setLang } = useLanguage();

  const applyTheme = (mode: "dark" | "light", persist = true) => {
    const root = document.documentElement;
    const isDarkMode = mode === "dark";

    root.classList.toggle("dark", isDarkMode);
    setIsDark(isDarkMode);

    if (persist) setPrefCookie(THEME_COOKIE, mode);
  };

  useEffect(() => {
    const root = document.documentElement;

    const getPreferred = () => {
      const saved = getCookie(THEME_COOKIE) as "dark" | "light" | null;
      if (saved === "dark" || saved === "light") return saved;

      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      return prefersDark ? "dark" : "light";
    };

    applyTheme(getPreferred(), false);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      const saved = getCookie(THEME_COOKIE);
      if (saved !== "dark" && saved !== "light") {
        applyTheme(mq.matches ? "dark" : "light", false);
      }
    };

    const obs = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });

    mq.addEventListener?.("change", onSystemChange);

    return () => {
      mq.removeEventListener?.("change", onSystemChange);
      obs.disconnect();
    };
  }, []);

  const toggleTheme = () => {
    const domIsDark = document.documentElement.classList.contains("dark");
    applyTheme(domIsDark ? "light" : "dark", true);
  };

  const labels = navLabels[lang];

  const navigation = useMemo(
    () => [
      { name: labels.home, href: "/", match: "/" },
      { name: labels.solutions, href: "/services", match: "/services" },
      { name: labels.useCases, href: "/use-cases", match: "/use-cases" },
      {
        name: labels.howItWorks,
        href: "/how-it-works",
        match: "/how-it-works",
      },
      { name: labels.about, href: "/about", match: "/about" },
      { name: labels.scheduling, href: "/scheduling", match: "/scheduling" },
      { name: labels.contact, href: "/contact", match: "/contact" },
    ],
    [labels],
  );

  const isActive = (match: string) => (match ? pathname === match : false);

  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;

    if (isMenuOpen) {
      const scrollBarWidth = window.innerWidth - html.clientWidth;

      body.style.overflow = "hidden";
      body.style.paddingRight = scrollBarWidth > 0 ? `${scrollBarWidth}px` : "";
      body.setAttribute("data-menu-open", "true");
    } else {
      body.style.overflow = "";
      body.style.paddingRight = "";
      body.removeAttribute("data-menu-open");
    }

    return () => {
      body.style.overflow = "";
      body.style.paddingRight = "";
      body.removeAttribute("data-menu-open");
    };
  }, [isMenuOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header
        className="fixed top-0 left-0 z-[2147483000] w-full isolate border-b border-blue-100/80 bg-white/85 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/80"
        style={{
          WebkitBackdropFilter: "blur(18px)",
          backdropFilter: "blur(18px)",
        }}
      >
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6">
          <div className="flex h-[var(--site-header-height)] items-center justify-between gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <Image
                src="/lux-logo.png"
                alt={brand.name}
                width={44}
                height={44}
                priority
                className="h-11 w-11 shrink-0 rounded-full object-contain"
              />

              <span className="hidden min-w-0 md:block">
                <span className="block truncate text-sm font-bold text-slate-950 dark:text-white">
                  {brand.name}
                </span>
              </span>
            </Link>

            <nav className="hidden lg:flex flex-1 items-center justify-center">
              <div className="flex items-center gap-4 xl:gap-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`relative whitespace-nowrap text-sm font-medium transition-colors duration-200 xl:text-[0.95rem] ${
                      isActive(item.match)
                        ? "text-primary-600 dark:text-accent-400"
                        : "text-slate-700 hover:text-primary-600 dark:text-slate-200 dark:hover:text-accent-400"
                    }`}
                  >
                    {item.name}
                    {isActive(item.match) && (
                      <span className="absolute -bottom-2 left-0 h-0.5 w-full rounded-full bg-accent-500" />
                    )}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <Select
                value={lang}
                onValueChange={(value) => setLang(value as AppLanguage)}
              >
                <SelectTrigger className="h-9 w-[6.25rem] rounded-full border border-slate-200 bg-white text-sm dark:border-slate-700 dark:bg-slate-900 sm:w-[8.25rem] lg:w-[7.5rem] xl:w-[160px]">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>

                <SelectContent
                  className="z-[2147483500] max-h-56 overflow-auto border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
                  position="popper"
                  sideOffset={8}
                  align="start"
                  avoidCollisions
                  collisionPadding={12}
                >
                  {APP_LANGUAGES.map((item) => (
                    <SelectItem
                      key={item.code}
                      value={item.code}
                      className="cursor-pointer text-slate-900 focus:bg-slate-100 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900 dark:text-slate-100 dark:focus:bg-slate-800 dark:data-[highlighted]:bg-slate-800 dark:data-[highlighted]:text-slate-100"
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <button
                onClick={toggleTheme}
                className="rounded-full border border-slate-200 bg-slate-50 p-2.5 transition-colors duration-200 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                aria-label="Toggle theme"
                type="button"
              >
                <i
                  className={`ri-${
                    isDark ? "sun" : "moon"
                  }-line text-base text-slate-700 dark:text-slate-100`}
                />
              </button>

              <Link
                href="/scheduling?meetingTypeKey=free-audit"
                className="hidden items-center rounded-full bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-700 lg:inline-flex"
              >
                {labels.audit}
              </Link>

              <button
                onClick={() => setIsMenuOpen((value) => !value)}
                className={`rounded-full border border-slate-200 p-2.5 transition-all duration-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 lg:hidden ${
                  isMenuOpen ? "bg-slate-100 dark:bg-slate-800" : ""
                }`}
                aria-label="Toggle menu"
                type="button"
              >
                <i
                  className={`ri-${
                    isMenuOpen ? "close" : "menu"
                  }-line text-base text-slate-700 dark:text-slate-100`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div aria-hidden="true" className="h-[var(--site-header-height)]" />

      <div
        className={`fixed inset-0 z-[2147483647] transition-opacity duration-200 lg:hidden ${
          isMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <button
          type="button"
          aria-label="Close menu"
          className="absolute inset-0 bg-slate-950/40"
          onClick={() => setIsMenuOpen(false)}
        />

        <div className="absolute left-0 right-0 top-[var(--site-header-height)] p-3">
          <div
            onClick={(event) => event.stopPropagation()}
            className={`mx-auto w-full max-w-[calc(100vw-1.5rem)] rounded-[28px] border border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur-xl transition-transform duration-200 dark:border-slate-800 dark:bg-slate-950/95 ${
              isMenuOpen ? "translate-y-0 scale-100" : "-translate-y-2 scale-95"
            }`}
            style={{
              WebkitBackdropFilter: "blur(18px)",
              backdropFilter: "blur(18px)",
            }}
          >
            <div className="max-h-[75vh] overflow-auto">
              <nav className="flex flex-col gap-1 p-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                      isActive(item.match)
                        ? "bg-primary-50 text-primary-600 dark:bg-slate-800 dark:text-accent-400"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}

                <Link
                  href="/scheduling?meetingTypeKey=free-audit"
                  className="mt-2 inline-flex items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {labels.audit}
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
