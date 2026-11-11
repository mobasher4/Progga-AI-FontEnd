"use client";

import { Copy, LogOut } from "lucide-react";
import { useCelebrate } from "@/components/celebrate/CelebrationProvider";
import { PasswordCard } from "@/components/profile/PasswordCard";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { PageLoader } from "@/components/ui/primitives";
import { useT } from "@/i18n";
import { useLogout, useMe } from "@/lib/useMe";

export default function ProfilePage() {
  const { user } = useMe();
  const logout = useLogout();
  const { toast } = useCelebrate();
  const { t } = useT();

  if (!user) return <PageLoader label={t("common.loading")} />;

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-28">
      {/* sits above the mobile tab bar, and clear of the desktop sidebar */}
      <ProfileEditor key={user.id} user={user} barClassName="bottom-24 lg:bottom-6 lg:pl-64" />

      <div className="card bg-gradient-to-br from-brand-50 to-white p-6">
        <p className="eyebrow">{t("profile.linkEyebrow")}</p>
        <h2 className="mt-1 text-xl font-extrabold">{t("profile.linkTitle")}</h2>
        <p className="mt-1 text-sm text-ink-soft">{t("profile.linkBody")}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-2xl border-2 border-dashed border-brand-300 bg-white px-5 py-3 font-display text-3xl font-extrabold tracking-[0.3em] text-brand-600">{user.linkCode}</span>
          <button
            className="btn-ghost btn-sm"
            onClick={() => {
              void navigator.clipboard?.writeText(user.linkCode ?? "");
              toast(t("profile.copied"), "📋", "brand");
            }}
          >
            <Copy size={15} /> {t("common.copy")}
          </button>
        </div>
      </div>

      {(user.email || user.phone) && <PasswordCard />}

      <button onClick={logout} className="btn-ghost w-full">
        <LogOut size={16} /> {t("common.logout")}
      </button>
    </div>
  );
}
