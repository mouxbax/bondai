"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AIAHOrb } from "@/components/companion/AIAHOrb";
import { getCompanionConfig } from "@/lib/companion-config";

/**
 * Animated welcome splash - shows once per session when the app opens.
 * Dismisses on tap or auto-fades after 3.5s.
 */

const KEY = "aiah-splash-shown";

export function WelcomeSplash() {
  const [show, setShow] = useState(false);
  const [name, setName] = useState("AIAH");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const alreadyShown = sessionStorage.getItem(KEY);
    if (alreadyShown) return;
    const cfg = getCompanionConfig();
    setName(cfg.name || "AIAH");
    setShow(true);
    sessionStorage.setItem(KEY, "1");
    const timer = setTimeout(() => setShow(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  const letters = name.split("");

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          onClick={() => setShow(false)}
          className="fixed inset-0 z-[200] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a2421] via-[#0f3d34] to-[#082019]"
        >
          {/* Ambient glow blobs */}
          <motion.div
            className="absolute h-[500px] w-[500px] rounded-full bg-emerald-500/20 blur-3xl"
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-10 top-20 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl"
            animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-20 left-10 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl"
            animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Stars */}
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-white"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}

          {/* Orb */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10"
          >
            <AIAHOrb mood="calm" size={180} />
          </motion.div>

          {/* Name letters with stagger */}
          <motion.div className="mt-6 flex gap-1">
            {letters.map((l, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.8,
                  delay: 0.5 + i * 0.08,
                  ease: "easeOut",
                }}
                className="bg-gradient-to-b from-white via-emerald-100 to-emerald-300 bg-clip-text text-6xl font-extralight tracking-[0.3em] text-transparent"
              >
                {l}
              </motion.span>
            ))}
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + letters.length * 0.08 + 0.3, duration: 0.8 }}
            className="mt-4 text-center text-sm font-light tracking-widest text-emerald-200/70"
          >
            YOUR LIFE, COMPANION
          </motion.p>

          {/* Tap hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 2, duration: 0.8 }}
            className="absolute bottom-10 text-xs font-light tracking-wider text-white/50"
          >
            tap to enter
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
