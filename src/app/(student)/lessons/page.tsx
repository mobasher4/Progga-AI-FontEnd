"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { LessonTile } from "@/components/cards";
import { CourseCard } from "@/components/lessons/CourseCard";
import { PageLoader, Spinner } from "@/components/ui/primitives";
import { useFormat, useT } from "@/i18n";
import { GRADES } from "@/lib/format";
import type { CatalogResponse } from "@/lib/types";
import { useMe } from "@/lib/useMe";

/** Courses catalogue: pick a class, then a subject course (Coursera-style). */
export default function LessonsPage() {
  const { user } = useMe();
  const { t, n } = useT();
  const { gradeLabel } = useFormat();
  const [picked, setPicked] = useState<number | null>(null);
  const grade = picked ?? user?.grade ?? 10;

  const { data, isLoading } = useSWR<CatalogResponse>(`/courses?grade=${grade}`, { keepPreviousData: true });
  const withCourses = data?.gradesWithCourses ?? [];
  const available = data?.courses.filter((c) => !c.comingSoon) ?? [];
  const suggestion = withCourses.find((g) => g !== data?.grade);
  // the previous class's courses stay on screen (dimmed) while the new class loads
  const switching = !!data && data.grade !== grade;

  const selectedTab = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    selectedTab.current?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [grade]);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">{t("lessons.coursesEyebrow")}</p>
        <h1 className="mt-1 text-4xl font-extrabold">{t("lessons.coursesTitle")}</h1>
        <p className="mt-1 max-w-2xl text-ink-soft">{t("lessons.coursesBody")}</p>
      </div>

      <div className="card p-4">
        <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-ink-muted">{t("lessons.pickClass")}</p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label={t("lessons.pickClass")}>
          {GRADES.map((g) => (
            <button
              key={g}
              ref={g === grade ? selectedTab : undefined}
              role="tab"
              aria-selected={g === grade}
              onClick={() => setPicked(g)}
              className={clsx(
                "relative flex shrink-0 flex-col items-center rounded-2xl border-2 px-4 py-2 transition-colors",
                g === grade ? "border-grape-500 bg-grape-500 text-white shadow-soft" : "border-line bg-white text-ink-soft hover:border-grape-200 hover:text-ink",
              )}
            >
              <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-80">{t("lessons.classLabel")}</span>
              <span className="font-display text-xl font-extrabold leading-none">{n(g)}</span>
              {withCourses.includes(g) && (
                <span className={clsx("absolute right-1.5 top-1.5 h-2 w-2 rounded-full", g === grade ? "bg-banana-300" : "bg-mint-500")} />
              )}
            </button>
          ))}
        </div>
      </div>

      {isLoading && !data ? (
        <PageLoader label={t("common.loading")} />
      ) : data ? (
        <div className={clsx("space-y-6 transition-opacity", switching && "pointer-events-none opacity-50")} aria-busy={switching}>
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-2xl font-extrabold">
              {t("lessons.coursesFor", { cls: gradeLabel(data.grade) })}
              {switching && <Spinner size={18} />}
            </h2>
            {available.length === 0 && (
              <div className="card flex flex-col items-start gap-3 border-dashed p-5 sm:flex-row sm:items-center">
                <span className="text-4xl" aria-hidden>🚧</span>
                <div className="flex-1">
                  <p className="font-display text-lg font-extrabold">{t("lessons.noCoursesTitle")}</p>
                  <p className="text-sm text-ink-soft">{t("lessons.noCoursesText")}</p>
                </div>
                {suggestion && (
                  <button className="btn-primary" onClick={() => setPicked(suggestion)}>
                    {t("lessons.tryClass", { cls: gradeLabel(suggestion) })}
                  </button>
                )}
              </div>
            )}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.courses.map((c) => <CourseCard key={c.id ?? c.subject.id} course={c} grade={data.grade} />)}
            </div>
          </section>

          {data.quickLessons.length > 0 && (
            <section className="space-y-4">
              <div>
                <h2 className="text-2xl font-extrabold">{t("lessons.quickTitle")}</h2>
                <p className="text-sm text-ink-soft">{t("lessons.quickBody")}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.quickLessons.map((l) => <LessonTile key={l.id} lesson={l} />)}
              </div>
            </section>
          )}
        </div>
      ) : null}
    </div>
  );
}
