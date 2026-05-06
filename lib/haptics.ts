"use client";

/**
 * Haptics wrapper that uses Capacitor Haptics on iOS/Android native,
 * falls back to navigator.vibrate on web. No-ops gracefully when unavailable.
 *
 * Patterns:
 *  - tap: ultra-short single tap (button press, confirm)
 *  - pop: short double — small reward (quest done, habit check)
 *  - success: triple beat — big reward (achievement, streak)
 *  - error: heavy buzz — something broke
 *  - warning: double medium — caution
 *  - purr: soft repeating vibration for petting the orb (cat purr feel)
 */

type HapticPattern = "tap" | "pop" | "success" | "error" | "warning" | "purr";

// Web fallback patterns (navigator.vibrate)
const WEB_PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 10,
  pop: [10, 40, 15],
  success: [12, 50, 20, 50, 28],
  error: 80,
  warning: [30, 80, 30],
  purr: [8, 60, 8, 60, 8, 60, 8, 60, 8, 60, 8, 60, 8], // soft repeating
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

// Capacitor Haptics dynamic import (tree-shaken away on web)
// We use `any` for the plugin type because the Capacitor Haptics
// plugin uses specific enums (ImpactStyle, NotificationType) and
// we call them dynamically with string values that map to those enums.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let capacitorHaptics: any = null;
let capacitorLoaded = false;

async function getCapacitorHaptics() {
  if (capacitorLoaded) return capacitorHaptics;
  capacitorLoaded = true;
  try {
    const mod = await import("@capacitor/haptics");
    if (mod?.Haptics) {
      capacitorHaptics = mod.Haptics;
    }
  } catch {
    // Not in a Capacitor environment — fall back to web
  }
  return capacitorHaptics;
}

// Eagerly load on startup
if (typeof window !== "undefined") {
  getCapacitorHaptics();
}

// ─── Purr state (repeating haptic while finger is on orb) ──────────────────
let purrInterval: ReturnType<typeof setInterval> | null = null;

async function startCapacitorPurr() {
  const h = await getCapacitorHaptics();
  if (!h) return;
  // Fire immediately + repeat
  h.impact({ style: "LIGHT" }).catch(() => {});
  purrInterval = setInterval(() => {
    h.impact({ style: "LIGHT" }).catch(() => {});
  }, 120); // ~8 per second, very soft
}

function startWebPurr() {
  type NavWithVibrate = Navigator & { vibrate?: (p: number | number[]) => boolean };
  const nav = navigator as NavWithVibrate;
  if (typeof nav.vibrate !== "function") return;
  // Vibrate the full purr pattern
  nav.vibrate(WEB_PATTERNS.purr as number[]);
  // Repeat pattern since navigator.vibrate doesn't loop
  purrInterval = setInterval(() => {
    nav.vibrate(WEB_PATTERNS.purr as number[]);
  }, 900);
}

export function stopPurr(): void {
  if (purrInterval) {
    clearInterval(purrInterval);
    purrInterval = null;
  }
  // Cancel any ongoing web vibration
  if (typeof navigator !== "undefined") {
    type NavWithVibrate = Navigator & { vibrate?: (p: number | number[]) => boolean };
    const nav = navigator as NavWithVibrate;
    if (typeof nav.vibrate === "function") {
      try { nav.vibrate(0); } catch { /* no-op */ }
    }
  }
}

// ─── Main haptic function ──────────────────────────────────────────────────
export async function haptic(pattern: HapticPattern = "tap"): Promise<void> {
  if (typeof navigator === "undefined") return;
  if (prefersReducedMotion()) return;

  // Purr is special — it starts a repeating loop
  if (pattern === "purr") {
    if (purrInterval) return; // already purring
    const h = await getCapacitorHaptics();
    if (h) {
      startCapacitorPurr();
    } else {
      startWebPurr();
    }
    return;
  }

  // Try Capacitor first (native iOS/Android)
  const h = await getCapacitorHaptics();
  if (h) {
    try {
      switch (pattern) {
        case "tap":
          await h.impact({ style: "LIGHT" });
          break;
        case "pop":
          await h.impact({ style: "MEDIUM" });
          break;
        case "success":
          await h.notification({ type: "SUCCESS" });
          break;
        case "error":
          await h.notification({ type: "ERROR" });
          break;
        case "warning":
          await h.notification({ type: "WARNING" });
          break;
      }
    } catch {
      // Fall through to web
    }
    return;
  }

  // Web fallback
  type NavWithVibrate = Navigator & { vibrate?: (p: number | number[]) => boolean };
  const nav = navigator as NavWithVibrate;
  if (typeof nav.vibrate !== "function") return;
  try {
    nav.vibrate(WEB_PATTERNS[pattern]);
  } catch {
    /* no-op */
  }
}
