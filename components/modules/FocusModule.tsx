"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMood } from "@/lib/mood-context";
import {
  addFocusTask,
  deleteFocusTask,
  getFocusTasks,
  toggleFocusTask,
  type FocusTask,
} from "@/lib/life-storage";
import { awardXP, checkAchievements } from "@/lib/gamification";
import { useCelebrate } from "@/components/fx/Celebration";

const priorityConfig: Record<FocusTask["priority"], { label: string; color: string; bg: string }> = {
  high: { label: "High", color: "#EF4444", bg: "bg-red-50 dark:bg-red-950/30" },
  med: { label: "Med", color: "#F5B945", bg: "bg-amber-50 dark:bg-amber-950/30" },
  low: { label: "Low", color: "#4A7FA7", bg: "bg-blue-50 dark:bg-blue-950/30" },
};

export function FocusModule() {
  const { theme } = useMood();
  const celebrate = useCelebrate();
  const [tasks, setTasks] = useState<FocusTask[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<FocusTask["priority"]>("med");

  useEffect(() => {
    setTasks(getFocusTasks());
  }, []);

  const handleAdd = () => {
    if (!title.trim()) return;
    addFocusTask(title.trim(), priority);
    setTasks(getFocusTasks());
    setTitle("");
    setPriority("med");
  };

  const sorted = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const order = { high: 0, med: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  const remaining = tasks.filter((t) => !t.done).length;

  return (
    <div className={`relative flex flex-1 flex-col bg-gradient-to-b ${theme.bgFrom} ${theme.bgTo}`}>
      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8">
        <div>
          <h2 className={`text-2xl font-semibold ${theme.text}`}>Today&apos;s focus</h2>
          <p className={`mt-1 text-sm ${theme.textMuted}`}>
            {remaining === 0
              ? "All clear. Breathe."
              : `${remaining} thing${remaining === 1 ? "" : "s"} to handle.`}
          </p>
        </div>

        <div className="mt-6 rounded-2xl bg-white/70 p-4 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-stone-900/60">
          <Input
            placeholder="What needs to get done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="rounded-xl"
          />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1">
              {(["low", "med", "high"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    priority === p
                      ? "border-stone-900 bg-stone-900 text-white dark:border-stone-50 dark:bg-stone-50 dark:text-stone-900"
                      : "border-stone-200 text-stone-600 dark:border-stone-700 dark:text-stone-400"
                  }`}
                >
                  {priorityConfig[p].label}
                </button>
              ))}
            </div>
            <Button onClick={handleAdd} className="rounded-xl">
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {sorted.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center dark:border-stone-700">
              <p className={`text-sm ${theme.text}`}>Nothing here yet.</p>
              <p className={`mt-1 text-xs ${theme.textMuted}`}>Add your top 3 for today.</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {sorted.map((t) => {
                const cfg = priorityConfig[t.priority];
                return (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`flex items-center gap-3 rounded-2xl bg-white/70 p-4 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-stone-900/60 ${
                      t.done ? "opacity-60" : ""
                    }`}
                  >
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        const wasDone = t.done;
                        setTasks(toggleFocusTask(t.id));
                        if (!wasDone) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const result = awardXP("focus_complete");
                          const newAch = checkAchievements();
                          celebrate(
                            result,
                            newAch.map((a) => ({
                              emoji: a.emoji,
                              name: a.name,
                              description: a.description,
                            })),
                            rect.left + rect.width / 2,
                            rect.top + rect.height / 2,
                          );
                        }
                      }}
                      className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
                        t.done
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-stone-300 dark:border-stone-600"
                      }`}
                    >
                      {t.done && <Check className="h-4 w-4" />}
                    </motion.button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm ${theme.text} ${
                          t.done ? "line-through" : "font-medium"
                        }`}
                      >
                        {t.title}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cfg.bg}`}
                      style={{ color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    <button
                      onClick={() => setTasks(deleteFocusTask(t.id))}
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
