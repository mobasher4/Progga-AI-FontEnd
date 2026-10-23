"use client";

import clsx from "clsx";
import { ArrowLeft, ArrowRight, Check, ChevronDown, FileText, ListTree, PlayCircle, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useCelebrate } from "@/components/celebrate/CelebrationProvider";
import { useBilingual } from "@/components/lessons/CourseCard";
import { CheckpointModal, CheckpointTimeline, useLessonVideo } from "@/components/lessons/useLessonVideo";
import { VideoPlayer } from "@/components/lessons/VideoPlayer";
import { Markdown } from "@/components/ui/Markdown";
import { Spinner } from "@/components/ui/primitives";
import { useFormat, useT } from "@/i18n";
import { api, errorMessage } from "@/lib/api";
import type { LessonResponse, Rewards, TopicContext } from "@/lib/types";

/** One course topic, Coursera-style: outline on the side, then the video and the written notes. */
export function CourseTopic({ data, refresh }: { data: LessonResponse & { course: TopicContext }; refresh: () => void }) {
  const { lesson, progress, course: ctx } = data;
  const { t } = useT();
  const { gradeLabel, duration } = useFormat();
  const { celebrate, toast } = useCelebrate();
  const pick = useBilingual();
  const video = useLessonVideo(lesson, progress, refresh);
  const [marking, setMarking] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  // what /read just told us, shown right away instead of waiting for the reload
  const [readNow, setReadNow] = useState<{ completed: boolean } | null>(null);

  const chapter = ctx.outline.find((c) => c.id === ctx.chapterId);
  const courseTitle = pick(ctx.course.title, ctx.course.titleBn);
  const hasReading = lesson.body.length > 0;
  const videoDone = video.videoDone;
  const readDone = progress.readDone || !!readNow;
  const completed = progress.completed || !!readNow?.completed;

  async function markRead() {
    setMarking(true);
    try {
      const r = await api<{ completed: boolean; rewards: Rewards | null }>(`/lessons/${lesson.id}/read`, { method: "POST" });
      setReadNow({ completed: r.completed });
      if (r.rewards) celebrate(r.rewards, { confetti: true });
      refresh();
    } catch (e) {
      toast(errorMessage(e), "⚠️", "coral");
    } finally {
      setMarking(false);
    }
  }

  const outline = <Outline ctx={ctx} currentId={lesson.id} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/lessons/course/${ctx.course.id}`} className="inline-flex min-w-0 items-center gap-1.5 font-bold text-ink-soft hover:text-ink">
          <ArrowLeft size={18} className="shrink-0" />
          <span className="truncate">{courseTitle} · {gradeLabel(ctx.course.grade)}</span>
        </Link>
        <button type="button" onClick={() => setOutlineOpen((v) => !v)} className="btn-ghost lg:hidden" aria-expanded={outlineOpen}>
          <ListTree size={17} /> {t("lessons.outline")}
        </button>
      </div>

      {outlineOpen && <div className="lg:hidden">{outline}</div>}

      <div className="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">{outline}</div>
        </aside>

        <div className="min-w-0 space-y-5">
          <header>
            {chapter && (
              <p className="text-xs font-extrabold uppercase tracking-wider text-ink-muted">
                {t("lessons.chapterN", { n: chapter.number })} · {pick(chapter.title, chapter.titleBn)}
              </p>
            )}
            <h1 className="mt-1 text-3xl font-extrabold leading-tight sm:text-4xl">{lesson.title}</h1>
          </header>

          {/* Item 1: video */}
          <section className="space-y-3">
            <ItemHeading icon={<PlayCircle size={18} className="text-coral-500" />} label={t("lessons.video")} meta={duration(lesson.durationSec)} done={videoDone} />
            <VideoPlayer ref={video.player} provider={lesson.provider} src={lesson.videoUrl} onTime={video.onTime} onEnded={video.onEnded} />
            <CheckpointTimeline lesson={lesson} video={video} />
          </section>

          {/* What's left to finish the topic */}
          {completed ? (
            <div className="flex items-center gap-3 rounded-3xl border-2 border-mint-300 bg-mint-50 p-4">
              <Trophy className="shrink-0 text-banana-500" size={30} />
              <p className="font-display text-lg font-extrabold text-mint-700">{t("lessons.topicDone", { n: lesson.xpReward })}</p>
            </div>
          ) : (
            <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <p className="font-display font-extrabold">{t("lessons.toFinish")}</p>
              <div className="flex flex-wrap gap-2">
                <Todo done={videoDone} label={t("lessons.todoVideo")} />
                {hasReading && <Todo done={readDone} label={t("lessons.todoRead")} />}
              </div>
              <span className="text-sm font-extrabold text-brand-500 sm:ml-auto">+{lesson.xpReward} XP</span>
            </div>
          )}

          {/* Item 2: written notes */}
          {hasReading && (
            <section className="card p-5 sm:p-7">
              <ItemHeading icon={<FileText size={18} className="text-sky-600" />} label={t("lessons.notes")} meta={t("lessons.readingMin", { n: lesson.readingMin })} done={readDone} />
              <div className="mt-4">
                <Markdown className="prose-lesson">{lesson.body}</Markdown>
              </div>
              <div className="mt-6 flex justify-end border-t border-line pt-4">
                {readDone ? (
                  <span className="flex items-center gap-1.5 font-extrabold text-mint-700"><Check size={18} strokeWidth={3} /> {t("lessons.readDone")}</span>
                ) : (
                  <button className="btn-mint" onClick={markRead} disabled={marking}>
                    {marking ? <Spinner /> : <><Check size={18} /> {t("lessons.markRead")}</>}
                  </button>
                )}
              </div>
            </section>
          )}

          <nav className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            {ctx.prev ? (
              <Link href={`/lessons/${ctx.prev.id}`} className="card flex min-w-0 items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift sm:max-w-[48%]">
                <ArrowLeft size={20} className="shrink-0 text-ink-muted" />
                <span className="min-w-0">
                  <span className="block text-xs font-extrabold uppercase tracking-wider text-ink-muted">{t("lessons.prevTopic")}</span>
                  <span className="block truncate font-bold">{ctx.prev.title}</span>
                </span>
              </Link>
            ) : <span />}
            {ctx.next ? (
              <Link href={`/lessons/${ctx.next.id}`} className="card flex min-w-0 items-center justify-end gap-3 p-4 text-right transition-all hover:-translate-y-0.5 hover:shadow-lift sm:max-w-[48%]">
                <span className="min-w-0">
                  <span className="block text-xs font-extrabold uppercase tracking-wider text-brand-600">{t("lessons.nextTopic")}</span>
                  <span className="block truncate font-bold">{ctx.next.title}</span>
                </span>
                <ArrowRight size={20} className="shrink-0 text-brand-600" />
              </Link>
            ) : (
              <p className="card p-4 font-display font-extrabold text-mint-700">{t("lessons.courseEnd")}</p>
            )}
          </nav>

          <Link href={`/tutor?subject=${ctx.course.subject.id}`} className="card flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-500 text-white"><Sparkles size={20} /></span>
            <span>
              <span className="block font-display font-bold">{t("lessons.askAbout")}</span>
              <span className="text-sm text-ink-soft">{t("lessons.workThrough")}</span>
            </span>
          </Link>
        </div>
      </div>

      <CheckpointModal video={video} />
    </div>
  );
}

function ItemHeading({ icon, label, meta, done }: { icon: React.ReactNode; label: string; meta: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <p className="font-display font-extrabold">{label}</p>
      <span className="text-sm font-semibold text-ink-muted">· {meta}</span>
      {done && (
        <span className="ml-auto flex items-center gap-1 rounded-full bg-mint-50 px-2.5 py-1 text-xs font-extrabold text-mint-700">
          <Check size={13} strokeWidth={3} />
        </span>
      )}
    </div>
  );
}

function Todo({ done, label }: { done: boolean; label: string }) {
  return (
    <span className={clsx("flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-bold", done ? "border-mint-300 bg-mint-50 text-mint-700" : "border-line bg-white text-ink-soft")}>
      {done ? <Check size={14} strokeWidth={3} /> : <span className="h-3 w-3 rounded-full border-2 border-ink-muted/50" />}
      {label}
    </span>
  );
}

/** Course outline: every chapter (the current one open) with its topics and checkmarks. */
function Outline({ ctx, currentId }: { ctx: TopicContext; currentId: string }) {
  const { t, n } = useT();
  const pick = useBilingual();
  const [open, setOpen] = useState(() => new Set([ctx.chapterId]));
  const toggle = (id: string) =>
    setOpen((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });

  return (
    <div className="card overflow-hidden">
      <p className="border-b border-line px-4 py-3 font-display font-extrabold">{t("lessons.outline")}</p>
      <ol>
        {ctx.outline.map((ch) => {
          const done = ch.topics.filter((tp) => tp.completed).length;
          const isOpen = open.has(ch.id);
          return (
            <li key={ch.id} className="border-b border-line last:border-0">
              <button type="button" onClick={() => toggle(ch.id)} aria-expanded={isOpen} className="flex w-full items-start gap-2.5 px-4 py-3 text-left hover:bg-cream/60">
                <span className={clsx("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[11px] font-extrabold", done === ch.topics.length && done > 0 ? "bg-mint-500 text-white" : "bg-cream text-ink-soft")}>
                  {done === ch.topics.length && done > 0 ? <Check size={13} strokeWidth={3} /> : n(ch.number)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={clsx("block text-sm font-bold leading-snug", ch.id === ctx.chapterId && "text-brand-700")}>{pick(ch.title, ch.titleBn)}</span>
                  <span className="text-xs font-semibold text-ink-muted">{n(done)}/{n(ch.topics.length)}</span>
                </span>
                <ChevronDown size={16} className={clsx("mt-1 shrink-0 text-ink-muted transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <ol className="pb-2">
                  {ch.topics.map((tp) => (
                    <li key={tp.id}>
                      <Link
                        href={`/lessons/${tp.id}`}
                        aria-current={tp.id === currentId ? "page" : undefined}
                        className={clsx(
                          "flex items-center gap-2.5 py-2 pl-6 pr-4 text-sm transition-colors",
                          tp.id === currentId ? "border-l-4 border-brand-500 bg-brand-50 pl-5 font-extrabold text-brand-700" : "font-semibold text-ink-soft hover:bg-cream/60 hover:text-ink",
                        )}
                      >
                        {tp.completed ? (
                          <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-mint-500 text-white"><Check size={10} strokeWidth={4} /></span>
                        ) : (
                          <span className="h-4 w-4 shrink-0 rounded-full border-2 border-ink-muted/40" />
                        )}
                        <span className="min-w-0 flex-1 leading-snug">{tp.title}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
