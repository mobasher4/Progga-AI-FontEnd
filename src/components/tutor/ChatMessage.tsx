"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import Link from "next/link";
import { Markdown } from "@/components/ui/Markdown";
import { ProggaMark } from "@/components/brand/Logo";
import { VideoThumb } from "@/components/tutor/RelatedVideos";
import { useT, type TKey } from "@/i18n";
import type { LessonCard, TutorMessage } from "@/lib/types";

type Style = { box: string; label?: TKey; labelCls?: string };

const KIND_STYLE: Record<string, Style> = {
  text: { box: "bg-white border border-line" },
  question: { box: "bg-banana-50 border-2 border-banana-300", label: "chat.yourTurn", labelCls: "text-banana-700" },
  hint: { box: "bg-sky-50 border-2 border-sky-100", label: "chat.hint", labelCls: "text-sky-600" },
  teach: { box: "bg-white border-2 border-sky-200", label: "chat.teach", labelCls: "text-sky-600" },
  why: { box: "bg-mint-50 border-2 border-mint-100", label: "chat.why", labelCls: "text-mint-700" },
  reveal: { box: "bg-brand-50 border-2 border-brand-100", label: "chat.reveal", labelCls: "text-brand-600" },
  recap: { box: "bg-white border-2 border-brand-100", label: "chat.recap", labelCls: "text-brand-600" },
  safety: { box: "bg-coral-50 border-2 border-coral-100", label: "chat.safety", labelCls: "text-coral-600" },
};

function feedbackStyle(verdict: unknown): Style {
  if (verdict === "correct") return { box: "bg-mint-50 border-2 border-mint-300", label: "chat.correct", labelCls: "text-mint-700" };
  if (verdict === "partial") return { box: "bg-banana-50 border-2 border-banana-200", label: "chat.partial", labelCls: "text-banana-700" };
  if (verdict === "incorrect") return { box: "bg-coral-50 border-2 border-coral-100", label: "chat.incorrect", labelCls: "text-coral-600" };
  return { box: "bg-white border border-line" };
}

/** Our recorded lessons on the topic, offered when Progga explains a step. */
function VideoSuggestions({ videos }: { videos: LessonCard[] }) {
  const { t } = useT();
  return (
    <div className="mt-3 border-t border-line pt-3">
      <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-coral-600">{t("chat.videos")}</p>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {videos.map((v) => (
          <Link
            key={v.id}
            href={`/lessons/${v.id}`}
            target="_blank"
            className="group flex items-center gap-3 rounded-2xl border border-line bg-cream/60 p-2 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft"
          >
            <VideoThumb v={v} />
            <span className="min-w-0">
              <span className="line-clamp-2 font-display text-sm font-bold leading-snug">{v.title}</span>
              <span className="mt-0.5 block truncate text-xs font-semibold text-ink-muted">{t("cards.lessonMeta", { n: v.grade, chapter: v.chapter })}</span>
              <span className="mt-0.5 block text-xs font-extrabold text-brand-500">▶ {t("chat.watch")}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Quick answer for factual questions: the answer first, then more to know. */
function AnswerCard({ m, onExplore }: { m: TutorMessage; onExplore?: (q: string) => void }) {
  const { t, n } = useT();
  const moreInfo = (m.meta.moreInfo as string[] | undefined) ?? [];
  const funFact = m.meta.funFact as string | undefined;
  const explore = (m.meta.explore as string[] | undefined) ?? [];
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.12 } } }} className="space-y-3">
      <motion.div variants={item} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white shadow-lift">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-banana-300/40 blur-2xl" />
        <p className="relative text-xs font-extrabold uppercase tracking-wider text-banana-300">{t("chat.quick")}</p>
        <div className="relative mt-1 font-display text-xl font-bold leading-snug [&_.katex]:text-white [&_strong]:text-banana-300">
          <Markdown>{m.content}</Markdown>
        </div>
      </motion.div>

      {moreInfo.length > 0 && (
        <motion.div variants={item} className="rounded-3xl border-2 border-sky-100 bg-sky-50 p-4">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-sky-600">{t("chat.more")}</p>
          <ul className="space-y-2">
            {moreInfo.map((info, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sky-500 text-[11px] font-extrabold text-white">{n(i + 1)}</span>
                <div className="flex-1"><Markdown>{info}</Markdown></div>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {funFact && (
        <motion.div variants={item} className="rounded-3xl border-2 border-banana-200 bg-banana-50 p-4">
          <p className="mb-1 text-xs font-extrabold uppercase tracking-wider text-banana-700">{t("chat.didYouKnow")}</p>
          <Markdown>{funFact}</Markdown>
        </motion.div>
      )}

      {explore.length > 0 && (
        <motion.div variants={item}>
          <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-brand-600">{t("chat.explore")}</p>
          <div className="flex flex-wrap gap-2">
            {explore.map((q) =>
              onExplore ? (
                <button key={q} onClick={() => onExplore(q)} className="chip border-brand-100 bg-white text-left text-brand-700 hover:border-brand-300 hover:bg-brand-50">
                  {q} →
                </button>
              ) : (
                <span key={q} className="chip border-line bg-white text-ink-soft">{q}</span>
              ),
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export function ChatMessage({ m, compact = false, onExplore }: { m: TutorMessage; compact?: boolean; onExplore?: (q: string) => void }) {
  const { t } = useT();
  if (m.kind === "answer") return <AnswerCard m={m} onExplore={onExplore} />;

  if (m.role === "student") {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
        <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-brand-500 px-4 py-3 text-white shadow-[0_3px_0_0_var(--color-brand-700)] [&_.katex]:text-white">
          <Markdown>{m.content}</Markdown>
        </div>
      </motion.div>
    );
  }

  if (m.kind === "celebrate") {
    const raw = m.meta.finalAnswer as string | undefined;
    // concept sessions have no single answer; long prose answers are left to the recap
    const finalAnswer = raw && !raw.startsWith("(") && raw.length <= 120 ? raw : undefined;
    const bigIdea = m.meta.bigIdea as string | undefined;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white shadow-lift"
      >
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-banana-300/40 blur-2xl" />
        <p className="relative font-display text-2xl font-extrabold">{m.content}</p>
        {finalAnswer && (
          <div className="relative mt-3 inline-block rounded-2xl bg-white/15 px-4 py-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-banana-300">{t("chat.yourAnswer")}</span>
            <div className="font-display text-xl font-extrabold [&_.katex]:text-white">
              <Markdown>{finalAnswer}</Markdown>
            </div>
          </div>
        )}
        {bigIdea && (
          <p className="relative mt-3 text-brand-100">
            <b className="text-white">{t("chat.bigIdea")}</b> {bigIdea}
          </p>
        )}
      </motion.div>
    );
  }

  const style = m.kind === "feedback" ? feedbackStyle(m.meta.verdict) : KIND_STYLE[m.kind] ?? KIND_STYLE.text;
  const label =
    m.kind === "hint" && typeof m.meta.level === "number"
      ? t("chat.hintN", { n: m.meta.level, total: Number(m.meta.of) })
      : style.label && t(style.label);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2.5">
      {!compact && (
        <span className="mb-1 hidden h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 sm:grid">
          <ProggaMark size={28} />
        </span>
      )}
      <div className={clsx("max-w-[88%] rounded-3xl rounded-bl-lg px-4 py-3 text-ink", style.box)}>
        {label && <p className={clsx("mb-1 text-xs font-extrabold uppercase tracking-wider", style.labelCls)}>{label}</p>}
        <Markdown>{m.content}</Markdown>
        {Array.isArray(m.meta.videos) && m.meta.videos.length > 0 && <VideoSuggestions videos={m.meta.videos as LessonCard[]} />}
      </div>
    </motion.div>
  );
}

export function TypingBubble() {
  const { t } = useT();
  return (
    <div className="flex items-end gap-2.5">
      <span className="mb-1 hidden h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 sm:grid">
        <ProggaMark size={28} />
      </span>
      <div className="flex items-center gap-2 rounded-3xl rounded-bl-lg border border-line bg-white px-4 py-3.5">
        <span className="sr-only">{t("chat.thinking")}</span>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-brand-400"
            animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}
