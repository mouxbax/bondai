"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, createContext, useContext, type ReactNode } from "react";
import { haptic } from "@/lib/haptics";
import { sfx } from "@/lib/sfx";

/**
 * Global celebration system.
 * - Confetti particles
 * - XP popups (+15 XP)
 * - Level-up splash
 * - Achievement toast
 */

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  vx: number;
  vy: number;
}

interface XPPopup {
  id: number;
  amount: number;
  x: number;
  y: number;
}

interface LevelUp {
  id: number;
  level: number;
}

interface AchievementToast {
  id: number;
  emoji: string;
  name: string;
  description: string;
}

interface CelebrationContextType {
  confetti: (x?: number, y?: number) => void;
  xpPopup: (amount: number, x?: number, y?: number) => void;
  levelUp: (level: number) => void;
  achievement: (emoji: string, name: string, description: string) => void;
}

const CelebrationContext = createContext<CelebrationContextType | null>(null);

export function useCelebration() {
  const ctx = useContext(CelebrationContext);
  if (!ctx) throw new Error("useCelebration must be used within CelebrationProvider");
  return ctx;
}

const COLORS = ["#1D9E75", "#F5B945", "#EC4899", "#8B5CF6", "#4A7FA7", "#F97316"];

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [popups, setPopups] = useState<XPPopup[]>([]);
  const [levelUpState, setLevelUpState] = useState<LevelUp | null>(null);
  const [achievements, setAchievements] = useState<AchievementToast[]>([]);

  const confetti = useCallback((x?: number, y?: number) => {
    const cx = x ?? (typeof window !== "undefined" ? window.innerWidth / 2 : 200);
    const cy = y ?? (typeof window !== "undefined" ? window.innerHeight / 2 : 200);
    const newParticles: Particle[] = Array.from({ length: 40 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 40 + Math.random() * 0.5;
      const velocity = 4 + Math.random() * 6;
      return {
        id: Date.now() + i,
        x: cx,
        y: cy,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.8,
        vx: Math.cos(angle) * velocity * 30,
        vy: Math.sin(angle) * velocity * 30 - 100,
      };
    });
    setParticles((p) => [...p, ...newParticles]);
    setTimeout(() => {
      setParticles((p) => p.filter((pt) => !newParticles.includes(pt)));
    }, 1600);
  }, []);

  const xpPopup = useCallback((amount: number, x?: number, y?: number) => {
    const cx = x ?? (typeof window !== "undefined" ? window.innerWidth / 2 : 200);
    const cy = y ?? (typeof window !== "undefined" ? window.innerHeight / 2 : 200);
    const popup: XPPopup = { id: Date.now() + Math.random(), amount, x: cx, y: cy };
    setPopups((p) => [...p, popup]);
    haptic("pop");
    sfx.xp();
    setTimeout(() => setPopups((p) => p.filter((x) => x.id !== popup.id)), 1400);
  }, []);

  const levelUp = useCallback(
    (level: number) => {
      setLevelUpState({ id: Date.now(), level });
      haptic("success");
      sfx.fanfare();
      confetti();
      setTimeout(() => confetti(), 300);
      setTimeout(() => confetti(), 600);
      setTimeout(() => setLevelUpState(null), 3500);
    },
    [confetti],
  );

  const achievement = useCallback((emoji: string, name: string, description: string) => {
    const toast: AchievementToast = { id: Date.now() + Math.random(), emoji, name, description };
    setAchievements((a) => [...a, toast]);
    haptic("success");
    sfx.fanfare();
    setTimeout(() => setAchievements((a) => a.filter((t) => t.id !== toast.id)), 4000);
  }, []);

  return (
    <CelebrationContext.Provider value={{ confetti, xpPopup, levelUp, achievement }}>
      {children}

      {/* Confetti particles */}
      <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: p.x, y: p.y, opacity: 1, rotate: p.rotation, scale: p.scale }}
              animate={{
                x: p.x + p.vx,
                y: p.y + p.vy + 400,
                opacity: 0,
                rotate: p.rotation + 360,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute h-3 w-3 rounded-sm"
              style={{ backgroundColor: p.color }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* XP popups */}
      <div className="pointer-events-none fixed inset-0 z-[101]">
        <AnimatePresence>
          {popups.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: p.x, y: p.y, opacity: 0, scale: 0.6 }}
              animate={{ y: p.y - 80, opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: p.y - 120 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute -translate-x-1/2 rounded-full bg-[#1D9E75] px-3 py-1 text-sm font-bold text-white shadow-lg"
            >
              +{p.amount} XP
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Level up splash */}
      <AnimatePresence>
        {levelUpState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[102] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="relative rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-400 to-teal-500 p-10 text-center shadow-2xl"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.6, repeat: 2 }}
                className="text-6xl"
              >
                🌟
              </motion.div>
              <h2 className="mt-3 text-xs font-semibold uppercase tracking-widest text-white/80">Level up</h2>
              <p className="mt-1 text-4xl font-bold text-white">Level {levelUpState.level}</p>
              <p className="mt-2 text-sm text-white/90">You&apos;re growing. Keep going.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement toasts */}
      <div className="pointer-events-none fixed right-4 top-20 z-[103] flex flex-col gap-2">
        <AnimatePresence>
          {achievements.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-3 shadow-xl dark:border-amber-700 dark:from-amber-950 dark:to-stone-900"
            >
              <div className="text-3xl">{a.emoji}</div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Achievement
                </p>
                <p className="text-sm font-bold text-stone-900 dark:text-stone-50">{a.name}</p>
                <p className="text-xs text-stone-600 dark:text-stone-400">{a.description}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </CelebrationContext.Provider>
  );
}

/**
 * Hook that fires a celebration based on XP/achievement result.
 */
export function useCelebrate() {
  const { confetti, xpPopup, levelUp, achievement } = useCelebration();

  return useCallback(
    (
      result: { gained: number; state: { level: number }; leveledUp: boolean },
      newAchievements: { emoji: string; name: string; description: string }[] = [],
      x?: number,
      y?: number,
    ) => {
      confetti(x, y);
      xpPopup(result.gained, x, y);
      if (result.leveledUp) {
        setTimeout(() => levelUp(result.state.level), 400);
      }
      newAchievements.forEach((a, i) => {
        setTimeout(() => achievement(a.emoji, a.name, a.description), 600 + i * 400);
      });
    },
    [confetti, xpPopup, levelUp, achievement],
  );
}

// Re-export for components that only need basic dependencies
export { useState as _useState } from "react";
