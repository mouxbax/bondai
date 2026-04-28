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

const darkMoodThemes: Record<string, MoodTheme> = {
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

const lightMoodThemes: Record<string, MoodTheme> = {
  calm: {
    bgFrom: "from-[#F0FAF6]",
    bgTo: "to-[#E8F5EF]",
    accent: "#0D9668",
    accentSoft: "#D1FAE5",
    text: "text-stone-900",
    textMuted: "text-stone-500",
    ringColor: "ring-emerald-500/30",
  },
  happy: {
    bgFrom: "from-[#FFFBEB]",
    bgTo: "to-[#FEF3C7]",
    accent: "#D97706",
    accentSoft: "#FEF3C7",
    text: "text-stone-900",
    textMuted: "text-stone-500",
    ringColor: "ring-amber-400/30",
  },
  anxious: {
    bgFrom: "from-[#F5F3FF]",
    bgTo: "to-[#EDE9FE]",
    accent: "#7C3AED",
    accentSoft: "#EDE9FE",
    text: "text-stone-900",
    textMuted: "text-stone-500",
    ringColor: "ring-violet-400/30",
  },
  sad: {
    bgFrom: "from-[#EFF6FF]",
    bgTo: "to-[#DBEAFE]",
    accent: "#2563EB",
    accentSoft: "#DBEAFE",
    text: "text-stone-900",
    textMuted: "text-stone-500",
    ringColor: "ring-blue-400/30",
  },
  focused: {
    bgFrom: "from-[#ECFDF5]",
    bgTo: "to-[#D1FAE5]",
    accent: "#059669",
    accentSoft: "#D1FAE5",
    text: "text-stone-900",
    textMuted: "text-stone-500",
    ringColor: "ring-emerald-400/30",
  },
  energetic: {
    bgFrom: "from-[#FFF7ED]",
    bgTo: "to-[#FFEDD5]",
    accent: "#EA580C",
    accentSoft: "#FFEDD5",
    text: "text-stone-900",
    textMuted: "text-stone-500",
    ringColor: "ring-orange-400/30",
  },
  tender: {
    bgFrom: "from-[#FDF2F8]",
    bgTo: "to-[#FCE7F3]",
    accent: "#DB2777",
    accentSoft: "#FCE7F3",
    text: "text-stone-900",
    textMuted: "text-stone-500",
    ringColor: "ring-pink-400/30",
  },
};

function getMoodThemes(isDark: boolean): Record<string, MoodTheme> {
  return isDark ? darkMoodThemes : lightMoodThemes;
}

const MoodContext = createContext<MoodContextValue | null>(null);

export function MoodProvider({ children }: { children: ReactNode }) {
  const [mood, setMoodState] = useState<OrbMood>("calm");
  const [isDay, setIsDay] = useState(true);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load stored mood
      const stored = localStorage.getItem("aiah-mood") as OrbMood | null;
      if (stored && stored in darkMoodThemes) {
        setMoodState(stored);
      }
      const hour = new Date().getHours();
      setIsDay(hour >= 6 && hour < 19);

      // Detect dark/light mode
      const checkDark = () => setIsDark(document.documentElement.classList.contains("dark"));
      checkDark();
      const observer = new MutationObserver(checkDark);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      return () => observer.disconnect();
    }
  }, []);

  const setMood = (m: OrbMood) => {
    setMoodState(m);
    if (typeof window !== "undefined") {
      localStorage.setItem("aiah-mood", m);
      const entries = JSON.parse(localStorage.getItem("aiah-mood-log") || "[]") as Array<{
        mood: OrbMood;
        at: string;
      }>;
      entries.push({ mood: m, at: new Date().toISOString() });
      localStorage.setItem("aiah-mood-log", JSON.stringify(entries.slice(-200)));
    }
  };

  const themes = getMoodThemes(isDark);
  const theme = themes[mood] ?? themes.calm;

  return (
    <MoodContext.Provider value={{ mood, setMood, theme, isDay }}>
      {children}
    </MoodContext.Provider>
  );
}

export function useMood() {
  const ctx = useContext(MoodContext);
  if (!ctx) throw new Error("useMood must be used within MoodProvider");
  return ctx;
}

export function getMoodTheme(mood: OrbMood, isDark = true): MoodTheme {
  const themes = getMoodThemes(isDark);
  return themes[mood] ?? themes.calm;
}
