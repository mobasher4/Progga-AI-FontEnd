"use client";

import { motion } from "framer-motion";
import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { useT } from "@/i18n";
import type { User } from "@/lib/types";
import { CompletionRing } from "./CompletionRing";

export const PROFILE_REWARD_COINS = 50;

/** Nudge on the home screens until the profile reaches 100%. */
export function ProfileCompletionCard({ user, href }: { user: User; href: string }) {
  const { t, tx } = useT();
  const st = user.profileStatus;
  if (!st || st.percent >= 100) return null;
  const student = user.role === "STUDENT";

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card relative overflow-hidden p-5 sm:p-6"
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-banana-200/40 blur-2xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <CompletionRing percent={st.percent} size={92} label={t("me.complete")} />
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{t("me.eyebrow")}</p>
          <h2 className="mt-0.5 text-2xl font-extrabold">{t("me.completeTitle")}</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {student ? t("me.completeBodyStudent") : user.role === "TEACHER" ? t("me.completeBodyTeacher") : t("me.completeBodyAdult")}
            {student && !st.rewarded && <span className="ml-1 font-bold text-banana-700">{t("me.rewardHint", { n: PROFILE_REWARD_COINS })}</span>}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {st.missing.slice(0, 4).map((id) => (
              <Link key={id} href={`${href}#f-${id}`} className="chip border-dashed border-line bg-white text-ink-soft hover:border-brand-300 hover:text-brand-600">
                <Plus size={14} strokeWidth={3} /> {tx(`me.item.${id}`, id)}
              </Link>
            ))}
            {st.missing.length > 4 && <span className="chip border-transparent text-ink-muted">+{st.missing.length - 4}</span>}
          </div>
        </div>
        <Link href={href} className="btn-primary shrink-0 self-start sm:self-center">
          {t("me.completeCta")} <ArrowRight size={18} />
        </Link>
      </div>
    </motion.section>
  );
}
