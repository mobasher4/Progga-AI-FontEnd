"use client";

import clsx from "clsx";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useSWRConfig } from "swr";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ErrorNote, Spinner } from "@/components/ui/primitives";
import { useT, type TKey } from "@/i18n";
import { api, ApiError, errorMessage } from "@/lib/api";
import { GRADES } from "@/lib/format";
import { homeFor } from "@/lib/routes";
import type { Language, Role, User } from "@/lib/types";

const ROLES: { id: Exclude<Role, "ADMIN">; icon: string; title: TKey; text: TKey }[] = [
  { id: "STUDENT", icon: "🎒", title: "auth.roleStudent", text: "auth.roleStudentText" },
  { id: "PARENT", icon: "🏡", title: "auth.roleParent", text: "auth.roleParentText" },
  { id: "TEACHER", icon: "🍎", title: "auth.roleTeacher", text: "auth.roleTeacherText" },
];

const LANGS: { id: Language; label: TKey; sub: TKey }[] = [
  { id: "en", label: "lang.en", sub: "auth.langEnSub" },
  { id: "bn", label: "lang.bn", sub: "auth.langBnSub" },
];

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { mutate } = useSWRConfig();
  const { t, n, lang, setLang } = useT();
  const preset = params.get("role") as Role | null;
  const [role, setRole] = useState<Role | null>(preset && ROLES.some((r) => r.id === preset) ? preset : null);
  const [form, setForm] = useState({ name: "", email: "", password: "", grade: 0 });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (role === "STUDENT" && !form.grade) return setError(t("auth.pickClass"));
    setBusy(true);
    setError(null);
    setFieldErrors({});
    try {
      const { user } = await api<{ user: User }>("/auth/signup", {
        // the account starts in whatever language the person is using right now
        body: { ...form, language: lang, role, grade: role === "STUDENT" ? form.grade : undefined },
      });
      await mutate("/auth/me", { user }, { revalidate: false });
      router.replace(user.role === "STUDENT" ? "/home?welcome=1" : homeFor(user.role));
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
            className="card flex w-full items-center gap-4 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift"
          >
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-3xl">{r.icon}</span>
            <span>
              <span className="block font-display text-xl font-extrabold">{t(r.title)}</span>
              <span className="text-sm text-ink-soft">{t(r.text)}</span>
            </span>
          </button>
        ))}
        <p className="pt-3 text-center text-ink-soft">
          {t("auth.haveAccount")} <Link href="/login" className="font-bold text-brand-600 hover:underline">{t("auth.loginButton")}</Link>
        </p>
      </div>
    );
  }

  const fe = (k: string) => fieldErrors[k]?.[0];
  const roleInfo = ROLES.find((r) => r.id === role);

  return (
    <form onSubmit={submit} className="space-y-4">
      <button type="button" onClick={() => setRole(null)} className="mb-1 flex items-center gap-1.5 text-sm font-bold text-ink-muted hover:text-ink">
        <ArrowLeft size={16} /> {roleInfo && t(roleInfo.title)}
      </button>
      <div>
        <label className="label" htmlFor="name">{role === "STUDENT" ? t("auth.yourName") : t("auth.fullName")}</label>
        <input id="name" className="input" required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={role === "STUDENT" ? t("auth.namePhStudent") : t("auth.namePhAdult")} />
        {fe("name") && <p className="mt-1 text-sm text-coral-600">{fe("name")}</p>}
      </div>
      <div>
        <label className="label" htmlFor="email">{role === "STUDENT" ? t("auth.emailStudent") : t("auth.email")}</label>
        <input id="email" className="input" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
        {fe("email") && <p className="mt-1 text-sm text-coral-600">{fe("email")}</p>}
      </div>
      <div>
        <label className="label" htmlFor="password">{t("auth.password")}</label>
        <input id="password" className="input" type="password" required minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder={t("auth.passwordPh")} />
        {fe("password") && <p className="mt-1 text-sm text-coral-600">{fe("password")}</p>}
      </div>

      {role === "STUDENT" && (
        <div>
          <span className="label">{t("auth.yourClass")}</span>
          <div className="grid grid-cols-4 gap-2">
            {GRADES.map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => set("grade", g)}
                className={clsx(
                  "rounded-2xl border-2 py-2.5 font-display text-lg font-extrabold transition-all",
                  form.grade === g ? "border-brand-500 bg-brand-500 text-white shadow-[0_3px_0_0_var(--color-brand-700)]" : "border-line bg-white hover:border-brand-200",
                )}
              >
                {n(g)}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs font-semibold text-ink-muted">{t("auth.hscNote")}</p>
        </div>
      )}

      <div>
        <span className="label">{t("auth.talkIn")}</span>
        <div className="grid grid-cols-2 gap-2">
          {LANGS.map((l) => (
            <button
              type="button"
              key={l.id}
              onClick={() => void setLang(l.id)}
              className={clsx("rounded-2xl border-2 px-2 py-2.5 text-center transition-all", lang === l.id ? "border-brand-500 bg-brand-50" : "border-line bg-white hover:border-brand-200")}
            >
              <span className="block font-display font-extrabold">{t(l.label)}</span>
              <span className="text-xs text-ink-muted">{t(l.sub)}</span>
            </button>
          ))}
        </div>
      </div>

      <ErrorNote message={error} />
      <button className="btn-primary w-full text-lg" disabled={busy}>
        {busy ? <Spinner /> : role === "STUDENT" ? t("auth.startAdventure") : t("auth.create")}
      </button>
      <p className="text-center text-xs text-ink-muted">{t("auth.under13")}</p>
    </form>
  );
}

export default function SignupPage() {
  const { t } = useT();
  return (
    <AuthLayout title={t("auth.signupTitle")} subtitle={t("auth.signupSubtitle")}>
      <Suspense>
        <SignupForm />
      </Suspense>
    </AuthLayout>
  );
}
