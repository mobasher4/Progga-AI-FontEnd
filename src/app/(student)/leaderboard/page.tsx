"use client";

import clsx from "clsx";
import useSWR from "swr";
import { ProggaBot } from "@/components/brand/ProggaBot";
import { EmptyState, PageLoader } from "@/components/ui/primitives";
import { paletteFor } from "@/lib/skins";

interface Entry {
  rank: number;
  name: string;
  avatarSkin: string;
  level: number;
  weeklyXp: number;
  isMe: boolean;
}
interface Board {
  band: { label: string };
  weekStart: string;
  entries: Entry[];
  me: Entry | null;
}

const PODIUM = [
  { place: 1, height: "h-36", color: "from-banana-300 to-banana-500", medal: "🥇" },
  { place: 2, height: "h-28", color: "from-[#EEF1F7] to-[#B8C1D6]", medal: "🥈" },
  { place: 3, height: "h-20", color: "from-[#FFD8B0] to-[#F2A65A]", medal: "🥉" },
];

export default function LeaderboardPage() {
  const { data } = useSWR<Board>("/game/leaderboard");
  if (!data) return <PageLoader />;
  const top = data.entries.slice(0, 3);
  const order = [top[1], top[0], top[2]].filter(Boolean) as Entry[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center">
        <p className="eyebrow">Weekly league · {data.band.label}</p>
        <h1 className="mt-1 text-4xl font-extrabold">Leaderboard 👑</h1>
        <p className="mt-1 text-ink-soft">Earn XP by thinking. Resets every Monday. Only first names are shown.</p>
      </div>

      {data.entries.length === 0 ? (
        <EmptyState icon="🏁" title="The race is open!" text="Nobody has earned XP this week yet. Be the first!" />
      ) : (
        <>
          <div className="flex items-end justify-center gap-3 pt-4">
            {order.map((e) => {
              const p = PODIUM[e.rank - 1];
              return (
                <div key={e.rank} className="flex w-28 flex-col items-center sm:w-36">
                  <ProggaBot size={e.rank === 1 ? 90 : 72} palette={paletteFor(e.avatarSkin)} mood={e.rank === 1 ? "happy" : "idle"} />
                  <p className={clsx("mt-1 truncate font-display font-extrabold", e.isMe && "text-grape-600")}>{e.isMe ? "You" : e.name}</p>
                  <p className="text-sm font-bold text-ink-muted">{e.weeklyXp} XP</p>
                  <div className={clsx("mt-2 grid w-full place-items-start justify-center rounded-t-3xl bg-gradient-to-b pt-3 text-4xl", p.height, p.color)}>{p.medal}</div>
                </div>
              );
            })}
          </div>

          <div className="card divide-y divide-line overflow-hidden">
            {data.entries.map((e) => (
              <div key={e.rank} className={clsx("flex items-center gap-4 px-5 py-3", e.isMe && "bg-grape-50")}>
                <span className="w-7 text-center font-display text-lg font-extrabold text-ink-muted">{e.rank}</span>
                <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-cream">
                  <ProggaBot size={36} palette={paletteFor(e.avatarSkin)} float={false} />
                </span>
                <div className="flex-1">
                  <p className="font-display font-bold">{e.isMe ? `${e.name} (you)` : e.name}</p>
                  <p className="text-xs font-semibold text-ink-muted">Level {e.level}</p>
                </div>
                <span className="font-display text-lg font-extrabold text-grape-600">{e.weeklyXp} XP</span>
              </div>
            ))}
          </div>
          {!data.me && <p className="text-center text-sm font-semibold text-ink-muted">Earn some XP this week to join the board! 🚀</p>}
        </>
      )}
    </div>
  );
}
