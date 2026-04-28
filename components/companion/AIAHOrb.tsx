"use client";

import { motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";

export type OrbMood = "calm" | "happy" | "anxious" | "sad" | "focused" | "energetic" | "tender";

interface AIAHOrbProps {
  mood?: OrbMood;
  size?: number;
  speaking?: boolean;
  listening?: boolean;
  thinking?: boolean;
  energy?: number; // 0-100
  showFace?: boolean;
  onClick?: () => void;
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
};

// ─── Kawaii face component ──────────────────────────────────────────────────
function KawaiiFace({ energy = 100, speaking = false, mood }: { energy: number; speaking: boolean; mood: OrbMood }) {
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

  // Sleeping face: closed eyes (lines) + tiny "z"
  if (sleeping) {
    return (
      <g opacity="0.7">
        {/* Closed left eye */}
        <motion.line x1="78" y1="92" x2="88" y2="92" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        {/* Closed right eye */}
        <motion.line x1="112" y1="92" x2="122" y2="92" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        {/* Sleepy mouth — flat line */}
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
        <line x1="78" y1="92" x2="88" y2="92" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      ) : (
        <circle cx="83" cy="92" r={tired ? 3 : 4} fill="white" />
      )}
      {/* Right eye */}
      {blinking ? (
        <line x1="112" y1="92" x2="122" y2="92" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      ) : (
        <circle cx="117" cy="92" r={tired ? 3 : 4} fill="white" />
      )}

      {/* Mouth */}
      {speaking ? (
        // Speaking: small open circle
        <motion.ellipse
          cx="100" cy="113" rx="5" ry="4" fill="white" opacity="0.8"
          animate={{ ry: [3, 5, 3] }}
          transition={{ duration: 0.4, repeat: Infinity }}
        />
      ) : mood === "happy" || mood === "energetic" ? (
        // Happy: bigger smile
        <path d="M90 110 Q100 122 110 110" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
      ) : tired ? (
        // Tired: wavy line
        <path d="M92 114 Q96 117 100 114 Q104 111 108 114" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
      ) : (
        // Default: gentle curve smile
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
}: AIAHOrbProps) {
  const config = moodConfig[mood];
  const id = useMemo(() => `orb-${Math.random().toString(36).slice(2, 9)}`, []);

  const breathDuration = energy <= 0 ? 6 : 4 / config.speed; // Slower breathing when sleeping
  const active = speaking || listening || thinking;

  return (
    <motion.div
      className="relative inline-block cursor-pointer select-none"
      style={{ width: size, height: size }}
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${config.colors[0]}40 0%, transparent 70%)`,
          filter: "blur(20px)",
        }}
        animate={{
          scale: [1, 1.15 * config.intensity, 1],
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
            style={{ borderColor: config.colors[0] }}
            animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: config.colors[0] }}
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
            <stop offset="0%" stopColor={config.colors[2]} stopOpacity="1" />
            <stop offset="50%" stopColor={config.colors[1]} stopOpacity="0.95" />
            <stop offset="100%" stopColor={config.colors[0]} stopOpacity="1" />
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
                fill={config.colors[2]}
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
          <EnergyRing energy={energy} color={config.colors[0]} />
        )}

        {/* Kawaii face */}
        {showFace && (
          <KawaiiFace energy={energy} speaking={speaking} mood={mood} />
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
                  stroke={config.colors[0]}
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

      {/* Subtle shadow beneath */}
      <motion.div
        className="absolute left-1/2 -bottom-4 h-2 rounded-full"
        style={{
          width: size * 0.6,
          background: `radial-gradient(ellipse, ${config.colors[0]}30 0%, transparent 70%)`,
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
