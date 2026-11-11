"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Crown, Flame, Shield, Swords, Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import useSWR from "swr";
import { LeagueBadge, SwordsIcon, TrophyIcon } from "@/components/battle/art";
import { SearchScreen } from "@/components/battle/SearchScreen";
import { useLeagueName, useMatchmaking } from "@/components/battle/shared";
import { PlayerAvatar } from "@/components/battle/Versus";
import { useCelebrate } from "@/components/celebrate/CelebrationProvider";
import { PageLoader } from "@/components/ui/primitives";
import { useFormat, useT } from "@/i18n";
import { type ArenaHome, fmtScore } from "@/lib/battle";
import { paletteFor } from "@/lib/skins";
import { useMe } from "@/lib/useMe";

export default function BattleArenaPage() {
  return (
    <Suspense fallback={null}>
      <Arena />
    </Suspense>
  );
}

function Arena() {
  const { user } = useMe();
  const { t, n } = useT();
  const { timeAgo } = useFormat();
  const leagueName = useLeagueName();
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useCelebrate();
  const { data, error, isLoading } = useSWR<ArenaHome>(user?.grade ? "/battle/arena" : null, { refreshInterval: 15_000 });
  const mm = useMatchmaking((battleId) => router.push(`/battle/${battleId}`));
  const autoStarted = useRef(false);

  // "Battle again" from a result screen lands here with ?go=1
  useEffect(() => {
    if (data && params.get("go") === "1" && !autoStarted.current && !data.liveBattleId) {
      autoStarted.current = true;
      // drop ?go=1 without a Next navigation (that would remount the page and cancel the search)
      window.history.replaceState(null, "", "/battle");
      void mm.start();
    }
  }, [data, params, mm]);

  useEffect(() => {
    if (mm.phase === "error" && mm.error) toast(mm.error, "⚠️", "coral");
  }, [mm.phase, mm.error, toast]);

  if (user && !user.grade) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <SwordsIcon size={72} className="mx-auto" />
        <p className="mt-4 font-display text-xl font-extrabold">{t("battle.needClass")}</p>
        <Link href="/profile" className="btn-primary mt-5">{t("battle.goProfile")}</Link>
      </div>
    );
  }
  if (isLoading || !data) return error ? <p className="text-center font-bold text-coral-600">{String(error.message ?? error)}</p> : <PageLoader />;

  const p = data.profile;
  const myPalette = user?.skin?.palette ?? paletteFor(user?.avatarSkin);

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {mm.phase === "searching" && (
          <SearchScreen
            grade={data.grade}
            trophies={p.trophies}
            family={p.league.family}
            division={p.league.division}
            palette={myPalette}
            online={mm.online || data.online}
            onCancel={() => void mm.stop()}
          />
        )}
      </AnimatePresence>

      {/* ── Hero ── */}
      <section className="battle-sky relative overflow-hidden rounded-[2rem] p-5 text-white shadow-lift sm:p-8">
        <div className="battle-stars pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-sky-400/25 blur-3xl" />

        <div className="relative flex flex-col items-center gap-6 md:flex-row md:items-center">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} className="relative">
            <span className="absolute inset-0 -z-10 m-auto h-32 w-32 rounded-full bg-banana-300/30 blur-2xl" />
            <LeagueBadge family={p.league.family} division={p.league.division} size={150} glow />
          </motion.div>

          <div className="min-w-0 flex-1 text-center md:text-left">
            <p className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-[0.2em] text-banana-300 md:justify-start">
              <Swords size={14} /> {t("battle.eyebrow")}
            </p>
            <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">{t("battle.title", { n: n(data.grade) })}</h1>
            <p className="mt-1 text-indigo-100/90">{t("battle.subtitle")}</p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <span className="flex items-center gap-2 rounded-2xl bg-black/25 px-4 py-2 backdrop-blur">
                <TrophyIcon size={30} />
                <span className="font-display text-3xl font-black tabular-nums">{n(p.trophies)}</span>
              </span>
              <span className="rounded-2xl bg-white/10 px-3 py-2 font-display font-extrabold">{leagueName(p.league.family, p.league.division)}</span>
            </div>

            <div className="mt-4 max-w-md md:max-w-sm">
              <div className="relative h-4 overflow-hidden rounded-full bg-black/30 ring-1 ring-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-banana-300 via-orange-400 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(3, p.progress * 100)}%` }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                />
                <span className="absolute inset-x-2 top-[3px] h-[3px] rounded-full bg-white/30" />
              </div>
              <p className="mt-1.5 flex items-center justify-center gap-1.5 text-sm font-bold text-indigo-100 md:justify-start">
                {p.next ? (
                  <>
                    <LeagueBadge family={p.next.family} division={p.next.division} size={18} />
                    {t("battle.toNext", { n: n(p.next.min - p.trophies), league: leagueName(p.next.family, p.next.division) })}
                  </>
                ) : (
                  t("battle.topLeague")
                )}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-3 md:w-auto">
            {data.liveBattleId ? (
              <button onClick={() => router.push(`/battle/${data.liveBattleId}`)} className="btn-glossy btn-glossy-green shine w-full px-8 py-5 text-2xl md:w-auto">
                <Swords size={26} strokeWidth={2.6} /> {t("battle.resume")}
              </button>
            ) : (
              <motion.button
                onClick={() => void mm.start()}
                disabled={mm.phase === "searching"}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                animate={{ boxShadow: ["0 6px 0 #b85a00, 0 0 0 0 rgb(255 159 28 / 0.6)", "0 6px 0 #b85a00, 0 0 0 16px rgb(255 159 28 / 0)"] }}
                transition={{ boxShadow: { duration: 1.6, repeat: Infinity } }}
                className="btn-glossy btn-glossy-orange shine w-full px-10 py-5 text-2xl md:w-auto md:text-3xl"
              >
                <SwordsIcon size={40} /> {t("battle.battleNow")}
              </motion.button>
            )}
            <span className="flex items-center gap-2 text-sm font-bold text-indigo-100">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-mint-400" />
              </span>
              <Users size={14} /> {data.online > 0 ? t("battle.online", { n: n(data.online) }) : t("battle.onlineNone")}
            </span>
          </div>
        </div>

        <div className="relative mt-6 flex flex-wrap justify-center gap-2 text-sm font-bold md:justify-start">
          {[t("battle.ruleQuestions"), t("battle.ruleCorrect"), t("battle.ruleWrong"), t("battle.ruleTime"), t("battle.ruleSpeed")].map((r) => (
            <span key={r} className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">{r}</span>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { icon: <span className="text-2xl">🏆</span>, label: t("battle.wins"), value: n(p.wins), tone: "from-mint-400 to-mint-600" },
          { icon: <span className="text-2xl">💔</span>, label: t("battle.losses"), value: n(p.losses), tone: "from-coral-400 to-coral-600" },
          { icon: <Flame className="fill-white" size={24} />, label: t("battle.streak"), value: n(p.streak), tone: "from-orange-400 to-rose-500" },
          { icon: <TrophyIcon size={26} />, label: t("battle.best"), value: n(p.bestTrophies), tone: "from-banana-400 to-orange-500" },
          { icon: <Crown size={24} className="fill-white" />, label: t("battle.rank"), value: `#${n(p.rank)}`, tone: "from-purple-500 to-indigo-600" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className={clsx("relative overflow-hidden rounded-3xl bg-gradient-to-br p-4 text-white shadow-soft", s.tone, i === 4 && "col-span-2 sm:col-span-1")}
          >
            <span className="absolute inset-x-3 top-1.5 h-1/3 rounded-full bg-white/20 blur-[1px]" />
            <div className="relative flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20">{s.icon}</span>
              <div>
                <p className="font-display text-2xl font-black leading-none">{s.value}</p>
                <p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-white/85">{s.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* ── League road ── */}
      <LeagueRoad data={data} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Class leaderboard ── */}
        <section className="card overflow-hidden">
          <div className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-4 text-white">
            <Crown size={22} className="fill-banana-300 text-banana-300" />
            <h2 className="font-display text-xl font-extrabold">{t("battle.leaderboard", { n: n(data.grade) })}</h2>
          </div>
          {data.leaderboard.length === 0 ? (
            <p className="p-6 text-center font-semibold text-ink-muted">{t("battle.leaderboardEmpty")}</p>
          ) : (
            <ol className="divide-y divide-line">
              {data.leaderboard.map((row) => (
                <li key={row.rank} className={clsx("flex items-center gap-3 px-4 py-2.5", row.isMe && "bg-banana-50")}>
                  <span
                    className={clsx(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-full font-display text-sm font-black",
                      row.rank === 1 ? "bg-gradient-to-b from-banana-300 to-banana-500 text-ink" : row.rank === 2 ? "bg-gradient-to-b from-slate-200 to-slate-400 text-ink" : row.rank === 3 ? "bg-gradient-to-b from-orange-300 to-orange-500 text-white" : "bg-cream text-ink-soft",
                    )}
                  >
                    {n(row.rank)}
                  </span>
                  <PlayerAvatar skin={row.skin} size={36} ring="ring-line" />
                  <p className="min-w-0 flex-1 truncate font-display font-bold">
                    {row.name} {row.isMe && <span className="text-xs font-extrabold text-banana-700">({t("battle.youAreHere")})</span>}
                  </p>
                  <LeagueBadge family={row.leagueId.split("-")[0] as ArenaHome["profile"]["league"]["family"]} division={(Number(row.leagueId.split("-")[1]) || 0) as 0 | 1 | 2 | 3} size={26} />
                  <span className="flex w-16 items-center justify-end gap-1 font-display font-extrabold tabular-nums">
                    <TrophyIcon size={16} /> {n(row.trophies)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* ── Recent battles ── */}
        <section className="card overflow-hidden">
          <div className="flex items-center gap-3 bg-gradient-to-r from-sky-500 to-brand-600 px-5 py-4 text-white">
            <Shield size={22} className="fill-white/30" />
            <h2 className="font-display text-xl font-extrabold">{t("battle.recent")}</h2>
          </div>
          {data.recent.length === 0 ? (
            <div className="p-6 text-center">
              <p className="font-semibold text-ink-muted">{t("battle.recentEmpty")}</p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {data.recent.map((b) => (
                <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={clsx(
                      "w-14 shrink-0 rounded-xl py-1 text-center font-display text-xs font-black uppercase text-white",
                      b.result === "win" ? "bg-mint-500" : b.result === "loss" ? "bg-coral-500" : "bg-slate-400",
                    )}
                  >
                    {b.result === "win" ? t("battle.win") : b.result === "loss" ? t("battle.loss") : t("battle.draw")}
                  </span>
                  <PlayerAvatar skin={b.opponentSkin} size={34} ring="ring-line" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display font-bold">{t("battle.vs", { name: b.opponent })}</p>
                    <p className="text-xs font-semibold text-ink-muted">
                      {fmtScore(b.myScore).replace("-", "−")} – {fmtScore(b.theirScore).replace("-", "−")} · {timeAgo(new Date(b.at).toISOString())}
                    </p>
                  </div>
                  <span className={clsx("flex items-center gap-1 font-display font-extrabold tabular-nums", b.trophyDelta > 0 ? "text-mint-600" : b.trophyDelta < 0 ? "text-coral-600" : "text-ink-muted")}>
                    {b.trophyDelta > 0 ? "+" : b.trophyDelta < 0 ? "−" : ""}
                    {n(Math.abs(b.trophyDelta))} <TrophyIcon size={16} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function LeagueRoad({ data }: { data: ArenaHome }) {
  const { t, n } = useT();
  const leagueName = useLeagueName();
  const scroller = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLLIElement>(null);
  const current = data.profile.league.id;
  const currentIndex = data.leagues.findIndex((l) => l.id === current);

  useEffect(() => {
    const el = currentRef.current;
    const box = scroller.current;
    if (el && box) box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [current]);

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5">
        <h2 className="font-display text-xl font-extrabold">{t("battle.leagueRoad")}</h2>
        <p className="text-sm font-semibold text-ink-muted">{t("battle.leagueRoadText")}</p>
      </div>
      <div ref={scroller} className="overflow-x-auto px-5 pb-5 pt-4 [scrollbar-width:thin]">
        <ol className="relative flex min-w-max items-end gap-3">
          <span className="absolute inset-x-6 bottom-[52px] h-1.5 rounded-full bg-line" aria-hidden />
          <span
            className="absolute bottom-[52px] left-6 h-1.5 rounded-full bg-gradient-to-r from-banana-400 to-orange-500"
            style={{ width: `calc(${(currentIndex / Math.max(1, data.leagues.length - 1)) * 100}% - 3rem)` }}
            aria-hidden
          />
          {data.leagues.map((l, i) => {
            const here = l.id === current;
            const reached = i <= currentIndex;
            return (
              <li key={l.id} ref={here ? currentRef : undefined} className={clsx("relative flex w-[92px] flex-col items-center text-center", !reached && "opacity-90")}>
                {here && (
                  <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 1.4, repeat: Infinity }} className="mb-1 rounded-full bg-banana-400 px-2 py-0.5 text-[11px] font-black uppercase text-ink shadow">
                    {t("battle.youAreHere")} <ArrowRight size={10} className="inline rotate-90" />
                  </motion.span>
                )}
                <div className={clsx("grid place-items-center rounded-2xl p-1.5 transition", here && "bg-banana-50 ring-2 ring-banana-400")}>
                  <LeagueBadge family={l.family} division={l.division} size={here ? 62 : 50} glow={here} dim={!reached} />
                </div>
                <span className={clsx("relative z-10 mt-2 h-4 w-4 rounded-full border-[3px] border-white shadow", reached ? "bg-orange-500" : "bg-line")} />
                <p className="mt-1.5 text-[11px] font-extrabold leading-tight text-ink-soft">{leagueName(l.family, l.division)}</p>
                <p className="flex items-center gap-0.5 text-[11px] font-bold text-ink-muted">
                  <TrophyIcon size={11} /> {n(l.min)}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
