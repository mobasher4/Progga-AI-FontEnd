"use client";

import clsx from "clsx";
import { ArrowLeft, CheckCircle2, Clock, Play, RotateCcw, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { use, useRef, useState } from "react";
import useSWR from "swr";
import { useCelebrate } from "@/components/celebrate/CelebrationProvider";
import { LessonTile } from "@/components/cards";
import { VideoPlayer, type PlayerHandle } from "@/components/lessons/VideoPlayer";
import { Modal } from "@/components/ui/Modal";
import { PageLoader, ProgressBar, Spinner, SubjectIcon } from "@/components/ui/primitives";
import { useFormat, useT } from "@/i18n";
import { api, errorMessage } from "@/lib/api";
import type { Checkpoint, LessonCard, LessonDetail, Rewards } from "@/lib/types";

interface LessonResponse {
  lesson: LessonDetail;
  progress: { watchedSec: number; completed: boolean; canComplete: boolean };
  related: LessonCard[];
}

type CpResult = { correct: boolean; explanation: string } | null;

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, mutate } = useSWR<LessonResponse>(`/lessons/${id}`);
  const { celebrate, toast } = useCelebrate();
  const { t, n } = useT();
  const { duration, gradeLabel } = useFormat();
  const player = useRef<PlayerHandle>(null);
  const maxWatched = useRef(0);
  const lastPosted = useRef(0);
  const shown = useRef(new Set<number>());
  const [watched, setWatched] = useState(0);
  const [active, setActive] = useState<Checkpoint | null>(null);
  const [result, setResult] = useState<CpResult>(null);
  const [answering, setAnswering] = useState(false);
  const [completing, setCompleting] = useState(false);

  if (!data) return <PageLoader label={t("lessons.loading")} />;
  const { lesson, progress } = data;
  const answered = new Set(lesson.checkpoints.filter((c) => c.answered).map((c) => c.index));
  const canComplete = progress.canComplete || Math.max(watched, progress.watchedSec) >= lesson.durationSec * 0.8;

  async function postProgress(sec: number) {
    lastPosted.current = sec;
    try {
      const r = await api<{ watchedSec: number; canComplete: boolean }>(`/lessons/${id}/progress`, { body: { watchedSec: Math.floor(sec) } });
      if (r.canComplete !== progress.canComplete) void mutate();
    } catch {
      /* progress sync is best-effort */
    }
  }

  function onTime(time: number) {
    if (time > maxWatched.current) {
      maxWatched.current = time;
      setWatched(time);
      if (time - lastPosted.current >= 10) void postProgress(time);
    }
    if (active) return;
    const due = lesson.checkpoints.find((c) => time >= c.atSec && time < c.atSec + 3 && !answered.has(c.index) && !shown.current.has(c.index));
    if (due) {
      shown.current.add(due.index);
      player.current?.pause();
      setResult(null);
      setActive(due);
    }
  }

  async function answer(choice: number) {
    if (!active) return;
    setAnswering(true);
    try {
      const r = await api<{ correct: boolean; explanation: string; rewards: Rewards | null }>(`/lessons/${id}/checkpoints/${active.index}`, { body: { choice } });
      setResult(r);
      if (r.correct) {
        celebrate(r.rewards);
        void mutate();
      }
    } catch (e) {
      toast(errorMessage(e), "⚠️", "coral");
    } finally {
      setAnswering(false);
    }
  }

  function closeCheckpoint(rewind = false) {
    if (rewind && active) {
      shown.current.delete(active.index);
      player.current?.seek(Math.max(0, active.atSec - 15));
    }
    setActive(null);
    setResult(null);
    player.current?.play();
  }

  async function complete() {
    setCompleting(true);
    try {
      await postProgress(Math.max(maxWatched.current, progress.watchedSec));
      const r = await api<{ rewards: Rewards }>(`/lessons/${id}/complete`, { method: "POST" });
      celebrate(r.rewards, { confetti: true });
      void mutate();
    } catch (e) {
      toast(errorMessage(e), "⚠️", "coral");
    } finally {
      setCompleting(false);
    }
  }

  const watchedPct = Math.max(watched, progress.watchedSec) / lesson.durationSec;

  return (
    <div className="space-y-8">
      <Link href="/lessons" className="inline-flex items-center gap-1.5 font-bold text-ink-soft hover:text-ink">
        <ArrowLeft size={18} /> {t("lessons.back")}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <VideoPlayer ref={player} provider={lesson.provider} src={lesson.videoUrl} onTime={onTime} onEnded={() => void postProgress(lesson.durationSec)} />
          {/* timeline with checkpoint markers */}
          <div className="relative px-1">
            <ProgressBar value={watchedPct} height="h-2.5" color="bg-coral-500" track="bg-coral-50" />
            {lesson.checkpoints.map((c) => (
              <span
                key={c.index}
                className={clsx(
                  "absolute top-1/2 grid h-5 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white text-[10px] shadow",
                  answered.has(c.index) ? "bg-mint-500 text-white" : "bg-banana-400",
                )}
                style={{ left: `${(c.atSec / lesson.durationSec) * 100}%` }}
                title={t("lessons.cpAt", { time: duration(c.atSec) })}
              >
                {answered.has(c.index) ? "✓" : "?"}
              </span>
            ))}
          </div>

          <div className="card p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <SubjectIcon icon={lesson.subject.icon} color={lesson.subject.color} size={52} />
              <div className="flex-1">
                <p className="text-xs font-extrabold uppercase tracking-wider text-ink-muted">
                  {lesson.subject.name} · {gradeLabel(lesson.grade)} · {lesson.chapter}
                </p>
                <h1 className="mt-1 text-3xl font-extrabold leading-tight">{lesson.title}</h1>
                <p className="mt-2 text-ink-soft">{lesson.description}</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            {progress.completed ? (
              <div className="text-center">
                <Trophy className="mx-auto text-banana-500" size={40} />
                <p className="mt-2 font-display text-xl font-extrabold">{t("lessons.completeTitle")}</p>
                <p className="text-sm text-ink-soft">{t("lessons.earned", { n: lesson.xpReward })}</p>
              </div>
            ) : (
              <>
                <p className="font-display text-lg font-extrabold">{t("lessons.finishEarn", { n: lesson.xpReward })}</p>
                <p className="mt-1 text-sm text-ink-soft">{t("lessons.rule")}</p>
                <ProgressBar value={Math.min(1, watchedPct / 0.8)} className="mt-4" color="bg-grape-500" />
                <button onClick={complete} disabled={!canComplete || completing} className="btn-mint mt-4 w-full">
                  {completing ? <Spinner /> : canComplete ? <><CheckCircle2 size={18} /> {t("lessons.complete")}</> : <><Play size={18} /> {t("lessons.keepWatching")}</>}
                </button>
              </>
            )}
          </div>

          <div className="card p-5">
            <p className="eyebrow mb-3">{t("lessons.checkpoints")}</p>
            <ul className="space-y-2.5">
              {lesson.checkpoints.map((c) => (
                <li key={c.index} className="flex items-start gap-3">
                  <span className={clsx("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold", answered.has(c.index) ? "bg-mint-500 text-white" : "bg-banana-100 text-banana-700")}>
                    {answered.has(c.index) ? "✓" : n(c.index + 1)}
                  </span>
                  <div>
                    <p className="flex items-center gap-1 text-xs font-bold text-ink-muted"><Clock size={12} /> {duration(c.atSec)}</p>
                    <p className="text-sm font-semibold">{answered.has(c.index) ? c.question : t("lessons.answerWhenPause")}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <Link href={`/tutor?subject=${lesson.subject.id}`} className="card flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-grape-500 text-white"><Sparkles size={20} /></span>
            <span>
              <span className="block font-display font-bold">{t("lessons.confused")}</span>
              <span className="text-sm text-ink-soft">{t("lessons.workThrough")}</span>
            </span>
          </Link>
        </aside>
      </div>

      {data.related.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-extrabold">{t("lessons.upNext")}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {data.related.map((l) => <LessonTile key={l.id} lesson={l} />)}
          </div>
        </section>
      )}

      <Modal open={!!active} onClose={() => closeCheckpoint()} dismissable={false} wide>
        {active && (
          <div>
            <p className="eyebrow">{t("lessons.cpEyebrow", { time: duration(active.atSec) })}</p>
            <h2 className="mt-2 text-2xl font-extrabold leading-snug">{active.question}</h2>
            <div className="mt-5 grid gap-2.5">
              {active.options.map((o, i) => (
                <button
                  key={i}
                  onClick={() => answer(i)}
                  disabled={answering || result?.correct}
                  className="flex items-center gap-3 rounded-2xl border-2 border-line bg-white px-4 py-3 text-left font-semibold transition-all hover:border-grape-300 hover:bg-grape-50 disabled:opacity-60"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-grape-50 font-display font-extrabold text-grape-600">{String.fromCharCode(65 + i)}</span>
                  {o}
                </button>
              ))}
            </div>
            {result && (
              <div className={clsx("mt-4 rounded-2xl border-2 p-4", result.correct ? "border-mint-300 bg-mint-50" : "border-coral-100 bg-coral-50")}>
                <p className={clsx("font-display text-lg font-extrabold", result.correct ? "text-mint-700" : "text-coral-600")}>
                  {result.correct ? t("lessons.spotOn") : t("lessons.notQuite")}
                </p>
                <p className="mt-1 text-ink-soft">{result.correct ? result.explanation : t("lessons.clue")}</p>
              </div>
            )}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {result?.correct ? (
                <button className="btn-primary" onClick={() => closeCheckpoint()}><Play size={18} /> {t("lessons.continue")}</button>
              ) : (
                <>
                  <button className="btn-ghost" onClick={() => closeCheckpoint(true)}><RotateCcw size={17} /> {t("lessons.rewind")}</button>
                  <button className="btn-ghost" onClick={() => closeCheckpoint()}>{t("lessons.skip")}</button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
