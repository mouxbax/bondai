"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

export function AnimatedDashboard({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 md:px-8"
    >
      {children}
    </motion.div>
  );
}

export function AnimatedSection({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}

export function AnimatedQuickActions({ children }: { children: ReactNode }) {
  return (
    <motion.section
      variants={fadeUp}
      className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900"
    >
      {children}
    </motion.section>
  );
}
