"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useMood } from "@/lib/mood-context";
import { getWeeklyInsights, type WeeklyInsights } from "@/lib/insights";
import { computeLifeScore, type LifeScore } from "@/lib/gamification";
import { LifeScoreRing } from "@/components/gamification/LifeScoreRing";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import { Sparkles, TrendingUp, Flame, Heart, CheckCircle2, Users } from "lucide-react";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export function InsightsDashboard() {
  const { theme } = useMood();
  const [insights, setInsights] = useState<WeeklyInsights | null>(null);
  const [score, setScore] = useState<LifeScore | null>(null);

  useEffect(() => {
    setInsights(getWeeklyInsights());
    setScore(computeLifeScore());
  }, []);

  if (!insights || !score) return null;

  const moodEmoji: Record<string, string> = {
    calm: "🌿",
    happy: "☀️",
    focused: "🎯",
    energetic: "🔥",
    tender: "💗",
    anxious: "🌀",
    sad: "🌧️",
  };

  return (
    <div className={`relative flex flex-1 flex-col bg-gradient-to-b ${theme.bgFrom} ${theme.bgTo}`}>
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6 md:px-8"
      >
        {/* Hero */}
        <motion.div variants={item}>
          <p className={`text-xs uppercase tracking-widest ${theme.textMuted}`}>This week</p>
          <h2 className={`text-3xl font-bold ${theme.text}`}>Your life, in numbers</h2>
          <p className={`mt-1 text-sm ${theme.textMuted}`}>Patterns I&apos;m noticing for you.</p>
        </motion.div>

        {/* Life Score + Level */}
        <motion.div variants={item} className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-2xl bg-white/70 p-4 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-stone-900/60">
            <LifeScoreRing size={100} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Dimensions
              </p>
              <ul className="mt-1 space-y-1 text-xs">
                <li className="flex justify-between">
                  <span className={theme.textMuted}>Habits</span>
                  <span className={`font-medium ${theme.text}`}>{score.dimensions.habits}</span>
                </li>
                <li className="flex justify-between">
                  <span className={theme.textMuted}>Mood</span>
                  <span className={`font-medium ${theme.text}`}>{score.dimensions.mood}</span>
                </li>
                <li className="flex justify-between">
                  <span className={theme.textMuted}>Focus</span>
                  <span className={`font-medium ${theme.text}`}>{score.dimensions.focus}</span>
                </li>
                <li className="flex justify-between">
                  <span className={theme.textMuted}>People</span>
                  <span className={`font-medium ${theme.text}`}>{score.dimensions.people}</span>
                </li>
              </ul>
            </div>
          </div>
          <LevelBadge />
        </motion.div>

        {/* Weekly Wrapped stat grid */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard icon={TrendingUp} label="Days active" value={`${insights.daysActive}/7`} color="#1D9E75" />
          <StatCard icon={Flame} label="Habits done" value={insights.habitsCompleted} color="#F97316" />
          <StatCard icon={Heart} label="Mood logs" value={insights.moodLogs} color="#8B5CF6" />
          <StatCard icon={CheckCircle2} label="Focus done" value={insights.focusDone} color="#0D7C6A" />
          <StatCard icon={Users} label="Contacts" value={insights.contactsMade} color="#EC4899" />
          <StatCard icon={Sparkles} label="XP gained" value={insights.xpGained} color="#F5B945" />
        </motion.div>

        {/* Weekly Wrapped highlight cards */}
        <motion.div variants={item} className="grid gap-3 sm:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 p-5 text-white shadow-lg">
            <div className="relative z-10">
              <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80">Dominant mood</p>
              <p className="mt-2 text-5xl">{moodEmoji[insights.dominantMood] ?? "🌿"}</p>
              <p className="mt-1 text-lg font-bold capitalize">{insights.dominantMood}</p>
            </div>
            <motion.div
              className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-5 text-white shadow-lg">
            <div className="relative z-10">
              <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80">Strongest day</p>
              <p className="mt-2 text-5xl font-bold">{insights.bestDay}</p>
              <p className="mt-1 text-sm opacity-90">Most wins landed here.</p>
            </div>
            <motion.div
              className="absolute -left-8 -bottom-8 h-36 w-36 rounded-full bg-white/10"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          </div>
        </motion.div>

        {insights.longestStreak && (
          <motion.div variants={item} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-5 text-white shadow-lg">
            <div className="relative z-10 flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl"
              >
                🔥
              </motion.div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80">Longest streak</p>
                <p className="mt-1 text-2xl font-bold">{insights.longestStreak.name}</p>
                <p className="text-sm opacity-90">{insights.longestStreak.days} days and counting</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Patterns */}
        {insights.patterns.length > 0 && (
          <motion.div variants={item}>
            <h3 className={`mb-2 text-sm font-semibold ${theme.text}`}>What I noticed</h3>
            <ul className="space-y-2">
              {insights.patterns.map((p, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  className="flex items-start gap-2 rounded-xl bg-white/70 p-3 text-sm shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-stone-900/60"
                >
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <span className={theme.text}>{p}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
        <div className="h-24" />
      </motion.div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Sparkles;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.02 }}
      className="rounded-2xl bg-white/70 p-3 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-stone-900/60"
    >
      <div
        className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <p className="text-xl font-bold text-stone-900 dark:text-stone-50">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
        {label}
      </p>
    </motion.div>
  );
}
