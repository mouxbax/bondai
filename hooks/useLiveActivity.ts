"use client";

import { useEffect, useRef } from "react";
import { liveActivity } from "@/lib/native/live-activity";

/**
 * Auto-starts the Dynamic Island Live Activity when the app mounts.
 * Updates it whenever mood, streak, energy, or level change.
 * Ends it when the component unmounts (app closed).
 *
 * Drop this into the root layout or home page:
 *   useLiveActivity({ mood, streakCount, energyPercent, xpLevel });
 */
export function useLiveActivity(state: {
  companionName?: string;
  mood?: string;
  streakCount?: number;
  energyPercent?: number;
  xpLevel?: number;
  evolutionStage?: string;
}) {
  const activeRef = useRef(false);
  const prevState = useRef("");

  useEffect(() => {
    const key = JSON.stringify(state);
    if (key === prevState.current) return;
    prevState.current = key;

    const moodMessages: Record<string, string> = {
      happy: "Feeling great today!",
      calm: "Breathing steady",
      focused: "In the zone",
      energized: "Let's crush it",
      tender: "Feeling soft",
      anxious: "Take it slow",
      low: "I'm here for you",
    };

    const payload = {
      companionName: state.companionName ?? "AIAH",
      evolutionStage: state.evolutionStage ?? "blob",
      mood: state.mood ?? "calm",
      streakCount: state.streakCount ?? 0,
      energyPercent: state.energyPercent ?? 100,
      xpLevel: state.xpLevel ?? 1,
      message: moodMessages[state.mood ?? "calm"] ?? "I'm here with you",
    };

    if (!activeRef.current) {
      // First mount — start the Live Activity
      liveActivity.start(payload).then((id) => {
        if (id) activeRef.current = true;
      });
    } else {
      // Already active — just update
      liveActivity.update(payload);
    }
  }, [state]);

  // End on unmount
  useEffect(() => {
    return () => {
      if (activeRef.current) {
        liveActivity.end();
        activeRef.current = false;
      }
    };
  }, []);
}
