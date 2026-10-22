"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useSWRConfig } from "swr";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ErrorNote, Spinner } from "@/components/ui/primitives";
import { explicitLanguage, useT, type TKey } from "@/i18n";
import { api, errorMessage } from "@/lib/api";
import { homeFor } from "@/lib/routes";
import type { User } from "@/lib/types";

// Seeded local-dev accounts (see backend/prisma/seed.ts)
const DEMO: { label: TKey; email: string }[] = [
  { label: "auth.demoStudent", email: "rafi@demo.progga.ai" },
  { label: "auth.demoParent", email: "parent@demo.progga.ai" },
  { label: "auth.demoTeacher", email: "teacher@demo.progga.ai" },
  { label: "auth.demoAdmin", email: "admin@demo.progga.ai" },
];
const DEMO_PASSWORD = "Progga@123";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { mutate } = useSWRConfig();
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function login(e?: React.FormEvent, creds = { email, password }) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      let { user } = await api<{ user: User }>("/auth/login", { body: creds });
      // A language picked on this device before signing in wins over the account's old one.
      const chosen = explicitLanguage();
      if (chosen && chosen !== user.language) {
        user = (await api<{ user: User }>("/me", { method: "PATCH", body: { language: chosen } })).user;
      }
      await mutate("/auth/me", { user }, { revalidate: false });
      const next = params.get("next");
      router.replace(next ?? homeFor(user.role));
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={login} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">{t("auth.email")}</label>
          <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">{t("auth.password")}</label>
          <input id="password" className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <ErrorNote message={error} />
        <button className="btn-primary w-full text-lg" disabled={busy}>
          {busy ? <Spinner /> : t("auth.loginButton")}
        </button>
      </form>

      <p className="mt-6 text-center text-ink-soft">
        {t("auth.newHere")} <Link href="/signup" className="font-bold text-grape-600 hover:underline">{t("auth.createAccount")}</Link>
      </p>

      {process.env.NODE_ENV !== "production" && (
        <div className="mt-8 rounded-3xl border-2 border-dashed border-banana-300 bg-banana-50 p-4">
          <p className="text-sm font-extrabold text-banana-700">{t("auth.demoTitle")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DEMO.map((d) => (
              <button key={d.email} type="button" disabled={busy} className="btn-ghost btn-sm" onClick={() => login(undefined, { email: d.email, password: DEMO_PASSWORD })}>
                {t(d.label)}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function LoginPage() {
  const { t } = useT();
  return (
    <AuthLayout title={t("auth.loginTitle")} subtitle={t("auth.loginSubtitle")}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
