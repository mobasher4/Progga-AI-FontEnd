"use client";

import clsx from "clsx";
import { KeyRound, Play, Save, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useCelebrate } from "@/components/celebrate/CelebrationProvider";
import { ErrorNote, PageLoader, Spinner } from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api";

type TtsProviderId = "indicf5" | "openai" | "gemini" | "azure";

interface VoiceOption {
  id: string;
  label: string;
  note?: string;
}
interface TtsProviderInfo {
  id: TtsProviderId;
  label: string;
  configured: boolean;
  keyHint: string;
  model: string;
  bangla: string;
  voices: VoiceOption[];
  defaultVoice: string;
  lift: number;
}
interface VoiceConfig {
  provider: TtsProviderId;
  voice: string;
}

const PROVIDER_STYLE: Record<TtsProviderId, { icon: string; tint: string }> = {
  indicf5: { icon: "🖥️", tint: "from-banana-50 to-white" },
  gemini: { icon: "✨", tint: "from-sky-50 to-white" },
  azure: { icon: "🔷", tint: "from-brand-50 to-white" },
  openai: { icon: "🟢", tint: "from-mint-50 to-white" },
};

const SAMPLES = {
  bn: "হাই! আমি প্রজ্ঞা। চলো একসাথে অঙ্কটা করি। $2x + 3 = 11$ হলে, প্রথমে দুই দিক থেকে ৩ বিয়োগ করি। দারুণ ভেবেছ!",
  en: "Hi! I'm Progga. Let's solve this together. If $2x + 3 = 11$, first we take 3 away from both sides. Nice thinking!",
};

/** Admin: pick the text-to-speech engine and voice Progga reads its replies with. */
export function VoiceSettings() {
  const { data, mutate } = useSWR<{ config: VoiceConfig; providers: TtsProviderInfo[] }>("/admin/voice");
  const { mutate: globalMutate } = useSWRConfig();
  const { toast, burst } = useCelebrate();
  const [draft, setDraft] = useState<VoiceConfig | null>(null);
  const [sample, setSample] = useState(SAMPLES.bn);
  const [previewing, setPreviewing] = useState<"loading" | "playing" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (data && !draft) setDraft(data.config);
  }, [data, draft]);
  useEffect(() => () => audio.current?.pause(), []);

  if (!data || !draft) return <PageLoader label="Loading voice settings…" />;

  const active = data.config;
  const activeProvider = data.providers.find((p) => p.id === active.provider)!;
  const provider = data.providers.find((p) => p.id === draft.provider)!;
  const dirty = draft.provider !== active.provider || draft.voice !== active.voice;

  function stop() {
    audio.current?.pause();
    setPreviewing(null);
  }

  function pickProvider(p: TtsProviderInfo) {
    if (!p.configured) return;
    stop();
    setError(null);
    setDraft(p.id === active.provider ? active : { provider: p.id, voice: p.defaultVoice });
  }

  async function preview() {
    if (!draft) return;
    stop();
    setError(null);
    setPreviewing("loading");
    try {
      const res = await fetch("/api/admin/voice/preview", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, text: sample }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(body?.error?.message ?? "Preview failed");
      }
      const url = URL.createObjectURL(await res.blob());
      const el = new Audio(url);
      audio.current = el;
      // play it the way students will hear it
      el.preservesPitch = false;
      el.playbackRate = provider.lift;
      el.onended = () => {
        setPreviewing(null);
        URL.revokeObjectURL(url);
      };
      await el.play();
      setPreviewing("playing");
    } catch (e) {
      setPreviewing(null);
      setError(errorMessage(e));
    }
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      await api("/admin/voice", { method: "PUT", body: draft });
      await mutate();
      void globalMutate("/health");
      burst();
      toast(`Progga now speaks as ${draft.voice}`, "🔊", "brand");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold">Progga&apos;s voice 🔊</h2>
        <p className="mt-1 max-w-2xl text-ink-soft">
          Choose the text-to-speech engine and voice that read Progga&apos;s replies aloud. Listen to a sample first; changes apply instantly for every student.
        </p>
        <p className="mt-2 inline-block rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">
          Live: {activeProvider.label} · {active.voice}
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-xl font-extrabold">1 · Engine</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.providers.map((p) => {
            const selected = draft.provider === p.id;
            return (
              <button
                key={p.id}
                onClick={() => pickProvider(p)}
                disabled={!p.configured}
                className={clsx(
                  "card relative bg-gradient-to-br p-4 text-left transition-all",
                  PROVIDER_STYLE[p.id].tint,
                  selected ? "border-2 border-brand-500 ring-4 ring-brand-100" : "hover:-translate-y-0.5 hover:shadow-lift",
                  !p.configured && "cursor-not-allowed opacity-55 hover:translate-y-0 hover:shadow-soft",
                )}
              >
                {active.provider === p.id && <span className="absolute right-3 top-3 rounded-full bg-mint-500 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">Live</span>}
                <span className="text-2xl">{PROVIDER_STYLE[p.id].icon}</span>
                <p className="mt-2 font-display text-lg font-extrabold leading-tight">{p.label}</p>
                <p className="mt-1 text-xs font-semibold text-ink-soft">বাংলা: {p.bangla}</p>
                <span className={clsx("mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold", p.configured ? "bg-mint-100 text-mint-700" : "bg-coral-100 text-coral-600")}>
                  <KeyRound size={11} /> {p.configured ? "Key found" : `Needs ${p.keyHint}`}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs font-semibold text-ink-muted">Engines without a key are disabled. Add the key to backend/.env and restart the API to enable them.</p>
      </section>

      <section className="card p-6">
        <h3 className="text-xl font-extrabold">2 · Voice</h3>
        <p className="mt-1 text-sm text-ink-soft">{provider.label} · model {provider.model}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {provider.voices.map((v) => {
            const on = draft.voice === v.id;
            return (
              <button
                key={v.id}
                onClick={() => {
                  stop();
                  setDraft({ ...draft, voice: v.id });
                }}
                className={clsx(
                  "rounded-2xl border-2 px-3 py-1.5 text-left text-sm transition-colors",
                  on ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-white hover:border-brand-200",
                )}
              >
                <span className="font-extrabold">{v.label}</span>
                {v.note && <span className="ml-1.5 text-xs font-semibold text-ink-muted">{v.note}</span>}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card p-6">
        <h3 className="text-xl font-extrabold">3 · Listen & switch</h3>
        <div className="mt-3 flex gap-2">
          <button onClick={() => setSample(SAMPLES.bn)} className={clsx("btn-ghost btn-sm", sample === SAMPLES.bn && "bg-brand-50 text-brand-700")}>বাংলা sample</button>
          <button onClick={() => setSample(SAMPLES.en)} className={clsx("btn-ghost btn-sm", sample === SAMPLES.en && "bg-brand-50 text-brand-700")}>English sample</button>
        </div>
        <label className="label mt-3" htmlFor="voice-sample">What Progga says</label>
        <textarea id="voice-sample" className="input min-h-24" maxLength={600} value={sample} onChange={(e) => setSample(e.target.value)} />
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={previewing ? stop : preview} disabled={saving || !sample.trim()} className="btn-ghost">
            {previewing === "loading" ? <Spinner /> : previewing === "playing" ? <Square size={18} /> : <Play size={18} />}
            {previewing === "loading" ? "Recording…" : previewing === "playing" ? "Stop" : `Listen to ${draft.voice}`}
          </button>
          <button onClick={save} disabled={!dirty || saving} className="btn-primary">
            {saving ? <Spinner /> : <Save size={18} />} {dirty ? "Save & switch" : "Already live"}
          </button>
        </div>
        <div className="mt-4">
          <ErrorNote message={error} />
        </div>
      </section>
    </div>
  );
}
