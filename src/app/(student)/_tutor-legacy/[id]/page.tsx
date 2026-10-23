"use client";

import clsx from "clsx";
import { ArrowLeft, Eye, Lightbulb, Pause, Plus, SendHorizonal, Sparkles } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ProggaBot, type BotMood } from "@/components/brand/ProggaBot";
import { useCelebrate } from "@/components/celebrate/CelebrationProvider";
import { ChatMessage, TypingBubble } from "@/components/tutor/ChatMessage";
import { MissionMap } from "@/components/tutor/MissionMap";
import { Markdown } from "@/components/ui/Markdown";
import { PageLoader, ProgressBar, Spinner } from "@/components/ui/primitives";
import { useT, type TKey } from "@/i18n";
import { api, errorMessage } from "@/lib/api";
import { paletteFor } from "@/lib/skins";
import { startTutorSession } from "@/lib/tutor";
import type { TutorActionResult, TutorMessage, TutorSession } from "@/lib/types";
import { useMe } from "@/lib/useMe";

const SYMBOLS = ["+", "−", "×", "÷", "=", "²", "√", "π", "/", "(", ")", "°"];

type Busy = null | "reply" | "hint" | "reveal" | "practice";
type MoodLine = { mood: BotMood; line: TKey };

const REACTION_MS = 2600;
const ASKING: MoodLine = { mood: "asking", line: "session.asking" };

/** How Progga reacts to the newest tutor messages (before settling into "asking"). */
function reactionFor(session: TutorSession): MoodLine | null {
  const last = [...session.messages].reverse().find((m) => m.role === "tutor" && m.kind !== "question");
  const verdict = last?.meta.verdict;
  if (last?.kind === "why" || verdict === "correct") return { mood: "happy", line: "session.happy" };
  if (verdict === "incorrect") return { mood: "oops", line: "session.oops" };
  if (verdict === "partial") return { mood: "talking", line: "session.partial" };
  if (last?.kind === "hint") return { mood: "talking", line: "session.hint" };
  if (last?.kind === "reveal") return { mood: "talking", line: "session.reveal" };
  if (last?.kind === "safety") return { mood: "idle", line: "session.safety" };
  return null;
}

/**
 * Progga's live expression: thinking while it works → a short reaction to the
 * student's answer → curious "asking" face while it waits for the next reply.
 * Each switch is a smooth morph in <ProggaBot>.
 */
function useBotMood(session: TutorSession | undefined, busy: Busy): MoodLine | null {
  const count = session?.messages.length ?? 0;
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    setSettled(false);
    const timer = setTimeout(() => setSettled(true), REACTION_MS);
    return () => clearTimeout(timer);
  }, [count]);

  if (!session) return null;
  if (busy === "reply") return { mood: "thinking", line: "session.checking" };
  if (busy) return { mood: "thinking", line: busy === "practice" ? "session.planningNext" : "session.helping" };
  if (session.mode === "fact") return { mood: settled ? "idle" : "talking", line: "session.fact" };
  if (session.status === "solved") return { mood: "cheer", line: "session.solved" };
  if (session.status !== "active") return { mood: "idle", line: "session.paused" };

  const waitingOnStudent = [...session.messages].reverse().find((m) => m.role === "tutor")?.kind === "question";
  const reaction = reactionFor(session);
  if (!settled && reaction) return reaction;
  return waitingOnStudent ? ASKING : reaction ?? { mood: "idle", line: "session.idle" };
}

const MODE_LABEL: Record<TutorSession["mode"], TKey> = {
  problem: "session.modeProblem",
  concept: "session.modeConcept",
  fact: "session.modeFact",
};

export default function TutorSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useMe();
  const { t, n } = useT();
  const { celebrate, toast, burst } = useCelebrate();
  const { data, mutate } = useSWR<{ session: TutorSession }>(`/tutor/sessions/${id}`);
  const [text, setText] = useState("");
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [showKeys, setShowKeys] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const session = data?.session;
  const messageCount = session?.messages.length ?? 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messageCount, pendingText]);

  const practice = useMemo(
    () => session?.messages.find((m) => typeof m.meta.practice === "string")?.meta.practice as string | undefined,
    [session?.messages],
  );
  const moodLine = useBotMood(session, busy);

  if (!session || !moodLine) return <PageLoader label={t("session.opening")} />;

  const { mood } = moodLine;
  const line = t(moodLine.line);
  const isFact = session.mode === "fact";
  const current = session.steps[session.currentStep];
  const hintsLeft = current ? current.hintsTotal - current.hintsShown : 0;
  const doneSteps = session.steps.filter((s) => s.state === "done" || s.state === "revealed").length;
  const active = session.status === "active";
  const palette = user?.skin?.palette ?? paletteFor(user?.avatarSkin);

  async function act(kind: "reply" | "hint" | "reveal", body?: unknown) {
    setBusy(kind);
    try {
      const path = kind === "reply" ? "reply" : kind === "hint" ? "hint" : "reveal-step";
      const res = await api<TutorActionResult>(`/tutor/sessions/${id}/${path}`, { method: "POST", body });
      await mutate({ session: res.session }, { revalidate: false });
      celebrate(res.rewards, { confetti: res.session.status === "solved" });
      if (res.session.status === "solved" && !res.rewards) burst();
      return true;
    } catch (e) {
      toast(errorMessage(e), "⚠️", "coral");
      return false;
    } finally {
      setBusy(null);
      setPendingText(null);
    }
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const msg = text.trim();
    if (!msg || busy) return;
    setPendingText(msg);
    setText("");
    const ok = await act("reply", { message: msg });
    if (!ok) setText(msg);
    inputRef.current?.focus();
  }

  /** Starts a fresh session (practice problem, explore chip or follow-up question). */
  async function startNew(question: string) {
    if (!question.trim() || !session || busy) return;
    setBusy("practice");
    try {
      const res = await startTutorSession(question.trim(), session.subject);
      if (res.blocked) throw new Error(res.message);
      router.push(`/tutor/${res.session.id}`);
    } catch (e) {
      toast(errorMessage(e), "⚠️", "coral");
      setBusy(null);
    }
  }

  async function pause() {
    await api(`/tutor/sessions/${id}/abandon`, { method: "POST" }).catch(() => undefined);
    router.push("/tutor");
  }

  const insert = (sym: string) => {
    setText((v) => v + sym);
    inputRef.current?.focus();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
      {/* Left: robot + mission map */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <div className="card flex flex-col items-center p-5 text-center">
            <ProggaBot size={150} mood={mood} palette={palette} />
            <p className="mt-2 rounded-2xl bg-brand-50 px-3 py-2 font-display font-bold text-brand-700">{line}</p>
          </div>
          {isFact ? (
            <div className="card p-5">
              <p className="eyebrow mb-2">{t("session.quickTitle")}</p>
              <p className="text-sm text-ink-soft">{t("session.quickBody")}</p>
              <p className="mt-3 rounded-2xl bg-brand-50 p-3 text-sm font-semibold text-brand-700">{t("session.quickTip")}</p>
            </div>
          ) : (
            <div className="card p-5">
              <p className="eyebrow mb-4">{t("session.missionMap")}</p>
              <MissionMap session={session} />
            </div>
          )}
          <div className={clsx("grid grid-cols-2 gap-3", isFact && "hidden")}>
            <div className="card p-3 text-center">
              <p className="font-display text-2xl font-extrabold text-brand-600">{n(session.xpEarned)}</p>
              <p className="text-xs font-bold text-ink-muted">{t("session.xpEarned")}</p>
            </div>
            <div className="card p-3 text-center">
              <p className="font-display text-2xl font-extrabold text-sky-600">{n(session.hintsUsed)}</p>
              <p className="text-xs font-bold text-ink-muted">{t("session.hintsUsed")}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Right: conversation */}
      <section className="card flex h-[calc(100dvh-11rem)] min-h-[380px] flex-col overflow-hidden lg:h-[calc(100dvh-8.5rem)] lg:min-h-[520px]">
        <header className="border-b border-line px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <Link href="/tutor" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl hover:bg-cream" aria-label={t("common.back")}>
              <ArrowLeft size={19} />
            </Link>
            <div className="lg:hidden">
              <ProggaBot size={44} mood={mood} float={false} palette={palette} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg font-extrabold leading-tight">{session.title}</p>
              <p className="truncate text-sm text-ink-muted">{session.topic} · {t(MODE_LABEL[session.mode])}</p>
            </div>
            {active && (
              <button onClick={pause} className="btn-ghost btn-sm hidden sm:inline-flex" title={t("session.pauseTitle")}>
                <Pause size={15} /> {t("session.pause")}
              </button>
            )}
          </div>
          <div className={clsx("mt-3 flex items-center gap-3", isFact && "hidden")}>
            <ProgressBar value={doneSteps / Math.max(1, session.totalSteps)} height="h-2.5" color="bg-mint-500" track="bg-mint-50" />
            <span className="shrink-0 text-xs font-extrabold text-ink-muted">
              {session.status === "solved"
                ? t("session.complete")
                : t("session.stepOf", { n: Math.min(session.currentStep + 1, session.totalSteps), total: session.totalSteps })}
            </span>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-cream/50 px-3 py-5 sm:px-5">
          {session.messages.map((m: TutorMessage) => <ChatMessage key={m.id} m={m} onExplore={startNew} />)}
          {pendingText && (
            <>
              <ChatMessage m={{ id: "pending", role: "student", kind: "text", content: pendingText, stepIndex: null, meta: {}, createdAt: "" }} />
              <TypingBubble />
            </>
          )}
          {(busy === "hint" || busy === "reveal" || busy === "practice") && <TypingBubble />}
        </div>

        {active ? (
          <form onSubmit={send} className="border-t border-line bg-white p-3 sm:p-4">
            {showKeys && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {SYMBOLS.map((s) => (
                  <button key={s} type="button" onClick={() => insert(s)} className="h-9 min-w-9 rounded-xl border-2 border-line bg-white px-2 font-display text-lg font-bold hover:border-brand-300 hover:bg-brand-50">
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="flex flex-1 items-end rounded-2xl border-2 border-line bg-white transition-colors focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100">
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  maxLength={2000}
                  placeholder={t("session.placeholder")}
                  className="max-h-32 min-h-12 flex-1 resize-none bg-transparent px-4 py-3 outline-none placeholder:text-ink-muted/70"
                  disabled={!!busy}
                  aria-label={t("session.answerLabel")}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowKeys((v) => !v)}
                  className={clsx("m-1.5 grid h-9 w-9 place-items-center rounded-xl font-display font-extrabold", showKeys ? "bg-brand-100 text-brand-700" : "text-ink-muted hover:bg-cream")}
                  title={t("session.symbols")}
                >
                  ±
                </button>
              </div>
              <button className="btn-primary h-[52px] w-[52px] !px-0" disabled={!text.trim() || !!busy} aria-label={t("session.send")}>
                {busy === "reply" ? <Spinner /> : <SendHorizonal size={20} />}
              </button>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => act("hint")} disabled={!!busy || hintsLeft <= 0} className="btn-ghost btn-sm">
                <Lightbulb size={15} className="text-banana-600" /> {hintsLeft > 0 ? t("session.hintLeft", { n: hintsLeft }) : t("session.noHints")}
              </button>
              {session.canRevealStep && (
                <button type="button" onClick={() => act("reveal")} disabled={!!busy} className="btn-ghost btn-sm">
                  <Eye size={15} className="text-sky-600" /> {t("session.showStep")}
                </button>
              )}
              <span className="ml-auto hidden text-xs font-semibold text-ink-muted sm:block">{t("session.enterHint")}</span>
            </div>
          </form>
        ) : (
          <div className="border-t border-line bg-white p-4">
            {isFact ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void startNew(followUp);
                }}
                className="flex items-center gap-2"
              >
                <input
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  maxLength={2000}
                  placeholder={t("session.followPlaceholder")}
                  className="input"
                  disabled={!!busy}
                  aria-label={t("session.followLabel")}
                />
                <button className="btn-primary h-[52px] w-[52px] shrink-0 !px-0" disabled={!followUp.trim() || !!busy} aria-label={t("session.askButton")}>
                  {busy === "practice" ? <Spinner /> : <SendHorizonal size={20} />}
                </button>
              </form>
            ) : session.status === "solved" ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <p className="font-display text-lg font-extrabold">{t("session.solo")}</p>
                  {practice ? <div className="text-sm text-ink-soft"><Markdown>{practice}</Markdown></div> : <p className="text-sm text-ink-soft">{t("session.keepStreak")}</p>}
                </div>
                <div className="flex gap-2">
                  {practice && (
                    <button onClick={() => startNew(practice)} disabled={busy === "practice"} className="btn-banana">
                      {busy === "practice" ? <Spinner /> : <><Sparkles size={18} /> {t("session.tryWith")}</>}
                    </button>
                  )}
                  <Link href="/tutor" className="btn-ghost"><Plus size={18} /> {t("common.newQuestion")}</Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-ink-soft">{t("session.pausedText")}</p>
                <Link href="/tutor" className="btn-primary btn-sm"><Plus size={16} /> {t("common.newQuestion")}</Link>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
