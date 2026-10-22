"use client";

import clsx from "clsx";
import { AlertTriangle, ArrowLeft, ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import useSWR from "swr";
import { ProggaBot } from "@/components/brand/ProggaBot";
import { useCelebrate } from "@/components/celebrate/CelebrationProvider";
import { PageLoader, ProgressBar, SectionTitle } from "@/components/ui/primitives";
import { useFormat, useT, type TKey } from "@/i18n";
import { api, errorMessage } from "@/lib/api";
import { paletteFor } from "@/lib/skins";
import type { LevelInfo } from "@/lib/types";

interface Report {
  student: { id: string; name: string; grade: number; avatarSkin: string; level: LevelInfo; streak: number; bestStreak: number; dailyTutorLimit: number; badges: number };
  week: { day: string; xp: number }[];
  tutor: {
    sessions: number;
    solved: number;
    abandoned: number;
    hintsUsed: number;
    independence: number | null;
    topTopics: { topic: string; count: number }[];
    recent: { id: string; title: string; subject: string; status: string; hintsUsed: number; createdAt: string }[];
  };
  quiz: { subjectId: string; accuracy: number; answered: number }[];
  lessons: { title: string; subjectId: string; at: string }[];
  misconceptions: { note: string; topic: string; at: string }[];
  safety: { category: string; excerpt: string; at: string }[];
}

const SAFETY_LABEL: Record<string, TKey> = {
  wellbeing: "report.wellbeing",
  unsafe: "report.unsafe",
  off_topic: "report.offTopic",
  personal_info: "report.personalInfo",
};

export default function StudentReport({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const { data, mutate } = useSWR<Report>(`/guardian/students/${studentId}/report`);
  const { toast } = useCelebrate();
  const { t, tx, n } = useT();
  const { gradeLabel, timeAgo, weekday } = useFormat();
  const [limit, setLimit] = useState<number | null>(null);

  if (!data) return <PageLoader label={t("report.building")} />;
  const { student: s, tutor } = data;
  const maxXp = Math.max(10, ...data.week.map((d) => d.xp));
  const independence = tutor.independence;
  const alerts = data.safety.filter((e) => e.category === "wellbeing" || e.category === "unsafe");

  async function saveLimit() {
    try {
      await api(`/guardian/students/${studentId}/settings`, { method: "PATCH", body: { dailyTutorLimit: limit } });
      toast(t("report.limitSaved"), "✅", "mint");
      setLimit(null);
      void mutate();
    } catch (e) {
      toast(errorMessage(e), "⚠️", "coral");
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/guardian" className="inline-flex items-center gap-1.5 font-bold text-ink-soft hover:text-ink">
        <ArrowLeft size={18} /> {t("report.allStudents")}
      </Link>

      <div className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <span className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl bg-cream">
          <ProggaBot size={78} palette={paletteFor(s.avatarSkin)} mood="happy" float={false} />
        </span>
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold">{s.name}</h1>
          <p className="text-ink-soft">
            {t("report.meta", { grade: gradeLabel(s.grade), n: s.level.level, title: tx(`levelTitles.${s.level.title}`, s.level.title), b: s.badges })}
          </p>
        </div>
        <div className="flex gap-3">
          <Kpi value={`${n(s.streak)}🔥`} label={t("report.dayStreak")} />
          <Kpi value={n(s.level.xp)} label={t("report.totalXp")} />
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="rounded-3xl border-2 border-coral-100 bg-coral-50 p-5">
          <p className="flex items-center gap-2 font-display text-lg font-extrabold text-coral-600"><AlertTriangle size={20} /> {t("report.attention")}</p>
          <p className="mt-1 text-sm text-ink-soft">{t("report.attentionBody")}</p>
          <ul className="mt-3 space-y-2">
            {alerts.map((a, i) => (
              <li key={i} className="rounded-2xl bg-white px-4 py-3 text-sm">
                <span className="font-extrabold">{SAFETY_LABEL[a.category] ? t(SAFETY_LABEL[a.category]) : a.category}</span> · <span className="text-ink-muted">{timeAgo(a.at)}</span>
                <p className="mt-1 italic text-ink-soft">“{a.excerpt}”</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <SectionTitle eyebrow={t("report.last7")} title={t("report.activity")} />
          <div className="flex h-44 items-end gap-3">
            {data.week.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-bold text-ink-muted">{d.xp ? n(d.xp) : ""}</span>
                <div className="flex w-full flex-1 items-end">
                  <div className={clsx("w-full rounded-t-xl", d.xp ? "bg-gradient-to-t from-grape-500 to-grape-300" : "bg-line")} style={{ height: `${Math.max(4, (d.xp / maxXp) * 100)}%` }} />
                </div>
                <span className="text-xs font-bold text-ink-soft">{weekday(d.day)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <SectionTitle eyebrow={t("report.ownThinking")} title={t("report.independence")} />
          {independence === null ? (
            <p className="text-ink-soft">{t("report.notEnough")}</p>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-5xl font-extrabold text-mint-600">{n(Math.round(independence * 100))}%</span>
                <span className="text-sm font-semibold text-ink-muted">{t("report.ofSteps")}</span>
              </div>
              <ProgressBar value={independence} color="bg-mint-500" track="bg-mint-50" className="mt-4" />
              <p className="mt-3 text-sm text-ink-soft">
                {independence >= 0.7 ? t("report.indHigh") : independence >= 0.4 ? t("report.indMid") : t("report.indLow")}
              </p>
            </>
          )}
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <Kpi value={n(tutor.sessions)} label={t("report.sessions")} small />
            <Kpi value={n(tutor.solved)} label={t("report.solved")} small />
            <Kpi value={n(tutor.hintsUsed)} label={t("report.hints")} small />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <SectionTitle eyebrow={t("report.last30")} title={t("report.topics")} />
          {tutor.topTopics.length ? (
            <div className="flex flex-wrap gap-2">
              {tutor.topTopics.map((tp) => (
                <span key={tp.topic} className="chip border-grape-100 bg-grape-50 text-grape-700">{tp.topic} <span className="text-grape-400">×{n(tp.count)}</span></span>
              ))}
            </div>
          ) : <p className="text-ink-soft">{t("report.noSessions")}</p>}

          <h3 className="mb-3 mt-6 font-display text-lg font-extrabold">{t("report.quizAccuracy")}</h3>
          {data.quiz.length ? (
            <div className="space-y-3">
              {data.quiz.map((q) => (
                <div key={q.subjectId}>
                  <div className="flex justify-between text-sm font-bold"><span className="capitalize">{q.subjectId.replace("-", " ")}</span><span>{n(Math.round(q.accuracy * 100))}%</span></div>
                  <ProgressBar value={q.accuracy} height="h-2.5" color={q.accuracy >= 0.7 ? "bg-mint-500" : q.accuracy >= 0.4 ? "bg-banana-400" : "bg-coral-500"} track="bg-cream" className="mt-1" />
                </div>
              ))}
            </div>
          ) : <p className="text-ink-soft">{t("report.noQuiz")}</p>}
        </div>

        <div className="card p-6">
          <SectionTitle eyebrow={t("report.stuckEyebrow")} title={t("report.misconceptions")} />
          {data.misconceptions.length ? (
            <ul className="space-y-2.5">
              {data.misconceptions.map((m, i) => (
                <li key={i} className="rounded-2xl bg-banana-50 px-4 py-3">
                  <p className="text-sm font-semibold">{m.note}</p>
                  <p className="text-xs text-ink-muted">{m.topic} · {timeAgo(m.at)}</p>
                </li>
              ))}
            </ul>
          ) : <p className="text-ink-soft">{t("report.noMisconceptions")}</p>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-6">
          <SectionTitle eyebrow={t("report.transcriptsEyebrow")} title={t("report.recentSessions")} />
          {tutor.recent.length ? (
            <div className="-mx-3">
              {tutor.recent.map((r) => (
                <Link key={r.id} href={`/guardian/${studentId}/sessions/${r.id}`} className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-cream">
                  <span className={clsx("h-2.5 w-2.5 shrink-0 rounded-full", r.status === "solved" ? "bg-mint-500" : r.status === "active" ? "bg-banana-400" : "bg-ink-muted")} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display font-bold">{r.title}</p>
                    <p className="text-xs text-ink-muted">{t("report.sessionMeta", { subject: r.subject, n: r.hintsUsed, ago: timeAgo(r.createdAt) })}</p>
                  </div>
                  <ChevronRight size={18} className="text-ink-muted" />
                </Link>
              ))}
            </div>
          ) : <p className="text-ink-soft">{t("report.noSessions")}</p>}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <SectionTitle eyebrow={t("report.habits")} title={t("report.dailyLimit")} />
            <p className="text-sm text-ink-soft">{t("report.limitBody", { name: s.name.split(" ")[0] })}</p>
            <div className="mt-4 flex gap-2">
              <input type="number" min={1} max={100} className="input w-28" value={limit ?? s.dailyTutorLimit} onChange={(e) => setLimit(Number(e.target.value))} />
              <button className="btn-primary btn-sm" disabled={limit === null || limit === s.dailyTutorLimit} onClick={saveLimit}>{t("common.save")}</button>
            </div>
          </div>
          <div className="card p-6">
            <SectionTitle eyebrow={t("report.lessonsEyebrow")} title={t("report.recentlyCompleted")} />
            {data.lessons.length ? (
              <ul className="space-y-2">
                {data.lessons.map((l, i) => (
                  <li key={i} className="flex justify-between gap-3 text-sm"><span className="font-semibold">{l.title}</span><span className="shrink-0 text-ink-muted">{timeAgo(l.at)}</span></li>
                ))}
              </ul>
            ) : <p className="text-ink-soft">{t("report.noLessons")}</p>}
          </div>
          {alerts.length === 0 && (
            <div className="flex items-center gap-3 rounded-3xl bg-mint-50 p-5 text-mint-700">
              <ShieldCheck size={26} className="shrink-0" />
              <p className="font-display font-bold">{t("report.noAlerts")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ value, label, small }: { value: string; label: string; small?: boolean }) {
  return (
    <div className={clsx("rounded-2xl bg-cream text-center", small ? "px-2 py-2.5" : "px-5 py-3")}>
      <p className={clsx("font-display font-extrabold", small ? "text-xl" : "text-2xl")}>{value}</p>
      <p className="text-[11px] font-bold text-ink-muted">{label}</p>
    </div>
  );
}
