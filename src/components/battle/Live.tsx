"use client";

import clsx from "clsx";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Flame, LogOut, SkipForward, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProggaBot } from "@/components/brand/ProggaBot";
import { useT } from "@/i18n";
import { api, errorMessage } from "@/lib/api";
import { type AnswerResponse, type BattleQuestionView, type BattleState, fmtScore, serverNow, sfx, syncClock } from "@/lib/battle";
import { paletteFor } from "@/lib/skins";
import { LeagueBadge } from "./art";
import { MuteToggle } from "./shared";
import { PlayerAvatar } from "./Versus";

const TILE = [
  { body: "from-sky-400 via-brand-500 to-brand-700", edge: "#133a80", chip: "bg-white/25" },
  { body: "from-pink-400 via-fuchsia-500 to-purple-700", edge: "#5b1470", chip: "bg-white/25" },
  { body: "from-amber-300 via-orange-400 to-orange-600", edge: "#9a4a00", chip: "bg-white/25" },
  { body: "from-emerald-300 via-mint-500 to-mint-700", edge: "#0b5c44", chip: "bg-white/25" },
];

interface Reveal {
  question: BattleQuestionView;
  choice: number;
  correct: boolean;
  answerIndex: number;
  points: number;
  explanation: string;
  timedOut: boolean;
}

interface Bubble {
  id: number;
  text: string;
  good: boolean;
}

export function Live({ initial, onLeave, onState }: { initial: BattleState; onLeave: () => void; onState: (s: BattleState) => void }) {
  const { t, n, ui } = useT();
  const [state, setState] = useState(initial);
  const [pending, setPending] = useState<number | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [left, setLeft] = useState(initial.timeLimitMs);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [myBubbles, setMyBubbles] = useState<Bubble[]>([]);
  const [oppBubbles, setOppBubbles] = useState<Bubble[]>([]);
  const prevOpp = useRef(initial.opponent.score);
  const bubbleId = useRef(1);
  const submitting = useRef(false);
  const lastTick = useRef<number | null>(null);
  const answeredRef = useRef(initial.me.answered);

  const apply = useCallback(
    (s: BattleState) => {
      answeredRef.current = s.me.answered;
      setState(s);
      onState(s);
      if (s.opponent.score !== prevOpp.current) {
        const d = s.opponent.score - prevOpp.current;
        prevOpp.current = s.opponent.score;
        const id = bubbleId.current++;
        setOppBubbles((b) => [...b, { id, text: d > 0 ? `+${fmtScore(d)}` : fmtScore(d).replace("-", "−"), good: d > 0 }]);
        setTimeout(() => setOppBubbles((b) => b.filter((x) => x.id !== id)), 1400);
      }
    },
    [onState],
  );

  // live updates: the rival's score and progress, about once a second
  useEffect(() => {
    let stop = false;
    const tick = async () => {
      if (stop) return;
      try {
        const sent = Date.now();
        const s = await api<BattleState>(`/battle/${initial.id}`);
        syncClock(s.now, sent);
        // a poll that left before our last answer landed is stale
        if (!stop && !submitting.current && s.me.answered >= answeredRef.current) apply(s);
      } catch {
        // a missed poll is fine; the next one catches up
      }
      if (!stop) setTimeout(tick, 1000);
    };
    // straight after the VS splash the first question isn't loaded yet: fetch it now
    const first = setTimeout(tick, initial.question || initial.me.finished ? 1000 : 0);
    return () => {
      stop = true;
      clearTimeout(first);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.id, apply]);

  const question = reveal?.question ?? state.question;

  const submit = useCallback(
    async (choice: number, auto = false) => {
      const q = state.question;
      if (!q || submitting.current || reveal) return;
      submitting.current = true;
      setPending(choice);
      if (choice >= 0) sfx.tap();
      try {
        const sent = Date.now();
        const r = await api<AnswerResponse>(`/battle/${state.id}/answer`, { body: { index: q.index, choice } });
        syncClock(r.now, sent);
        if (r.last) {
          const last = r.last;
          setReveal({
            question: q,
            choice: last.choice,
            correct: last.correct,
            answerIndex: last.answerIndex,
            points: last.points,
            explanation: ui === "bn" ? last.explanationBn : last.explanation,
            timedOut: auto || (choice >= 0 && last.choice === -1),
          });
          const id = bubbleId.current++;
          if (last.correct) {
            sfx.correct();
            confetti({ particleCount: 40, spread: 60, startVelocity: 32, origin: { y: 0.75 }, colors: ["#22c493", "#ffd43b", "#ffffff"], scalar: 0.8 });
            setMyBubbles((b) => [...b, { id, text: "+1", good: true }]);
          } else if (last.choice === -1) {
            sfx.skip();
          } else {
            sfx.wrong();
            setShake((x) => x + 1);
            setMyBubbles((b) => [...b, { id, text: "−0.5", good: false }]);
          }
          setTimeout(() => setMyBubbles((b) => b.filter((x) => x.id !== id)), 1400);
          setTimeout(() => setReveal(null), Math.max(900, r.revealMs - (Date.now() - sent) / 2));
        }
        apply(r);
        setError(null);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setPending(null);
        submitting.current = false;
      }
    },
    [state.question, state.id, reveal, ui, apply],
  );

  // question clock (server time), auto-submits a timeout at zero
  useEffect(() => {
    if (!state.question || reveal || state.me.finished) return;
    const end = state.me.questionStartedAt + state.timeLimitMs;
    const timer = setInterval(() => {
      const ms = Math.max(0, end - serverNow());
      setLeft(Math.min(state.timeLimitMs, ms));
      const s = Math.ceil(ms / 1000);
      if (s <= 5 && s > 0 && lastTick.current !== s) {
        lastTick.current = s;
        sfx.tick();
      }
      if (ms <= 0) {
        clearInterval(timer);
        void submit(-1, true);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [state.question, state.me.questionStartedAt, state.timeLimitMs, state.me.finished, reveal, submit]);

  // keyboard: 1–4 / A–D to answer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!state.question || reveal || pending !== null) return;
      const k = e.key.toLowerCase();
      const i = "1234".indexOf(k) >= 0 ? "1234".indexOf(k) : "abcd".indexOf(k);
      if (i >= 0 && i < state.question.options.length) void submit(i);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.question, reveal, pending, submit]);

  const me = state.me;
  const opp = state.opponent;
  const momentum = Math.max(8, Math.min(92, 50 + (me.score - opp.score) * 7));
  const secs = Math.ceil(left / 1000);
  const frac = left / state.timeLimitMs;
  const waiting = !question && me.finished;

  return (
    <div className="battle-sky fixed inset-0 z-[60] flex flex-col overflow-y-auto text-white">
      <div className="battle-stars pointer-events-none fixed inset-0" />

      {/* HUD */}
      <header className="relative z-10 px-3 pt-3 sm:px-6 sm:pt-5">
        <div className="mx-auto flex max-w-4xl items-center gap-2">
          <button
            onClick={() => {
              if (window.confirm(t("battle.leaveConfirm"))) onLeave();
            }}
            className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 transition hover:bg-white/20"
            aria-label={t("battle.leave")}
            title={t("battle.leave")}
          >
            <LogOut size={18} className="rotate-180" />
          </button>
          <div className="flex-1 text-center">
            <span className="rounded-full bg-black/30 px-3 py-1 font-display text-sm font-extrabold tracking-wide">
              {t("battle.question", { a: n(Math.min(state.total, (question?.index ?? me.answered - 1) + 1)), b: n(state.total) })}
            </span>
          </div>
          <MuteToggle />
        </div>

        <div className="mx-auto mt-3 grid max-w-4xl grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
          <PlayerPanel name={t("battle.you")} sub={me.name} skin={me.skin} score={me.score} side="left" bubbles={myBubbles} family={me.league.family} division={me.league.division}>
            <Pips total={state.total} marks={me.marks} side="left" />
          </PlayerPanel>
          <TimerRing secs={secs} frac={waiting ? 1 : frac} hidden={!question || !!reveal} label={n(secs)} />
          <PlayerPanel name={opp.name} skin={opp.skin} score={opp.score} side="right" bubbles={oppBubbles} family={opp.league.family} division={opp.league.division}>
            <Pips total={state.total} answered={opp.answered} side="right" />
          </PlayerPanel>
        </div>

        {/* tug of war */}
        <div className="mx-auto mt-3 max-w-4xl">
          <div className="relative h-3 overflow-hidden rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 shadow-inner">
            <motion.div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-400 to-brand-500" animate={{ width: `${momentum}%` }} transition={{ type: "spring", stiffness: 90, damping: 15 }} />
            <motion.span
              className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-banana-300 shadow-[0_0_10px_#ffd43b]"
              animate={{ left: `${momentum}%` }}
              transition={{ type: "spring", stiffness: 90, damping: 15 }}
            />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col px-3 pb-6 pt-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
          <AnimatePresence mode="wait">
            {question ? (
              <motion.div
                key={question.index}
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ type: "spring", stiffness: 200, damping: 22 }}
                className="flex flex-1 flex-col"
              >
                <div key={shake} className={clsx("relative rounded-[1.75rem] bg-white p-5 text-ink shadow-[0_8px_0_rgb(15_30_61_/_0.25),0_24px_50px_-20px_rgb(0_0_0_/_0.6)] sm:p-7", shake > 0 && reveal && !reveal.correct && reveal.choice !== -1 && "battle-shake")}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-indigo-600">
                      {ui === "bn" ? question.topicBn : question.topic}
                    </span>
                    <span className="flex items-center gap-0.5 text-orange-500" title={`Difficulty ${question.difficulty}/6`}>
                      {Array.from({ length: 6 }, (_, i) => (
                        <Flame key={i} size={14} className={i < question.difficulty ? "fill-orange-400" : "text-line"} />
                      ))}
                    </span>
                  </div>
                  <h2 className="mt-3 text-balance font-display text-2xl font-extrabold leading-snug sm:text-[1.9rem]">
                    {ui === "bn" ? question.promptBn : question.prompt}
                  </h2>
                  <AnimatePresence>
                    {reveal && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className={clsx("mt-3 overflow-hidden rounded-2xl px-4 py-2.5 text-sm font-semibold", reveal.correct ? "bg-mint-50 text-mint-700" : reveal.choice === -1 ? "bg-slate-100 text-ink-soft" : "bg-coral-50 text-coral-600")}
                      >
                        <span className="font-display text-base font-extrabold">
                          {reveal.correct ? `🎉 ${t("battle.correct")} +1` : reveal.choice === -1 ? `⏰ ${reveal.timedOut ? t("battle.timeUp") : t("battle.skipped")} · 0` : `💥 ${t("battle.wrong")} −0.5`}
                        </span>{" "}
                        <span className="text-ink-soft">{reveal.explanation}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {(ui === "bn" ? question.optionsBn : question.options).map((o, i) => {
                    const isAnswer = reveal && i === reveal.answerIndex;
                    const isWrongPick = reveal && i === reveal.choice && !reveal.correct;
                    const locked = pending === i;
                    const style = TILE[i % 4];
                    return (
                      <motion.button
                        key={i}
                        disabled={!!reveal || pending !== null}
                        onClick={() => submit(i)}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: reveal && !isAnswer && !isWrongPick ? 0.4 : 1, y: 0, scale: locked ? [1, 1.04, 1] : isAnswer ? 1.03 : 1 }}
                        transition={{ delay: reveal ? 0 : 0.05 * i, scale: locked ? { repeat: Infinity, duration: 0.6 } : { type: "spring", stiffness: 300 } }}
                        whileHover={!reveal && pending === null ? { y: -3 } : undefined}
                        whileTap={!reveal && pending === null ? { y: 3 } : undefined}
                        className={clsx(
                          "btn-glossy min-h-[4.25rem] justify-start rounded-[1.4rem] bg-gradient-to-b px-4 py-3 text-left text-lg sm:text-xl",
                          isAnswer ? "from-emerald-300 via-mint-500 to-mint-700 ring-4 ring-mint-300" : isWrongPick ? "from-rose-300 via-coral-500 to-coral-600 ring-4 ring-coral-400" : style.body,
                          locked && "ring-4 ring-banana-300",
                        )}
                        style={{ boxShadow: `0 6px 0 ${isAnswer ? "#0b5c44" : isWrongPick ? "#962020" : style.edge}, 0 14px 24px -10px rgb(0 0 0 / 0.5)` }}
                      >
                        <span className={clsx("grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-lg font-black", style.chip)}>
                          {isAnswer ? <Check size={22} strokeWidth={3.5} /> : isWrongPick ? <X size={22} strokeWidth={3.5} /> : String.fromCharCode(65 + i)}
                        </span>
                        <span className="min-w-0 flex-1 break-words leading-snug">{o}</span>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="min-h-5 text-sm font-semibold text-indigo-200">{pending !== null && pending >= 0 ? t("battle.lockIn") : error}</p>
                  <button
                    onClick={() => submit(-1)}
                    disabled={!!reveal || pending !== null}
                    className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-extrabold transition hover:bg-white/20 disabled:opacity-40"
                    title={t("battle.skipHint")}
                  >
                    <SkipForward size={16} /> {t("battle.skip")} <span className="text-indigo-200">({t("battle.skipHint")})</span>
                  </button>
                </div>
              </motion.div>
            ) : waiting || state.status !== "live" ? (
              <motion.div key="waiting" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="m-auto flex flex-col items-center text-center">
                <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
                  <ProggaBot size={150} mood="thinking" palette={paletteFor(opp.skin)} />
                </motion.div>
                <h2 className="mt-4 font-display text-3xl font-extrabold">
                  {state.status === "live" ? t("battle.waiting", { name: opp.name }) : t("battle.finishing")}
                </h2>
                {state.status === "live" && (
                  <p className="mt-1 font-bold text-indigo-200">{t("battle.waitingSub", { a: n(Math.min(state.total, opp.answered + 1)), b: n(state.total) })}</p>
                )}
                <div className="mt-5 flex gap-1.5">
                  {Array.from({ length: state.total }, (_, i) => (
                    <motion.span
                      key={i}
                      className={clsx("h-3 w-6 rounded-full", i < opp.answered ? "bg-gradient-to-b from-rose-300 to-rose-500" : "bg-white/15")}
                      animate={i === opp.answered ? { opacity: [0.4, 1, 0.4] } : undefined}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="loading" className="m-auto font-display text-2xl font-extrabold text-indigo-100">
                {t("battle.getReady")}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function PlayerPanel({
  name,
  sub,
  skin,
  score,
  side,
  bubbles,
  family,
  division,
  children,
}: {
  name: string;
  sub?: string;
  skin: string;
  score: number;
  side: "left" | "right";
  bubbles: Bubble[];
  family: BattleState["me"]["league"]["family"];
  division: BattleState["me"]["league"]["division"];
  children: React.ReactNode;
}) {
  const left = side === "left";
  return (
    <div
      className={clsx(
        "relative flex min-w-0 items-center gap-2 rounded-3xl p-2 sm:gap-3 sm:p-3",
        left ? "bg-gradient-to-r from-brand-600/80 to-brand-500/30" : "flex-row-reverse bg-gradient-to-l from-rose-600/80 to-rose-500/30",
      )}
    >
      <div className="relative">
        <PlayerAvatar skin={skin} size={52} ring={left ? "ring-sky-300" : "ring-rose-300"} />
        <span className={clsx("absolute -bottom-1", left ? "-right-1" : "-left-1")}>
          <LeagueBadge family={family} division={division} size={24} />
        </span>
      </div>
      <div className={clsx("min-w-0 flex-1", !left && "text-right")}>
        <p className="truncate font-display text-sm font-extrabold leading-tight sm:text-base">{name}</p>
        {sub && <p className="hidden truncate text-xs font-semibold text-white/70 sm:block">{sub}</p>}
        <div className={clsx("mt-1 hidden sm:flex", !left && "justify-end")}>{children}</div>
      </div>
      <motion.span
        key={score}
        initial={{ scale: 1.6 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 12 }}
        className="font-display text-3xl font-black tabular-nums drop-shadow-[0_3px_0_rgb(0_0_0_/_0.3)] sm:text-4xl"
      >
        {fmtScore(score).replace("-", "−")}
      </motion.span>
      <div className={clsx("pointer-events-none absolute -top-2", left ? "right-4" : "left-4")}>
        <AnimatePresence>
          {bubbles.map((b) => (
            <motion.span
              key={b.id}
              initial={{ y: 10, opacity: 0, scale: 0.6 }}
              animate={{ y: -34, opacity: 1, scale: 1.15 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.6 }}
              className={clsx(
                "absolute whitespace-nowrap rounded-full px-2.5 py-0.5 font-display text-lg font-black shadow-lg",
                b.good ? "bg-mint-400 text-white" : "bg-coral-500 text-white",
              )}
            >
              {b.text}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      <div className={clsx("absolute -bottom-3 sm:hidden", left ? "left-3" : "right-3")}>{children}</div>
    </div>
  );
}

function Pips({ total, marks, answered, side }: { total: number; marks?: (1 | 0 | -1)[]; answered?: number; side: "left" | "right" }) {
  return (
    <div className={clsx("flex gap-1", side === "right" && "flex-row-reverse")}>
      {Array.from({ length: total }, (_, i) => {
        const m = marks?.[i];
        const done = marks ? m !== undefined : i < (answered ?? 0);
        return (
          <span
            key={i}
            className={clsx(
              "h-2 w-2 rounded-full ring-1 ring-black/20 sm:h-2.5 sm:w-2.5",
              !done ? "bg-white/20" : marks ? (m === 1 ? "bg-mint-400" : m === -1 ? "bg-coral-500" : "bg-slate-300") : "bg-white",
            )}
          />
        );
      })}
    </div>
  );
}

function TimerRing({ secs, frac, hidden, label }: { secs: number; frac: number; hidden: boolean; label: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const color = frac > 0.5 ? "#3de3b0" : frac > 0.25 ? "#ffd43b" : "#ff6b6b";
  return (
    <div className={clsx("relative grid h-16 w-16 place-items-center transition-opacity sm:h-20 sm:w-20", hidden && "opacity-30")}>
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="rgb(0 0 0 / 0.35)" stroke="rgb(255 255 255 / 0.15)" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - frac)} style={{ transition: "stroke-dashoffset 0.1s linear, stroke 0.3s" }} />
      </svg>
      <motion.span key={secs <= 5 ? secs : "n"} initial={secs <= 5 ? { scale: 1.5 } : false} animate={{ scale: 1 }} className={clsx("relative font-display text-2xl font-black tabular-nums sm:text-3xl", secs <= 5 && !hidden && "text-coral-400")}>
        {hidden ? "⚔️" : label}
      </motion.span>
    </div>
  );
}
