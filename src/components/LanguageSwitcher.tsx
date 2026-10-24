"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Languages } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useT, type TKey } from "@/i18n";
import type { Language } from "@/lib/types";
import { useCelebrate } from "./celebrate/CelebrationProvider";

// Script badges instead of flag emoji (Windows renders flags as plain "GB"/"BD" letters).
const OPTIONS: { id: Language; label: TKey; short: TKey; hint: TKey; badge: string; tint: string }[] = [
  { id: "en", label: "lang.en", short: "lang.shortEn", hint: "lang.enHint", badge: "A", tint: "bg-sky-100 text-sky-600" },
  { id: "bn", label: "lang.bn", short: "lang.shortBn", hint: "lang.bnHint", badge: "অ", tint: "bg-mint-100 text-mint-700" },
];

/** Top-bar language picker. Changes the interface AND the language Progga's AI replies in. */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useT();
  const { toast } = useCelebrate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = OPTIONS.find((o) => o.id === lang) ?? OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function choose(id: Language) {
    setOpen(false);
    if (id === lang) return;
    const chosen = OPTIONS.find((o) => o.id === id)!;
    await setLang(id);
    // language names read the same in every dictionary, so this is correct before the re-render
    toast(t(chosen.label), "🌐", "brand");
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "flex items-center gap-1.5 rounded-2xl border-2 border-line bg-white font-display font-extrabold text-ink transition-colors hover:border-brand-200 hover:bg-brand-50",
          compact ? "h-11 px-2.5" : "px-3 py-2",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("lang.label")}
      >
        <Languages size={17} className="text-brand-500" />
        <span className="text-sm">{t(current.short)}</span>
        <ChevronDown size={15} className={clsx("text-ink-muted transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-3xl border border-line bg-white p-1.5 shadow-lift"
          >
            <li className="px-3 pb-1 pt-2 text-[11px] font-extrabold uppercase tracking-wider text-ink-muted">{t("lang.label")}</li>
            {OPTIONS.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.id === lang}
                  onClick={() => choose(o.id)}
                  className={clsx("flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors", o.id === lang ? "bg-brand-50" : "hover:bg-cream")}
                >
                  <span className={clsx("grid h-9 w-9 shrink-0 place-items-center rounded-xl font-display text-base font-extrabold", o.tint)}>{o.badge}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display font-extrabold leading-tight">{t(o.label)}</span>
                    <span className="block text-xs text-ink-muted">{t(o.hint)}</span>
                  </span>
                  {o.id === lang && <Check size={17} className="shrink-0 text-brand-600" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
