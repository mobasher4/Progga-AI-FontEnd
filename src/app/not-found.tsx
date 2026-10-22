"use client";

import Link from "next/link";
import { ProggaBot } from "@/components/brand/ProggaBot";
import { useT } from "@/i18n";

export default function NotFound() {
  const { t } = useT();
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="text-center">
        <div className="flex justify-center"><ProggaBot size={170} mood="oops" /></div>
        <h1 className="mt-4 text-5xl font-extrabold">404</h1>
        <p className="mt-2 text-lg text-ink-soft">{t("notFound.body")}</p>
        <Link href="/" className="btn-primary mt-6">{t("notFound.home")}</Link>
      </div>
    </div>
  );
}
