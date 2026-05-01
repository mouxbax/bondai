"use client";

import { getXPState, type XPState } from "./gamification";

/**
 * Companion evolution system.
 * Stages are tied to XP level — no separate progression.
 * Each stage changes the orb's visual identity.
 */

export type EvolutionStage = "egg" | "hatchling" | "young" | "adult" | "ascended";

export interface EvolutionInfo {
  stage: EvolutionStage;
  stageIndex: number; // 0-4
  label: string;
  description: string;
  emoji: string;
  /** Level required to reach this stage */
  minLevel: number;
  /** Level required for the NEXT stage (null if max) */
  nextStageLevel: number | null;
  /** 0..1 progress toward next evolution */
  progress: number;
}

interface StageDefinition {
  stage: EvolutionStage;
  label: string;
  description: string;
  emoji: string;
  minLevel: number;
}

const STAGES: StageDefinition[] = [
  { stage: "egg",       label: "Egg",       description: "Something stirs within...",              emoji: "🥚", minLevel: 0 },
  { stage: "hatchling", label: "Hatchling", description: "A tiny companion has emerged!",          emoji: "🐣", minLevel: 2 },
  { stage: "young",     label: "Young",     description: "Growing curious and playful.",           emoji: "🌱", minLevel: 5 },
  { stage: "adult",     label: "Adult",     description: "A loyal, wise companion by your side.",  emoji: "🌟", minLevel: 10 },
  { stage: "ascended",  label: "Ascended",  description: "Radiant. Transcendent. One with you.",   emoji: "✨", minLevel: 20 },
];

const KEY_HATCHED = "aiah-egg-hatched";
const KEY_LAST_STAGE = "aiah-evolution-stage";

export function getStageDefinitions(): StageDefinition[] {
  return STAGES;
}

export function getEvolutionInfo(xpState?: XPState): EvolutionInfo {
  const state = xpState ?? getXPState();
  const level = state.level;

  let currentIdx = 0;
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (level >= STAGES[i].minLevel) {
      currentIdx = i;
      break;
    }
  }

  const current = STAGES[currentIdx];
  const next = currentIdx < STAGES.length - 1 ? STAGES[currentIdx + 1] : null;

  // Progress toward next evolution
  let progress = 1;
  if (next) {
    const levelsInStage = next.minLevel - current.minLevel;
    const levelsCompleted = level - current.minLevel;
    progress = Math.min(1, levelsCompleted / levelsInStage);
  }

  return {
    stage: current.stage,
    stageIndex: currentIdx,
    label: current.label,
    description: current.description,
    emoji: current.emoji,
    minLevel: current.minLevel,
    nextStageLevel: next?.minLevel ?? null,
    progress,
  };
}

/** Check if egg has been "hatched" (first interaction done) */
export function isEggHatched(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(KEY_HATCHED) === "true";
}

/** Mark egg as hatched */
export function markEggHatched(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_HATCHED, "true");
}

/** Get the last seen evolution stage (for detecting evolution events) */
export function getLastSeenStage(): EvolutionStage {
  if (typeof window === "undefined") return "egg";
  return (localStorage.getItem(KEY_LAST_STAGE) as EvolutionStage) || "egg";
}

/** Update the last seen stage */
export function setLastSeenStage(stage: EvolutionStage): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_LAST_STAGE, stage);
}

/**
 * Check if an evolution just happened (stage is higher than last seen).
 * Returns the new stage if evolved, null otherwise.
 * Automatically updates lastSeenStage.
 */
export function checkEvolution(): EvolutionStage | null {
  const info = getEvolutionInfo();
  const lastSeen = getLastSeenStage();
  const lastIdx = STAGES.findIndex((s) => s.stage === lastSeen);
  const currentIdx = STAGES.findIndex((s) => s.stage === info.stage);

  if (currentIdx > lastIdx) {
    setLastSeenStage(info.stage);
    return info.stage;
  }
  return null;
}

/** Visual multipliers per stage — used by the orb to scale its appearance */
export function getStageVisuals(stage: EvolutionStage): {
  glowIntensity: number;
  breathSpeed: number;
  particleCount: number;
  auraOpacity: number;
  faceScale: number;
} {
  switch (stage) {
    case "egg":
      return { glowIntensity: 0.3, breathSpeed: 0.5, particleCount: 0, auraOpacity: 0, faceScale: 0 };
    case "hatchling":
      return { glowIntensity: 0.6, breathSpeed: 0.8, particleCount: 2, auraOpacity: 0.1, faceScale: 0.85 };
    case "young":
      return { glowIntensity: 0.8, breathSpeed: 1.0, particleCount: 3, auraOpacity: 0.2, faceScale: 1.0 };
    case "adult":
      return { glowIntensity: 1.0, breathSpeed: 1.0, particleCount: 4, auraOpacity: 0.3, faceScale: 1.0 };
    case "ascended":
      return { glowIntensity: 1.4, breathSpeed: 1.2, particleCount: 6, auraOpacity: 0.5, faceScale: 1.0 };
  }
}
