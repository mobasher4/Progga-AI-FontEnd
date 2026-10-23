"use client";

import clsx from "clsx";
import { CheckCircle2, CircleAlert, FlaskConical, Gauge, KeyRound, Save, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { ProggaBot, type BotMood } from "@/components/brand/ProggaBot";
import { useCelebrate } from "@/components/celebrate/CelebrationProvider";
import { ErrorNote, PageLoader, Spinner } from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api";

type ProviderId = "openai" | "deepseek" | "anthropic" | "mock";

interface ProviderInfo {
  id: ProviderId;
  label: string;
  configured: boolean;
  vision: boolean;
  defaultModel: string;
}
interface AiConfig {
  provider: ProviderId;
  /** one model for everything: planning, fact answers and reply checking */
  model: string;
}
interface TestResult {
  ok: boolean;
  planMs: number;
  checkMs?: number;
  title?: string;
  mode?: string;
  steps?: string[];
  sampleFeedback?: { verdict: string; feedback: string } | null;
  error?: string;
}

const PROVIDER_STYLE: Record<ProviderId, { icon: string; tint: string }> = {
  openai: { icon: "🟢", tint: "from-mint-50 to-white" },
  deepseek: { icon: "🐋", tint: "from-sky-50 to-white" },
  anthropic: { icon: "🟠", tint: "from-banana-50 to-white" },
  mock: { icon: "🧪", tint: "from-brand-50 to-white" },
};

const secs = (ms?: number) => (ms === undefined ? "—" : `${(ms / 1000).toFixed(1)}s`);

export default function AiSettingsPage() {
  const { data, mutate } = useSWR<{ config: AiConfig; providers: ProviderInfo[] }>("/admin/ai");
  const { mutate: globalMutate } = useSWRConfig();
  const { toast, burst } = useCelebrate();
  const [draft, setDraft] = useState<AiConfig | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data && !draft) setDraft(data.config);
  }, [data, draft]);

  const { data: models, isLoading: modelsLoading, error: modelsError } = useSWR<{ models: string[] }>(
    draft ? `/admin/ai/models?provider=${draft.provider}` : null,
  );

  if (!data || !draft) return <PageLoader label="Loading AI settings…" />;

  const active = data.config;
  const activeProvider = data.providers.find((p) => p.id === active.provider)!;
  const dirty = draft.provider !== active.provider || draft.model !== active.model;

  function pickProvider(p: ProviderInfo) {
    if (!p.configured) return;
    setResult(null);
    setError(null);
    // keep the current choice when re-selecting the active provider, otherwise start from that provider's defaults
    setDraft(p.id === active.provider ? active : { provider: p.id, model: p.defaultModel });
  }

  async function test() {
    if (!draft) return;
    setTesting(true);
    setResult(null);
    setError(null);
    try {
      setResult(await api<TestResult>("/admin/ai/test", { body: draft }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setTesting(false);
    }
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      await api("/admin/ai", { method: "PUT", body: draft });
      await mutate();
      void globalMutate("/health");
      burst();
      toast(`Progga now thinks with ${draft.model}`, "🧠", "brand");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  const botMood: BotMood = testing ? "thinking" : result?.ok ? "happy" : result && !result.ok ? "oops" : "idle";

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Admin · AI settings</p>
        <h1 className="mt-1 text-4xl font-extrabold">Progga&apos;s brain 🧠</h1>
        <p className="mt-1 max-w-2xl text-ink-soft">Choose which AI provider and model power the tutor. Changes apply instantly for every student, no restart needed.</p>
      </div>

      {/* Currently active */}
      <div className="card flex flex-col gap-5 bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white sm:flex-row sm:items-center">
        <ProggaBot size={110} mood={botMood} />
        <div className="flex-1">
          <p className="text-xs font-extrabold uppercase tracking-wider text-banana-300">Live right now</p>
          <p className="mt-1 font-display text-3xl font-extrabold">
            {activeProvider.label} · {active.model}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold">
            <span className="rounded-full bg-white/15 px-3 py-1">One model for planning, facts & checking answers</span>
            <span className="rounded-full bg-white/15 px-3 py-1">{activeProvider.vision ? "📷 Reads photos" : "✏️ Text only"}</span>
          </div>
        </div>
      </div>

      {/* Provider picker */}
      <section>
        <h2 className="mb-3 text-xl font-extrabold">1 · Provider</h2>
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
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-extrabold">
                  <span className={clsx("flex items-center gap-1 rounded-full px-2 py-0.5", p.configured ? "bg-mint-100 text-mint-700" : "bg-coral-100 text-coral-600")}>
                    <KeyRound size={11} /> {p.id === "mock" ? "No key needed" : p.configured ? "Key found" : "No API key"}
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-ink-soft">{p.vision ? "📷 Photos" : "✏️ Text"}</span>
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs font-semibold text-ink-muted">Providers without a key are disabled. Add the key to backend/.env and restart the API to enable them.</p>
      </section>

      {/* Model pickers */}
      <section className="card p-6">
        <h2 className="text-xl font-extrabold">2 · Model</h2>
        <p className="mt-1 text-sm text-ink-soft">Pick from the models your key can use, or type any model id.</p>
        <div className="mt-5 max-w-md">
          <ModelField
            label="Model"
            help="Used for everything: planning the steps, answering fact questions and checking every student reply."
            value={draft.model}
            onChange={(model) => {
              setResult(null);
              setDraft({ ...draft, model });
            }}
            models={models?.models}
            loading={modelsLoading}
            listId="ai-models"
          />
        </div>
        {modelsError && <p className="mt-3 text-sm font-semibold text-coral-600">Couldn&apos;t load the model list: {errorMessage(modelsError)}</p>}
        {models && <p className="mt-3 text-xs font-semibold text-ink-muted">{models.models.length} chat models available to this key.</p>}
      </section>

      {/* Test + save */}
      <section className="card p-6">
        <h2 className="text-xl font-extrabold">3 · Test & switch</h2>
        <p className="mt-1 text-sm text-ink-soft">The test plans &quot;Solve 2x + 3 = 11&quot; and checks one sample reply, exactly like a real student session.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={test} disabled={testing || saving} className="btn-ghost">
            {testing ? <Spinner /> : <FlaskConical size={18} />} {testing ? "Testing…" : "Test this model"}
          </button>
          <button onClick={save} disabled={!dirty || saving || testing} className="btn-primary">
            {saving ? <Spinner /> : <Save size={18} />} {dirty ? "Save & switch" : "Already live"}
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <ErrorNote message={error} />
          {result && (
            <div className={clsx("rounded-3xl border-2 p-5", result.ok ? "border-mint-300 bg-mint-50" : "border-coral-100 bg-coral-50")}>
              <p className={clsx("flex items-center gap-2 font-display text-lg font-extrabold", result.ok ? "text-mint-700" : "text-coral-600")}>
                {result.ok ? <CheckCircle2 size={20} /> : <CircleAlert size={20} />}
                {result.ok ? "It works!" : "That didn't work"}
              </p>
              {result.ok ? (
                <>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold">
                    <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1"><Gauge size={14} /> Plan: {secs(result.planMs)}</span>
                    <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1"><Gauge size={14} /> Check: {secs(result.checkMs)}</span>
                    <span className="rounded-full bg-white px-3 py-1">Mode: {result.mode}</span>
                  </div>
                  <p className="mt-3 font-display font-bold">&quot;{result.title}&quot;</p>
                  <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm text-ink-soft">
                    {result.steps?.map((s) => <li key={s}>{s}</li>)}
                  </ol>
                  {result.sampleFeedback && (
                    <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm">
                      <span className="font-extrabold">Sample feedback ({result.sampleFeedback.verdict}):</span> {result.sampleFeedback.feedback}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-1 text-sm text-ink-soft">{result.error}</p>
              )}
            </div>
          )}
          {!result && !testing && dirty && (
            <p className="flex items-center gap-2 text-sm font-semibold text-banana-700">
              <Sparkles size={16} /> Tip: test before switching so students never hit a broken model.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function ModelField({
  label,
  help,
  value,
  onChange,
  models,
  loading,
  listId,
}: {
  label: string;
  help: string;
  value: string;
  onChange: (v: string) => void;
  models?: string[];
  loading: boolean;
  listId: string;
}) {
  const known = !models || models.includes(value);
  return (
    <div>
      <label className="label" htmlFor={listId}>{label}</label>
      <div className="relative">
        <input
          id={listId}
          className="input pr-10 font-mono text-[15px]"
          list={`${listId}-options`}
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          placeholder={loading ? "Loading models…" : "model id"}
          spellCheck={false}
          autoComplete="off"
        />
        {loading && <Spinner size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />}
        <datalist id={`${listId}-options`}>
          {models?.map((m) => <option key={m} value={m} />)}
        </datalist>
      </div>
      <p className="mt-1.5 text-xs text-ink-muted">{help}</p>
      {!known && value && <p className="mt-1 text-xs font-bold text-banana-700">Not in this key&apos;s model list. Run a test first.</p>}
    </div>
  );
}
