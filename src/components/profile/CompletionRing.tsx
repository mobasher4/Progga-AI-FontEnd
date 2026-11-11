"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useT } from "@/i18n";

/** Coral → banana → blue → mint as the profile fills up. */
export const completionColor = (percent: number) =>
  percent >= 100 ? "var(--color-mint-500)" : percent >= 70 ? "var(--color-brand-500)" : percent >= 40 ? "var(--color-banana-500)" : "var(--color-coral-500)";

export function CompletionRing({ percent, size = 88, stroke = 9, label }: { percent: number; size?: number; stroke?: number; label?: string }) {
  const { n } = useT();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const done = percent >= 100;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${percent}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(percent, 100) / 100), stroke: completionColor(percent) }}
          transition={{ type: "spring", stiffness: 60, damping: 16 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {done ? (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }} className="grid h-1/2 w-1/2 place-items-center rounded-full bg-mint-500 text-white">
            <Check size={size * 0.28} strokeWidth={3.5} />
          </motion.span>
        ) : (
          <span className="leading-none">
            <span className="font-display font-extrabold" style={{ fontSize: size * 0.24 }}>
              {n(percent)}
              <span style={{ fontSize: size * 0.14 }}>%</span>
            </span>
            {label && <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-ink-muted">{label}</span>}
          </span>
        )}
      </div>
    </div>
  );
}
