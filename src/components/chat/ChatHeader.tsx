"use client";

import { Menu, PanelLeftOpen } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useT } from "@/i18n";
import { useChatLayout } from "./ChatShell";

/** Slim top bar of the chat: history toggle, title, language, page-specific actions. */
export function ChatHeader({ title, subtitle, actions }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  const { collapsed, setCollapsed, openDrawer } = useChatLayout();
  const { t } = useT();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line/70 bg-white/90 px-3 backdrop-blur sm:px-4">
      <button onClick={openDrawer} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-soft hover:bg-cream lg:hidden" aria-label={t("chatui.openMenu")}>
        <Menu size={20} />
      </button>
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-soft hover:bg-cream lg:grid"
          aria-label={t("chatui.showHistory")}
          title={t("chatui.showHistory")}
        >
          <PanelLeftOpen size={20} />
        </button>
      )}
      <div className="min-w-0 flex-1 px-1">
        <p className="truncate font-display text-lg font-extrabold leading-tight">{title}</p>
        {subtitle && <p className="truncate text-xs font-semibold text-ink-muted">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {actions}
        <LanguageSwitcher compact />
      </div>
    </header>
  );
}
