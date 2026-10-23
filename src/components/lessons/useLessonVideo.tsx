"use client";

import clsx from "clsx";
import { Play, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { useCelebrate } from "@/components/celebrate/CelebrationProvider";
import type { PlayerHandle } from "@/components/lessons/VideoPlayer";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/primitives";
import { useFormat, useT } from "@/i18n";
import { api, errorMessage } from "@/lib/api";
import type { Checkpoint, LessonDetail, Rewards } from "@/lib/types";

/** Share of the video that counts as watched (mirrors the backend). */
export const WATCH_RATIO = 0.8;
const SYNC_EVERY_SEC = 10;

type CpResult = { correct: boolean; explanation: string } | null;
interface ProgressSync {
  watchedSec: number;
  canComplete: boolean;
  completed?: boolean;
  rewards?: Rewards | null;
}

/**
 * Watching a lesson video: syncs how far the student got, pauses at checkpoint
 * questions and checks their answers. `refresh` reloads the lesson.
 */
export function useLessonVideo(lesson: LessonDetail, saved: { watchedSec: number; canComplete: boolean }, refresh: () => void) {
  const { celebrate, toast } = useCelebrate();
  const player = useRef<PlayerHandle>(null);
  const maxWatched = useRef(0);
  const lastPosted = useRef(0);
  const shown = useRef(new Set<number>());
  const [watched, setWatched] = useState(0);
  const [active, setActive] = useState<Checkpoint | null>(null);
  const [result, setResult] = useState<CpResult>(null);
  const [answering, setAnswering] = useState(false);

  const answered = new Set(lesson.checkpoints.filter((c) => c.answered).map((c) => c.index));
  const watchedSec = Math.max(watched, saved.watchedSec);
  const threshold = lesson.durationSec * WATCH_RATIO;

  async function postProgress(sec: number) {
    lastPosted.current = sec;
    try {
      const r = await api<ProgressSync>(`/lessons/${lesson.id}/progress`, { body: { watchedSec: Math.floor(sec) } });
      if (r.rewards) celebrate(r.rewards, { confetti: true });
      if (r.canComplete !== saved.canComplete || r.rewards) refresh();
    } catch {
      /* progress sync is best-effort */
    }
  }

  function onTime(time: number) {
    if (time > maxWatched.current) {
      maxWatched.current = time;
      setWatched(time);
      // sync regularly, and right away when the video starts to count as watched
      const crossed = time >= threshold && lastPosted.current < threshold;
      if (time - lastPosted.current >= SYNC_EVERY_SEC || crossed) void postProgress(time);
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
      const r = await api<{ correct: boolean; explanation: string; rewards: Rewards | null }>(`/lessons/${lesson.id}/checkpoints/${active.index}`, { body: { choice } });
      setResult(r);
      if (r.correct) {
        celebrate(r.rewards);
        refresh();
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

  return {
    player,
    answered,
    watchedSec,
    watchedPct: watchedSec / lesson.durationSec,
    videoDone: watchedSec >= threshold,
    onTime,
    onEnded: () => void postProgress(lesson.durationSec),
    /** sync the furthest point watched (e.g. before completing) */
    flush: () => postProgress(Math.max(maxWatched.current, saved.watchedSec)),
    checkpoint: { active, result, answering, answer, close: closeCheckpoint },
  };
}

type LessonVideo = ReturnType<typeof useLessonVideo>;

/** Watched bar with a marker per checkpoint question. */
export function CheckpointTimeline({ lesson, video }: { lesson: LessonDetail; video: LessonVideo }) {
  const { t } = useT();
  const { duration } = useFormat();
  return (
    <div className="relative px-1">
      <ProgressBar value={video.watchedPct} height="h-2.5" color="bg-coral-500" track="bg-coral-50" />
      {lesson.checkpoints.map((c) => (
        <span
          key={c.index}
          className={clsx(
            "absolute top-1/2 grid h-5 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white text-[10px] shadow",
            video.answered.has(c.index) ? "bg-mint-500 text-white" : "bg-banana-400",
          )}
          style={{ left: `${(c.atSec / lesson.durationSec) * 100}%` }}
          title={t("lessons.cpAt", { time: duration(c.atSec) })}
        >
          {video.answered.has(c.index) ? "✓" : "?"}
        </span>
      ))}
    </div>
  );
}

/** The question that pops up when the video pauses at a checkpoint. */
export function CheckpointModal({ video }: { video: LessonVideo }) {
  const { t } = useT();
  const { duration } = useFormat();
  const { active, result, answering, answer, close } = video.checkpoint;
  return (
    <Modal open={!!active} onClose={() => close()} dismissable={false} wide>
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
              <button className="btn-primary" onClick={() => close()}>
                <Play size={18} /> {t("lessons.continue")}
              </button>
            ) : (
              <>
                <button className="btn-ghost" onClick={() => close(true)}>
                  <RotateCcw size={17} /> {t("lessons.rewind")}
                </button>
                <button className="btn-ghost" onClick={() => close()}>
                  {t("lessons.skip")}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
