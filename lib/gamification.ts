"use client";

/**
 * Gamification core - XP, levels, life score, achievements.
 * All persisted to localStorage for zero-friction iteration.
 */

export type XPEvent =
  | "habit_complete"
  | "mood_log"
  | "focus_complete"
  | "person_contacted"
  | "daily_checkin"
  | "quest_complete"
  | "streak_milestone"
  | "goal_complete";

export const XP_VALUES: Record<XPEvent, number> = {
  habit_complete: 15,
  mood_log: 10,
  focus_complete: 12,
  person_contacted: 20,
  daily_checkin: 25,
  quest_complete: 30,
  streak_milestone: 50,
  goal_complete: 100,
};

const KEY_XP = "aiah-xp";
const KEY_EVENTS = "aiah-xp-events";
const KEY_ACH = "aiah-achievements";

export interface XPState {
  total: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number; // 0..1
}

export interface XPEventLog {
  id: string;
  type: XPEvent;
  amount: number;
  at: string;
  note?: string;
}

// Level curve: level N needs 100 * 1.25^(N-1) XP cumulative per level
export function xpToLevel(totalXp: number): XPState {
  let level = 1;
  let xpNeededForLevel = 100;
  let remaining = totalXp;
  while (remaining >= xpNeededForLevel) {
    remaining -= xpNeededForLevel;
    level += 1;
    xpNeededForLevel = Math.floor(100 * Math.pow(1.25, level - 1));
  }
  return {
    total: totalXp,
    level,
    currentLevelXp: remaining,
    nextLevelXp: xpNeededForLevel,
    progress: remaining / xpNeededForLevel,
  };
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

function write<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

export function getXPState(): XPState {
  const total = read<number>(KEY_XP, 0);
  return xpToLevel(total);
}

export function getXPEvents(): XPEventLog[] {
  return read<XPEventLog[]>(KEY_EVENTS, []);
}

/**
 * Award XP. Returns { state, leveledUp } for celebration triggers.
 */
export function awardXP(type: XPEvent, note?: string): { state: XPState; leveledUp: boolean; gained: number } {
  const amount = XP_VALUES[type];
  const before = getXPState();
  const newTotal = before.total + amount;
  write(KEY_XP, newTotal);

  const events = getXPEvents();
  events.unshift({
    id: crypto.randomUUID(),
    type,
    amount,
    at: new Date().toISOString(),
    note,
  });
  write(KEY_EVENTS, events.slice(0, 200));

  const after = xpToLevel(newTotal);
  return { state: after, leveledUp: after.level > before.level, gained: amount };
}

// ============ LIFE SCORE ============
// Aggregate 0..100 score from all life data

export interface LifeScore {
  total: number; // 0..100
  dimensions: {
    habits: number;
    mood: number;
    focus: number;
    people: number;
  };
}

export function computeLifeScore(): LifeScore {
  if (typeof window === "undefined") {
    return { total: 0, dimensions: { habits: 0, mood: 0, focus: 0, people: 0 } };
  }

  const habits = read<Array<{ streak: number; lastDone?: string }>>("aiah-habits", []);
  const mood = read<Array<{ mood: string; at: string }>>("aiah-mood-log", []);
  const focus = read<Array<{ done: boolean; createdAt: string }>>("aiah-focus-tasks", []);
  const relationships = read<Array<{ lastContact?: string; reminderDays: number }>>(
    "aiah-relationships",
    [],
  );

  // HABITS: avg streak, capped at 30 = 100%
  const avgStreak =
    habits.length > 0 ? habits.reduce((s, h) => s + h.streak, 0) / habits.length : 0;
  const habitsScore = Math.min(100, (avgStreak / 30) * 100);

  // MOOD: based on recent positive entries (last 7 days)
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentMood = mood.filter((m) => new Date(m.at).getTime() > weekAgo);
  const positiveMoods = ["calm", "happy", "focused", "energetic"];
  const positiveRatio =
    recentMood.length > 0
      ? recentMood.filter((m) => positiveMoods.includes(m.mood)).length / recentMood.length
      : 0.5;
  const logFreqBoost = Math.min(1, recentMood.length / 7);
  const moodScore = Math.round((positiveRatio * 70 + logFreqBoost * 30));

  // FOCUS: today completion rate
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = focus.filter((f) => f.createdAt.slice(0, 10) === today);
  const focusScore =
    todayTasks.length > 0
      ? (todayTasks.filter((t) => t.done).length / todayTasks.length) * 100
      : 50;

  // PEOPLE: % not overdue
  const peopleScore =
    relationships.length > 0
      ? (relationships.filter((p) => {
          if (!p.lastContact) return false;
          const d = (Date.now() - new Date(p.lastContact).getTime()) / (1000 * 60 * 60 * 24);
          return d < p.reminderDays;
        }).length /
          relationships.length) *
        100
      : 50;

  const total = Math.round((habitsScore + moodScore + focusScore + peopleScore) / 4);

  return {
    total,
    dimensions: {
      habits: Math.round(habitsScore),
      mood: Math.round(moodScore),
      focus: Math.round(focusScore),
      people: Math.round(peopleScore),
    },
  };
}

// ============ ACHIEVEMENTS ============

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlockedAt?: string;
  category: "habits" | "mood" | "social" | "focus" | "level" | "special";
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_habit", name: "First Ritual", description: "Create your first habit", emoji: "🌱", category: "habits" },
  { id: "streak_7", name: "Week Warrior", description: "7-day streak on any habit", emoji: "🔥", category: "habits" },
  { id: "streak_30", name: "Unstoppable", description: "30-day streak on any habit", emoji: "💎", category: "habits" },
  { id: "streak_100", name: "Legend", description: "100-day streak on any habit", emoji: "👑", category: "habits" },
  { id: "five_habits", name: "Ritual Keeper", description: "Track 5 habits at once", emoji: "✨", category: "habits" },
  { id: "first_mood", name: "Self-Aware", description: "Log your first mood", emoji: "🧠", category: "mood" },
  { id: "mood_week", name: "Tuned In", description: "Log mood 7 days in a row", emoji: "🎯", category: "mood" },
  { id: "mood_30", name: "Deeply Known", description: "30 mood entries total", emoji: "💫", category: "mood" },
  { id: "first_person", name: "Connector", description: "Add your first person", emoji: "🤝", category: "social" },
  { id: "five_people", name: "Inner Circle", description: "Track 5 people", emoji: "🫂", category: "social" },
  { id: "ten_contacts", name: "Ever-Present", description: "Mark 10 contacts as done", emoji: "💗", category: "social" },
  { id: "focus_10", name: "Getting It Done", description: "Complete 10 focus tasks", emoji: "✅", category: "focus" },
  { id: "focus_50", name: "Machine", description: "Complete 50 focus tasks", emoji: "⚡", category: "focus" },
  { id: "level_5", name: "Rising", description: "Reach level 5", emoji: "🌟", category: "level" },
  { id: "level_10", name: "Ascending", description: "Reach level 10", emoji: "🚀", category: "level" },
  { id: "level_25", name: "Transcendent", description: "Reach level 25", emoji: "🌌", category: "level" },
  { id: "quest_master", name: "Quest Master", description: "Complete 10 daily quests", emoji: "🏆", category: "special" },
  { id: "early_bird", name: "Early Bird", description: "Log before 7am", emoji: "🐦", category: "special" },
  { id: "night_owl", name: "Night Owl", description: "Log after 11pm", emoji: "🦉", category: "special" },
  { id: "full_spectrum", name: "Full Spectrum", description: "Log every mood type at least once", emoji: "🌈", category: "mood" },
];

export function getUnlockedAchievements(): Achievement[] {
  const unlocked = read<Record<string, string>>(KEY_ACH, {});
  return ACHIEVEMENTS.map((a) => (unlocked[a.id] ? { ...a, unlockedAt: unlocked[a.id] } : a));
}

export function checkAchievements(): Achievement[] {
  if (typeof window === "undefined") return [];
  const unlocked = read<Record<string, string>>(KEY_ACH, {});
  const now = new Date().toISOString();
  const newlyUnlocked: Achievement[] = [];

  const unlock = (id: string) => {
    if (!unlocked[id]) {
      unlocked[id] = now;
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (a) newlyUnlocked.push({ ...a, unlockedAt: now });
    }
  };

  const habits = read<Array<{ streak: number }>>("aiah-habits", []);
  const mood = read<Array<{ mood: string; at: string }>>("aiah-mood-log", []);
  const people = read<unknown[]>("aiah-relationships", []);
  const focus = read<Array<{ done: boolean }>>("aiah-focus-tasks", []);
  const events = getXPEvents();
  const state = getXPState();

  if (habits.length >= 1) unlock("first_habit");
  if (habits.length >= 5) unlock("five_habits");
  if (habits.some((h) => h.streak >= 7)) unlock("streak_7");
  if (habits.some((h) => h.streak >= 30)) unlock("streak_30");
  if (habits.some((h) => h.streak >= 100)) unlock("streak_100");

  if (mood.length >= 1) unlock("first_mood");
  if (mood.length >= 30) unlock("mood_30");
  const uniqueMoods = new Set(mood.map((m) => m.mood));
  if (uniqueMoods.size >= 7) unlock("full_spectrum");

  if (people.length >= 1) unlock("first_person");
  if (people.length >= 5) unlock("five_people");
  const contactEvents = events.filter((e) => e.type === "person_contacted");
  if (contactEvents.length >= 10) unlock("ten_contacts");

  const completedFocus = focus.filter((f) => f.done).length;
  if (completedFocus >= 10) unlock("focus_10");
  if (completedFocus >= 50) unlock("focus_50");

  if (state.level >= 5) unlock("level_5");
  if (state.level >= 10) unlock("level_10");
  if (state.level >= 25) unlock("level_25");

  const questEvents = events.filter((e) => e.type === "quest_complete");
  if (questEvents.length >= 10) unlock("quest_master");

  const h = new Date().getHours();
  if (h < 7) unlock("early_bird");
  if (h >= 23) unlock("night_owl");

  write(KEY_ACH, unlocked);
  return newlyUnlocked;
}
