"use client";

import React from "react";
import { getThemePref, setThemePref, type ThemePref } from "@/lib/prefsCookies";

type ThemeCtx = {
  theme: ThemePref;
  resolvedTheme: "light" | "dark";
  setTheme: (t: ThemePref) => void;
  toggleTheme: () => void;
};

const ThemeContext = React.createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<ThemePref>("system");
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(
    "light"
  );
  const prefRef = React.useRef<ThemePref>("system");

  const getSystemTheme = () =>
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

  const applyTheme = (pref: ThemePref) => {
    const next = pref === "system" ? getSystemTheme() : pref;
    document.documentElement.classList.toggle("dark", next === "dark");
    setResolvedTheme(next);
    return next;
  };

  // Initialize from cookie/localStorage/system
  React.useEffect(() => {
    const saved = getThemePref() ?? "system";
    prefRef.current = saved;
    setThemeState(saved);
    applyTheme(saved);

    if (window.matchMedia) {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => {
        if (prefRef.current === "system") applyTheme("system");
      };
      if (media.addEventListener) {
        media.addEventListener("change", onChange);
      } else {
        // Safari
        media.addListener(onChange);
      }
      return () => {
        if (media.removeEventListener) {
          media.removeEventListener("change", onChange);
        } else {
          media.removeListener(onChange);
        }
      };
    }
  }, []);

  const setTheme = (t: ThemePref) => {
    setThemeState(t);
    prefRef.current = t;
    applyTheme(t);
    setThemePref(t);
  };

  const toggleTheme = () =>
    setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, setTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
