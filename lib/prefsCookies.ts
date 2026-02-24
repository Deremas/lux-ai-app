import { cookieDomain, cookieSecure } from "@/lib/cookieConfig";

export type ThemePref = "light" | "dark" | "system";
export type LangPref = "en" | "fr" | "de" | "lb";

export const THEME_COOKIE = "theme";
export const LANG_COOKIE = "lang";

export function getCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function setPrefCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();

  const parts: string[] = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `Expires=${expires}`,
    "Path=/",
    "SameSite=Lax",
  ];

  const d = cookieDomain();
  if (d) parts.push(`Domain=${d}`);
  if (cookieSecure()) parts.push("Secure");

  document.cookie = parts.join("; ");
}

// ✅ add these (Theme)
export function getThemePref(): ThemePref | null {
  const v = getCookie(THEME_COOKIE);
  if (v === "light" || v === "dark" || v === "system") return v;
  try {
    const ls = window.localStorage.getItem(THEME_COOKIE);
    return ls === "light" || ls === "dark" || ls === "system" ? ls : null;
  } catch {
    return null;
  }
}

export function setThemePref(v: ThemePref) {
  setPrefCookie(THEME_COOKIE, v);
  try {
    window.localStorage.setItem(THEME_COOKIE, v);
  } catch {
    // ignore storage failures
  }
}

// ✅ add these (Language)
export function getLangPref(): LangPref | null {
  const v = getCookie(LANG_COOKIE);
  return v === "en" || v === "fr" || v === "de" || v === "lb" ? v : null;
}

export function setLangPref(v: LangPref) {
  setPrefCookie(LANG_COOKIE, v);
}
