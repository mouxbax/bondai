"use client";

/**
 * Bridge to the native iOS Live Activity (Dynamic Island).
 * Uses Capacitor's plugin system to call the native LiveActivityPlugin.
 * No-ops gracefully on web / Android / older iOS.
 */

interface LiveActivityState {
  status: string;       // e.g., "Breathing · Box 4-4-4-4"
  progress: number;     // 0.0 - 1.0
  icon: string;         // emoji or SF Symbol name
  accentHex?: string;   // e.g., "#1D9E75"
  mood?: string;        // orb mood
  activityType?: string; // "breathing" | "focus" | "daily" | "goal"
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pluginRef: any = null;
let pluginLoaded = false;

async function getPlugin() {
  if (pluginLoaded) return pluginRef;
  pluginLoaded = true;
  try {
    // Capacitor registers custom plugins on the global Capacitor object
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { registerPlugin } = await import("@capacitor/core");
      pluginRef = registerPlugin("LiveActivity");
    }
  } catch {
    // Not in Capacitor — web environment
  }
  return pluginRef;
}

/**
 * Check if Live Activities are available on this device.
 */
export async function isLiveActivityAvailable(): Promise<boolean> {
  try {
    const plugin = await getPlugin();
    if (!plugin) return false;
    const result = await plugin.isAvailable();
    return result?.available === true;
  } catch {
    return false;
  }
}

/**
 * Start a Live Activity (shows in Dynamic Island + Lock Screen).
 */
export async function startLiveActivity(state: LiveActivityState): Promise<string | null> {
  try {
    const plugin = await getPlugin();
    if (!plugin) return null;
    const result = await plugin.start({
      status: state.status,
      progress: state.progress,
      icon: state.icon,
      accentHex: state.accentHex ?? "#1D9E75",
      mood: state.mood ?? "calm",
      activityType: state.activityType ?? "daily",
    });
    return result?.id ?? null;
  } catch (err) {
    console.warn("[LiveActivity] Failed to start:", err);
    return null;
  }
}

/**
 * Update the currently running Live Activity.
 */
export async function updateLiveActivity(state: Partial<LiveActivityState>): Promise<void> {
  try {
    const plugin = await getPlugin();
    if (!plugin) return;
    await plugin.update({
      status: state.status ?? "AIAH is active",
      progress: state.progress ?? 0,
      icon: state.icon ?? "✨",
      accentHex: state.accentHex ?? "#1D9E75",
    });
  } catch (err) {
    console.warn("[LiveActivity] Failed to update:", err);
  }
}

/**
 * Stop all AIAH Live Activities.
 */
export async function stopLiveActivity(): Promise<void> {
  try {
    const plugin = await getPlugin();
    if (!plugin) return;
    await plugin.stop({});
  } catch (err) {
    console.warn("[LiveActivity] Failed to stop:", err);
  }
}
