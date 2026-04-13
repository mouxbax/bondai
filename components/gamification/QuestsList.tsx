"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Scroll, Check } from "lucide-react";
import { getTodayQuests, markQuestDone, type Quest } from "@/lib/quests";
import { awardXP, checkAchievements } from "@/lib/gamification";
import { completeHabit, addMoodEntry } from "@/lib/life-storage";
import { useMood } from "@/lib/mood-context";
import { useCelebrate } from "@/components/fx/Celebration";

export function QuestsList() {
  const router = useRouter();
  const { mood, theme } = useMood();
  const [quests, setQuests] = useState<Quest[]>([]);
  const celebrate = useCelebrate();

  useEffect(() => {
    setQuests(getTodayQuests());
  }, []);

  const handleAction = (q: Quest, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    switch (q.action) {
      case "log_mood": {
        addMoodEntry(mood);
        const result = awardXP("mood_log");
        celebrate(result, [], x, y);
        markDone(q.id);
        break;
      }
      case "complete_habit":
        if (q.targetId) completeHabit(q.targetId);
        {
          const result = awardXP("habit_complete");
          const newAch = checkAchievements();
          celebrate(result, newAch, x, y);
        }
        markDone(q.id);
        break;
      case "complete_focus":
        router.push("/focus");
        break;
      case "add_focus":
        router.push("/focus");
        break;
      case "contact_person":
        router.push("/people");
        break;
      case "open_chat":
        router.push("/talk");
        break;
    }
  };

  const markDone = (id: string) => {
    const updated = markQuestDone(id);
    setQuests(updated);
    const result = awardXP("quest_complete");
    const newAch = checkAchievements();
    setTimeout(
      () =>
        celebrate(
          result,
          newAch.map((a) => ({ emoji: a.emoji, name: a.name, description: a.description })),
        ),
      800,
    );
  };

  if (quests.length === 0) return null;

  const allDone = quests.every((q) => q.done);
  const doneCount = quests.filter((q) => q.done).length;

  return (
    <div className="rounded-2xl bg-white/70 p-4 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-stone-900/60">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scroll className="h-4 w-4 text-amber-500" />
          <h3 className={`text-sm font-semibold ${theme.text}`}>Today&apos;s quests</h3>
        </div>
        <span className={`text-xs ${theme.textMuted}`}>
          {doneCount}/{quests.length} done
        </span>
      </div>

      {allDone ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-3 text-center dark:from-emerald-950/40 dark:to-teal-950/40"
        >
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            🎉 All quests done. Legend.
          </p>
          <p className={`mt-1 text-xs ${theme.textMuted}`}>New quests refresh at midnight.</p>
        </motion.div>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {quests.map((q) => (
              <motion.li
                key={q.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                  q.done
                    ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30"
                    : "border-stone-100 bg-stone-50/80 dark:border-stone-800 dark:bg-stone-800/40"
                }`}
              >
                <div className="text-2xl">{q.emoji}</div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${theme.text} ${q.done ? "line-through opacity-60" : ""}`}>
                    {q.title}
                  </p>
                  <p className={`text-xs ${theme.textMuted}`}>{q.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                    +{q.xp} XP
                  </span>
                  {q.done ? (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="h-4 w-4" />
                    </div>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={(e) => handleAction(q, e)}
                      className="rounded-full bg-[#1D9E75] px-3 py-1 text-xs font-medium text-white hover:bg-[#0f6b4f]"
                    >
                      Go
                    </motion.button>
                  )}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
