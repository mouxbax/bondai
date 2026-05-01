/**
 * Energy system utilities.
 *
 * - Max energy: 100
 * - Passive recharge: 1% per minute
 * - Plan generation: costs 50%
 * - Practice/coaching: costs 10%
 * - Breathing session: recharges 15%
 * - 7-day rolling cooldown for plan generation
 */

export const MAX_ENERGY = 100;
export const PASSIVE_RECHARGE_PER_MIN = 1;
export const PLAN_GENERATION_COST = 50; // legacy — now we drop to PLAN_ENERGY_FLOOR
export const PLAN_ENERGY_FLOOR = 13;   // energy drops to this after generating a plan
export const PRACTICE_COST = 10;
export const BREATHING_RECHARGE = 15;
export const PLAN_COOLDOWN_DAYS = 7;

/**
 * Calculate current energy based on stored energy + time elapsed since last update.
 * Returns clamped 0-100.
 */
export function calculateCurrentEnergy(
  storedEnergy: number,
  lastUpdate: Date,
  now: Date = new Date(),
): number {
  const elapsedMs = now.getTime() - lastUpdate.getTime();
  const elapsedMin = Math.max(0, elapsedMs / 60_000);
  const recharged = Math.floor(elapsedMin * PASSIVE_RECHARGE_PER_MIN);
  return Math.min(MAX_ENERGY, storedEnergy + recharged);
}

/**
 * Check if the user can generate a new plan (7-day cooldown).
 * Returns { canGenerate, nextAvailableAt }.
 */
export function checkPlanCooldown(lastPlanGeneratedAt: Date | null): {
  canGenerate: boolean;
  nextAvailableAt: Date | null;
} {
  if (!lastPlanGeneratedAt) {
    return { canGenerate: true, nextAvailableAt: null };
  }
  const cooldownEnd = new Date(lastPlanGeneratedAt.getTime() + PLAN_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  if (now >= cooldownEnd) {
    return { canGenerate: true, nextAvailableAt: null };
  }
  return { canGenerate: false, nextAvailableAt: cooldownEnd };
}
