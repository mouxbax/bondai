"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { sfx } from "@/lib/sfx";
import { haptic } from "@/lib/haptics";
import { getCompanionConfig } from "@/lib/companion-config";

export type OrbMood = "calm" | "happy" | "anxious" | "sad" | "focused" | "energetic" | "tender" | "shy" | "dizzy";

interface AIAHOrbProps {
  mood?: OrbMood;
  size?: number;
  speaking?: boolean;
  listening?: boolean;
  thinking?: boolean;
  energy?: number; // 0-100
  showFace?: boolean;
  onClick?: () => void;
  onMoodChange?: (mood: OrbMood) => void;
}

const moodConfig: Record<OrbMood, {
  colors: [string, string, string];
  speed: number;
  intensity: number;
}> = {
  calm:      { colors: ["#1D9E75", "#4FD1A5", "#8FE3C4"], speed: 1.0, intensity: 0.8 },
  happy:     { colors: ["#F5B945", "#FFD166", "#FFE4A3"], speed: 1.3, intensity: 1.0 },
  anxious:   { colors: ["#8B5CF6", "#A78BFA", "#C4B5FD"], speed: 1.8, intensity: 1.2 },
  sad:       { colors: ["#4A7FA7", "#7BA4C9", "#B4C9DC"], speed: 0.6, intensity: 0.5 },
  focused:   { colors: ["#0D7C6A", "#1D9E75", "#4FD1A5"], speed: 0.9, intensity: 0.9 },
  energetic: { colors: ["#EF4444", "#F97316", "#FBBF24"], speed: 1.6, intensity: 1.3 },
  tender:    { colors: ["#EC4899", "#F9A8D4", "#FCE7F3"], speed: 0.8, intensity: 0.7 },
  shy:       { colors: ["#F472B6", "#FBCFE8", "#FDF2F8"], speed: 0.5, intensity: 0.6 },
  dizzy:     { colors: ["#FBBF24", "#A78BFA", "#34D399"], speed: 2.2, intensity: 1.4 },
};

// ─── Kawaii face component with cursor-tracking eyes ────────────────────────
function KawaiiFace({
  energy = 100,
  speaking = false,
  mood,
  pupilOffset,
}: {
  energy: number;
  speaking: boolean;
  mood: OrbMood;
  pupilOffset: { x: number; y: number }; // -1 to 1 range
}) {
  const [blinking, setBlinking] = useState(false);

  // Blink every 3-5 seconds
  useEffect(() => {
    const blink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    };
    const schedule = () => {
      const delay = 3000 + Math.random() * 2000;
      return setTimeout(() => {
        blink();
        timerRef = schedule();
      }, delay);
    };
    let timerRef = schedule();
    return () => clearTimeout(timerRef);
  }, []);

  const sleeping = energy <= 0;
  const tired = energy > 0 && energy <= 20;

  // Eye config
  const eyeRadius = tired ? 7 : mood === "shy" ? 8 : 9;
  const pupilRadius = tired ? 3 : mood === "shy" ? 3.5 : 4;
  const maxPupilTravel = eyeRadius - pupilRadius - 1;
  // Shy: eyes always look down-left; dizzy: override later
  const shyOverride = mood === "shy";
  const px = shyOverride ? -maxPupilTravel * 0.3 : pupilOffset.x * maxPupilTravel;
  const py = shyOverride ? maxPupilTravel * 0.8 : pupilOffset.y * maxPupilTravel;

  // Sleeping face: closed eyes (arcs) + tiny "z"
  if (sleeping) {
    return (
      <g opacity="0.7">
        {/* Closed left eye */}
        <path d="M74 92 Q83 97 92 92" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        {/* Closed right eye */}
        <path d="M108 92 Q117 97 126 92" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        {/* Sleepy mouth */}
        <line x1="93" y1="115" x2="107" y2="115" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        {/* Zzz */}
        <motion.text
          x="130" y="78" fill="white" fontSize="12" fontWeight="bold" opacity="0.5"
          animate={{ y: [78, 72, 78], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          z
        </motion.text>
        <motion.text
          x="140" y="65" fill="white" fontSize="9" fontWeight="bold" opacity="0.3"
          animate={{ y: [65, 59, 65], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        >
          z
        </motion.text>
      </g>
    );
  }

  return (
    <g>
      {/* Left eye */}
      {blinking ? (
        <path d="M74 92 Q83 97 92 92" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      ) : mood === "dizzy" ? (
        <g>
          <circle cx="83" cy="92" r={eyeRadius} fill="white" opacity="0.95" />
          {/* Dizzy spiral */}
          <motion.g animate={{ rotate: [0, 360] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "83px 92px" }}>
            <path d="M83 88 Q86 90 83 92 Q80 94 83 96" fill="none" stroke="#0b1210" strokeWidth="1.5" strokeLinecap="round" />
          </motion.g>
        </g>
      ) : (
        <g>
          <circle cx="83" cy="92" r={eyeRadius} fill="white" opacity="0.95" />
          <circle cx={83 + px} cy={92 + py} r={pupilRadius} fill="#0b1210" />
          {/* Eye shine */}
          <circle cx={83 + px - 1.5} cy={92 + py - 1.5} r="1.5" fill="white" opacity="0.8" />
        </g>
      )}
      {/* Right eye */}
      {blinking ? (
        <path d="M108 92 Q117 97 126 92" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      ) : mood === "dizzy" ? (
        <g>
          <circle cx="117" cy="92" r={eyeRadius} fill="white" opacity="0.95" />
          {/* Dizzy spiral */}
          <motion.g animate={{ rotate: [0, -360] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "117px 92px" }}>
            <path d="M117 88 Q120 90 117 92 Q114 94 117 96" fill="none" stroke="#0b1210" strokeWidth="1.5" strokeLinecap="round" />
          </motion.g>
        </g>
      ) : (
        <g>
          <circle cx="117" cy="92" r={eyeRadius} fill="white" opacity="0.95" />
          <circle cx={117 + px} cy={92 + py} r={pupilRadius} fill="#0b1210" />
          {/* Eye shine */}
          <circle cx={117 + px - 1.5} cy={92 + py - 1.5} r="1.5" fill="white" opacity="0.8" />
        </g>
      )}

      {/* Blush cheeks when shy */}
      {mood === "shy" && (
        <>
          <motion.circle cx="72" cy="103" r="6" fill="#F472B6" opacity="0.3"
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.circle cx="128" cy="103" r="6" fill="#F472B6" opacity="0.3"
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />
        </>
      )}

      {/* Mouth */}
      {speaking ? (
        <motion.ellipse
          cx="100" cy="113" rx="5" ry="4" fill="white" opacity="0.8"
          animate={{ ry: [3, 5, 3] }}
          transition={{ duration: 0.4, repeat: Infinity }}
        />
      ) : mood === "shy" ? (
        // Shy: tiny wavy nervous smile
        <path d="M95 113 Q100 116 105 113" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      ) : mood === "dizzy" ? (
        // Dizzy: wobbly open mouth
        <motion.ellipse cx="100" cy="114" rx="4" ry="5" fill="white" opacity="0.6"
          animate={{ cx: [99, 101, 99], ry: [4, 6, 4] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      ) : mood === "happy" || mood === "energetic" ? (
        <path d="M90 110 Q100 122 110 110" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
      ) : tired ? (
        <path d="M92 114 Q96 117 100 114 Q104 111 108 114" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
      ) : (
        <path d="M93 112 Q100 119 107 112" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
      )}
    </g>
  );
}

// ─── Energy ring component ─────────────────────────────────────────────────
function EnergyRing({ energy, color }: { energy: number; color: string }) {
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (energy / 100) * circumference;

  return (
    <g>
      {/* Background ring */}
      <circle
        cx="100" cy="100" r={radius}
        fill="none" stroke="white" strokeWidth="2" opacity="0.08"
      />
      {/* Energy fill */}
      <motion.circle
        cx="100" cy="100" r={radius}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 100 100)"
        opacity="0.6"
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </g>
  );
}

export function AIAHOrb({
  mood = "calm",
  size = 200,
  speaking = false,
  listening = false,
  thinking = false,
  energy = 100,
  showFace = true,
  onClick,
  onMoodChange,
}: AIAHOrbProps) {
  // effectiveConfig is derived below after touch state setup
  const id = useMemo(() => `orb-${Math.random().toString(36).slice(2, 9)}`, []);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

  // ─── Touch interaction state ────────────────────────────────────────
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchMoveCountRef = useRef(0);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef(0);
  const [touchMood, setTouchMood] = useState<OrbMood | null>(null);
  const touchMoodTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Visual feedback state
  const [glowFlash, setGlowFlash] = useState(false);
  const [shakeActive, setShakeActive] = useState(false);

  // Play sound + haptic for a mood reaction (respects companion config)
  const playReaction = useCallback((type: "purr" | "shy" | "dizzy" | "wakeUp" | "tap") => {
    const config = getCompanionConfig();
    if (config.soundEnabled) {
      sfx[type]();
    }
    // Haptics always fire (they have their own reduced-motion check)
    const hapticMap: Record<string, "tap" | "pop" | "success" | "error"> = {
      purr: "success",
      shy: "pop",
      dizzy: "error",
      wakeUp: "success",
      tap: "tap",
    };
    haptic(hapticMap[type] ?? "tap");

    // Flash glow
    setGlowFlash(true);
    setTimeout(() => setGlowFlash(false), 400);
  }, []);

  // Apply touch mood temporarily, then revert
  const applyTouchMood = useCallback((m: OrbMood, durationMs = 2500) => {
    setTouchMood(m);
    onMoodChange?.(m);
    if (touchMoodTimerRef.current) clearTimeout(touchMoodTimerRef.current);
    touchMoodTimerRef.current = setTimeout(() => {
      setTouchMood(null);
    }, durationMs);
  }, [onMoodChange]);

  // Shake detection via DeviceMotion
  useEffect(() => {
    if (typeof window === "undefined") return;
    let lastShake = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const force = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2);
      if (force > 25 && Date.now() - lastShake > 3000) {
        lastShake = Date.now();
        applyTouchMood("dizzy", 3000);
        playReaction("dizzy");
        setShakeActive(true);
        setTimeout(() => setShakeActive(false), 3000);
      }
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [applyTouchMood, playReaction]);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // Prevent page scroll & text selection while interacting with the orb
    e.preventDefault();
    e.stopPropagation();
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    touchMoveCountRef.current = 0;

    // Double-tap detection (wake up)
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      if (energy <= 0) {
        applyTouchMood("happy", 2000);
        playReaction("wakeUp");
      } else {
        playReaction("tap");
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }

    // Long hold = purr (tender + slow pulse)
    holdTimerRef.current = setTimeout(() => {
      applyTouchMood("tender", 3000);
      playReaction("purr");
    }, 800);
  }, [energy, applyTouchMood, playReaction]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    touchMoveCountRef.current += 1;
    // If moving a lot, cancel hold
    if (holdTimerRef.current && touchMoveCountRef.current > 3) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    lastTouchEndTime.current = Date.now();
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    // Petting = multiple small moves on the orb
    if (touchMoveCountRef.current >= 5 && touchMoveCountRef.current < 30) {
      applyTouchMood("shy", 2500);
      playReaction("shy");
    }
    // Single tap without hold or petting — play tap sound
    if (touchMoveCountRef.current < 3 && touchStartRef.current) {
      const elapsed = Date.now() - touchStartRef.current.time;
      if (elapsed < 300 && elapsed > 0) {
        playReaction("tap");
      }
    }
    touchStartRef.current = null;
  }, [applyTouchMood, playReaction]);

  // Desktop click reaction (plays tap sound + haptic)
  // Suppress click if we just had a touch interaction (avoids double-fire on mobile)
  const lastTouchEndTime = useRef(0);
  const handleClick = useCallback(() => {
    if (Date.now() - lastTouchEndTime.current < 500) return; // skip ghost click from touch
    playReaction("tap");
    onClick?.();
  }, [onClick, playReaction]);

  // Effective mood (touch mood overrides prop mood)
  const effectiveMood = touchMood ?? mood;
  const effectiveConfig = moodConfig[effectiveMood];

  // Track cursor position relative to orb center
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = Math.max(rect.width, 400);
    const norm = Math.min(dist / maxDist, 1);
    setPupilOffset({
      x: dist > 0 ? (dx / dist) * norm : 0,
      y: dist > 0 ? (dy / dist) * norm : 0,
    });
  }, []);

  useEffect(() => {
    if (!showFace) return;
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [showFace, handleMouseMove]);

  const breathDuration = energy <= 0 ? 6 : 4 / effectiveConfig.speed;
  const active = speaking || listening || thinking;

  return (
    <motion.div
      ref={containerRef}
      className="relative inline-block cursor-pointer select-none"
      style={{ width: size, height: size, touchAction: "none", WebkitUserSelect: "none" }}
      onClick={handleClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      animate={
        shakeActive
          ? { x: [0, -4, 4, -3, 3, -2, 2, 0], rotate: [0, -2, 2, -1, 1, 0] }
          : { x: 0, rotate: 0 }
      }
      transition={
        shakeActive
          ? { duration: 0.5, repeat: Infinity, repeatType: "mirror" as const }
          : { duration: 0.3 }
      }
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${effectiveConfig.colors[0]}40 0%, transparent 70%)`,
          filter: "blur(20px)",
        }}
        animate={{
          scale: [1, 1.15 * effectiveConfig.intensity, 1],
          opacity: [0.5, 0.9, 0.5],
        }}
        transition={{
          duration: breathDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Pulse rings when active */}
      {listening && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: effectiveConfig.colors[0] }}
            animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: effectiveConfig.colors[0] }}
            animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
          />
        </>
      )}

      {/* Main orb SVG */}
      <svg
        viewBox="0 0 200 200"
        className="relative z-10"
        style={{ width: size, height: size, opacity: energy <= 0 ? 0.6 : 1, transition: "opacity 0.5s ease" }}
      >
        <defs>
          {/* Gradient fill */}
          <radialGradient id={`${id}-grad`} cx="35%" cy="35%" r="75%">
            <stop offset="0%" stopColor={effectiveConfig.colors[2]} stopOpacity="1" />
            <stop offset="50%" stopColor={effectiveConfig.colors[1]} stopOpacity="0.95" />
            <stop offset="100%" stopColor={effectiveConfig.colors[0]} stopOpacity="1" />
          </radialGradient>

          {/* Inner glow */}
          <radialGradient id={`${id}-innerglow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          {/* Noise filter for organic feel */}
          <filter id={`${id}-noise`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" />
            <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.05 0" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        </defs>

        {/* Main orb body - morphing blob */}
        <motion.g
          animate={{
            scale: active ? [1, 1.04, 0.98, 1.02, 1] : [1, 1.03, 1],
          }}
          transition={{
            duration: active ? breathDuration / 2 : breathDuration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "100px 100px" }}
        >
          <motion.circle
            cx="100"
            cy="100"
            r="75"
            fill={`url(#${id}-grad)`}
            animate={{
              r: [75, 78, 73, 76, 75],
            }}
            transition={{
              duration: breathDuration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Inner light */}
          <circle cx="100" cy="100" r="75" fill={`url(#${id}-innerglow)`} />

          {/* Noise overlay */}
          <circle cx="100" cy="100" r="75" filter={`url(#${id}-noise)`} opacity="0.3" />
        </motion.g>

        {/* Floating particles when thinking */}
        {thinking && (
          <>
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.circle
                key={i}
                cx={100 + Math.cos((i / 5) * Math.PI * 2) * 60}
                cy={100 + Math.sin((i / 5) * Math.PI * 2) * 60}
                r="3"
                fill={effectiveConfig.colors[2]}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </>
        )}

        {/* Energy ring */}
        {showFace && (
          <EnergyRing energy={energy} color={effectiveConfig.colors[0]} />
        )}

        {/* Kawaii face */}
        {showFace && (
          <KawaiiFace energy={energy} speaking={speaking} mood={effectiveMood} pupilOffset={pupilOffset} />
        )}

        {/* Speaking waveform */}
        {speaking && (
          <motion.g
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            {[0, 1, 2, 3, 4].map((i) => {
              const angle = (i / 5) * Math.PI * 2;
              const x1 = 100 + Math.cos(angle) * 85;
              const y1 = 100 + Math.sin(angle) * 85;
              const x2 = 100 + Math.cos(angle) * 95;
              const y2 = 100 + Math.sin(angle) * 95;
              return (
                <motion.line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={effectiveConfig.colors[0]}
                  strokeWidth="3"
                  strokeLinecap="round"
                  animate={{
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              );
            })}
          </motion.g>
        )}
      </svg>

      {/* Glow flash on touch reaction */}
      <AnimatePresence>
        {glowFlash && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none z-20"
            style={{
              background: `radial-gradient(circle, ${effectiveConfig.colors[1]}80 0%, transparent 60%)`,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 1.4 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>

      {/* Subtle shadow beneath */}
      <motion.div
        className="absolute left-1/2 -bottom-4 h-2 rounded-full"
        style={{
          width: size * 0.6,
          background: `radial-gradient(ellipse, ${effectiveConfig.colors[0]}30 0%, transparent 70%)`,
          transform: "translateX(-50%)",
          filter: "blur(8px)",
        }}
        animate={{
          scaleX: [1, 1.1, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: breathDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}
