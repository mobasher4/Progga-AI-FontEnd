"use client";

import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Check,
  Crown,
  Flame,
  HeartHandshake,
  Lightbulb,
  MessageCircleQuestion,
  PlayCircle,
  ShieldCheck,
  Swords,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ProggaBot } from "@/components/brand/ProggaBot";
import { AppDownload } from "@/components/landing/AppDownload";
import { HeroScene } from "@/components/landing/HeroScene";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useT, type TKey } from "@/i18n";

export default function Landing() {
  return (
    <div className="overflow-x-hidden">
      <Nav />
      <Hero />
      <Compare />
      <HowItWorks />
      <Features />
      <Levels />
      <Safety />
      <ParentsCta />
      <AppDownload />
      <Footer />
    </div>
  );
}

function Nav() {
  const { t } = useT();
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-cream/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
        <Logo size={36} />
        <nav className="hidden items-center gap-7 font-display font-bold text-ink-soft lg:flex">
          <a href="#how" className="hover:text-brand-600">{t("landing.navHow")}</a>
          <a href="#features" className="hover:text-brand-600">{t("landing.navFeatures")}</a>
          <a href="#safety" className="hover:text-brand-600">{t("landing.navSafety")}</a>
          <a href="#parents" className="hover:text-brand-600">{t("landing.navParents")}</a>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link href="/login" className="btn-ghost btn-sm hidden sm:inline-flex">{t("landing.login")}</Link>
          <Link href="/signup" className="btn-primary btn-sm">{t("landing.start")}</Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const { t } = useT();
  return (
    <section className="relative">
      <div className="bg-dots absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="absolute -right-32 -top-32 -z-10 h-[520px] w-[520px] rounded-full bg-banana-200/50 blur-3xl" />
      <div className="absolute -left-40 top-40 -z-10 h-[420px] w-[420px] rounded-full bg-brand-200/40 blur-3xl" />

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
        <div className="min-w-0">
          <span className="chip border-brand-100 bg-white text-brand-600">
            <span className="h-2 w-2 rounded-full bg-mint-500" /> {t("landing.chip")}
          </span>
          <h1 className="mt-5 text-5xl font-extrabold leading-[1.08] sm:text-6xl lg:text-[4.2rem]">
            {t("landing.titleA")}{" "}
            <span className="relative inline-block text-brand-500">
              {t("landing.think")}
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden>
                <path d="M3 10 Q100 -2 197 9" stroke="#FFD43B" strokeWidth="8" strokeLinecap="round" fill="none" />
              </svg>
            </span>
            {t("landing.titleB")}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">{t("landing.body")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="btn-primary text-lg">
              {t("landing.cta")} <ArrowRight size={20} />
            </Link>
            <Link href="/signup?role=PARENT" className="btn-ghost text-lg">{t("landing.ctaParent")}</Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-ink-soft">
            {(["landing.trust1", "landing.trust2", "landing.trust3"] as const).map((k) => (
              <li key={k} className="flex items-center gap-1.5">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-mint-100 text-mint-600"><Check size={13} strokeWidth={3} /></span>
                {t(k)}
              </li>
            ))}
          </ul>
        </div>

        <HeroScene />
      </div>
    </section>
  );
}

function Compare() {
  const { t } = useT();
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">{t("landing.compareEyebrow")}</p>
        <h2 className="mt-2 text-4xl font-extrabold sm:text-5xl">{t("landing.compareTitle")}</h2>
        <p className="mt-4 text-lg text-ink-soft">{t("landing.compareBody")}</p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="card p-7 opacity-90">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-coral-100 text-coral-600"><X strokeWidth={3} size={20} /></span>
            <h3 className="text-2xl font-extrabold">{t("landing.otherTitle")}</h3>
          </div>
          <div className="mt-5 rounded-2xl bg-cream p-4 font-mono text-sm text-ink-soft">
            3x + 5 = 20<br />3x = 15<br />x = 5 ✅ <span className="text-ink-muted">{t("landing.otherCopied")}</span>
          </div>
          <ul className="mt-5 space-y-2.5 text-ink-soft">
            {(["landing.other1", "landing.other2", "landing.other3"] as const).map((k) => (
              <li key={k} className="flex gap-2"><X size={18} className="mt-0.5 shrink-0 text-coral-500" />{t(k)}</li>
            ))}
          </ul>
        </div>
        <div className="card relative overflow-hidden border-2 border-brand-200 p-7">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-banana-200/60 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-mint-100 text-mint-600"><Check strokeWidth={3} size={20} /></span>
            <h3 className="text-2xl font-extrabold">{t("landing.proggaTitle")}</h3>
          </div>
          <ol className="relative mt-5 space-y-2 text-sm">
            {(["landing.step1", "landing.step2", "landing.step3"] as const).map((k, i) => (
              <li key={k} className="flex items-center gap-3 rounded-2xl bg-brand-50 px-3.5 py-2.5 font-semibold">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-extrabold text-white">{i + 1}</span>
                {t(k)}
              </li>
            ))}
          </ol>
          <ul className="relative mt-5 space-y-2.5 text-ink-soft">
            {(["landing.progga1", "landing.progga2", "landing.progga3"] as const).map((k) => (
              <li key={k} className="flex gap-2"><Check size={18} className="mt-0.5 shrink-0 text-mint-500" />{t(k)}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const { t } = useT();
  const steps: { icon: typeof Lightbulb; title: TKey; text: TKey; color: string }[] = [
    { icon: MessageCircleQuestion, title: "landing.how1t", text: "landing.how1d", color: "bg-brand-500" },
    { icon: Lightbulb, title: "landing.how2t", text: "landing.how2d", color: "bg-banana-500" },
    { icon: HeartHandshake, title: "landing.how3t", text: "landing.how3d", color: "bg-mint-500" },
    { icon: Crown, title: "landing.how4t", text: "landing.how4d", color: "bg-coral-500" },
  ];
  return (
    <section id="how" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="eyebrow">{t("landing.howEyebrow")}</p>
          <h2 className="mt-2 text-4xl font-extrabold sm:text-5xl">{t("landing.howTitle")}</h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-3xl border border-line bg-cream p-6">
              <span className="absolute right-5 top-4 font-display text-5xl font-extrabold text-ink/5">{i + 1}</span>
              <span className={`grid h-12 w-12 place-items-center rounded-2xl text-white ${s.color}`}><s.icon size={24} /></span>
              <h3 className="mt-5 text-xl font-extrabold">{t(s.title)}</h3>
              <p className="mt-2 text-ink-soft">{t(s.text)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const { t } = useT();
  const features: { icon: typeof Camera; title: TKey; text: TKey; tint: string }[] = [
    { icon: MessageCircleQuestion, title: "landing.f1t", text: "landing.f1d", tint: "bg-brand-50 text-brand-600" },
    { icon: Camera, title: "landing.f2t", text: "landing.f2d", tint: "bg-sky-50 text-sky-600" },
    { icon: PlayCircle, title: "landing.f3t", text: "landing.f3d", tint: "bg-coral-50 text-coral-600" },
    { icon: Swords, title: "landing.f4t", text: "landing.f4d", tint: "bg-banana-50 text-banana-700" },
    { icon: Flame, title: "landing.f5t", text: "landing.f5d", tint: "bg-coral-50 text-coral-600" },
    { icon: Crown, title: "landing.f6t", text: "landing.f6d", tint: "bg-mint-50 text-mint-600" },
    { icon: Users, title: "landing.f7t", text: "landing.f7d", tint: "bg-brand-50 text-brand-600" },
    { icon: ShieldCheck, title: "landing.f8t", text: "landing.f8d", tint: "bg-mint-50 text-mint-600" },
  ];
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">{t("landing.featEyebrow")}</p>
        <h2 className="mt-2 text-4xl font-extrabold sm:text-5xl">{t("landing.featTitle")}</h2>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="card p-6 transition-transform hover:-translate-y-1">
            <span className={`grid h-12 w-12 place-items-center rounded-2xl ${f.tint}`}><f.icon size={24} /></span>
            <h3 className="mt-4 text-lg font-extrabold">{t(f.title)}</h3>
            <p className="mt-1.5 text-[15px] text-ink-soft">{t(f.text)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Levels() {
  const { t } = useT();
  const bands = [
    { range: "landing.band1Range", name: "landing.band1Name", text: "landing.band1Text", color: "from-banana-300 to-banana-500", mood: "happy" as const },
    { range: "landing.band2Range", name: "landing.band2Name", text: "landing.band2Text", color: "from-mint-400 to-mint-600", mood: "talking" as const },
    { range: "landing.band3Range", name: "landing.band3Name", text: "landing.band3Text", color: "from-brand-400 to-brand-700", mood: "thinking" as const },
  ] satisfies { range: TKey; name: TKey; text: TKey; color: string; mood: string }[];
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="eyebrow">{t("landing.levelsEyebrow")}</p>
          <h2 className="mt-2 text-4xl font-extrabold sm:text-5xl">{t("landing.levelsTitle")}</h2>
          <p className="mt-4 text-lg text-ink-soft">{t("landing.levelsBody")}</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {bands.map((b) => (
            <div key={b.name} className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${b.color} p-6 text-white`}>
              <p className="text-sm font-extrabold uppercase tracking-wider opacity-80">{t(b.range)}</p>
              <h3 className="mt-1 text-2xl font-extrabold">{t(b.name)}</h3>
              <p className="mt-2 max-w-[13rem] text-white/90">{t(b.text)}</p>
              <div className="pointer-events-none absolute -bottom-4 -right-3 opacity-95">
                <ProggaBot size={90} mood={b.mood} float={false} />
              </div>
              <div className="h-16" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Safety() {
  const { t } = useT();
  const items: [TKey, TKey][] = [
    ["landing.s1t", "landing.s1d"],
    ["landing.s2t", "landing.s2d"],
    ["landing.s3t", "landing.s3d"],
    ["landing.s4t", "landing.s4d"],
    ["landing.s5t", "landing.s5d"],
    ["landing.s6t", "landing.s6d"],
  ];
  return (
    <section id="safety" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="eyebrow">{t("landing.safetyEyebrow")}</p>
          <h2 className="mt-2 text-4xl font-extrabold sm:text-5xl">{t("landing.safetyTitle")}</h2>
          <p className="mt-4 text-lg text-ink-soft">{t("landing.safetyBody")}</p>
          <div className="mt-6 inline-flex items-center gap-3 rounded-3xl bg-mint-50 px-5 py-4">
            <ShieldCheck className="text-mint-600" size={28} />
            <span className="font-display text-lg font-bold text-mint-700">{t("landing.safetyBadge")}</span>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map(([title, desc]) => (
            <div key={title} className="card p-5">
              <p className="flex items-center gap-2 font-display text-lg font-extrabold"><Check size={18} className="shrink-0 text-mint-500" strokeWidth={3} />{t(title)}</p>
              <p className="mt-1.5 text-[15px] text-ink-soft">{t(desc)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ParentsCta() {
  const { t } = useT();
  return (
    <section id="parents" className="px-4 pb-20 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 px-8 py-14 text-white sm:px-14">
        <div className="bg-dots absolute inset-0 opacity-30" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-banana-300">{t("landing.parentsEyebrow")}</p>
            <h2 className="mt-2 text-4xl font-extrabold sm:text-5xl">{t("landing.parentsTitle")}</h2>
            <p className="mt-4 max-w-xl text-lg text-brand-100">{t("landing.parentsBody")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup?role=PARENT" className="btn-banana text-lg">{t("landing.parentsCta")}</Link>
              <Link href="/signup?role=TEACHER" className="btn bg-white/15 text-white hover:bg-white/25">{t("landing.parentsTeacher")}</Link>
            </div>
          </div>
          <div className="flex justify-center">
            <ProggaBot size={210} mood="happy" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useT();
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <Logo size={30} />
        <p className="text-sm text-ink-muted">© {new Date().getFullYear()} Progga AI · {t("landing.footer")}</p>
      </div>
    </footer>
  );
}
