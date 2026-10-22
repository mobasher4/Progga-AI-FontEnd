"use client";

import { SWRConfig } from "swr";
import { fetcher } from "@/lib/api";
import { CelebrationProvider } from "./celebrate/CelebrationProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: false, shouldRetryOnError: false }}>
      <CelebrationProvider>{children}</CelebrationProvider>
    </SWRConfig>
  );
}
