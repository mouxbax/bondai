"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronRight,
  Clock,
  MessageCircle,
  Sparkles,
  Star,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  getWeeklyExercises,
  getCompletedExercises,
  markExerciseCompleted,
  CATEGORY_META,
  type Exercise,
  type ExerciseCategory,
} from "@/lib/practice-exercises";
import { COACHING_SCENARIOS } from "@/lib/coaching-scenarios";
import { awardXP } from "@/lib/gamification";
import { sfx } from "@/lib/sfx";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const categoryColors: Record<ExerciseCategory, { bg: string; text: string; border: string; ring: string }> = {
  mindset: {
    bg: "bg-violet-50 dark:bg-violet-900/20",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-200 dark:border-violet-500/30",
    ring: "ring-violet-400",
  },
  productivity: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-500/30",
    ring: "ring-blue-400",
  },
  social: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-500/30",
    ring: "ring-amber-400",
  },
  wellness: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-500/30",
    ring: "ring-emerald-400",
  },
};

const typeIcons: Record<string, React.ReactNode> = {
  reflection: <Sparkles className="h-4 w-4" />,
  challenge: <Zap className="h-4 w-4" />,
  breathing: <Wind className="h-4 w-4" />,
  roleplay: <MessageCircle className="h-4 w-4" />,
};

export default function PracticePage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [response, setResponse] = useState("");
  const [showComplete, setShowComplete] = useState(false);
  const [xpGained, setXpGained] = useState(0);

  useEffect(() => {
    setExercises(getWeeklyExercises());
    setCompleted(getCompletedExercises());
  }, []);

  const completedCount = exercises.filter((e) => completed.has(e.id)).length;
  const totalCount = exercises.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  const handleComplete = useCallback((exercise: Exercise) => {
    markExerciseCompleted(exercise.id);
    awardXP("quest_complete", `Practice: ${exercise.title}`);
    setXpGained(exercise.xp);
    setCompleted(getCompletedExercises());
    sfx.xp();
    haptic("success");
    setShowComplete(true);

    setTimeout(() => {
      setShowComplete(false);
      setActiveExercise(null);
      setResponse("");
      setXpGained(0);
    }, 2000);
  }, []);

  const startRoleplay = useCallback(async (exercise: Exercise) => {
    if (!exercise.scenarioId) return;

    const energyRes = await fetch("/api/energy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "practice" }),
    });
    if (!energyRes.ok) {
      const data = await energyRes.json();
      if (data.error?.includes("Not enough energy")) {
        alert(`Not enough energy. You need 10% but have ${data.current}%. Try breathing to recharge.`);
        return;
      }
    }

    // Mark as completed immediately
    markExerciseCompleted(exercise.id);
    awardXP("quest_complete", `Practice: ${exercise.title}`);
    setCompleted(getCompletedExercises());

    const scenario = COACHING_SCENARIOS.find((s) => s.id === exercise.scenarioId);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "SOCIAL_COACHING",
        scenarioId: exercise.scenarioId,
        title: scenario?.title ?? exercise.title,
      }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { conversationId: string };
    router.push(`/chat/${data.conversationId}`);
  }, [router]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Practice" />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-lg px-4 py-6 md:px-8">

          {/* Weekly progress header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-semibold text-stone-900 dark:text-white">
                  This week&apos;s practice
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Shuffled fresh every Monday
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 dark:bg-emerald-900/30">
                <Star className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  {completedCount}/{totalCount}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-stone-100 dark:bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            {completedCount === totalCount && totalCount > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 text-center"
              >
                All done this week! New exercises drop Monday.
              </motion.p>
            )}
          </div>

          {/* Exercise list */}
          <div className="space-y-3">
            {exercises.map((ex, i) => {
              const done = completed.has(ex.id);
              const cat = CATEGORY_META[ex.category];
              const colors = categoryColors[ex.category];

              return (
                <motion.button
                  key={ex.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    if (!done) {
                      if (ex.type === "roleplay") {
                        startRoleplay(ex);
                      } else if (ex.type === "breathing") {
                        markExerciseCompleted(ex.id);
                        awardXP("quest_complete", `Practice: ${ex.title}`);
                        setCompleted(getCompletedExercises());
                        sfx.xp();
                        haptic("success");
                        router.push("/breathe");
                      } else {
                        setActiveExercise(ex);
                        setResponse("");
                      }
                    }
                  }}
                  disabled={done}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-2xl border p-4 text-left transition-all",
                    done
                      ? "border-stone-200/50 bg-stone-50/50 dark:border-white/[0.04] dark:bg-white/[0.01] opacity-60"
                      : `${colors.border} bg-white dark:bg-white/[0.02] hover:shadow-sm active:scale-[0.98]`
                  )}
                >
                  {/* Completion indicator */}
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
                      done
                        ? "bg-emerald-100 dark:bg-emerald-900/40"
                        : `${colors.bg}`
                    )}
                  >
                    {done ? (
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <span className={colors.text}>{typeIcons[ex.type]}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "text-sm font-semibold",
                        done ? "text-stone-400 dark:text-stone-500 line-through" : "text-stone-800 dark:text-stone-200"
                      )}>
                        {ex.title}
                      </p>
                      <span className={cn(
                        "text-[9px] font-medium rounded-full px-1.5 py-0.5",
                        colors.bg, colors.text
                      )}>
                        {cat.emoji}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      {ex.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-[10px] text-stone-400">
                        <Clock className="h-3 w-3" /> {ex.minutes}m
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-amber-500">
                        <Zap className="h-3 w-3" /> {ex.xp} XP
                      </span>
                    </div>
                  </div>

                  {!done && (
                    <ChevronRight className="h-4 w-4 shrink-0 text-stone-300 dark:text-stone-600" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Exercise modal */}
      <AnimatePresence>
        {activeExercise && !showComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setActiveExercise(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md mx-4 mb-4 sm:mb-0 rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 mb-2",
                    categoryColors[activeExercise.category].bg,
                    categoryColors[activeExercise.category].text,
                  )}>
                    {CATEGORY_META[activeExercise.category].emoji} {CATEGORY_META[activeExercise.category].label}
                  </span>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                    {activeExercise.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveExercise(null)}
                  className="rounded-full p-1.5 hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <X className="h-4 w-4 text-stone-400" />
                </button>
              </div>

              {/* Prompt or challenge */}
              <div className="rounded-2xl bg-stone-50 dark:bg-white/[0.04] p-4 mb-4">
                <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                  {activeExercise.prompt || activeExercise.challenge}
                </p>
              </div>

              {/* Response area for reflections */}
              {activeExercise.type === "reflection" && (
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Write your thoughts..."
                  className="w-full h-28 rounded-2xl border border-stone-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] px-4 py-3 text-sm text-stone-800 dark:text-stone-200 placeholder-stone-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/50 mb-4"
                  autoFocus
                />
              )}

              {/* Complete button */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-amber-500">
                  <Zap className="h-3.5 w-3.5" /> +{activeExercise.xp} XP
                </span>
                <Button
                  onClick={() => handleComplete(activeExercise)}
                  disabled={activeExercise.type === "reflection" && response.trim().length < 5}
                  className="rounded-2xl bg-[#1D9E75] hover:bg-[#178a64] px-6"
                >
                  {activeExercise.type === "challenge" ? "Done!" : "Complete"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* XP celebration overlay */}
      <AnimatePresence>
        {showComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)]"
              >
                <Check className="h-10 w-10 text-white" />
              </motion.div>
              <p className="text-xl font-bold text-white">+{xpGained} XP</p>
              <p className="text-sm text-white/60">Keep it up!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
