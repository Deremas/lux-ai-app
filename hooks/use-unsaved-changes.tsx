import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const DEFAULT_MESSAGE = "You have unsaved changes. Save before leaving?";

export function useUnsavedChangesPrompt(
  isDirty: boolean,
  message: string = DEFAULT_MESSAGE
) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUrl = `${pathname}${searchParams?.toString() ? `?${searchParams}` : ""}`;
  const currentUrlRef = useRef(currentUrl);

  useEffect(() => {
    currentUrlRef.current = currentUrl;
  }, [currentUrl]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, message]);

  useEffect(() => {
    if (!isDirty) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      if (link.hasAttribute("data-skip-unsaved")) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (link.target && link.target !== "_self") return;
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const next = `${url.pathname}${url.search}${url.hash}`;
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (next === current) return;
      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isDirty, message]);

  useEffect(() => {
    if (!isDirty) return;
    const handlePopState = () => {
      const ok = window.confirm(message);
      if (!ok) {
        history.pushState(null, "", currentUrlRef.current);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDirty, message]);
}
