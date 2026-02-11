"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import type { AppLanguage } from "@/lib/i18n";

export default function Providers({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang?: AppLanguage | string;
}) {
  return (
    <SessionProvider>
      <LanguageProvider initialLang={initialLang}>
        <ThemeProvider>{children}</ThemeProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}

// "use client";

// import React from "react";
// import { ThemeProvider } from "@/components/ThemeProvider";
// import { LanguageProvider } from "@/components/LanguageProvider";

// export default function Providers({ children }: { children: React.ReactNode }) {
//   return (
//     <LanguageProvider>
//       <ThemeProvider>{children}</ThemeProvider>
//     </LanguageProvider>
//   );
// }
