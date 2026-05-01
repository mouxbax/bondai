"use client";

import { useState, useEffect } from "react";
import { moodDisplay } from "@/lib/companion-mood";
import type { CompanionMood } from "@/lib/companion-mood";

/**
 * Displays the companion's current mood (fetched from server with decay applied).
 * Shows emoji + label + color indicator.
 */
export function MoodBadge() {
  const [mood, setMood] = useState<CompanionMood | null>(null);

  useEffect(() => {
    fetch("/api/pet/mood")
      .then((r) => r.json())
      .then((d) => setMood(d.mood as CompanionMood))
      .catch(() => {});
  }, []);

  if (!mood) return null;

  const display = moodDisplay(mood);

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-base">{display.emoji}</span>
      <span className={`text-[10px] font-semibold ${display.color}`}>
        {display.label}
      </span>
      {(mood === "lonely" || mood === "sad") && (
        <span className="text-[9px] text-stone-400 dark:text-stone-500">
          Interact to cheer up!
        </span>
      )}
    </div>
  );
}
