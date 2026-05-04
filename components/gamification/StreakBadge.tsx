"use client";

import { Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStreak } from "@/hooks/useStreak";
import { useState, useEffect } from "react";

/**
 * Compact streak counter shown on the home page.
 * Auto-checks in on mount. Shows milestone toast if coins awarded.
 */
export function StreakBadge() {
  const { currentStreak, checkedInToday, coinsAwarded, milestone, loading } = useStreak();
  const [showMilestone, setShowMilestone] = useState(false);

  useEffect(() => {
    if (milestone && coinsAwarded > 0) {
      setShowMilestone(true);
      const t = setTimeout(() => setShowMilestone(false), 4000);
      return () => clearTimeout(t);
    }
  }, [milestone, coinsAwarded]);

  if (loading) return null;

  return (
    <div className="relative flex items-center gap-1.5">
      <div
        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
          checkedInToday
            ? "bg-orange-500/15 text-orange-500"
            : "bg-stone-800/60 text-stone-400"
        }`}
      >
        <Flame className={`h-3.5 w-3.5 ${currentStreak > 0 ? "text-orange-400" : "text-stone-500"}`} />
        <span>{currentStreak}</span>
      </div>

      {/* Milestone celebration toast */}
      <AnimatePresence>
        {showMilestone && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg"
          >
            {milestone} day streak! +{coinsAwarded} coins
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
