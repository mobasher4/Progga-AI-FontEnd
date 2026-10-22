"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ProggaBot } from "@/components/brand/ProggaBot";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useT } from "@/i18n";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { t } = useT();
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between gap-3">
          <Link href="/"><Logo size={36} /></Link>
          <LanguageSwitcher />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-4xl font-extrabold">{title}</h1>
          <p className="mt-2 text-ink-soft">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-grape-500 via-grape-600 to-grape-800 lg:block">
        <div className="bg-dots absolute inset-0 opacity-40" />
        <div className="absolute -right-24 top-16 h-80 w-80 rounded-full bg-banana-300/40 blur-3xl" />
        <div className="relative flex h-full flex-col items-center justify-center px-12 text-center text-white">
          <ProggaBot size={250} mood="happy" />
          <h2 className="mt-6 text-4xl font-extrabold">{t("auth.sideTitle")}</h2>
          <p className="mt-3 max-w-sm text-lg text-grape-100">{t("auth.sideBody")}</p>
          <div className="mt-8 flex gap-3">
            {(["auth.chipSteps", "auth.chipHints", "auth.chipQuests"] as const).map((k) => (
              <span key={k} className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold">{t(k)}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
