"use client";

/**
 * Tiny haptics wrapper. No-ops when:
 * - Not in browser
 * - Vibration API missing (iOS Safari PWA without support)
 * - User has set reduced-motion preference
 *
 * Patterns are intentionally short — haptics must feel like a reflex, not a buzz.
 */

type HapticPattern =
  | "tap" // 10ms — any confirm (message send, button tap)
  | "pop" // short-double — small reward (quest/habit done)
  | "success" // longer tri-beat — big reward (streak, achievement unlock)
  | "error" // long buzz — something broke
  | "warning"; // double-medium — crisis / caution

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 10,
  pop: [10, 40, 15],
  success: [12, 50, 20, 50, 28],
  error: 80,
  warning: [30, 80, 30],
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

type NavWithVibrate = Navigator & { vibrate?: (p: number | number[]) => boolean };

export function haptic(pattern: HapticPattern = "tap"): void {
  if (typeof navigator === "undefined") return;
  if (prefersReducedMotion()) return;
  const nav = navigator as NavWithVibrate;
  if (typeof nav.vibrate !== "function") return;
  try {
    nav.vibrate(PATTERNS[pattern]);
  } catch {
    /* no-op */
  }
}
