import { z } from "zod";

/**
 * Life OS — the structured annual operating-system profile a user fills in.
 * Every section is optional so the user can fill it progressively.
 * The AI weekly-planner reads ALL of this to generate a tailored week.
 */

export const lifeOsSchema = z.object({
  identity: z
    .object({
      name: z.string().max(80).optional(),
      age: z.number().int().min(10).max(120).optional(),
      location: z.string().max(120).optional(),
      wakeTime: z.string().max(8).optional(), // "08:00"
      sleepTime: z.string().max(8).optional(), // "23:00"
      currentWeightKg: z.number().min(20).max(300).optional(),
      heightCm: z.number().min(100).max(250).optional(),
      shortBio: z.string().max(500).optional(),
    })
    .optional(),

  finances: z
    .object({
      monthlyIncomeEUR: z.number().min(0).max(1000000).optional(),
      monthlyFixedExpensesEUR: z.number().min(0).max(1000000).optional(),
      monthlyFoodEUR: z.number().min(0).max(10000).optional(),
      totalDebtEUR: z.number().min(0).max(10000000).optional(),
      debtPayoffTarget: z.string().max(40).optional(), // "December 2026"
      monthlySavingsGoalEUR: z.number().min(0).max(1000000).optional(),
      notes: z.string().max(1000).optional(),
    })
    .optional(),

  weeklySchedule: z
    .object({
      // Plain-text hourly schedule per weekday — what's already fixed in their life.
      monday: z.string().max(2000).optional(),
      tuesday: z.string().max(2000).optional(),
      wednesday: z.string().max(2000).optional(),
      thursday: z.string().max(2000).optional(),
      friday: z.string().max(2000).optional(),
      saturday: z.string().max(2000).optional(),
      sunday: z.string().max(2000).optional(),
    })
    .optional(),

  fitness: z
    .object({
      goal: z.string().max(200).optional(), // "Lean/athletic, 85kg by July 2026"
      split: z.string().max(200).optional(), // "Push/Pull/Legs 5x"
      sessionsPerWeek: z.number().int().min(0).max(14).optional(),
      cardioPerWeek: z.number().int().min(0).max(14).optional(),
      stepsTarget: z.number().int().min(0).max(50000).optional(),
      notes: z.string().max(1000).optional(),
    })
    .optional(),

  diet: z
    .object({
      kcalTarget: z.number().int().min(800).max(6000).optional(),
      proteinTargetG: z.number().int().min(30).max(400).optional(),
      weeklyBudgetEUR: z.number().min(0).max(2000).optional(),
      approach: z.string().max(500).optional(), // "cut", "maintain", free text
      mealPrepDay: z.string().max(20).optional(),
      notes: z.string().max(1000).optional(),
    })
    .optional(),

  income: z
    .object({
      currentMonthlyEUR: z.number().min(0).max(1000000).optional(),
      targetMonthlyEUR: z.number().min(0).max(1000000).optional(),
      primaryOffer: z.string().max(500).optional(),
      pricing: z.string().max(200).optional(),
      weeklyOutreachTarget: z.number().int().min(0).max(200).optional(),
      weeklyContentTarget: z.number().int().min(0).max(50).optional(),
      notes: z.string().max(1000).optional(),
    })
    .optional(),

  projects: z
    .array(
      z.object({
        name: z.string().max(80),
        description: z.string().max(500).optional(),
        weeklyHoursTarget: z.number().min(0).max(60).optional(),
        nextMilestone: z.string().max(300).optional(),
        deadline: z.string().max(60).optional(),
      }),
    )
    .max(10)
    .optional(),

  rules: z
    .object({
      nonNegotiables: z.array(z.string().max(200)).max(20).optional(),
      hardStops: z.array(z.string().max(200)).max(20).optional(),
    })
    .optional(),

  yearGoals: z
    .array(
      z.object({
        title: z.string().max(200),
        metric: z.string().max(200).optional(),
        deadline: z.string().max(60).optional(),
      }),
    )
    .max(12)
    .optional(),
});

export type LifeOsData = z.infer<typeof lifeOsSchema>;

// ─── Weekly plan ───────────────────────────────────────────────────────────

export const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export interface PlanBlock {
  start: string; // "08:30"
  end: string; // "09:30"
  label: string; // "Deep work — Bondai validation"
  category: "work" | "fitness" | "fuel" | "project" | "money" | "rest" | "personal" | "admin";
  priority?: 1 | 2 | 3;
}

export interface PlanDay {
  key: DayKey;
  theme?: string; // "Energy + output"
  blocks: PlanBlock[];
}

export interface GroceryItem {
  name: string; // "Chicken breast"
  qty: string; // "2 kg"
  category: "protein" | "carbs" | "produce" | "dairy" | "pantry" | "snack" | "other";
}

export interface GroceryList {
  items: GroceryItem[];
  estimatedBudgetEUR?: number;
  note?: string;
}

export interface FinanceSnapshot {
  monthlyIncomeEUR?: number;
  fixedExpensesEUR?: number;
  foodBudgetEUR?: number;
  debtPaymentEUR?: number;
  savingsEUR?: number;
  bufferEUR?: number;
  notes?: string[]; // bullet notes tying money to the week's priorities
}

export interface WorkoutSession {
  day: DayKey;
  name: string; // "Push A"
  focus: string; // "chest + triceps"
  lifts: string[]; // ["Bench 4x8", "OHP 3x10"]
  cardio?: string; // "20min HIIT post-lift"
  durationMin?: number;
}

export interface OutreachGoals {
  dms?: number;
  posts?: number;
  followUps?: number;
  focus?: string;
  contentIdeas?: string[];
}

export interface WeeklyPlanData {
  weekStart: string; // ISO date (Monday)
  weekTheme: string;
  topPriorities: string[];
  keyHabits?: string[]; // daily non-negotiables as short reminders
  days: PlanDay[];
  grocery?: GroceryList;
  finances?: FinanceSnapshot;
  workouts?: WorkoutSession[];
  outreach?: OutreachGoals;
  reflections?: string[]; // Sunday-review prompts specific to this week
  warnings?: string[];
}

export const emptyProfile: LifeOsData = {};
