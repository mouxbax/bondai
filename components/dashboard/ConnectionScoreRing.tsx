"use client";

import * as React from "react";
import { motion } from "framer-motion";

export function ConnectionScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-stone-200 dark:text-stone-800"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          strokeLinecap="round"
          className="text-[#1D9E75]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-stone-900 dark:text-stone-50">{clamped}</span>
        <span className="text-[10px] uppercase tracking-wide text-stone-500">connection</span>
      </div>
    </div>
  );
}
