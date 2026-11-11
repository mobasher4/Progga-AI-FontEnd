// Battle Arena: API shapes, server-clock sync and synthesized sound effects.

export type LeagueFamily = "unranked" | "bronze" | "silver" | "gold" | "crystal" | "master" | "champion" | "titan" | "legend";

export interface League {
  id: string;
  family: LeagueFamily;
  division: 0 | 1 | 2 | 3;
  name: string;
  min: number;
  difficulty: number;
}

export interface ArenaHome {
  grade: number;
  online: number;
  liveBattleId: string | null;
  profile: {
    trophies: number;
    bestTrophies: number;
    wins: number;
    losses: number;
    draws: number;
    streak: number;
    bestStreak: number;
    rank: number;
    league: League;
    next: League | null;
    progress: number;
  };
  leagues: League[];
  leaderboard: { rank: number; name: string; skin: string; level: number; trophies: number; leagueId: string; isMe: boolean }[];
  recent: { id: string; result: "win" | "loss" | "draw" | null; trophyDelta: number; myScore: number; theirScore: number; opponent: string; opponentSkin: string; at: number }[];
}

export type SearchState =
  | { status: "searching"; ticketId?: string; battleId: null; waitedMs?: number; online?: number; now: number }
  | { status: "matched"; battleId: string; now: number };

export interface PlayerCard {
  name: string;
  skin: string;
  level: number;
  trophies: number;
  league: { id: string; family: LeagueFamily; division: 0 | 1 | 2 | 3; name: string };
  score: number;
  answered: number;
  finished: boolean;
}

export interface BattleQuestionView {
  index: number;
  subject: string;
  topic: string;
  topicBn: string;
  prompt: string;
  promptBn: string;
  options: string[];
  optionsBn: string[];
  difficulty: number;
}

export interface BattleResult {
  outcome: "win" | "loss" | "draw";
  tieBreak: boolean;
  myScore: number;
  theirScore: number;
  myMs: number;
  theirMs: number;
  trophyDelta: number;
  trophiesBefore: number;
  trophiesAfter: number;
  leagueBefore: string;
  leagueAfter: string;
  promoted: boolean;
  demoted: boolean;
  xpGained: number;
  correct: number;
  wrong: number;
  review: {
    prompt: string;
    promptBn: string;
    options: string[];
    optionsBn: string[];
    answerIndex: number;
    choice: number;
    explanation: string;
    explanationBn: string;
    subject: string;
  }[];
}

export interface BattleState {
  id: string;
  grade: number;
  difficulty: number;
  status: "live" | "finishing" | "done";
  total: number;
  timeLimitMs: number;
  revealMs: number;
  startsAt: number;
  deadline: number;
  now: number;
  me: PlayerCard & { questionStartedAt: number; marks: (1 | 0 | -1)[] };
  opponent: PlayerCard;
  question: BattleQuestionView | null;
  result: BattleResult | null;
}

export interface AnswerResponse extends BattleState {
  last: {
    index: number;
    choice: number;
    correct: boolean;
    answerIndex: number;
    points: number;
    explanation: string;
    explanationBn: string;
  } | null;
}

/** "1.5" / "-0.5" / "3" — scores move in halves. */
export const fmtScore = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

// ── Server clock ─────────────────────────────────────────
// Every battle response carries the server's `now`. Keeping the smallest seen
// offset (the reply that spent least time in flight) puts both players' clocks
// within a few hundred ms of each other.

let offset: number | null = null;
let bestRtt = Infinity;
export function syncClock(serverNow: number, sentAt: number) {
  const receivedAt = Date.now();
  const rtt = receivedAt - sentAt;
  if (offset !== null && rtt > bestRtt + 60) return; // a slow reply tells us little
  bestRtt = Math.min(bestRtt, rtt);
  offset = serverNow + rtt / 2 - receivedAt;
}
export const serverNow = () => Date.now() + (offset ?? 0);

// ── Sound effects (Web Audio, nothing to download) ───────

const MUTE_KEY = "progga_battle_muted";
let ctx: AudioContext | null = null;

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}
export function setMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // private mode: muting just won't persist
  }
}

function audio(): AudioContext | null {
  if (typeof window === "undefined" || isMuted()) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.18, slideTo?: number) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export const sfx = {
  tap: () => tone(660, 0, 0.08, "triangle", 0.12),
  tick: () => tone(1200, 0, 0.05, "square", 0.05),
  ping: () => tone(880, 0, 0.25, "sine", 0.08, 1320),
  count: () => tone(520, 0, 0.16, "triangle", 0.2),
  go: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.06, 0.25, "triangle", 0.18)),
  found: () => {
    tone(220, 0, 0.35, "sawtooth", 0.08, 880);
    [784, 988, 1175].forEach((f, i) => tone(f, 0.25 + i * 0.09, 0.3, "triangle", 0.16));
  },
  correct: () => [659, 880, 1319].forEach((f, i) => tone(f, i * 0.07, 0.22, "triangle", 0.18)),
  wrong: () => {
    tone(200, 0, 0.28, "sawtooth", 0.12, 120);
    tone(150, 0.12, 0.3, "square", 0.06, 90);
  },
  skip: () => tone(440, 0, 0.18, "sine", 0.1, 330),
  victory: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.12, i === 6 ? 0.7 : 0.2, "triangle", 0.2)),
  defeat: () => [392, 349, 311, 262].forEach((f, i) => tone(f, i * 0.2, 0.35, "triangle", 0.15)),
  promote: () => [523, 784, 1047, 1568].forEach((f, i) => tone(f, i * 0.1, 0.45, "sine", 0.18)),
};
