"use client";

/**
 * Live Activity bridge — controls Dynamic Island from the web app.
 *
 * When running inside Capacitor (native iOS), this calls the real
 * LiveActivityPlugin. When running in a browser, it gracefully no-ops.
 *
 * Usage:
 *   import { liveActivity } from '@/lib/native/live-activity';
 *   await liveActivity.start({ companionName: 'AIAH', mood: 'calm', ... });
 *   await liveActivity.update({ mood: 'happy', streakCount: 5 });
 *   await liveActivity.end();
 */

interface LiveActivityState {
  companionName?: string;
  evolutionStage?: string;
  mood?: string;
  emoji?: string;
  streakCount?: number;
  energyPercent?: number;
  xpLevel?: number;
  message?: string;
}

// Capacitor injects window.Capacitor when running in a native shell
function getPlugin(): { call: (method: string, args?: Record<string, unknown>) => Promise<unknown> } | null {
  if (typeof window === "undefined") return null;
  const cap = (window as unknown as Record<string, unknown>).Capacitor as
    | { Plugins?: Record<string, unknown> }
    | undefined;
  if (!cap?.Plugins) return null;
  const plugin = cap.Plugins.LiveActivity as
    | { call: (method: string, args?: Record<string, unknown>) => Promise<unknown> }
    | undefined;
  return plugin ?? null;
}

// Simpler approach: use Capacitor.registerPlugin pattern
function callNative(method: string, args?: Record<string, unknown>): Promise<unknown> {
  const plugin = getPlugin();
  if (!plugin) return Promise.resolve(null);
  return plugin.call(method, args);
}

export const liveActivity = {
  /** Check if Dynamic Island is available on this device */
  async isSupported(): Promise<boolean> {
    try {
      const result = (await callNative("isSupported")) as { supported?: boolean } | null;
      return result?.supported ?? false;
    } catch {
      return false;
    }
  },

  /** Start showing on Dynamic Island */
  async start(state: LiveActivityState): Promise<string | null> {
    try {
      const result = (await callNative("start", state as Record<string, unknown>)) as {
        activityId?: string;
      } | null;
      return result?.activityId ?? null;
    } catch (e) {
      console.warn("[LiveActivity] start failed:", e);
      return null;
    }
  },

  /** Update the Dynamic Island content */
  async update(state: Partial<LiveActivityState>): Promise<boolean> {
    try {
      await callNative("update", state as Record<string, unknown>);
      return true;
    } catch (e) {
      console.warn("[LiveActivity] update failed:", e);
      return false;
    }
  },

  /** Remove from Dynamic Island */
  async end(): Promise<void> {
    try {
      await callNative("end");
    } catch (e) {
      console.warn("[LiveActivity] end failed:", e);
    }
  },
};

export type { LiveActivityState };
