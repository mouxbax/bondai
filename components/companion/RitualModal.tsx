"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { AIAHOrb } from "@/components/companion/AIAHOrb";
import { useMood } from "@/lib/mood-context";
import { addMoodEntry } from "@/lib/life-storage";
import { awardXP, checkAchievements } from "@/lib/gamification";
import { getTodayQuests } from "@/lib/quests";
import { useCelebrate } from "@/components/fx/Celebration";
import { haptic } from "@/lib/haptics";
import { sfx } from "@/lib/sfx";
import type { OrbMood } from "@/components/companion/AIAHOrb";

type RitualKind = "morning" | "evening";

const KEY_LAST = "aiah-ritual-last";

interface LastRitual {
  morning?: string;
  evening?: string;
}

function getLast(): LastRitual {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY_LAST) || "{}") as LastRitual;
  } catch {
    return {};
  }
}

function setLast(patch: LastRitual) {
  if (typeof window === "undefined") return;
  const current = getLast();
  localStorage.setItem(KEY_LAST, JSON.stringify({ ...current, ...patch }));
}

const moods: { id: OrbMood; emoji: string; label: string }[] = [
  { id: "calm", emoji: "🌿", label: "Calm" },
  { id: "happy", emoji: "☀️", label: "Happy" },
  { id: "focused", emoji: "🎯", label: "Focused" },
  { id: "energetic", emoji: "🔥", label: "Energized" },
  { id: "tender", emoji: "💗", label: "Tender" },
  { id: "anxious", emoji: "🌀", label: "Anxious" },
  { id: "sad", emoji: "🌧️", label: "Low" },
];

export function RitualModal() {
  const { mood, setMood, theme } = useMood();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<RitualKind>("morning");
  const [step, setStep] = useState(0);
  const [reflection, setReflection] = useState("");
  const celebrate = useCelebrate();

  useEffect(() => {
    // Check if a ritual is due
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const hour = now.getHours();
    const last = getLast();

    // Don't auto-trigger immediately on first load - wait a moment
    const timer = setTimeout(() => {
      if (hour >= 5 && hour < 12 && last.morning !== today) {
        setKind("morning");
        setStep(0);
        setOpen(true);
      } else if (hour >= 20 && hour < 28 && last.evening !== today) {
        setKind("evening");
        setStep(0);
        setOpen(true);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      setStep(0);
      setReflection("");
    }, 300);
  };

  const complete = () => {
    const today = new Date().toISOString().slice(0, 10);
    if (kind === "morning") {
      setLast({ morning: today });
    } else {
      setLast({ evening: today });
      if (reflection.trim()) {
        addMoodEntry(mood, reflection.trim());
      }
    }
    const result = awardXP("daily_checkin");
    const newAch = checkAchievements();
    close();
    setTimeout(
      () =>
        celebrate(
          result,
          newAch.map((a) => ({ emoji: a.emoji, name: a.name, description: a.description })),
        ),
      400,
    );
  };

  const quests = kind === "morning" ? getTodayQuests().slice(0, 3) : [];

  const advance = (to: number) => {
    haptic("tap");
    sfx.chime();
    setStep(to);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={close}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: "spring", stiffness: 360, damping: 28, mass: 0.6 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-stone-900"
          >
            <button
              onClick={close}
              className="absolute right-3 top-3 z-10 rounded-lg p-1 text-stone-500 transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div
              className={`relative bg-gradient-to-b ${theme.bgFrom} ${theme.bgTo} p-6`}
            >
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3 text-center"
                >
                  <AIAHOrb mood={mood} size={120} />
                  <p className={`text-xs uppercase tracking-widest ${theme.textMuted}`}>
                    {kind === "morning" ? "Morning check-in" : "Evening reflection"}
                  </p>
                  <h2 className={`text-2xl font-semibold ${theme.text}`}>
                    {kind === "morning" ? "Let's start the day together" : "How did today land?"}
                  </h2>
                  <p className={`text-sm ${theme.textMuted}`}>
                    {kind === "morning"
                      ? "A quick mood check, then I'll show you today's wins."
                      : "A pause before you close the day."}
                  </p>
                  <motion.button
                    onClick={() => advance(1)}
                    whileTap={{ scale: 0.94 }}
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="mt-4 flex items-center gap-2 rounded-full bg-[#1D9E75] px-6 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(29,158,117,0.55)] hover:bg-[#0f6b4f]"
                  >
                    Begin <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <p className={`text-xs uppercase tracking-widest ${theme.textMuted}`}>Step 1</p>
                  <h3 className={`text-xl font-semibold ${theme.text}`}>How do you feel right now?</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {moods.map((m) => {
                      const active = mood === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setMood(m.id)}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm transition-colors ${
                            active
                              ? "border-stone-900 bg-stone-900 text-white dark:border-stone-50 dark:bg-stone-50 dark:text-stone-900"
                              : "border-stone-200 dark:border-stone-700"
                          }`}
                        >
                          <span>{m.emoji}</span>
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <motion.button
                    onClick={() => advance(2)}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(29,158,117,0.5)] hover:bg-[#0f6b4f]"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </motion.div>
              )}

              {step === 2 && kind === "morning" && (
                <motion.div key="step2m" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <p className={`text-xs uppercase tracking-widest ${theme.textMuted}`}>Your focus</p>
                  <h3 className={`text-xl font-semibold ${theme.text}`}>3 things that matter today</h3>
                  <div className="mt-4 space-y-2">
                    {quests.length === 0 ? (
                      <p className={`text-sm ${theme.textMuted}`}>
                        No active quests. Add habits or focus tasks to generate some.
                      </p>
                    ) : (
                      quests.map((q, i) => (
                        <div
                          key={q.id}
                          className="flex items-center gap-3 rounded-xl bg-white/70 p-3 dark:bg-stone-900/60"
                        >
                          <div className="text-xl">{q.emoji}</div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium ${theme.text}`}>{q.title}</p>
                            <p className={`text-[10px] ${theme.textMuted}`}>Quest #{i + 1}</p>
                          </div>
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                            +{q.xp}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  <button
                    onClick={complete}
                    className="mt-6 w-full rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white hover:bg-[#0f6b4f]"
                  >
                    Let&apos;s go
                  </button>
                </motion.div>
              )}

              {step === 2 && kind === "evening" && (
                <motion.div key="step2e" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <p className={`text-xs uppercase tracking-widest ${theme.textMuted}`}>One thing</p>
                  <h3 className={`text-xl font-semibold ${theme.text}`}>
                    What&apos;s one thing worth remembering?
                  </h3>
                  <textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="A moment, a thought, anything."
                    autoFocus
                    className="mt-4 min-h-[100px] w-full resize-none rounded-xl border border-stone-200 bg-white p-3 text-sm outline-none focus:border-[#1D9E75] dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                  />
                  <button
                    onClick={complete}
                    className="mt-4 w-full rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white hover:bg-[#0f6b4f]"
                  >
                    Close the day
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
