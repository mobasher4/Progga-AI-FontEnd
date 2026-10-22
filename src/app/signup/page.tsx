"use client";

import clsx from "clsx";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useSWRConfig } from "swr";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ErrorNote, Spinner } from "@/components/ui/primitives";
import { api, ApiError, errorMessage } from "@/lib/api";
import { GRADES } from "@/lib/format";
import type { Language, Role, User } from "@/lib/types";

const ROLES: { id: Exclude<Role, "ADMIN">; icon: string; title: string; text: string }[] = [
  { id: "STUDENT", icon: "🎒", title: "I'm a student", text: "Learn with Progga, earn XP and unlock robot skins." },
  { id: "PARENT", icon: "🏡", title: "I'm a parent", text: "Follow your child's learning and get safety alerts." },
  { id: "TEACHER", icon: "🍎", title: "I'm a teacher", text: "See your students' progress and misconceptions." },
];

const LANGS: { id: Language; label: string; sub: string }[] = [
  { id: "en", label: "English", sub: "Simple English" },
  { id: "bn", label: "বাংলা", sub: "Bangla" },
  { id: "mix", label: "Banglish", sub: "Mix of both" },
];

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { mutate } = useSWRConfig();
  const preset = params.get("role") as Role | null;
  const [role, setRole] = useState<Role | null>(preset && ROLES.some((r) => r.id === preset) ? preset : null);
  const [form, setForm] = useState({ name: "", email: "", password: "", grade: 0, language: "en" as Language });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (role === "STUDENT" && !form.grade) return setError("Pick your class to continue");
    setBusy(true);
    setError(null);
    setFieldErrors({});
    try {
      const { user } = await api<{ user: User }>("/auth/signup", {
        body: { ...form, role, grade: role === "STUDENT" ? form.grade : undefined },
      });
      await mutate("/auth/me", { user }, { revalidate: false });
      router.replace(user.role === "STUDENT" ? "/home?welcome=1" : "/guardian");
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiError && err.details) setFieldErrors(err.details);
      setBusy(false);
    }
  }

  if (!role) {
    return (
      <div className="space-y-3">
        {ROLES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRole(r.id)}
            className="card flex w-full items-center gap-4 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-grape-300 hover:shadow-lift"
          >
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-grape-50 text-3xl">{r.icon}</span>
            <span>
              <span className="block font-display text-xl font-extrabold">{r.title}</span>
              <span className="text-sm text-ink-soft">{r.text}</span>
            </span>
          </button>
        ))}
        <p className="pt-3 text-center text-ink-soft">
          Already have an account? <Link href="/login" className="font-bold text-grape-600 hover:underline">Log in</Link>
        </p>
      </div>
    );
  }

  const fe = (k: string) => fieldErrors[k]?.[0];

  return (
    <form onSubmit={submit} className="space-y-4">
      <button type="button" onClick={() => setRole(null)} className="mb-1 flex items-center gap-1.5 text-sm font-bold text-ink-muted hover:text-ink">
        <ArrowLeft size={16} /> {ROLES.find((r) => r.id === role)?.title}
      </button>
      <div>
        <label className="label" htmlFor="name">{role === "STUDENT" ? "Your name" : "Full name"}</label>
        <input id="name" className="input" required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={role === "STUDENT" ? "e.g. Rafi Ahmed" : "e.g. Farzana Ahmed"} />
        {fe("name") && <p className="mt-1 text-sm text-coral-600">{fe("name")}</p>}
      </div>
      <div>
        <label className="label" htmlFor="email">{role === "STUDENT" ? "Email (or a parent's email)" : "Email"}</label>
        <input id="email" className="input" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
        {fe("email") && <p className="mt-1 text-sm text-coral-600">{fe("email")}</p>}
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" className="input" type="password" required minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="At least 8 characters" />
        {fe("password") && <p className="mt-1 text-sm text-coral-600">{fe("password")}</p>}
      </div>

      {role === "STUDENT" && (
        <>
          <div>
            <span className="label">Your class</span>
            <div className="grid grid-cols-5 gap-2">
              {GRADES.map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => set("grade", g)}
                  className={clsx(
                    "rounded-2xl border-2 py-2.5 font-display text-lg font-extrabold transition-all",
                    form.grade === g ? "border-grape-500 bg-grape-500 text-white shadow-[0_3px_0_0_var(--color-grape-700)]" : "border-line bg-white hover:border-grape-200",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs font-semibold text-ink-muted">11 & 12 = HSC</p>
          </div>
          <div>
            <span className="label">Progga should talk to me in…</span>
            <div className="grid grid-cols-3 gap-2">
              {LANGS.map((l) => (
                <button
                  type="button"
                  key={l.id}
                  onClick={() => set("language", l.id)}
                  className={clsx(
                    "rounded-2xl border-2 px-2 py-2.5 text-center transition-all",
                    form.language === l.id ? "border-grape-500 bg-grape-50" : "border-line bg-white hover:border-grape-200",
                  )}
                >
                  <span className="block font-display font-extrabold">{l.label}</span>
                  <span className="text-xs text-ink-muted">{l.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <ErrorNote message={error} />
      <button className="btn-primary w-full text-lg" disabled={busy}>
        {busy ? <Spinner /> : role === "STUDENT" ? "Start my adventure 🚀" : "Create account"}
      </button>
      <p className="text-center text-xs text-ink-muted">
        Students under 13 should sign up with a parent or teacher nearby.
      </p>
    </form>
  );
}

export default function SignupPage() {
  return (
    <AuthLayout title="Join Progga 🍌" subtitle="Create your free account. It takes less than a minute.">
      <Suspense>
        <SignupForm />
      </Suspense>
    </AuthLayout>
  );
}
