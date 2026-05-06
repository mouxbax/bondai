"use client";

import { motion } from "framer-motion";

/**
 * StatusBrand — a subtle brand element that lives in the iOS status bar area,
 * centered between the clock (left) and signal/battery (right), just below
 * or around the Dynamic Island. Only visible on mobile in Capacitor.
 *
 * It shows "AIAH" with a soft emerald glow pulse, giving the feeling that
 * the Dynamic Island is "powered by" the app.
 */
export function StatusBrand() {
  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-0 z-50 flex items-start justify-center md:hidden"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {/* The brand pill — sits just below the Dynamic Island */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
        className="relative -mt-1 flex items-center gap-1.5"
      >
        {/* Glow backdrop */}
        <div
          className="absolute inset-0 -inset-x-3 -inset-y-1 rounded-full opacity-40"
          style={{
            background: "radial-gradient(ellipse, rgba(45,212,163,0.3) 0%, transparent 70%)",
          }}
        />

        {/* Dot indicator — like a live status */}
        <motion.div
          className="relative h-1.5 w-1.5 rounded-full bg-emerald-400"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Brand text */}
        <span className="relative text-[10px] font-semibold tracking-[0.2em] text-emerald-400/80">
          AIAH
        </span>

        {/* Dot indicator — symmetry */}
        <motion.div
          className="relative h-1.5 w-1.5 rounded-full bg-emerald-400"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </motion.div>
    </div>
  );
}
