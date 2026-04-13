"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, CheckCircle2, Target, MessageCircleHeart, Brain, Flame } from "lucide-react";
import { useRouter } from "next/navigation";
import { addFocusTask, addMoodEntry, addHabit } from "@/lib/life-storage";
import { useMood } from "@/lib/mood-context";

type Mode = "menu" | "focus" | "mood" | "habit" | null;

export function QuickCapture() {
  const router = useRouter();
  const { mood } = useMood();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");
  const [text, setText] = useState("");

  const close = () => {
    setOpen(false);
    setMode("menu");
    setText("");
  };

  const handleSave = () => {
    if (!text.trim() && mode !== "mood") return;
    if (mode === "focus") {
      addFocusTask(text.trim());
      router.refresh();
    } else if (mode === "habit") {
      addHabit(text.trim());
      router.refresh();
    } else if (mode === "mood") {
      addMoodEntry(mood, text.trim() || undefined);
      router.refresh();
    }
    close();
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={() => {
          setOpen(true);
          setMode("menu");
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#1D9E75] text-white shadow-lg shadow-emerald-500/30 md:bottom-6 md:right-6"
        aria-label="Quick capture"
      >
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <Plus className="h-6 w-6" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-3xl border border-stone-200 bg-white p-5 shadow-2xl dark:border-stone-800 dark:bg-stone-900 md:bottom-24 md:right-24 md:left-auto md:rounded-3xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-stone-900 dark:text-stone-50">
                  {mode === "menu" ? "Quick capture" : mode === "focus" ? "New task" : mode === "habit" ? "New habit" : "Log mood"}
                </h3>
                <button onClick={close} className="rounded-lg p-1 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {mode === "menu" && (
                <div className="grid grid-cols-2 gap-2">
                  <QuickOption icon={CheckCircle2} label="Task" color="#0D7C6A" onClick={() => setMode("focus")} />
                  <QuickOption icon={Flame} label="Habit" color="#F97316" onClick={() => setMode("habit")} />
                  <QuickOption icon={Brain} label="Mood" color="#8B5CF6" onClick={() => setMode("mood")} />
                  <QuickOption
                    icon={MessageCircleHeart}
                    label="Talk"
                    color="#4A7FA7"
                    onClick={() => {
                      close();
                      router.push("/talk");
                    }}
                  />
                  <QuickOption
                    icon={Target}
                    label="Goal"
                    color="#1D9E75"
                    onClick={() => {
                      close();
                      router.push("/goals");
                    }}
                  />
                </div>
              )}

              {(mode === "focus" || mode === "habit" || mode === "mood") && (
                <div>
                  <textarea
                    autoFocus
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={
                      mode === "focus"
                        ? "What needs to get done?"
                        : mode === "habit"
                          ? "Name your new habit"
                          : "Optional note about how you're feeling"
                    }
                    className="min-h-[80px] w-full resize-none rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm outline-none focus:border-[#1D9E75] dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => setMode("menu")}
                      className="rounded-xl px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSave}
                      className="rounded-xl bg-[#1D9E75] px-4 py-2 text-sm font-medium text-white hover:bg-[#0f6b4f]"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function QuickOption({
  icon: Icon,
  label,
  color,
  onClick,
}: {
  icon: typeof Plus;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900"
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <span className="text-xs font-medium text-stone-700 dark:text-stone-300">{label}</span>
    </motion.button>
  );
}
