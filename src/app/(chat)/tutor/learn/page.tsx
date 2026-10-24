"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Check, ChevronDown, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { ProggaBot } from "@/components/brand/ProggaBot";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { useChatLayout } from "@/components/chat/ChatShell";
import { ErrorNote, Spinner } from "@/components/ui/primitives";
import { useT, type TKey } from "@/i18n";
import { api, errorMessage } from "@/lib/api";
import { GRADES } from "@/lib/format";
import { paletteFor } from "@/lib/skins";
import type { StartResult, Subject } from "@/lib/types";

type Chapter = { title: string; topics: string[] };
type Pick = { topic: string; chapter?: string };

const PLANNING_LINES: TKey[] = ["learn.plan1", "learn.plan2", "learn.plan3", "learn.plan4"];

/**
 * "Start a lesson": choose a class, a subject and a topic from its NCTB book,
 * and Progga teaches it from the basics up to what that class needs, as a chat.
 */
export default function StartLesson() {
  const router = useRouter();
  const { user, refreshHistory } = useChatLayout();
  const { t, n, ui } = useT();
  const { mutate } = useSWRConfig();
  const [grade, setGrade] = useState(Math.min(10, Math.max(3, user.grade ?? 6)));
  const [subject, setSubject] = useState<string | null>(null);
  const [pick, setPick] = useState<Pick | null>(null);
  const [custom, setCustom] = useState("");
  const [open, setOpen] = useState<number | null>(0);
  const [busy, setBusy] = useState(false);
  const [line, setLine] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { data: subjectsData } = useSWR<{ subjects: Subject[] }>(`/subjects?grade=${grade}`);
  const {
    data: syllabus,
    error: syllabusError,
    isLoading: loadingTopics,
    mutate: reloadTopics,
  } = useSWR<{ chapters: Chapter[]; source: "course" | "ai" }>(subject ? `/tutor/syllabus?grade=${grade}&subject=${subject}&lang=${ui}` : null);

  const subjects = subjectsData?.subjects ?? [];
  const subjectInfo = subjects.find((s) => s.id === subject);
  const palette = user.skin?.palette ?? paletteFor(user.avatarSkin);
  const chosen: Pick | null = custom.trim() ? { topic: custom.trim() } : pick;

  // a different class has a different book
  useEffect(() => {
    setSubject(null);
    setPick(null);
  }, [grade]);
  useEffect(() => {
    setPick(null);
    setOpen(0);
  }, [subject]);

  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(() => setLine((l) => Math.min(l + 1, PLANNING_LINES.length - 1)), 2200);
    return () => clearInterval(timer);
  }, [busy]);

  async function start() {
    if (!chosen || !subject || busy) return;
    setBusy(true);
    setLine(0);
    setError(null);
    try {
      const res = await api<StartResult>("/tutor/lessons", { body: { grade, subject, topic: chosen.topic, chapter: chosen.chapter } });
      if (res.blocked) {
        setError(res.message);
        setBusy(false);
        return;
      }
      await mutate(`/tutor/sessions/${res.session.id}`, { session: res.session }, { revalidate: false });
      refreshHistory();
      router.push(`/tutor/${res.session.id}?speak=1`);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  if (busy) {
    return (
      <>
        <ChatHeader title={t("learn.title")} />
        <div className="grid flex-1 place-items-center px-4 text-center">
          <div>
            <ProggaBot size={130} mood="thinking" palette={palette} />
            <p className="mt-3 font-display text-2xl font-extrabold">{chosen?.topic}</p>
            <AnimatePresence mode="wait">
              <motion.p
                key={line}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-2.5 font-display font-bold text-brand-700"
              >
                <Spinner /> {t(PLANNING_LINES[line])}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ChatHeader title={t("learn.title")} subtitle={t("learn.subtitle")} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-7 px-4 py-6 sm:px-6">
          <div className="flex items-center gap-4">
            <ProggaBot size={84} mood="happy" palette={palette} />
            <div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">{t("learn.heading")}</h1>
              <p className="mt-1 text-ink-soft">{t("learn.body")}</p>
            </div>
          </div>

          {/* 1. Class */}
          <section>
            <StepLabel n={1} label={t("learn.classLabel")} />
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {GRADES.map((g) => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={clsx(
                    "rounded-2xl border-2 py-2.5 font-display text-lg font-extrabold transition-colors",
                    g === grade ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-white text-ink hover:border-brand-200",
                  )}
                  aria-pressed={g === grade}
                >
                  {n(g)}
                </button>
              ))}
            </div>
          </section>

          {/* 2. Subject */}
          <section>
            <StepLabel n={2} label={t("learn.subjectLabel")} />
            {subjects.length === 0 ? (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-cream" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSubject(s.id)}
                    className={clsx(
                      "flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all hover:-translate-y-0.5",
                      s.id === subject ? "border-brand-500 bg-brand-50" : "border-line bg-white hover:border-brand-200",
                    )}
                    aria-pressed={s.id === subject}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl" style={{ background: `${s.color}22` }}>
                      {s.icon}
                    </span>
                    <span className="min-w-0 font-display font-bold leading-tight">{ui === "bn" ? s.nameBn : s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* 3. Topic */}
          {subject && (
            <section>
              <StepLabel n={3} label={t("learn.topicLabel")} />
              {loadingTopics && (
                <div className="flex items-center gap-3 rounded-2xl bg-brand-50 p-4 font-bold text-brand-700">
                  <Spinner /> {t("learn.loadingTopics")}
                </div>
              )}
              {syllabusError && !syllabus && !loadingTopics && (
                <div className="rounded-2xl bg-coral-50 p-4 text-center">
                  <p className="font-bold text-coral-600">{t("learn.topicsError")}</p>
                  <button className="btn-ghost btn-sm mt-3" onClick={() => void reloadTopics()}>
                    {t("chatui.retry")}
                  </button>
                </div>
              )}
              {syllabus && (
                <div className="space-y-2">
                  {syllabus.chapters.map((c, i) => {
                    const isOpen = open === i;
                    const hasPick = pick?.chapter === c.title;
                    return (
                      <div key={c.title + i} className={clsx("overflow-hidden rounded-2xl border", hasPick ? "border-brand-300 bg-brand-50/40" : "border-line bg-white")}>
                        <button onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center gap-3 px-4 py-3 text-left" aria-expanded={isOpen}>
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-cream text-xs font-extrabold text-ink-soft">{n(i + 1)}</span>
                          <span className="min-w-0 flex-1 font-bold">{c.title}</span>
                          {hasPick && <Check size={17} className="shrink-0 text-brand-600" strokeWidth={3} />}
                          <ChevronDown size={17} className={clsx("shrink-0 text-ink-muted transition-transform", isOpen && "rotate-180")} />
                        </button>
                        {isOpen && (
                          <div className="flex flex-wrap gap-2 px-4 pb-4">
                            {c.topics.map((tp) => {
                              const selected = !custom.trim() && pick?.topic === tp && pick.chapter === c.title;
                              return (
                                <button
                                  key={tp}
                                  onClick={() => {
                                    setCustom("");
                                    setPick({ topic: tp, chapter: c.title });
                                  }}
                                  className={clsx(
                                    "rounded-full border-2 px-3.5 py-1.5 text-sm font-bold transition-colors",
                                    selected ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-white text-ink-soft hover:border-brand-200 hover:text-brand-700",
                                  )}
                                  aria-pressed={selected}
                                >
                                  {tp}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {syllabus.source === "ai" && <p className="px-1 text-xs text-ink-muted">{t("learn.aiNote")}</p>}
                </div>
              )}

              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-bold text-ink-soft">{t("learn.customLabel")}</span>
                <input
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  maxLength={160}
                  placeholder={t("learn.customPlaceholder")}
                  className="w-full rounded-2xl border-2 border-line bg-white px-4 py-3 font-semibold outline-none placeholder:font-medium placeholder:text-ink-muted focus:border-brand-300"
                  onKeyDown={(e) => e.key === "Enter" && void start()}
                />
              </label>
            </section>
          )}

          {error && <ErrorNote message={error} />}
        </div>
      </div>

      {/* What will be taught + start */}
      <div className="border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1 text-sm">
            {chosen && subjectInfo ? (
              <>
                <span className="font-bold text-ink-muted">
                  {t("common.classN", { n: grade })} · {subjectInfo.icon} {ui === "bn" ? subjectInfo.nameBn : subjectInfo.name} ·{" "}
                </span>
                <span className="font-extrabold text-ink">{chosen.topic}</span>
              </>
            ) : (
              <span className="font-bold text-ink-muted">{t("learn.pickTopic")}</span>
            )}
          </p>
          <button className="btn-primary shrink-0" disabled={!chosen || !subject} onClick={() => void start()}>
            <Sparkles size={18} /> {t("learn.start")}
          </button>
        </div>
      </div>
    </>
  );
}

function StepLabel({ n: num, label }: { n: number; label: string }) {
  const { n } = useT();
  return (
    <p className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-ink-muted">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-[11px] text-white">{n(num)}</span>
      {label}
      {num === 3 && <BookOpen size={14} className="text-brand-500" />}
    </p>
  );
}
