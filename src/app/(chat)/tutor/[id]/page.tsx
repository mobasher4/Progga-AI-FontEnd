"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Lightbulb, PanelRightClose, PanelRightOpen, Pause, Sparkles, X } from "lucide-react";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ProggaBot, type BotMood } from "@/components/brand/ProggaBot";
import { useCelebrate } from "@/components/celebrate/CelebrationProvider";
import { ChatComposer, type ComposerHandle } from "@/components/chat/ChatComposer";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { useChatLayout } from "@/components/chat/ChatShell";
import { ChatMessage, TypingBubble } from "@/components/tutor/ChatMessage";
import { MissionMap } from "@/components/tutor/MissionMap";
import { RelatedVideosCard, latestVideos } from "@/components/tutor/RelatedVideos";
import { PageLoader, ProgressBar } from "@/components/ui/primitives";
import { useT, type TKey } from "@/i18n";
import { api, errorMessage } from "@/lib/api";
import { paletteFor } from "@/lib/skins";
import { startTutorSession } from "@/lib/tutor";
import type { LessonCard, Palette, TutorActionResult, TutorSession } from "@/lib/types";

type Busy = null | "reply" | "hint" | "reveal" | "practice";
type MoodLine = { mood: BotMood; line: TKey };

const REACTION_MS = 2600;
const WIDE = 1280; // progress panel is docked from this width up

/** How Progga reacts to the newest tutor messages (before settling into "asking"). */
function reactionFor(session: TutorSession): MoodLine | null {
  const last = [...session.messages].reverse().find((m) => m.role === "tutor" && m.kind !== "question");
  const verdict = last?.meta.verdict;
  if (last?.kind === "why" || verdict === "correct") return { mood: "happy", line: "session.happy" };
  if (verdict === "incorrect") return { mood: "oops", line: "session.oops" };
  if (verdict === "partial") return { mood: "talking", line: "session.partial" };
  if (last?.kind === "hint") return { mood: "talking", line: "session.hint" };
  if (last?.kind === "teach") return { mood: "talking", line: "session.teach" };
  if (last?.kind === "reveal") return { mood: "talking", line: "session.reveal" };
  if (last?.kind === "safety") return { mood: "idle", line: "session.safety" };
  return null;
}

/**
 * Progga's live expression: thinking while it works → a short reaction to the
 * student's answer → curious "asking" face while it waits for the next reply.
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
  return waitingOnStudent ? { mood: "asking", line: "session.asking" } : reaction ?? { mood: "idle", line: "session.idle" };
}

const MODE_LABEL: Record<TutorSession["mode"], TKey> = {
  problem: "session.modeProblem",
  concept: "session.modeConcept",
  fact: "session.modeFact",
};

export default function TutorSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, refreshHistory } = useChatLayout();
  const { t, n } = useT();
  const { celebrate, toast, burst } = useCelebrate();
  const { data, mutate } = useSWR<{ session: TutorSession }>(`/tutor/sessions/${id}`);
  const [text, setText] = useState("");
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composer = useRef<ComposerHandle>(null);

  const session = data?.session;
  const messageCount = session?.messages.length ?? 0;

  useEffect(() => {
    setPanelOpen(window.innerWidth >= WIDE);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messageCount, pendingText, busy]);

  const practice = useMemo(
    () => session?.messages.find((m) => typeof m.meta.practice === "string")?.meta.practice as string | undefined,
    [session?.messages],
  );
  const moodLine = useBotMood(session, busy);
  const videos = useMemo(() => latestVideos(session?.messages ?? []), [session?.messages]);

  // Progga just offered videos while helping: make sure the side panel showing them is open.
  const hadVideos = useRef<boolean | null>(null);
  useEffect(() => {
    if (!session) return;
    if (hadVideos.current === false && videos.length && window.innerWidth >= WIDE) setPanelOpen(true);
    hadVideos.current = videos.length > 0;
  }, [session, videos.length]);

  if (!session || !moodLine) return <PageLoader label={t("session.opening")} />;

  const isFact = session.mode === "fact";
  const active = session.status === "active";
  const current = session.steps[session.currentStep];
  const hintsLeft = current ? current.hintsTotal - current.hintsShown : 0;
  const doneSteps = session.steps.filter((s) => s.state === "done" || s.state === "revealed").length;
  const palette = user.skin?.palette ?? paletteFor(user.avatarSkin);

  async function act(kind: "reply" | "hint" | "reveal", body?: unknown) {
    setBusy(kind);
    try {
      const path = kind === "reply" ? "reply" : kind === "hint" ? "hint" : "reveal-step";
      const res = await api<TutorActionResult>(`/tutor/sessions/${id}/${path}`, { method: "POST", body });
      await mutate({ session: res.session }, { revalidate: false });
      celebrate(res.rewards, { confetti: res.session.status === "solved" });
      if (res.session.status === "solved" && !res.rewards) burst();
      refreshHistory();
      return true;
    } catch (e) {
      toast(errorMessage(e), "⚠️", "coral");
      return false;
    } finally {
      setBusy(null);
      setPendingText(null);
    }
  }

  async function send() {
    const msg = text.trim();
    if (!msg || busy) return;
    setPendingText(msg);
    setText("");
    const ok = await act("reply", { message: msg });
    if (!ok) setText(msg);
    composer.current?.focus();
  }

  /** Practice problem, explore chip or follow-up question → a brand-new chat. */
  async function startNew(question: string) {
    if (!question.trim() || busy) return;
    setBusy("practice");
    setPendingText(question.trim());
    setText("");
    try {
      const res = await startTutorSession(question.trim(), session!.subject);
      if (res.blocked) throw new Error(res.message);
      await mutate(); // keep this chat's cache fresh for when the student comes back
      refreshHistory();
      router.push(`/tutor/${res.session.id}`);
    } catch (e) {
      toast(errorMessage(e), "⚠️", "coral");
      setBusy(null);
      setPendingText(null);
    }
  }

  async function pause() {
    await api(`/tutor/sessions/${id}/abandon`, { method: "POST" }).catch(() => undefined);
    refreshHistory();
    router.push("/tutor");
  }

  const subtitle = (
    <>
      {session.topic} · {t(MODE_LABEL[session.mode])}
      {!isFact && (
        <>
          {" · "}
          {session.status === "solved"
            ? t("session.complete")
            : t("session.stepOf", { n: Math.min(session.currentStep + 1, session.totalSteps), total: session.totalSteps })}
        </>
      )}
    </>
  );

  return (
    <>
      <ChatHeader
        title={session.title}
        subtitle={subtitle}
        actions={
          <>
            {active && (
              <button onClick={pause} className="hidden h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-ink-soft hover:bg-cream md:flex" title={t("session.pauseTitle")}>
                <Pause size={16} /> {t("session.pause")}
              </button>
            )}
            <button
              onClick={() => setPanelOpen((v) => !v)}
              className={clsx("grid h-10 w-10 place-items-center rounded-xl transition-colors", panelOpen ? "bg-grape-50 text-grape-600" : "text-ink-soft hover:bg-cream")}
              aria-label={panelOpen ? t("chatui.hideProgress") : t("chatui.showProgress")}
              title={panelOpen ? t("chatui.hideProgress") : t("chatui.showProgress")}
            >
              {panelOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
            </button>
          </>
        }
      />
      {!isFact && (
        <ProgressBar value={doneSteps / Math.max(1, session.totalSteps)} height="h-1" color="bg-mint-500" track="bg-mint-50" className="shrink-0 !rounded-none" />
      )}

      <div className="flex min-h-0 flex-1">
        {/* Conversation + composer */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl space-y-3 px-4 py-6 sm:px-6">
              {session.messages.map((m) => <ChatMessage key={m.id} m={m} onExplore={startNew} />)}
              {pendingText && (
                <>
                  <ChatMessage m={{ id: "pending", role: "student", kind: "text", content: pendingText, stepIndex: null, meta: {}, createdAt: "" }} />
                  <TypingBubble />
                </>
              )}
              {(busy === "hint" || busy === "reveal") && <TypingBubble />}
            </div>
          </div>

          {active ? (
            <ChatComposer
              ref={composer}
              value={text}
              onChange={setText}
              onSubmit={send}
              placeholder={t("session.placeholder")}
              label={t("session.answerLabel")}
              busy={busy === "reply"}
              disabled={!!busy}
              autoFocus
              above={
                <>
                  <ActionChip onClick={() => act("hint")} disabled={!!busy || hintsLeft <= 0} icon={<Lightbulb size={15} className="text-banana-600" />}>
                    {hintsLeft > 0 ? t("session.hintLeft", { n: hintsLeft }) : t("session.noHints")}
                  </ActionChip>
                  {session.canRevealStep && (
                    <ActionChip onClick={() => act("reveal")} disabled={!!busy} icon={<Eye size={15} className="text-sky-600" />}>
                      {t("session.showStep")}
                    </ActionChip>
                  )}
                  <span className="ml-auto rounded-full bg-grape-50 px-3 py-1 text-xs font-extrabold text-grape-600">
                    {t("session.stepOf", { n: Math.min(session.currentStep + 1, session.totalSteps), total: session.totalSteps })}
                  </span>
                </>
              }
            />
          ) : (
            <ChatComposer
              ref={composer}
              value={text}
              onChange={setText}
              onSubmit={() => startNew(text)}
              placeholder={t("chatui.followUp")}
              label={t("session.followLabel")}
              busy={busy === "practice"}
              disabled={!!busy}
              above={
                practice && session.status === "solved" ? (
                  <ActionChip onClick={() => startNew(practice)} disabled={!!busy} icon={<Sparkles size={15} className="text-banana-600" />} highlight>
                    {t("session.tryWith")}: <span className="font-semibold">{practice.replace(/\$/g, "")}</span>
                  </ActionChip>
                ) : undefined
              }
            />
          )}
        </div>

        {/* Progress panel: docked on wide screens, a slide-over below that */}
        <AnimatePresence initial={false}>
          {panelOpen && (
            <>
              <motion.div
                key="scrim"
                className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px] xl:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPanelOpen(false)}
              />
              <motion.aside
                key="panel"
                className="fixed inset-y-0 right-0 z-50 w-[88%] max-w-[340px] overflow-y-auto border-l border-line bg-cream shadow-lift xl:static xl:z-auto xl:w-[320px] xl:max-w-none xl:shadow-none"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
              >
                <ProgressPanel
                  session={session}
                  mood={moodLine.mood}
                  line={t(moodLine.line)}
                  palette={palette}
                  onClose={() => setPanelOpen(false)}
                  xp={n(session.xpEarned)}
                  hints={n(session.hintsUsed)}
                  videos={videos}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

function ActionChip({
  children,
  onClick,
  disabled,
  icon,
  highlight,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "inline-flex max-w-full items-center gap-1.5 truncate rounded-full border px-3.5 py-1.5 text-sm font-bold transition-colors disabled:opacity-50",
        highlight ? "border-banana-300 bg-banana-50 text-ink hover:bg-banana-100" : "border-line bg-white text-ink-soft hover:border-grape-200 hover:text-ink",
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
    </button>
  );
}

function ProgressPanel({
  session,
  mood,
  line,
  palette,
  onClose,
  xp,
  hints,
  videos,
}: {
  session: TutorSession;
  mood: BotMood;
  line: string;
  palette: Palette;
  onClose: () => void;
  xp: string;
  hints: string;
  videos: LessonCard[];
}) {
  const { t } = useT();
  const isFact = session.mode === "fact";
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <p className="eyebrow">{t("chatui.progress")}</p>
        <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted hover:bg-white xl:hidden" aria-label={t("common.close")}>
          <X size={17} />
        </button>
      </div>

      <div className="card flex flex-col items-center p-4 text-center">
        <ProggaBot size={130} mood={mood} palette={palette} />
        <p className="mt-2 rounded-2xl bg-grape-50 px-3 py-2 text-sm font-display font-bold text-grape-700">{line}</p>
      </div>

      {videos.length > 0 && <RelatedVideosCard videos={videos} />}

      {isFact ? (
        <div className="card p-4">
          <p className="eyebrow mb-2">{t("session.quickTitle")}</p>
          <p className="text-sm text-ink-soft">{t("session.quickBody")}</p>
          <p className="mt-3 rounded-2xl bg-grape-50 p-3 text-sm font-semibold text-grape-700">{t("session.quickTip")}</p>
        </div>
      ) : (
        <>
          <div className="card p-4">
            <p className="eyebrow mb-4">{t("session.missionMap")}</p>
            <MissionMap session={session} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-3 text-center">
              <p className="font-display text-2xl font-extrabold text-grape-600">{xp}</p>
              <p className="text-xs font-bold text-ink-muted">{t("session.xpEarned")}</p>
            </div>
            <div className="card p-3 text-center">
              <p className="font-display text-2xl font-extrabold text-sky-600">{hints}</p>
              <p className="text-xs font-bold text-ink-muted">{t("session.hintsUsed")}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
