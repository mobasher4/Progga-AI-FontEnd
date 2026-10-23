"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { Clock, Play } from "lucide-react";
import Link from "next/link";
import { useFormat, useT } from "@/i18n";
import type { LessonCard, TutorMessage } from "@/lib/types";

/** The newest set of recorded lessons Progga attached while helping in this chat. */
export function latestVideos(messages: TutorMessage[]): LessonCard[] {
  for (let i = messages.length - 1; i >= 0; i--) {
    const v = messages[i].meta.videos;
    if (Array.isArray(v) && v.length) return v as LessonCard[];
  }
  return [];
}

export function VideoThumb({ v, size = "sm" }: { v: LessonCard; size?: "sm" | "lg" }) {
  const { duration } = useFormat();
  const lg = size === "lg";
  return (
    <span
      className={clsx("relative block aspect-video shrink-0 overflow-hidden", lg ? "w-full rounded-2xl" : "w-28 rounded-xl")}
      style={{ background: `linear-gradient(135deg, ${v.subject.color}, ${v.subject.color}aa)` }}
    >
      {v.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={v.thumbnail} alt="" className="h-full w-full object-cover" />
      ) : (
        <>
          {lg && <span className="bg-dots absolute inset-0 opacity-40 [filter:invert(1)]" />}
          <span className={clsx("absolute opacity-90 drop-shadow", lg ? "-bottom-3 -right-1 text-7xl" : "-bottom-2 -right-1 text-4xl")}>{v.subject.icon}</span>
        </>
      )}
      <span className="absolute inset-0 grid place-items-center">
        <span
          className={clsx(
            "grid place-items-center rounded-full bg-white/95 text-brand-600 shadow-lift transition-transform group-hover:scale-110",
            lg ? "h-12 w-12" : "h-8 w-8",
          )}
        >
          <Play size={lg ? 20 : 14} fill="currentColor" />
        </span>
      </span>
      <span
        className={clsx(
          "absolute flex items-center gap-0.5 rounded-full bg-ink/70 font-bold text-white",
          lg ? "bottom-2 left-2 px-2 py-0.5 text-xs" : "bottom-1 left-1 px-1.5 py-0.5 text-[10px]",
        )}
      >
        <Clock size={lg ? 11 : 9} /> {duration(v.durationSec)}
      </span>
    </span>
  );
}

/** Right-panel card: big thumbnails of the lessons that explain what the student is stuck on. */
export function RelatedVideosCard({ videos }: { videos: LessonCard[] }) {
  const { t } = useT();
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
      <p className="eyebrow">{t("session.videos")}</p>
      <p className="mt-1 text-xs font-semibold text-ink-muted">{t("session.videosBody")}</p>
      <div className="mt-3 space-y-3">
        {videos.map((v) => (
          <Link key={v.id} href={`/lessons/${v.id}`} target="_blank" className="group block rounded-2xl p-1 transition-colors hover:bg-cream">
            <VideoThumb v={v} size="lg" />
            <span className="mt-2 block px-1 font-display text-sm font-bold leading-snug group-hover:text-brand-600">{v.title}</span>
            <span className="block px-1 text-xs font-semibold text-ink-muted">{t("cards.lessonMeta", { n: v.grade, chapter: v.chapter })}</span>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
