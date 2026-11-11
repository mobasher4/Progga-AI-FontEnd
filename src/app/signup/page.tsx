"use client";

import confetti from "canvas-confetti";
import clsx from "clsx";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen, Check, Eye, EyeOff, Languages, Lightbulb, Plus, ShieldCheck, SlidersHorizontal, Trash2, TrendingUp, Trophy, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { ProggaBot, type BotMood } from "@/components/brand/ProggaBot";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ErrorNote, Spinner } from "@/components/ui/primitives";
import { useFormat, useT, type TKey } from "@/i18n";
import { api, ApiError, errorMessage } from "@/lib/api";
import { firstName, GRADES } from "@/lib/format";
import { paletteFor } from "@/lib/skins";
import type { User } from "@/lib/types";
import { useSwitchProfile } from "@/lib/useMe";

// Brilliant-style onboarding: one question per screen on a clean white canvas,
// a progress bar on top and one big Continue button at the bottom. The account
// is created after the last question, then Progga welcomes them in.

type SignupRole = "STUDENT" | "PARENT" | "TEACHER";
type StepId = "hello" | "role" | "class" | "kids" | "details" | "motivation" | "features" | "done";
type Motivation = "excel" | "sharp" | "fun" | "help_child";
interface Kid {
  key: number;
  name: string;
  grade: number | null;
}

const FLOWS: Record<SignupRole, StepId[]> = {
  STUDENT: ["hello", "role", "class", "details", "motivation", "features", "done"],
  PARENT: ["hello", "role", "kids", "details", "motivation", "features", "done"],
  TEACHER: ["hello", "role", "details", "features", "done"],
};

const MOTIVATIONS: Record<"STUDENT" | "PARENT", { id: Motivation; icon: string; title: TKey; text: TKey }[]> = {
  STUDENT: [
    { id: "excel", icon: "🏆", title: "onboard.mExcel", text: "onboard.mExcelText" },
    { id: "sharp", icon: "🧠", title: "onboard.mSharp", text: "onboard.mSharpText" },
    { id: "fun", icon: "🔭", title: "onboard.mFun", text: "onboard.mFunText" },
  ],
  PARENT: [
    { id: "help_child", icon: "🤝", title: "onboard.mHelp", text: "onboard.mHelpText" },
    { id: "excel", icon: "🏆", title: "onboard.mExcelParent", text: "onboard.mExcelParentText" },
    { id: "sharp", icon: "🧠", title: "onboard.mSharpParent", text: "onboard.mSharpParentText" },
  ],
};

const FEATURES: Record<"learner" | "guardian", { icon: typeof Lightbulb; tone: string; title: TKey; text: TKey }[]> = {
  learner: [
    { icon: Lightbulb, tone: "bg-banana-100 text-banana-700", title: "onboard.fl1t", text: "onboard.fl1d" },
    { icon: BookOpen, tone: "bg-brand-100 text-brand-600", title: "onboard.fl2t", text: "onboard.fl2d" },
    { icon: Trophy, tone: "bg-mint-100 text-mint-700", title: "onboard.fl3t", text: "onboard.fl3d" },
    { icon: Languages, tone: "bg-sky-100 text-sky-600", title: "onboard.fl4t", text: "onboard.fl4d" },
  ],
  guardian: [
    { icon: TrendingUp, tone: "bg-brand-100 text-brand-600", title: "onboard.fp1t", text: "onboard.fp1d" },
    { icon: ShieldCheck, tone: "bg-mint-100 text-mint-700", title: "onboard.fp2t", text: "onboard.fp2d" },
    { icon: Lightbulb, tone: "bg-banana-100 text-banana-700", title: "onboard.fp3t", text: "onboard.fp3d" },
    { icon: SlidersHorizontal, tone: "bg-coral-100 text-coral-600", title: "onboard.fp4t", text: "onboard.fp4d" },
  ],
};

const KID_ICONS = ["🦊", "🐼", "🐯", "🐨", "🦁", "🐸"];
const MAX_KIDS = 6;

const BD_MOBILE = /^(?:\+?88)?01[3-9]\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validContact = (v: string) => {
  const s = v.trim();
  return s.includes("@") ? EMAIL.test(s) : BD_MOBILE.test(s.replace(/[\s-]/g, ""));
};
const today = () => new Date().toISOString().slice(0, 10);

const EASE = [0.22, 1, 0.36, 1] as const;
const slide: Variants = {
  enter: (dir: number) => ({ x: dir * 56, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.38, ease: EASE } },
  exit: (dir: number) => ({ x: dir * -56, opacity: 0, transition: { duration: 0.18, ease: "easeIn" } }),
};

function SignupFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const { mutate } = useSWRConfig();
  const { t, lang } = useT();
  const preset = params.get("role");

  const [role, setRole] = useState<SignupRole | null>(preset === "PARENT" || preset === "TEACHER" || preset === "STUDENT" ? preset : null);
  const [[index, dir], setNav] = useState<[number, number]>([0, 1]);
  const [grade, setGrade] = useState<number | null>(null);
  const [kids, setKids] = useState<Kid[]>([{ key: 1, name: "", grade: null }]);
  const [form, setForm] = useState({ name: "", birthdate: "", contact: "", password: "" });
  const [motivation, setMotivation] = useState<Motivation | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const flow = FLOWS[role ?? "STUDENT"];
  const step = flow[index];
  const isStudent = role === "STUDENT";
  const progress = step === "done" ? 100 : ((index + 1) / flow.length) * 100;

  const setField = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((e) => ({ ...e, [k]: undefined }));
  };

  const go = (to: number) => {
    setNav([to, to > index ? 1 : -1]);
    setError(null);
  };
  const back = () => index > 0 && step !== "done" && go(index - 1);

  const canContinue = (() => {
    switch (step) {
      case "role":
        return !!role;
      case "class":
        return !!grade;
      case "kids":
        return kids.every((k) => k.name.trim().length >= 2 && k.grade);
      case "details":
        return form.name.trim().length >= 2 && form.contact.trim().length > 0 && form.password.length > 0 && (!isStudent || !!form.birthdate);
      case "motivation":
        return !!motivation;
      default:
        return true;
    }
  })();

  async function checkDetails() {
    const errs: Record<string, string | undefined> = {};
    if (!validContact(form.contact)) errs.contact = t("onboard.invalidContact");
    if (form.password.length < 8) errs.password = t("onboard.shortPassword");
    if (errs.contact || errs.password) return setFieldErrors(errs);
    setBusy(true);
    try {
      await api("/auth/check", { body: { contact: form.contact } });
      go(index + 1);
    } catch (err) {
      if (err instanceof ApiError && err.details?.contact) setFieldErrors({ contact: err.details.contact[0] });
      else setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function createAccount() {
    setBusy(true);
    setError(null);
    try {
      const { user } = await api<{ user: User }>("/auth/signup", {
        body: {
          name: form.name.trim(),
          contact: form.contact.trim(),
          password: form.password,
          role,
          language: lang,
          grade: isStudent ? grade : undefined,
          birthdate: isStudent && form.birthdate ? form.birthdate : undefined,
          motivation: motivation ?? undefined,
          children: role === "PARENT" ? kids.map((k) => ({ name: k.name.trim(), grade: k.grade })) : undefined,
        },
      });
      await mutate("/auth/me", { user }, { revalidate: false });
      setUser(user);
      go(index + 1);
    } catch (err) {
      const details = err instanceof ApiError ? err.details : undefined;
      const detailKeys = ["name", "contact", "password", "birthdate"].filter((k) => details?.[k]);
      if (details && detailKeys.length) {
        // send them back to the screen with the field that needs fixing
        setFieldErrors(Object.fromEntries(detailKeys.map((k) => [k, details[k]?.[0]])));
        setNav([flow.indexOf("details"), -1]);
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  }

  function finish() {
    router.replace(user?.role === "STUDENT" ? "/home?welcome=1" : "/guardian");
  }

  async function next() {
    if (!canContinue || busy) return;
    if (step === "details") return checkDetails();
    if (step === "features") return createAccount();
    if (step === "done") return finish();
    go(index + 1);
  }

  const cta =
    step === "hello"
      ? t("onboard.helloCta")
      : step === "features"
        ? t("onboard.createCta")
        : step === "done"
          ? user?.role === "STUDENT"
            ? t("onboard.doneCtaLearner")
            : t("onboard.doneCtaParent")
          : t("onboard.continue");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void next();
      }}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto overflow-x-hidden bg-white"
    >
      <header className="sticky top-0 z-10 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center gap-2 px-3 sm:h-20 sm:gap-4 sm:px-4">
          <button
            type="button"
            onClick={back}
            aria-label={t("common.back")}
            className={clsx("grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-cream hover:text-ink", (index === 0 || step === "done") && "invisible")}
          >
            <ArrowLeft size={22} strokeWidth={2.4} />
          </button>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-line/70" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
            <motion.div
              className={clsx("h-full rounded-full", step === "done" ? "bg-mint-500" : "bg-brand-500")}
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 140, damping: 22 }}
            />
          </div>
          {step === "hello" && <LanguageSwitcher compact />}
          {step !== "done" && (
            <Link href="/" aria-label={t("onboard.close")} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-cream hover:text-ink">
              <X size={22} strokeWidth={2.4} />
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div key={step} custom={dir} variants={slide} initial="enter" animate="center" exit="exit" className="mx-auto w-full max-w-md px-5 pb-8 pt-2 sm:pt-6">
            {step === "hello" && <HelloStep />}
            {step === "role" && <RoleStep role={role} onPick={setRole} />}
            {step === "class" && <ClassStep grade={grade} onPick={setGrade} />}
            {step === "kids" && <KidsStep kids={kids} setKids={setKids} />}
            {step === "details" && <DetailsStep role={role ?? "STUDENT"} form={form} setField={setField} errors={fieldErrors} />}
            {step === "motivation" && <MotivationStep role={role === "PARENT" ? "PARENT" : "STUDENT"} value={motivation} onPick={setMotivation} />}
            {step === "features" && <FeaturesStep role={role ?? "STUDENT"} />}
            {step === "done" && user && <DoneStep user={user} />}
            {error && (
              <div className="mt-5">
                <ErrorNote message={error} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="sticky bottom-0 bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        <div className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-white to-transparent" />
        <div className="mx-auto max-w-md">
          <motion.button type="submit" whileTap={canContinue ? { scale: 0.98 } : undefined} className="btn-primary w-full py-4 text-lg" disabled={!canContinue || busy}>
            {busy ? <Spinner /> : cta}
          </motion.button>
          {step === "hello" && (
            <Link href="/login" className="mt-3 block py-1 text-center font-bold text-brand-600 hover:underline">
              {t("onboard.haveAccount")}
            </Link>
          )}
        </div>
      </footer>
    </form>
  );
}

// ── Building blocks ──────────────────────────────────────

/** Fades content up into place, one item after another. */
function Rise({ i = 0, children, className }: { i?: number; children: React.ReactNode; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 + i * 0.05, duration: 0.4, ease: EASE }} className={className}>
      {children}
    </motion.div>
  );
}

function Heading({ title, sub, mood = "asking" }: { title: string; sub?: string; mood?: BotMood }) {
  return (
    <div className="mb-7 text-center">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 17 }} className="mx-auto mb-2 w-fit">
        <ProggaBot size={64} mood={mood} float={false} />
      </motion.div>
      <Rise>
        <h1 className="text-[1.7rem] font-extrabold leading-tight sm:text-3xl">{title}</h1>
      </Rise>
      {sub && (
        <Rise i={1}>
          <p className="mt-2 text-ink-soft">{sub}</p>
        </Rise>
      )}
    </div>
  );
}

function Tick({ on }: { on: boolean }) {
  return (
    <span className={clsx("grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors", on ? "border-brand-500 bg-brand-500 text-white" : "border-line")}>
      <AnimatePresence>
        {on && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}>
            <Check size={14} strokeWidth={3.5} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

const choice = (on: boolean) =>
  clsx(
    "border-2 transition-[border-color,background-color,box-shadow,color] duration-150",
    on ? "border-brand-500 bg-brand-50 shadow-[0_3px_0_0_var(--color-brand-500)]" : "border-line bg-white shadow-[0_3px_0_0_var(--color-line)] hover:border-brand-200",
  );

function Option({ i, icon, title, text, selected, onClick }: { i: number; icon: string; title: string; text?: string; selected: boolean; onClick: () => void }) {
  return (
    <Rise i={i}>
      <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={onClick} aria-pressed={selected} className={clsx("flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left", choice(selected))}>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-cream text-2xl">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-bold leading-tight">{title}</span>
          {text && <span className="mt-0.5 block text-sm text-ink-muted">{text}</span>}
        </span>
        <Tick on={selected} />
      </motion.button>
    </Rise>
  );
}

function FieldError({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 text-sm font-semibold text-coral-600">
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/** Starts in one mood, settles into another (e.g. cheer, then happy). */
function useSettle(first: BotMood, then: BotMood, ms: number) {
  const [mood, setMood] = useState(first);
  useEffect(() => {
    const id = setTimeout(() => setMood(then), ms);
    return () => clearTimeout(id);
  }, [then, ms]);
  return mood;
}

// ── Steps ────────────────────────────────────────────────

function HelloStep() {
  const { t } = useT();
  const mood = useSettle("cheer", "happy", 2200);
  return (
    <div className="flex flex-col items-center pt-6 text-center sm:pt-12">
      <motion.div initial={{ scale: 0.4, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 180, damping: 14 }} className="relative">
        <motion.div
          className="absolute inset-4 -z-10 rounded-full bg-brand-100 blur-2xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <ProggaBot size={170} mood={mood} />
      </motion.div>
      <Rise i={3}>
        <h1 className="mt-6 text-4xl font-extrabold sm:text-5xl">{t("onboard.helloTitle")}</h1>
      </Rise>
      <Rise i={4}>
        <p className="mx-auto mt-3 max-w-sm text-lg text-ink-soft">{t("onboard.helloBody")}</p>
      </Rise>
    </div>
  );
}

function RoleStep({ role, onPick }: { role: SignupRole | null; onPick: (r: SignupRole) => void }) {
  const { t } = useT();
  const [showTeacher, setShowTeacher] = useState(role === "TEACHER");
  return (
    <>
      <Heading title={t("onboard.roleTitle")} sub={t("onboard.roleSub")} />
      <div className="space-y-3">
        <Option i={2} icon="🎒" title={t("onboard.roleLearner")} text={t("onboard.roleLearnerText")} selected={role === "STUDENT"} onClick={() => onPick("STUDENT")} />
        <Option i={3} icon="🏡" title={t("onboard.roleParent")} text={t("onboard.roleParentText")} selected={role === "PARENT"} onClick={() => onPick("PARENT")} />
        {showTeacher && <Option i={0} icon="🍎" title={t("onboard.roleTeacher")} text={t("onboard.roleTeacherText")} selected={role === "TEACHER"} onClick={() => onPick("TEACHER")} />}
      </div>
      {!showTeacher && (
        <Rise i={5}>
          <button
            type="button"
            onClick={() => {
              setShowTeacher(true);
              onPick("TEACHER");
            }}
            className="mx-auto mt-6 block text-sm font-bold text-ink-muted transition-colors hover:text-brand-600"
          >
            {t("onboard.teacherLink")}
          </button>
        </Rise>
      )}
    </>
  );
}

function ClassStep({ grade, onPick }: { grade: number | null; onPick: (g: number) => void }) {
  const { t, n } = useT();
  const ssc = grade === 9 || grade === 10;
  const hsc = grade === 11 || grade === 12;
  return (
    <>
      <Heading title={t("onboard.classTitle")} sub={t("onboard.classSub")} />
      <div className="grid grid-cols-3 gap-3">
        {[3, 4, 5, 6, 7, 8].map((g, i) => (
          <Rise key={g} i={2 + i}>
            <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={() => onPick(g)} aria-pressed={grade === g} className={clsx("w-full rounded-2xl py-3.5 text-center", choice(grade === g))}>
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-ink-muted">{t("onboard.classWord")}</span>
              <span className={clsx("block font-display text-3xl font-extrabold leading-tight", grade === g && "text-brand-600")}>{n(g)}</span>
            </motion.button>
          </Rise>
        ))}
      </div>
      <div className="mt-3 space-y-3">
        <Option i={8} icon="🎓" title={t("onboard.ssc")} text={t("onboard.sscRange")} selected={ssc} onClick={() => !ssc && onPick(9)} />
        <YearPicker open={ssc} years={[9, 10]} grade={grade} onPick={onPick} />
        <Option i={9} icon="🏛️" title={t("onboard.hsc")} text={t("onboard.hscRange")} selected={hsc} onClick={() => !hsc && onPick(11)} />
        <YearPicker open={hsc} years={[11, 12]} grade={grade} onPick={onPick} />
      </div>
    </>
  );
}

function YearPicker({ open, years, grade, onPick }: { open: boolean; years: number[]; grade: number | null; onPick: (g: number) => void }) {
  const { t } = useT();
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: EASE }} className="overflow-hidden">
          <div className="grid grid-cols-2 gap-2 px-1 pb-1">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => onPick(y)}
                aria-pressed={grade === y}
                className={clsx(
                  "rounded-xl border-2 py-2.5 font-display font-bold transition-colors",
                  grade === y ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-white text-ink-soft hover:border-brand-200",
                )}
              >
                {t("common.classN", { n: y })}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function KidsStep({ kids, setKids }: { kids: Kid[]; setKids: React.Dispatch<React.SetStateAction<Kid[]>> }) {
  const { t, n } = useT();
  const update = (key: number, patch: Partial<Kid>) => setKids((ks) => ks.map((k) => (k.key === key ? { ...k, ...patch } : k)));
  const add = () => setKids((ks) => [...ks, { key: Math.max(...ks.map((k) => k.key)) + 1, name: "", grade: null }]);
  const remove = (key: number) => setKids((ks) => ks.filter((k) => k.key !== key));

  return (
    <>
      <Heading title={t("onboard.kidsTitle")} sub={t("onboard.kidsSub")} mood="happy" />
      <div className="space-y-4">
        <AnimatePresence initial={false} mode="popLayout">
          {kids.map((k, i) => (
            <motion.div
              key={k.key}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.18 } }}
              transition={{ duration: 0.3, ease: EASE }}
              className="rounded-2xl border-2 border-line p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2.5 font-display text-lg font-bold">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-banana-100 text-lg">{KID_ICONS[i % KID_ICONS.length]}</span>
                  {k.name.trim() || t("onboard.kidN", { n: i + 1 })}
                </span>
                {kids.length > 1 && (
                  <button type="button" onClick={() => remove(k.key)} aria-label={t("onboard.removeKid")} className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-coral-50 hover:text-coral-600">
                    <Trash2 size={17} />
                  </button>
                )}
              </div>
              <label className="label" htmlFor={`kid-${k.key}`}>{t("onboard.kidName")}</label>
              <input
                id={`kid-${k.key}`}
                className="input"
                value={k.name}
                maxLength={60}
                autoComplete="off"
                autoFocus={i > 0 && i === kids.length - 1 && !k.name}
                onChange={(e) => update(k.key, { name: e.target.value })}
                placeholder={t("onboard.kidNamePh")}
              />
              <span className="label mt-4">{t("onboard.kidClass")}</span>
              <div className="grid grid-cols-5 gap-1.5">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => update(k.key, { grade: g })}
                    aria-pressed={k.grade === g}
                    className={clsx(
                      "h-11 rounded-xl border-2 font-display text-lg font-bold transition-colors",
                      k.grade === g ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-white text-ink-soft hover:border-brand-200",
                    )}
                  >
                    {n(g)}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs font-semibold text-ink-muted">{t("onboard.kidClassNote")}</p>
            </motion.div>
          ))}
        </AnimatePresence>
        {kids.length < MAX_KIDS && (
          <motion.button
            layout
            type="button"
            onClick={add}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-200 py-3.5 font-display font-bold text-brand-600 transition-colors hover:border-brand-300 hover:bg-brand-50"
          >
            <Plus size={18} strokeWidth={2.6} /> {t("onboard.addKid")}
          </motion.button>
        )}
      </div>
    </>
  );
}

function DetailsStep({
  role,
  form,
  setField,
  errors,
}: {
  role: SignupRole;
  form: { name: string; birthdate: string; contact: string; password: string };
  setField: (k: "name" | "birthdate" | "contact" | "password", v: string) => void;
  errors: Record<string, string | undefined>;
}) {
  const { t } = useT();
  const [show, setShow] = useState(false);
  const student = role === "STUDENT";
  let i = 2;
  return (
    <>
      <Heading title={student ? t("onboard.detailsTitleLearner") : t("onboard.detailsTitleParent")} sub={t("onboard.detailsSub")} mood="talking" />
      <div className="space-y-4">
        <Rise i={i++}>
          <label className="label" htmlFor="name">{t("onboard.fullName")}</label>
          <input id="name" className="input" autoComplete="name" maxLength={60} autoFocus value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder={student ? t("auth.namePhStudent") : t("auth.namePhAdult")} />
          <FieldError message={errors.name} />
        </Rise>
        {student && (
          <Rise i={i++}>
            <label className="label" htmlFor="birthdate">{t("onboard.birthdate")}</label>
            <input id="birthdate" className="input" type="date" min="1990-01-01" max={today()} value={form.birthdate} onChange={(e) => setField("birthdate", e.target.value)} />
            <FieldError message={errors.birthdate} />
          </Rise>
        )}
        <Rise i={i++}>
          <label className="label" htmlFor="contact">{t("auth.contact")}</label>
          <input id="contact" className="input" inputMode="email" autoComplete="username" value={form.contact} onChange={(e) => setField("contact", e.target.value)} placeholder={t("auth.contactPh")} />
          {errors.contact ? <FieldError message={errors.contact} /> : student && <p className="mt-1.5 text-xs font-semibold text-ink-muted">{t("onboard.contactHelpLearner")}</p>}
        </Rise>
        <Rise i={i++}>
          <label className="label" htmlFor="password">{t("auth.password")}</label>
          <div className="relative">
            <input id="password" className="input pr-12" type={show ? "text" : "password"} autoComplete="new-password" maxLength={100} value={form.password} onChange={(e) => setField("password", e.target.value)} placeholder={t("auth.passwordPh")} />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-ink-muted hover:text-ink">
              {show ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
          <FieldError message={errors.password} />
        </Rise>
        {student && (
          <Rise i={i++}>
            <p className="text-center text-xs text-ink-muted">{t("auth.under13")}</p>
          </Rise>
        )}
      </div>
    </>
  );
}

function MotivationStep({ role, value, onPick }: { role: "STUDENT" | "PARENT"; value: Motivation | null; onPick: (m: Motivation) => void }) {
  const { t } = useT();
  return (
    <>
      <Heading title={role === "PARENT" ? t("onboard.motivationTitleParent") : t("onboard.motivationTitleLearner")} sub={t("onboard.motivationSub")} />
      <div className="space-y-3">
        {MOTIVATIONS[role].map((m, i) => (
          <Option key={m.id} i={2 + i} icon={m.icon} title={t(m.title)} text={t(m.text)} selected={value === m.id} onClick={() => onPick(m.id)} />
        ))}
      </div>
    </>
  );
}

function FeaturesStep({ role }: { role: SignupRole }) {
  const { t } = useT();
  const title = role === "STUDENT" ? t("onboard.featuresTitleLearner") : role === "PARENT" ? t("onboard.featuresTitleParent") : t("onboard.featuresTitleTeacher");
  return (
    <>
      <Heading title={title} mood="happy" />
      <div className="space-y-2">
        {FEATURES[role === "STUDENT" ? "learner" : "guardian"].map((f, i) => (
          <Rise key={f.title} i={2 + i * 1.5}>
            <div className="flex items-start gap-4 rounded-2xl p-3">
              <motion.span
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.18 + i * 0.08, type: "spring", stiffness: 320, damping: 16 }}
                className={clsx("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", f.tone)}
              >
                <f.icon size={22} strokeWidth={2.4} />
              </motion.span>
              <div className="min-w-0 pt-0.5">
                <p className="font-display text-lg font-bold leading-tight">{t(f.title)}</p>
                <p className="mt-0.5 text-sm text-ink-soft">{t(f.text)}</p>
              </div>
            </div>
          </Rise>
        ))}
      </div>
    </>
  );
}

function DoneStep({ user }: { user: User }) {
  const { t } = useT();
  const mood = useSettle("cheer", "happy", 2600);

  useEffect(() => {
    const colors = ["#2B7BE8", "#FFD43B", "#22C493", "#FF6B6B", "#3BA7FF"];
    const fire = (x: number, delay: number) =>
      setTimeout(() => confetti({ particleCount: 70, spread: 70, startVelocity: 45, origin: { x, y: 0.65 }, colors, disableForReducedMotion: true }), delay);
    const timers = [fire(0.25, 150), fire(0.75, 350), fire(0.5, 650)];
    return () => timers.forEach(clearTimeout);
  }, []);

  const body = user.role === "STUDENT" ? t("onboard.doneBodyLearner") : user.role === "PARENT" ? t("onboard.doneBodyParent") : t("onboard.doneBodyTeacher");
  return (
    <div className="flex flex-col items-center pt-6 text-center sm:pt-10">
      <motion.div initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 13 }}>
        <ProggaBot size={160} mood={mood} />
      </motion.div>
      <Rise i={3}>
        <h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">{t("onboard.doneTitle", { name: firstName(user.name) })}</h1>
      </Rise>
      <Rise i={4}>
        <p className="mx-auto mt-3 max-w-sm text-lg text-ink-soft">{body}</p>
      </Rise>
      {user.role === "PARENT" && <KidProfiles />}
    </div>
  );
}

interface KidSummary {
  id: string;
  name: string;
  grade: number;
  avatarSkin: string;
}

function KidProfiles() {
  const { t } = useT();
  const { gradeLabel } = useFormat();
  const { data } = useSWR<{ students: KidSummary[] }>("/guardian/students");
  const switchProfile = useSwitchProfile();
  const [opening, setOpening] = useState<string | null>(null);
  if (!data?.students.length) return null;

  return (
    <div className="mt-7 w-full space-y-3 text-left">
      {data.students.map((s, i) => (
        <Rise key={s.id} i={5 + i}>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            disabled={!!opening}
            onClick={() => {
              setOpening(s.id);
              switchProfile.to(s.id).catch(() => setOpening(null));
            }}
            className={clsx("group flex w-full items-center gap-4 rounded-2xl px-4 py-3", choice(false))}
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-cream">
              <ProggaBot size={40} float={false} palette={paletteFor(s.avatarSkin)} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-lg font-bold leading-tight">{t("onboard.learnAs", { name: firstName(s.name) })}</span>
              <span className="text-sm text-ink-muted">{gradeLabel(s.grade)}</span>
            </span>
            {opening === s.id ? <Spinner /> : <ArrowRight size={20} className="text-ink-muted transition-transform group-hover:translate-x-1" />}
          </motion.button>
        </Rise>
      ))}
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupFlow />
    </Suspense>
  );
}
