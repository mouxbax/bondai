"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Proactive companion speech bubble.
 * Shows a contextual message from the companion on the home page.
 * Rotates messages based on time of day, streak, and mood.
 */

interface CompanionBubbleProps {
  mood?: string;
  streak?: number;
  firstName?: string | null;
}

function getTimeGreeting(hour: number): string[] {
  if (hour < 6) return [
    "Can't sleep? I'm here.",
    "Late night crew. Let's talk if you need.",
    "Rest is part of the plan. Close your eyes soon.",
  ];
  if (hour < 10) return [
    "New day, new wins. What's the move?",
    "Morning. Let's make today count.",
    "Rise and grind. Check your plan.",
  ];
  if (hour < 13) return [
    "Midday check: how's the energy?",
    "Keep the momentum going.",
    "Lunch soon? Check your grocery list.",
  ];
  if (hour < 17) return [
    "Afternoon push. Almost there.",
    "Stay locked in. The finish line is close.",
    "You're doing more than you think.",
  ];
  if (hour < 21) return [
    "Evening wind-down. How was your day?",
    "Good time for a mood check-in.",
    "Reflect on today. What went well?",
  ];
  return [
    "Wrapping up? You earned the rest.",
    "Tomorrow's another shot. Sleep well.",
    "Good night. I'll be here in the morning.",
  ];
}

function getStreakMessage(streak: number): string | null {
  if (streak >= 100) return "100+ days. You're unstoppable.";
  if (streak >= 30) return "A whole month of consistency. Legendary.";
  if (streak >= 14) return "Two weeks strong. This is becoming who you are.";
  if (streak >= 7) return "7-day streak! You're building a habit.";
  if (streak >= 3) return "3 days in a row. Keep the fire going.";
  return null;
}

function getMoodMessage(mood: string): string | null {
  switch (mood) {
    case "sad": return "I noticed you've been low. Want to talk about it?";
    case "anxious": return "Feeling tense? Try a breathing exercise with me.";
    case "energetic": return "Big energy today. Channel it into your top priority.";
    case "tender": return "Go gentle today. That's allowed.";
    default: return null;
  }
}

export function CompanionBubble({ mood, streak, firstName }: CompanionBubbleProps) {
  const [message, setMessage] = useState<string>("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    const candidates: string[] = [];

    // Priority: streak milestone > mood-specific > time-based
    const streakMsg = getStreakMessage(streak ?? 0);
    if (streakMsg) candidates.push(streakMsg);

    const moodMsg = getMoodMessage(mood ?? "calm");
    if (moodMsg) candidates.push(moodMsg);

    const timeMessages = getTimeGreeting(hour);
    candidates.push(...timeMessages);

    // Pick one (weighted toward first = higher priority)
    const picked = candidates[Math.floor(Math.random() * Math.min(candidates.length, 3))];
    setMessage(picked);

    // Delay appearance slightly for nice UX
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, [mood, streak, firstName]);

  return (
    <AnimatePresence>
      {visible && message && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative mx-auto max-w-xs rounded-2xl bg-white/10 px-4 py-2.5 text-center text-sm font-medium text-white/90 backdrop-blur-md dark:bg-white/[0.06]"
        >
          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 bg-white/10 backdrop-blur-md dark:bg-white/[0.06]" />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
