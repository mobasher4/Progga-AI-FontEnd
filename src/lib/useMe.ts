"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";
import { api, ApiError } from "./api";
import type { User } from "./types";

export function useMe() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<{ user: User }>("/auth/me");

  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) router.replace("/login");
  }, [error, router]);

  return { user: data?.user, isLoading, error, mutate };
}

export function useLogout() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  return async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => undefined);
    // drop every cached response so the next user starts clean
    await mutate(() => true, undefined, { revalidate: false });
    router.replace("/login");
    router.refresh();
  };
}

/**
 * Parent ⇄ kid profile switching on one device. `to(kidId)` opens a kid's
 * profile; `back()` returns to the parent who opened it.
 */
export function useSwitchProfile() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const go = async (path: string, dest: string) => {
    await api(path, { method: "POST" });
    // everything cached belongs to the previous profile
    await mutate(() => true, undefined, { revalidate: false });
    router.replace(dest);
  };
  return {
    to: (kidId: string) => go(`/guardian/students/${kidId}/switch`, "/home"),
    back: () => go("/auth/switch-back", "/guardian"),
  };
}
