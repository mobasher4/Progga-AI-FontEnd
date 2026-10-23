"use client";

import { ChevronDown, ImagePlus, X } from "lucide-react";
import { useT } from "@/i18n";
import type { Subject } from "@/lib/types";

/** Compact subject chip with a native select underneath (great on phones). */
export function SubjectPicker({ subjects, value, onChange, disabled }: { subjects: Subject[]; value: string; onChange: (id: string) => void; disabled?: boolean }) {
  const { t, ui } = useT();
  const current = subjects.find((s) => s.id === value);
  return (
    <label className="relative flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-cream pl-3 pr-2 text-sm font-bold text-ink-soft hover:border-brand-200 hover:text-ink">
      <span>{current?.icon ?? "📚"}</span>
      <span className="max-w-[9rem] truncate">{current ? (ui === "bn" ? current.nameBn : current.name) : t("chatui.subject")}</span>
      <ChevronDown size={14} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={t("chatui.subject")}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.icon} {ui === "bn" ? s.nameBn : s.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PhotoButton({ onPick, disabled }: { onPick: (f: File | undefined) => void; disabled?: boolean }) {
  const { t } = useT();
  return (
    <label className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-ink-muted transition-colors hover:bg-cream hover:text-ink" title={t("chatui.attach")}>
      <ImagePlus size={18} />
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={disabled}
        aria-label={t("chatui.attach")}
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </label>
  );
}

export function PhotoPreview({ src, onRemove }: { src: string; onRemove: () => void }) {
  const { t } = useT();
  return (
    <div className="relative inline-block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={t("ask.photoAlt")} className="h-20 rounded-xl border border-line object-cover" />
      <button type="button" onClick={onRemove} className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-ink text-white" aria-label={t("ask.removePhoto")}>
        <X size={12} />
      </button>
    </div>
  );
}
