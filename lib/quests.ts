"use client";

import { getHabits, getRelationships, getFocusTasks, getMoodEntries } from "@/lib/life-storage";

export interface Quest {
  id: string;
  title: string;
  description: string;
  emoji: string;
  xp: number;
  action: "complete_habit" | "log_mood" | "contact_person" | "add_focus" | "complete_focus" | "open_chat";
  targetId?: string;
  done: boolean;
}

const KEY = "aiah-daily-quests";

interface StoredQuests {
  date: string;
  quests: Quest[];
}

function read(): StoredQuests | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(KEY);
    return s ? (JSON.parse(s) as StoredQuests) : null;
  } catch {
    return null;
  }
}

function write(data: StoredQuests) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Generate today's quests based on current life data.
 * Returns existing quests if they already exist for today.
 */
export function getTodayQuests(): Quest[] {
  const stored = read();
  const t = today();
  if (stored && stored.date === t) return stored.quests;

  const quests: Quest[] = [];

  // Always: log mood if not logged today
  const moods = getMoodEntries();
  const loggedToday = moods.some((m) => m.at.slice(0, 10) === t);
  if (!loggedToday) {
    quests.push({
      id: "mood_today",
      title: "Check in with yourself",
      description: "Log how you're feeling right now",
      emoji: "🧠",
      xp: 20,
      action: "log_mood",
      done: false,
    });
  }

  // Habit: complete the habit with the longest streak that's not done today
  const habits = getHabits();
  const undoneHabits = habits.filter((h) => h.lastDone !== t);
  if (undoneHabits.length > 0) {
    const priority = undoneHabits.sort((a, b) => b.streak - a.streak)[0];
    quests.push({
      id: `habit_${priority.id}`,
      title: `Keep the streak: ${priority.name}`,
      description: `${priority.streak}-day streak on the line`,
      emoji: priority.emoji,
      xp: 25,
      action: "complete_habit",
      targetId: priority.id,
      done: false,
    });
  }

  // Focus: if you have no focus tasks today, create one
  const focus = getFocusTasks();
  const todayFocus = focus.filter((f) => f.createdAt.slice(0, 10) === t);
  if (todayFocus.length === 0) {
    quests.push({
      id: "add_focus",
      title: "Set today's focus",
      description: "Pick your most important task",
      emoji: "🎯",
      xp: 15,
      action: "add_focus",
      done: false,
    });
  } else {
    const undone = todayFocus.find((f) => !f.done);
    if (undone) {
      quests.push({
        id: `focus_${undone.id}`,
        title: `Finish: ${undone.title}`,
        description: "Complete your focus task",
        emoji: "⚡",
        xp: 25,
        action: "complete_focus",
        targetId: undone.id,
        done: false,
      });
    }
  }

  // People: reach out to the most overdue person
  const people = getRelationships();
  const overdue = people
    .filter((p) => {
      if (!p.lastContact) return true;
      const d = (Date.now() - new Date(p.lastContact).getTime()) / (1000 * 60 * 60 * 24);
      return d >= p.reminderDays;
    })
    .sort((a, b) => {
      const ad = a.lastContact ? new Date(a.lastContact).getTime() : 0;
      const bd = b.lastContact ? new Date(b.lastContact).getTime() : 0;
      return ad - bd;
    });

  if (overdue.length > 0) {
    quests.push({
      id: `person_${overdue[0].id}`,
      title: `Reach out to ${overdue[0].name}`,
      description: `It's been a while. A quick hello counts.`,
      emoji: overdue[0].emoji ?? "💗",
      xp: 30,
      action: "contact_person",
      targetId: overdue[0].id,
      done: false,
    });
  }

  // Fill up to 4 quests
  if (quests.length < 4) {
    quests.push({
      id: "talk_aiah",
      title: "Have a conversation",
      description: "Talk to AIAH for 2 minutes",
      emoji: "💬",
      xp: 20,
      action: "open_chat",
      done: false,
    });
  }

  const data: StoredQuests = { date: t, quests: quests.slice(0, 4) };
  write(data);
  return data.quests;
}

export function markQuestDone(id: string) {
  const stored = read();
  if (!stored) return [];
  stored.quests = stored.quests.map((q) => (q.id === id ? { ...q, done: true } : q));
  write(stored);
  return stored.quests;
}

export function refreshQuests() {
  if (typeof window === "undefined") return [];
  localStorage.removeItem(KEY);
  return getTodayQuests();
}
