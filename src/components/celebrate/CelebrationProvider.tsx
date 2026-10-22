"use client";

import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useSWRConfig } from "swr";
import type { Badge, Rewards } from "@/lib/types";
import { ProggaBot } from "../brand/ProggaBot";
import { Modal } from "../ui/Modal";

interface Toast {
  id: number;
  icon: string;
  text: string;
  tone: "grape" | "banana" | "mint" | "coral";
}

interface Ctx {
  celebrate: (r: Rewards | null | undefined, opts?: { confetti?: boolean }) => void;
  toast: (text: string, icon?: string, tone?: Toast["tone"]) => void;
  burst: () => void;
}

const CelebrationCtx = createContext<Ctx | null>(null);

export function useCelebrate() {
  const ctx = useContext(CelebrationCtx);
  if (!ctx) throw new Error("useCelebrate must be used inside CelebrationProvider");
  return ctx;
}

const TONES: Record<Toast["tone"], string> = {
  grape: "bg-grape-500 text-white",
  banana: "bg-banana-400 text-ink",
  mint: "bg-mint-500 text-white",
  coral: "bg-coral-500 text-white",
};

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const nextId = useRef(1);
  const { mutate } = useSWRConfig();

  const toast = useCallback((text: string, icon = "✨", tone: Toast["tone"] = "grape") => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, icon, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  const burst = useCallback(() => {
    const colors = ["#6C4CF1", "#FFD43B", "#22C493", "#FF6B6B", "#3BA7FF"];
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.7 }, colors, scalar: 1.05 });
    setTimeout(() => confetti({ particleCount: 50, spread: 110, origin: { y: 0.6 }, colors }), 220);
  }, []);

  const celebrate = useCallback<Ctx["celebrate"]>(
    (r, opts) => {
      if (!r) return;
      if (r.xpGained > 0) toast(`+${r.xpGained} XP`, "⭐", "grape");
      if (r.coinsGained > 0) setTimeout(() => toast(`+${r.coinsGained} Kola coins`, "🍌", "banana"), 250);
      if (opts?.confetti || r.leveledUp || r.newBadges.length) burst();
      if (r.leveledUp) setLevelUp(r.level);
      if (r.newBadges.length) setBadges((b) => [...b, ...r.newBadges]);
      // refresh header stats + home
      void mutate("/auth/me");
      void mutate("/me/dashboard");
      void mutate("/game/quests");
    },
    [toast, burst, mutate],
  );

  const badge = badges[0];

  return (
    <CelebrationCtx.Provider value={{ celebrate, toast, burst }}>
      {children}

      <div className="pointer-events-none fixed right-4 top-20 z-[60] flex flex-col items-end gap-2" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 font-display text-lg font-extrabold shadow-lift ${TONES[t.tone]}`}
            >
              <span className="text-xl">{t.icon}</span>
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal open={levelUp !== null} onClose={() => setLevelUp(null)}>
        <div className="flex flex-col items-center text-center">
          <ProggaBot mood="cheer" size={150} />
          <p className="eyebrow mt-2">Level up!</p>
          <h2 className="mt-1 text-4xl font-extrabold">You reached level {levelUp}</h2>
          <p className="mt-2 text-ink-soft">Your brain is getting stronger every day. Keep going! 🚀</p>
          <button className="btn-primary mt-6 w-full" onClick={() => setLevelUp(null)}>
            Awesome!
          </button>
        </div>
      </Modal>

      <Modal open={!!badge && levelUp === null} onClose={() => setBadges((b) => b.slice(1))}>
        {badge && (
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 14 }}
              className="grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-banana-200 to-banana-400 text-6xl shadow-lift ring-8 ring-banana-100"
            >
              {badge.icon}
            </motion.div>
            <p className="eyebrow mt-5">New badge unlocked</p>
            <h2 className="mt-1 text-3xl font-extrabold">{badge.name}</h2>
            <p className="mt-2 text-ink-soft">{badge.description}</p>
            <button className="btn-banana mt-6 w-full" onClick={() => setBadges((b) => b.slice(1))}>
              Collect badge
            </button>
          </div>
        )}
      </Modal>
    </CelebrationCtx.Provider>
  );
}
