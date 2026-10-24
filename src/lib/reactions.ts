import type { BotMood } from "@/components/brand/ProggaBot";
import LINES from "./reaction-lines.json";
import type { TutorMessage } from "./types";

// Progga's little spoken reactions ("Mm-hmm!", "Hmm…", "Wow!"). The text and the
// recorded clip (public/sounds/reactions, made by scripts/make-reaction-sounds.mjs)
// share an index, so what Progga says always matches its speech bubble.

export type ReactionKey = keyof typeof LINES;

export interface Reaction {
  key: ReactionKey;
  text: string;
  mood: BotMood;
  sound: string;
}

const MOOD: Record<ReactionKey, BotMood> = {
  ack: "happy",
  thinking: "thinking",
  correct: "cheer",
  partial: "talking",
  incorrect: "oops",
  noWorries: "happy",
  solved: "cheer",
};

export function pickReaction(key: ReactionKey, lang: "en" | "bn"): Reaction {
  const options = LINES[key][lang];
  const i = Math.floor(Math.random() * options.length);
  return { key, text: options[i], mood: MOOD[key], sound: `/sounds/reactions/${lang}/${key}-${i}.mp3` };
}

/** How Progga reacts out loud to its own newest messages (null = no reaction). */
export function reactionKeyFor(fresh: TutorMessage[]): ReactionKey | null {
  if (fresh.some((m) => m.kind === "celebrate")) return "solved";
  const verdict = fresh.find((m) => m.kind === "feedback")?.meta.verdict;
  if (verdict === "correct") return "correct";
  if (verdict === "partial") return "partial";
  if (verdict === "incorrect") return "incorrect";
  if (verdict === "stuck" || verdict === "asks_for_answer" || fresh.some((m) => m.kind === "teach")) return "noWorries";
  return null;
}
