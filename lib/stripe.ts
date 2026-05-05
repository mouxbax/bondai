import Stripe from 'stripe';

// Lazy-init Stripe so the build doesn't crash when STRIPE_SECRET_KEY is missing
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia',
    });
  }
  return _stripe;
}

// Proxy: behaves like the old `stripe` default export but initializes lazily
const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Price IDs for subscription tiers
export const PRICE_PLUS = process.env.STRIPE_PRICE_PLUS || 'price_1TJxK874qNRG6c1R8tFGLEn1';
export const PRICE_CARE_PLUS = process.env.STRIPE_PRICE_CARE_PLUS || 'price_1TJxK974qNRG6c1RfE8gwLMO';

// Subscription status types
export type SubscriptionStatus = 'free' | 'trialing' | 'active' | 'canceled' | 'past_due';
export type SubscriptionPlan = 'free' | 'plus' | 'care_plus';

/**
 * Check if a subscription is currently active (including trial period)
 */
export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'trialing';
}

/**
 * Get plan type from Stripe price ID
 */
export function getPlanFromPriceId(priceId: string): SubscriptionPlan {
  if (priceId === PRICE_PLUS) return 'plus';
  if (priceId === PRICE_CARE_PLUS) return 'care_plus';
  return 'free';
}

/**
 * Get the plan name for display.
 * Branded — these strings appear on the subscribe page, in account UI,
 * and in any operational copy that surfaces the plan name.
 */
export function getPlanDisplayName(plan: SubscriptionPlan): string {
  switch (plan) {
    case 'plus':
      return 'AIAH Plus';
    case 'care_plus':
      return 'AIAH Care+';
    default:
      return 'AIAH';
  }
}

export default stripe;
