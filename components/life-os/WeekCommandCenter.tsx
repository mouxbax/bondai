"use client";

import * as React from "react";
import {
  Sparkles,
  AlertTriangle,
  Dumbbell,
  ShoppingCart,
  Wallet,
  Send,
  Target,
  Flame,
  Lightbulb,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WeeklyPlanView } from "@/components/life-os/WeeklyPlanView";
import type {
  WeeklyPlanData,
  GroceryItem,
} from "@/lib/life-os/types";
import { DAY_KEYS } from "@/lib/life-os/types";

const DAY_LABEL: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const GROCERY_CAT_LABEL: Record<GroceryItem["category"], string> = {
  protein: "Protein",
  carbs: "Carbs",
  produce: "Produce",
  dairy: "Dairy",
  pantry: "Pantry",
  snack: "Snacks",
  other: "Other",
};

function fmtEUR(n: number | undefined): string {
  if (n === undefined) return "—";
  return `${Math.round(n).toLocaleString()}€`;
}

/**
 * Rich "This week" dashboard — renders the whole WeeklyPlanData as a
 * command center: theme, priorities, habits, schedule, workouts, grocery,
 * finances, outreach, and reflection prompts.
 */
export function WeekCommandCenter({
  plan,
  onRegenerate,
  regenerating,
}: {
  plan: WeeklyPlanData;
  onRegenerate?: () => void;
  regenerating?: boolean;
}) {
  const weekRange = React.useMemo(() => {
    const start = new Date(plan.weekStart);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${fmt(start)} – ${fmt(end)}`;
  }, [plan.weekStart]);

  const grocery = plan.grocery;
  const groceryByCat = React.useMemo(() => {
    if (!grocery) return null;
    const out = new Map<GroceryItem["category"], GroceryItem[]>();
    for (const it of grocery.items) {
      const list = out.get(it.category) ?? [];
      list.push(it);
      out.set(it.category, list);
    }
    return out;
  }, [grocery]);

  return (
    <div className="space-y-6">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <Card className="border-emerald-200/60 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/60 to-transparent dark:from-emerald-950/20">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-stone-500">{weekRange}</div>
              <CardTitle className="text-lg flex items-center gap-2 mt-1">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="truncate">{plan.weekTheme}</span>
              </CardTitle>
            </div>
            {onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                disabled={regenerating}
                className="rounded-xl shrink-0"
              >
                {regenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Regenerate</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {plan.topPriorities.length > 0 && (
            <div>
              <SectionTitle icon={<Target className="h-4 w-4" />}>Top priorities</SectionTitle>
              <ol className="space-y-1 text-sm list-decimal list-inside">
                {plan.topPriorities.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ol>
            </div>
          )}
          {plan.keyHabits && plan.keyHabits.length > 0 && (
            <div>
              <SectionTitle icon={<Flame className="h-4 w-4" />}>Daily habits</SectionTitle>
              <ul className="space-y-1 text-sm">
                {plan.keyHabits.map((h, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-emerald-600 shrink-0">◇</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {plan.warnings && plan.warnings.length > 0 && (
            <div className="md:col-span-2 space-y-1 pt-2 border-t border-stone-200 dark:border-stone-800">
              {plan.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Schedule ────────────────────────────────────────── */}
      <section>
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-stone-500">
          Weekly schedule
        </h3>
        <WeeklyPlanView plan={plan} />
      </section>

      {/* ─── Workouts + Finances row ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {plan.workouts && plan.workouts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-rose-500" />
                Workouts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {DAY_KEYS.flatMap((dk) => plan.workouts!.filter((w) => w.day === dk)).map(
                (w, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-stone-200 dark:border-stone-800 p-3"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {DAY_LABEL[w.day]}
                        </Badge>
                        <span className="font-medium text-sm">{w.name}</span>
                      </div>
                      {w.durationMin && (
                        <span className="text-xs text-stone-500">{w.durationMin}min</span>
                      )}
                    </div>
                    <div className="text-xs text-stone-500 mb-2">{w.focus}</div>
                    {w.lifts.length > 0 && (
                      <ul className="space-y-0.5 text-sm">
                        {w.lifts.map((l, j) => (
                          <li key={j} className="font-mono text-xs">
                            • {l}
                          </li>
                        ))}
                      </ul>
                    )}
                    {w.cardio && (
                      <div className="mt-2 text-xs text-stone-500">
                        <span className="font-medium">Cardio:</span> {w.cardio}
                      </div>
                    )}
                  </div>
                ),
              )}
            </CardContent>
          </Card>
        )}

        {plan.finances && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4 text-yellow-600" />
                Finances this month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Income" value={fmtEUR(plan.finances.monthlyIncomeEUR)} tone="good" />
                <Stat label="Fixed" value={fmtEUR(plan.finances.fixedExpensesEUR)} />
                <Stat label="Food" value={fmtEUR(plan.finances.foodBudgetEUR)} />
                <Stat label="Debt payment" value={fmtEUR(plan.finances.debtPaymentEUR)} tone="warn" />
                <Stat label="Savings" value={fmtEUR(plan.finances.savingsEUR)} tone="good" />
                <Stat label="Buffer" value={fmtEUR(plan.finances.bufferEUR)} />
              </div>
              {plan.finances.notes && plan.finances.notes.length > 0 && (
                <ul className="mt-4 space-y-1 text-sm border-t border-stone-200 dark:border-stone-800 pt-3">
                  {plan.finances.notes.map((n, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-yellow-600">◦</span>
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─── Grocery ─────────────────────────────────────────── */}
      {grocery && groceryByCat && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-amber-600" />
                Grocery list
              </CardTitle>
              {grocery.estimatedBudgetEUR !== undefined && (
                <Badge variant="secondary">~{fmtEUR(grocery.estimatedBudgetEUR)}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(
                [
                  "protein",
                  "carbs",
                  "produce",
                  "dairy",
                  "pantry",
                  "snack",
                  "other",
                ] as const
              )
                .filter((c) => (groceryByCat.get(c)?.length ?? 0) > 0)
                .map((c) => (
                  <div key={c}>
                    <div className="text-xs uppercase tracking-wide text-stone-500 mb-1.5">
                      {GROCERY_CAT_LABEL[c]}
                    </div>
                    <ul className="space-y-1 text-sm">
                      {groceryByCat.get(c)!.map((it, i) => (
                        <li key={i} className="flex justify-between gap-2">
                          <span>{it.name}</span>
                          <span className="text-stone-500 text-xs font-mono shrink-0">{it.qty}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
            {grocery.note && (
              <p className="mt-4 text-xs text-stone-500 italic">{grocery.note}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Outreach ────────────────────────────────────────── */}
      {plan.outreach && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-600" />
              Income & outreach
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <Stat label="DMs" value={plan.outreach.dms ?? "—"} />
              <Stat label="Posts" value={plan.outreach.posts ?? "—"} />
              <Stat label="Follow-ups" value={plan.outreach.followUps ?? "—"} />
            </div>
            {plan.outreach.focus && (
              <div className="text-sm">
                <span className="text-xs uppercase tracking-wide text-stone-500">Focus:</span>{" "}
                {plan.outreach.focus}
              </div>
            )}
            {plan.outreach.contentIdeas && plan.outreach.contentIdeas.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wide text-stone-500 mb-1.5 flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5" /> Content ideas
                </div>
                <ul className="space-y-1 text-sm">
                  {plan.outreach.contentIdeas.map((c, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-blue-600">→</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Reflections ─────────────────────────────────────── */}
      {plan.reflections && plan.reflections.length > 0 && (
        <Card className="bg-stone-50 dark:bg-stone-900/40">
          <CardHeader>
            <CardTitle className="text-base">Sunday review prompts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {plan.reflections.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-stone-400">?</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="text-xs uppercase tracking-wide text-stone-500 mb-2 flex items-center gap-1.5">
      {icon}
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "good" | "warn";
}) {
  const color =
    tone === "good"
      ? "text-emerald-700 dark:text-emerald-400"
      : tone === "warn"
        ? "text-amber-700 dark:text-amber-400"
        : "text-stone-800 dark:text-stone-200";
  return (
    <div className="rounded-lg border border-stone-200 dark:border-stone-800 p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-stone-500">{label}</div>
      <div className={`text-base font-medium mt-0.5 ${color}`}>{value}</div>
    </div>
  );
}
