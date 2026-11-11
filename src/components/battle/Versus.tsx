"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ProggaBot } from "@/components/brand/ProggaBot";
import { useT } from "@/i18n";
import { type PlayerCard, serverNow, sfx } from "@/lib/battle";
import { paletteFor } from "@/lib/skins";
import { LeagueBadge, TrophyIcon } from "./art";
import { useLeagueName } from "./shared";

export function PlayerAvatar({ skin, size = 64, ring = "ring-white/70", mood }: { skin: string; size?: number; ring?: string; mood?: "idle" | "happy" | "cheer" | "oops" | "thinking" }) {
  return (
    <span
      className={clsx("grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-b from-white/90 to-indigo-100 ring-4", ring)}
      style={{ width: size, height: size }}
    >
      <ProggaBot size={size * 0.86} float={false} palette={paletteFor(skin)} mood={mood} />
    </span>
  );
}

function Side({ p, side, label }: { p: PlayerCard; side: "left" | "right"; label?: string }) {
  const { t, n } = useT();
  const leagueName = useLeagueName();
  const left = side === "left";
  return (
    <motion.div
      initial={{ x: left ? "-110%" : "110%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 16, delay: 0.15 }}
      className={clsx(
        "relative flex flex-1 flex-col items-center justify-center gap-3 px-4 py-10",
        left
          ? "bg-gradient-to-br from-sky-500 via-brand-600 to-indigo-900 [clip-path:polygon(0_0,100%_0,100%_88%,0_100%)] sm:[clip-path:polygon(0_0,100%_0,88%_100%,0_100%)]"
          : "-mt-8 bg-gradient-to-bl from-coral-400 via-rose-600 to-purple-900 [clip-path:polygon(0_12%,100%_0,100%_100%,0_100%)] sm:mt-0 sm:-ml-[6%] sm:[clip-path:polygon(12%_0,100%_0,100%_100%,0_100%)]",
      )}
    >
      <div className="bg-dots absolute inset-0 opacity-25 [filter:invert(1)]" />
      {label && <span className="relative rounded-full bg-black/25 px-3 py-1 text-xs font-extrabold uppercase tracking-widest">{label}</span>}
      <div className="relative">
        <PlayerAvatar skin={p.skin} size={112} mood="happy" />
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-banana-400 px-2.5 py-0.5 font-display text-sm font-extrabold text-ink shadow">
          {t("battle.level", { n: n(p.level) })}
        </span>
      </div>
      <p className="relative mt-2 max-w-full truncate font-display text-2xl font-extrabold drop-shadow sm:text-3xl">{p.name}</p>
      <div className="relative flex items-center gap-2 rounded-2xl bg-black/25 px-3 py-2 backdrop-blur">
        <LeagueBadge family={p.league.family} division={p.league.division} size={40} glow />
        <div className="text-left leading-tight">
          <p className="text-xs font-bold text-white/80">{leagueName(p.league.family, p.league.division)}</p>
          <p className="flex items-center gap-1 font-display text-lg font-extrabold">
            <TrophyIcon size={18} /> {n(p.trophies)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function Versus({ me, opponent, startsAt }: { me: PlayerCard; opponent: PlayerCard; startsAt: number }) {
  const { t, n } = useT();
  const [left, setLeft] = useState(() => Math.ceil((startsAt - serverNow()) / 1000));
  const lastBeep = useRef<number | null>(null);

  useEffect(() => {
    sfx.found();
    const timer = setInterval(() => {
      const s = Math.ceil((startsAt - serverNow()) / 1000);
      setLeft(s);
      if (s <= 3 && s >= 1 && lastBeep.current !== s) {
        lastBeep.current = s;
        sfx.count();
      }
      if (s <= 0 && lastBeep.current !== 0) {
        lastBeep.current = 0;
        sfx.go();
      }
    }, 100);
    return () => clearInterval(timer);
  }, [startsAt]);

  return (
    <div className="battle-sky fixed inset-0 z-[60] flex flex-col overflow-hidden text-white">
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 14 }}
        className="relative z-20 mx-auto mt-5 rounded-2xl bg-gradient-to-b from-banana-300 to-banana-500 px-6 py-2 font-display text-xl font-extrabold text-ink shadow-[0_5px_0_#a87400] sm:text-2xl"
      >
        ⚔️ {t("battle.found")}
      </motion.div>

      <div className="relative flex flex-1 flex-col sm:flex-row">
        <Side p={me} side="left" label={t("battle.you")} />
        <Side p={opponent} side="right" />

        {/* VS */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <motion.div
            initial={{ scale: 4, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.55, type: "spring", stiffness: 220, damping: 12 }}
            className="relative"
          >
            <motion.span
              className="absolute inset-0 -z-10 rounded-full bg-banana-300 blur-2xl"
              animate={{ opacity: [0.5, 0.95, 0.5], scale: [1, 1.25, 1] }}
              transition={{ duration: 1.1, repeat: Infinity }}
            />
            <span className="block font-display text-[5.5rem] font-black italic leading-none text-white [-webkit-text-stroke:4px_#3b0764] [paint-order:stroke] drop-shadow-[0_8px_0_rgb(0_0_0_/_0.35)] sm:text-[8rem]">
              VS
            </span>
          </motion.div>
        </div>
      </div>

      <div className="relative z-20 grid h-32 place-items-center">
        <AnimatePresence mode="popLayout">
          <motion.p
            key={left > 3 ? "ready" : left}
            initial={{ scale: 2.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className={clsx(
              "font-display font-black drop-shadow-[0_5px_0_rgb(0_0_0_/_0.35)]",
              left > 3 ? "text-3xl text-indigo-100" : left > 0 ? "text-7xl text-banana-300" : "text-6xl text-mint-300",
            )}
          >
            {left > 3 ? t("battle.getReady") : left > 0 ? n(left) : t("battle.fight")}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
