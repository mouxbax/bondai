"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { getXPState, type XPState } from "@/lib/gamification";

export function LevelBadge({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<XPState | null>(null);

  useEffect(() => {
    setState(getXPState());
    const handler = () => setState(getXPState());
    window.addEventListener("storage", handler);
    const interval = setInterval(() => setState(getXPState()), 2000);
    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(interval);
    };
  }, []);

  if (!state) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-white shadow-md">
          {state.level}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
            Level {state.level}
          </span>
          <div className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${state.progress * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-white/[0.06] p-4 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(245,185,69,0.4)",
              "0 0 0 10px rgba(245,185,69,0)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-lg font-bold text-white shadow-lg"
        >
          {state.level}
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
              Level {state.level}
            </span>
          </div>
          <p className="text-sm font-semibold text-stone-100">{state.total} XP total</p>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${state.progress * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
            />
          </div>
          <p className="mt-1 text-[10px] text-stone-400">
            {state.nextLevelXp - state.currentLevelXp} XP to level {state.level + 1}
          </p>
        </div>
      </div>
    </div>
  );
}
