"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import { api } from "@/lib/api";
import type { Language, User } from "@/lib/types";
import { bn } from "./bn";
import { LANG_COOKIE, isLanguage } from "./config";
import { en, type Dict } from "./en";

// ── Typed keys ───────────────────────────────────────────

type Path<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Path<T[K], `${P}${K}.`>;
}[keyof T & string];

export type TKey = Path<Dict>;
type Vars = Record<string, string | number>;

export { LANG_COOKIE, LANGS, isLanguage } from "./config";

const DICTS: Record<"en" | "bn", Dict> = { en, bn };
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** 123 → ১২৩ (used for numbers shown in Bangla UI). */
export const toBnDigits = (s: string) => s.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);

function lookup(dict: Dict, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split(".")) {
    if (node && typeof node === "object" && part in node) node = (node as Record<string, unknown>)[part];
    else return undefined;
  }
  return typeof node === "string" ? node : undefined;
}

interface Ctx {
  /** Chosen language: also what Progga's AI replies in. */
  lang: Language;
  /** Interface language (same as lang). */
  ui: "en" | "bn";
  setLang: (l: Language) => Promise<void>;
  t: (key: TKey, vars?: Vars) => string;
  /** For keys built at runtime (badge ids, level titles…), with a fallback. */
  tx: (key: string, fallback: string, vars?: Vars) => string;
  /** Formats a number for the current interface language. */
  n: (value: number | string) => string;
}

const LanguageCtx = createContext<Ctx | null>(null);

export function LanguageProvider({ initial, children }: { initial: Language; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(initial);
  const { cache, mutate } = useSWRConfig();
  const ui: "en" | "bn" = lang === "bn" ? "bn" : "en";

  useEffect(() => {
    document.documentElement.lang = ui;
  }, [ui]);

  const n = useCallback((value: number | string) => (ui === "bn" ? toBnDigits(String(value)) : String(value)), [ui]);

  const format = useCallback(
    (template: string, vars?: Vars) =>
      vars ? template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? (typeof vars[k] === "number" ? n(vars[k]) : String(vars[k])) : `{${k}}`)) : template,
    [n],
  );

  const tx = useCallback(
    (key: string, fallback: string, vars?: Vars) => format(lookup(DICTS[ui], key) ?? lookup(en, key) ?? fallback, vars),
    [ui, format],
  );
  const t = useCallback((key: TKey, vars?: Vars) => tx(key, key, vars), [tx]);

  const setLang = useCallback(
    async (next: Language) => {
      setLangState(next);
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      // Signed in? Save it to the account so Progga's AI replies in this language too.
      const me = cache.get("/auth/me")?.data as { user?: User } | undefined;
      if (me?.user && me.user.language !== next) {
        await mutate("/auth/me", { user: { ...me.user, language: next } }, { revalidate: false });
        try {
          await api("/me", { method: "PATCH", body: { language: next } });
        } finally {
          void mutate("/auth/me");
        }
      }
    },
    [cache, mutate],
  );

  const value = useMemo(() => ({ lang, ui, setLang, t, tx, n }), [lang, ui, setLang, t, tx, n]);
  return <LanguageCtx.Provider value={value}>{children}</LanguageCtx.Provider>;
}

export function useT() {
  const ctx = useContext(LanguageCtx);
  if (!ctx) throw new Error("useT must be used inside LanguageProvider");
  return ctx;
}

/** The language this browser explicitly picked (cookie), or null if it never chose one. */
export function explicitLanguage(): Language | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=([^;]+)`));
  return match && isLanguage(match[1]) ? match[1] : null;
}

/**
 * Keeps the interface in the signed-in user's saved language (e.g. on a new
 * device). The account is the source of truth once someone is logged in.
 */
export function useSyncAccountLanguage(user: User | undefined) {
  const { lang, setLang } = useT();
  useEffect(() => {
    if (user && isLanguage(user.language) && user.language !== lang) void setLang(user.language);
    // only react to the account's language changing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.language]);
}

/** Shared date/number helpers that follow the interface language. */
export function useFormat() {
  const { t, n, ui } = useT();
  return {
    gradeLabel: (grade: number | null | undefined) =>
      !grade ? "" : grade >= 11 ? t("common.classHSC", { n: grade }) : grade >= 9 ? t("common.classSSC", { n: grade }) : t("common.classN", { n: grade }),
    timeAgo: (iso: string) => {
      const diff = (Date.now() - new Date(iso).getTime()) / 1000;
      if (diff < 60) return t("time.justNow");
      if (diff < 3600) return t("time.minutes", { n: Math.floor(diff / 60) });
      if (diff < 86400) return t("time.hours", { n: Math.floor(diff / 3600) });
      if (diff < 86400 * 7) return t("time.days", { n: Math.floor(diff / 86400) });
      return new Date(iso).toLocaleDateString(ui === "bn" ? "bn-BD" : "en-GB");
    },
    date: (iso: string) => new Date(iso).toLocaleDateString(ui === "bn" ? "bn-BD" : "en-GB"),
    weekday: (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString(ui === "bn" ? "bn-BD" : "en-GB", { weekday: "short" }),
    greeting: () => {
      const h = new Date().getHours();
      return t(h < 12 ? "greeting.morning" : h < 17 ? "greeting.afternoon" : "greeting.evening");
    },
    duration: (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = Math.round(sec % 60);
      return n(`${m}:${String(s).padStart(2, "0")}`);
    },
  };
}
