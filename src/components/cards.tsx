"use client";

import clsx from "clsx";
import { CheckCircle2, Clock, Play } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useCelebrate } from "@/components/celebrate/CelebrationProvider";
import { ProgressBar, Spinner } from "@/components/ui/primitives";
import { useFormat, useT, type TKey } from "@/i18n";
import { api, errorMessage } from "@/lib/api";
import type { LessonCard, Quest, Rewards, SessionSummary } from "@/lib/types";

export function QuestRow({ quest, onClaimed }: { quest: Quest; onClaimed?: () => void }) {
  const { celebrate, toast } = useCelebrate();
  const { t, tx, n } = useT();
  const [busy, setBusy] = useState(false);

  async function claim() {
    setBusy(true);
    try {
      const { rewards } = await api<{ rewards: Rewards }>(`/game/quests/${quest.id}/claim`, { method: "POST" });
      celebrate(rewards, { confetti: true });
      onClaimed?.();
    } catch (e) {
      toast(errorMessage(e), "⚠️", "coral");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={clsx("flex items-center gap-3 rounded-2xl border-2 p-3", quest.claimed ? "border-mint-100 bg-mint-50/60" : "border-line bg-white")}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cream text-2xl">{quest.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display font-bold leading-tight">{tx(`quests.${quest.id}`, quest.title)}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <ProgressBar value={quest.progress / quest.target} height="h-2" color={quest.complete ? "bg-mint-500" : "bg-banana-400"} track="bg-cream" />
          <span className="shrink-0 text-xs font-extrabold text-ink-muted">{n(quest.progress)}/{n(quest.target)}</span>
        </div>
      </div>
      {quest.claimed ? (
        <CheckCircle2 className="shrink-0 text-mint-500" size={26} />
      ) : quest.complete ? (
        <button onClick={claim} disabled={busy} className="btn-banana btn-sm shrink-0 animate-pop">
          {busy ? <Spinner size={16} /> : t("cards.claim")}
        </button>
      ) : (
        <span className="shrink-0 rounded-xl bg-banana-50 px-2 py-1 text-xs font-extrabold text-banana-700">+{n(quest.rewardXp)} XP</span>
      )}
    </div>
  );
}

export function LessonTile({ lesson }: { lesson: LessonCard }) {
  const { t, n } = useT();
  const { duration } = useFormat();
  return (
    <Link href={`/lessons/${lesson.id}`} className="card group overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-video overflow-hidden" style={{ background: `linear-gradient(135deg, ${lesson.subject.color}, ${lesson.subject.color}aa)` }}>
        {lesson.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lesson.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <>
            <div className="bg-dots absolute inset-0 opacity-40 [filter:invert(1)]" />
            <span className="absolute -bottom-3 -right-1 text-8xl opacity-90 drop-shadow-lg transition-transform group-hover:-rotate-6 group-hover:scale-110">{lesson.subject.icon}</span>
          </>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-extrabold text-ink">{lesson.subject.name}</span>
        <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-bold text-white">
          <Clock size={12} /> {duration(lesson.durationSec)}
        </span>
        <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-grape-600 shadow-lift">
            <Play size={24} fill="currentColor" />
          </span>
        </span>
        {lesson.completed && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-mint-500 px-2.5 py-1 text-xs font-extrabold text-white">
            <CheckCircle2 size={13} /> {t("cards.done")}
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs font-extrabold uppercase tracking-wider text-ink-muted">{t("cards.lessonMeta", { n: lesson.grade, chapter: lesson.chapter })}</p>
        <h3 className="mt-1 line-clamp-2 font-display text-lg font-bold leading-snug">{lesson.title}</h3>
        <div className="mt-3 flex items-center gap-2">
          {lesson.progress !== undefined && lesson.progress > 0 && !lesson.completed ? (
            <ProgressBar value={lesson.progress} height="h-2" color="bg-coral-500" track="bg-coral-50" />
          ) : (
            <span className="text-sm font-extrabold text-grape-500">+{n(lesson.xpReward)} XP</span>
          )}
        </div>
      </div>
    </Link>
  );
}

const STATUS: Record<SessionSummary["status"], { label: TKey; cls: string }> = {
  active: { label: "cards.inProgress", cls: "bg-banana-100 text-banana-700" },
  solved: { label: "cards.solved", cls: "bg-mint-100 text-mint-700" },
  abandoned: { label: "cards.paused", cls: "bg-line text-ink-muted" },
};

export function SessionRow({ s }: { s: SessionSummary }) {
  const { t } = useT();
  const { timeAgo } = useFormat();
  const st = STATUS[s.status];
  const progress =
    s.mode === "fact"
      ? t("cards.quickAnswer")
      : s.status === "solved"
        ? t("cards.steps", { n: s.totalSteps })
        : t("cards.stepOf", { n: Math.min(s.currentStep + 1, s.totalSteps), total: s.totalSteps });
  return (
    <Link href={`/tutor/${s.id}`} className="flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-cream">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-grape-50 text-xl">{s.mode === "fact" ? "⚡" : s.mode === "concept" ? "🔭" : "🧩"}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display font-bold">{s.title}</p>
        <p className="truncate text-sm text-ink-muted">
          {s.topic || s.subject} · {progress} · {timeAgo(s.updatedAt)}
        </p>
      </div>
      <span className={clsx("shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold", s.mode === "fact" ? "bg-sky-100 text-sky-600" : st.cls)}>
        {s.mode === "fact" ? t("cards.answered") : t(st.label)}
      </span>
    </Link>
  );
}
