"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LANG_STORAGE_KEY, type AppLanguage } from "@/lib/i18n";
import { getCookie, setPrefCookie, LANG_COOKIE } from "@/lib/prefsCookies";

type LangCtx = {
  lang: AppLanguage;
  setLang: (l: AppLanguage) => void;
};

const LanguageContext = createContext<LangCtx | null>(null);
const FALLBACK_LANG: AppLanguage = "en";

const isAppLanguage = (v: any): v is AppLanguage =>
  v === "en" || v === "fr" || v === "de" || v === "lb";

export function LanguageProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang?: AppLanguage | string;
}) {
  // ✅ prevent flash: hydrate with server cookie value
  const [lang, setLangState] = useState<AppLanguage>(() => {
    if (isAppLanguage(initialLang)) return initialLang;
    return FALLBACK_LANG;
  });

  // ✅ keep <html lang> in sync
  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  // ✅ If server didn't give initialLang, resolve client cookie/localStorage
  useEffect(() => {
    if (isAppLanguage(initialLang)) return;

    try {
      const cookieLang = getCookie(LANG_COOKIE);
      if (isAppLanguage(cookieLang)) {
        setLangState(cookieLang);
        return;
      }

      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (isAppLanguage(saved)) {
        setLangState(saved);
        return;
      }

      setLangState(FALLBACK_LANG);
    } catch {
      setLangState(FALLBACK_LANG);
    }
  }, [initialLang]);

  const setLang = (l: AppLanguage) => {
    setLangState(l);

    try {
      localStorage.setItem(LANG_STORAGE_KEY, l);
    } catch {}

    try {
      setPrefCookie(LANG_COOKIE, l);
    } catch {}

    // (html lang sync handled by effect)
  };

  const value = useMemo(() => ({ lang, setLang }), [lang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx)
    throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}

// "use client";

// import React, {
//   createContext,
//   useContext,
//   useEffect,
//   useMemo,
//   useState,
// } from "react";
// import { DEFAULT_LANG, LANG_STORAGE_KEY, type AppLanguage } from "@/lib/i18n";
// import { getCookie, setPrefCookie, LANG_COOKIE } from "@/lib/prefsCookies";

// type LangCtx = {
//   lang: AppLanguage;
//   setLang: (l: AppLanguage) => void;
// };

// const LanguageContext = createContext<LangCtx | null>(null);

// const isAppLanguage = (v: any): v is AppLanguage =>
//   v === "en" || v === "fr" || v === "de" || v === "lb";

// export function LanguageProvider({ children }: { children: React.ReactNode }) {
//   const [lang, setLangState] = useState<AppLanguage>(DEFAULT_LANG);

//   useEffect(() => {
//     try {
//       // 1) cookie first
//       const cookieLang = getCookie(LANG_COOKIE);
//       if (isAppLanguage(cookieLang)) {
//         setLangState(cookieLang);
//         document.documentElement.setAttribute("lang", cookieLang); // ✅ apply immediately
//         return;
//       }

//       // 2) fallback to localStorage
//       const saved = localStorage.getItem(LANG_STORAGE_KEY);
//       if (isAppLanguage(saved)) {
//         setLangState(saved);
//         document.documentElement.setAttribute("lang", saved); // ✅ apply immediately
//         return;
//       }

//       // 3) default
//       document.documentElement.setAttribute("lang", DEFAULT_LANG);
//     } catch {
//       document.documentElement.setAttribute("lang", DEFAULT_LANG);
//     }
//   }, []);

//   const setLang = (l: AppLanguage) => {
//     setLangState(l);

//     try {
//       localStorage.setItem(LANG_STORAGE_KEY, l);
//     } catch {}

//     try {
//       setPrefCookie(LANG_COOKIE, l); // ✅ persist as cookie
//     } catch {}

//     document.documentElement.setAttribute("lang", l);
//   };

//   const value = useMemo(() => ({ lang, setLang }), [lang]);

//   return (
//     <LanguageContext.Provider value={value}>
//       {children}
//     </LanguageContext.Provider>
//   );
// }

// export function useLanguage() {
//   const ctx = useContext(LanguageContext);
//   if (!ctx)
//     throw new Error("useLanguage must be used inside <LanguageProvider>");
//   return ctx;
// }
