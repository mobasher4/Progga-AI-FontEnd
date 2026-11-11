"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ProggaBot } from "@/components/brand/ProggaBot";
import { useT } from "@/i18n";
import { sfx } from "@/lib/battle";
import type { Palette } from "@/lib/types";
import { LeagueBadge, SwordsIcon, TrophyIcon } from "./art";
import type { LeagueFamily } from "@/lib/battle";
import { MuteToggle } from "./shared";

const CLOUDS = [
  { top: "8%", w: 260, h: 70, dur: 26, delay: -4, o: 0.55 },
  { top: "22%", w: 180, h: 52, dur: 19, delay: -12, o: 0.4 },
  { top: "64%", w: 320, h: 86, dur: 31, delay: -20, o: 0.5 },
  { top: "78%", w: 200, h: 58, dur: 22, delay: -2, o: 0.35 },
  { top: "40%", w: 150, h: 44, dur: 16, delay: -9, o: 0.3 },
];

export function SearchScreen({
  grade,
  trophies,
  family,
  division,
  palette,
  online,
  onCancel,
}: {
  grade: number;
  trophies: number;
  family: LeagueFamily;
  division: 0 | 1 | 2 | 3;
  palette: Palette;
  online: number;
  onCancel: () => void;
}) {
  const { t, n } = useT();
  const [secs, setSecs] = useState(0);
  const [tip, setTip] = useState(0);
  const tips = [t("battle.tip1"), t("battle.tip2"), t("battle.tip3"), t("battle.tip4"), t("battle.tip5")];

  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => {
      setSecs(Math.floor((Date.now() - started) / 1000));
      sfx.ping();
    }, 1000);
    const tipper = setInterval(() => setTip((x) => x + 1), 3200);
    return () => {
      clearInterval(timer);
      clearInterval(tipper);
    };
  }, []);

  return (
    <motion.div
      className="battle-sky fixed inset-0 z-[60] m-0! flex flex-col overflow-hidden text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.08 }}
      transition={{ duration: 0.35 }}
      role="dialog"
      aria-live="polite"
      aria-label={t("battle.searching")}
    >
      <div className="battle-stars pointer-events-none absolute inset-0" />
      {CLOUDS.map((c, i) => (
        <span
          key={i}
          className="cloud pointer-events-none"
          style={{ top: c.top, width: c.w, height: c.h, opacity: c.o, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }}
        />
      ))}

      <div className="relative z-10 flex shrink-0 items-center justify-between p-4 sm:p-6">
        <span className="flex items-center gap-2 rounded-full bg-black/25 px-3 py-1.5 text-sm font-bold backdrop-blur">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-mint-400" />
          </span>
          <Users size={15} /> {online > 0 ? t("battle.online", { n: n(online) }) : t("battle.onlineNone")}
        </span>
        <MuteToggle />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 text-center">
        {/* radar */}
        <div className="relative grid h-56 w-56 shrink-0 place-items-center sm:h-72 sm:w-72 [@media(max-height:760px)]:h-44 [@media(max-height:760px)]:w-44">
          <span className="ring-pulse absolute inset-0 rounded-full border-4 border-banana-300/60" />
          <span className="ring-pulse absolute inset-0 rounded-full border-4 border-banana-300/60 [animation-delay:0.6s]" />
          <span className="ring-pulse absolute inset-0 rounded-full border-4 border-banana-300/60 [animation-delay:1.2s]" />
          <div className="absolute inset-3 overflow-hidden rounded-full border-2 border-white/25 bg-gradient-to-b from-indigo-900/80 to-indigo-950/90 shadow-[inset_0_0_40px_rgb(0_0_0_/_0.6)]">
            <div className="radar-sweep absolute inset-0 rounded-full" />
            <div className="absolute inset-[22%] rounded-full border border-white/15" />
            <div className="absolute inset-[42%] rounded-full border border-white/15" />
            <div className="absolute left-1/2 top-0 h-full w-px bg-white/10" />
            <div className="absolute left-0 top-1/2 h-px w-full bg-white/10" />
            {/* blips */}
            {[["24%", "30%", 0], ["68%", "62%", 0.7], ["36%", "72%", 1.3], ["74%", "26%", 0.4]].map(([l, tp, d], i) => (
              <motion.span
                key={i}
                className="absolute h-2.5 w-2.5 rounded-full bg-banana-300 shadow-[0_0_12px_#ffd43b]"
                style={{ left: l as string, top: tp as string }}
                animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 0.4] }}
                transition={{ duration: 1.6, repeat: Infinity, delay: d as number }}
              />
            ))}
          </div>
          <motion.div animate={{ rotate: [-6, 6, -6], scale: [1, 1.08, 1] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }} className="relative">
            <SwordsIcon size={96} className="drop-shadow-[0_6px_10px_rgb(0_0_0_/_0.5)] [@media(max-height:760px)]:h-16 [@media(max-height:760px)]:w-16" />
          </motion.div>
        </div>

        <h1 className="mt-6 font-display [@media(max-height:760px)]:mt-3 text-3xl font-extrabold tracking-tight drop-shadow sm:text-4xl">
          {t("battle.searching")}
          <span className="inline-flex w-8 justify-start">
            {[0, 1, 2].map((i) => (
              <motion.span key={i} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}>
                .
              </motion.span>
            ))}
          </span>
        </h1>
        <p className="mt-1 flex items-center gap-2 font-bold text-indigo-200">
          <TrophyIcon size={18} /> {t("battle.searchingSub", { n: n(grade), t: n(trophies) })}
        </p>
        <p className="mt-4 font-display text-5xl [@media(max-height:760px)]:mt-1 [@media(max-height:760px)]:text-4xl font-extrabold tabular-nums text-banana-300 drop-shadow-[0_3px_0_rgb(0_0_0_/_0.35)]">
          0:{String(secs).padStart(2, "0").replace(/\d/g, (d) => n(d))}
        </p>

        <div className="mt-8 flex shrink-0 items-center gap-3 rounded-3xl [@media(max-height:760px)]:mt-4 bg-white/10 p-3 pr-5 backdrop-blur">
          <ProggaBot size={56} float={false} palette={palette} mood="thinking" />
          <LeagueBadge family={family} division={division} size={40} />
          <div className="h-8 w-px bg-white/20" />
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-black/30">
            <motion.div
              className="flex flex-col items-center"
              animate={{ y: ["0%", "-80%"] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            >
              {["❓", "🧑‍🎓", "👩‍🎓", "❓", "🧑‍🎓"].map((e, i) => (
                <span key={i} className="grid h-14 w-14 place-items-center text-2xl">{e}</span>
              ))}
            </motion.div>
          </div>
        </div>

        <div className="mt-6 h-12 max-w-md shrink-0 [@media(max-height:760px)]:mt-3">
          <AnimatePresence mode="wait">
            <motion.p
              key={tip % tips.length}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-sm font-semibold text-indigo-100/90 sm:text-base"
            >
              💡 {tips[tip % tips.length]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="relative z-10 flex shrink-0 justify-center p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <button onClick={onCancel} className="btn-glossy btn-glossy-red px-8 py-3 text-lg">
          <X size={20} strokeWidth={3} /> {t("battle.cancel")}
        </button>
      </div>
    </motion.div>
  );
}
