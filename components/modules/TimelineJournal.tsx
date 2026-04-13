"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getMoodEntries, type MoodEntry } from "@/lib/life-storage";
import { getXPEvents, type XPEventLog } from "@/lib/gamification";
import { useMood } from "@/lib/mood-context";

type TimelineItem =
  | { kind: "mood"; at: string; data: MoodEntry }
  | { kind: "xp"; at: string; data: XPEventLog };

const moodEmoji: Record<string, string> = {
  calm: "🌿",
  happy: "☀️",
  focused: "🎯",
  energetic: "🔥",
  tender: "💗",
  anxious: "🌀",
  sad: "🌧️",
};

const eventLabels: Record<string, { label: string; emoji: string }> = {
  habit_complete: { label: "Habit done", emoji: "✅" },
  mood_log: { label: "Mood logged", emoji: "🧠" },
  focus_complete: { label: "Focus completed", emoji: "⚡" },
  person_contacted: { label: "Reached out", emoji: "💗" },
  daily_checkin: { label: "Daily check-in", emoji: "🌅" },
  quest_complete: { label: "Quest done", emoji: "🏆" },
  streak_milestone: { label: "Streak milestone", emoji: "🔥" },
  goal_complete: { label: "Goal complete", emoji: "🎯" },
};

function groupByDay(items: TimelineItem[]) {
  const groups: Record<string, TimelineItem[]> = {};
  items.forEach((it) => {
    const d = it.at.slice(0, 10);
    if (!groups[d]) groups[d] = [];
    groups[d].push(it);
  });
  return Object.entries(groups).sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function TimelineJournal() {
  const { theme } = useMood();
  const [items, setItems] = useState<TimelineItem[]>([]);

  useEffect(() => {
    const mood = getMoodEntries().map<TimelineItem>((m) => ({ kind: "mood", at: m.at, data: m }));
    const xp = getXPEvents().map<TimelineItem>((e) => ({ kind: "xp", at: e.at, data: e }));
    const combined = [...mood, ...xp].sort((a, b) => (a.at < b.at ? 1 : -1));
    setItems(combined);
  }, []);

  const grouped = useMemo(() => groupByDay(items), [items]);

  return (
    <div className={`relative flex flex-1 flex-col bg-gradient-to-b ${theme.bgFrom} ${theme.bgTo}`}>
      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8">
        <div className="mb-6">
          <p className={`text-xs uppercase tracking-widest ${theme.textMuted}`}>Your story</p>
          <h2 className={`text-3xl font-bold ${theme.text}`}>Timeline</h2>
          <p className={`mt-1 text-sm ${theme.textMuted}`}>Every moment, in order.</p>
        </div>

        {grouped.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center dark:border-stone-700">
            <p className={`text-sm ${theme.text}`}>Nothing to show yet.</p>
            <p className={`mt-1 text-xs ${theme.textMuted}`}>Your moments will appear here as you log them.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-stone-200 dark:bg-stone-800" />

            {grouped.map(([day, dayItems], di) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: di * 0.05 }}
                className="relative mb-6"
              >
                <div className="mb-3 ml-10">
                  <p className={`text-xs font-semibold uppercase tracking-wider ${theme.textMuted}`}>
                    {dayLabel(day)}
                  </p>
                </div>
                <div className="space-y-2">
                  {dayItems.map((it, ii) => {
                    const time = new Date(it.at).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    if (it.kind === "mood") {
                      return (
                        <motion.div
                          key={`${di}-${ii}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + ii * 0.04 }}
                          className="relative ml-10 flex items-start gap-3 rounded-2xl bg-white/70 p-3 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-stone-900/60"
                        >
                          <div className="absolute -left-[32px] flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-violet-100 text-sm dark:border-stone-900 dark:bg-violet-950">
                            {moodEmoji[it.data.mood] ?? "•"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm font-medium capitalize ${theme.text}`}>{it.data.mood}</p>
                              <span className={`text-[10px] ${theme.textMuted}`}>{time}</span>
                            </div>
                            {it.data.note && (
                              <p className={`mt-1 text-xs ${theme.textMuted}`}>{it.data.note}</p>
                            )}
                          </div>
                        </motion.div>
                      );
                    }
                    const cfg = eventLabels[it.data.type] ?? { label: it.data.type, emoji: "✨" };
                    return (
                      <motion.div
                        key={`${di}-${ii}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + ii * 0.04 }}
                        className="relative ml-10 flex items-center gap-3 rounded-2xl bg-white/70 p-3 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-stone-900/60"
                      >
                        <div className="absolute -left-[32px] flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-amber-100 text-sm dark:border-stone-900 dark:bg-amber-950">
                          {cfg.emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm font-medium ${theme.text}`}>{cfg.label}</p>
                            <span className={`text-[10px] ${theme.textMuted}`}>{time}</span>
                          </div>
                        </div>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                          +{it.data.amount}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
        <div className="h-24" />
      </div>
    </div>
  );
}
