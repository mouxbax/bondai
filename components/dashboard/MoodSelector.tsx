"use client";

import { motion } from "framer-motion";
import { useMood } from "@/lib/mood-context";
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

export function MoodSelector() {
  const { mood, setMood } = useMood();

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {moods.map((m, i) => {
        const active = mood === m.id;
        return (
          <motion.button
            key={m.id}
            onClick={() => setMood(m.id)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.04, duration: 0.35 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "border-stone-900 bg-stone-900 text-white dark:border-stone-50 dark:bg-stone-50 dark:text-stone-900"
                : "border-stone-200 bg-white/60 text-stone-700 backdrop-blur hover:bg-white dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-300"
            }`}
            aria-pressed={active}
          >
            <span className="text-sm">{m.emoji}</span>
            <span>{m.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
