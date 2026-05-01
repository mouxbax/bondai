/**
 * Shop item catalog — defines all purchasable items.
 * These are seeded into the ShopItem table on first deploy.
 */

export interface ShopItemDef {
  slug: string;
  name: string;
  description: string;
  category: "FOOD" | "DRINK" | "ACCESSORY" | "BACKGROUND" | "PERSONALITY";
  price: number;
  icon: string;
  rarity: "common" | "rare" | "legendary";
  consumable: boolean;
  effect?: {
    evoXp?: number;        // evolution XP when fed to companion
    moodBoost?: string;    // temporary mood override
    duration?: number;     // effect duration in ms
  };
  seasonal?: boolean;
  seasonTag?: string;      // e.g. "summer-2026"
  availableFrom?: string;  // ISO date
  availableUntil?: string; // ISO date
}

export const SHOP_ITEMS: ShopItemDef[] = [
  // ─── Food (consumable, gives EvoXP to help companion evolve) ────
  {
    slug: "food-apple",
    name: "Fresh Apple",
    description: "A crisp apple. +5 EvoXP toward evolution.",
    category: "FOOD",
    price: 10,
    icon: "apple",
    rarity: "common",
    consumable: true,
    effect: { evoXp: 5 },
  },
  {
    slug: "food-pizza",
    name: "Slice of Pizza",
    description: "Comfort food. +5 EvoXP and makes your companion happy.",
    category: "FOOD",
    price: 25,
    icon: "pizza",
    rarity: "common",
    consumable: true,
    effect: { evoXp: 5, moodBoost: "happy", duration: 30000 },
  },
  {
    slug: "food-sushi",
    name: "Premium Sushi",
    description: "Deluxe platter. +15 EvoXP — rare quality food!",
    category: "FOOD",
    price: 50,
    icon: "sushi",
    rarity: "rare",
    consumable: true,
    effect: { evoXp: 15, moodBoost: "energetic", duration: 60000 },
  },
  {
    slug: "food-cake",
    name: "Birthday Cake",
    description: "A whole cake! +40 EvoXP — legendary feast!",
    category: "FOOD",
    price: 100,
    icon: "cake",
    rarity: "legendary",
    consumable: true,
    effect: { evoXp: 40, moodBoost: "happy", duration: 120000 },
  },

  // ─── Drinks (consumable, EvoXP + mood) ──────────────────────────
  {
    slug: "drink-water",
    name: "Glass of Water",
    description: "Hydration is key. +5 EvoXP.",
    category: "DRINK",
    price: 5,
    icon: "droplets",
    rarity: "common",
    consumable: true,
    effect: { evoXp: 5 },
  },
  {
    slug: "drink-tea",
    name: "Calming Tea",
    description: "A warm cup of chamomile. +5 EvoXP, calms your companion.",
    category: "DRINK",
    price: 15,
    icon: "coffee",
    rarity: "common",
    consumable: true,
    effect: { evoXp: 5, moodBoost: "calm", duration: 45000 },
  },
  {
    slug: "drink-energy",
    name: "Power Elixir",
    description: "Potent brew! +15 EvoXP, goes hyper.",
    category: "DRINK",
    price: 40,
    icon: "zap",
    rarity: "rare",
    consumable: true,
    effect: { evoXp: 15, moodBoost: "energetic", duration: 30000 },
  },

  // ─── Accessories (equippable, permanent) ─────────────────────────
  {
    slug: "acc-crown",
    name: "Golden Crown",
    description: "A tiny crown for your orb. Royalty vibes.",
    category: "ACCESSORY",
    price: 200,
    icon: "crown",
    rarity: "legendary",
    consumable: false,
  },
  {
    slug: "acc-glasses",
    name: "Cool Shades",
    description: "Sunglasses that make AIAH look cool.",
    category: "ACCESSORY",
    price: 75,
    icon: "glasses",
    rarity: "rare",
    consumable: false,
  },
  {
    slug: "acc-bowtie",
    name: "Bowtie",
    description: "A dapper bowtie. Very distinguished.",
    category: "ACCESSORY",
    price: 50,
    icon: "shirt",
    rarity: "common",
    consumable: false,
  },
  {
    slug: "acc-halo",
    name: "Angel Halo",
    description: "A floating golden halo. Pure vibes.",
    category: "ACCESSORY",
    price: 150,
    icon: "sparkles",
    rarity: "rare",
    consumable: false,
  },

  // ─── Backgrounds ─────────────────────────────────────────────────
  {
    slug: "bg-starfield",
    name: "Starfield",
    description: "A cosmic starry background for the orb.",
    category: "BACKGROUND",
    price: 100,
    icon: "star",
    rarity: "rare",
    consumable: false,
  },
  {
    slug: "bg-sakura",
    name: "Sakura Petals",
    description: "Floating cherry blossom petals.",
    category: "BACKGROUND",
    price: 120,
    icon: "flower-2",
    rarity: "rare",
    consumable: false,
  },
  {
    slug: "bg-matrix",
    name: "Matrix Rain",
    description: "Digital rain. Very hacker.",
    category: "BACKGROUND",
    price: 80,
    icon: "binary",
    rarity: "common",
    consumable: false,
  },

  // ─── Personality packs ───────────────────────────────────────────
  {
    slug: "pers-sarcastic",
    name: "Sarcastic Mode",
    description: "AIAH gets a bit snarky. Responses with dry wit.",
    category: "PERSONALITY",
    price: 250,
    icon: "drama",
    rarity: "legendary",
    consumable: false,
  },
  {
    slug: "pers-hype",
    name: "Hype Beast",
    description: "AIAH becomes your biggest cheerleader. Maximum energy.",
    category: "PERSONALITY",
    price: 150,
    icon: "flame",
    rarity: "rare",
    consumable: false,
  },

  // ─── Orb skins (cosmetic auras) ─────────────────────────────────
  {
    slug: "skin-galaxy",
    name: "Galaxy Aura",
    description: "A swirling cosmic aura around your orb.",
    category: "BACKGROUND",
    price: 300,
    icon: "orbit",
    rarity: "legendary",
    consumable: false,
  },
  {
    slug: "skin-neon",
    name: "Neon Glow",
    description: "Vibrant neon trails follow your orb.",
    category: "BACKGROUND",
    price: 200,
    icon: "lightbulb",
    rarity: "rare",
    consumable: false,
  },
  {
    slug: "skin-golden",
    name: "Golden Radiance",
    description: "A warm golden aura. True flex.",
    category: "BACKGROUND",
    price: 400,
    icon: "sun",
    rarity: "legendary",
    consumable: false,
  },
  {
    slug: "skin-holographic",
    name: "Holographic",
    description: "Iridescent shifting colors. Mesmerizing.",
    category: "BACKGROUND",
    price: 350,
    icon: "rainbow",
    rarity: "legendary",
    consumable: false,
  },
  {
    slug: "skin-diamond",
    name: "Diamond Shell",
    description: "Crystalline diamond overlay. Ultimate status.",
    category: "BACKGROUND",
    price: 500,
    icon: "diamond",
    rarity: "legendary",
    consumable: false,
  },

  // ─── XP Boost + Streak Shield (purchasable power-ups) ──────────
  {
    slug: "boost-xp2x",
    name: "2x XP Boost",
    description: "Double all XP earned for 1 hour.",
    category: "DRINK",
    price: 30,
    icon: "zap",
    rarity: "rare",
    consumable: true,
    effect: { duration: 3600000 },
  },
  {
    slug: "boost-streak-shield",
    name: "Streak Shield",
    description: "Miss a day without breaking your streak. One-time use.",
    category: "ACCESSORY",
    price: 50,
    icon: "shield",
    rarity: "rare",
    consumable: true,
  },

  // ─── Summer 2026 — limited-time seasonal drop ──────────────────
  {
    slug: "summer-sunglasses",
    name: "Beach Shades",
    description: "Limited edition summer sunglasses. Never comes back!",
    category: "ACCESSORY",
    price: 120,
    icon: "sun",
    rarity: "legendary",
    consumable: false,
    seasonal: true,
    seasonTag: "summer-2026",
    availableFrom: "2026-06-01",
    availableUntil: "2026-09-01",
  },
  {
    slug: "summer-surfboard",
    name: "Surfboard",
    description: "Hang ten! Summer-only accessory.",
    category: "ACCESSORY",
    price: 150,
    icon: "waves",
    rarity: "legendary",
    consumable: false,
    seasonal: true,
    seasonTag: "summer-2026",
    availableFrom: "2026-06-01",
    availableUntil: "2026-09-01",
  },
  {
    slug: "summer-tropical-aura",
    name: "Tropical Aura",
    description: "Palm trees and sunset vibes. Limited edition!",
    category: "BACKGROUND",
    price: 250,
    icon: "palmtree",
    rarity: "legendary",
    consumable: false,
    seasonal: true,
    seasonTag: "summer-2026",
    availableFrom: "2026-06-01",
    availableUntil: "2026-09-01",
  },
  {
    slug: "summer-coconut",
    name: "Coconut Drink",
    description: "Refreshing! +15 EvoXP. Summer only.",
    category: "DRINK",
    price: 20,
    icon: "coconut",
    rarity: "rare",
    consumable: true,
    effect: { evoXp: 15, moodBoost: "happy", duration: 30000 },
    seasonal: true,
    seasonTag: "summer-2026",
    availableFrom: "2026-06-01",
    availableUntil: "2026-09-01",
  },
  {
    slug: "summer-icecream",
    name: "Rainbow Ice Cream",
    description: "Brain freeze! +15 EvoXP. Summer exclusive.",
    category: "FOOD",
    price: 35,
    icon: "icecream",
    rarity: "rare",
    consumable: true,
    effect: { evoXp: 15, moodBoost: "energetic", duration: 45000 },
    seasonal: true,
    seasonTag: "summer-2026",
    availableFrom: "2026-06-01",
    availableUntil: "2026-09-01",
  },
];

// Coin rewards for various actions
export const COIN_REWARDS = {
  dailyCheckin: 5,
  streakDay: 2,       // per day of streak
  streak7Bonus: 25,   // bonus at 7-day streak
  streak30Bonus: 100, // bonus at 30-day streak
  coachingComplete: 10,
  goalComplete: 15,
  breathingSession: 3,
} as const;
