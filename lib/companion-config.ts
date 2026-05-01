"use client";

export type CompanionVibe = "calm_coach" | "hype_friend" | "tender_listener" | "sharp_strategist" | "playful_spark";

export interface CompanionConfig {
  name: string;
  vibe: CompanionVibe;
  soundEnabled: boolean;
  ambientSound: "none" | "rain" | "ocean" | "lofi" | "forest";
  setupComplete: boolean;
}

export const VIBES: Record<CompanionVibe, { label: string; desc: string; emoji: string }> = {
  calm_coach: {
    label: "Calm coach",
    desc: "Grounded, patient, quietly challenging",
    emoji: "🌿",
  },
  hype_friend: {
    label: "Hype friend",
    desc: "Big energy, cheers every win",
    emoji: "🔥",
  },
  tender_listener: {
    label: "Tender listener",
    desc: "Soft, spacious, holds whatever you bring",
    emoji: "💗",
  },
  sharp_strategist: {
    label: "Sharp strategist",
    desc: "Blunt, tactical, no fluff",
    emoji: "🎯",
  },
  playful_spark: {
    label: "Playful spark",
    desc: "Curious, witty, keeps it light",
    emoji: "✨",
  },
};

const KEY = "aiah-companion-config";

const DEFAULT: CompanionConfig = {
  name: "AIAH",
  vibe: "calm_coach",
  soundEnabled: true,
  ambientSound: "none",
  setupComplete: false,
};

export function getCompanionConfig(): CompanionConfig {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return DEFAULT;
    return { ...DEFAULT, ...(JSON.parse(s) as Partial<CompanionConfig>) };
  } catch {
    return DEFAULT;
  }
}

export function setCompanionConfig(patch: Partial<CompanionConfig>): CompanionConfig {
  const current = getCompanionConfig();
  const next = { ...current, ...patch };
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(next));
  }
  return next;
}
