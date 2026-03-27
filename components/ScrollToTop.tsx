"use client";

import { useState, useEffect } from "react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    const lenis = (window as any).lenis;
    if (lenis) lenis.scrollTo(0, { duration: 1.2 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed right-[max(0.75rem,env(safe-area-inset-right))] bottom-[calc(max(0.875rem,env(safe-area-inset-bottom))+3.75rem)] z-40 flex h-11 w-11 items-center justify-center rounded-full bg-primary-500 p-0 text-white shadow-lg transition-all duration-300 hover:bg-primary-600 hover:shadow-xl sm:bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4rem)] sm:right-4 sm:h-12 sm:w-12 ${
        isVisible
          ? "translate-y-0 opacity-100 scale-100"
          : "translate-y-16 opacity-0 scale-0"
      } group`}
      aria-label="Scroll to top"
    >
      <div className="flex h-5 w-5 items-center justify-center">
        <i className="ri-arrow-up-line text-xl group-hover:animate-bounce-gentle"></i>
      </div>
      <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </button>
  );
}
