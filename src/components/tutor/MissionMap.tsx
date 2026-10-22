"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { Check, Eye, Lock, Flag } from "lucide-react";
import type { TutorSession } from "@/lib/types";

/** The student's path through the micro-steps. Future goals stay locked so the method isn't spoiled. */
export function MissionMap({ session }: { session: TutorSession }) {
  const solved = session.status === "solved";
  return (
    <ol className="relative space-y-1">
      {session.steps.map((s, i) => {
        const last = i === session.steps.length - 1;
        return (
          <li key={s.index} className="relative flex gap-3 pb-3">
            {!last && (
              <span
                className={clsx(
                  "absolute left-[17px] top-10 h-[calc(100%-28px)] w-1 rounded-full",
                  s.state === "done" || s.state === "revealed" ? "bg-mint-300" : "bg-line",
                )}
              />
            )}
            <span
              className={clsx(
                "relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border-[3px] font-display text-sm font-extrabold",
                s.state === "done" && "border-mint-500 bg-mint-500 text-white",
                s.state === "revealed" && "border-sky-400 bg-sky-400 text-white",
                s.state === "current" && "border-grape-500 bg-white text-grape-600",
                s.state === "locked" && "border-line bg-cream text-ink-muted",
              )}
            >
              {s.state === "done" ? <Check size={17} strokeWidth={3.5} /> : s.state === "revealed" ? <Eye size={16} /> : s.state === "locked" ? <Lock size={14} /> : i + 1}
              {s.state === "current" && (
                <motion.span
                  className="absolute inset-[-6px] rounded-full border-2 border-grape-300"
                  animate={{ scale: [1, 1.18, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
              )}
            </span>
            <div className="min-w-0 pt-1">
              <p className={clsx("font-display font-bold leading-tight", s.state === "locked" ? "text-ink-muted" : "text-ink")}>
                {s.goal ?? "Secret step"}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-ink-muted">
                {s.state === "done" && (s.hintsShown ? `Solved with ${s.hintsShown} hint${s.hintsShown > 1 ? "s" : ""}` : "Solved on your own ⭐")}
                {s.state === "revealed" && "Shown by Progga"}
                {s.state === "current" && `Your turn · ${s.hintsTotal - s.hintsShown} hints left`}
                {s.state === "locked" && "Unlocks soon"}
              </p>
            </div>
          </li>
        );
      })}
      <li className="flex items-center gap-3">
        <span className={clsx("grid h-9 w-9 place-items-center rounded-full", solved ? "bg-banana-400 text-ink" : "bg-cream text-ink-muted")}>
          <Flag size={16} />
        </span>
        <p className={clsx("font-display font-bold", solved ? "text-ink" : "text-ink-muted")}>{solved ? "Solved! 🎉" : "Finish line"}</p>
      </li>
    </ol>
  );
}
