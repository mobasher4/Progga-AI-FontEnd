"use client";

import clsx from "clsx";
import { Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/i18n";
import { api, errorMessage } from "@/lib/api";
import { type LeagueFamily, type SearchState, isMuted, setMuted, syncClock } from "@/lib/battle";

const ROMAN = ["", "I", "II", "III"];

/** "Silver League II" in the current language. */
export function useLeagueName() {
  const { t, tx } = useT();
  return useCallback(
    (family: LeagueFamily, division: number) => {
      const name = tx(`battle.families.${family}`, family);
      if (family === "unranked") return name;
      if (family === "legend" || !division) return t("battle.leagueName", { family: name, div: "" }).trim();
      return t("battle.leagueName", { family: name, div: ROMAN[division] });
    },
    [t, tx],
  );
}

export function MuteToggle({ className }: { className?: string }) {
  const { t } = useT();
  const [muted, setState] = useState(false);
  useEffect(() => setState(isMuted()), []);
  return (
    <button
      type="button"
      onClick={() => {
        setMuted(!muted);
        setState(!muted);
      }}
      className={clsx("grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20", className)}
      aria-label={muted ? t("battle.soundOff") : t("battle.soundOn")}
      title={muted ? t("battle.soundOff") : t("battle.soundOn")}
    >
      {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
    </button>
  );
}

/**
 * Matchmaking loop: starts a search, polls about once a second, and reports the
 * battle id once a real student or a practice rival is found.
 */
export function useMatchmaking(onMatched: (battleId: string) => void) {
  const [phase, setPhase] = useState<"idle" | "searching" | "error">("idle");
  const [online, setOnline] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // each search gets its own generation, so a cancelled loop can never keep
  // polling (or act on a late reply) after a new search has started
  const gen = useRef(0);
  const alive = useRef(false);
  const ticket = useRef<string | null>(null);
  const matchedRef = useRef(onMatched);
  matchedRef.current = onMatched;

  const cancelTicket = useCallback(async (id: string) => {
    const r = await api<{ battleId: string | null }>(`/battle/search/${id}`, { method: "DELETE" }).catch(() => null);
    // too late to cancel: the battle already started, so take the student there
    if (r?.battleId) matchedRef.current(r.battleId);
  }, []);

  const stop = useCallback(async () => {
    gen.current += 1;
    alive.current = false;
    const id = ticket.current;
    ticket.current = null;
    setPhase("idle");
    // no ticket yet means the start request is still in flight; start() cancels it when it lands
    if (id) await cancelTicket(id);
  }, [cancelTicket]);

  const start = useCallback(async () => {
    if (alive.current) return;
    const my = ++gen.current;
    const current = () => gen.current === my;
    alive.current = true;
    ticket.current = null;
    setError(null);
    setPhase("searching");
    try {
      let sent = Date.now();
      let s = await api<SearchState & { ticketId?: string }>("/battle/search", { method: "POST" });
      syncClock(s.now, sent);
      if (!current()) {
        // cancelled before the server answered: drop the ticket it just made
        if (s.status === "searching" && s.ticketId) await cancelTicket(s.ticketId);
        return;
      }
      if (s.ticketId) ticket.current = s.ticketId;
      for (;;) {
        if (s.status === "matched") {
          alive.current = false;
          ticket.current = null;
          matchedRef.current(s.battleId);
          return;
        }
        if (typeof s.online === "number") setOnline(s.online);
        await new Promise((r) => setTimeout(r, 900));
        if (!current() || !ticket.current) return;
        sent = Date.now();
        s = await api<SearchState>(`/battle/search/${ticket.current}`);
        if (!current()) return; // stop() already sent the cancel and handles a late match
        syncClock(s.now, sent);
      }
    } catch (e) {
      if (!current()) return;
      alive.current = false;
      setError(errorMessage(e));
      setPhase("error");
    }
  }, [cancelTicket]);

  // leaving the page cancels the search
  useEffect(
    () => () => {
      if (alive.current) void stop();
    },
    [stop],
  );

  return { phase, online, error, start, stop };
}
