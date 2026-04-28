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
    bgFrom: "from-[#0b1210]",
    bgTo: "to-[#0f1a16]",
    accent: "#2dd4a3",
    accentSoft: "#1a3d32",
    text: "text-stone-100",
    textMuted: "text-stone-400",
    ringColor: "ring-emerald-500/40",
  },
  happy: {
    bgFrom: "from-[#121008]",
    bgTo: "to-[#1a1508]",
    accent: "#fbbf24",
    accentSoft: "#3d3210",
    text: "text-stone-100",
    textMuted: "text-stone-400",
    ringColor: "ring-amber-400/40",
  },
  anxious: {
    bgFrom: "from-[#0d0b14]",
    bgTo: "to-[#13101f]",
    accent: "#a78bfa",
    accentSoft: "#2d2450",
    text: "text-stone-100",
    textMuted: "text-stone-400",
    ringColor: "ring-violet-400/40",
  },
  sad: {
    bgFrom: "from-[#090d12]",
    bgTo: "to-[#0c1118]",
    accent: "#60a5fa",
    accentSoft: "#1a2e4a",
    text: "text-stone-100",
    textMuted: "text-stone-400",
    ringColor: "ring-blue-400/40",
  },
  focused: {
    bgFrom: "from-[#091210]",
    bgTo: "to-[#0c1a15]",
    accent: "#34d399",
    accentSoft: "#163d2f",
    text: "text-stone-100",
    textMuted: "text-stone-400",
    ringColor: "ring-emerald-400/40",
  },
  energetic: {
    bgFrom: "from-[#120b08]",
    bgTo: "to-[#1a0f08]",
    accent: "#fb923c",
    accentSoft: "#3d2010",
    text: "text-stone-100",
    textMuted: "text-stone-400",
    ringColor: "ring-orange-400/40",
  },
  tender: {
    bgFrom: "from-[#12080d]",
    bgTo: "to-[#1a0c14]",
    accent: "#f472b6",
    accentSoft: "#3d1028",
    text: "text-stone-100",
    textMuted: "text-stone-400",
    ringColor: "ring-pink-400/40",
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
