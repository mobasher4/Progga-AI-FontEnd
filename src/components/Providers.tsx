"use client";

import { SWRConfig, type SWRConfiguration } from "swr";
import { LanguageProvider } from "@/i18n";
import { ApiError, fetcher } from "@/lib/api";
import type { Language } from "@/lib/types";
import { CelebrationProvider } from "./celebrate/CelebrationProvider";

const MAX_RETRIES = 3;

/**
 * Retry loads that fail for passing reasons (no connection, a server or cold-start
 * hiccup) after 1s, 2s and 4s. A 4xx (not signed in, not found…) won't fix itself.
 */
const onErrorRetry: SWRConfiguration["onErrorRetry"] = (error, _key, _config, revalidate, { retryCount }) => {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return;
  if (retryCount > MAX_RETRIES) return;
  setTimeout(() => void revalidate({ retryCount }), 1000 * 2 ** (retryCount - 1));
};

export function Providers({ children, initialLang }: { children: React.ReactNode; initialLang: Language }) {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: false, onErrorRetry }}>
      <LanguageProvider initial={initialLang}>
        <CelebrationProvider>{children}</CelebrationProvider>
      </LanguageProvider>
    </SWRConfig>
  );
}
