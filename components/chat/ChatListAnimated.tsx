"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export function AnimatedChatList({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="mx-auto w-full max-w-3xl flex-1 space-y-3 px-4 py-6 md:px-8"
    >
      {children}
    </motion.div>
  );
}

export function AnimatedChatItem({ children }: { children: ReactNode }) {
  return (
    <motion.div variants={fadeUp}>
      <motion.div
        whileHover={{ x: 4 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
