import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ProggaBot } from "@/components/brand/ProggaBot";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Link href="/"><Logo size={36} /></Link>
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
          <h2 className="mt-6 text-4xl font-extrabold">Small steps. Big brains.</h2>
          <p className="mt-3 max-w-sm text-lg text-grape-100">Progga asks, you think, and every answer becomes yours. 🍌</p>
          <div className="mt-8 flex gap-3">
            {["🧩 Micro-steps", "💡 Hints", "🏆 Quests"].map((t) => (
              <span key={t} className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
