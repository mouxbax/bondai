"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  Flame,
  Target,
  Heart,
  MessageCircle,
  Brain,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Nudge } from "@/lib/nudges";

const iconMap: Record<string, typeof Sparkles> = {
  checkin: Sparkles,
  streak: Flame,
  goal: Target,
  social: Heart,
  mood: Brain,
  coaching: MessageCircle,
};

const colorMap: Record<string, string> = {
  checkin: "from-[#1D9E75]/10 to-emerald-50 dark:from-[#1D9E75]/20 dark:to-emerald-950/30",
  streak: "from-amber-100/80 to-orange-50 dark:from-amber-900/20 dark:to-orange-950/20",
  goal: "from-blue-100/80 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-950/20",
  social: "from-rose-100/80 to-pink-50 dark:from-rose-900/20 dark:to-pink-950/20",
  mood: "from-purple-100/80 to-violet-50 dark:from-purple-900/20 dark:to-violet-950/20",
  coaching: "from-cyan-100/80 to-sky-50 dark:from-cyan-900/20 dark:to-sky-950/20",
};

const iconColorMap: Record<string, string> = {
  checkin: "text-[#1D9E75]",
  streak: "text-amber-500",
  goal: "text-blue-500",
  social: "text-rose-500",
  mood: "text-purple-500",
  coaching: "text-cyan-500",
};

export function NudgeCards() {
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/nudges")
      .then((r) => r.json())
      .then((data: { nudges: Nudge[] }) => setNudges(data.nudges))
      .catch(() => {});
  }, []);

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  const visible = nudges.filter((n) => !dismissed.has(n.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {visible.map((nudge, i) => {
          const Icon = iconMap[nudge.type] ?? Sparkles;
          const gradient = colorMap[nudge.type] ?? colorMap.checkin;
          const iconColor = iconColorMap[nudge.type] ?? iconColorMap.checkin;

          return (
            <motion.div
              key={nudge.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -60, scale: 0.95 }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              layout
              className={`relative rounded-xl bg-gradient-to-r ${gradient} p-4 border border-stone-100/50 dark:border-stone-800/50`}
            >
              <button
                onClick={() => dismiss(nudge.id)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="h-3.5 w-3.5 text-stone-400" />
              </button>

              <div className="flex items-start gap-3">
                <motion.div
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Icon className={`h-5 w-5 mt-0.5 ${iconColor}`} />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                    {nudge.title}
                  </p>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                    {nudge.message}
                  </p>
                  {nudge.action && (
                    <Link href={nudge.action.href}>
                      <Button
                        size="sm"
                        className="mt-2 h-7 rounded-lg text-xs px-3"
                      >
                        {nudge.action.label}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
