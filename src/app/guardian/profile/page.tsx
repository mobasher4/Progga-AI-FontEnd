"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PasswordCard } from "@/components/profile/PasswordCard";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { PageLoader } from "@/components/ui/primitives";
import { useT } from "@/i18n";
import { useMe } from "@/lib/useMe";

export default function GuardianProfilePage() {
  const { user } = useMe();
  const { t } = useT();
  if (!user) return <PageLoader />;

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-28">
      <Link href="/guardian" className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-muted hover:text-ink">
        <ArrowLeft size={16} /> {user.role === "TEACHER" ? t("guardian.teacherDashboard") : t("guardian.parentDashboard")}
      </Link>
      <ProfileEditor key={user.id} user={user} />
      <PasswordCard />
    </div>
  );
}
