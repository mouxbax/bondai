"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { sfx } from "@/lib/sfx";
import { haptic } from "@/lib/haptics";
import { STAGES, type EvolutionStage } from "@/lib/evolution";

interface EvolutionCelebrationProps {
  stage: EvolutionStage;
  onComplete: () => void;
}

/**
 * Full-screen evolution celebration shown when companion reaches a new stage.
 * Auto-dismisses after 4 seconds.
 */
export function EvolutionCelebration({ stage, onComplete }: EvolutionCelebrationProps) {
  const info = STAGES.find((s) => s.stage === stage);

  useEffect(() => {
    sfx.fanfare();
    haptic("success");
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!info) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onComplete}
    >
      {/* Radial burst */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 300,
          height: 300,
          background: "radial-gradient(circle, rgba(79,209,165,0.3) 0%, transparent 70%)",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 2, 1.5], opacity: [0, 0.8, 0.4] }}
        transition={{ duration: 1.5 }}
      />

      {/* Floating particles */}
      {[...Array(16)].map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const dist = 80 + Math.random() * 60;
        return (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full"
            style={{ background: i % 2 === 0 ? "#4FD1A5" : "#FFD166" }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{ duration: 2, delay: 0.2 + i * 0.05, ease: "easeOut" }}
          />
        );
      })}

      {/* Stage emoji */}
      <motion.div
        className="text-7xl mb-4"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 12, delay: 0.2 }}
      >
        {info.emoji}
      </motion.div>

      {/* Evolution text */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-2">
          Evolution!
        </p>
        <h2 className="text-3xl font-bold text-white mb-2">
          {info.label}
        </h2>
        <p className="text-white/50 text-sm max-w-xs">
          {info.description}
        </p>
      </motion.div>

      {/* Tap to dismiss hint */}
      <motion.p
        className="absolute bottom-12 text-white/30 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        Tap to continue
      </motion.p>
    </motion.div>
  );
}
