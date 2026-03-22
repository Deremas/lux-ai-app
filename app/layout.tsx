import type { Metadata } from "next";
import "./globals.css";
import "react-international-phone/style.css";

import LenisProvider from "@/components/LenisProvider";
import ScrollToTop from "@/components/ScrollToTop";
import ChatWidget from "@/components/ChatWidget";
import CookieConsent from "@/components/CookieConsent";
import { Toaster } from "@/components/ui/sonner";

import Providers from "./providers";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  metadataBase: new URL("https://luxaiautomation.com"),
  title: {
    default: "Lux AI Consultancy & Automation | AI Automation Systems & Consulting for SMEs",
    template: "%s | Lux AI Consultancy & Automation",
  },
  description:
    "Lux AI Consultancy & Automation provides AI automation systems and consulting for SMEs that want faster operations, better customer communication, and cleaner business workflows.",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "64x64" }],
    shortcut: ["/icon.png"],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const initialLang = cookies().get("lang")?.value; // ✅ your LANG_COOKIE is "lang"
  const htmlLang =
    initialLang === "en" ||
    initialLang === "fr" ||
    initialLang === "de" ||
    initialLang === "lb"
      ? initialLang
      : "en";

  return (
    <html
      lang={htmlLang}
      suppressHydrationWarning
      className="scrollbar-gutter-stable"
    >
      <head>
        {/* Apply theme + lang before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  try {
    // theme
    var mTheme = document.cookie.match(/(?:^|; )theme=([^;]*)/);
    var theme = mTheme ? decodeURIComponent(mTheme[1]) : null;
    if (!theme) {
      try {
        theme = localStorage.getItem("theme");
      } catch (e) {}
    }
    var prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    var resolved =
      theme === "dark" ? "dark" : theme === "light" ? "light" : prefersDark ? "dark" : "light";
    document.documentElement.classList.toggle("dark", resolved === "dark");

    // lang
    var mLang = document.cookie.match(/(?:^|; )lang=([^;]*)/);
    var lang = mLang ? decodeURIComponent(mLang[1]) : null;
    if (lang === "en" || lang === "fr" || lang === "de" || lang === "lb") {
      document.documentElement.setAttribute("lang", lang);
    }
  } catch (e) {}
})();
            `,
          }}
        />

        {/* your scrollbar fix script (keep as-is) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  try {
    var html = document.documentElement;
    var body = document.body;

    function scrollbarWidth() {
      return window.innerWidth - html.clientWidth;
    }

    function applyFix() {
      var computed = window.getComputedStyle(body);
      var overflowHidden =
        body.style.overflow === "hidden" ||
        computed.overflowY === "hidden" ||
        body.classList.contains("overflow-hidden");

      if (overflowHidden) {
        var w = scrollbarWidth();
        if (w > 0) body.style.paddingRight = w + "px";
      } else {
        body.style.paddingRight = "";
      }
    }

    applyFix();
    window.addEventListener("resize", applyFix);

    var obs = new MutationObserver(applyFix);
    obs.observe(body, { attributes: true, attributeFilter: ["style", "class"] });

    var obs2 = new MutationObserver(applyFix);
    obs2.observe(html, { attributes: true, attributeFilter: ["style", "class"] });
  } catch (e) {}
})();
            `,
          }}
        />
      </head>

      <body
        className="
          antialiased font-sans
          bg-white dark:bg-slate-900
          text-gray-900 dark:text-gray-100
          transition-colors duration-300
        "
      >
        <LenisProvider>
          <Providers initialLang={initialLang}>
            {children}
            <CookieConsent />
            <Toaster position="top-right" offset={80} />
          </Providers>
        </LenisProvider>

        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col gap-3">
          <ScrollToTop />
          <ChatWidget />
        </div>
      </body>
    </html>
  );
}

// import type { Metadata } from "next";
// import "./globals.css";
// import "react-international-phone/style.css";
// import LenisProvider from "@/components/LenisProvider";
// import ScrollToTop from "@/components/ScrollToTop";
// import ChatWidget from "@/components/ChatWidget";
// import Providers from "./providers";
// import CookieConsent from "@/components/CookieConsent";

// export const metadata: Metadata = {
//   metadataBase: new URL("https://luxaiautomation.com"), // change domain
//   title: {
//     default: "Lux AI Consultancy & Automation – AI Workflow & Automation",
//     template: "%s | Lux AI Consultancy & Automation",
//   },
//   description:
//     "Lux AI Consultancy & Automation builds AI-powered workflow automation, ERP systems, system integrations, and intelligent chatbots for modern businesses.",
//   keywords: [
//     "Lux AI Consultancy & Automation",
//     "Lux AI Automation",
//     "LuxAI Automation",
//     "AI automation",
//     "AI strategy",
//     "AI Consultancy",
//     "workflow automation",
//     "business process automation",
//     "AI integration",
//     "ERP development",
//     "ERP system",
//     "Custom websites",
//     "ERP systems",
//     "custom ERP software",
//     "system integration",
//     "CRM integration",
//     "API automation",
//     "API integration",
//     "AI API integration",
//     "business automation software",
//     "AI chatbot",
//     "multilingual chatbot",
//     "RAG chatbot",
//     "admin dashboard",
//     "role based access control",
//     "inventory management system",
//     "stock management software",
//     "ecommerce automation",
//   ],
//   authors: [{ name: "Lux AI Consultancy & Automation" }],
//   creator: "Lux AI Consultancy & Automation",
//   publisher: "Lux AI Consultancy & Automation",
//   robots: {
//     index: true,
//     follow: true,
//   },
//   openGraph: {
//     title:
//       "Lux AI Consultancy & Automation – AI Automation & Systems integration",
//     description:
//       "AI automation, systems integration, ERP systems, workflow orchestration, and intelligent chatbots built for scalable businesses.",
//     url: "https://luxaiautomation.com",
//     siteName: "Lux AI Automation",
//     locale: "en_US",
//     type: "website",
//   },
//   twitter: {
//     card: "summary_large_image",
//     title: "Lux AI Consultancy & Automation",
//     description:
//       "AI-powered automation, systems integration, ERP systems, system integrations, and chatbots.",
//   },
// };

// export default function RootLayout({
//   children,
// }: Readonly<{ children: React.ReactNode }>) {
//   return (
//     <html
//       lang="en"
//       suppressHydrationWarning
//       className="scrollbar-gutter-stable"
//     >
//       <head>
//         <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

//         {/* Apply theme + lang before first paint */}
//         <script
//           dangerouslySetInnerHTML={{
//             __html: `
// (function () {
//   try {
//     // theme
//     var mTheme = document.cookie.match(/(?:^|; )theme=([^;]*)/);
//     var theme = mTheme ? decodeURIComponent(mTheme[1]) : null;
//     if (theme === "dark") document.documentElement.classList.add("dark");
//     if (theme === "light") document.documentElement.classList.remove("dark");

//     // lang
//     var mLang = document.cookie.match(/(?:^|; )lang=([^;]*)/);
//     var lang = mLang ? decodeURIComponent(mLang[1]) : null;
//     if (lang === "en" || lang === "fr" || lang === "de" || lang === "lb") {
//       document.documentElement.setAttribute("lang", lang);
//     }
//   } catch (e) {}
// })();
//         `,
//           }}
//         />

//         <script
//           dangerouslySetInnerHTML={{
//             __html: `
// (function () {
//   try {
//     var html = document.documentElement;
//     var body = document.body;

//     function scrollbarWidth() {
//       return window.innerWidth - html.clientWidth;
//     }

//     function applyFix() {
//       var computed = window.getComputedStyle(body);
//       var overflowHidden =
//         body.style.overflow === "hidden" ||
//         computed.overflowY === "hidden" ||
//         body.classList.contains("overflow-hidden");

//       if (overflowHidden) {
//         var w = scrollbarWidth();
//         if (w > 0) body.style.paddingRight = w + "px";
//       } else {
//         body.style.paddingRight = "";
//       }
//     }

//     // run now + on resize
//     applyFix();
//     window.addEventListener("resize", applyFix);

//     // watch body style + class changes (Radix/Lenis/libs)
//     var obs = new MutationObserver(applyFix);
//     obs.observe(body, { attributes: true, attributeFilter: ["style", "class"] });

//     // optional: watch html too (some libs set overflow on html)
//     var obs2 = new MutationObserver(applyFix);
//     obs2.observe(html, { attributes: true, attributeFilter: ["style", "class"] });
//   } catch (e) {}
// })();
// `,
//           }}
//         />
//       </head>

//       <body
//         className="
//           antialiased font-sans
//           bg-white dark:bg-slate-900
//           text-gray-900 dark:text-gray-100
//           transition-colors duration-300
//         "
//       >
//         <LenisProvider>
//           <Providers>
//             {children}

//             <CookieConsent />
//           </Providers>
//         </LenisProvider>

//         {/* ✅ outside Lenis so it's truly fixed */}
//         <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col gap-3">
//           <ScrollToTop />
//           <ChatWidget />
//         </div>
//       </body>
//     </html>
//   );
// }
