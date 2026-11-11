"use client";

import { Lock } from "lucide-react";
import { useState } from "react";
import { useCelebrate } from "@/components/celebrate/CelebrationProvider";
import { ErrorNote, Spinner } from "@/components/ui/primitives";
import { useT } from "@/i18n";
import { api, errorMessage } from "@/lib/api";

export function PasswordCard() {
  const { t } = useT();
  const { toast } = useCelebrate();
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api("/auth/change-password", { body: pw });
      setPw({ currentPassword: "", newPassword: "" });
      toast(t("profile.passwordUpdated"), "🔒", "mint");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cream text-ink-soft">
          <Lock size={20} strokeWidth={2.4} />
        </span>
        <h2 className="text-xl font-extrabold">{t("profile.changePassword")}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <input className="input" type="password" placeholder={t("profile.currentPassword")} autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required />
        <input className="input" type="password" placeholder={t("profile.newPassword")} autoComplete="new-password" minLength={8} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required />
      </div>
      <ErrorNote message={error} />
      <button className="btn-ghost" disabled={busy}>{busy ? <Spinner size={18} /> : t("profile.updatePassword")}</button>
    </form>
  );
}
