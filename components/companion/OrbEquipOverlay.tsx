"use client";

/**
 * Renders equipped items visually on top of the orb SVG.
 * Each slot (hat, glasses, background, personality) has a specific anchor position.
 * Items render as large, styled emoji with subtle animations.
 *
 * Coordinate system: orb SVG viewBox is 200×200, center at (100,100), radius ~75.
 */

import { motion } from "framer-motion";

export interface EquipOverlayItem {
  slot: string;
  icon: string | null;
  slug: string;
  rarity: string;
}

interface OrbEquipOverlayProps {
  items: EquipOverlayItem[];
}

// Slot anchor positions relative to 200×200 viewBox
const SLOT_CONFIG: Record<string, {
  x: number;
  y: number;
  fontSize: number;
  /** rotation in degrees */
  rotate?: number;
  /** animation style */
  anim: "float" | "bob" | "pulse" | "none";
}> = {
  hat: {
    x: 100,
    y: 18,
    fontSize: 36,
    rotate: 0,
    anim: "bob",
  },
  glasses: {
    x: 100,
    y: 90,
    fontSize: 32,
    rotate: 0,
    anim: "none",
  },
  background: {
    // Behind the orb — fills the space
    x: 100,
    y: 100,
    fontSize: 60,
    anim: "pulse",
  },
  personality: {
    // Small badge near bottom-right
    x: 155,
    y: 155,
    fontSize: 22,
    anim: "float",
  },
};

// Animation variants
const animVariants = {
  float: {
    animate: { y: [0, -3, 0, 3, 0] },
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const },
  },
  bob: {
    animate: { y: [0, -2, 0] },
    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" as const },
  },
  pulse: {
    animate: { scale: [1, 1.05, 1], opacity: [0.25, 0.35, 0.25] },
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
  },
  none: {
    animate: {},
    transition: { duration: 0 },
  },
};

function getEmoji(icon: string | null, slug: string): string {
  // Direct emoji map for common accessories
  const EMOJI_MAP: Record<string, string> = {
    crown: "👑",
    glasses: "🕶️",
    shirt: "🎀",
    sparkles: "✨",
    shield: "🛡️",
    gem: "💎",
    star: "🌌",
    "flower-2": "🌸",
    binary: "💻",
    orbit: "🪐",
    lightbulb: "💡",
    sun: "☀️",
    rainbow: "🌈",
    diamond: "💠",
    palmtree: "🌴",
    waves: "🏄",
    drama: "🎭",
    flame: "🔥",
  };
  if (icon && EMOJI_MAP[icon]) return EMOJI_MAP[icon];
  // Fallback: try to extract from slug
  for (const [k, v] of Object.entries(EMOJI_MAP)) {
    if (slug.includes(k)) return v;
  }
  return "✨";
}

// Rarity glow filter colors
const RARITY_FILTER: Record<string, string> = {
  common: "none",
  rare: "drop-shadow(0 0 6px rgba(139,92,246,0.5))",
  legendary: "drop-shadow(0 0 8px rgba(251,191,36,0.6)) drop-shadow(0 0 16px rgba(251,191,36,0.3))",
};

export function OrbEquipOverlay({ items }: OrbEquipOverlayProps) {
  if (!items || items.length === 0) return null;

  // Background items render behind the orb (in the parent), others on top
  const foregroundItems = items.filter((i) => i.slot !== "background");
  const backgroundItem = items.find((i) => i.slot === "background");

  return (
    <>
      {/* Background item — rendered as large, semi-transparent emoji behind orb */}
      {backgroundItem && (() => {
        const cfg = SLOT_CONFIG.background;
        const emoji = getEmoji(backgroundItem.icon, backgroundItem.slug);
        const anim = animVariants[cfg.anim];
        return (
          <motion.text
            x={cfg.x}
            y={cfg.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={cfg.fontSize}
            opacity={0.3}
            style={{ filter: RARITY_FILTER[backgroundItem.rarity] || "none" }}
            {...anim}
          >
            {emoji}
          </motion.text>
        );
      })()}

      {/* Foreground items — hat, glasses, personality */}
      {foregroundItems.map((item) => {
        const cfg = SLOT_CONFIG[item.slot];
        if (!cfg) return null;
        const emoji = getEmoji(item.icon, item.slug);
        const anim = animVariants[cfg.anim];
        const filter = RARITY_FILTER[item.rarity] || "none";

        return (
          <motion.text
            key={item.slot}
            x={cfg.x}
            y={cfg.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={cfg.fontSize}
            style={{
              filter,
              transform: cfg.rotate ? `rotate(${cfg.rotate}deg)` : undefined,
              transformOrigin: `${cfg.x}px ${cfg.y}px`,
            }}
            {...anim}
          >
            {emoji}
          </motion.text>
        );
      })}
    </>
  );
}
