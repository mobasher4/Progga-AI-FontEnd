"use client";

import clsx from "clsx";
import { Camera, Check, MonitorSmartphone, Volume2 } from "lucide-react";
import { ProggaBot } from "@/components/brand/ProggaBot";
import { useT, type TKey } from "@/i18n";

// Store links are set per deployment; until an app is published its button shows "Coming soon".
const IOS_URL = process.env.NEXT_PUBLIC_IOS_APP_URL ?? "";
const ANDROID_URL = process.env.NEXT_PUBLIC_ANDROID_APP_URL ?? "";

/** Landing section: get Progga on iPhone and Android. */
export function AppDownload() {
  const { t } = useT();
  const perks: [React.ReactNode, TKey][] = [
    [<MonitorSmartphone key="a" size={18} />, "landing.app1"],
    [<Camera key="b" size={18} />, "landing.app2"],
    [<Volume2 key="c" size={18} />, "landing.app3"],
  ];

  return (
    <section id="app" className="px-4 pb-20 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border border-line bg-gradient-to-br from-banana-50 via-white to-brand-50 px-6 py-12 sm:px-14 sm:py-14">
        <div className="bg-dots absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom_right,black,transparent_70%)]" />
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.25fr_1fr]">
          <div className="min-w-0">
            <p className="eyebrow">{t("landing.appEyebrow")}</p>
            <h2 className="mt-2 text-4xl font-extrabold sm:text-5xl">{t("landing.appTitle")}</h2>
            <p className="mt-4 max-w-xl text-lg text-ink-soft">{t("landing.appBody")}</p>

            <ul className="mt-6 space-y-2.5">
              {perks.map(([icon, key]) => (
                <li key={key} className="flex items-center gap-3 font-semibold">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-soft">{icon}</span>
                  {t(key)}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <StoreButton href={IOS_URL} small={t("landing.appStoreSmall")} name="App Store" icon={<AppleIcon />} />
              <StoreButton href={ANDROID_URL} small={t("landing.playSmall")} name="Google Play" icon={<PlayIcon />} />
            </div>
          </div>

          <PhoneMock />
        </div>
      </div>
    </section>
  );
}

function StoreButton({ href, small, name, icon }: { href: string; small: string; name: string; icon: React.ReactNode }) {
  const { t } = useT();
  const soon = !href;
  const body = (
    <>
      <span className="h-7 w-7 shrink-0">{icon}</span>
      <span className="text-left leading-tight">
        <span className="block text-[11px] font-semibold opacity-80">{small}</span>
        <span className="block font-display text-xl font-bold">{name}</span>
      </span>
      {soon && (
        <span className="absolute -right-2 -top-2.5 rounded-full bg-banana-400 px-2 py-0.5 text-[11px] font-extrabold text-ink shadow-soft">
          {t("landing.appSoon")}
        </span>
      )}
    </>
  );
  const cls = clsx(
    "relative inline-flex min-w-[11.5rem] items-center gap-3 rounded-2xl bg-ink px-5 py-3 text-white shadow-[0_4px_0_0_rgb(0_0_0/0.25)] transition-all",
    soon ? "cursor-default opacity-90" : "hover:-translate-y-0.5 hover:bg-ink/90 active:translate-y-[2px]",
  );
  return soon ? (
    <span className={cls} aria-disabled="true" title={t("landing.appSoon")}>{body}</span>
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>
  );
}

/** A phone showing the start of a Progga chat. */
function PhoneMock() {
  const { t } = useT();
  return (
    <div className="relative mx-auto w-full max-w-[17rem]" aria-hidden="true">
      <div className="absolute -inset-6 -z-0 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="relative rotate-[4deg] rounded-[2.6rem] border-[10px] border-ink bg-white p-3 shadow-lift">
        <div className="mx-auto mb-3 h-5 w-24 rounded-full bg-ink" />
        <div className="flex items-center gap-2 border-b border-line pb-2.5">
          <ProggaBot size={34} float={false} />
          <div className="min-w-0">
            <p className="font-display text-sm font-extrabold leading-tight">Progga</p>
            <p className="text-[11px] font-semibold text-mint-600">● {t("landing.demoMission")}</p>
          </div>
        </div>
        <div className="space-y-2.5 py-3 text-[13px] leading-snug">
          <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-brand-500 px-3 py-2 font-semibold text-white">{t("landing.demoQ")}</p>
          <p className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-cream px-3 py-2">{t("landing.demoA1")}</p>
          <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-md border-2 border-banana-300 bg-banana-50 px-3 py-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-banana-700">✏️ {t("landing.demoYourTurn")}</p>
            <p className="mt-0.5">{t("landing.demoAsk")}</p>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-line px-3 py-2 text-[12px] text-ink-muted">
          <span className="flex-1">{t("ask.placeholder")}</span>
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand-500 text-white"><Check size={13} strokeWidth={3} /></span>
        </div>
      </div>
      <div className="absolute -right-14 top-1/3 hidden sm:block">
        <ProggaBot size={92} mood="happy" />
      </div>
    </div>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full">
      <polygon points="3.5,2.5 13,12 3.5,21.5" fill="#2196F3" />
      <polygon points="3.5,2.5 16.8,9.6 13,12" fill="#34A853" />
      <polygon points="3.5,21.5 13,12 16.8,14.4" fill="#EA4335" />
      <polygon points="16.8,9.6 21,12 16.8,14.4 13,12" fill="#FBBC04" />
    </svg>
  );
}
