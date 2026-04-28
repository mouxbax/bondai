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
    energy?: number;       // energy boost when consumed
    moodBoost?: string;    // temporary mood override
    duration?: number;     // effect duration in ms
  };
}

export const SHOP_ITEMS: ShopItemDef[] = [
  // ─── Food (consumable, restores energy) ──────────────────────────
  {
    slug: "food-apple",
    name: "Fresh Apple",
    description: "A crisp apple. Restores 5% energy.",
    category: "FOOD",
    price: 10,
    icon: "apple",
    rarity: "common",
    consumable: true,
    effect: { energy: 5 },
  },
  {
    slug: "food-pizza",
    name: "Slice of Pizza",
    description: "Comfort food. Restores 10% energy and makes AIAH happy.",
    category: "FOOD",
    price: 25,
    icon: "pizza",
    rarity: "common",
    consumable: true,
    effect: { energy: 10, moodBoost: "happy", duration: 30000 },
  },
  {
    slug: "food-sushi",
    name: "Premium Sushi",
    description: "Deluxe platter. Restores 20% energy.",
    category: "FOOD",
    price: 50,
    icon: "sushi",
    rarity: "rare",
    consumable: true,
    effect: { energy: 20, moodBoost: "energetic", duration: 60000 },
  },
  {
    slug: "food-cake",
    name: "Birthday Cake",
    description: "A whole cake! Restores 35% energy and a party mood.",
    category: "FOOD",
    price: 100,
    icon: "cake",
    rarity: "legendary",
    consumable: true,
    effect: { energy: 35, moodBoost: "happy", duration: 120000 },
  },

  // ─── Drinks (consumable, energy + mood) ──────────────────────────
  {
    slug: "drink-water",
    name: "Glass of Water",
    description: "Hydration is key. Restores 3% energy.",
    category: "DRINK",
    price: 5,
    icon: "droplets",
    rarity: "common",
    consumable: true,
    effect: { energy: 3 },
  },
  {
    slug: "drink-tea",
    name: "Calming Tea",
    description: "A warm cup of chamomile. Calms the orb.",
    category: "DRINK",
    price: 15,
    icon: "coffee",
    rarity: "common",
    consumable: true,
    effect: { energy: 5, moodBoost: "calm", duration: 45000 },
  },
  {
    slug: "drink-energy",
    name: "Energy Drink",
    description: "Instant boost! +15% energy, goes hyper.",
    category: "DRINK",
    price: 40,
    icon: "zap",
    rarity: "rare",
    consumable: true,
    effect: { energy: 15, moodBoost: "energetic", duration: 30000 },
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
