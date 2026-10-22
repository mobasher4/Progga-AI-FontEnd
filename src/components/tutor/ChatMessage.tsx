"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { Markdown } from "@/components/ui/Markdown";
import { ProggaMark } from "@/components/brand/Logo";
import type { TutorMessage } from "@/lib/types";

const KIND_STYLE: Record<string, { box: string; label?: string; labelCls?: string }> = {
  text: { box: "bg-white border border-line" },
  question: { box: "bg-banana-50 border-2 border-banana-300", label: "✏️ Your turn", labelCls: "text-banana-700" },
  hint: { box: "bg-sky-50 border-2 border-sky-100", label: "💡 Hint", labelCls: "text-sky-600" },
  why: { box: "bg-mint-50 border-2 border-mint-100", label: "🧠 Why it works", labelCls: "text-mint-700" },
  reveal: { box: "bg-grape-50 border-2 border-grape-100", label: "👀 Here's how this step works", labelCls: "text-grape-600" },
  recap: { box: "bg-white border-2 border-grape-100", label: "📝 Recap: the method", labelCls: "text-grape-600" },
  safety: { box: "bg-coral-50 border-2 border-coral-100", label: "💛 Progga cares", labelCls: "text-coral-600" },
};

function feedbackStyle(verdict: unknown) {
  if (verdict === "correct") return { box: "bg-mint-50 border-2 border-mint-300", label: "✅ Nice thinking!", labelCls: "text-mint-700" };
  if (verdict === "partial") return { box: "bg-banana-50 border-2 border-banana-200", label: "🌗 Almost there", labelCls: "text-banana-700" };
  if (verdict === "incorrect") return { box: "bg-coral-50 border-2 border-coral-100", label: "🔍 Let's check that", labelCls: "text-coral-600" };
  return { box: "bg-white border border-line" };
}

/** Quick answer for factual questions: the answer first, then more to know. */
function AnswerCard({ m, onExplore }: { m: TutorMessage; onExplore?: (q: string) => void }) {
  const moreInfo = (m.meta.moreInfo as string[] | undefined) ?? [];
  const funFact = m.meta.funFact as string | undefined;
  const explore = (m.meta.explore as string[] | undefined) ?? [];
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.12 } } }}
      className="space-y-3"
    >
      <motion.div variants={item} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-grape-500 to-grape-700 p-5 text-white shadow-lift">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-banana-300/40 blur-2xl" />
        <p className="relative text-xs font-extrabold uppercase tracking-wider text-banana-300">⚡ Quick answer</p>
        <div className="relative mt-1 font-display text-xl font-bold leading-snug [&_.katex]:text-white [&_strong]:text-banana-300">
          <Markdown>{m.content}</Markdown>
        </div>
      </motion.div>

      {moreInfo.length > 0 && (
        <motion.div variants={item} className="rounded-3xl border-2 border-sky-100 bg-sky-50 p-4">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-sky-600">📚 More to know</p>
          <ul className="space-y-2">
            {moreInfo.map((info, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sky-500 text-[11px] font-extrabold text-white">{i + 1}</span>
                <div className="flex-1"><Markdown>{info}</Markdown></div>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {funFact && (
        <motion.div variants={item} className="rounded-3xl border-2 border-banana-200 bg-banana-50 p-4">
          <p className="mb-1 text-xs font-extrabold uppercase tracking-wider text-banana-700">🤩 Did you know?</p>
          <Markdown>{funFact}</Markdown>
        </motion.div>
      )}

      {explore.length > 0 && (
        <motion.div variants={item}>
          <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-grape-600">🔭 Explore next</p>
          <div className="flex flex-wrap gap-2">
            {explore.map((q) =>
              onExplore ? (
                <button key={q} onClick={() => onExplore(q)} className="chip border-grape-100 bg-white text-left text-grape-700 hover:border-grape-300 hover:bg-grape-50">
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
  if (m.kind === "answer") return <AnswerCard m={m} onExplore={onExplore} />;

  if (m.role === "student") {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
        <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-grape-500 px-4 py-3 text-white shadow-[0_3px_0_0_var(--color-grape-700)] [&_.katex]:text-white">
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
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-grape-500 to-grape-700 p-5 text-white shadow-lift"
      >
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-banana-300/40 blur-2xl" />
        <p className="relative font-display text-2xl font-extrabold">{m.content}</p>
        {finalAnswer && (
          <div className="relative mt-3 inline-block rounded-2xl bg-white/15 px-4 py-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-banana-300">Your answer</span>
            <div className="font-display text-xl font-extrabold [&_.katex]:text-white">
              <Markdown>{finalAnswer}</Markdown>
            </div>
          </div>
        )}
        {bigIdea && <p className="relative mt-3 text-grape-100"><b className="text-white">Big idea:</b> {bigIdea}</p>}
      </motion.div>
    );
  }

  const style = m.kind === "feedback" ? feedbackStyle(m.meta.verdict) : KIND_STYLE[m.kind] ?? KIND_STYLE.text;
  const label = m.kind === "hint" && m.meta.level ? `💡 Hint ${m.meta.level} of ${m.meta.of}` : style.label;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2.5">
      {!compact && (
        <span className="mb-1 hidden h-9 w-9 shrink-0 place-items-center rounded-xl bg-grape-50 sm:grid">
          <ProggaMark size={28} />
        </span>
      )}
      <div className={clsx("max-w-[88%] rounded-3xl rounded-bl-lg px-4 py-3 text-ink", style.box)}>
        {label && <p className={clsx("mb-1 text-xs font-extrabold uppercase tracking-wider", style.labelCls)}>{label}</p>}
        <Markdown>{m.content}</Markdown>
      </div>
    </motion.div>
  );
}

export function TypingBubble({ label = "Progga is thinking" }: { label?: string }) {
  return (
    <div className="flex items-end gap-2.5">
      <span className="mb-1 hidden h-9 w-9 shrink-0 place-items-center rounded-xl bg-grape-50 sm:grid">
        <ProggaMark size={28} />
      </span>
      <div className="flex items-center gap-2 rounded-3xl rounded-bl-lg border border-line bg-white px-4 py-3.5">
        <span className="sr-only">{label}</span>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-grape-400"
            animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}
