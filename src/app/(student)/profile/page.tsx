"use client";

import clsx from "clsx";
import { Copy, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { ProggaBot } from "@/components/brand/ProggaBot";
import { useCelebrate } from "@/components/celebrate/CelebrationProvider";
import { ErrorNote, PageLoader, Spinner } from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api";
import { GRADES, gradeLabel } from "@/lib/format";
import { paletteFor } from "@/lib/skins";
import type { Language, User } from "@/lib/types";
import { useLogout, useMe } from "@/lib/useMe";

export default function ProfilePage() {
  const { user, mutate } = useMe();
  const logout = useLogout();
  const { toast } = useCelebrate();
  const [form, setForm] = useState({ name: "", grade: 6, language: "en" as Language });
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    if (user) setForm({ name: user.name, grade: user.grade ?? 6, language: user.language });
  }, [user]);

  if (!user) return <PageLoader />;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api<{ user: User }>("/me", { method: "PATCH", body: form });
      await mutate(r, { revalidate: false });
      toast("Profile saved", "✅", "mint");
    } catch (err) {
      toast(errorMessage(err), "⚠️", "coral");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    try {
      await api("/auth/change-password", { body: pw });
      setPw({ currentPassword: "", newPassword: "" });
      toast("Password updated", "🔒", "mint");
    } catch (err) {
      setPwError(errorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card flex flex-col items-center gap-5 p-6 sm:flex-row">
        <ProggaBot size={110} mood="happy" palette={user.skin?.palette ?? paletteFor(user.avatarSkin)} />
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold">{user.name}</h1>
          <p className="text-ink-soft">{gradeLabel(user.grade)} · Level {user.level?.level} {user.level?.title}</p>
          <p className="text-sm text-ink-muted">{user.email}</p>
        </div>
        <button onClick={logout} className="btn-ghost btn-sm"><LogOut size={16} /> Log out</button>
      </div>

      <div className="card bg-gradient-to-br from-grape-50 to-white p-6">
        <p className="eyebrow">Family & school link</p>
        <h2 className="mt-1 text-xl font-extrabold">Share your progress with a parent or teacher</h2>
        <p className="mt-1 text-sm text-ink-soft">Give them this code. They&apos;ll see your learning progress, never your password.</p>
        <div className="mt-4 flex items-center gap-3">
          <span className="rounded-2xl border-2 border-dashed border-grape-300 bg-white px-5 py-3 font-display text-3xl font-extrabold tracking-[0.3em] text-grape-600">{user.linkCode}</span>
          <button
            className="btn-ghost btn-sm"
            onClick={() => {
              void navigator.clipboard?.writeText(user.linkCode ?? "");
              toast("Code copied", "📋", "grape");
            }}
          >
            <Copy size={15} /> Copy
          </button>
        </div>
      </div>

      <form onSubmit={save} className="card space-y-5 p-6">
        <h2 className="text-xl font-extrabold">Learning settings</h2>
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input id="name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <span className="label">Class</span>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {GRADES.map((g) => (
              <button type="button" key={g} onClick={() => setForm({ ...form, grade: g })} className={clsx("rounded-xl border-2 py-2 font-display font-extrabold", form.grade === g ? "border-grape-500 bg-grape-500 text-white" : "border-line bg-white")}>
                {g}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="label">Progga talks to me in</span>
          <div className="flex flex-wrap gap-2">
            {([["en", "English"], ["bn", "বাংলা"], ["mix", "Banglish"]] as const).map(([id, label]) => (
              <button type="button" key={id} onClick={() => setForm({ ...form, language: id })} className={clsx("chip", form.language === id ? "border-grape-500 bg-grape-500 text-white" : "border-line bg-white")}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-cream px-4 py-3 text-sm">
          <span className="font-semibold text-ink-soft">Daily new-question limit (set by your parent/teacher)</span>
          <span className="font-display text-lg font-extrabold">{user.dailyTutorLimit}</span>
        </div>
        <button className="btn-primary" disabled={saving}>{saving ? <Spinner /> : "Save changes"}</button>
      </form>

      <form onSubmit={changePassword} className="card space-y-4 p-6">
        <h2 className="text-xl font-extrabold">Change password</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <input className="input" type="password" placeholder="Current password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required />
          <input className="input" type="password" placeholder="New password (8+ characters)" autoComplete="new-password" minLength={8} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required />
        </div>
        <ErrorNote message={pwError} />
        <button className="btn-ghost">Update password</button>
      </form>
    </div>
  );
}
