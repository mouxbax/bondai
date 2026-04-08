"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function StreakBadge({ count, pulse }: { count: number; pulse?: boolean }) {
  return (
    <motion.div
      animate={pulse ? { scale: [1, 1.04, 1] } : undefined}
      transition={{ duration: 1.2, repeat: pulse ? Infinity : 0 }}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
      )}
    >
      <Flame className="h-4 w-4 text-amber-500" />
      <span>{count} day streak</span>
    </motion.div>
  );
}
