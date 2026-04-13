"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Plus, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMood } from "@/lib/mood-context";
import { addHabit, completeHabit, deleteHabit, getHabits, type Habit } from "@/lib/life-storage";
import { awardXP, checkAchievements } from "@/lib/gamification";
import { useCelebrate } from "@/components/fx/Celebration";

const emojiPool = ["✨", "💧", "🏃", "📚", "🧘", "🥗", "💪", "🎵", "🛌", "☀️", "🧠", "✍️"];
const colorPool = ["#1D9E75", "#F5B945", "#8B5CF6", "#EC4899", "#F97316", "#4A7FA7", "#0D7C6A", "#EF4444"];

export function HabitsModule() {
  const { theme } = useMood();
  const celebrate = useCelebrate();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(emojiPool[0]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setHabits(getHabits());
  }, []);

  const handleAdd = () => {
    if (!name.trim()) return;
    const color = colorPool[habits.length % colorPool.length];
    addHabit(name.trim(), emoji, color);
    setHabits(getHabits());
    setName("");
    setEmoji(emojiPool[0]);
    setShowForm(false);
  };

  const handleComplete = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    setHabits(completeHabit(id));
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const result = awardXP("habit_complete");
    const newAch = checkAchievements();
    celebrate(
      result,
      newAch.map((a) => ({ emoji: a.emoji, name: a.name, description: a.description })),
      x,
      y,
    );
  };

  const handleDelete = (id: string) => {
    setHabits(deleteHabit(id));
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className={`relative flex flex-1 flex-col bg-gradient-to-b ${theme.bgFrom} ${theme.bgTo}`}>
      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-semibold ${theme.text}`}>Daily rituals</h2>
            <p className={`mt-1 text-sm ${theme.textMuted}`}>Small, consistent wins. Tap to check in.</p>
          </div>
          <Button onClick={() => setShowForm((v) => !v)} className="rounded-xl">
            <Plus className="mr-1 h-4 w-4" /> New
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-2xl bg-white/70 p-4 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-stone-900/60">
                <Input
                  placeholder="E.g. Drink 2L water"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="rounded-xl"
                />
                <div className="mt-3 flex flex-wrap gap-1">
                  {emojiPool.map((em) => (
                    <button
                      key={em}
                      onClick={() => setEmoji(em)}
                      className={`rounded-lg px-2 py-1 text-lg transition-colors ${
                        emoji === em ? "bg-stone-900 dark:bg-stone-50" : "hover:bg-stone-100 dark:hover:bg-stone-800"
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowForm(false)} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button onClick={handleAdd} className="rounded-xl">
                    Add habit
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 space-y-2">
          {habits.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`rounded-2xl border border-dashed border-stone-300 p-8 text-center dark:border-stone-700`}
            >
              <Flame className="mx-auto h-10 w-10 text-orange-400" />
              <p className={`mt-3 text-sm ${theme.text}`}>No habits yet.</p>
              <p className={`mt-1 text-xs ${theme.textMuted}`}>Start with one tiny daily ritual.</p>
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              {habits.map((h) => {
                const doneToday = h.lastDone === today;
                return (
                  <motion.div
                    key={h.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3 rounded-2xl bg-white/70 p-4 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-stone-900/60"
                  >
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                      style={{ backgroundColor: `${h.color}20` }}
                    >
                      {h.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-medium ${theme.text}`}>{h.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Flame className="h-3 w-3" style={{ color: h.color }} />
                        <span className={`text-xs ${theme.textMuted}`}>
                          {h.streak} day{h.streak === 1 ? "" : "s"} streak
                        </span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={(e) => handleComplete(h.id, e)}
                      disabled={doneToday}
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                        doneToday
                          ? "bg-emerald-500 text-white"
                          : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
                      }`}
                      aria-label="Mark done"
                    >
                      <Check className="h-5 w-5" />
                    </motion.button>
                    <button
                      onClick={() => handleDelete(h.id)}
                      className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-red-500 dark:hover:bg-stone-800"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
        <div className="h-24" />
      </div>
    </div>
  );
}
