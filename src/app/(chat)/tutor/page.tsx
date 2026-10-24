"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { ProggaBot, type BotMood } from "@/components/brand/ProggaBot";
import { ChatComposer, type ComposerHandle } from "@/components/chat/ChatComposer";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { useChatLayout } from "@/components/chat/ChatShell";
import { PhotoButton, PhotoPreview, SubjectPicker } from "@/components/chat/ComposerTools";
import { ProggaMark } from "@/components/brand/Logo";
import { ChatMessage } from "@/components/tutor/ChatMessage";
import { ErrorNote } from "@/components/ui/primitives";
import { useT, type TKey } from "@/i18n";
import { errorMessage } from "@/lib/api";
import { paletteFor } from "@/lib/skins";
import { EXAMPLES, EXAMPLES_BN, startTutorSession } from "@/lib/tutor";
import type { Subject } from "@/lib/types";
import { useEngine } from "@/lib/useEngine";

const PLANNING_LINES: TKey[] = ["ask.plan1", "ask.plan2", "ask.plan3", "ask.plan4"];

function NewChat() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, refreshHistory } = useChatLayout();
  const { t, ui } = useT();
  const { mutate } = useSWRConfig();
  const { vision } = useEngine();
  const { data: subjectsData } = useSWR<{ subjects: Subject[] }>(user.grade ? `/subjects?grade=${user.grade}` : null);
  const composer = useRef<ComposerHandle>(null);

  const [subject, setSubject] = useState(params.get("subject") ?? "math");
  const [question, setQuestion] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sent, setSent] = useState<{ text: string; photo: string | null } | null>(null);
  const [line, setLine] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const busy = !!sent && !blocked && !error;

  // "New question" from the sidebar → start fresh
  const fresh = params.get("new");
  useEffect(() => {
    setSent(null);
    setQuestion("");
    setImage(null);
    setPreview(null);
    setBlocked(null);
    setError(null);
    composer.current?.focus();
  }, [fresh]);

  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(() => setLine((l) => Math.min(l + 1, PLANNING_LINES.length - 1)), 1600);
    return () => clearInterval(timer);
  }, [busy]);

  function pickImage(f: File | undefined) {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return setError(t("ask.tooBig"));
    setError(null);
    setImage(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit(text = question) {
    const q = text.trim();
    if (!q && !image) return;
    setSent({ text: q, photo: preview });
    setLine(0);
    setError(null);
    setBlocked(null);
    setQuestion("");
    try {
      const res = await startTutorSession(q, subject, image);
      if (res.blocked) {
        setBlocked(res.message);
        return;
      }
      await mutate(`/tutor/sessions/${res.session.id}`, { session: res.session }, { revalidate: false });
      refreshHistory();
      router.push(`/tutor/${res.session.id}?speak=1`);
    } catch (err) {
      setError(errorMessage(err));
      setQuestion(q);
    }
  }

  const subjects = subjectsData?.subjects ?? [];
  const examples = ((ui === "bn" ? EXAMPLES_BN : EXAMPLES)[subject] ?? (ui === "bn" ? EXAMPLES_BN : EXAMPLES).math).slice(0, 4);
  const mood: BotMood = busy ? "thinking" : blocked ? "oops" : question ? "asking" : "idle";
  const palette = user.skin?.palette ?? paletteFor(user.avatarSkin);

  return (
    <>
      <ChatHeader title={t("nav.ask")} subtitle={t("chatui.disclaimer")} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!sent ? (
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center px-4 py-8 text-center sm:px-6">
            <ProggaBot size={120} mood={mood} palette={palette} />
            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{t("ask.title")}</h1>
            <p className="mt-2 max-w-xl text-ink-soft">{t("ask.body")}</p>

            <div className="mt-6 grid w-full gap-3 sm:grid-cols-2">
              {[
                ["🧩", "chatui.stepMode", "chatui.stepModeText", "bg-brand-50 text-brand-700"],
                ["⚡", "chatui.factMode", "chatui.factModeText", "bg-sky-50 text-sky-600"],
              ].map(([icon, title, text, tint]) => (
                <div key={title} className="flex items-start gap-3 rounded-2xl border border-line bg-cream/60 p-3.5 text-left">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl ${tint}`}>{icon}</span>
                  <span>
                    <span className="block font-display font-extrabold">{t(title as TKey)}</span>
                    <span className="block text-sm text-ink-soft">{t(text as TKey)}</span>
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/tutor/learn"
              className="group mt-3 flex w-full items-center gap-3 rounded-2xl border-2 border-brand-200 bg-gradient-to-r from-brand-50 to-white p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-brand-300"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500 text-white">
                <BookOpen size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display font-extrabold">{t("learn.askCard")}</span>
                <span className="block text-sm text-ink-soft">{t("learn.askCardText")}</span>
              </span>
              <ArrowUpRight size={18} className="shrink-0 text-brand-500 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <p className="mb-2 mt-7 self-start text-xs font-extrabold uppercase tracking-wider text-ink-muted">{t("chatui.suggestions")}</p>
            <div className="grid w-full gap-2.5 sm:grid-cols-2">
              {examples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => submit(ex)}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-left text-[15px] font-semibold shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-200"
                >
                  <span>{ex}</span>
                  <ArrowUpRight size={17} className="shrink-0 text-ink-muted transition-colors group-hover:text-brand-500" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6 sm:px-6">
            <ChatMessage
              m={{ id: "q", role: "student", kind: "text", content: sent.text || "📷", stepIndex: null, meta: {}, createdAt: "" }}
            />
            {sent.photo && (
              <div className="flex justify-end">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sent.photo} alt={t("ask.photoAlt")} className="h-32 rounded-2xl border border-line object-cover" />
              </div>
            )}
            {busy && (
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50">
                  <ProggaMark size={28} />
                </span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={line}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="rounded-2xl bg-brand-50 px-4 py-2.5 font-display font-bold text-brand-700"
                  >
                    {t(PLANNING_LINES[line])}
                  </motion.span>
                </AnimatePresence>
              </div>
            )}
            {blocked && <ChatMessage m={{ id: "b", role: "tutor", kind: "safety", content: blocked, stepIndex: null, meta: {}, createdAt: "" }} />}
            {error && <ErrorNote message={error} />}
          </div>
        )}
      </div>

      <ChatComposer
        ref={composer}
        value={question}
        onChange={setQuestion}
        onSubmit={() => submit()}
        placeholder={t("ask.placeholder")}
        label={t("ask.questionLabel")}
        busy={busy}
        disabled={busy}
        canSendEmpty={!!image}
        autoFocus
        attachment={preview && !busy ? <PhotoPreview src={preview} onRemove={() => { setImage(null); setPreview(null); }} /> : undefined}
        tools={
          <>
            {vision && <PhotoButton onPick={pickImage} disabled={busy} />}
            {subjects.length > 0 && <SubjectPicker subjects={subjects} value={subject} onChange={setSubject} disabled={busy} />}
          </>
        }
      />
    </>
  );
}

export default function TutorHome() {
  return (
    <Suspense>
      <NewChat />
    </Suspense>
  );
}
