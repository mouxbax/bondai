"use client";

import { motion } from "framer-motion";

export function StreamingMessage({ text, active }: { text: string; active: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[85%] rounded-2xl border border-stone-100 bg-white px-4 py-3 text-sm leading-relaxed text-stone-800 shadow-sm dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
    >
      <span className="whitespace-pre-wrap">{text}</span>
      {active ? <span className="ml-0.5 inline-block h-4 w-0.5 animate-blink bg-[#1D9E75] align-middle" /> : null}
    </motion.div>
  );
}
