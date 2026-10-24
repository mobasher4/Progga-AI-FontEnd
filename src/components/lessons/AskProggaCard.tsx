"use client";

import clsx from "clsx";
import { SendHorizontal, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { ProggaBot } from "@/components/brand/ProggaBot";
import { ErrorNote, Spinner } from "@/components/ui/primitives";
import { useT, type TKey } from "@/i18n";
import { errorMessage } from "@/lib/api";
import { paletteFor } from "@/lib/skins";
import { startTutorSession } from "@/lib/tutor";
import { useMe } from "@/lib/useMe";

const QUICK: TKey[] = ["lessonAsk.quickSimple", "lessonAsk.quickExample", "lessonAsk.quickWhy", "lessonAsk.quickPractice"];

/**
 * "Still confused?" box at the end of a lesson: the question goes to Ask Progga
 * together with the lesson, so even "I didn't get it" gets a useful answer.
 */
export function AskProggaCard({ lesson, done, compact = false }: { lesson: { id: string; title: string; subjectId: string }; done: boolean; compact?: boolean }) {
  const router = useRouter();
  const { t } = useT();
  const { user } = useMe();
  const { mutate } = useSWRConfig();
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await startTutorSession(q, lesson.subjectId, null, lesson.id);
      if (res.blocked) {
        setError(res.message);
        setBusy(false);
        return;
      }
      await mutate(`/tutor/sessions/${res.session.id}`, { session: res.session }, { revalidate: false });
      router.push(`/tutor/${res.session.id}?speak=1`);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <section className={clsx("card relative overflow-hidden p-5", !compact && "sm:p-6", done && "border-brand-200 bg-gradient-to-br from-brand-50 to-white")}>
      <div className={clsx("flex gap-4", compact ? "flex-col" : "flex-col sm:flex-row sm:items-center")}>
        <div className={clsx("flex items-center gap-3", !compact && "sm:block")}>
          <ProggaBot size={compact ? 56 : 76} mood={busy ? "thinking" : done ? "happy" : "asking"} palette={user?.skin?.palette ?? paletteFor(user?.avatarSkin)} float={!compact} />
          {compact && <Title done={done} />}
        </div>
        <div className="min-w-0 flex-1">
          {!compact && <Title done={done} />}
          <p className="mt-1 text-sm text-ink-soft">{t("lessonAsk.body", { title: lesson.title })}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK.map((k) => (
          <button
            key={k}
            type="button"
            disabled={busy}
            onClick={() => ask(t(k))}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-bold text-ink-soft transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
          >
            {t(k)}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex items-center gap-2 rounded-2xl border-2 border-line bg-white p-1.5 pl-4 focus-within:border-brand-300"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("lessonAsk.placeholder")}
          aria-label={t("lessonAsk.placeholder")}
          maxLength={1000}
          disabled={busy}
          className="min-w-0 flex-1 bg-transparent py-2 font-semibold outline-none placeholder:font-medium placeholder:text-ink-muted"
        />
        <button type="submit" className="btn-primary btn-sm shrink-0" disabled={busy || !question.trim()} aria-label={t("lessonAsk.send")}>
          {busy ? <Spinner /> : <SendHorizontal size={17} />}
          <span className={clsx(compact && "sr-only")}>{t("lessonAsk.send")}</span>
        </button>
      </form>

      {busy && <p className="mt-2 text-sm font-bold text-brand-600">{t("lessonAsk.thinking")}</p>}
      {error && <div className="mt-3"><ErrorNote message={error} /></div>}
    </section>
  );
}

function Title({ done }: { done: boolean }) {
  const { t } = useT();
  return (
    <p className="flex items-center gap-1.5 font-display text-lg font-extrabold leading-tight">
      <Sparkles size={18} className="shrink-0 text-brand-500" />
      {t(done ? "lessonAsk.titleDone" : "lessonAsk.title")}
    </p>
  );
}
