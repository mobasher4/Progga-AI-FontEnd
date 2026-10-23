"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Heart, RotateCcw, Timer, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { ProggaBot } from "@/components/brand/ProggaBot";
import { useCelebrate } from "@/components/celebrate/CelebrationProvider";
import { PageLoader, ProgressBar, Spinner, SubjectIcon } from "@/components/ui/primitives";
import { useT } from "@/i18n";
import { api, errorMessage } from "@/lib/api";
import { paletteFor } from "@/lib/skins";
import type { QuizAttempt, QuizQuestion, Rewards, Subject } from "@/lib/types";
import { useMe } from "@/lib/useMe";

const TIME_LIMIT = 15;
const OPTION_STYLES = [
  "border-brand-200 bg-brand-50 hover:bg-brand-100 [&>span]:bg-brand-500",
  "border-banana-200 bg-banana-50 hover:bg-banana-100 [&>span]:bg-banana-500",
  "border-mint-100 bg-mint-50 hover:bg-mint-100 [&>span]:bg-mint-500",
  "border-sky-100 bg-sky-50 hover:bg-sky-100 [&>span]:bg-sky-500",
];

interface AnswerResult {
  correct: boolean;
  answerIndex: number;
  explanation: string;
  points: number;
  attempt: QuizAttempt;
  rewards: Rewards | null;
  summary: { perfect: boolean; accuracy: number; outOfHearts: boolean } | null;
}

type Game = { subject: Subject; attempt: QuizAttempt; questions: QuizQuestion[] };

export default function ArenaPage() {
  const { user } = useMe();
  const { t, n, ui } = useT();
  const { data: subjects } = useSWR<{ subjects: Subject[] }>(user?.grade ? `/subjects?grade=${user.grade}` : null);
  const { data: history, mutate: refreshHistory } = useSWR<{ attempts: QuizAttempt[] }>("/quiz/history");
  const { toast } = useCelebrate();
  const [game, setGame] = useState<Game | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  async function start(subject: Subject) {
    setStarting(subject.id);
    try {
      const r = await api<{ attempt: QuizAttempt; questions: QuizQuestion[] }>("/quiz/start", { body: { subjectId: subject.id } });
      setGame({ subject, ...r });
      window.scrollTo({ top: 0 });
    } catch (e) {
      toast(errorMessage(e), "⚠️", "coral");
    } finally {
      setStarting(null);
    }
  }

  if (game) {
    return (
      <Round
        key={game.attempt.id}
        game={game}
        onExit={() => {
          setGame(null);
          void refreshHistory();
        }}
        onReplay={() => start(game.subject)}
      />
    );
  }
  if (!subjects) return <PageLoader label={t("common.loading")} />;

  const best = history?.attempts.reduce((m, a) => Math.max(m, a.score), 0) ?? 0;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-ink via-brand-900 to-brand-700 p-6 text-white sm:p-8">
        <div className="bg-dots absolute inset-0 opacity-20 [filter:invert(1)]" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <ProggaBot size={130} mood="cheer" palette={user?.skin?.palette ?? paletteFor(user?.avatarSkin)} />
          <div className="flex-1">
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-banana-300">{t("arena.eyebrow")}</p>
            <h1 className="mt-1 text-4xl font-extrabold">{t("arena.title")}</h1>
            <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold">
              <span className="rounded-full bg-white/10 px-3 py-1.5">{t("arena.rule1")}</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5">{t("arena.rule2")}</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5">{t("arena.rule3", { n: TIME_LIMIT })}</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5">{t("arena.rule4")}</span>
            </div>
          </div>
          {best > 0 && (
            <div className="rounded-3xl bg-white/10 px-5 py-4 text-center">
              <p className="text-xs font-extrabold uppercase tracking-wider text-banana-300">{t("arena.best")}</p>
              <p className="font-display text-4xl font-extrabold">{n(best)}</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-extrabold">{t("arena.choose")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => start(s)}
              disabled={!!starting}
              className="card group flex items-center gap-4 p-4 text-left transition-all hover:-translate-y-1 hover:shadow-lift disabled:opacity-60"
            >
              <SubjectIcon icon={s.icon} color={s.color} size={56} />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-extrabold">{ui === "bn" ? s.nameBn : s.name}</p>
                <p className="text-sm text-ink-muted">{ui === "bn" ? s.name : s.nameBn}</p>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                {starting === s.id ? <Spinner size={18} /> : <ArrowRight size={18} />}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function Round({ game, onExit, onReplay }: { game: Game; onExit: () => void; onReplay: () => void }) {
  const { celebrate, toast } = useCelebrate();
  const { t, n } = useT();
  const [attempt, setAttempt] = useState(game.attempt);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [left, setLeft] = useState(TIME_LIMIT);
  const [submitting, setSubmitting] = useState(false);
  const [final, setFinal] = useState<AnswerResult | null>(null);
  const startedAt = useRef(Date.now());

  const q = game.questions[index];

  const submit = useCallback(
    async (choice: number) => {
      if (submitting || result) return;
      setSubmitting(true);
      setChosen(choice);
      try {
        const r = await api<AnswerResult>(`/quiz/${attempt.id}/answer`, { body: { questionId: q.id, choice, ms: Date.now() - startedAt.current } });
        setResult(r);
        setAttempt(r.attempt);
        if (r.correct && r.attempt.combo >= 3) toast(t("arena.combo", { n: r.attempt.combo }), "⚡", "banana");
        if (r.attempt.finished) celebrate(r.rewards, { confetti: (r.summary?.accuracy ?? 0) >= 0.75 });
      } catch (e) {
        toast(errorMessage(e), "⚠️", "coral");
        setChosen(null);
      } finally {
        setSubmitting(false);
      }
    },
    [attempt.id, q, result, submitting, celebrate, toast, t],
  );

  // countdown
  useEffect(() => {
    if (result || final) return;
    startedAt.current = Date.now();
    setLeft(TIME_LIMIT);
    const timer = setInterval(() => {
      const remaining = TIME_LIMIT - (Date.now() - startedAt.current) / 1000;
      setLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        clearInterval(timer);
        void submit(-1);
      }
    }, 100);
    return () => clearInterval(timer);
    // restart only for a new question; answering (result) stops the clock via cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, final, result === null]);

  function next() {
    if (result?.attempt.finished) {
      setFinal(result);
      return;
    }
    setResult(null);
    setChosen(null);
    setIndex((i) => i + 1);
  }

  if (final) return <Results game={game} result={final} onExit={onExit} onReplay={onReplay} />;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button onClick={onExit} className="btn-ghost btn-sm">{t("arena.quit")}</button>
        <div className="flex items-center gap-1" aria-label={t("arena.heartsLeft", { n: attempt.hearts })}>
          {Array.from({ length: 3 }, (_, i) => (
            <Heart key={i} size={26} className={i < attempt.hearts ? "fill-coral-500 text-coral-500" : "text-line"} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {attempt.combo >= 2 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="chip border-banana-300 bg-banana-100 text-banana-700">
                <Zap size={15} className="fill-banana-500" /> {n(attempt.combo)}×
              </motion.span>
            )}
          </AnimatePresence>
          <span className="chip border-brand-100 bg-white font-display text-lg text-brand-600">{n(attempt.score)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-extrabold text-ink-muted">Q{n(index + 1)}/{n(game.questions.length)}</span>
        <ProgressBar value={left / TIME_LIMIT} height="h-3" color={left < 5 ? "bg-coral-500" : "bg-brand-500"} className="flex-1" />
        <span className={clsx("flex w-12 items-center gap-1 text-sm font-extrabold", left < 5 ? "text-coral-600" : "text-ink-muted")}>
          <Timer size={15} /> {n(Math.ceil(left))}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="card p-6 sm:p-8">
          <p className="eyebrow">{game.subject.icon} {q.topic}</p>
          <h2 className="mt-2 text-2xl font-extrabold leading-snug sm:text-3xl">{q.prompt}</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {q.options.map((o, i) => {
              const isAnswer = result && i === result.answerIndex;
              const isWrongPick = result && chosen === i && !result.correct;
              return (
                <button
                  key={i}
                  disabled={!!result || submitting}
                  onClick={() => submit(i)}
                  className={clsx(
                    "flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left text-lg font-bold transition-all active:scale-[0.98] [&>span]:text-white",
                    !result && OPTION_STYLES[i % 4],
                    isAnswer && "border-mint-500 bg-mint-100 [&>span]:bg-mint-500",
                    isWrongPick && "animate-wiggle border-coral-500 bg-coral-100 [&>span]:bg-coral-500",
                    result && !isAnswer && !isWrongPick && "border-line bg-white opacity-50 [&>span]:bg-ink-muted",
                  )}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl font-display font-extrabold">{String.fromCharCode(65 + i)}</span>
                  {o}
                </button>
              );
            })}
          </div>

          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className={clsx("flex-1 rounded-2xl p-4", result.correct ? "bg-mint-50" : "bg-coral-50")}>
                <p className={clsx("font-display text-lg font-extrabold", result.correct ? "text-mint-700" : "text-coral-600")}>
                  {result.correct ? t("arena.correctPts", { n: result.points }) : chosen === -1 ? t("arena.timeUp") : t("arena.notThisTime")}
                </p>
                <p className="text-ink-soft">{result.explanation}</p>
              </div>
              <button onClick={next} className="btn-primary" autoFocus>
                {result.attempt.finished ? t("arena.seeResults") : t("arena.next")} <ArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Results({ game, result, onExit, onReplay }: { game: Game; result: AnswerResult; onExit: () => void; onReplay: () => void }) {
  const { t, n, ui } = useT();
  const a = result.attempt;
  const acc = result.summary?.accuracy ?? 0;
  const stars = acc >= 0.9 ? 3 : acc >= 0.6 ? 2 : acc > 0 ? 1 : 0;
  return (
    <div className="mx-auto max-w-xl">
      <div className="card p-8 text-center">
        <div className="flex justify-center">
          <ProggaBot size={150} mood={stars >= 2 ? "cheer" : "oops"} />
        </div>
        <div className="mt-2 flex justify-center gap-2 text-5xl">
          {[0, 1, 2].map((i) => (
            <motion.span key={i} initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2 + i * 0.2, type: "spring" }} className={i < stars ? "" : "opacity-20 grayscale"}>
              ⭐
            </motion.span>
          ))}
        </div>
        <h1 className="mt-3 text-4xl font-extrabold">
          {result.summary?.perfect ? t("arena.perfect") : result.summary?.outOfHearts ? t("arena.outOfHearts") : stars >= 2 ? t("arena.great") : t("arena.goodTry")}
        </h1>
        <p className="mt-1 text-ink-soft">{game.subject.icon} {ui === "bn" ? game.subject.nameBn : game.subject.name}</p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            [t("arena.score"), n(a.score)],
            [t("arena.correct"), `${n(a.correctCount)}/${n(a.total)}`],
            [t("arena.bestCombo"), `${n(a.bestCombo)}×`],
          ].map(([label, v]) => (
            <div key={label} className="rounded-2xl bg-cream p-3">
              <p className="font-display text-2xl font-extrabold">{v}</p>
              <p className="text-xs font-bold text-ink-muted">{label}</p>
            </div>
          ))}
        </div>
        {result.rewards && (
          <p className="mt-5 font-display text-lg font-extrabold text-brand-600">
            +{n(result.rewards.xpGained)} XP · +{n(result.rewards.coinsGained)} 🍌
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button onClick={onReplay} className="btn-primary flex-1"><RotateCcw size={18} /> {t("arena.playAgain")}</button>
          <button onClick={onExit} className="btn-ghost flex-1">{t("arena.change")}</button>
        </div>
      </div>
    </div>
  );
}
