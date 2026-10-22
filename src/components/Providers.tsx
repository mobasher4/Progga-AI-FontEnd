"use client";

import { SWRConfig } from "swr";
import { LanguageProvider } from "@/i18n";
import { fetcher } from "@/lib/api";
import type { Language } from "@/lib/types";
import { CelebrationProvider } from "./celebrate/CelebrationProvider";

export function Providers({ children, initialLang }: { children: React.ReactNode; initialLang: Language }) {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: false, shouldRetryOnError: false }}>
      <LanguageProvider initial={initialLang}>
        <CelebrationProvider>{children}</CelebrationProvider>
      </LanguageProvider>
    </SWRConfig>
  );
}
