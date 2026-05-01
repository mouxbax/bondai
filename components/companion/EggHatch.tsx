"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { sfx } from "@/lib/sfx";
import { haptic } from "@/lib/haptics";
import { markEggHatched } from "@/lib/evolution";

interface EggHatchProps {
  onHatched: () => void;
}

/**
 * Full-screen egg cracking experience.
 * User taps the egg repeatedly to crack it. After enough taps, it hatches.
 */
export function EggHatch({ onHatched }: EggHatchProps) {
  const [taps, setTaps] = useState(0);
  const [phase, setPhase] = useState<"tap" | "cracking" | "hatched">("tap");

  const requiredTaps = 5;

  const handleTap = useCallback(() => {
    if (phase !== "tap") return;

    const next = taps + 1;
    setTaps(next);
    sfx.tap();
    haptic("pop");

    if (next >= requiredTaps) {
      setPhase("cracking");
      sfx.fanfare();
      haptic("success");

      setTimeout(() => {
        setPhase("hatched");
        markEggHatched();
        setTimeout(() => {
          onHatched();
        }, 2500);
      }, 1500);
    }
  }, [taps, phase, onHatched]);

  const crackProgress = Math.min(1, taps / requiredTaps);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Stars background */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
        />
      ))}

      <AnimatePresence mode="wait">
        {phase === "tap" && (
          <motion.div
            key="tap"
            className="flex flex-col items-center gap-6"
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {/* Egg */}
            <motion.button
              onClick={handleTap}
              className="relative focus:outline-none"
              whileTap={{ scale: 0.92 }}
              animate={{
                rotate: crackProgress > 0.6 ? [-2, 2, -2] : 0,
              }}
              transition={{
                rotate: { duration: 0.3, repeat: Infinity },
              }}
            >
              <svg width="160" height="200" viewBox="0 0 160 200">
                {/* Egg glow */}
                <defs>
                  <radialGradient id="egg-glow" cx="50%" cy="40%" r="50%">
                    <stop offset="0%" stopColor="#4FD1A5" stopOpacity={0.3 + crackProgress * 0.4} />
                    <stop offset="100%" stopColor="#1D9E75" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="egg-fill" cx="40%" cy="35%" r="60%">
                    <stop offset="0%" stopColor="#e8f5f0" />
                    <stop offset="50%" stopColor="#b8e0d2" />
                    <stop offset="100%" stopColor="#7cc5ab" />
                  </radialGradient>
                </defs>

                {/* Outer glow */}
                <ellipse cx="80" cy="110" rx="75" ry="95" fill="url(#egg-glow)" />

                {/* Main egg shape */}
                <ellipse cx="80" cy="110" rx="55" ry="75" fill="url(#egg-fill)" />

                {/* Shine */}
                <ellipse cx="60" cy="80" rx="15" ry="25" fill="white" opacity="0.25" />

                {/* Cracks based on progress */}
                {crackProgress > 0.2 && (
                  <path d="M65 90 L72 105 L60 115" fill="none" stroke="#5a9e85" strokeWidth="2" strokeLinecap="round" />
                )}
                {crackProgress > 0.4 && (
                  <path d="M90 80 L85 100 L95 108" fill="none" stroke="#5a9e85" strokeWidth="2" strokeLinecap="round" />
                )}
                {crackProgress > 0.6 && (
                  <path d="M70 120 L80 130 L68 140" fill="none" stroke="#5a9e85" strokeWidth="2" strokeLinecap="round" />
                )}
                {crackProgress > 0.8 && (
                  <>
                    <path d="M55 100 L50 115 L58 120" fill="none" stroke="#5a9e85" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M95 95 L100 110 L92 118" fill="none" stroke="#5a9e85" strokeWidth="2.5" strokeLinecap="round" />
                  </>
                )}
              </svg>

              {/* Light peeking through cracks */}
              {crackProgress > 0.6 && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(79,209,165,0.4) 0%, transparent 60%)",
                  }}
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              )}
            </motion.button>

            {/* Prompt */}
            <motion.p
              className="text-white/60 text-sm font-medium"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {taps === 0 ? "Tap the egg..." : `Keep tapping! (${taps}/${requiredTaps})`}
            </motion.p>

            {/* Progress dots */}
            <div className="flex gap-2">
              {[...Array(requiredTaps)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`h-2 w-2 rounded-full ${i < taps ? "bg-emerald-400" : "bg-white/20"}`}
                  animate={i < taps ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {phase === "cracking" && (
          <motion.div
            key="cracking"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
          >
            {/* Breaking egg */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1.2, 1.5, 0],
                rotate: [0, -5, 5, -10, 0],
              }}
              transition={{ duration: 1.5, ease: "easeIn" }}
            >
              <svg width="160" height="200" viewBox="0 0 160 200">
                <defs>
                  <radialGradient id="egg-break" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#4FD1A5" />
                    <stop offset="100%" stopColor="#1D9E75" />
                  </radialGradient>
                </defs>
                <ellipse cx="80" cy="110" rx="55" ry="75" fill="url(#egg-break)" />
              </svg>
            </motion.div>

            {/* Burst particles */}
            {[...Array(12)].map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              return (
                <motion.div
                  key={i}
                  className="absolute h-3 w-3 rounded-full bg-emerald-400"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos(angle) * 150,
                    y: Math.sin(angle) * 150,
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                />
              );
            })}
          </motion.div>
        )}

        {phase === "hatched" && (
          <motion.div
            key="hatched"
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 15 }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-7xl"
            >
              🐣
            </motion.div>
            <motion.h2
              className="text-2xl font-bold text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Your companion has hatched!
            </motion.h2>
            <motion.p
              className="text-white/50 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Take care of it and watch it grow...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
