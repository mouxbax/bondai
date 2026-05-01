"use client";

/**
 * Practice exercise system — Duolingo-style weekly shuffled exercises.
 * Each week generates a fresh set from the exercise pool.
 * Completion awards XP and tracks weekly progress.
 */

export type ExerciseCategory = "mindset" | "productivity" | "social" | "wellness";
export type ExerciseType = "reflection" | "challenge" | "breathing" | "roleplay";

export interface Exercise {
  id: string;
  title: string;
  description: string;
  category: ExerciseCategory;
  type: ExerciseType;
  xp: number;
  minutes: number;
  /** For reflection exercises — the prompt to answer */
  prompt?: string;
  /** For challenge exercises — what to do */
  challenge?: string;
  /** For roleplay — scenario ID to link to coaching */
  scenarioId?: string;
}

const EXERCISE_POOL: Exercise[] = [
  // ─── Mindset ──────────────────────────────
  {
    id: "mindset-gratitude",
    title: "Gratitude check",
    description: "Name 3 things you're grateful for right now.",
    category: "mindset",
    type: "reflection",
    xp: 15,
    minutes: 2,
    prompt: "What are 3 things — big or small — that you're grateful for today?",
  },
  {
    id: "mindset-reframe",
    title: "Reframe a negative thought",
    description: "Take a worry and find a more balanced perspective.",
    category: "mindset",
    type: "reflection",
    xp: 20,
    minutes: 3,
    prompt: "What's one thing stressing you out? Now write a more balanced, realistic way to look at it.",
  },
  {
    id: "mindset-values",
    title: "Values check-in",
    description: "Are your actions aligned with what matters most?",
    category: "mindset",
    type: "reflection",
    xp: 20,
    minutes: 3,
    prompt: "Name your top 3 values. Did your actions this week reflect them? What's one adjustment?",
  },
  {
    id: "mindset-affirmation",
    title: "Power statement",
    description: "Write an affirmation that feels true and energizing.",
    category: "mindset",
    type: "reflection",
    xp: 10,
    minutes: 2,
    prompt: "Write a one-sentence statement about yourself that's both honest and empowering.",
  },
  {
    id: "mindset-fear",
    title: "Face a fear",
    description: "Identify one thing you've been avoiding and why.",
    category: "mindset",
    type: "reflection",
    xp: 25,
    minutes: 3,
    prompt: "What's one thing you've been avoiding? What's the worst that could happen? What's the most likely outcome?",
  },

  // ─── Productivity ─────────────────────────
  {
    id: "prod-priority",
    title: "Top 3 priorities",
    description: "Define the 3 most important things for today.",
    category: "productivity",
    type: "challenge",
    xp: 15,
    minutes: 2,
    challenge: "Write down your top 3 priorities for today. Not 5, not 10 — just 3.",
  },
  {
    id: "prod-timeblock",
    title: "Time block challenge",
    description: "Plan your next 4 hours in 30-min blocks.",
    category: "productivity",
    type: "challenge",
    xp: 20,
    minutes: 3,
    challenge: "Block your next 4 hours into 30-minute chunks. Include breaks. Be realistic.",
  },
  {
    id: "prod-eliminate",
    title: "Kill a task",
    description: "Remove one thing from your to-do list that doesn't matter.",
    category: "productivity",
    type: "challenge",
    xp: 15,
    minutes: 1,
    challenge: "Look at your to-do list. Delete or defer one task that won't matter in a week.",
  },
  {
    id: "prod-2min",
    title: "2-minute wins",
    description: "Do 3 tasks that take less than 2 minutes each.",
    category: "productivity",
    type: "challenge",
    xp: 20,
    minutes: 6,
    challenge: "Do 3 things right now that take under 2 minutes. Reply to that message, clean that surface, file that doc.",
  },
  {
    id: "prod-review",
    title: "Weekly review",
    description: "Reflect on what worked and what didn't this week.",
    category: "productivity",
    type: "reflection",
    xp: 25,
    minutes: 5,
    prompt: "What went well this week? What didn't? What's one thing you'll do differently next week?",
  },

  // ─── Social ───────────────────────────────
  {
    id: "social-reach",
    title: "Reach out",
    description: "Send a message to someone you haven't talked to in a while.",
    category: "social",
    type: "challenge",
    xp: 20,
    minutes: 2,
    challenge: "Send a genuine message to someone you haven't contacted in over 2 weeks. No agenda, just connect.",
  },
  {
    id: "social-compliment",
    title: "Give a compliment",
    description: "Genuinely compliment someone today.",
    category: "social",
    type: "challenge",
    xp: 10,
    minutes: 1,
    challenge: "Give a specific, genuine compliment to someone today. Not 'nice job' — tell them exactly what impressed you.",
  },
  {
    id: "social-listen",
    title: "Active listening",
    description: "In your next conversation, only ask questions.",
    category: "social",
    type: "challenge",
    xp: 20,
    minutes: 5,
    challenge: "In your next conversation, try to only ask follow-up questions. No advice, no stories about yourself.",
  },
  {
    id: "social-boundary",
    title: "Practice saying no",
    description: "Role-play declining a request politely.",
    category: "social",
    type: "roleplay",
    xp: 25,
    minutes: 8,
    scenarioId: "boundary",
  },
  {
    id: "social-negotiate",
    title: "Practice negotiating",
    description: "Rehearse presenting your value confidently.",
    category: "social",
    type: "roleplay",
    xp: 30,
    minutes: 12,
    scenarioId: "salary-negotiation",
  },

  // ─── Wellness ─────────────────────────────
  {
    id: "wellness-breathe",
    title: "Box breathing",
    description: "4 seconds in, hold, out, hold. 3 rounds.",
    category: "wellness",
    type: "breathing",
    xp: 15,
    minutes: 3,
  },
  {
    id: "wellness-bodyscan",
    title: "Quick body scan",
    description: "Notice tension from head to toes and release it.",
    category: "wellness",
    type: "reflection",
    xp: 15,
    minutes: 3,
    prompt: "Close your eyes. Scan from head to toes. Where do you feel tension? Take 3 deep breaths and relax those areas.",
  },
  {
    id: "wellness-hydrate",
    title: "Hydration check",
    description: "Drink a full glass of water right now.",
    category: "wellness",
    type: "challenge",
    xp: 5,
    minutes: 1,
    challenge: "Go drink a full glass of water. Right now. Your body will thank you.",
  },
  {
    id: "wellness-move",
    title: "Movement break",
    description: "Stand up and stretch for 2 minutes.",
    category: "wellness",
    type: "challenge",
    xp: 10,
    minutes: 2,
    challenge: "Stand up. Stretch your arms overhead. Roll your neck. Touch your toes. Move for 2 minutes.",
  },
  {
    id: "wellness-sleep",
    title: "Sleep intention",
    description: "Set a specific bedtime for tonight.",
    category: "wellness",
    type: "challenge",
    xp: 10,
    minutes: 1,
    challenge: "Pick your bedtime for tonight. Set a phone alarm 30 min before as a wind-down reminder.",
  },
];

// ─── Weekly shuffle logic ────────────────────────────────────────

const KEY_WEEKLY = "aiah-practice-weekly";
const KEY_COMPLETED = "aiah-practice-completed";

interface WeeklyState {
  weekId: string; // ISO week identifier e.g. "2026-W18"
  exerciseIds: string[];
}

function getCurrentWeekId(): string {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
  const weekNum = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function seededShuffle<T>(arr: T[], seed: string): T[] {
  const result = [...arr];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  for (let i = result.length - 1; i > 0; i--) {
    hash = ((hash << 5) - hash + i) | 0;
    const j = Math.abs(hash) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function read<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const s = localStorage.getItem(k);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(k: string, v: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch { /* */ }
}

/**
 * Get this week's exercises (7 exercises, shuffled deterministically per week).
 * One from each category + 3 bonus from the full pool.
 */
export function getWeeklyExercises(): Exercise[] {
  const weekId = getCurrentWeekId();
  const existing = read<WeeklyState | null>(KEY_WEEKLY, null);

  if (existing && existing.weekId === weekId) {
    return existing.exerciseIds
      .map((id) => EXERCISE_POOL.find((e) => e.id === id))
      .filter((e): e is Exercise => !!e);
  }

  // Generate new weekly set
  const shuffled = seededShuffle(EXERCISE_POOL, weekId);

  // Pick 1 from each category first
  const categories: ExerciseCategory[] = ["mindset", "productivity", "social", "wellness"];
  const picked: Exercise[] = [];
  const usedIds = new Set<string>();

  for (const cat of categories) {
    const ex = shuffled.find((e) => e.category === cat && !usedIds.has(e.id));
    if (ex) {
      picked.push(ex);
      usedIds.add(ex.id);
    }
  }

  // Fill to 7 with remaining shuffled
  for (const ex of shuffled) {
    if (picked.length >= 7) break;
    if (!usedIds.has(ex.id)) {
      picked.push(ex);
      usedIds.add(ex.id);
    }
  }

  const state: WeeklyState = { weekId, exerciseIds: picked.map((e) => e.id) };
  write(KEY_WEEKLY, state);

  return picked;
}

/** Get completed exercise IDs for this week */
export function getCompletedExercises(): Set<string> {
  const weekId = getCurrentWeekId();
  const data = read<{ weekId: string; ids: string[] } | null>(KEY_COMPLETED, null);
  if (!data || data.weekId !== weekId) return new Set();
  return new Set(data.ids);
}

/** Mark an exercise as completed this week */
export function markExerciseCompleted(exerciseId: string): void {
  const weekId = getCurrentWeekId();
  const data = read<{ weekId: string; ids: string[] } | null>(KEY_COMPLETED, null);
  const ids = data && data.weekId === weekId ? data.ids : [];
  if (!ids.includes(exerciseId)) {
    ids.push(exerciseId);
  }
  write(KEY_COMPLETED, { weekId, ids });
}

/** Get exercise by ID */
export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISE_POOL.find((e) => e.id === id);
}

/** Category metadata */
export const CATEGORY_META: Record<ExerciseCategory, { label: string; emoji: string; color: string }> = {
  mindset: { label: "Mindset", emoji: "🧠", color: "violet" },
  productivity: { label: "Productivity", emoji: "🎯", color: "blue" },
  social: { label: "Social", emoji: "🤝", color: "amber" },
  wellness: { label: "Wellness", emoji: "🌿", color: "emerald" },
};
