"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { AppWalkthrough } from "./AppWalkthrough";

interface TutorialGateProps {
  hasSeenTutorial: boolean;
}

export function TutorialGate({ hasSeenTutorial }: TutorialGateProps) {
  const [show, setShow] = useState(!hasSeenTutorial);

  const handleComplete = useCallback(async () => {
    setShow(false);
    try {
      await fetch("/api/tutorial/complete", { method: "POST" });
    } catch {
      // Silent fail — worst case they see it once more
    }
  }, []);

  return (
    <AnimatePresence>
      {show && <AppWalkthrough onComplete={handleComplete} />}
    </AnimatePresence>
  );
}
