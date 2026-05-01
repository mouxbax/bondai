/**
 * Companion mood decay system.
 *
 * Mood levels (best → worst): happy → content → lonely → sad
 * Drops 1 level per 24h of no interaction.
 * Interaction = feed, play (touch), visit companion page, spin wheel.
 */

export const MOOD_LEVELS = ["sad", "lonely", "content", "happy"] as const;
export type CompanionMood = (typeof MOOD_LEVELS)[number];

const DECAY_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Calculate current mood based on stored mood + time since last interaction.
 */
export function calculateCurrentMood(
  storedMood: string,
  lastInteraction: Date,
  decayRate: number = 1,
  now: Date = new Date(),
): CompanionMood {
  const idx = MOOD_LEVELS.indexOf(storedMood as CompanionMood);
  if (idx === -1) return "content"; // fallback

  const elapsed = now.getTime() - lastInteraction.getTime();
  const decaySteps = Math.floor(elapsed / DECAY_INTERVAL_MS) * decayRate;

  const newIdx = Math.max(0, idx - decaySteps);
  return MOOD_LEVELS[newIdx];
}

/**
 * Get emoji + label for a mood.
 */
export function moodDisplay(mood: CompanionMood): { emoji: string; label: string; color: string } {
  switch (mood) {
    case "happy":
      return { emoji: "😊", label: "Happy", color: "text-emerald-500" };
    case "content":
      return { emoji: "🙂", label: "Content", color: "text-blue-400" };
    case "lonely":
      return { emoji: "🥺", label: "Lonely", color: "text-amber-400" };
    case "sad":
      return { emoji: "😢", label: "Sad", color: "text-red-400" };
  }
}

/**
 * After interaction, mood improves by 1 level (or stays at happy).
 */
export function improveMood(currentMood: CompanionMood): CompanionMood {
  const idx = MOOD_LEVELS.indexOf(currentMood);
  return MOOD_LEVELS[Math.min(MOOD_LEVELS.length - 1, idx + 1)];
}
