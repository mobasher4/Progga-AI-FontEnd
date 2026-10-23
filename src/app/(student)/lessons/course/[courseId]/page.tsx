"use client";

import clsx from "clsx";
import { ArrowLeft, BookOpen, Check, ChevronDown, ChevronRight, Clock, FileText, HelpCircle, Layers, PlayCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import useSWR from "swr";
import { useBilingual } from "@/components/lessons/CourseCard";
import { PageLoader, ProgressBar } from "@/components/ui/primitives";
import { useFormat, useT } from "@/i18n";
import type { CourseChapter, CourseResponse } from "@/lib/types";

/** Coursera-style course page: hero, then the syllabus as chapters → topics (video + reading). */
export default function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { data } = useSWR<CourseResponse>(`/courses/${courseId}`);
  const { t, n } = useT();
  const { gradeLabel, duration } = useFormat();
  const pick = useBilingual();
  const [open, setOpen] = useState<Set<string> | null>(null);

  if (!data) return <PageLoader label={t("lessons.loadingCourse")} />;
  const { course, chapters, stats, next } = data;
  const color = course.subject.color;
  const pct = Math.round((stats.completed / Math.max(1, stats.topics)) * 100);
  // until the student toggles, open the chapter they're up to
  const openIds = open ?? new Set(chapters.filter((c) => c.topics.some((tp) => tp.id === next?.id)).map((c) => c.id));
  const toggle = (id: string) => {
    const s = new Set(openIds);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setOpen(s);
  };
  const xpPerTopic = chapters[0]?.topics[0]?.xpReward ?? 0;

  return (
    <div className="space-y-6">
      <Link href="/lessons" className="inline-flex items-center gap-1.5 font-bold text-ink-soft hover:text-ink">
        <ArrowLeft size={18} /> {t("lessons.allCourses")}
      </Link>

      <div className="card overflow-hidden">
        <div className="relative overflow-hidden p-6 text-white sm:p-8" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
          <div className="bg-dots absolute inset-0 opacity-25 [filter:invert(1)]" />
          <span className="absolute -bottom-8 -right-2 text-[150px] leading-none opacity-90 drop-shadow-lg sm:text-[180px]" aria-hidden>
            {course.subject.icon}
          </span>
          <div className="relative max-w-2xl pr-20 sm:pr-36">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold text-ink">{gradeLabel(course.grade)} · NCTB</span>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">{pick(course.title, course.titleBn)}</h1>
            <p className="mt-1 text-sm font-bold text-white/85">{course.book}</p>
            <p className="mt-3 text-white/90">{course.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-extrabold">
              <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5"><BookOpen size={14} /> {t("lessons.chaptersN", { n: stats.chapters })}</span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5"><Layers size={14} /> {t("lessons.topicsN", { n: stats.topics })}</span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5"><Clock size={14} /> {t("lessons.videoTime", { time: duration(stats.videoSec) })}</span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5"><FileText size={14} /> {t("lessons.readingMin", { n: stats.readingMin })}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <div className="mb-1.5 flex items-center justify-between text-sm font-bold">
              <span>{t("lessons.courseDone", { a: stats.completed, b: stats.topics })}</span>
              <span className="text-mint-700">{t("lessons.percentDone", { n: pct })}</span>
            </div>
            <ProgressBar value={pct / 100} height="h-2.5" color="bg-mint-500" track="bg-mint-50" />
          </div>
          {next && (
            <Link href={`/lessons/${next.id}`} className="btn-primary shrink-0 justify-center">
              <PlayCircle size={18} />
              <span className="truncate">{next.started ? `${t("lessons.resume")}: ${next.title}` : t("lessons.startLearning")}</span>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="space-y-3">
          <div>
            <h2 className="text-2xl font-extrabold">{t("lessons.syllabus")}</h2>
            <p className="text-sm text-ink-soft">{t("lessons.syllabusBody", { n: stats.chapters })}</p>
          </div>
          {chapters.map((ch) => chapterRow(ch, openIds.has(ch.id)))}
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <p className="eyebrow mb-3">{t("lessons.whatsInside")}</p>
            <ul className="space-y-2.5 text-sm font-semibold">
              <li className="flex items-center gap-2.5"><PlayCircle size={18} className="text-coral-500" /> {t("lessons.insideVideos", { n: stats.topics })}</li>
              <li className="flex items-center gap-2.5"><FileText size={18} className="text-sky-600" /> {t("lessons.insideReadings", { n: stats.topics })}</li>
              <li className="flex items-center gap-2.5"><HelpCircle size={18} className="text-banana-600" /> {t("lessons.insideCheckpoints", { n: stats.checkpoints })}</li>
              <li className="flex items-center gap-2.5"><Sparkles size={18} className="text-grape-500" /> {t("lessons.insideXp", { n: xpPerTopic })}</li>
            </ul>
            <p className="mt-4 rounded-2xl bg-grape-50 p-3 text-xs font-semibold text-grape-700">{t("lessons.howItWorks")}</p>
          </div>
          <Link href={`/tutor?subject=${course.subject.id}`} className="card flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-grape-500 text-white"><Sparkles size={20} /></span>
            <span>
              <span className="block font-display font-bold">{t("lessons.confused")}</span>
              <span className="text-sm text-ink-soft">{t("lessons.workThrough")}</span>
            </span>
          </Link>
        </aside>
      </div>
    </div>
  );

  function chapterRow(chapter: CourseChapter, open: boolean) {
    const nextId = next?.id;
    const onToggle = () => toggle(chapter.id);
    const done = chapter.topics.filter((tp) => tp.completed).length;
    const all = done === chapter.topics.length && done > 0;
    const videoSec = chapter.topics.reduce((s, tp) => s + tp.durationSec, 0);
    const readMin = chapter.topics.reduce((s, tp) => s + tp.readingMin, 0);
    return (
      <div key={chapter.id} className="card overflow-hidden">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-cream/60">
          <span
            className={clsx("grid h-11 w-11 shrink-0 place-items-center rounded-2xl font-display text-lg font-extrabold", all && "bg-mint-500 text-white")}
            style={all ? undefined : { background: `${color}1f`, color }}
          >
            {all ? <Check size={20} strokeWidth={3} /> : n(chapter.number)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-extrabold uppercase tracking-wider text-ink-muted">{t("lessons.chapterN", { n: chapter.number })}</span>
            <span className="block font-display text-lg font-bold leading-snug">{pick(chapter.title, chapter.titleBn)}</span>
            <span className="mt-0.5 block text-xs font-bold text-ink-muted">
              {t("lessons.topicsN", { n: chapter.topics.length })} · {t("lessons.videoTime", { time: duration(videoSec) })} · {t("lessons.readingMin", { n: readMin })}
            </span>
          </span>
          <span className="hidden shrink-0 text-sm font-extrabold text-ink-muted sm:block">{n(done)}/{n(chapter.topics.length)}</span>
          <ChevronDown size={20} className={clsx("shrink-0 text-ink-muted transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <div className="border-t border-line bg-cream/30">
            <p className="px-5 pt-3 text-sm text-ink-soft">{chapter.summary}</p>
            <ol className="p-2">
              {chapter.topics.map((tp, i) => (
                <li key={tp.id}>
                  <Link
                    href={`/lessons/${tp.id}`}
                    className={clsx("group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-white", tp.id === nextId && "bg-white ring-2 ring-grape-200")}
                  >
                    <span
                      className={clsx(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-extrabold",
                        tp.completed ? "bg-mint-500 text-white" : "border-2 border-line bg-white text-ink-muted",
                      )}
                    >
                      {tp.completed ? <Check size={15} strokeWidth={3} /> : n(i + 1)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold leading-snug">{tp.title}</span>
                      <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs font-semibold text-ink-muted">
                        <span className={clsx("flex items-center gap-1", tp.videoDone && "text-mint-700")}>
                          {tp.videoDone ? <Check size={12} strokeWidth={3} /> : <PlayCircle size={12} />} {t("lessons.video")} · {duration(tp.durationSec)}
                        </span>
                        {tp.hasReading && (
                          <span className={clsx("flex items-center gap-1", tp.readDone && "text-mint-700")}>
                            {tp.readDone ? <Check size={12} strokeWidth={3} /> : <FileText size={12} />} {t("lessons.reading")} · {t("lessons.readingMin", { n: tp.readingMin })}
                          </span>
                        )}
                        {tp.checkpoints > 0 && (
                          <span className="flex items-center gap-1"><HelpCircle size={12} /> {n(tp.checkpoints)}</span>
                        )}
                      </span>
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  }
}
