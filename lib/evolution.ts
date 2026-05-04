"use client";

/**
 * Companion Evolution System — Pokemon/Digimon-style progression.
 *
 * 7 stages gated by BOTH time (account age) AND EvoXP (from feeding).
 * Users must feed consistently over months to evolve.
 * You can't skip stages by buying tons of food — time gates force dedication.
 *
 * EvoXP comes ONLY from feeding. Energy is separate (plan generation only).
 */

export type EvolutionStage =
  | "egg"
  | "blob"
  | "sprout"
  | "cub"
  | "striker"
  | "guardian"
  | "ascended";

export interface StageDefinition {
  stage: EvolutionStage;
  label: string;
  description: string;
  emoji: string;
  /** Minimum EvoXP required to reach this stage */
  minEvoXp: number;
  /** Minimum account age in days to reach this stage */
  minDays: number;
}

export const STAGES: StageDefinition[] = [
  {
    stage: "egg",
    label: "Egg",
    description: "Something stirs within... Feed to awaken it.",
    emoji: "🥚",
    minEvoXp: 0,
    minDays: 0,
  },
  {
    stage: "blob",
    label: "Blob",
    description: "A tiny amorphous companion! It knows your name.",
    emoji: "🫧",
    minEvoXp: 50,     // ~10 feeds
    minDays: 3,
  },
  {
    stage: "sprout",
    label: "Sprout",
    description: "Growing limbs! Stubby arms wave at you.",
    emoji: "🌱",
    minEvoXp: 300,    // ~60 feeds
    minDays: 30,
  },
  {
    stage: "cub",
    label: "Cub",
    description: "A proper creature with hands and feet. Follows you around.",
    emoji: "🐾",
    minEvoXp: 1000,   // ~200 feeds
    minDays: 90,
  },
  {
    stage: "striker",
    label: "Striker",
    description: "Wings are growing! Can fly across the screen.",
    emoji: "🐉",
    minEvoXp: 2500,   // ~500 feeds
    minDays: 180,
  },
  {
    stage: "guardian",
    label: "Guardian",
    description: "A powerful protector. Aura radiates around it.",
    emoji: "🛡️",
    minEvoXp: 5000,   // ~1000 feeds
    minDays: 365,
  },
  {
    stage: "ascended",
    label: "Ascended",
    description: "Mythical. Transcendent. One with the universe.",
    emoji: "✨",
    minEvoXp: 10000,  // ~2000 feeds
    minDays: 540,
  },
];

// ─── EvoXP values per food rarity ─────────────────────────────────────
export const EVO_XP_BY_RARITY: Record<string, number> = {
  common: 5,
  rare: 15,
  legendary: 40,
};

// ─── LocalStorage keys ────────────────────────────────────────────────
const KEY_EVO_XP = "aiah-evo-xp";
const KEY_LAST_STAGE = "aiah-evolution-stage";
const KEY_HATCHED = "aiah-egg-hatched";
const KEY_ACCOUNT_CREATED = "aiah-account-created";

// ─── Helpers ──────────────────────────────────────────────────────────

function read<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const s = localStorage.getItem(k);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch { /* ignore */ }
}

// ─── EvoXP ────────────────────────────────────────────────────────────

export function getEvoXP(): number {
  return read<number>(KEY_EVO_XP, 0);
}

export function setEvoXP(value: number): void {
  write(KEY_EVO_XP, value);
}

export function addEvoXP(amount: number): number {
  const current = getEvoXP();
  const next = current + amount;
  write(KEY_EVO_XP, next);

  // Sync to server
  syncEvoXPToServer(next);

  return next;
}

/**
 * Fetch EvoXP + account age from server and seed localStorage.
 * Server DB is the source of truth — local is just a cache.
 */
export async function syncEvoXPFromServer(): Promise<{ evoXp: number; accountCreated: string } | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/pet/evo-xp");
    if (!res.ok) return null;
    const data = await res.json();

    // Server value wins — it's the source of truth
    const serverXP = data.evoXp ?? 0;
    const localXP = getEvoXP();
    // Use whichever is higher (handles edge case where local has un-synced feeds)
    const bestXP = Math.max(serverXP, localXP);
    write(KEY_EVO_XP, bestXP);

    // Seed account creation date from server
    if (data.accountCreated) {
      write(KEY_ACCOUNT_CREATED, data.accountCreated);
    }

    return { evoXp: bestXP, accountCreated: data.accountCreated };
  } catch {
    return null;
  }
}

/** Fire-and-forget sync to server DB */
function syncEvoXPToServer(evoXp: number) {
  if (typeof window === "undefined") return;
  fetch("/api/pet/evo-xp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ evoXp }),
  }).catch(() => { /* silent fail */ });
}

// ─── Account age ──────────────────────────────────────────────────────

export function getAccountAgeDays(): number {
  const created = read<string>(KEY_ACCOUNT_CREATED, "");
  if (!created) {
    // First time — set account creation date
    const now = new Date().toISOString();
    write(KEY_ACCOUNT_CREATED, now);
    return 0;
  }
  const ms = Date.now() - new Date(created).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export function setAccountCreatedDate(date: string) {
  write(KEY_ACCOUNT_CREATED, date);
}

// ─── Stage definitions ────────────────────────────────────────────────

export function getStageDefinitions(): StageDefinition[] {
  return STAGES;
}

// ─── Evolution info ───────────────────────────────────────────────────

export interface EvolutionInfo {
  stage: EvolutionStage;
  stageIndex: number;
  label: string;
  description: string;
  emoji: string;
  evoXp: number;
  accountDays: number;
  /** EvoXP needed for next stage (null if max) */
  nextStageEvoXp: number | null;
  /** Days needed for next stage (null if max) */
  nextStageDays: number | null;
  /** 0..1 progress toward next evolution (min of XP progress + time progress) */
  progress: number;
  /** What's blocking next evolution */
  blockReason: string | null;
}

export function getEvolutionInfo(): EvolutionInfo {
  const evoXp = getEvoXP();
  const days = getAccountAgeDays();

  // Find current stage (highest stage where both requirements met)
  let currentIdx = 0;
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (evoXp >= STAGES[i].minEvoXp && days >= STAGES[i].minDays) {
      currentIdx = i;
      break;
    }
  }

  const current = STAGES[currentIdx];
  const next = currentIdx < STAGES.length - 1 ? STAGES[currentIdx + 1] : null;

  let progress = 1;
  let blockReason: string | null = null;

  if (next) {
    const xpProgress = next.minEvoXp > current.minEvoXp
      ? Math.min(1, (evoXp - current.minEvoXp) / (next.minEvoXp - current.minEvoXp))
      : 1;
    const dayProgress = next.minDays > current.minDays
      ? Math.min(1, (days - current.minDays) / (next.minDays - current.minDays))
      : 1;

    // Progress is the MINIMUM — both gates must be met
    progress = Math.min(xpProgress, dayProgress);

    // Determine what's blocking
    if (xpProgress < 1 && dayProgress < 1) {
      blockReason = `Need ${next.minEvoXp - evoXp} more EvoXP and ${next.minDays - days} more days`;
    } else if (xpProgress < 1) {
      blockReason = `Need ${next.minEvoXp - evoXp} more EvoXP (keep feeding!)`;
    } else if (dayProgress < 1) {
      blockReason = `${next.minDays - days} days until evolution unlocks`;
    }
  }

  return {
    stage: current.stage,
    stageIndex: currentIdx,
    label: current.label,
    description: current.description,
    emoji: current.emoji,
    evoXp,
    accountDays: days,
    nextStageEvoXp: next?.minEvoXp ?? null,
    nextStageDays: next?.minDays ?? null,
    progress,
    blockReason,
  };
}

// ─── Egg hatching ─────────────────────────────────────────────────────

export function isEggHatched(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(KEY_HATCHED) === "true";
}

export function markEggHatched(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_HATCHED, "true");
}

// ─── Stage tracking (for detecting evolution events) ──────────────────

export function getLastSeenStage(): EvolutionStage {
  if (typeof window === "undefined") return "egg";
  return (localStorage.getItem(KEY_LAST_STAGE) as EvolutionStage) || "egg";
}

export function setLastSeenStage(stage: EvolutionStage): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_LAST_STAGE, stage);
}

/**
 * Check if an evolution just happened (stage is higher than last seen).
 * Returns the new stage if evolved, null otherwise.
 */
export function checkEvolution(): EvolutionStage | null {
  const info = getEvolutionInfo();
  const lastSeen = getLastSeenStage();
  const lastIdx = STAGES.findIndex((s) => s.stage === lastSeen);
  const currentIdx = info.stageIndex;

  if (currentIdx > lastIdx) {
    setLastSeenStage(info.stage);
    return info.stage;
  }
  return null;
}

// ─── Visual parameters per stage ──────────────────────────────────────

export function getStageVisuals(stage: EvolutionStage): {
  glowIntensity: number;
  breathSpeed: number;
  particleCount: number;
  auraOpacity: number;
  faceScale: number;
  orbScale: number;
  wingAnimation: boolean;
} {
  switch (stage) {
    case "egg":
      return { glowIntensity: 0.3, breathSpeed: 0.5, particleCount: 0, auraOpacity: 0, faceScale: 0, orbScale: 0.7, wingAnimation: false };
    case "blob":
      return { glowIntensity: 0.5, breathSpeed: 0.7, particleCount: 1, auraOpacity: 0.05, faceScale: 0.8, orbScale: 0.8, wingAnimation: false };
    case "sprout":
      return { glowIntensity: 0.7, breathSpeed: 0.9, particleCount: 2, auraOpacity: 0.12, faceScale: 0.9, orbScale: 0.9, wingAnimation: false };
    case "cub":
      return { glowIntensity: 0.85, breathSpeed: 1.0, particleCount: 3, auraOpacity: 0.2, faceScale: 1.0, orbScale: 1.0, wingAnimation: false };
    case "striker":
      return { glowIntensity: 1.0, breathSpeed: 1.1, particleCount: 4, auraOpacity: 0.3, faceScale: 1.0, orbScale: 1.05, wingAnimation: true };
    case "guardian":
      return { glowIntensity: 1.2, breathSpeed: 1.15, particleCount: 5, auraOpacity: 0.4, faceScale: 1.0, orbScale: 1.1, wingAnimation: true };
    case "ascended":
      return { glowIntensity: 1.5, breathSpeed: 1.3, particleCount: 8, auraOpacity: 0.6, faceScale: 1.0, orbScale: 1.15, wingAnimation: true };
  }
}
