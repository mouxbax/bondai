"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * StatusBrand — only renders inside the authenticated app shell.
 * Shows current day name, tappable to navigate to daily plan.
 * Positioned just below the safe area (Dynamic Island / notch).
 * Hidden on public pages (landing, blog) where it has no purpose.
 *
 * NOTE: To actually render INSIDE the Dynamic Island, a native iOS
 * Live Activity (ActivityKit + WidgetKit) is required — web content
 * cannot appear in the Dynamic Island hardware cutout.
 */
export function StatusBrand() {
  const router = useRouter();
  const pathname = usePathname();
  const [day, setDay] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDay(DAYS[new Date().getDay()]);
    setMounted(true);
  }, []);

  // Only show inside the authenticated app shell
  const isAppRoute = pathname?.startsWith("/home") || pathname?.startsWith("/talk") ||
    pathname?.startsWith("/plans") || pathname?.startsWith("/breathe") ||
    pathname?.startsWith("/account") || pathname?.startsWith("/subscribe");

  // Don't render on public pages or before mount
  if (!mounted || !isAppRoute) return null;

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-0 z-50 flex justify-center md:hidden"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <motion.button
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
        onClick={() => router.push("/plans")}
        className="pointer-events-auto flex items-center gap-1.5 rounded-full px-3 py-0.5 transition-all active:scale-95"
        style={{ marginTop: "-2px" }}
      >
        <motion.div
          className="h-1 w-1 rounded-full bg-emerald-400"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="text-[10px] font-medium tracking-widest text-emerald-400/70">
          {day.toUpperCase()}
        </span>
        <motion.div
          className="h-1 w-1 rounded-full bg-emerald-400"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        />
      </motion.button>
    </div>
  );
}
