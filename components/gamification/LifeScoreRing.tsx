"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { computeLifeScore, type LifeScore } from "@/lib/gamification";

export function LifeScoreRing({ size = 120 }: { size?: number }) {
  const [score, setScore] = useState<LifeScore | null>(null);

  useEffect(() => {
    // Show local score immediately
    setScore(computeLifeScore());
    // Then fetch authoritative server score
    fetch("/api/pet/xp", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.connectionScore != null) {
          setScore((prev) => {
            const serverScore = data.connectionScore;
            // Use whichever is higher between server and local
            const best = Math.max(serverScore, prev?.total ?? 0);
            return { ...prev!, total: best };
          });
        }
      })
      .catch(() => {});
    const interval = setInterval(() => setScore(computeLifeScore()), 10000);
    return () => clearInterval(interval);
  }, []);

  if (!score) return <div style={{ width: size, height: size }} />;

  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score.total / 100) * circumference;

  const color =
    score.total >= 80 ? "#1D9E75" : score.total >= 60 ? "#F5B945" : score.total >= 40 ? "#F97316" : "#EC4899";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="lifescore-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="8"
          className="stroke-white/10"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          stroke="url(#lifescore-grad)"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={score.total}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="font-bold leading-none"
          style={{ color, fontSize: size * 0.28 }}
        >
          {score.total}
        </motion.span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
          Life Score
        </span>
      </div>
    </div>
  );
}
