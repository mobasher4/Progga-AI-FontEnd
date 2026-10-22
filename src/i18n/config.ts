// Shared by server (root layout) and client code — keep this file free of "use client".
import type { Language } from "@/lib/types";

export const LANG_COOKIE = "progga_lang";
export const LANGS: Language[] = ["en", "bn", "mix"];
export const isLanguage = (v: unknown): v is Language => typeof v === "string" && (LANGS as string[]).includes(v);
