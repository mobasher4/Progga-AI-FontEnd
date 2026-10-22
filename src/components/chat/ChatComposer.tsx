"use client";

import clsx from "clsx";
import { ArrowUp, Sigma } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Spinner } from "@/components/ui/primitives";
import { useT } from "@/i18n";

const SYMBOLS = ["+", "−", "×", "÷", "=", "²", "³", "√", "π", "/", "(", ")", "°", "≤", "≥"];
const MAX_HEIGHT = 200;

export interface ComposerHandle {
  focus(): void;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled?: boolean;
  busy?: boolean;
  /** allow sending without text (e.g. a photo is attached) */
  canSendEmpty?: boolean;
  /** buttons inside the box, bottom-left (photo, subject…) */
  tools?: React.ReactNode;
  /** chips/actions shown just above the box (hints, practice…) */
  above?: React.ReactNode;
  /** content inside the box above the text (attachment preview) */
  attachment?: React.ReactNode;
  autoFocus?: boolean;
  label: string;
}

/** ChatGPT-style composer pinned to the bottom: grows with the text, Enter sends, Shift+Enter breaks lines. */
export const ChatComposer = forwardRef<ComposerHandle, Props>(function ChatComposer(
  { value, onChange, onSubmit, placeholder, disabled, busy, canSendEmpty, tools, above, attachment, autoFocus, label },
  ref,
) {
  const { t } = useT();
  const area = useRef<HTMLTextAreaElement>(null);
  const [showKeys, setShowKeys] = useState(false);
  useImperativeHandle(ref, () => ({ focus: () => area.current?.focus() }));

  // auto-grow
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  const canSend = !disabled && !busy && (value.trim().length > 0 || !!canSendEmpty);

  function insert(sym: string) {
    onChange(value + sym);
    area.current?.focus();
  }

  return (
    <div className="shrink-0 bg-gradient-to-t from-white via-white to-white/0 px-3 pb-3 pt-2 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        {above && <div className="mb-2 flex flex-wrap items-center gap-2">{above}</div>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSend) onSubmit();
          }}
          className="rounded-[26px] border-2 border-line bg-white shadow-soft transition-colors focus-within:border-grape-300 focus-within:shadow-lift"
        >
          {showKeys && (
            <div className="flex flex-wrap gap-1.5 border-b border-line px-3 pb-2 pt-3">
              {SYMBOLS.map((s) => (
                <button key={s} type="button" onClick={() => insert(s)} className="h-8 min-w-8 rounded-lg border border-line bg-cream px-2 font-display font-bold hover:border-grape-300 hover:bg-grape-50">
                  {s}
                </button>
              ))}
            </div>
          )}
          {attachment && <div className="px-4 pt-3">{attachment}</div>}
          <textarea
            ref={area}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (canSend) onSubmit();
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            aria-label={label}
            className="block max-h-[200px] w-full resize-none bg-transparent px-5 pb-1 pt-3.5 text-[16px] leading-relaxed outline-none placeholder:text-ink-muted/80 focus-visible:rounded-none focus-visible:ring-0"
          />
          <div className="flex items-center gap-1.5 px-2.5 pb-2.5 pt-1">
            {tools}
            <button
              type="button"
              onClick={() => setShowKeys((v) => !v)}
              className={clsx("grid h-9 w-9 place-items-center rounded-full transition-colors", showKeys ? "bg-grape-100 text-grape-700" : "text-ink-muted hover:bg-cream hover:text-ink")}
              title={t("session.symbols")}
              aria-label={t("session.symbols")}
              aria-pressed={showKeys}
            >
              <Sigma size={18} />
            </button>
            <span className="ml-auto hidden text-[11px] font-semibold text-ink-muted md:block">{t("session.enterHint")}</span>
            <button
              type="submit"
              disabled={!canSend}
              className={clsx(
                "ml-auto grid h-10 w-10 place-items-center rounded-full transition-all md:ml-2",
                canSend ? "bg-grape-500 text-white shadow-[0_3px_0_0_var(--color-grape-700)] hover:bg-grape-400 active:translate-y-0.5 active:shadow-none" : "bg-line text-ink-muted",
              )}
              aria-label={t("session.send")}
            >
              {busy ? <Spinner size={18} /> : <ArrowUp size={20} strokeWidth={2.6} />}
            </button>
          </div>
        </form>
        <p className="mt-2 text-center text-[11px] font-semibold text-ink-muted">{t("chatui.disclaimer")}</p>
      </div>
    </div>
  );
});
