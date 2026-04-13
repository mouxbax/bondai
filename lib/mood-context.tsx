"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { OrbMood } from "@/components/companion/AIAHOrb";

interface MoodContextValue {
  mood: OrbMood;
  setMood: (mood: OrbMood) => void;
  theme: MoodTheme;
  isDay: boolean;
}

export interface MoodTheme {
  bgFrom: string;
  bgTo: string;
  accent: string;
  accentSoft: string;
  text: string;
  textMuted: string;
  ringColor: string;
}

const moodThemes: Record<OrbMood, MoodTheme> = {
  calm: {
    bgFrom: "from-emerald-50/60",
    bgTo: "to-teal-50/40",
    accent: "#1D9E75",
    accentSoft: "#E6F7EF",
    text: "text-stone-900 dark:text-stone-50",
    textMuted: "text-stone-500 dark:text-stone-400",
    ringColor: "ring-emerald-200/60",
  },
  happy: {
    bgFrom: "from-amber-50/60",
    bgTo: "to-orange-50/40",
    accent: "#F5B945",
    accentSoft: "#FEF3C7",
    text: "text-stone-900 dark:text-stone-50",
    textMuted: "text-stone-500 dark:text-stone-400",
    ringColor: "ring-amber-200/60",
  },
  anxious: {
    bgFrom: "from-violet-50/60",
    bgTo: "to-indigo-50/40",
    accent: "#8B5CF6",
    accentSoft: "#EDE9FE",
    text: "text-stone-900 dark:text-stone-50",
    textMuted: "text-stone-500 dark:text-stone-400",
    ringColor: "ring-violet-200/60",
  },
  sad: {
    bgFrom: "from-blue-50/60",
    bgTo: "to-slate-50/40",
    accent: "#4A7FA7",
    accentSoft: "#DBEAFE",
    text: "text-stone-900 dark:text-stone-50",
    textMuted: "text-stone-500 dark:text-stone-400",
    ringColor: "ring-blue-200/60",
  },
  focused: {
    bgFrom: "from-emerald-50/50",
    bgTo: "to-green-50/30",
    accent: "#0D7C6A",
    accentSoft: "#D1FAE5",
    text: "text-stone-900 dark:text-stone-50",
    textMuted: "text-stone-500 dark:text-stone-400",
    ringColor: "ring-emerald-300/60",
  },
  energetic: {
    bgFrom: "from-orange-50/60",
    bgTo: "to-red-50/40",
    accent: "#F97316",
    accentSoft: "#FFEDD5",
    text: "text-stone-900 dark:text-stone-50",
    textMuted: "text-stone-500 dark:text-stone-400",
    ringColor: "ring-orange-200/60",
  },
  tender: {
    bgFrom: "from-pink-50/60",
    bgTo: "to-rose-50/40",
    accent: "#EC4899",
    accentSoft: "#FCE7F3",
    text: "text-stone-900 dark:text-stone-50",
    textMuted: "text-stone-500 dark:text-stone-400",
    ringColor: "ring-pink-200/60",
  },
};

const MoodContext = createContext<MoodContextValue | null>(null);

export function MoodProvider({ children }: { children: ReactNode }) {
  const [mood, setMoodState] = useState<OrbMood>("calm");
  const [isDay, setIsDay] = useState(true);

  useEffect(() => {
    // Load stored mood
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("aiah-mood") as OrbMood | null;
      if (stored && stored in moodThemes) {
        setMoodState(stored);
      }
      const hour = new Date().getHours();
      setIsDay(hour >= 6 && hour < 19);
    }
  }, []);

  const setMood = (m: OrbMood) => {
    setMoodState(m);
    if (typeof window !== "undefined") {
      localStorage.setItem("aiah-mood", m);
      // Save timestamped entry for mood journal
      const entries = JSON.parse(localStorage.getItem("aiah-mood-log") || "[]") as Array<{
        mood: OrbMood;
        at: string;
      }>;
      entries.push({ mood: m, at: new Date().toISOString() });
      // Keep only last 200
      localStorage.setItem("aiah-mood-log", JSON.stringify(entries.slice(-200)));
    }
  };

  return (
    <MoodContext.Provider value={{ mood, setMood, theme: moodThemes[mood], isDay }}>
      {children}
    </MoodContext.Provider>
  );
}

export function useMood() {
  const ctx = useContext(MoodContext);
  if (!ctx) throw new Error("useMood must be used within MoodProvider");
  return ctx;
}

export function getMoodTheme(mood: OrbMood): MoodTheme {
  return moodThemes[mood];
}
