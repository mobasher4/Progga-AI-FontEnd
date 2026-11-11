"use client";

import clsx from "clsx";
import confetti from "canvas-confetti";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Check, ChevronDown, Home, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "@/i18n";
import { type BattleState, type LeagueFamily, fmtScore, sfx } from "@/lib/battle";
import { LeagueBadge, TrophyIcon } from "./art";
import { useLeagueName } from "./shared";
import { PlayerAvatar } from "./Versus";

function parseLeague(id: string): { family: LeagueFamily; division: 0 | 1 | 2 | 3 } {
  const [family, div] = id.split("-");
  return { family: family as LeagueFamily, division: (Number(div) || 0) as 0 | 1 | 2 | 3 };
}

function Counter({ from, to, className }: { from: number; to: number; className?: string }) {
  const { n } = useT();
  const v = useMotionValue(from);
  const shown = useTransform(v, (x) => n(Math.round(x)));
  const [text, setText] = useState(n(from));
  useEffect(() => {
    const unsub = shown.on("change", setText);
    const controls = animate(v, to, { duration: 1.4, delay: 0.9, ease: "easeOut" });
    return () => {
      unsub();
      controls.stop();
    };
  }, [to, v, shown]);
  return <span className={className}>{text}</span>;
}

export function Result({ state, onAgain, onExit }: { state: BattleState; onAgain: () => void; onExit: () => void }) {
  const { t, n, ui } = useT();
  const leagueName = useLeagueName();
  const r = state.result!;
  const [review, setReview] = useState(false);
  const win = r.outcome === "win";
  const loss = r.outcome === "loss";
  const after = parseLeague(r.leagueAfter);

  useEffect(() => {
    if (win) {
      sfx.victory();
      const colors = ["#ffd43b", "#ff9f1c", "#22c493", "#2b7be8", "#f72585"];
      confetti({ particleCount: 140, spread: 90, origin: { y: 0.35 }, colors });
      setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0, y: 0.6 }, colors }), 300);
      setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: 0.6 }, colors }), 450);
    } else if (loss) sfx.defeat();
    else sfx.ping();
    if (r.promoted) setTimeout(() => sfx.promote(), 1600);
  }, [win, loss, r.promoted]);

  const title = win ? t("battle.victory") : loss ? t("battle.defeat") : t("battle.drawTitle");

  return (
    <div className={clsx("battle-sky fixed inset-0 z-[60] overflow-y-auto text-white", loss && "[filter:saturate(0.65)]")}>
      <div className="battle-stars pointer-events-none fixed inset-0" />
      {win && <div className="victory-rays pointer-events-none fixed left-1/2 top-[18%] h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2" />}

      <div className="relative mx-auto flex min-h-full max-w-xl flex-col items-center px-4 pb-10 pt-8 text-center">
        <motion.div
          initial={{ scale: 0.2, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 11 }}
          className={clsx(
            "relative rounded-[1.75rem] px-8 py-3 shadow-[0_8px_0_rgb(0_0_0_/_0.3)]",
            win ? "shine bg-gradient-to-b from-banana-200 via-banana-400 to-orange-500" : loss ? "bg-gradient-to-b from-slate-400 to-slate-600" : "bg-gradient-to-b from-sky-300 to-brand-600",
          )}
        >
          <h1 className={clsx("font-display text-5xl font-black italic tracking-tight sm:text-6xl", win ? "text-white [-webkit-text-stroke:3px_#a85a00] [paint-order:stroke]" : "text-white")}>{title}</h1>
        </motion.div>
        {r.tieBreak && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-3 font-bold text-banana-200">
            {win ? t("battle.wonOnSpeed") : t("battle.lostOnSpeed", { name: state.opponent.name })}
          </motion.p>
        )}

        {/* scoreboard */}
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 flex w-full items-center justify-between gap-3 rounded-3xl bg-white/10 p-4 backdrop-blur">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <PlayerAvatar skin={state.me.skin} size={64} ring={win ? "ring-banana-300" : "ring-sky-300"} mood={win ? "cheer" : loss ? "oops" : "happy"} />
            <p className="max-w-full truncate font-display font-extrabold">{t("battle.you")}</p>
          </div>
          <div className="font-display text-4xl font-black tabular-nums sm:text-5xl">
            <span className={win ? "text-banana-300" : ""}>{fmtScore(r.myScore).replace("-", "−")}</span>
            <span className="mx-2 text-white/40">–</span>
            <span className={loss ? "text-rose-300" : ""}>{fmtScore(r.theirScore).replace("-", "−")}</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <PlayerAvatar skin={state.opponent.skin} size={64} ring={loss ? "ring-banana-300" : "ring-rose-300"} mood={loss ? "cheer" : win ? "oops" : "happy"} />
            <p className="max-w-full truncate font-display font-extrabold">{state.opponent.name}</p>
          </div>
        </motion.div>

        {/* trophies */}
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="mt-4 flex w-full items-center gap-4 rounded-3xl bg-gradient-to-r from-indigo-900/80 to-purple-900/80 p-4 ring-1 ring-white/15">
          <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.8, type: "spring" }}>
            <LeagueBadge family={after.family} division={after.division} size={76} glow />
          </motion.div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-indigo-200">{leagueName(after.family, after.division)}</p>
            <p className="flex items-center gap-2 font-display text-4xl font-black">
              <TrophyIcon size={34} />
              <Counter from={r.trophiesBefore} to={r.trophiesAfter} />
            </p>
          </div>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, type: "spring", stiffness: 300 }}
            className={clsx(
              "rounded-2xl px-3 py-2 font-display text-2xl font-black shadow-[0_4px_0_rgb(0_0_0_/_0.25)]",
              r.trophyDelta > 0 ? "bg-mint-500" : r.trophyDelta < 0 ? "bg-coral-500" : "bg-slate-500",
            )}
          >
            {r.trophyDelta > 0 ? "+" : r.trophyDelta < 0 ? "−" : "±"}
            {n(Math.abs(r.trophyDelta))}
          </motion.span>
        </motion.div>

        <AnimatePresence>
          {(r.promoted || r.demoted) && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.6, type: "spring", stiffness: 220, damping: 12 }}
              className={clsx(
                "mt-4 w-full rounded-3xl px-4 py-3 font-display text-xl font-extrabold",
                r.promoted ? "shine bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 shadow-[0_0_30px_rgb(217_70_239_/_0.6)]" : "bg-white/10",
              )}
            >
              {r.promoted ? `🎉 ${t("battle.promoted", { league: leagueName(after.family, after.division) })}` : t("battle.demoted", { league: leagueName(after.family, after.division) })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* stats */}
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }} className="mt-4 grid w-full grid-cols-4 gap-2">
          {[
            ["✅", n(r.correct), t("battle.correctN")],
            ["❌", n(r.wrong), t("battle.wrongN")],
            ["⏱️", `${n((r.myMs / 1000).toFixed(1))}s`, t("battle.time")],
            ["⭐", `+${n(r.xpGained)}`, "XP"],
          ].map(([icon, v, label]) => (
            <div key={label} className="rounded-2xl bg-white/10 px-1 py-3">
              <p className="text-lg">{icon}</p>
              <p className="font-display text-xl font-extrabold">{v}</p>
              <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-200">{label}</p>
            </div>
          ))}
        </motion.div>

        <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
          <button onClick={onAgain} className="btn-glossy btn-glossy-orange flex-1 text-xl" autoFocus>
            <RotateCcw size={22} strokeWidth={3} /> {t("battle.again")}
          </button>
          <button onClick={onExit} className="btn-glossy btn-glossy-glass flex-1 text-lg">
            <Home size={20} /> {t("battle.backArena")}
          </button>
        </div>

        <button onClick={() => setReview((x) => !x)} className="mt-6 flex items-center gap-1.5 font-display font-extrabold text-indigo-100 hover:text-white">
          {review ? t("battle.hideReview") : t("battle.review")} <ChevronDown size={18} className={clsx("transition-transform", review && "rotate-180")} />
        </button>
        <AnimatePresence>
          {review && (
            <motion.ol initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 w-full space-y-3 overflow-hidden text-left">
              {r.review.map((q, i) => {
                const opts = ui === "bn" ? q.optionsBn : q.options;
                const right = q.choice === q.answerIndex;
                return (
                  <li key={i} className="rounded-2xl bg-white p-4 text-ink">
                    <p className="flex gap-2 font-display font-extrabold">
                      <span className={clsx("grid h-6 w-6 shrink-0 place-items-center rounded-full text-white", right ? "bg-mint-500" : q.choice === -1 ? "bg-slate-400" : "bg-coral-500")}>
                        {right ? <Check size={14} strokeWidth={3.5} /> : q.choice === -1 ? "–" : <X size={14} strokeWidth={3.5} />}
                      </span>
                      {ui === "bn" ? q.promptBn : q.prompt}
                    </p>
                    <p className="mt-2 text-sm">
                      <span className="font-bold text-mint-700">✓ {opts[q.answerIndex]}</span>
                      {!right && (
                        <span className="ml-3 text-ink-muted">
                          {t("battle.yourAnswer")}: {q.choice === -1 ? t("battle.noAnswer") : <span className="text-coral-600 line-through">{opts[q.choice]}</span>}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">{ui === "bn" ? q.explanationBn : q.explanation}</p>
                  </li>
                );
              })}
            </motion.ol>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
