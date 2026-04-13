"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMood } from "@/lib/mood-context";
import { AIAHOrb } from "@/components/companion/AIAHOrb";
import { addMoodEntry, getMoodEntries, type MoodEntry } from "@/lib/life-storage";
import { awardXP, checkAchievements } from "@/lib/gamification";
import { useCelebrate } from "@/components/fx/Celebration";
import type { OrbMood } from "@/components/companion/AIAHOrb";

const moods: { id: OrbMood; emoji: string; label: string }[] = [
  { id: "calm", emoji: "🌿", label: "Calm" },
  { id: "happy", emoji: "☀️", label: "Happy" },
  { id: "focused", emoji: "🎯", label: "Focused" },
  { id: "energetic", emoji: "🔥", label: "Energized" },
  { id: "tender", emoji: "💗", label: "Tender" },
  { id: "anxious", emoji: "🌀", label: "Anxious" },
  { id: "sad", emoji: "🌧️", label: "Low" },
];

export function MoodJournal() {
  const { mood, setMood, theme } = useMood();
  const celebrate = useCelebrate();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setEntries(getMoodEntries().slice().reverse());
  }, []);

  const handleSave = () => {
    const entry = addMoodEntry(mood, note.trim() || undefined);
    setEntries([entry, ...entries]);
    setNote("");
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
    const result = awardXP("mood_log");
    const newAch = checkAchievements();
    celebrate(
      result,
      newAch.map((a) => ({ emoji: a.emoji, name: a.name, description: a.description })),
    );
  };

  return (
    <div className={`relative flex flex-1 flex-col bg-gradient-to-b ${theme.bgFrom} ${theme.bgTo}`}>
      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8">
        <div className="flex flex-col items-center gap-4">
          <AIAHOrb mood={mood} size={140} />
          <h2 className={`text-xl font-semibold ${theme.text}`}>How are you feeling right now?</h2>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {moods.map((m) => {
            const active = mood === m.id;
            return (
              <motion.button
                key={m.id}
                onClick={() => setMood(m.id)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-stone-900 bg-stone-900 text-white dark:border-stone-50 dark:bg-stone-50 dark:text-stone-900"
                    : "border-stone-200 bg-white/70 text-stone-700 backdrop-blur hover:bg-white dark:border-stone-700 dark:bg-stone-900/70 dark:text-stone-300"
                }`}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl bg-white/70 p-4 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-stone-900/60">
          <label className={`text-xs font-medium ${theme.textMuted}`}>Optional note</label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's going on? (one line is enough)"
            className="mt-2 min-h-[80px] resize-none rounded-xl"
          />
          <div className="mt-3 flex items-center justify-between">
            <AnimatePresence>
              {saved && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-emerald-600 dark:text-emerald-400"
                >
                  Saved ✓
                </motion.span>
              )}
            </AnimatePresence>
            <Button onClick={handleSave} className="ml-auto rounded-xl">
              Log mood
            </Button>
          </div>
        </div>

        {/* History */}
        <div className="mt-8">
          <h3 className={`mb-3 text-sm font-semibold ${theme.text}`}>Recent entries</h3>
          {entries.length === 0 ? (
            <p className={`text-sm ${theme.textMuted}`}>No entries yet. Your first one is above.</p>
          ) : (
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {entries.slice(0, 20).map((e) => {
                  const m = moods.find((x) => x.id === e.mood);
                  const d = new Date(e.at);
                  return (
                    <motion.li
                      key={e.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-3 rounded-xl bg-white/70 p-3 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-stone-900/60"
                    >
                      <span className="text-xl">{m?.emoji ?? "•"}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${theme.text}`}>{m?.label ?? e.mood}</span>
                          <span className={`text-xs ${theme.textMuted}`}>
                            {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}{" "}
                            {d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        {e.note && <p className={`mt-1 text-xs ${theme.textMuted}`}>{e.note}</p>}
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
        <div className="h-24" />
      </div>
    </div>
  );
}
