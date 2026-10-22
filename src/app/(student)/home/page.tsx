"use client";

import { ArrowRight, Camera, Sparkles } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { ProggaBot } from "@/components/brand/ProggaBot";
import { LessonTile, QuestRow, SessionRow } from "@/components/cards";
import { EmptyState, PageLoader, ProgressBar, SectionTitle, SubjectIcon } from "@/components/ui/primitives";
import { useFormat, useT } from "@/i18n";
import { firstName } from "@/lib/format";
import { paletteFor } from "@/lib/skins";
import type { Dashboard } from "@/lib/types";
import { useEngine } from "@/lib/useEngine";

export default function HomePage() {
  const { data, mutate } = useSWR<Dashboard>("/me/dashboard");
  const { vision } = useEngine();
  const { t, tx, n, ui } = useT();
  const { greeting, gradeLabel } = useFormat();
  if (!data) return <PageLoader label={t("common.loading")} />;
  const { user, quests } = data;
  const lvl = user.level!;
  const questsDone = quests.filter((q) => q.claimed).length;
  const lessons = [...data.continueLessons, ...data.recommendedLessons];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-grape-500 via-grape-600 to-grape-700 p-6 text-white sm:p-8">
        <div className="bg-dots absolute inset-0 opacity-25" />
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-banana-300/30 blur-3xl" />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="shrink-0">
            <ProggaBot size={130} mood="happy" palette={user.skin?.palette ?? paletteFor(user.avatarSkin)} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-grape-100">{t("home.hi", { greeting: greeting(), name: firstName(user.name) })}</p>
            <h1 className="mt-1 text-3xl font-extrabold leading-tight sm:text-4xl">{t("home.title")}</h1>
            <p className="mt-2 max-w-lg text-grape-100">{t("home.body")}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/tutor" className="btn-banana">
                <Sparkles size={19} /> {t("home.ask")}
              </Link>
              {vision && (
                <Link href="/tutor?photo=1" className="btn bg-white/15 text-white hover:bg-white/25">
                  <Camera size={19} /> {t("home.snap")}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card col-span-2 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="eyebrow">{t("common.levelN", { n: lvl.level })}</p>
            <span className="text-right text-sm font-bold text-ink-muted">{t("home.toNext", { n: lvl.nextLevelXp - lvl.xp, next: lvl.level + 1 })}</span>
          </div>
          <p className="mt-1 font-display text-2xl font-extrabold">{tx(`levelTitles.${lvl.title}`, lvl.title)}</p>
          <ProgressBar value={lvl.progress} className="mt-3" height="h-4" />
        </div>
        <StatCard icon="🔥" label={t("home.dayStreak")} value={n(user.streak ?? 0)} sub={t("home.best", { n: user.bestStreak ?? 0 })} tint="bg-coral-50" />
        <StatCard icon="🏅" label={t("home.badges")} value={n(data.badgeCount)} sub={t("home.coins", { n: user.coins ?? 0 })} tint="bg-banana-50" href="/rewards" />
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
        {/* Quests */}
        <section className="card p-5 sm:p-6">
          <SectionTitle
            eyebrow={t("home.questsEyebrow")}
            title={t("home.quests")}
            action={<span className="chip shrink-0 border-banana-200 bg-banana-50 text-banana-700">{t("home.questsDone", { a: questsDone, b: quests.length })}</span>}
          />
          <div className="space-y-3">
            {quests.map((q) => <QuestRow key={q.id} quest={q} onClaimed={() => mutate()} />)}
          </div>
        </section>

        {/* Recent tutor sessions */}
        <section className="card p-5 sm:p-6">
          <SectionTitle
            eyebrow={t("home.trailEyebrow")}
            title={t("home.recent")}
            action={<Link href="/tutor" className="shrink-0 text-sm font-bold text-grape-600 hover:underline">{t("common.seeAll")}</Link>}
          />
          {data.recentSessions.length ? (
            <div className="-mx-3 space-y-1">{data.recentSessions.map((s) => <SessionRow key={s.id} s={s} />)}</div>
          ) : (
            <div className="rounded-2xl bg-cream p-6 text-center">
              <p className="text-4xl">🧩</p>
              <p className="mt-2 font-display font-bold">{t("home.noAdventures")}</p>
              <p className="text-sm text-ink-soft">{t("home.noAdventuresText")}</p>
            </div>
          )}
        </section>
      </div>

      {/* Subjects */}
      <section>
        <SectionTitle eyebrow={gradeLabel(user.grade)} title={t("home.pickSubject")} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {data.subjects.map((s) => (
            <Link key={s.id} href={`/tutor?subject=${s.id}`} className="card flex items-center gap-3 p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-lift">
              <SubjectIcon icon={s.icon} color={s.color} />
              <div className="min-w-0">
                <p className="truncate font-display font-bold leading-tight">{ui === "bn" ? s.nameBn : s.name}</p>
                <p className="truncate text-xs text-ink-muted">{ui === "bn" ? s.name : s.nameBn}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Lessons */}
      <section>
        <SectionTitle
          eyebrow={data.continueLessons.length ? t("home.continueEyebrow") : t("home.pickedEyebrow")}
          title={data.continueLessons.length ? t("home.continue") : t("home.videoLessons")}
          action={
            <Link href="/lessons" className="flex shrink-0 items-center gap-1 text-sm font-bold text-grape-600 hover:underline">
              {t("home.allLessons")} <ArrowRight size={15} />
            </Link>
          }
        />
        {lessons.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {lessons.slice(0, 4).map((l) => <LessonTile key={l.id} lesson={l} />)}
          </div>
        ) : (
          <EmptyState icon="🎬" title={t("home.caughtUp")} text={t("home.caughtUpText")} />
        )}
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, sub, tint, href }: { icon: string; label: string; value: string; sub: string; tint: string; href?: string }) {
  const body = (
    <div className="card h-full p-5">
      <div className="flex items-center gap-3">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl ${tint}`}>{icon}</span>
        <div className="min-w-0">
          <p className="font-display text-3xl font-extrabold leading-none">{value}</p>
          <p className="truncate text-sm font-bold text-ink-muted">{label}</p>
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold text-ink-soft">{sub}</p>
    </div>
  );
  return href ? <Link href={href} className="block transition-transform hover:-translate-y-0.5">{body}</Link> : body;
}
