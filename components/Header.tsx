"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLanguage } from "@/components/LanguageProvider";
import { APP_LANGUAGES, type AppLanguage } from "@/lib/i18n";
import { getCookie, setPrefCookie, THEME_COOKIE } from "@/lib/prefsCookies";

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

  // const toggleTheme = () => {
  //   const newTheme = !isDark;
  //   setIsDark(newTheme);

  //   if (newTheme) {
  //     document.documentElement.classList.add("dark");
  //     localStorage.setItem("theme", "dark");
  //   } else {
  //     document.documentElement.classList.remove("dark");
  //     localStorage.setItem("theme", "light");
  //   }
  // };

  // ✅ Single source of truth: DOM + localStorage
  // const applyTheme = (mode: "dark" | "light") => {
  //   const root = document.documentElement;
  //   const isDarkMode = mode === "dark";

  //   root.classList.toggle("dark", isDarkMode);
  //   localStorage.setItem("theme", mode);
  //   setIsDark(isDarkMode);
  // };

  // useEffect(() => {
  //   const root = document.documentElement;

  //   const getPreferred = () => {
  //     const saved = localStorage.getItem("theme") as "dark" | "light" | null;
  //     if (saved === "dark" || saved === "light") return saved;

  //     const prefersDark = window.matchMedia(
  //       "(prefers-color-scheme: dark)"
  //     ).matches;
  //     return prefersDark ? "dark" : "light";
  //   };

  //   // ✅ initialize from saved/system immediately
  //   applyTheme(getPreferred());

  //   // ✅ if system theme changes AND user didn't explicitly choose
  //   const mq = window.matchMedia("(prefers-color-scheme: dark)");
  //   const onSystemChange = () => {
  //     const saved = localStorage.getItem("theme");
  //     // only follow system if user hasn't forced a value
  //     if (saved !== "dark" && saved !== "light") {
  //       applyTheme(mq.matches ? "dark" : "light");
  //     }
  //   };

  //   // ✅ if localStorage theme changes from other tabs/components
  //   const onStorage = (e: StorageEvent) => {
  //     if (
  //       e.key === "theme" &&
  //       (e.newValue === "dark" || e.newValue === "light")
  //     ) {
  //       applyTheme(e.newValue);
  //     }
  //   };

  //   // ✅ if someone toggles class externally, keep state synced (rare but helps)
  //   const obs = new MutationObserver(() => {
  //     const domIsDark = root.classList.contains("dark");
  //     setIsDark(domIsDark);
  //   });
  //   obs.observe(root, { attributes: true, attributeFilter: ["class"] });

  //   mq.addEventListener?.("change", onSystemChange);
  //   window.addEventListener("storage", onStorage);

  //   return () => {
  //     mq.removeEventListener?.("change", onSystemChange);
  //     window.removeEventListener("storage", onStorage);
  //     obs.disconnect();
  //   };
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  // const toggleTheme = () => {
  //   // ✅ read actual DOM at click time (never stale)
  //   const domIsDark = document.documentElement.classList.contains("dark");
  //   applyTheme(domIsDark ? "light" : "dark");
  // };

  // ✅ Single source of truth: DOM + cookie (no localStorage)
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
        "(prefers-color-scheme: dark)"
      ).matches;
      return prefersDark ? "dark" : "light";
    };

    // ✅ initialize from cookie/system
    applyTheme(getPreferred(), false);

    // ✅ follow system theme ONLY if user hasn't explicitly chosen a cookie yet
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      const saved = getCookie(THEME_COOKIE);
      if (saved !== "dark" && saved !== "light") {
        applyTheme(mq.matches ? "dark" : "light", false);
      }
    };

    // ✅ if someone toggles class externally, keep state synced
    const obs = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });

    mq.addEventListener?.("change", onSystemChange);

    return () => {
      mq.removeEventListener?.("change", onSystemChange);
      obs.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = () => {
    const domIsDark = document.documentElement.classList.contains("dark");
    applyTheme(domIsDark ? "light" : "dark", true);
  };

  const T = useMemo(() => {
    const nav = {
      en: {
        home: "Home",
        about: "About",
        services: "Services",
        how: "How It Works",
        schedule: "Schedule",
        contact: "Contact",
        started: "Get Started",
      },
      fr: {
        home: "Accueil",
        about: "À propos",
        services: "Services",
        how: "Comment ça marche",
        schedule: "Planifier",
        contact: "Contact",
        started: "Démarrer",
      },
      de: {
        home: "Start",
        about: "Über uns",
        services: "Leistungen",
        how: "So funktioniert’s",
        schedule: "Termin",
        contact: "Kontakt",
        started: "Loslegen",
      },
      lb: {
        home: "Heem",
        about: "Iwwer eis",
        services: "Servicer",
        how: "Wéi et funktionéiert",
        schedule: "Rendez-vous",
        contact: "Kontakt",
        started: "Starten",
      },
    } satisfies Record<AppLanguage, any>;

    return nav[lang];
  }, [lang]);

  const navigation = useMemo(
    () => [
      { name: T.home, href: "/" },
      { name: T.about, href: "/about" },
      { name: T.services, href: "/services" },
      { name: T.how, href: "/how-it-works" },
      { name: T.schedule, href: "/scheduling" },
      { name: T.contact, href: "/contact" },
    ],
    [T]
  );

  const isActive = (href: string) => pathname === href;

  // lock scroll when menu open
  // useEffect(() => {
  //   document.body.style.overflow = isMenuOpen ? "hidden" : "";
  //   return () => {
  //     document.body.style.overflow = "";
  //   };
  // }, [isMenuOpen]);

  // lock scroll when menu open (NO layout shift)
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;

    if (isMenuOpen) {
      // scrollbar width = viewport - document width
      const scrollBarWidth = window.innerWidth - html.clientWidth;

      body.style.overflow = "hidden";
      body.style.paddingRight = scrollBarWidth > 0 ? `${scrollBarWidth}px` : "";
      body.setAttribute("data-menu-open", "true"); // (optional) for your chatbot
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
        className="
          sticky top-0 left-0 w-full z-[2147483000]
          backdrop-blur-md bg-white/70 dark:bg-slate-900/70
          border-b border-gray-200 dark:border-slate-800
          shadow-lg transition-colors duration-500
        "
        style={{
          WebkitBackdropFilter: "blur(12px)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="mx-auto w-full max-w-7xl px-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 w-full gap-2">
            <Link href="/" className="flex items-center gap-2 min-w-0">
              <span
                className="
    flex items-center justify-center h-10 w-10 rounded-full border-2
    border-primary-500 bg-primary-100 text-primary-600
    dark:bg-yellow-400/10 dark:border-accent-400 dark:text-accent-500
    font-bold text-sm tracking-wide uppercase
    transition-all duration-200 shrink-0
  "
                aria-label="Lux AI"
                title="Lux AI Consultancy & Automation"
              >
                Lux
              </span>
              <span
                className="
    hidden md:block xl:inline
    font-bold text-primary-600 dark:text-accent-600
    text-sm lg:text-base xl:text-lg
    leading-tight
    max-w-[20rem] lg:max-w-[18rem] xl:max-w-none
    whitespace-normal xl:whitespace-nowrap"
                title="Lux AI Consultancy & Automation"
              >
                Lux AI Consultancy & Automation
              </span>
            </Link>

            <nav className="hidden lg:flex flex-1 items-center justify-center min-w-0">
              <div className="flex items-center gap-4 xl:gap-6 min-w-0">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      relative font-medium whitespace-nowrap
                      text-sm xl:text-base leading-[1] py-0
                      transition-colors duration-200 hover:text-primary-500 dark:hover:text-accent-500
                      ${
                        isActive(item.href)
                          ? "text-primary-500 dark:text-accent-500"
                          : "text-gray-700 dark:text-gray-300"
                      }
                    `}
                  >
                    {item.name}
                    {isActive(item.href) && (
                      <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-accent-500 rounded-full" />
                    )}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Select
                value={lang}
                onValueChange={(v) => setLang(v as AppLanguage)}
              >
                <SelectTrigger
                  className="
                    h-9 rounded-lg border border-gray-200 dark:border-slate-700
                    bg-white dark:bg-slate-800 text-sm
                    w-[6.25rem] sm:w-[8.25rem] lg:w-[7.5rem] xl:w-[160px]
                  "
                >
                  <SelectValue placeholder="Language" />
                </SelectTrigger>

                <SelectContent
                  className="z-[2147483500] max-h-56 overflow-auto w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900
    border border-gray-200 dark:border-slate-700
    shadow-xl"
                  position="popper"
                  sideOffset={8}
                  align="start"
                  avoidCollisions
                  collisionPadding={12}
                >
                  {APP_LANGUAGES.map((l) => (
                    <SelectItem
                      key={l.code}
                      value={l.code}
                      className="
        cursor-pointer
        text-gray-900 dark:text-gray-100
        focus:bg-gray-100 dark:focus:bg-slate-800
        data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-slate-800
        data-[highlighted]:text-gray-900 dark:data-[highlighted]:text-gray-100
      "
                    >
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <button
                onClick={toggleTheme}
                className="
                  p-2 rounded-lg bg-gray-100 dark:bg-slate-800
                  hover:bg-gray-200 dark:hover:bg-slate-700
                  transition-all duration-300 shrink-0
                "
                aria-label="Toggle theme"
                type="button"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <i
                    className={`ri-${
                      isDark ? "sun" : "moon"
                    }-line text-gray-600 dark:text-gray-300`}
                  />
                </div>
              </button>

              <Link
                href="/contact"
                className="
                  hidden lg:inline-flex items-center
                  px-3 xl:px-4 py-2 text-sm xl:text-base
                  bg-primary-500 text-white rounded-lg
                  hover:bg-primary-600 transition-all duration-300 font-medium whitespace-nowrap
                "
              >
                {T.started}
              </Link>

              <button
                onClick={() => setIsMenuOpen((v) => !v)}
                className={`
                  lg:hidden p-2 rounded-lg
                  hover:bg-gray-100 dark:hover:bg-slate-800
                  transition-all duration-300 shrink-0
                  ${isMenuOpen ? "bg-gray-200 dark:bg-slate-700" : ""}
                `}
                aria-label="Toggle menu"
                type="button"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <i
                    className={`ri-${
                      isMenuOpen ? "close" : "menu"
                    }-line text-gray-600 dark:text-gray-300`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ✅ IMPORTANT: overlay is OUTSIDE header now → covers full page everywhere */}
      <div
        className={`lg:hidden fixed inset-0 z-[2147483647] transition-opacity duration-200 ${
          isMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* full-screen click catcher */}
        <button
          type="button"
          aria-label="Close menu"
          className="absolute inset-0 bg-black/30"
          onClick={() => setIsMenuOpen(false)}
        />

        <div className="absolute top-16 left-0 right-0 p-3">
          <div
            onClick={(e) => e.stopPropagation()}
            className={`
              mx-auto w-full max-w-[calc(100vw-1.5rem)]
              rounded-2xl border border-gray-200 dark:border-slate-800
              bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl
              transform transition-transform duration-200
              ${
                isMenuOpen
                  ? "translate-y-0 scale-100"
                  : "-translate-y-2 scale-95"
              }
            `}
            style={{
              WebkitBackdropFilter: "blur(12px)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="max-h-[75vh] overflow-auto py-4">
              <nav className="flex flex-col gap-2 px-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 font-medium transition-colors duration-200 hover:text-primary-500 dark:hover:text-accent-500 ${
                      isActive(item.href)
                        ? "text-primary-500 dark:text-accent-500 bg-primary-100 dark:bg-slate-800 rounded-lg"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}

                <Link
                  href="/contact"
                  className="
                    mx-1 mt-2 inline-flex items-center justify-center
                    px-4 py-2 bg-primary-500 text-white rounded-lg
                    hover:bg-primary-600 transition-colors duration-200 font-medium whitespace-nowrap
                  "
                  onClick={() => setIsMenuOpen(false)}
                >
                  {T.started}
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
