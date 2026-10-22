"use client";

import clsx from "clsx";
import { Check, Lock } from "lucide-react";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { ProggaBot } from "@/components/brand/ProggaBot";
import { useCelebrate } from "@/components/celebrate/CelebrationProvider";
import { PageLoader, ProgressBar, Spinner } from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api";
import type { Badge, LevelInfo, Skin } from "@/lib/types";

interface Achievements {
  level: LevelInfo;
  streak: number;
  bestStreak: number;
  badges: Badge[];
}
interface Shop {
  coins: number;
  equipped: string;
  skins: Skin[];
}

const TIER: Record<Badge["tier"], string> = {
  bronze: "from-[#FFD8B0] to-[#F2A65A]",
  silver: "from-[#EEF1F7] to-[#B8C1D6]",
  gold: "from-banana-200 to-banana-500",
};

export default function RewardsPage() {
  const [tab, setTab] = useState<"badges" | "shop">("badges");
  const { data: ach } = useSWR<Achievements>("/game/achievements");
  const { data: shop, mutate: mutateShop } = useSWR<Shop>("/game/shop");
  const { mutate } = useSWRConfig();
  const { toast, burst } = useCelebrate();
  const [busy, setBusy] = useState<string | null>(null);

  if (!ach || !shop) return <PageLoader />;
  const earned = ach.badges.filter((b) => b.earnedAt).length;

  async function shopAction(kind: "buy" | "equip", skin: Skin) {
    setBusy(skin.id);
    try {
      const r = await api<Shop>(`/game/shop/${kind}`, { body: { skinId: skin.id } });
      await mutateShop(r, { revalidate: false });
      void mutate("/auth/me");
      if (kind === "buy") {
        burst();
        toast(`${skin.name} unlocked!`, "🤖", "grape");
      }
    } catch (e) {
      toast(errorMessage(e), "🍌", "coral");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Rewards</p>
          <h1 className="mt-1 text-4xl font-extrabold">Your trophy room 🏆</h1>
        </div>
        <div className="flex rounded-2xl border-2 border-line bg-white p-1">
          {(["badges", "shop"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx("rounded-xl px-5 py-2 font-display font-bold transition-colors", tab === t ? "bg-grape-500 text-white" : "text-ink-soft hover:text-ink")}
            >
              {t === "badges" ? `Badges (${earned}/${ach.badges.length})` : "Robot shop"}
            </button>
          ))}
        </div>
      </div>

      {tab === "badges" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card p-5 sm:col-span-2">
              <p className="eyebrow">Level {ach.level.level}</p>
              <p className="font-display text-2xl font-extrabold">{ach.level.title}</p>
              <ProgressBar value={ach.level.progress} className="mt-3" height="h-4" />
              <p className="mt-2 text-sm font-semibold text-ink-muted">{ach.level.xp} XP total · {ach.level.nextLevelXp - ach.level.xp} XP to next level</p>
            </div>
            <div className="card flex items-center gap-4 p-5">
              <span className="text-5xl">🔥</span>
              <div>
                <p className="font-display text-3xl font-extrabold">{ach.streak} days</p>
                <p className="text-sm font-semibold text-ink-muted">Best streak: {ach.bestStreak}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {ach.badges.map((b) => (
              <div key={b.id} className={clsx("card flex flex-col items-center p-5 text-center", !b.earnedAt && "bg-cream/60")}>
                <div
                  className={clsx(
                    "relative grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br text-4xl shadow-soft",
                    b.earnedAt ? TIER[b.tier] : "from-line to-line grayscale",
                  )}
                >
                  <span className={clsx(!b.earnedAt && "opacity-30")}>{b.icon}</span>
                  {!b.earnedAt && <Lock size={18} className="absolute bottom-0 right-0 rounded-full bg-white p-0.5 text-ink-muted" />}
                </div>
                <p className="mt-3 font-display font-extrabold">{b.name}</p>
                <p className="mt-0.5 text-xs text-ink-soft">{b.description}</p>
                <span className={clsx("mt-2 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider", b.earnedAt ? "bg-mint-100 text-mint-700" : "bg-line text-ink-muted")}>
                  {b.earnedAt ? `Earned ${new Date(b.earnedAt).toLocaleDateString()}` : b.tier}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="card flex items-center justify-between gap-4 bg-gradient-to-r from-banana-100 to-banana-50 p-5">
            <div>
              <p className="font-display text-xl font-extrabold">Kola coins 🍌</p>
              <p className="text-sm text-ink-soft">Earn coins by solving steps, finishing lessons and completing quests.</p>
            </div>
            <p className="font-display text-4xl font-extrabold text-banana-700">{shop.coins}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {shop.skins.map((s) => {
              const equipped = shop.equipped === s.id;
              const affordable = shop.coins >= s.cost;
              return (
                <div key={s.id} className={clsx("card flex flex-col items-center p-5 text-center", equipped && "border-2 border-grape-400 ring-4 ring-grape-100")}>
                  <div className="grid h-36 place-items-center">
                    <ProggaBot size={110} palette={s.palette} float={equipped} mood={equipped ? "happy" : "idle"} />
                  </div>
                  <p className="font-display text-lg font-extrabold">{s.name}</p>
                  {s.owned ? (
                    <button disabled={equipped || busy === s.id} onClick={() => shopAction("equip", s)} className={clsx("mt-3 w-full", equipped ? "btn-mint btn-sm" : "btn-ghost btn-sm")}>
                      {busy === s.id ? <Spinner size={16} /> : equipped ? <><Check size={16} /> Equipped</> : "Equip"}
                    </button>
                  ) : (
                    <button disabled={!affordable || busy === s.id} onClick={() => shopAction("buy", s)} className="btn-banana btn-sm mt-3 w-full">
                      {busy === s.id ? <Spinner size={16} /> : <>🍌 {s.cost}</>}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
