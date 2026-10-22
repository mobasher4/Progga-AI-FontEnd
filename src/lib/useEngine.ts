"use client";

import useSWR from "swr";

interface Health {
  llm: { provider: string; model: string; vision: boolean };
}

/** Which AI engine the backend runs, and what it can do (e.g. read homework photos). */
export function useEngine() {
  const { data } = useSWR<Health>("/health", { revalidateOnFocus: false, dedupingInterval: 60_000 });
  return { provider: data?.llm.provider, model: data?.llm.model, vision: data?.llm.vision ?? false, loaded: !!data };
}
