"use client";

import { ArrowRight, BookOpen, Clock, Layers } from "lucide-react";
import Link from "next/link";
import { ProgressBar } from "@/components/ui/primitives";
import { useFormat, useT } from "@/i18n";
import type { CourseCardData } from "@/lib/types";

/** English or Bangla name, whichever fits the interface (falls back to English). */
export function useBilingual() {
  const { ui } = useT();
  return (en: string, bn?: string) => (ui === "bn" && bn ? bn : en);
}

export function CourseCard({ course, grade }: { course: CourseCardData; grade: number }) {
  const { t } = useT();
  const { gradeLabel, duration } = useFormat();
  const pick = useBilingual();
  const { subject } = course;
  const title = pick(course.title, course.titleBn);

  const band = (
    <div
      className="relative h-28 shrink-0 overflow-hidden"
      style={{ background: course.comingSoon ? "#E9E5F5" : `linear-gradient(135deg, ${subject.color}, ${subject.color}bb)` }}
    >
      <div className="bg-dots absolute inset-0 opacity-30 [filter:invert(1)]" />
      <span className="absolute -bottom-4 right-3 text-7xl drop-shadow-lg transition-transform group-hover:-rotate-6 group-hover:scale-110" aria-hidden>
        {subject.icon}
      </span>
      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-extrabold text-ink">
        {gradeLabel(grade)}
        {!course.comingSoon && " · NCTB"}
      </span>
    </div>
  );

  if (course.comingSoon || !course.id) {
    return (
      <div className="card flex flex-col overflow-hidden opacity-70" aria-disabled>
        {band}
        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-display text-lg font-bold leading-snug">{title}</h3>
          <span className="chip mt-3 self-start border-line bg-cream text-ink-soft">⏳ {t("lessons.comingSoon")}</span>
        </div>
      </div>
    );
  }

  const started = course.completed > 0;
  return (
    <Link href={`/lessons/course/${course.id}`} className="card group flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lift">
      {band}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg font-bold leading-snug">{title}</h3>
        <p className="mt-0.5 text-xs font-bold text-ink-muted">{course.book}</p>
        <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{course.description}</p>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-ink-muted">
          <span className="flex items-center gap-1"><BookOpen size={13} /> {t("lessons.chaptersN", { n: course.chapters })}</span>
          <span className="flex items-center gap-1"><Layers size={13} /> {t("lessons.topicsN", { n: course.topics })}</span>
          <span className="flex items-center gap-1"><Clock size={13} /> {duration(course.videoSec)}</span>
        </div>
        <div className="mt-auto pt-4">
          {started ? (
            <>
              <ProgressBar value={course.completed / Math.max(1, course.topics)} height="h-2" color="bg-mint-500" track="bg-mint-50" />
              <p className="mt-1.5 flex items-center justify-between text-xs font-bold text-ink-muted">
                {t("lessons.courseDone", { a: course.completed, b: course.topics })}
                <span className="flex items-center gap-1 text-brand-600">{t("lessons.continueCourse")} <ArrowRight size={13} /></span>
              </p>
            </>
          ) : (
            <span className="flex items-center gap-1 text-sm font-extrabold text-brand-600">
              {t("lessons.startCourse")} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
