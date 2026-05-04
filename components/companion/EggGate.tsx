"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { isEggHatched, setAccountCreatedDate } from "@/lib/evolution";
import { EggHatch } from "@/components/companion/EggHatch";

/**
 * Layout-level gate: renders the full-screen EggHatch experience
 * if the user has never hatched their companion. Blocks the entire
 * app until they tap through the hatching. Happens exactly ONCE.
 */
export function EggGate({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [needsHatch, setNeedsHatch] = useState(false);

  useEffect(() => {
    const hatched = isEggHatched();
    if (!hatched) {
      setNeedsHatch(true);
      // Seed account creation date on very first load
      setAccountCreatedDate(new Date().toISOString());
    }
    setChecking(false);
  }, []);

  const handleHatched = () => {
    setNeedsHatch(false);
    // Also sync to server so it persists across devices
    fetch("/api/pet/hatch", { method: "POST" }).catch(() => {});
  };

  // Don't flash anything while checking localStorage
  if (checking) return null;

  return (
    <>
      <AnimatePresence>
        {needsHatch && <EggHatch onHatched={handleHatched} />}
      </AnimatePresence>
      {/* Only render the app once egg is hatched */}
      {!needsHatch && children}
    </>
  );
}
