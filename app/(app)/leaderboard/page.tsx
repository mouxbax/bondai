"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Crown, Loader2, Star } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { moodDisplay } from "@/lib/companion-mood";
import type { CompanionMood } from "@/lib/companion-mood";

interface LeaderboardEntry {
  rank: number;
  name: string;
  image: string | null;
  xp: number;
  level: number;
  companionName: string;
  mood: string;
  isMe: boolean;
}

const RANK_ICONS: Record<number, { icon: typeof Trophy; color: string }> = {
  1: { icon: Crown, color: "text-amber-400" },
  2: { icon: Medal, color: "text-stone-300" },
  3: { icon: Medal, color: "text-amber-600" },
};

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) return;
      const data = await res.json();
      setEntries(data.leaderboard);
      setMyRank(data.myRank);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-stone-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Leaderboard" />

      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        {/* My rank banner */}
        {myRank && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-violet-200 dark:border-violet-500/20 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 p-4 text-center"
          >
            <p className="text-xs text-violet-500 dark:text-violet-400 font-medium mb-1">
              Your Rank
            </p>
            <p className="text-3xl font-bold text-violet-700 dark:text-violet-300">
              #{myRank}
            </p>
          </motion.div>
        )}

        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Trophy className="h-10 w-10 text-stone-300 dark:text-stone-600" />
            <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
              No companions on the leaderboard yet. Be the first!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {entries.map((entry, i) => {
                const rankInfo = RANK_ICONS[entry.rank];
                const mood = moodDisplay(entry.mood as CompanionMood);

                return (
                  <motion.div
                    key={`${entry.rank}-${entry.name}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-3 rounded-2xl border p-3 transition-all ${
                      entry.isMe
                        ? "border-violet-300 dark:border-violet-500/30 bg-violet-50/50 dark:bg-violet-900/10"
                        : "border-stone-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]"
                    }`}
                  >
                    {/* Rank */}
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
                      {rankInfo ? (
                        <rankInfo.icon className={`h-5 w-5 ${rankInfo.color}`} />
                      ) : (
                        <span className="text-sm font-bold text-stone-400 dark:text-stone-500">
                          {entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-700 dark:to-stone-800 overflow-hidden">
                      {entry.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={entry.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-lg">{mood.emoji}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-stone-800 dark:text-stone-200 truncate">
                          {entry.name}
                        </span>
                        {entry.isMe && (
                          <span className="text-[9px] bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 rounded-full px-1.5 py-0.5 font-medium">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        {entry.companionName} {mood.emoji}
                      </p>
                    </div>

                    {/* XP + Level */}
                    <div className="flex flex-col items-end flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-400" />
                        <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                          Lv.{entry.level}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500">
                        {entry.xp.toLocaleString()} XP
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
