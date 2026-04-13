"use client";

import { getHabits, getMoodEntries, getFocusTasks, getRelationships } from "@/lib/life-storage";
import { getXPEvents } from "@/lib/gamification";

export interface WeeklyInsights {
  daysActive: number;
  habitsCompleted: number;
  moodLogs: number;
  focusDone: number;
  contactsMade: number;
  xpGained: number;
  dominantMood: string;
  bestDay: string;
  longestStreak: { name: string; days: number } | null;
  patterns: string[]; // human-readable insights
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getWeeklyInsights(): WeeklyInsights {
  if (typeof window === "undefined") {
    return {
      daysActive: 0,
      habitsCompleted: 0,
      moodLogs: 0,
      focusDone: 0,
      contactsMade: 0,
      xpGained: 0,
      dominantMood: "calm",
      bestDay: "—",
      longestStreak: null,
      patterns: [],
    };
  }

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const mood = getMoodEntries().filter((m) => new Date(m.at).getTime() > weekAgo);
  const focus = getFocusTasks().filter((f) => new Date(f.createdAt).getTime() > weekAgo);
  const habits = getHabits();
  const events = getXPEvents().filter((e) => new Date(e.at).getTime() > weekAgo);

  // Days active = unique days with any event
  const activeDays = new Set(events.map((e) => e.at.slice(0, 10)));

  const habitsCompleted = events.filter((e) => e.type === "habit_complete").length;
  const focusDone = focus.filter((f) => f.done).length;
  const contactsMade = events.filter((e) => e.type === "person_contacted").length;
  const xpGained = events.reduce((sum, e) => sum + e.amount, 0);

  // Dominant mood
  const moodCount: Record<string, number> = {};
  mood.forEach((m) => {
    moodCount[m.mood] = (moodCount[m.mood] || 0) + 1;
  });
  const dominantMood =
    Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "calm";

  // Best day = day with most XP events
  const dayXp: Record<number, number> = {};
  events.forEach((e) => {
    const d = new Date(e.at).getDay();
    dayXp[d] = (dayXp[d] || 0) + e.amount;
  });
  const bestDayNum = Object.entries(dayXp).sort((a, b) => b[1] - a[1])[0]?.[0];
  const bestDay = bestDayNum !== undefined ? DAY_NAMES[Number(bestDayNum)] : "—";

  // Longest active streak
  const longestStreak =
    habits.length > 0
      ? habits.reduce<{ name: string; days: number } | null>((best, h) => {
          if (!best || h.streak > best.days) return { name: h.name, days: h.streak };
          return best;
        }, null)
      : null;

  // Patterns
  const patterns: string[] = [];

  const positiveMoods = ["calm", "happy", "focused", "energetic"];
  const positiveCount = mood.filter((m) => positiveMoods.includes(m.mood)).length;
  if (mood.length > 0) {
    const ratio = positiveCount / mood.length;
    if (ratio >= 0.7) patterns.push(`${Math.round(ratio * 100)}% of your week felt positive. Momentum.`);
    else if (ratio < 0.3) patterns.push("This week leaned heavy. Go gentle on yourself.");
  }

  if (activeDays.size >= 6) patterns.push(`${activeDays.size}/7 days active. You showed up.`);
  if (habitsCompleted >= 15) patterns.push(`${habitsCompleted} rituals completed. You're building something.`);
  if (longestStreak && longestStreak.days >= 7) {
    patterns.push(`"${longestStreak.name}" streak at ${longestStreak.days} days. Don't let it break.`);
  }

  if (bestDay !== "—") patterns.push(`${bestDay} was your strongest day.`);

  // Mood trend
  if (mood.length >= 3) {
    const half = Math.floor(mood.length / 2);
    const earlyPositive = mood
      .slice(0, half)
      .filter((m) => positiveMoods.includes(m.mood)).length / half;
    const latePositive =
      mood.slice(half).filter((m) => positiveMoods.includes(m.mood)).length /
      (mood.length - half);
    if (latePositive - earlyPositive > 0.2) patterns.push("Your mood climbed through the week. That matters.");
    if (earlyPositive - latePositive > 0.2) patterns.push("Your mood dipped late week. Rest is data.");
  }

  const overduePeople = getRelationships().filter((p) => {
    if (!p.lastContact) return true;
    const d = (Date.now() - new Date(p.lastContact).getTime()) / (1000 * 60 * 60 * 24);
    return d >= p.reminderDays;
  });
  if (overduePeople.length > 0) {
    patterns.push(`${overduePeople.length} ${overduePeople.length === 1 ? "person is" : "people are"} due for a hello.`);
  }

  return {
    daysActive: activeDays.size,
    habitsCompleted,
    moodLogs: mood.length,
    focusDone,
    contactsMade,
    xpGained,
    dominantMood,
    bestDay,
    longestStreak,
    patterns,
  };
}
