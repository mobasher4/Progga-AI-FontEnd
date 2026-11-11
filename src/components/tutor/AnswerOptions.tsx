"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { Check, MousePointerClick } from "lucide-react";
import { useT } from "@/i18n";

/**
 * The current step's answer choices, shown just above the answer box. They glow
 * softly so students notice them; tapping one sends it as the answer straight away.
 */
export function AnswerOptions({
  options,
  selected,
  onPick,
  disabled,
  stepKey,
}: {
  options: string[];
  /** the option currently sitting in the answer box, if any */
  selected?: string;
  onPick: (option: string) => void;
  disabled?: boolean;
  /** changes per step so the cards animate in fresh */
  stepKey: number;
}) {
  const { t } = useT();
  if (options.length === 0) return null;
  const letters = t("session.optionLetters").split(",");

  return (
    <div className="w-full" role="group" aria-label={t("session.optionsLabel")}>
      <p className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-extrabold text-brand-600">
        <MousePointerClick size={15} className={clsx("text-brand-500", !disabled && "animate-tap")} />
        {t("session.optionsHint")}
      </p>
      <motion.div
        key={stepKey}
        className="grid grid-cols-2 gap-2"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      >
        {options.map((option, i) => {
          const on = selected === option;
          return (
            <motion.button
              key={option}
              type="button"
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
              whileHover={disabled ? undefined : { y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onPick(option)}
              disabled={disabled}
              aria-pressed={on}
              // one after another, so the glow ripples across the cards
              style={{ animationDelay: `${i * 0.3}s` }}
              className={clsx(
                "group flex min-h-12 cursor-pointer items-center gap-2.5 rounded-2xl border-2 px-2.5 py-2 text-left text-sm font-bold transition-colors disabled:cursor-default disabled:opacity-50",
                !disabled && "animate-option-glow",
                on ? "border-brand-400 bg-brand-50 text-brand-700" : "border-brand-200 bg-white text-ink hover:border-brand-400 hover:bg-brand-50",
              )}
            >
              <span
                className={clsx(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-lg font-display text-xs font-extrabold transition-colors",
                  on ? "bg-brand-500 text-white" : "bg-brand-100 text-brand-700 group-hover:bg-brand-500 group-hover:text-white",
                )}
              >
                {on ? <Check size={15} strokeWidth={3} /> : letters[i] ?? i + 1}
              </span>
              <span className="min-w-0 break-words leading-snug">{option}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
