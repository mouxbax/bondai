/**
 * Maps shop item icon slugs to emoji characters.
 * Used across shop, inventory, and anywhere items are displayed.
 */
export const ITEM_EMOJI: Record<string, string> = {
  // Food
  apple: "🍎",
  pizza: "🍕",
  sushi: "🍣",
  cake: "🎂",
  icecream: "🍦",
  coconut: "🥥",

  // Drinks
  droplets: "💧",
  coffee: "🍵",
  zap: "⚡",

  // Accessories
  crown: "👑",
  glasses: "🕶️",
  shirt: "🎀",
  sparkles: "✨",
  shield: "🛡️",
  gem: "💎",

  // Backgrounds / Skins
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

  // Personality
  drama: "🎭",
  flame: "🔥",
};

/**
 * Rarity-based glow colors for item cards.
 */
export const RARITY_GLOW: Record<string, { ring: string; bg: string; shadow: string }> = {
  common: {
    ring: "ring-stone-400/30 dark:ring-stone-500/20",
    bg: "from-stone-100 to-stone-200 dark:from-stone-800/40 dark:to-stone-900/40",
    shadow: "shadow-stone-300/30 dark:shadow-stone-700/20",
  },
  rare: {
    ring: "ring-violet-400/40 dark:ring-violet-500/30",
    bg: "from-violet-100 to-violet-200 dark:from-violet-900/30 dark:to-violet-950/30",
    shadow: "shadow-violet-400/30 dark:shadow-violet-500/20",
  },
  legendary: {
    ring: "ring-amber-400/50 dark:ring-amber-500/40",
    bg: "from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-950/30",
    shadow: "shadow-amber-400/40 dark:shadow-amber-500/30",
  },
};

/**
 * Get emoji for an icon slug, with fallback.
 */
export function getItemEmoji(icon: string | null | undefined): string {
  if (!icon) return "📦";
  return ITEM_EMOJI[icon] ?? "📦";
}
