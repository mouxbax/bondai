"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useMood } from "@/lib/mood-context";
import { getUnlockedAchievements, type Achievement } from "@/lib/gamification";
import { Lock } from "lucide-react";

const categories: Achievement["category"][] = ["habits", "mood", "social", "focus", "level", "special"];
const categoryLabels: Record<Achievement["category"], string> = {
  habits: "Habits",
  mood: "Mood",
  social: "Social",
  focus: "Focus",
  level: "Growth",
  special: "Special",
};

export function AchievementsGrid() {
  const { theme } = useMood();
  const [all, setAll] = useState<Achievement[]>([]);

  useEffect(() => {
    setAll(getUnlockedAchievements());
  }, []);

  const unlocked = all.filter((a) => a.unlockedAt).length;

  return (
    <div className={`relative flex flex-1 flex-col bg-gradient-to-b ${theme.bgFrom} ${theme.bgTo}`}>
      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className={`text-xs uppercase tracking-widest ${theme.textMuted}`}>Collection</p>
            <h2 className={`text-3xl font-bold ${theme.text}`}>Achievements</h2>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-amber-500">{unlocked}</p>
            <p className={`text-xs ${theme.textMuted}`}>of {all.length} unlocked</p>
          </div>
        </div>

        {categories.map((cat) => {
          const items = all.filter((a) => a.category === cat);
          if (items.length === 0) return null;
          return (
            <section key={cat} className="mb-6">
              <h3 className={`mb-3 text-xs font-semibold uppercase tracking-wider ${theme.textMuted}`}>
                {categoryLabels[cat]}
              </h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {items.map((a, i) => {
                  const locked = !a.unlockedAt;
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: i * 0.04, duration: 0.35 }}
                      whileHover={{ y: -2, scale: 1.03 }}
                      className={`relative flex flex-col items-center gap-1 rounded-2xl border p-3 text-center shadow-sm backdrop-blur transition-colors ${
                        locked
                          ? "border-stone-200 bg-stone-100/60 dark:border-stone-800 dark:bg-stone-900/40"
                          : "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-700 dark:from-amber-950/40 dark:to-orange-950/40"
                      }`}
                    >
                      <div className={`text-3xl ${locked ? "grayscale opacity-40" : ""}`}>{a.emoji}</div>
                      <p className={`text-[10px] font-bold ${locked ? theme.textMuted : theme.text}`}>{a.name}</p>
                      <p className={`text-[9px] leading-tight ${theme.textMuted}`}>{a.description}</p>
                      {locked && (
                        <div className="absolute right-1 top-1 rounded-full bg-stone-200 p-1 dark:bg-stone-800">
                          <Lock className="h-2.5 w-2.5 text-stone-500" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </section>
          );
        })}
        <div className="h-24" />
      </div>
    </div>
  );
}
