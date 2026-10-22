// Shapes returned by the Progga API.

export type Role = "STUDENT" | "PARENT" | "TEACHER" | "ADMIN";
export type Language = "en" | "bn" | "mix";

export interface Palette {
  body: string;
  accent: string;
  visor: string;
  eye: string;
  cheek: string;
}

export interface Skin {
  id: string;
  name: string;
  cost: number;
  palette: Palette;
  owned?: boolean;
}

export interface LevelInfo {
  level: number;
  title: string;
  xp: number;
  levelStartXp: number;
  nextLevelXp: number;
  progress: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  grade: number | null;
  language: Language;
  avatarSkin?: string;
  skin?: Skin;
  coins?: number;
  streak?: number;
  bestStreak?: number;
  linkCode?: string;
  dailyTutorLimit?: number;
  level?: LevelInfo;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold";
  earnedAt?: string | null;
}

export interface Rewards {
  xpGained: number;
  coinsGained: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
  streak: number;
  newBadges: Badge[];
}

export interface Quest {
  id: string;
  title: string;
  icon: string;
  target: number;
  progress: number;
  complete: boolean;
  claimed: boolean;
  rewardXp: number;
  rewardCoins: number;
  category: string;
}

export interface Subject {
  id: string;
  name: string;
  nameBn: string;
  icon: string;
  color: string;
  minGrade: number;
  maxGrade: number;
}

// ── Tutor ──
export type StepState = "done" | "revealed" | "current" | "locked";

export interface TutorStep {
  index: number;
  goal: string | null;
  state: StepState;
  hintsShown: number;
  hintsTotal: number;
}

export type MsgKind = "text" | "question" | "hint" | "teach" | "feedback" | "why" | "celebrate" | "recap" | "reveal" | "safety" | "answer";
export type TutorMode = "problem" | "concept" | "fact";

export interface TutorMessage {
  id: string;
  role: "student" | "tutor";
  kind: MsgKind;
  content: string;
  stepIndex: number | null;
  meta: Record<string, unknown>;
  createdAt: string;
}

export interface TutorSession {
  id: string;
  title: string;
  topic: string;
  subject: string;
  grade: number;
  mode: TutorMode;
  status: "active" | "solved" | "abandoned";
  problemText: string;
  hadImage: boolean;
  currentStep: number;
  totalSteps: number;
  hintsUsed: number;
  xpEarned: number;
  canRevealStep: boolean;
  bigIdea: string | null;
  steps: TutorStep[];
  messages: TutorMessage[];
  createdAt: string;
}

export interface SessionSummary {
  id: string;
  title: string;
  subject: string;
  topic: string;
  status: TutorSession["status"];
  mode: TutorSession["mode"];
  currentStep: number;
  totalSteps: number;
  xpEarned: number;
  updatedAt: string;
}

export interface TutorActionResult {
  session: TutorSession;
  newMessages: TutorMessage[];
  rewards: Rewards | null;
}

export type StartResult =
  | { blocked: false; session: TutorSession }
  | { blocked: true; category: string; message: string };

// ── Lessons ──
export interface LessonCard {
  id: string;
  title: string;
  chapter: string;
  grade: number;
  durationSec: number;
  xpReward: number;
  thumbnail: string | null;
  subject: Pick<Subject, "id" | "name" | "icon" | "color">;
  progress?: number;
  completed?: boolean;
}

export interface Checkpoint {
  index: number;
  atSec: number;
  question: string;
  options: string[];
  answered: boolean;
}

export interface LessonDetail extends LessonCard {
  description: string;
  provider: "youtube" | "mp4";
  videoUrl: string;
  checkpoints: Checkpoint[];
}

// ── Quiz ──
export interface QuizQuestion {
  id: string;
  topic: string;
  prompt: string;
  options: string[];
  difficulty: number;
}

export interface QuizAttempt {
  id: string;
  subjectId: string;
  total: number;
  answered: number;
  correctCount: number;
  score: number;
  combo: number;
  bestCombo: number;
  hearts: number;
  finished: boolean;
}

// ── Dashboard ──
export interface Dashboard {
  user: User;
  quests: Quest[];
  recentSessions: SessionSummary[];
  continueLessons: LessonCard[];
  recommendedLessons: LessonCard[];
  badgeCount: number;
  subjects: Subject[];
}
