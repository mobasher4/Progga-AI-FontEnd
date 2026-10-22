"use client";

import clsx from "clsx";
import { Search } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { LessonTile } from "@/components/cards";
import { EmptyState, PageLoader } from "@/components/ui/primitives";
import { useT } from "@/i18n";
import { GRADES } from "@/lib/format";
import type { LessonCard, Subject } from "@/lib/types";
import { useMe } from "@/lib/useMe";

export default function LessonsPage() {
  const { user } = useMe();
  const { t, ui } = useT();
  const [grade, setGrade] = useState<number | "all">(user?.grade ?? "all");
  const [subject, setSubject] = useState<string>("");
  const [q, setQ] = useState("");

  const qs = new URLSearchParams();
  if (grade !== "all") qs.set("grade", String(grade));
  if (subject) qs.set("subject", subject);
  if (q.trim()) qs.set("q", q.trim());

  const { data: subjects } = useSWR<{ subjects: Subject[] }>("/subjects");
  const { data, isLoading } = useSWR<{ lessons: LessonCard[] }>(`/lessons?${qs}`, { keepPreviousData: true });

  const completed = data?.lessons.filter((l) => l.completed).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">{t("lessons.eyebrow")}</p>
          <h1 className="mt-1 text-4xl font-extrabold">{t("lessons.title")}</h1>
          <p className="mt-1 text-ink-soft">{t("lessons.body")}</p>
        </div>
        {!!data?.lessons.length && (
          <span className="chip self-start border-mint-100 bg-mint-50 text-mint-700 sm:self-auto">{t("lessons.completed", { a: completed, b: data.lessons.length })}</span>
        )}
      </div>

      <div className="card space-y-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input className="input pl-11" placeholder={t("lessons.search")} value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <select className="input sm:w-48" value={grade} onChange={(e) => setGrade(e.target.value === "all" ? "all" : Number(e.target.value))} aria-label={t("lessons.classLabel")}>
            <option value="all">{t("lessons.allClasses")}</option>
            {GRADES.map((g) => <option key={g} value={g}>{t("common.classN", { n: g })}</option>)}
          </select>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <button onClick={() => setSubject("")} className={clsx("chip shrink-0", !subject ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-soft")}>{t("lessons.allSubjects")}</button>
          {subjects?.subjects.map((s) => (
            <button key={s.id} onClick={() => setSubject(s.id)} className={clsx("chip shrink-0", subject === s.id ? "border-grape-500 bg-grape-500 text-white" : "border-line bg-white text-ink-soft hover:border-grape-200")}>
              {s.icon} {ui === "bn" ? s.nameBn : s.name}
            </button>
          ))}
        </div>
      </div>

      {isLoading && !data ? (
        <PageLoader label={t("common.loading")} />
      ) : data?.lessons.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.lessons.map((l) => <LessonTile key={l.id} lesson={l} />)}
        </div>
      ) : (
        <EmptyState
          icon="🔍"
          title={t("lessons.noneTitle")}
          text={t("lessons.noneText")}
          action={<button className="btn-ghost" onClick={() => { setGrade("all"); setSubject(""); setQ(""); }}>{t("lessons.showAll")}</button>}
        />
      )}
    </div>
  );
}
