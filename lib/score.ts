import type { ConnectionEventType } from "@prisma/client";

export const SCORE_MIN = 0;
export const SCORE_MAX = 100;

export function clampScore(n: number): number {
  return Math.min(SCORE_MAX, Math.max(SCORE_MIN, n));
}

export function pointsForEvent(type: ConnectionEventType): number {
  switch (type) {
    case "DAILY_CHECKIN":
      return 2;
    case "GOAL_COMPLETED":
      return 5;
    case "REAL_WORLD_INTERACTION":
      return 3;
    case "COACHING_COMPLETED":
      return 1;
    case "STREAK_7_BONUS":
      return 1;
    case "ONBOARDING_COMPLETE":
      return 10;
    case "STREAK_MILESTONE":
      return 1;
    default:
      return 0;
  }
}

/** Badge keys stored on ConnectionEvent.badgeKey and listed in UI. */
export const BADGE_KEYS = {
  FIRST_STEP: "FIRST_STEP",
  OPENING_UP: "OPENING_UP",
  WEEK_WARRIOR: "WEEK_WARRIOR",
  BRAVE: "BRAVE",
  OUT_THERE: "OUT_THERE",
  GOAL_GETTER: "GOAL_GETTER",
  SOCIAL_BUTTERFLY: "SOCIAL_BUTTERFLY",
} as const;

export type BadgeKey = (typeof BADGE_KEYS)[keyof typeof BADGE_KEYS];
