"use client";

import { motion, useInView, type Variants } from "framer-motion";
import { ArrowUp, Lightbulb } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ProggaMark } from "@/components/brand/Logo";
import { ProggaBot, type BotMood } from "@/components/brand/ProggaBot";
import { useT } from "@/i18n";

// Robot cycles through moods so the hero feels alive (thinking → asking → happy).
const MOODS: BotMood[] = ["asking", "thinking", "happy", "asking"];

const list: Variants = { hidden: {}, show: { transition: { delayChildren: 0.5, staggerChildren: 0.55 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 22 } },
};
const float = (delay = 0, distance = 8) => ({
  animate: { y: [0, -distance, 0] },
  transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const, delay },
});

/** Landing-page hero: an animated peek at a real Progga lesson. */
export function HeroScene() {
  const { t } = useT();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [mood, setMood] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setMood((m) => (m + 1) % MOODS.length), 2600);
    return () => clearInterval(timer);
  }, []);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[520px] pb-8 pt-[84px]">
      {/* ── Backdrop ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-10 top-10 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-brand-200/80 via-brand-100/50 to-transparent blur-2xl" />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[470px] w-[470px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-brand-200/80"
          animate={{ rotate: 360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute right-0 top-[120px] h-[72%] w-[86%] rotate-[5deg] rounded-[34px] bg-banana-200/70" />
      </div>

      {/* ── Progga, perched on the window ── */}
      <div className="absolute left-1 top-0 z-30">
        <ProggaBot size={104} mood={MOODS[mood]} />
      </div>
      <motion.div
        className="absolute left-[112px] top-[14px] z-30 max-w-[56%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2 font-display text-sm font-bold text-ink shadow-lift sm:text-[15px]"
        initial={{ opacity: 0, scale: 0.8, x: -8 }}
        animate={inView ? { opacity: 1, scale: 1, x: 0 } : undefined}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.2 }}
      >
        {t("landing.demoHi")}
      </motion.div>

      {/* ── Lesson window ── */}
      <div className="relative z-20 overflow-hidden rounded-[28px] border border-line bg-white shadow-lift">
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-brand-500 to-brand-600 py-3.5 pl-[118px] pr-4 text-white">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-100">{t("landing.demoMission")}</p>
            <p className="truncate font-display text-[17px] font-extrabold leading-tight">{t("landing.demoTitle")}</p>
          </div>
          <span className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold">{t("landing.demoStep")}</span>
        </div>
        <div className="flex gap-1.5 px-5 pt-3">
          <span className="h-1.5 flex-1 rounded-full bg-mint-500" />
          <motion.span className="h-1.5 flex-1 rounded-full bg-brand-500" animate={{ opacity: [1, 0.45, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />
          <span className="h-1.5 flex-1 rounded-full bg-line" />
        </div>

        <motion.div className="space-y-2.5 px-4 pb-4 pt-3 text-[14.5px] sm:px-5" variants={list} initial="hidden" animate={inView ? "show" : "hidden"}>
          <motion.div variants={item} className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-brand-500 px-3.5 py-2 font-semibold text-white">
            {t("landing.demoQ")}
          </motion.div>
          <motion.div variants={item} className="flex items-end gap-2">
            <Avatar />
            <div className="max-w-[84%] rounded-2xl rounded-bl-md bg-cream px-3.5 py-2">{t("landing.demoA1")}</div>
          </motion.div>
          <motion.div variants={item} className="ml-auto w-fit rounded-2xl rounded-br-md bg-brand-500 px-3.5 py-2 font-semibold text-white">
            x
          </motion.div>
          <motion.div variants={item} className="ml-8 rounded-2xl border-2 border-mint-100 bg-mint-50 px-3.5 py-2.5">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-mint-600">{t("landing.demoWhy")}</p>
            <p className="mt-0.5 text-ink-soft">{t("landing.demoWhyText")}</p>
          </motion.div>
          <motion.div variants={item} className="flex items-end gap-2">
            <Avatar />
            <div className="max-w-[84%] rounded-2xl rounded-bl-md border-2 border-banana-300 bg-banana-50 px-3.5 py-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-banana-700">{t("landing.demoYourTurn")}</p>
              {t("landing.demoAsk")}
            </div>
          </motion.div>
          <motion.div variants={item} className="flex items-center gap-2">
            <Avatar />
            <div className="flex gap-1.5 rounded-2xl rounded-bl-md bg-cream px-3.5 py-3" aria-hidden>
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="h-2 w-2 rounded-full bg-brand-400" animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* composer mock */}
        <div className="flex items-center gap-2 border-t border-line bg-white px-3 py-3 sm:px-4">
          <span className="hidden shrink-0 items-center gap-1 rounded-full border border-banana-200 bg-banana-50 px-2.5 py-1.5 text-xs font-extrabold text-banana-700 sm:flex">
            <Lightbulb size={13} /> {t("landing.demoHint")}
          </span>
          <div className="flex min-w-0 flex-1 items-center rounded-full border-2 border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-ink">
            20 − 5 = 1
            <motion.span className="ml-0.5 h-4 w-0.5 rounded bg-brand-500" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} />
          </div>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500 text-white shadow-[0_3px_0_0_var(--color-brand-700)]">
            <ArrowUp size={18} strokeWidth={2.6} />
          </span>
        </div>
      </div>

      {/* ── Floating rewards ── */}
      <motion.div className="absolute -right-2 top-[64px] z-30 rotate-6 sm:-right-5" {...float(0, 7)}>
        <div className="flex items-center gap-1.5 rounded-2xl bg-banana-400 px-3.5 py-2 font-display font-extrabold text-ink shadow-[0_4px_0_0_var(--color-banana-600)]">
          ⭐ +15 XP
        </div>
      </motion.div>

      <motion.div
        className="absolute -right-3 bottom-[120px] z-30 hidden sm:block lg:-right-10"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={inView ? { opacity: 1, scale: 1 } : undefined}
        transition={{ type: "spring", stiffness: 240, damping: 16, delay: 3.6 }}
      >
        <motion.div {...float(0.6, 6)} className="flex items-center gap-2.5 rounded-2xl border border-line bg-white py-2 pl-2 pr-3.5 shadow-lift">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-banana-200 to-banana-500 text-xl">🦸</span>
          <span className="leading-tight">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-500">{t("landing.demoBadgeNew")}</span>
            <span className="block font-display text-sm font-extrabold">{t("badges.hint_free_hero.name")}</span>
          </span>
        </motion.div>
      </motion.div>

      <motion.div className="absolute -left-3 bottom-0 z-30 sm:-left-6" {...float(1.2, 6)}>
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-white px-3.5 py-2 font-display font-extrabold text-coral-600 shadow-lift">
          <motion.span animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>🔥</motion.span>
          {t("landing.demoStreak")}
        </div>
      </motion.div>

      {/* subject bubbles */}
      <motion.span aria-hidden className="absolute right-[3%] top-[2px] z-10 hidden h-11 w-11 place-items-center rounded-full bg-white text-xl shadow-soft sm:grid" {...float(0.3, 10)}>
        📐
      </motion.span>
      <motion.span aria-hidden className="absolute -left-7 top-[48%] z-10 hidden h-12 w-12 place-items-center rounded-full bg-white text-2xl shadow-soft lg:grid" {...float(1.8, 10)}>
        🔬
      </motion.span>
    </div>
  );
}

function Avatar() {
  return (
    <span className="mb-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-50">
      <ProggaMark size={22} />
    </span>
  );
}
