"use client";

import clsx from "clsx";
import { Volume2, VolumeX } from "lucide-react";
import { useT } from "@/i18n";
import { VOICE_RATES, useVoice } from "@/lib/voice";

/** Header switch for read-aloud, plus a speed pill while it's on. */
export function VoiceControls() {
  const { available, enabled, setEnabled, rate, setRate, speakingId } = useVoice();
  const { t, n } = useT();
  if (!available) return null;

  const nextRate = VOICE_RATES[(VOICE_RATES.indexOf(rate) + 1) % VOICE_RATES.length];

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setEnabled(!enabled)}
        aria-pressed={enabled}
        aria-label={enabled ? t("voice.disable") : t("voice.enable")}
        title={enabled ? t("voice.disable") : t("voice.enable")}
        className={clsx(
          "relative flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-bold transition-colors",
          enabled ? "bg-brand-50 text-brand-600" : "text-ink-soft hover:bg-cream",
        )}
      >
        {enabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
        <span className="hidden md:inline">{enabled ? t("voice.on") : t("voice.off")}</span>
        {speakingId && <SoundBars className="absolute -right-0.5 -top-0.5" />}
      </button>
      {enabled && (
        <button
          onClick={() => setRate(nextRate)}
          className="h-8 rounded-lg border border-line px-2 text-xs font-extrabold text-ink-soft hover:border-brand-200 hover:text-ink"
          title={t("voice.speed")}
          aria-label={`${t("voice.speed")}: ${n(rate)}×`}
        >
          {n(rate)}×
        </button>
      )}
    </div>
  );
}

/** Tiny animated equaliser shown while Progga is speaking. */
export function SoundBars({ className }: { className?: string }) {
  return (
    <span className={clsx("flex h-3.5 items-end gap-[2px]", className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-[3px] animate-soundbar rounded-full bg-brand-500" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}
