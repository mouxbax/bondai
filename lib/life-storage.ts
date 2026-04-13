"use client";

/* Lightweight client-side storage for life modules.
 * Will migrate to Supabase once schema is stable.
 */

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  streak: number;
  lastDone?: string; // ISO date
  color: string;
  createdAt: string;
}

export interface MoodEntry {
  id: string;
  mood: string;
  note?: string;
  at: string;
}

export interface Relationship {
  id: string;
  name: string;
  role: string; // friend, family, colleague, partner, etc.
  lastContact?: string; // ISO date
  reminderDays: number; // suggest contact every N days
  notes?: string;
  emoji?: string;
}

export interface FocusTask {
  id: string;
  title: string;
  done: boolean;
  priority: "low" | "med" | "high";
  createdAt: string;
}

/* Generic helpers */
function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

/* Habits */
const HABITS_KEY = "aiah-habits";

export function getHabits(): Habit[] {
  return read<Habit[]>(HABITS_KEY, []);
}

export function addHabit(name: string, emoji = "✨", color = "#1D9E75"): Habit {
  const habits = getHabits();
  const h: Habit = {
    id: uid(),
    name,
    emoji,
    streak: 0,
    color,
    createdAt: new Date().toISOString(),
  };
  habits.push(h);
  write(HABITS_KEY, habits);
  return h;
}

export function completeHabit(id: string): Habit[] {
  const habits = getHabits();
  const today = new Date().toISOString().slice(0, 10);
  const updated = habits.map((h) => {
    if (h.id !== id) return h;
    if (h.lastDone === today) return h;
    // yesterday?
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterday = y.toISOString().slice(0, 10);
    const newStreak = h.lastDone === yesterday ? h.streak + 1 : 1;
    return { ...h, streak: newStreak, lastDone: today };
  });
  write(HABITS_KEY, updated);
  return updated;
}

export function deleteHabit(id: string): Habit[] {
  const updated = getHabits().filter((h) => h.id !== id);
  write(HABITS_KEY, updated);
  return updated;
}

/* Mood Journal */
const MOOD_LOG_KEY = "aiah-mood-log";

export function getMoodEntries(): MoodEntry[] {
  return read<MoodEntry[]>(MOOD_LOG_KEY, []);
}

export function addMoodEntry(mood: string, note?: string): MoodEntry {
  const entries = getMoodEntries();
  const e: MoodEntry = {
    id: uid(),
    mood,
    note,
    at: new Date().toISOString(),
  };
  entries.push(e);
  write(MOOD_LOG_KEY, entries.slice(-200));
  return e;
}

/* Relationships */
const RELATIONSHIPS_KEY = "aiah-relationships";

export function getRelationships(): Relationship[] {
  return read<Relationship[]>(RELATIONSHIPS_KEY, []);
}

export function addRelationship(input: Omit<Relationship, "id">): Relationship {
  const list = getRelationships();
  const r: Relationship = { ...input, id: uid() };
  list.push(r);
  write(RELATIONSHIPS_KEY, list);
  return r;
}

export function updateRelationship(id: string, patch: Partial<Relationship>): Relationship[] {
  const list = getRelationships().map((r) => (r.id === id ? { ...r, ...patch } : r));
  write(RELATIONSHIPS_KEY, list);
  return list;
}

export function deleteRelationship(id: string): Relationship[] {
  const list = getRelationships().filter((r) => r.id !== id);
  write(RELATIONSHIPS_KEY, list);
  return list;
}

export function markContacted(id: string): Relationship[] {
  return updateRelationship(id, { lastContact: new Date().toISOString() });
}

/* Focus tasks */
const FOCUS_KEY = "aiah-focus";

export function getFocusTasks(): FocusTask[] {
  return read<FocusTask[]>(FOCUS_KEY, []);
}

export function addFocusTask(title: string, priority: FocusTask["priority"] = "med"): FocusTask {
  const list = getFocusTasks();
  const t: FocusTask = {
    id: uid(),
    title,
    done: false,
    priority,
    createdAt: new Date().toISOString(),
  };
  list.push(t);
  write(FOCUS_KEY, list);
  return t;
}

export function toggleFocusTask(id: string): FocusTask[] {
  const list = getFocusTasks().map((t) => (t.id === id ? { ...t, done: !t.done } : t));
  write(FOCUS_KEY, list);
  return list;
}

export function deleteFocusTask(id: string): FocusTask[] {
  const list = getFocusTasks().filter((t) => t.id !== id);
  write(FOCUS_KEY, list);
  return list;
}
