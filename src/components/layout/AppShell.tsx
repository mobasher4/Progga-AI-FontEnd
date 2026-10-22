"use client";

import clsx from "clsx";
import { Bot, Crown, Home, LogOut, PlayCircle, Swords, Trophy, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ProggaBot } from "@/components/brand/ProggaBot";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PageLoader } from "@/components/ui/primitives";
import { useFormat, useSyncAccountLanguage, useT, type TKey } from "@/i18n";
import { homeFor } from "@/lib/routes";
import { paletteFor } from "@/lib/skins";
import { useLogout, useMe } from "@/lib/useMe";
import type { User } from "@/lib/types";

const NAV: { href: string; label: TKey; icon: typeof Home }[] = [
  { href: "/home", label: "nav.home", icon: Home },
  { href: "/tutor", label: "nav.ask", icon: Bot },
  { href: "/lessons", label: "nav.lessons", icon: PlayCircle },
  { href: "/arena", label: "nav.arena", icon: Swords },
  { href: "/rewards", label: "nav.rewards", icon: Trophy },
  { href: "/leaderboard", label: "nav.leaderboard", icon: Crown },
  { href: "/profile", label: "nav.profile", icon: UserRound },
];
const MOBILE_NAV = NAV.filter((n) => ["/home", "/tutor", "/lessons", "/arena", "/rewards"].includes(n.href));

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useMe();
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const { t } = useT();
  const { gradeLabel } = useFormat();
  useSyncAccountLanguage(user);

  useEffect(() => {
    if (user && user.role !== "STUDENT") router.replace(homeFor(user.role));
  }, [user, router]);

  if (isLoading || !user || user.role !== "STUDENT") return <PageLoader label={t("common.wakingUp")} />;
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-white/80 px-4 py-6 backdrop-blur lg:flex">
        <Link href="/home" className="px-2">
          <Logo size={38} />
        </Link>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "group flex items-center gap-3 rounded-2xl px-3.5 py-3 font-display text-[1.05rem] font-bold transition-colors",
                active(href) ? "bg-grape-50 text-grape-600" : "text-ink-soft hover:bg-cream hover:text-ink",
              )}
            >
              <span
                className={clsx(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors",
                  active(href) ? "bg-grape-500 text-white shadow-[0_3px_0_0_var(--color-grape-700)]" : "bg-cream text-ink-soft group-hover:bg-white",
                )}
              >
                <Icon size={19} strokeWidth={2.4} />
              </span>
              <span className="truncate">{t(label)}</span>
            </Link>
          ))}
        </nav>
        <div className="rounded-3xl bg-gradient-to-br from-grape-500 to-grape-700 p-4 text-white">
          <div className="flex items-center gap-3">
            <ProggaBot size={46} float={false} palette={user.skin?.palette ?? paletteFor(user.avatarSkin)} />
            <div className="min-w-0">
              <p className="truncate font-display font-bold leading-tight">{user.name}</p>
              <p className="text-xs text-grape-100">{gradeLabel(user.grade)}</p>
            </div>
          </div>
          <button onClick={logout} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/15 py-2 text-sm font-bold hover:bg-white/25">
            <LogOut size={15} /> {t("common.logout")}
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <TopBar user={user} />
        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">{children}</main>
      </div>

      {/* Mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md justify-between">
          {MOBILE_NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={clsx("flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold", active(href) ? "text-grape-600" : "text-ink-muted")}>
              <span className={clsx("grid h-8 w-12 place-items-center rounded-full transition-colors", active(href) && "bg-grape-100")}>
                <Icon size={20} strokeWidth={2.4} />
              </span>
              <span className="max-w-full truncate px-0.5">{t(label)}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

function TopBar({ user }: { user: User }) {
  const { t, tx, n } = useT();
  const lvl = user.level!;
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <Link href="/home" className="lg:hidden">
          <Logo size={30} />
        </Link>
        <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-grape-500 font-display text-lg font-extrabold text-white shadow-[0_3px_0_0_var(--color-grape-700)]">
            {n(lvl.level)}
          </div>
          <div className="w-full max-w-xs">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-display font-bold">{tx(`levelTitles.${lvl.title}`, lvl.title)}</span>
              <span className="font-semibold text-ink-muted">
                {n(lvl.xp - lvl.levelStartXp)}/{n(lvl.nextLevelXp - lvl.levelStartXp)} XP
              </span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-grape-100">
              <div className="h-full rounded-full bg-gradient-to-r from-grape-400 to-grape-600 transition-[width] duration-700" style={{ width: `${lvl.progress * 100}%` }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Stat icon="🔥" value={n(user.streak ?? 0)} label={t("nav.dayStreak")} className="bg-coral-50 text-coral-600" />
          <Stat icon="🍌" value={n(user.coins ?? 0)} label={t("home.coins", { n: user.coins ?? 0 })} className="hidden bg-banana-100 text-banana-700 sm:flex" />
          <LanguageSwitcher compact />
          <Link href="/profile" className="ml-0.5 hidden sm:block" aria-label={t("nav.profile")}>
            <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl border-2 border-line bg-white">
              <ProggaBot size={34} float={false} palette={user.skin?.palette ?? paletteFor(user.avatarSkin)} />
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Stat({ icon, value, label, className }: { icon: string; value: string; label: string; className?: string }) {
  return (
    <span className={clsx("flex items-center gap-1.5 rounded-2xl px-3 py-2 font-display text-base font-extrabold", className)} title={`${value} ${label}`}>
      <span className="text-lg leading-none">{icon}</span>
      {value}
    </span>
  );
}
