"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Camera, ImagePlus, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { ProggaBot, type BotMood } from "@/components/brand/ProggaBot";
import { SessionRow } from "@/components/cards";
import { ErrorNote, SectionTitle } from "@/components/ui/primitives";
import { useT, type TKey } from "@/i18n";
import { errorMessage } from "@/lib/api";
import { paletteFor } from "@/lib/skins";
import { EXAMPLES, EXAMPLES_BN, startTutorSession } from "@/lib/tutor";
import type { SessionSummary, Subject } from "@/lib/types";
import { useEngine } from "@/lib/useEngine";
import { useMe } from "@/lib/useMe";

const PLANNING_LINES: TKey[] = ["ask.plan1", "ask.plan2", "ask.plan3", "ask.plan4"];
const FEATURES: [string, TKey, TKey][] = [
  ["🧩", "ask.f1t", "ask.f1d"],
  ["💡", "ask.f2t", "ask.f2d"],
  ["🧠", "ask.f3t", "ask.f3d"],
];

function NewQuestion() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useMe();
  const { t, ui } = useT();
  const { mutate } = useSWRConfig();
  const { data: subjectsData } = useSWR<{ subjects: Subject[] }>(user?.grade ? `/subjects?grade=${user.grade}` : null);
  const { data: history } = useSWR<{ sessions: SessionSummary[] }>("/tutor/sessions");

  const [subject, setSubject] = useState(params.get("subject") ?? "math");
  const [question, setQuestion] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [line, setLine] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { vision } = useEngine();

  useEffect(() => {
    if (params.get("photo") && vision) fileRef.current?.click();
  }, [params, vision]);

  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(() => setLine((l) => Math.min(l + 1, PLANNING_LINES.length - 1)), 1600);
    return () => clearInterval(timer);
  }, [busy]);

  function pickImage(f: File | undefined) {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return setError(t("ask.tooBig"));
    setImage(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!question.trim() && !image) return;
    setBusy(true);
    setLine(0);
    setError(null);
    setBlocked(null);
    try {
      const res = await startTutorSession(question.trim(), subject, image);
      if (res.blocked) {
        setBlocked(res.message);
        setBusy(false);
        return;
      }
      await mutate(`/tutor/sessions/${res.session.id}`, { session: res.session }, { revalidate: false });
      router.push(`/tutor/${res.session.id}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  // listening (curious face) while the student types, scanning eyes while planning
  const mood: BotMood = busy ? "thinking" : blocked ? "oops" : question ? "asking" : "idle";
  const subjects = subjectsData?.subjects ?? [];
  const examples = (ui === "bn" ? EXAMPLES_BN : EXAMPLES)[subject] ?? (ui === "bn" ? EXAMPLES_BN : EXAMPLES).math;

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-line bg-white p-5 shadow-soft sm:p-8">
        <div className="bg-dots absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[220px_1fr]">
          <div className="flex min-w-0 flex-col items-center text-center lg:pt-4">
            <ProggaBot size={150} mood={mood} palette={user?.skin?.palette ?? paletteFor(user?.avatarSkin)} />
            <AnimatePresence mode="wait">
              <motion.p
                key={busy ? line : blocked ? "b" : "i"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-3 rounded-2xl bg-grape-50 px-4 py-2 font-display font-bold text-grape-700"
              >
                {busy ? t(PLANNING_LINES[line]) : blocked ? t("ask.tryElse") : t("ask.ready")}
              </motion.p>
            </AnimatePresence>
          </div>

          <form onSubmit={submit} className="min-w-0">
            <p className="eyebrow">{t("ask.eyebrow")}</p>
            <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{t("ask.title")}</h1>
            <p className="mt-2 text-ink-soft">{t("ask.body")}</p>

            <div className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1">
              {subjects.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setSubject(s.id)}
                  className={clsx("chip shrink-0", subject === s.id ? "border-grape-500 bg-grape-500 text-white" : "border-line bg-white text-ink-soft hover:border-grape-200")}
                >
                  <span>{s.icon}</span> {ui === "bn" ? s.nameBn : s.name}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-3xl border-2 border-line bg-white p-2 transition-colors focus-within:border-grape-400 focus-within:ring-4 focus-within:ring-grape-100">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                }}
                rows={4}
                maxLength={2000}
                placeholder={t("ask.placeholder")}
                className="w-full resize-none bg-transparent px-3 py-2 text-lg outline-none placeholder:text-ink-muted/70"
                disabled={busy}
                aria-label={t("ask.questionLabel")}
              />
              {preview && (
                <div className="relative mx-3 mb-2 inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt={t("ask.photoAlt")} className="h-28 rounded-2xl border border-line object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setPreview(null);
                    }}
                    className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-ink text-white"
                    aria-label={t("ask.removePhoto")}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between gap-2 border-t border-line px-1 pt-2">
                <div className="flex gap-1">
                  {vision && (
                    <>
                      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pickImage(e.target.files?.[0])} />
                      <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost btn-sm" disabled={busy}>
                        {image ? <ImagePlus size={17} /> : <Camera size={17} />}{" "}
                        <span className="hidden sm:inline">{image ? t("ask.changePhoto") : t("ask.addPhoto")}</span>
                      </button>
                    </>
                  )}
                </div>
                <button className="btn-primary" disabled={busy || (!question.trim() && !image)}>
                  {busy ? t("ask.planning") : t("ask.start")} <ArrowRight size={19} />
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-ink-muted">{t("ask.try")}</span>
              {examples.map((ex) => (
                <button key={ex} type="button" onClick={() => setQuestion(ex)} className="chip border-banana-200 bg-banana-50 text-ink hover:border-banana-400" disabled={busy}>
                  {ex}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              <ErrorNote message={error} />
              {blocked && (
                <div className="rounded-3xl border-2 border-coral-100 bg-coral-50 p-4 text-ink" role="status">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-coral-600">{t("ask.says")}</p>
                  <p className="mt-1">{blocked}</p>
                </div>
              )}
            </div>
          </form>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map(([icon, title, text]) => (
          <div key={title} className="card p-5">
            <span className="text-3xl">{icon}</span>
            <h3 className="mt-2 text-lg font-extrabold">{t(title)}</h3>
            <p className="mt-1 text-sm text-ink-soft">{t(text)}</p>
          </div>
        ))}
      </section>

      {!!history?.sessions.length && (
        <section className="card p-5 sm:p-6">
          <SectionTitle eyebrow={t("ask.historyEyebrow")} title={t("ask.history")} />
          <div className="-mx-3 grid gap-1 md:grid-cols-2">
            {history.sessions.map((s) => <SessionRow key={s.id} s={s} />)}
          </div>
        </section>
      )}
    </div>
  );
}

export default function TutorHome() {
  return (
    <Suspense>
      <NewQuestion />
    </Suspense>
  );
}
