"use client";

import { AlertTriangle, ArrowRight, Link2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { ProggaBot } from "@/components/brand/ProggaBot";
import { useCelebrate } from "@/components/celebrate/CelebrationProvider";
import { ErrorNote, PageLoader, ProgressBar, Spinner } from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api";
import { firstName, gradeLabel } from "@/lib/format";
import { paletteFor } from "@/lib/skins";
import type { LevelInfo } from "@/lib/types";
import { useMe } from "@/lib/useMe";

interface StudentSummary {
  id: string;
  name: string;
  grade: number;
  avatarSkin: string;
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
  const [code, setCode] = useState("");
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function link(e: React.FormEvent) {
    e.preventDefault();
    setLinking(true);
    setError(null);
    try {
      const r = await api<{ student: { name: string } }>("/guardian/link", { body: { code } });
      toast(`${r.student.name} linked!`, "🔗", "mint");
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
        <p className="eyebrow">{teacher ? "My students" : "My children"}</p>
        <h1 className="mt-1 text-4xl font-extrabold">Hello, {firstName(user?.name)} 👋</h1>
        <p className="mt-1 max-w-2xl text-ink-soft">
          See how each student thinks: their independence, tricky topics and learning habits. Progga never gives answers away, so this is real progress.
        </p>
      </div>

      {data.students.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {data.students.map((s) => (
            <Link key={s.id} href={`/guardian/${s.id}`} className="card group p-5 transition-all hover:-translate-y-1 hover:shadow-lift">
              <div className="flex items-center gap-4">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-cream">
                  <ProggaBot size={52} palette={paletteFor(s.avatarSkin)} float={false} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xl font-extrabold">{s.name}</p>
                  <p className="text-sm text-ink-muted">{gradeLabel(s.grade)} · Level {s.level.level}</p>
                </div>
                <ArrowRight className="text-ink-muted transition-transform group-hover:translate-x-1" size={20} />
              </div>
              {s.alerts > 0 && (
                <p className="mt-4 flex items-center gap-2 rounded-xl bg-coral-50 px-3 py-2 text-sm font-bold text-coral-600">
                  <AlertTriangle size={16} /> {s.alerts} wellbeing/safety alert{s.alerts > 1 ? "s" : ""} this week
                </p>
              )}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Mini value={s.weekXp} label="XP this week" />
                <Mini value={s.weekSolved} label="Solved" />
                <Mini value={`${s.streak}🔥`} label="Streak" />
              </div>
              <ProgressBar value={s.level.progress} className="mt-4" height="h-2" />
              <p className="mt-2 text-xs font-semibold text-ink-muted">Last active: {s.lastActive ?? "not yet"}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="card grid items-center gap-6 p-6 md:grid-cols-[1fr_1.2fr]">
        <div className="flex items-center gap-4">
          <ProggaBot size={90} mood="happy" />
          <div>
            <h2 className="text-2xl font-extrabold">Link a {teacher ? "student" : "child"}</h2>
            <p className="text-sm text-ink-soft">Ask them for the 6-letter code on their Profile page.</p>
          </div>
        </div>
        <form onSubmit={link} className="space-y-3">
          <div className="flex gap-2">
            <input
              className="input font-display text-xl font-extrabold uppercase tracking-[0.3em]"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ABC123"
              aria-label="Link code"
            />
            <button className="btn-primary shrink-0" disabled={code.length !== 6 || linking}>
              {linking ? <Spinner /> : <><Link2 size={18} /> Link</>}
            </button>
          </div>
          <ErrorNote message={error} />
        </form>
      </div>
    </div>
  );
}

function Mini({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-2xl bg-cream px-2 py-2.5">
      <p className="font-display text-xl font-extrabold">{value}</p>
      <p className="text-[11px] font-bold text-ink-muted">{label}</p>
    </div>
  );
}
