"use client";

import { AlertTriangle, ArrowRight, Link2, Play } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { ProggaBot } from "@/components/brand/ProggaBot";
import { useCelebrate } from "@/components/celebrate/CelebrationProvider";
import { Avatar } from "@/components/profile/Avatar";
import { ProfileCompletionCard } from "@/components/profile/ProfileCompletionCard";
import { ErrorNote, PageLoader, ProgressBar, Spinner } from "@/components/ui/primitives";
import { useFormat, useT } from "@/i18n";
import { api, errorMessage } from "@/lib/api";
import { firstName } from "@/lib/format";
import type { LevelInfo } from "@/lib/types";
import { useMe, useSwitchProfile } from "@/lib/useMe";

interface StudentSummary {
  id: string;
  name: string;
  grade: number;
  avatarSkin: string;
  photoUrl: string | null;
  level: LevelInfo;
  streak: number;
  lastActive: string | null;
  weekXp: number;
  weekSolved: number;
  alerts: number;
}

export default function GuardianHome() {
  const { user } = useMe();
  const { data, mutate } = useSWR<{ students: StudentSummary[] }>("/guardian/students");
  const { toast } = useCelebrate();
  const { t, n } = useT();
  const { gradeLabel, date } = useFormat();
  const [code, setCode] = useState("");
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const switchProfile = useSwitchProfile();

  async function link(e: React.FormEvent) {
    e.preventDefault();
    setLinking(true);
    setError(null);
    try {
      const r = await api<{ student: { name: string } }>("/guardian/link", { body: { code } });
      toast(t("guardian.linked", { name: r.student.name }), "🔗", "mint");
      setCode("");
      void mutate();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLinking(false);
    }
  }

  if (!data) return <PageLoader />;
  const teacher = user?.role === "TEACHER";

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">{teacher ? t("guardian.myStudents") : t("guardian.myChildren")}</p>
        <h1 className="mt-1 text-4xl font-extrabold">{t("guardian.hello", { name: firstName(user?.name) })}</h1>
        <p className="mt-1 max-w-2xl text-ink-soft">{t("guardian.intro")}</p>
      </div>

      {user && <ProfileCompletionCard user={user} href="/guardian/profile" />}

      {data.students.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {data.students.map((s) => (
            <div key={s.id} className="card flex flex-col transition-all hover:-translate-y-1 hover:shadow-lift">
            <Link href={`/guardian/${s.id}`} className="group block flex-1 p-5 pb-4">
              <div className="flex items-center gap-4">
                <Avatar name={s.name} photoUrl={s.photoUrl} role="STUDENT" skin={s.avatarSkin} size={64} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xl font-extrabold">{s.name}</p>
                  <p className="text-sm text-ink-muted">{gradeLabel(s.grade)} · {t("common.levelN", { n: s.level.level })}</p>
                </div>
                <ArrowRight className="text-ink-muted transition-transform group-hover:translate-x-1" size={20} />
              </div>
              {s.alerts > 0 && (
                <p className="mt-4 flex items-center gap-2 rounded-xl bg-coral-50 px-3 py-2 text-sm font-bold text-coral-600">
                  <AlertTriangle size={16} /> {s.alerts === 1 ? t("guardian.alert") : t("guardian.alerts", { n: s.alerts })}
                </p>
              )}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Mini value={n(s.weekXp)} label={t("guardian.weekXp")} />
                <Mini value={n(s.weekSolved)} label={t("guardian.solved")} />
                <Mini value={`${n(s.streak)}🔥`} label={t("guardian.streak")} />
              </div>
              <ProgressBar value={s.level.progress} className="mt-4" height="h-2" />
              <p className="mt-2 text-xs font-semibold text-ink-muted">
                {t("guardian.lastActive", { d: s.lastActive ? date(`${s.lastActive}T12:00:00`) : t("guardian.notYet") })}
              </p>
            </Link>
            {!teacher && (
              <button
                onClick={() => {
                  setOpening(s.id);
                  switchProfile.to(s.id).catch((err) => {
                    setError(errorMessage(err));
                    setOpening(null);
                  });
                }}
                disabled={!!opening}
                className="mx-5 mb-5 flex items-center justify-center gap-2 rounded-2xl bg-brand-50 py-2.5 font-display font-bold text-brand-600 transition-colors hover:bg-brand-100"
              >
                {opening === s.id ? <Spinner size={18} /> : <><Play size={16} fill="currentColor" /> {t("onboard.learnAs", { name: firstName(s.name) })}</>}
              </button>
            )}
            </div>
          ))}
        </div>
      )}

      <div className="card grid items-center gap-6 p-6 md:grid-cols-[1fr_1.2fr]">
        <div className="flex items-center gap-4">
          <ProggaBot size={90} mood="happy" />
          <div>
            <h2 className="text-2xl font-extrabold">{teacher ? t("guardian.linkStudent") : t("guardian.linkChild")}</h2>
            <p className="text-sm text-ink-soft">{t("guardian.linkBody")}</p>
          </div>
        </div>
        <form onSubmit={link} className="space-y-3">
          <div className="flex gap-2">
            <input
              className="input font-display text-xl font-extrabold uppercase tracking-[0.3em]"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ABC123"
              aria-label={t("guardian.codeLabel")}
            />
            <button className="btn-primary shrink-0" disabled={code.length !== 6 || linking}>
              {linking ? <Spinner /> : <><Link2 size={18} /> {t("guardian.link")}</>}
            </button>
          </div>
          <ErrorNote message={error} />
        </form>
      </div>
    </div>
  );
}

function Mini({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-cream px-2 py-2.5">
      <p className="font-display text-xl font-extrabold">{value}</p>
      <p className="text-[11px] font-bold text-ink-muted">{label}</p>
    </div>
  );
}
