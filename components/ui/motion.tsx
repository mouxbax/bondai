"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/* ─── Reusable animation wrappers for AIAH ─── */

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  y?: number;
}

export function FadeIn({ children, delay = 0, duration = 0.5, className, y = 20 }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: "easeOut" as const }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
}

export function StaggerContainer({ children, className, delay = 0.1, stagger = 0.1 }: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Floating gradient blob for backgrounds */
export function FloatingBlob({ className }: { className?: string }) {
  return (
    <motion.div
      className={`pointer-events-none absolute rounded-full blur-3xl opacity-30 ${className ?? ""}`}
      animate={{
        x: [0, 30, -20, 0],
        y: [0, -25, 15, 0],
        scale: [1, 1.1, 0.95, 1],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

/* Scale-on-hover wrapper for cards */
export function HoverScale({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Slide in from left/right */
interface SlideInProps {
  children: ReactNode;
  direction?: "left" | "right";
  delay?: number;
  className?: string;
}

export function SlideIn({ children, direction = "left", delay = 0, className }: SlideInProps) {
  const x = direction === "left" ? -40 : 40;
  return (
    <motion.div
      initial={{ opacity: 0, x }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" as const }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Counting number animation */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CountUp({ target, duration = 1.5 }: { target: number; duration?: number }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {target}
      </motion.span>
    </motion.span>
  );
}

/* Pulse ring effect (for CTAs) */
export function PulseRing({ className }: { className?: string }) {
  return (
    <motion.div
      className={`absolute inset-0 rounded-full border-2 border-[#1D9E75] ${className ?? ""}`}
      animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" as const }}
    />
  );
}
