import { FALLBACK_MODEL, PRIMARY_MODEL, getOpenRouterClient } from "@/lib/ai/client";
import type {
  LifeOsData,
  WeeklyPlanData,
  PlanBlock,
  PlanDay,
  DayKey,
  GroceryItem,
  GroceryList,
  FinanceSnapshot,
  WorkoutSession,
  OutreachGoals,
} from "@/lib/life-os/types";
import { DAY_KEYS } from "@/lib/life-os/types";

/**
 * Generate a rich, fully scheduled week from the user's Life OS profile.
 * Output includes: time-blocked days, workouts, grocery list, finances snapshot,
 * outreach/content targets, key habits, Sunday-review reflections.
 */

const SYSTEM = `You are an elite life-operating-system planner. You read a user's Life OS profile (identity, year goals, finances, fixed weekly schedule, fitness, diet, income plans, projects, rules) and return ONE detailed week that moves them toward their goals without burning them out.

Return STRICT JSON — no prose, no markdown, no code fences. Shape:

{
  "weekTheme": "<punchy headline e.g. 'Lean week — debt +800€, Bondai interviews x5'>",
  "topPriorities": ["3 to 5 specific, outcome-oriented priorities for the week"],
  "keyHabits": ["6 to 8 short daily reminders — non-negotiables translated into concrete cues"],
  "days": [
    {
      "key": "monday"|"tuesday"|"wednesday"|"thursday"|"friday"|"saturday"|"sunday",
      "theme": "<short day theme>",
      "blocks": [
        { "start": "HH:MM", "end": "HH:MM", "label": "<concrete task, named>", "category": "work"|"fitness"|"fuel"|"project"|"money"|"rest"|"personal"|"admin", "priority": 1|2|3 }
      ]
    }
  ],
  "workouts": [
    { "day": "<day key>", "name": "<session name e.g. Push A>", "focus": "<muscles / goal>", "lifts": ["Bench 4x8", "..."], "cardio": "<optional>", "durationMin": 60 }
  ],
  "grocery": {
    "items": [ { "name": "Chicken breast", "qty": "2 kg", "category": "protein"|"carbs"|"produce"|"dairy"|"pantry"|"snack"|"other" } ],
    "estimatedBudgetEUR": 65,
    "note": "<optional tip>"
  },
  "finances": {
    "monthlyIncomeEUR": 0, "fixedExpensesEUR": 0, "foodBudgetEUR": 0,
    "debtPaymentEUR": 0, "savingsEUR": 0, "bufferEUR": 0,
    "notes": ["2-4 bullets tying money moves to this week"]
  },
  "outreach": {
    "dms": 0, "posts": 0, "followUps": 0,
    "focus": "<who to target / angle>",
    "contentIdeas": ["3-5 concrete post or message angles"]
  },
  "reflections": ["3-5 Sunday-review prompts specific to this week"],
  "warnings": ["optional flags about trade-offs"]
}

RULES:
- Output ALL 7 days monday..sunday in order. Each day 6–12 blocks. No overlapping blocks. HH:MM 24h.
- Respect fixed commitments in weeklySchedule (work hours, school). Build around them; do NOT overwrite them.
- Honour non-negotiables and hard stops.
- Every day: wake time + sleep wind-down consistent with identity.wakeTime / sleepTime. Include breakfast, lunch, dinner.
- Fitness: hit sessionsPerWeek; distribute intelligently. "workouts" array must align 1-to-1 with the fitness blocks you scheduled.
- Grocery: build from diet targets (kcal, protein, budget, approach). Use realistic European quantities. Total items 12–22.
- Finances: use the user's real numbers from profile.finances. All fields in EUR. debtPaymentEUR should reflect monthly payoff pace implied by totalDebtEUR and debtPayoffTarget.
- Outreach: use income.weeklyOutreachTarget and weeklyContentTarget if provided; otherwise propose sensible numbers.
- Block labels must be SPECIFIC: name the project, name the lift, name the outreach target. No "Work" or "Gym" — say "Deep work — Bondai user interviews" or "Push A — bench 4x8".
- Priority 1 = income/debt/top project move. 2 = health + learning. 3 = admin/rest.
- Be realistic: don't schedule deep work at 23:30 if sleep time is 23:00.
- OUTPUT ONLY THE JSON OBJECT. Nothing before or after.`;

interface RawBlock {
  start?: unknown;
  end?: unknown;
  label?: unknown;
  category?: unknown;
  priority?: unknown;
}
interface RawDay {
  key?: unknown;
  theme?: unknown;
  blocks?: unknown;
}
interface RawPlan {
  weekTheme?: unknown;
  topPriorities?: unknown;
  keyHabits?: unknown;
  days?: unknown;
  workouts?: unknown;
  grocery?: unknown;
  finances?: unknown;
  outreach?: unknown;
  reflections?: unknown;
  warnings?: unknown;
}

const VALID_CATEGORIES: PlanBlock["category"][] = [
  "work", "fitness", "fuel", "project", "money", "rest", "personal", "admin",
];
const VALID_GROCERY_CATS: GroceryItem["category"][] = [
  "protein", "carbs", "produce", "dairy", "pantry", "snack", "other",
];

function str(v: unknown, max = 200): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s ? s.slice(0, max) : undefined;
}
function strArr(v: unknown, maxEach = 200, maxLen = 20): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim().slice(0, maxEach))
    .filter(Boolean)
    .slice(0, maxLen);
}
function numVal(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function normalizeBlock(raw: RawBlock): PlanBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const start = typeof raw.start === "string" ? raw.start.trim().slice(0, 5) : "";
  const end = typeof raw.end === "string" ? raw.end.trim().slice(0, 5) : "";
  const label = str(raw.label, 200);
  if (!start || !end || !label) return null;
  const cat = typeof raw.category === "string" ? raw.category.toLowerCase() : "personal";
  const category = (VALID_CATEGORIES as string[]).includes(cat)
    ? (cat as PlanBlock["category"])
    : "personal";
  const pRaw = numVal(raw.priority) ?? 3;
  const priority = (pRaw === 1 || pRaw === 2 || pRaw === 3 ? pRaw : 3) as 1 | 2 | 3;
  return { start, end, label, category, priority };
}

function normalizeDay(raw: RawDay, fallbackKey: DayKey): PlanDay {
  const keyRaw = typeof raw?.key === "string" ? raw.key.toLowerCase() : "";
  const key = (DAY_KEYS as readonly string[]).includes(keyRaw)
    ? (keyRaw as DayKey)
    : fallbackKey;
  const theme = str(raw?.theme, 120);
  const blocksArr = Array.isArray(raw?.blocks) ? (raw.blocks as RawBlock[]) : [];
  const blocks = blocksArr
    .map(normalizeBlock)
    .filter((b): b is PlanBlock => b !== null)
    .slice(0, 16);
  return { key, theme, blocks };
}

function normalizeWorkout(raw: unknown): WorkoutSession | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const dayRaw = typeof r.day === "string" ? r.day.toLowerCase() : "";
  if (!(DAY_KEYS as readonly string[]).includes(dayRaw)) return null;
  const name = str(r.name, 80);
  const focus = str(r.focus, 120);
  if (!name || !focus) return null;
  const lifts = strArr(r.lifts, 100, 14);
  return {
    day: dayRaw as DayKey,
    name,
    focus,
    lifts,
    cardio: str(r.cardio, 120),
    durationMin: numVal(r.durationMin),
  };
}

function normalizeGrocery(raw: unknown): GroceryList | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const rawItems = Array.isArray(r.items) ? r.items : [];
  const items: GroceryItem[] = rawItems
    .map((it): GroceryItem | null => {
      if (!it || typeof it !== "object") return null;
      const x = it as Record<string, unknown>;
      const name = str(x.name, 80);
      const qty = str(x.qty, 40);
      if (!name || !qty) return null;
      const c = typeof x.category === "string" ? x.category.toLowerCase() : "other";
      const category = (VALID_GROCERY_CATS as string[]).includes(c)
        ? (c as GroceryItem["category"])
        : "other";
      return { name, qty, category };
    })
    .filter((x): x is GroceryItem => x !== null)
    .slice(0, 40);
  if (items.length === 0) return undefined;
  return {
    items,
    estimatedBudgetEUR: numVal(r.estimatedBudgetEUR),
    note: str(r.note, 300),
  };
}

function normalizeFinances(raw: unknown): FinanceSnapshot | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const out: FinanceSnapshot = {
    monthlyIncomeEUR: numVal(r.monthlyIncomeEUR),
    fixedExpensesEUR: numVal(r.fixedExpensesEUR),
    foodBudgetEUR: numVal(r.foodBudgetEUR),
    debtPaymentEUR: numVal(r.debtPaymentEUR),
    savingsEUR: numVal(r.savingsEUR),
    bufferEUR: numVal(r.bufferEUR),
    notes: strArr(r.notes, 240, 6),
  };
  const hasAny =
    out.monthlyIncomeEUR !== undefined ||
    out.fixedExpensesEUR !== undefined ||
    out.foodBudgetEUR !== undefined ||
    out.debtPaymentEUR !== undefined ||
    out.savingsEUR !== undefined ||
    out.bufferEUR !== undefined ||
    (out.notes && out.notes.length > 0);
  return hasAny ? out : undefined;
}

function normalizeOutreach(raw: unknown): OutreachGoals | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const out: OutreachGoals = {
    dms: numVal(r.dms),
    posts: numVal(r.posts),
    followUps: numVal(r.followUps),
    focus: str(r.focus, 240),
    contentIdeas: strArr(r.contentIdeas, 220, 8),
  };
  const hasAny =
    out.dms !== undefined ||
    out.posts !== undefined ||
    out.followUps !== undefined ||
    out.focus !== undefined ||
    (out.contentIdeas && out.contentIdeas.length > 0);
  return hasAny ? out : undefined;
}

function normalizePlan(raw: RawPlan, weekStartIso: string): WeeklyPlanData {
  const theme = str(raw?.weekTheme, 160) ?? "Your week";
  const priorities = strArr(raw?.topPriorities, 220, 6);
  const keyHabits = strArr(raw?.keyHabits, 160, 10);
  const daysRaw = Array.isArray(raw?.days) ? (raw.days as RawDay[]) : [];

  const byKey = new Map<DayKey, PlanDay>();
  daysRaw.forEach((d, i) => {
    const fallback = DAY_KEYS[i] ?? "monday";
    const day = normalizeDay(d, fallback);
    byKey.set(day.key, day);
  });
  const days: PlanDay[] = DAY_KEYS.map((k) => byKey.get(k) ?? { key: k, blocks: [] });

  const workoutsRaw = Array.isArray(raw?.workouts) ? raw.workouts : [];
  const workouts = workoutsRaw
    .map(normalizeWorkout)
    .filter((w): w is WorkoutSession => w !== null)
    .slice(0, 8);

  const warnings = strArr(raw?.warnings, 220, 8);

  return {
    weekStart: weekStartIso,
    weekTheme: theme,
    topPriorities: priorities,
    keyHabits,
    days,
    workouts: workouts.length > 0 ? workouts : undefined,
    grocery: normalizeGrocery(raw?.grocery),
    finances: normalizeFinances(raw?.finances),
    outreach: normalizeOutreach(raw?.outreach),
    reflections: strArr(raw?.reflections, 240, 8),
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

function profileToPrompt(profile: LifeOsData, weekStartIso: string): string {
  return [
    `Week starting: ${weekStartIso} (Monday)`,
    "",
    "LIFE OS PROFILE (JSON):",
    JSON.stringify(profile, null, 2),
    "",
    "Generate the week now as one JSON object only.",
  ].join("\n");
}

/**
 * Strip anything outside the outermost {...} — some models prepend "```json" or trailing text
 * even when asked for raw JSON. Makes parsing resilient without changing intent.
 */
function extractJson(text: string): string {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return text;
  return text.slice(first, last + 1);
}

async function callModel(model: string, profile: LifeOsData, weekStartIso: string): Promise<RawPlan> {
  const client = getOpenRouterClient();
  const res = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: profileToPrompt(profile, weekStartIso) },
    ],
    temperature: 0.3,
    max_tokens: 8000,
    response_format: { type: "json_object" },
  });
  const text = res.choices[0]?.message?.content ?? "{}";
  return JSON.parse(extractJson(text)) as RawPlan;
}

export async function generateWeeklyPlan(
  profile: LifeOsData,
  weekStart: Date,
): Promise<WeeklyPlanData> {
  const weekStartIso = weekStart.toISOString().slice(0, 10);
  let lastErr: unknown = null;
  for (const model of [PRIMARY_MODEL, FALLBACK_MODEL]) {
    try {
      const raw = await callModel(model, profile, weekStartIso);
      const normalized = normalizePlan(raw, weekStartIso);
      // Basic sanity: if we got zero blocks across all days, treat as failure and retry.
      const totalBlocks = normalized.days.reduce((n, d) => n + d.blocks.length, 0);
      if (totalBlocks === 0) {
        lastErr = new Error("Planner returned no schedule blocks.");
        continue;
      }
      return normalized;
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Weekly planner failed.");
}

/** Monday 00:00 UTC of the given date's ISO week. */
export function mondayOfWeekUTC(d: Date = new Date()): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = x.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  x.setUTCDate(x.getUTCDate() + diff);
  return x;
}
