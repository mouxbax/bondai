"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Bell, Sparkles } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Tutorial step definitions                                          */
/* ------------------------------------------------------------------ */

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  /** CSS selector to spotlight (null = centered card, no spotlight) */
  target: string | null;
  /** Position of tooltip relative to target */
  position: "top" | "bottom" | "left" | "right" | "center";
  /** Optional icon override */
  icon?: React.ReactNode;
  /** If true, this step triggers notification permission */
  isNotificationStep?: boolean;
}

const STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to AIAH",
    description:
      "Your AI life system. Let me show you around — it'll take 30 seconds.",
    target: null,
    position: "center",
    icon: <Sparkles className="h-8 w-8 text-[#1D9E75]" />,
  },
  {
    id: "orb",
    title: "Meet Your Companion",
    description:
      "This is AIAH — your AI life coach. It responds to your mood and adapts to help you hit your goals.",
    target: "[data-tutorial='orb']",
    position: "bottom",
  },
  {
    id: "mood",
    title: "Track Your Mood",
    description:
      "Tap here to log how you're feeling. AIAH learns your patterns and helps you understand your emotions over time.",
    target: "[data-tutorial='mood-selector']",
    position: "top",
  },
  {
    id: "quick-actions",
    title: "Quick Actions",
    description:
      "Talk to AIAH, do a breathing exercise, or journal your thoughts — all one tap away.",
    target: "[data-tutorial='quick-actions']",
    position: "top",
  },
  {
    id: "nav-talk",
    title: "Start a Conversation",
    description:
      "Tap Talk anytime to chat with AIAH. It remembers your conversations and grows with you.",
    target: "[data-tutorial='nav-talk']",
    position: "top",
  },
  {
    id: "nav-home",
    title: "Your Dashboard",
    description:
      "Home is your daily hub — check your streak, see quests, and track your life score.",
    target: "[data-tutorial='nav-home']",
    position: "top",
  },
  {
    id: "notifications",
    title: "Stay on Track",
    description:
      "Enable notifications so AIAH can send you daily action plans, nudges, and progress updates.",
    target: null,
    position: "center",
    icon: <Bell className="h-8 w-8 text-[#1D9E75]" />,
    isNotificationStep: true,
  },
  {
    id: "ready",
    title: "You're All Set!",
    description:
      "AIAH is ready to support you. Start by telling it how you're feeling today.",
    target: null,
    position: "center",
    icon: <Sparkles className="h-8 w-8 text-[#1D9E75]" />,
  },
];

/* ------------------------------------------------------------------ */
/*  Spotlight overlay helpers                                          */
/* ------------------------------------------------------------------ */

function getElementRect(selector: string): DOMRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  return el.getBoundingClientRect();
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

interface AppWalkthroughProps {
  onComplete: () => void;
}

export function AppWalkthrough({ onComplete }: AppWalkthroughProps) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [notifStatus, setNotifStatus] = useState<"idle" | "granted" | "denied">("idle");

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  // Update spotlight position
  const updateRect = useCallback(() => {
    if (current.target) {
      const rect = getElementRect(current.target);
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [current.target]);

  useEffect(() => {
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [updateRect]);

  // Handle notification permission
  const requestNotifications = useCallback(async () => {
    if (!("Notification" in window)) {
      setNotifStatus("denied");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotifStatus(permission === "granted" ? "granted" : "denied");

      if (permission === "granted") {
        // Subscribe to push
        const reg = await navigator.serviceWorker?.ready;
        if (reg) {
          try {
            const res = await fetch("/api/push/vapid-public-key");
            const { publicKey } = await res.json();
            const subscription = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: publicKey,
            });
            const keys = subscription.toJSON().keys!;
            await fetch("/api/push/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                endpoint: subscription.endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
              }),
            });
          } catch {
            // Push subscription failed silently — user still granted permission
          }
        }
      }
    } catch {
      setNotifStatus("denied");
    }
  }, []);

  const next = () => {
    if (isLast) {
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  };

  const prev = () => {
    if (!isFirst) setStep((s) => s - 1);
  };

  const skip = () => onComplete();

  // Spotlight clip path
  const spotlightClip = targetRect
    ? `polygon(
        0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
        ${targetRect.left - 8}px ${targetRect.top - 8}px,
        ${targetRect.left - 8}px ${targetRect.bottom + 8}px,
        ${targetRect.right + 8}px ${targetRect.bottom + 8}px,
        ${targetRect.right + 8}px ${targetRect.top - 8}px,
        ${targetRect.left - 8}px ${targetRect.top - 8}px
      )`
    : undefined;

  // Tooltip wrapper position. We set position on a plain div WRAPPER so that
  // framer-motion's animated transform on the inner motion.div doesn't fight
  // a CSS centering transform (which would otherwise drop the card to the
  // bottom-right of the screen).
  const isCentered = !targetRect || current.position === "center";
  const getWrapperStyle = (): React.CSSProperties => {
    if (isCentered) return {}; // centered via flex container instead
    const pad = 16;
    const cardWidth = 320;
    const halfW = cardWidth / 2;
    switch (current.position) {
      case "bottom":
        return {
          position: "fixed",
          top: targetRect!.bottom + pad,
          left: Math.min(
            window.innerWidth - cardWidth - 16,
            Math.max(16, targetRect!.left + targetRect!.width / 2 - halfW),
          ),
        };
      case "top":
        return {
          position: "fixed",
          bottom: window.innerHeight - targetRect!.top + pad,
          left: Math.min(
            window.innerWidth - cardWidth - 16,
            Math.max(16, targetRect!.left + targetRect!.width / 2 - halfW),
          ),
        };
      case "left":
        return {
          position: "fixed",
          top: Math.max(16, targetRect!.top),
          right: window.innerWidth - targetRect!.left + pad,
        };
      case "right":
        return {
          position: "fixed",
          top: Math.max(16, targetRect!.top),
          left: targetRect!.right + pad,
        };
      default:
        return {};
    }
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Dark overlay with spotlight cutout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60"
        style={spotlightClip ? { clipPath: spotlightClip } : undefined}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Spotlight border glow */}
      {targetRect && (
        <motion.div
          layoutId="spotlight"
          className="pointer-events-none absolute rounded-2xl ring-2 ring-[#1D9E75]/60 ring-offset-2 ring-offset-transparent"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      {/* Tooltip card. Wrapper owns positioning so framer-motion's transform
          (used for scale/y animation) doesn't fight with translate centering. */}
      <div
        className={
          isCentered
            ? "fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none"
            : "z-[10000]"
        }
        style={isCentered ? undefined : getWrapperStyle()}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto w-[320px] max-w-[calc(100vw-32px)] rounded-2xl bg-white p-5 shadow-2xl dark:bg-stone-900"
          >
          {/* Skip button */}
          {!isLast && (
            <button
              onClick={skip}
              className="absolute right-3 top-3 rounded-full p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Icon for center steps */}
          {current.icon && current.position === "center" && (
            <div className="mb-3 flex justify-center">
              <div className="rounded-2xl bg-[#1D9E75]/10 p-3">{current.icon}</div>
            </div>
          )}

          {/* Progress dots */}
          <div className="mb-3 flex justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? "w-6 bg-[#1D9E75]"
                    : i < step
                    ? "w-1.5 bg-[#1D9E75]/40"
                    : "w-1.5 bg-stone-300 dark:bg-stone-600"
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <h3 className="mb-1 text-center text-lg font-semibold text-stone-900 dark:text-stone-100">
            {current.title}
          </h3>
          <p className="mb-4 text-center text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            {current.description}
          </p>

          {/* Notification step special UI */}
          {current.isNotificationStep && notifStatus === "idle" && (
            <button
              onClick={requestNotifications}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D9E75] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#178a65]"
            >
              <Bell className="h-4 w-4" />
              Enable Notifications
            </button>
          )}
          {current.isNotificationStep && notifStatus === "granted" && (
            <div className="mb-3 rounded-xl bg-emerald-50 px-4 py-2.5 text-center text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              Notifications enabled!
            </div>
          )}
          {current.isNotificationStep && notifStatus === "denied" && (
            <div className="mb-3 rounded-xl bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              You can enable them later in Account → Notifications
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between">
            {!isFirst ? (
              <button
                onClick={prev}
                className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-stone-500 transition hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={next}
              className="flex items-center gap-1 rounded-xl bg-[#1D9E75] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#178a65]"
            >
              {isLast ? "Let's Go!" : "Next"}
              {!isLast && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
