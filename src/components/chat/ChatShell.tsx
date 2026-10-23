"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Home, PanelLeftClose, PlayCircle, Search, SquarePen, Swords, Trophy, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Logo } from "@/components/brand/Logo";
import { ProggaBot } from "@/components/brand/ProggaBot";
import { PageLoader } from "@/components/ui/primitives";
import { useSyncAccountLanguage, useT, type TKey } from "@/i18n";
import { homeFor } from "@/lib/routes";
import { paletteFor } from "@/lib/skins";
import type { SessionSummary, User } from "@/lib/types";
import { useMe } from "@/lib/useMe";

interface ChatLayout {
  user: User;
  /** desktop: history column hidden */
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  /** mobile: open the history drawer */
  openDrawer: () => void;
  refreshHistory: () => void;
}

const ChatLayoutCtx = createContext<ChatLayout | null>(null);

export function useChatLayout() {
  const ctx = useContext(ChatLayoutCtx);
  if (!ctx) throw new Error("useChatLayout must be used inside ChatShell");
  return ctx;
}

const COLLAPSE_KEY = "progga_history_collapsed";

/** Full-screen chat layout for Ask Progga: history on the left, conversation filling the rest. */
export function ChatShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useMe();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useT();
  const [collapsed, setCollapsedState] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const { mutate } = useSWR<{ sessions: SessionSummary[] }>(user ? "/tutor/sessions" : null);
  useSyncAccountLanguage(user);

  useEffect(() => {
    try {
      setCollapsedState(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* storage unavailable — default to expanded */
    }
  }, []);

  useEffect(() => setDrawer(false), [pathname]);

  useEffect(() => {
    if (user && user.role !== "STUDENT") router.replace(homeFor(user.role));
  }, [user, router]);

  const setCollapsed = useCallback((v: boolean) => {
    setCollapsedState(v);
    try {
      localStorage.setItem(COLLAPSE_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => (user ? { user, collapsed, setCollapsed, openDrawer: () => setDrawer(true), refreshHistory: () => void mutate() } : null),
    [user, collapsed, setCollapsed, mutate],
  );

  if (isLoading || !user || user.role !== "STUDENT" || !value) return <PageLoader label={t("common.wakingUp")} />;

  return (
    <ChatLayoutCtx.Provider value={value}>
      <div className="flex h-dvh overflow-hidden bg-white">
        {/* Desktop history column */}
        <aside
          className={clsx(
            "hidden shrink-0 overflow-hidden border-r border-line bg-cream transition-[width] duration-300 ease-out lg:block",
            collapsed ? "w-0 border-r-0" : "w-[290px]",
          )}
        >
          <div className="h-full w-[290px]">
            <HistoryPanel onClose={() => setCollapsed(true)} closeIcon="collapse" />
          </div>
        </aside>

        {/* Mobile history drawer */}
        <AnimatePresence>
          {drawer && (
            <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setDrawer(false)} />
              <motion.aside
                className="absolute inset-y-0 left-0 w-[85%] max-w-[320px] bg-cream shadow-lift"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
              >
                <HistoryPanel onClose={() => setDrawer(false)} closeIcon="close" />
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </ChatLayoutCtx.Provider>
  );
}

// ── History ──────────────────────────────────────────────

type Group = { key: TKey; items: SessionSummary[] };

function groupByDate(sessions: SessionSummary[]): Group[] {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = startOfDay(new Date());
  const day = 86_400_000;
  const groups: Group[] = [
    { key: "chatui.today", items: [] },
    { key: "chatui.yesterday", items: [] },
    { key: "chatui.week", items: [] },
    { key: "chatui.older", items: [] },
  ];
  for (const s of sessions) {
    const d = startOfDay(new Date(s.updatedAt));
    const idx = d >= today ? 0 : d >= today - day ? 1 : d >= today - 7 * day ? 2 : 3;
    groups[idx].items.push(s);
  }
  return groups.filter((g) => g.items.length);
}

const QUICK_LINKS: { href: string; label: TKey; icon: typeof Home }[] = [
  { href: "/home", label: "nav.home", icon: Home },
  { href: "/lessons", label: "nav.lessons", icon: PlayCircle },
  { href: "/arena", label: "nav.arena", icon: Swords },
  { href: "/rewards", label: "nav.rewards", icon: Trophy },
];

function HistoryPanel({ onClose, closeIcon }: { onClose: () => void; closeIcon: "collapse" | "close" }) {
  const { user } = useChatLayout();
  const { t, tx, n } = useT();
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { data } = useSWR<{ sessions: SessionSummary[] }>("/tutor/sessions");

  const filtered = useMemo(() => {
    const all = data?.sessions ?? [];
    const q = query.trim().toLowerCase();
    return q ? all.filter((s) => `${s.title} ${s.topic} ${s.subject}`.toLowerCase().includes(q)) : all;
  }, [data, query]);
  const groups = groupByDate(filtered);
  const lvl = user.level!;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <Link href="/home" aria-label={t("nav.home")}>
          <Logo size={32} />
        </Link>
        <button
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-xl text-ink-muted hover:bg-white hover:text-ink"
          aria-label={closeIcon === "collapse" ? t("chatui.hideHistory") : t("chatui.closeMenu")}
          title={closeIcon === "collapse" ? t("chatui.hideHistory") : t("chatui.closeMenu")}
        >
          {closeIcon === "collapse" ? <PanelLeftClose size={19} /> : <X size={19} />}
        </button>
      </div>

      <div className="space-y-2.5 px-3 pb-3">
        <button onClick={() => router.push(`/tutor?new=${Date.now()}`)} className="btn-primary w-full justify-start !rounded-2xl !py-2.5">
          <SquarePen size={18} /> {t("chatui.newChat")}
        </button>
        <label className="relative block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("chatui.search")}
            className="w-full rounded-xl border border-line bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-ink-muted focus:border-brand-300"
          />
        </label>
      </div>

      <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2 pb-3">
        {groups.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-ink-muted">{query ? t("chatui.noMatches") : t("chatui.empty")}</p>
        )}
        {groups.map((g) => (
          <div key={g.key}>
            <p className="px-3 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-ink-muted">{t(g.key)}</p>
            <ul className="space-y-0.5">
              {g.items.map((s) => {
                const active = pathname === `/tutor/${s.id}`;
                return (
                  <li key={s.id}>
                    <Link
                      href={`/tutor/${s.id}`}
                      className={clsx(
                        "group flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors",
                        active ? "bg-white shadow-soft ring-1 ring-brand-100" : "hover:bg-white/70",
                      )}
                    >
                      <span className="text-base">{s.mode === "fact" ? "⚡" : s.mode === "concept" ? "🔭" : "🧩"}</span>
                      <span className="min-w-0 flex-1">
                        <span className={clsx("block truncate text-sm font-bold", active ? "text-brand-700" : "text-ink")}>{s.title}</span>
                        <span className="block truncate text-xs text-ink-muted">{s.topic || s.subject}</span>
                      </span>
                      <span
                        className={clsx(
                          "h-2 w-2 shrink-0 rounded-full",
                          s.mode === "fact" ? "bg-sky-400" : s.status === "solved" ? "bg-mint-500" : s.status === "active" ? "bg-banana-400" : "bg-line",
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <div className="mb-3 grid grid-cols-4 gap-1">
          {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-bold text-ink-soft hover:bg-white hover:text-brand-600" title={t(label)}>
              <Icon size={18} />
              <span className="max-w-full truncate px-1">{t(label)}</span>
            </Link>
          ))}
        </div>
        <Link href="/profile" className="flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-soft hover:ring-1 hover:ring-brand-100">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50">
            <ProggaBot size={32} float={false} palette={user.skin?.palette ?? paletteFor(user.avatarSkin)} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">{user.name}</span>
            <span className="block truncate text-xs text-ink-muted">
              {t("common.levelN", { n: lvl.level })} · {tx(`levelTitles.${lvl.title}`, lvl.title)}
            </span>
          </span>
          <span className="flex shrink-0 flex-col items-end text-xs font-extrabold">
            <span className="text-coral-600">🔥 {n(user.streak ?? 0)}</span>
            <span className="text-banana-700">🍌 {n(user.coins ?? 0)}</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
