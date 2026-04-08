import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
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
 * Get the plan name for display
 */
export function getPlanDisplayName(plan: SubscriptionPlan): string {
  switch (plan) {
    case 'plus':
      return 'Plus';
    case 'care_plus':
      return 'Care+';
    default:
      return 'Free';
  }
}

export default stripe;
