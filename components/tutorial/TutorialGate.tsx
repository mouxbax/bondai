"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { AppWalkthrough } from "./AppWalkthrough";

const SESSION_KEY = "aiah_tutorial_done";

interface TutorialGateProps {
  hasSeenTutorial: boolean;
}

/**
 * Decides whether to show the first-time walkthrough.
 *
 * The DB flag (`hasSeenTutorial`) is read on the SERVER at initial render
 * for this layout. After completion we POST to /api/tutorial/complete to
 * persist it. But within the same session, client-side navigations don't
 * re-fetch the layout, so the prop stays `false` until full reload —
 * meaning the walkthrough would re-trigger on every route change.
 *
 * Belt + braces: also write a sessionStorage flag on completion and
 * respect it on mount.
 *
 * While the walkthrough is showing, set body[data-tutorial-active="true"]
 * so other onboarding-style modals (RitualModal) suppress themselves.
 */
export function TutorialGate({ hasSeenTutorial }: TutorialGateProps) {
  const initialShow =
    !hasSeenTutorial &&
    (typeof window === "undefined" ||
      window.sessionStorage.getItem(SESSION_KEY) !== "1");

  const [show, setShow] = useState(initialShow);

  // Re-check sessionStorage after mount (covers SSR/CSR drift).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(SESSION_KEY) === "1") {
      setShow(false);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (show) {
      document.body.dataset.tutorialActive = "true";
    } else {
      delete document.body.dataset.tutorialActive;
    }
    return () => {
      if (typeof document !== "undefined") {
        delete document.body.dataset.tutorialActive;
      }
    };
  }, [show]);

  const handleComplete = useCallback(async () => {
    setShow(false);
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // Storage quota / disabled — fall back to DB-only flag.
      }
    }
    try {
      await fetch("/api/tutorial/complete", { method: "POST" });
    } catch {
      // Silent fail — worst case they see it once more on a hard reload.
    }
  }, []);

  return (
    <AnimatePresence>
      {show && <AppWalkthrough onComplete={handleComplete} />}
    </AnimatePresence>
  );
}
