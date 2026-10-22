"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/brand/Logo";
import { PageLoader } from "@/components/ui/primitives";
import { useLogout, useMe } from "@/lib/useMe";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useMe();
  const router = useRouter();
  const logout = useLogout();

  useEffect(() => {
    if (user && user.role !== "ADMIN") router.replace(user.role === "STUDENT" ? "/home" : "/guardian");
  }, [user, router]);

  if (!user || user.role !== "ADMIN") return <PageLoader />;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <Logo size={34} />
            <span className="hidden rounded-full bg-ink px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white sm:inline">Admin</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden font-display font-bold text-ink-soft sm:inline">{user.name}</span>
            <button onClick={logout} className="btn-ghost btn-sm"><LogOut size={15} /> Log out</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
