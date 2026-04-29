/**
 * Coin pack definitions for AIAH
 * These packs are sold via Stripe Checkout (payment mode, not subscription)
 */

export interface CoinPack {
  id: string;
  name: string;
  coins: number;
  bonusCoins: number;
  price: number; // in cents (e.g., 99 for $0.99)
  description: string;
  badge?: string;
  stripePriceId?: string;
}

export const COIN_PACKS: Record<string, CoinPack> = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    coins: 100,
    bonusCoins: 0,
    price: 99,
    description: 'Perfect for your first purchase',
    stripePriceId: process.env.STRIPE_PRICE_COINS_STARTER || '',
  },
  popular: {
    id: 'popular',
    name: 'Popular Pack',
    coins: 500,
    bonusCoins: 50,
    price: 399,
    description: 'Most loved by our users',
    badge: 'BEST VALUE',
    stripePriceId: process.env.STRIPE_PRICE_COINS_POPULAR || '',
  },
  mega: {
    id: 'mega',
    name: 'Mega Pack',
    coins: 1200,
    bonusCoins: 300,
    price: 799,
    description: 'Biggest savings and most coins',
    stripePriceId: process.env.STRIPE_PRICE_COINS_MEGA || '',
  },
};

/**
 * Get a coin pack by ID
 */
export function getCoinPackById(packId: string): CoinPack | null {
  return COIN_PACKS[packId] || null;
}

/**
 * Get total coins for a pack (base + bonus)
 */
export function getTotalCoins(pack: CoinPack): number {
  return pack.coins + pack.bonusCoins;
}

/**
 * Get all available packs in display order
 */
export function getAllPacks(): CoinPack[] {
  return [COIN_PACKS.starter, COIN_PACKS.popular, COIN_PACKS.mega];
}
