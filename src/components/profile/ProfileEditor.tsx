"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpenCheck, Camera, Check, ChevronDown, GraduationCap, Heart, Phone, Plus, School, Rocket, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSWRConfig } from "swr";
import { useCelebrate } from "@/components/celebrate/CelebrationProvider";
import { Spinner } from "@/components/ui/primitives";
import { useFormat, useT, type TKey } from "@/i18n";
import { api, ApiError, errorMessage } from "@/lib/api";
import { DISTRICTS } from "@/lib/districts";
import { GRADES } from "@/lib/format";
import { checklist, draftFrom, focusField, isEmail, isMobile, percentOf, squarePhoto, type ItemId, type ProfileDraft } from "@/lib/profile";
import { RELATIONS, type Language, type Profile, type User } from "@/lib/types";
import { useMe } from "@/lib/useMe";
import { Avatar } from "./Avatar";
import { CompletionRing } from "./CompletionRing";
import { PROFILE_REWARD_COINS } from "./ProfileCompletionCard";

const EASE = [0.22, 1, 0.36, 1] as const;
const BIO_MAX = 300;
const BIO_PROMPTS: TKey[] = ["me.promptLove", "me.promptSubject", "me.promptFree", "me.promptHelp"];
const LANG_OPTIONS: [Language, TKey][] = [
  ["en", "lang.en"],
  ["bn", "lang.bn"],
];

/** Compares drafts ignoring empty profile fields and key order. */
const snapshot = (d: ProfileDraft) =>
  JSON.stringify({
    ...d,
    profile: Object.fromEntries(
      Object.entries(d.profile)
        .filter(([, v]) => v)
        .sort(),
    ),
  });

/**
 * Everything someone can say about themself, as friendly sections with a live
 * completion ring. Students get school, family and guardian; parents and
 * teachers get the details that matter for them. One save bar for all of it.
 */
export function ProfileEditor({ user, barClassName = "bottom-6" }: { user: User; barClassName?: string }) {
  const { mutate } = useMe();
  const { mutate: mutateAny } = useSWRConfig();
  const { toast, burst } = useCelebrate();
  const { t, tx, n, ui, lang, setLang } = useT();
  const { gradeLabel } = useFormat();

  const [base, setBase] = useState(() => draftFrom(user));
  const [draft, setDraft] = useState(base);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);

  const role = user.role;
  const student = role === "STUDENT";
  const teacher = role === "TEACHER";
  const p = draft.profile;
  const items = checklist(role, draft, !!user.photoUrl);
  const percent = percentOf(items);
  const doneIds = new Set(items.filter((i) => i.done).map((i) => i.id));
  const missing = items.filter((i) => !i.done).map((i) => i.id);
  const dirty = snapshot(base) !== snapshot(draft);

  // Arrived from "Complete profile → School"? Jump to that field.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) setTimeout(() => focusField(id), 400);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof ProfileDraft>(k: K, v: ProfileDraft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const setP = (k: keyof Profile, v: string) => {
    setDraft((d) => ({ ...d, profile: { ...d.profile, [k]: v } }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  /** Keeps "switched from parent" info, which only /auth/me returns. */
  const store = (next: User) => mutate({ user: { ...next, switchedFrom: user.switchedFrom } }, { revalidate: false });

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoBusy(true);
    try {
      const form = new FormData();
      form.append("photo", await squarePhoto(file), "photo.jpg");
      const r = await api<{ user: User }>("/me/photo", { method: "PUT", form });
      await store(r.user);
      toast(t("me.photoSaved"), "📸", "mint");
    } catch {
      toast(t("me.photoFailed"), "⚠️", "coral");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removePhoto() {
    setPhotoBusy(true);
    try {
      const r = await api<{ user: User }>("/me/photo", { method: "DELETE" });
      await store(r.user);
      toast(t("me.photoRemoved"), "🗑️", "brand");
    } catch (err) {
      toast(errorMessage(err), "⚠️", "coral");
    } finally {
      setPhotoBusy(false);
    }
  }

  function addPrompt(prompt: string) {
    const cur = (p.bio ?? "").trimEnd();
    const joiner = !cur ? "" : /[.!?।]$/.test(cur) ? " " : ". ";
    const next = (cur + joiner + prompt).slice(0, BIO_MAX);
    setP("bio", next);
    requestAnimationFrame(() => {
      bioRef.current?.focus();
      bioRef.current?.setSelectionRange(next.length, next.length);
    });
  }

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    const errs: Record<string, string> = {};
    if (draft.name.trim().length < 2) errs.name = t("me.fullName");
    if (draft.email && !isEmail(draft.email)) errs.email = t("me.invalidEmail");
    if (draft.phone && !isMobile(draft.phone)) errs.phone = t("me.invalidMobile");
    if (p.guardianPhone && !isMobile(p.guardianPhone)) errs.guardianPhone = t("me.invalidMobile");
    if (Object.keys(errs).length) {
      setErrors(errs);
      focusField(`e-${Object.keys(errs)[0]}`);
      return;
    }

    // Only send what changed; "" clears a field.
    const body: Record<string, unknown> = {};
    for (const k of ["name", "birthdate", "email", "phone"] as const) if (draft[k] !== base[k]) body[k] = draft[k].trim();
    if (student && draft.grade !== base.grade) body.grade = draft.grade;
    const profile: Record<string, string> = {};
    for (const k of new Set([...Object.keys(draft.profile), ...Object.keys(base.profile)]) as Set<keyof Profile>) {
      const now = (draft.profile[k] ?? "").trim();
      if (now !== (base.profile[k] ?? "").trim()) profile[k] = now;
    }
    if (Object.keys(profile).length) body.profile = profile;

    setSaving(true);
    try {
      const r = await api<{ user: User; reward: { coins: number } | null }>("/me", { method: "PATCH", body });
      await store(r.user);
      void mutateAny("/me/dashboard");
      const next = draftFrom(r.user);
      setBase(next);
      setDraft(next);
      if (r.reward) {
        burst();
        toast(t("me.rewardEarned", { n: r.reward.coins }), "🍌", "banana");
      } else if (r.user.profileStatus?.percent === 100 && (user.profileStatus?.percent ?? 0) < 100) {
        burst();
        toast(t("me.allDone"), "🎉", "mint");
      } else {
        toast(t("me.saved"), "✅", "mint");
      }
    } catch (err) {
      const details = err instanceof ApiError ? err.details : undefined;
      const fields = details ? Object.keys(details).filter((k) => details[k]?.length && document.getElementById(`e-${k}`)) : [];
      if (fields.length) {
        setErrors(Object.fromEntries(fields.map((k) => [k, details?.[k]?.[0]])));
        focusField(`e-${fields[0]}`);
      } else {
        toast(errorMessage(err), "⚠️", "coral");
      }
    } finally {
      setSaving(false);
    }
  }

  const relationOptions = RELATIONS.map((id) => ({ id, label: t(`me.rel.${id}`) }));
  const districts = ui === "bn" ? [...DISTRICTS].sort((a, b) => a.bn.localeCompare(b.bn, "bn")) : DISTRICTS;
  const roleLabel = p.relation ? t(`me.rel.${p.relation}`) : teacher ? t("auth.demoTeacher") : t("auth.demoParent");
  const placeName = p.district && (ui === "bn" ? DISTRICTS.find((d) => d.en === p.district)?.bn : p.district);
  const subtitle = (student ? [gradeLabel(draft.grade), p.schoolName] : [roleLabel, teacher ? p.schoolName : p.occupation, placeName]).filter(Boolean).join(" · ");

  return (
    <form id="profile-form" onSubmit={save} className="space-y-5" noValidate>
      {/* ── Hero: photo, name, live completion ── */}
      <section className="card overflow-hidden">
        <div className="relative h-28 bg-gradient-to-r from-brand-500 via-brand-400 to-sky-400 sm:h-32">
          <div className="bg-dots absolute inset-0 opacity-30" />
          <div className="absolute -right-8 -top-12 h-44 w-44 rounded-full bg-banana-300/40 blur-2xl" />
        </div>
        <div className="px-5 pb-5 sm:px-6">
          {/* only the photo overlaps the banner; name and ring sit below it */}
          <div className="relative flex flex-wrap items-end gap-4">
            <div id="f-photo" className="relative -mt-14 w-fit">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={photoBusy}
                aria-label={user.photoUrl ? t("me.changePhoto") : t("me.addPhoto")}
                className="group relative block rounded-[28%] bg-white p-1 shadow-soft"
              >
                <Avatar name={user.name} photoUrl={user.photoUrl} role={role} skin={user.avatarSkin} size={112} />
                <span className="absolute inset-1 grid place-items-center rounded-[28%] bg-ink/0 text-white opacity-0 transition-all group-hover:bg-ink/35 group-hover:opacity-100">
                  <Camera size={26} />
                </span>
                {photoBusy && (
                  <span className="absolute inset-1 grid place-items-center rounded-[28%] bg-white/75">
                    <Spinner />
                  </span>
                )}
              </button>
              <span className="pointer-events-none absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-brand-500 text-white shadow-soft ring-4 ring-white">
                <Camera size={16} strokeWidth={2.4} />
              </span>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPhoto} />
            </div>
            {/* phones: photo + ring on one row, name underneath */}
            <div className="order-last w-full min-w-0 sm:order-none sm:w-auto sm:flex-1 sm:pb-1">
              <h1 className="truncate text-3xl font-extrabold">{draft.name.trim() || user.name}</h1>
              {subtitle && <p className="truncate text-ink-soft">{subtitle}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} disabled={photoBusy} className="btn-ghost btn-sm">
                  <Camera size={15} /> {user.photoUrl ? t("me.changePhoto") : t("me.addPhoto")}
                </button>
                {user.photoUrl ? (
                  <button type="button" onClick={removePhoto} disabled={photoBusy} className="rounded-xl px-3 py-2 text-sm font-bold text-ink-muted hover:bg-coral-50 hover:text-coral-600">
                    {t("me.removePhoto")}
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-ink-muted">{t("me.photoHint")}</span>
                )}
              </div>
            </div>
            <div className="ml-auto pb-1">
              <CompletionRing percent={percent} size={84} label={t("me.complete")} />
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-cream p-4">
            <AnimatePresence mode="wait" initial={false}>
              {missing.length ? (
                <motion.div key="left" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <p className="text-sm font-extrabold text-ink-soft">{t("me.whatsLeft")}</p>
                    {student && !user.profileStatus?.rewarded && <span className="text-xs font-bold text-banana-700">{t("me.rewardHint", { n: PROFILE_REWARD_COINS })}</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <AnimatePresence initial={false}>
                      {missing.map((id) => (
                        <motion.button
                          key={id}
                          layout
                          type="button"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          onClick={() => focusField(`f-${id}`)}
                          className="chip border-dashed border-ink-muted/30 bg-white text-ink-soft hover:border-brand-300 hover:text-brand-600"
                        >
                          <Plus size={14} strokeWidth={3} /> {tx(`me.item.${id}`, id)}
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mint-500 text-white">
                    <Check size={20} strokeWidth={3} />
                  </span>
                  <div>
                    <p className="font-display text-lg font-bold">{t("me.allDone")}</p>
                    <p className="text-sm text-ink-muted">{t("me.allDoneText")}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <Section icon={Sparkles} tone="bg-banana-100 text-banana-700" title={student ? t("me.secAbout") : t("me.secAboutAdult")} items={["bio"]} doneIds={doneIds}>
        <Field id="bio" label={t("me.bio")} done={doneIds.has("bio")}>
          <div className="relative">
            <textarea
              id="bio"
              ref={bioRef}
              rows={4}
              maxLength={BIO_MAX}
              className="input resize-none pb-8 leading-relaxed"
              value={p.bio ?? ""}
              onChange={(e) => setP("bio", e.target.value)}
              placeholder={student ? t("me.bioPhStudent") : teacher ? t("me.bioPhTeacher") : t("me.bioPhParent")}
            />
            <span className={clsx("pointer-events-none absolute bottom-3 right-4 text-xs font-bold", (p.bio?.length ?? 0) > BIO_MAX - 30 ? "text-coral-500" : "text-ink-muted")}>
              {n(p.bio?.length ?? 0)}/{n(BIO_MAX)}
            </span>
          </div>
          {student && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {BIO_PROMPTS.map((k) => (
                <button key={k} type="button" onClick={() => addPrompt(t(k))} className="chip border-line bg-white text-ink-soft hover:border-banana-400 hover:bg-banana-50 hover:text-ink">
                  <Sparkles size={13} className="text-banana-600" /> {t(k).trim()}…
                </button>
              ))}
            </div>
          )}
        </Field>
        {student && (
          <Field label={t("me.dream")}>
            <input className="input" maxLength={60} value={p.dream ?? ""} onChange={(e) => setP("dream", e.target.value)} placeholder={t("me.dreamPh")} />
          </Field>
        )}
      </Section>

      {/* ── Personal ── */}
      <Section
        icon={UserRound}
        tone="bg-brand-100 text-brand-600"
        title={t("me.secPersonal")}
        items={student ? ["name", "birthdate", "class"] : teacher ? ["name", "district"] : ["name", "relation", "occupation", "district"]}
        doneIds={doneIds}
      >
        <Field id="name" label={t("me.fullName")} done={doneIds.has("name")} error={errors.name}>
          <input id="name" className="input" autoComplete="name" maxLength={60} value={draft.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        {student && (
          <>
            <Field id="birthdate" label={t("me.birthdate")} done={doneIds.has("birthdate")} error={errors.birthdate}>
              <input id="birthdate" className="input" type="date" min="1990-01-01" max={new Date().toISOString().slice(0, 10)} value={draft.birthdate} onChange={(e) => set("birthdate", e.target.value)} />
            </Field>
            <Field id="class" label={t("profile.class")} done={doneIds.has("class")}>
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={draft.grade === g}
                    onClick={() => set("grade", g)}
                    className={clsx("h-11 rounded-xl border-2 font-display text-lg font-extrabold transition-colors", draft.grade === g ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-white text-ink-soft hover:border-brand-200")}
                  >
                    {n(g)}
                  </button>
                ))}
              </div>
            </Field>
          </>
        )}
        {!student && !teacher && (
          <>
            <Field id="relation" label={t("me.relationToKids")} done={doneIds.has("relation")}>
              <Chips value={p.relation} options={relationOptions.filter((r) => !["brother", "sister"].includes(r.id))} onChange={(v) => setP("relation", v)} />
            </Field>
            <Field id="occupation" label={t("me.occupation")} done={doneIds.has("occupation")}>
              <input className="input" maxLength={60} value={p.occupation ?? ""} onChange={(e) => setP("occupation", e.target.value)} placeholder={t("me.occupationPh")} />
            </Field>
          </>
        )}
        {!student && <DistrictField value={p.district} done={doneIds.has("district")} districts={districts} ui={ui} label={t("me.district")} placeholder={t("me.pickDistrict")} onChange={(v) => setP("district", v)} />}
      </Section>

      {/* ── School (students) / Teaching (teachers) ── */}
      {student && (
        <Section icon={School} tone="bg-mint-100 text-mint-700" title={t("me.secSchool")} items={["school", "district"]} doneIds={doneIds}>
          <Field id="school" label={t("me.schoolName")} done={doneIds.has("school")}>
            <input className="input" maxLength={120} value={p.schoolName ?? ""} onChange={(e) => setP("schoolName", e.target.value)} placeholder={t("me.schoolPh")} />
          </Field>
          <DistrictField value={p.district} done={doneIds.has("district")} districts={districts} ui={ui} label={t("me.district")} placeholder={t("me.pickDistrict")} onChange={(v) => setP("district", v)} />
        </Section>
      )}
      {teacher && (
        <Section icon={GraduationCap} tone="bg-mint-100 text-mint-700" title={t("me.secWork")} items={["school", "subjects"]} doneIds={doneIds}>
          <Field id="school" label={t("me.institution")} done={doneIds.has("school")}>
            <input className="input" maxLength={120} value={p.schoolName ?? ""} onChange={(e) => setP("schoolName", e.target.value)} placeholder={t("me.institutionPh")} />
          </Field>
          <Field id="subjects" label={t("me.subjects")} done={doneIds.has("subjects")}>
            <input className="input" maxLength={120} value={p.subjects ?? ""} onChange={(e) => setP("subjects", e.target.value)} placeholder={t("me.subjectsPh")} />
          </Field>
        </Section>
      )}

      {/* ── Family & guardian (students) ── */}
      {student && (
        <>
          <Section icon={Heart} tone="bg-coral-100 text-coral-600" title={t("me.secFamily")} items={["father", "mother"]} doneIds={doneIds}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="father" label={t("me.fatherName")} done={doneIds.has("father")}>
                <input className="input" maxLength={60} value={p.fatherName ?? ""} onChange={(e) => setP("fatherName", e.target.value)} placeholder={t("me.personNamePh")} />
              </Field>
              <Field id="mother" label={t("me.motherName")} done={doneIds.has("mother")}>
                <input className="input" maxLength={60} value={p.motherName ?? ""} onChange={(e) => setP("motherName", e.target.value)} placeholder={t("me.personNamePh")} />
              </Field>
            </div>
          </Section>
          <Section icon={ShieldCheck} tone="bg-sky-100 text-sky-600" title={t("me.secGuardian")} hint={t("me.secGuardianHint")} items={["guardian"]} doneIds={doneIds}>
            <Field id="guardian" label={t("me.guardianName")} done={!!p.guardianName?.trim()}>
              <input className="input" maxLength={60} value={p.guardianName ?? ""} onChange={(e) => setP("guardianName", e.target.value)} placeholder={t("me.personNamePh")} />
            </Field>
            <Field label={t("me.guardianRelation")} done={!!p.guardianRelation}>
              <Chips value={p.guardianRelation} options={relationOptions} onChange={(v) => setP("guardianRelation", v)} />
            </Field>
            <Field errorId="guardianPhone" label={t("me.guardianPhone")} done={isMobile(p.guardianPhone ?? "")} error={errors.guardianPhone}>
              <MobileInput value={p.guardianPhone ?? ""} onChange={(v) => setP("guardianPhone", v)} placeholder={t("me.mobilePh")} />
            </Field>
          </Section>
        </>
      )}

      {/* ── Contact & sign-in ── */}
      <Section icon={Phone} tone="bg-brand-100 text-brand-600" title={t("me.secContact")} hint={t("me.secContactHint")} items={student ? [] : ["mobile"]} doneIds={doneIds}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="mobile" errorId="phone" label={t("me.mobile")} done={isMobile(draft.phone)} error={errors.phone}>
            <MobileInput value={draft.phone} onChange={(v) => set("phone", v)} placeholder={t("me.mobilePh")} />
          </Field>
          <Field errorId="email" label={t("me.email")} done={isEmail(draft.email)} error={errors.email}>
            <input className="input" type="email" inputMode="email" autoComplete="email" value={draft.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
          </Field>
        </div>
      </Section>

      {/* ── Learning settings (students) ── */}
      {student && (
        <Section icon={BookOpenCheck} tone="bg-banana-100 text-banana-700" title={t("me.secLearning")} items={[]} doneIds={doneIds}>
          <Field label={t("profile.talksIn")}>
            {/* Same setting as the top-bar switcher: saved instantly to the account */}
            <div className="flex flex-wrap gap-2">
              {LANG_OPTIONS.map(([id, label]) => (
                <button type="button" key={id} onClick={() => void setLang(id)} className={clsx("chip", lang === id ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-white")}>
                  {t(label)}
                </button>
              ))}
            </div>
          </Field>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-cream px-4 py-3 text-sm">
            <span className="font-semibold text-ink-soft">{t("profile.limit")}</span>
            <span className="font-display text-lg font-extrabold">{n(user.dailyTutorLimit ?? 0)}</span>
          </div>
        </Section>
      )}

      {/* ── Save bar ── */}
      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className={clsx("pointer-events-none fixed inset-x-0 z-40 px-4", barClassName)}
          >
            <div className="pointer-events-auto mx-auto flex max-w-3xl items-center gap-2 rounded-2xl bg-ink py-2.5 pl-5 pr-2.5 text-white shadow-lift">
              <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-banana-400" />
              <span className="min-w-0 flex-1 truncate font-bold">{t("me.unsaved")}</span>
              <button
                type="button"
                onClick={() => {
                  setDraft(base);
                  setErrors({});
                }}
                className="rounded-xl px-3 py-2 text-sm font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                {t("me.discard")}
              </button>
              <button type="submit" disabled={saving} className="btn-banana btn-sm min-w-24">
                {saving ? <Spinner size={16} /> : t("me.save")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

// ── Pieces ───────────────────────────────────────────────

function Section({
  icon: Icon,
  tone,
  title,
  hint,
  items,
  doneIds,
  children,
}: {
  icon: typeof Sparkles;
  tone: string;
  title: string;
  hint?: string;
  items: ItemId[];
  doneIds: Set<ItemId>;
  children: React.ReactNode;
}) {
  const { n } = useT();
  const done = items.filter((id) => doneIds.has(id)).length;
  const complete = items.length > 0 && done === items.length;
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: EASE }}
      className="card p-5 sm:p-6"
    >
      <div className="mb-5 flex items-start gap-3">
        <span className={clsx("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", tone)}>
          <Icon size={20} strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="text-xl font-extrabold leading-tight">{title}</h2>
          {hint && <p className="text-sm text-ink-muted">{hint}</p>}
        </div>
        {items.length > 0 && (
          <span className={clsx("flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold transition-colors", complete ? "bg-mint-100 text-mint-700" : "bg-cream text-ink-muted")}>
            {complete && <Check size={12} strokeWidth={3.5} />}
            {n(done)}/{n(items.length)}
          </span>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </motion.section>
  );
}

function Field({ id, errorId, label, done, error, children }: { id?: ItemId; errorId?: string; label: string; done?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div id={id ? `f-${id}` : undefined} className="-m-2 p-2">
      <div id={errorId ? `e-${errorId}` : id ? `e-${id}` : undefined}>
        <span className="label flex items-center gap-1.5">
          {label}
          <AnimatePresence>
            {done && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="grid h-4 w-4 place-items-center rounded-full bg-mint-500 text-white">
                <Check size={10} strokeWidth={4} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        {children}
        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 text-sm font-semibold text-coral-600">
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Chips({ value, options, onChange }: { value?: string; options: { id: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <motion.button
          key={o.id}
          type="button"
          whileTap={{ scale: 0.94 }}
          aria-pressed={value === o.id}
          onClick={() => onChange(value === o.id ? "" : o.id)}
          className={clsx("chip", value === o.id ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-white text-ink-soft hover:border-brand-200")}
        >
          {o.label}
        </motion.button>
      ))}
    </div>
  );
}

function MobileInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center border-r-2 border-line pr-3 font-display font-bold text-ink-muted">+88</span>
      <input className="input pl-[4.6rem]" type="tel" inputMode="tel" autoComplete="tel" maxLength={16} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function DistrictField({
  value,
  done,
  districts,
  ui,
  label,
  placeholder,
  onChange,
}: {
  value?: string;
  done: boolean;
  districts: typeof DISTRICTS;
  ui: "en" | "bn";
  label: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field id="district" label={label} done={done}>
      <div className="relative">
        <select className={clsx("input cursor-pointer appearance-none pr-11", !value && "text-ink-muted")} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">{placeholder}</option>
          {districts.map((d) => (
            <option key={d.en} value={d.en} className="text-ink">
              {ui === "bn" ? d.bn : d.en}
            </option>
          ))}
        </select>
        <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted" />
      </div>
    </Field>
  );
}

/** Read-only "About {kid}" facts for the parent's report page. */
export function ProfileFacts({ profile, birthdate }: { profile?: Profile; birthdate?: string | null }) {
  const { t, ui } = useT();
  if (!profile) return null;
  const district = profile.district && (ui === "bn" ? DISTRICTS.find((d) => d.en === profile.district)?.bn : profile.district);
  const rows: [string, string | undefined][] = [
    [t("me.schoolName"), profile.schoolName],
    [t("me.district"), district],
    [t("me.birthdate"), birthdate ?? undefined],
    [t("me.fatherName"), profile.fatherName],
    [t("me.motherName"), profile.motherName],
    [t("me.guardianName"), profile.guardianName && [profile.guardianName, profile.guardianRelation && t(`me.rel.${profile.guardianRelation}`)].filter(Boolean).join(" · ")],
  ];
  const shown = rows.filter((r): r is [string, string] => !!r[1]);
  return (
    <div className="space-y-3">
      {profile.bio && <p className="rounded-2xl bg-cream px-4 py-3 italic leading-relaxed text-ink-soft">“{profile.bio}”</p>}
      {profile.dream && (
        <p className="flex items-center gap-2 text-sm font-bold text-ink-soft">
          <Rocket size={15} className="text-brand-500" /> {t("me.dreamLine", { dream: profile.dream })}
        </p>
      )}
      {shown.length > 0 && (
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {shown.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b border-line/70 py-1.5">
              <dt className="text-ink-muted">{k}</dt>
              <dd className="truncate text-right font-bold">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
