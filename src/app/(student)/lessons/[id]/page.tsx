"use client";

import clsx from "clsx";
import { ArrowLeft, CheckCircle2, Clock, Play, Trophy } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import useSWR from "swr";
import { useCelebrate } from "@/components/celebrate/CelebrationProvider";
import { LessonTile } from "@/components/cards";
import { AskProggaCard } from "@/components/lessons/AskProggaCard";
import { CourseTopic } from "@/components/lessons/CourseTopic";
import { CheckpointModal, CheckpointTimeline, WATCH_RATIO, useLessonVideo } from "@/components/lessons/useLessonVideo";
import { VideoPlayer } from "@/components/lessons/VideoPlayer";
import { PageLoader, ProgressBar, Spinner, SubjectIcon } from "@/components/ui/primitives";
import { useFormat, useT } from "@/i18n";
import { api, errorMessage } from "@/lib/api";
import type { LessonResponse, Rewards } from "@/lib/types";

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, mutate } = useSWR<LessonResponse>(`/lessons/${id}`);
  const { t } = useT();

  if (!data) return <PageLoader label={t("lessons.loading")} />;
  const refresh = () => void mutate();
  // key: moving to the next topic starts the video state fresh
  return data.course ? (
    <CourseTopic key={id} data={{ ...data, course: data.course }} refresh={refresh} />
  ) : (
    <StandaloneLesson key={id} data={data} refresh={refresh} />
  );
}

/** A quick video lesson that isn't part of a course: watch, answer checkpoints, complete. */
function StandaloneLesson({ data, refresh }: { data: LessonResponse; refresh: () => void }) {
  const { lesson, progress } = data;
  const { celebrate, toast } = useCelebrate();
  const { t, n } = useT();
  const { duration, gradeLabel } = useFormat();
  const video = useLessonVideo(lesson, progress, refresh);
  const [completing, setCompleting] = useState(false);
  const canComplete = progress.canComplete || video.watchedSec >= lesson.durationSec * WATCH_RATIO;

  async function complete() {
    setCompleting(true);
    try {
      await video.flush();
      const r = await api<{ rewards: Rewards }>(`/lessons/${lesson.id}/complete`, { method: "POST" });
      celebrate(r.rewards, { confetti: true });
      refresh();
    } catch (e) {
      toast(errorMessage(e), "⚠️", "coral");
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <Link href="/lessons" className="inline-flex items-center gap-1.5 font-bold text-ink-soft hover:text-ink">
        <ArrowLeft size={18} /> {t("lessons.back")}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <VideoPlayer ref={video.player} provider={lesson.provider} src={lesson.videoUrl} onTime={video.onTime} onEnded={video.onEnded} />
          <CheckpointTimeline lesson={lesson} video={video} />

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
                <ProgressBar value={Math.min(1, video.watchedPct / WATCH_RATIO)} className="mt-4" color="bg-brand-500" />
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
                  <span className={clsx("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold", video.answered.has(c.index) ? "bg-mint-500 text-white" : "bg-banana-100 text-banana-700")}>
                    {video.answered.has(c.index) ? "✓" : n(c.index + 1)}
                  </span>
                  <div>
                    <p className="flex items-center gap-1 text-xs font-bold text-ink-muted"><Clock size={12} /> {duration(c.atSec)}</p>
                    <p className="text-sm font-semibold">{video.answered.has(c.index) ? c.question : t("lessons.answerWhenPause")}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <AskProggaCard lesson={{ id: lesson.id, title: lesson.title, subjectId: lesson.subject.id }} done={progress.completed} compact />
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

      <CheckpointModal video={video} />
    </div>
  );
}
