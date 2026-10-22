"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PageLoader } from "@/components/ui/primitives";
import { useSyncAccountLanguage, useT } from "@/i18n";
import { useLogout, useMe } from "@/lib/useMe";

export default function GuardianLayout({ children }: { children: React.ReactNode }) {
  const { user } = useMe();
  const router = useRouter();
  const logout = useLogout();
  const { t } = useT();
  useSyncAccountLanguage(user);

  useEffect(() => {
    if (user?.role === "STUDENT") router.replace("/home");
    if (user?.role === "ADMIN") router.replace("/admin");
  }, [user, router]);

  if (!user || user.role === "STUDENT" || user.role === "ADMIN") return <PageLoader />;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/guardian" className="flex items-center gap-3">
            <Logo size={34} />
            <span className="hidden rounded-full bg-grape-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-grape-600 md:inline">
              {user.role === "TEACHER" ? t("guardian.teacherDashboard") : t("guardian.parentDashboard")}
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden font-display font-bold text-ink-soft lg:inline">{user.name}</span>
            <LanguageSwitcher />
            <button onClick={logout} className="btn-ghost btn-sm"><LogOut size={15} /> <span className="hidden sm:inline">{t("common.logout")}</span></button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
